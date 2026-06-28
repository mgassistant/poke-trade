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
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content: `You are a Pokémon TCG card identification expert. This image shows a binder page with multiple Pokémon cards arranged in a grid (typically 3x3 or 2x2).

Identify EACH visible card separately. Return a JSON array:
[
  {
    "card_name": "exact card name",
    "set_name": "TCG set name",
    "card_number": "card number if visible",
    "rarity": "rarity if identifiable",
    "confidence": "high" | "medium" | "low",
    "condition_estimate": "near_mint",
    "condition_notes": "brief notes",
    "position": { "row": 1, "col": 1 }
  },
  ...
]

- Number cards left to right, top to bottom
- Include ALL visible cards, even partially visible ones
- If a slot is empty, skip it
- Use "low" confidence for partially visible cards
- Be precise with names and sets`,
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" } },
          { type: "text", text: "Identify all Pokémon cards visible on this binder page." },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() || "";
  const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const cards: CardIdentification[] = JSON.parse(jsonStr);

  // Match each card in DB
  const results = [];
  for (const card of cards) {
    const matches = await findMatches(card, supabase);
    results.push({
      recognized: true,
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
