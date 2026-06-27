import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/cards/scan/recognize — AI-powered card recognition from photo
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { image } = body; // base64 data URL

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required (base64 data URL)" }, { status: 400 });
  }

  // Strip data URL prefix if present, keep just the base64
  const base64 = image.includes(",") ? image.split(",")[1] : image;
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  try {
    // Step 1: Send image to GPT-4o for card recognition
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a Pokémon TCG card identification expert. Given a photo of a Pokémon card, identify it precisely.

Return ONLY a JSON object with these fields:
{
  "card_name": "exact card name as printed (e.g. 'Pikachu VMAX', 'Charizard ex')",
  "set_name": "the TCG set name (e.g. 'Vivid Voltage', 'Obsidian Flames', 'Paldea Evolved')",
  "card_number": "the card number if visible (e.g. '044/185', '006')",
  "rarity": "the rarity if identifiable (e.g. 'Rare Holo', 'Ultra Rare', 'Secret Rare')",
  "confidence": "high" | "medium" | "low",
  "condition_estimate": "gem_mint" | "mint" | "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged",
  "condition_notes": "brief notes on visible wear, centering, whitening, etc."
}

If you cannot identify the card, return:
{ "error": "Could not identify card", "confidence": "none" }

Be precise with names. Do not guess wildly. If the image is blurry or not a Pokémon card, say so.`,
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

    if (parsed.error) {
      return NextResponse.json({ recognized: false, message: parsed.error });
    }

    // Step 2: Search our database for matching cards
    const svc = await createServiceClient();
    const cardName = parsed.card_name || "";
    const setName = parsed.set_name || "";
    const cardNumber = parsed.card_number?.replace(/\/.*/, "").replace(/^0+/, "") || "";

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
        const { data } = await svc
          .from("cards")
          .select("id, name, number, rarity, card_type, image_url, market_value, set_id, card_sets(id, name, series, symbol_url)")
          .in("set_id", sets.map(s => s.id))
          .eq("number", cardNumber)
          .limit(5);
        if (data && data.length > 0) matches = data;
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
  } catch (err: any) {
    console.error("Card recognition error:", err);
    return NextResponse.json(
      { error: err.message || "Recognition failed" },
      { status: 500 }
    );
  }
}
