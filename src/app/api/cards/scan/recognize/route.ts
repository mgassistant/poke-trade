import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { checkRateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { safeError, errors } from "@/lib/safe-error";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Per-user daily scan cap (in-memory, resets on deploy)
const dailyScans = new Map<string, { count: number; date: string }>();
const DAILY_SCAN_LIMITS: Record<string, number> = { free: 50, pro: 200, elite: 500 };

// POST /api/cards/scan/recognize — AI-powered card recognition from photo
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errors.unauthorized();

  // Rate limit: 10 scans/min per user
  const ip = getClientIp(request.headers);
  const rlKey = rateLimitKey(ip, user.id);
  const rl = checkRateLimit(rlKey, "api");
  if (!rl.allowed) return errors.rateLimited(rl.retryAfterSeconds);

  // Daily cap check
  const today = new Date().toISOString().slice(0, 10);
  const userDaily = dailyScans.get(user.id);
  if (userDaily && userDaily.date === today) {
    // Get user tier for limit
    const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single();
    const tier = profile?.subscription_tier || "free";
    const limit = DAILY_SCAN_LIMITS[tier] || 50;
    if (userDaily.count >= limit) {
      return errors.quotaExceeded(`You've reached your daily scan limit (${limit} scans). Upgrade for more.`);
    }
    userDaily.count++;
  } else {
    dailyScans.set(user.id, { count: 1, date: today });
  }

  const body = await request.json();
  const { image } = body; // base64 data URL

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required (base64 data URL)" }, { status: 400 });
  }

  // Strip data URL prefix if present, keep just the base64
  const base64 = image.includes(",") ? image.split(",")[1] : image;
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  // Validate image size (max 4MB base64 = ~3MB actual image)
  if (base64.length > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large. Please use a smaller image (max 3MB)." }, { status: 400 });
  }

  try {
    // Step 1: Send image to GPT-4o for card recognition
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a Pokémon TCG card identification expert. Given a photo of a Pokémon card, identify it precisely.

Return ONLY a JSON object with these fields:
{
  "card_name": "exact card name as printed on the card (e.g. 'Pikachu VMAX', 'Charizard ex')",
  "set_name": "the TCG set name printed at the bottom of the card (e.g. 'Vivid Voltage', 'Obsidian Flames')",
  "card_number": "the card number as printed (e.g. '044/185', '6/102', 'TG30/TG30')",
  "rarity": "the rarity symbol or text (e.g. 'Rare Holo', 'Ultra Rare', 'Common')",
  "confidence": "high" | "medium" | "low",
  "condition_estimate": "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged",
  "condition_notes": "brief notes on visible wear, centering, whitening, etc."
}

CRITICAL IDENTIFICATION RULES:
1. **CARD NUMBER (most important)**: Look at the BOTTOM-LEFT corner. You will see a number like "044/185" or "6/102" or "SV065/SV121". This is the card number. READ IT EXACTLY as printed, including leading zeros.
2. **CARD NAME**: Read from the top of the card.
3. **SET CODE**: Look at the bottom-left area near the card number. You may see a 2-4 letter code like "SV", "SWSH", "SM", "XY", "BST", "EVS", "CRZ", "PAL", "MEW", "OBF", "PAR", "PAF", "TEF", "TWM", "SFA", "SCR", "SSP", "PEV". This is the set code.
4. **SET NAME**: Identify the set from the code OR the set symbol icon. Common sets:
   - SV = Scarlet & Violet base
   - PAL = Paldea Evolved  
   - OBF = Obsidian Flames
   - MEW = 151
   - PAR = Paradox Rift
   - PAF = Paldean Fates
   - TEF = Temporal Forces
   - TWM = Twilight Masquerade
   - SFA = Shrouded Fable
   - SCR = Stellar Crown
   - SSP = Surging Sparks
   - PEV = Prismatic Evolutions
   - EVS = Evolving Skies
   - BST = Brilliant Stars
   - LOR = Lost Origin
   - SIT = Silver Tempest
   - CRZ = Crown Zenith

**CONFIDENCE GUIDELINES:**
- "high": Card number is clearly visible and readable in bottom-left corner
- "medium": Card number is partially visible or image is slightly blurry
- "low": Card number is not visible, image is very blurry, or card is obscured

**IF YOU CANNOT READ THE CARD NUMBER FROM THE BOTTOM-LEFT CORNER:**
Return: { "error": "Cannot read card number", "confidence": "none" }

Do NOT guess or make up card numbers. The bottom-left corner number is the ground truth.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Identify this Pokémon card. Return the JSON identification.",
            },
          ],
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "";

    // Parse the JSON from the response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        error: "Could not parse AI response",
        raw: responseText,
      }, { status: 500 });
    }

    if (parsed.error || parsed.confidence === "none") {
      return NextResponse.json({ recognized: false, message: parsed.error || "Could not identify card" });
    }

    // Reject low-confidence results without a card number
    if (parsed.confidence === "low" && !parsed.card_number) {
      return NextResponse.json({ 
        recognized: false, 
        message: "Card number not visible. Please take a clearer photo with the bottom-left corner in focus.",
        ai: parsed
      });
    }

    // Step 2: Search our database for matching cards
    const svc = await createServiceClient();
    const cardName = parsed.card_name || "";
    const setName = parsed.set_name || "";
    // Normalize card number — handle both "044/185" and "44" formats
    const rawNumber = parsed.card_number || "";
    const cardNumberWithZeros = rawNumber.replace(/\/.*/, "").trim(); // "044"
    const cardNumberNoZeros = cardNumberWithZeros.replace(/^0+/, ""); // "44"
    const cardNumber = cardNumberNoZeros;

    // Try exact-ish match first: name + set + number
    let matches: any[] = [];

    // Strategy 1: Match by card number + set (most precise)
    if (cardNumber && setName) {
      const { data: sets } = await svc
        .from("card_sets")
        .select("id")
        .ilike("name", `%${setName}%`)
        .limit(5);

      if (sets && sets.length > 0) {
        const setIds = sets.map(s => s.id);
        // Try without leading zeros first (most common DB format)
        let { data } = await svc
          .from("cards")
          .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
          .in("set_id", setIds)
          .eq("number", cardNumber)
          .limit(5);
        // If no match, try with leading zeros
        if ((!data || data.length === 0) && cardNumberWithZeros !== cardNumber) {
          const retry = await svc
            .from("cards")
            .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
            .in("set_id", setIds)
            .eq("number", cardNumberWithZeros)
            .limit(5);
          data = retry.data;
        }
        if (data && data.length > 0) matches = data;
      }
    }

    // Strategy 1b: card number + name (no set match needed)
    if (matches.length === 0 && cardNumber && cardName) {
      const words = cardName.split(/\s+/).filter(Boolean).slice(0, 2);
      // Try exact number match first (avoids .or() issues with special chars)
      let { data } = await svc
        .from("cards")
        .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
        .eq("number", cardNumber)
        .limit(20);
      // Try with leading zeros
      if ((!data || data.length === 0) && cardNumberWithZeros !== cardNumber) {
        const retry = await svc
          .from("cards")
          .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
          .eq("number", cardNumberWithZeros)
          .limit(20);
        data = retry.data;
      }
      // Filter by name words if we got results
      if (data && data.length > 0) {
        const nameFiltered = data.filter((d: any) => {
          const dName = (d.name || "").toLowerCase();
          return words.every(w => w.length < 2 || dName.includes(w.toLowerCase()));
        });
        matches = nameFiltered.length > 0 ? nameFiltered : data;
      }
    }

    // Strategy 2: Fuzzy name match
    if (matches.length === 0 && cardName) {
      const words = cardName.split(/\s+/).filter(Boolean).slice(0, 4);
      let query = svc
        .from("cards")
        .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
        .limit(10);

      for (const word of words) {
        if (word.length >= 2) {
          query = query.ilike("name", `%${word}%`);
        }
      }

      const { data } = await query;
      if (data && data.length > 0) matches = data;
    }

    // Strategy 3: First word only (broadest)
    if (matches.length === 0 && cardName) {
      const firstWord = cardName.split(/\s+/)[0];
      if (firstWord && firstWord.length >= 2) {
        const { data } = await svc
          .from("cards")
          .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
          .ilike("name", `%${firstWord}%`)
          .order("market_value", { ascending: false, nullsFirst: false })
          .limit(10);
        if (data) matches = data;
      }
    }

    return NextResponse.json({
      recognized: true,
      ai: {
        card_name: parsed.card_name,
        set_name: parsed.set_name,
        card_number: parsed.card_number,
        rarity: parsed.rarity,
        confidence: parsed.confidence,
        condition_estimate: parsed.condition_estimate,
        condition_notes: parsed.condition_notes,
      },
      matches,
      match_count: matches.length,
    });
  } catch (err) {
    return safeError(err, "Card recognition failed. Please try again.", { code: "AI_ERROR", status: 502 });
  }
}
