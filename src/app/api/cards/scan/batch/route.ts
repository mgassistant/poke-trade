import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { checkRateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { safeError, errors } from "@/lib/safe-error";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CardIdentification {
  card_name: string;
  set_name: string;
  card_number: string;
  rarity: string;
  confidence: string;
  condition_estimate: string;
  condition_notes: string;
  position?: { x: number; y: number; w: number; h: number };
}

// POST /api/cards/scan/batch — Process multiple card images or a binder page
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 5 batch requests/min
  const ip = getClientIp(request.headers);
  const rlKey = rateLimitKey(ip, user.id);
  const rl = checkRateLimit(rlKey, "checkout"); // 3/min tier
  if (!rl.allowed) return errors.rateLimited(rl.retryAfterSeconds);

  const body = await request.json();
  const { images, mode } = body as {
    images: string[]; // array of base64 data URLs
    mode: "single" | "batch" | "binder"; // scanning mode
  };

  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
  }

  if (images.length > 50) {
    return NextResponse.json({ error: "Maximum 50 images per batch" }, { status: 400 });
  }

  try {
    if (mode === "binder") {
      // Binder page mode: single image with multiple cards
      return await processBinder(images[0], supabase);
    }

    // Batch mode: multiple images, each with one card
    const results = [];
    for (const image of images) {
      const result = await processSingleCard(image, supabase);
      results.push(result);
    }

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    return safeError(err, "Batch scan failed. Please try again.", { code: "AI_ERROR", status: 502 });
  }
}

async function processSingleCard(image: string, supabase: any) {
  const base64 = image.includes(",") ? image.split(",")[1] : image;
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a Pokémon TCG card identification expert. Identify the card in this photo.
Return ONLY a JSON object:
{
  "card_name": "exact card name",
  "set_name": "TCG set name",
  "card_number": "card number if visible",
  "rarity": "rarity if identifiable",
  "confidence": "high" | "medium" | "low",
  "condition_estimate": "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged",
  "condition_notes": "brief condition notes"
}
If not identifiable: { "error": "reason", "confidence": "none" }`,
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" } },
            { type: "text", text: "Identify this Pokémon card." },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.error) {
      return { recognized: false, error: parsed.error, matches: [] };
    }

    // Match in DB
    const matches = await findMatches(parsed, supabase);

    return {
      recognized: true,
      ai: parsed,
      matches,
      match_count: matches.length,
    };
  } catch (err: any) {
    return { recognized: false, error: err.message || "Recognition failed", matches: [] };
  }
}

async function processBinder(image: string, supabase: any) {
  const base64 = image.includes(",") ? image.split(",")[1] : image;
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    messages: [
      {
        role: "system",
        content: `You are a Pokémon TCG card scanner analyzing a binder page with 9 cards in a 3×3 grid.

**CRITICAL INSTRUCTIONS:**
1. Look at the BOTTOM-LEFT corner of EACH card for the card number (e.g., "044/185", "6/102", "SV065/SV121")
2. Read the card NAME from the top of each card
3. Identify cards in LEFT-TO-RIGHT, TOP-TO-BOTTOM order:
   - Row 1: positions 1, 2, 3 (top row, left to right)
   - Row 2: positions 4, 5, 6 (middle row, left to right)  
   - Row 3: positions 7, 8, 9 (bottom row, left to right)

**RETURN A JSON ARRAY WITH EXACTLY 9 OBJECTS (one per position):**
[
  {
    "position": { "row": 1, "col": 1, "number": 1 },
    "card_name": "Pikachu VMAX",
    "card_number": "044/185",
    "set_code": "SV" or "SWSH" or "PAL" etc (if visible),
    "set_name": "Vivid Voltage" (identify from set code or symbol),
    "confidence": "high" (if number clearly visible) | "medium" (partial) | "low" (obscured) | "empty" (no card)
  },
  ...
]

**SET CODE REFERENCE:**
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
- CRZ = Crown Zenith

**RULES:**
- If a position is empty or card is face-down: { "position": {...}, "confidence": "empty" }
- Do NOT guess card numbers — read them from bottom-left corner
- Use "high" confidence ONLY if card number is clearly readable
- Use "low" confidence if card is blurry, angled, or number not visible
- Return ALL 9 positions in order (1-9)`,
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" } },
          { type: "text", text: "Scan this 3×3 binder page and identify all 9 card positions. Focus on reading the card numbers from the bottom-left corner of each card." },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() || "";
  const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const cards: CardIdentification[] = JSON.parse(jsonStr);

  // Validate: should be exactly 9 positions
  if (cards.length !== 9) {
    // If AI returned fewer cards, pad with empty positions
    while (cards.length < 9) {
      cards.push({
        card_name: "",
        set_name: "",
        card_number: "",
        rarity: "",
        confidence: "empty",
        condition_estimate: "near_mint",
        condition_notes: "Empty position",
        position: { row: Math.floor(cards.length / 3) + 1, col: (cards.length % 3) + 1 } as any,
      });
    }
  }

  // Match each card in DB
  const results = [];
  for (const card of cards) {
    // Skip empty positions
    if (card.confidence === "empty" || !card.card_name) {
      results.push({
        recognized: false,
        ai: card,
        matches: [],
        match_count: 0,
        empty: true,
      });
      continue;
    }

    // Reject low-confidence cards without card numbers (same gating as single scan)
    if (card.confidence === "low" && !card.card_number) {
      results.push({
        recognized: false,
        ai: card,
        matches: [],
        match_count: 0,
        error: "Card number not readable at this position",
      });
      continue;
    }

    const matches = await findMatches(card, supabase);
    results.push({
      recognized: matches.length > 0,
      ai: card,
      matches,
      match_count: matches.length,
    });
  }

  return NextResponse.json({
    mode: "binder",
    results,
    total: results.length,
  });
}

async function findMatches(parsed: CardIdentification, supabase: any) {
  const cardName = parsed.card_name || "";
  const setName = parsed.set_name || "";
  const rawNumber = parsed.card_number || "";
  const cardNumberWithZeros = rawNumber.replace(/\/.*/, "").trim();
  const cardNumber = cardNumberWithZeros.replace(/^0+/, "") || cardNumberWithZeros;

  // Strategy 1: number + set
  if (cardNumber && setName) {
    const { data: sets } = await supabase
      .from("card_sets")
      .select("id")
      .ilike("name", `%${setName}%`)
      .limit(5);

    if (sets?.length > 0) {
      const setIds = sets.map((s: any) => s.id);
      let { data } = await supabase
        .from("cards")
        .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
        .in("set_id", setIds)
        .eq("number", cardNumber)
        .limit(5);
      if ((!data || data.length === 0) && cardNumberWithZeros !== cardNumber) {
        const retry = await supabase
          .from("cards")
          .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
          .in("set_id", setIds)
          .eq("number", cardNumberWithZeros)
          .limit(5);
        data = retry.data;
      }
      if (data?.length > 0) return data;
    }
  }

  // Strategy 2: fuzzy name
  if (cardName) {
    const words = cardName.split(/\s+/).filter(Boolean).slice(0, 4);
    let query = supabase
      .from("cards")
      .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
      .limit(10);

    for (const word of words) {
      if (word.length >= 2) query = query.ilike("name", `%${word}%`);
    }

    const { data } = await query;
    if (data?.length > 0) return data;
  }

  // Strategy 3: first word
  if (cardName) {
    const firstWord = cardName.split(/\s+/)[0];
    if (firstWord?.length >= 2) {
      const { data } = await supabase
        .from("cards")
        .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
        .ilike("name", `%${firstWord}%`)
        .order("market_value", { ascending: false, nullsFirst: false })
        .limit(10);
      if (data) return data;
    }
  }

  return [];
}
