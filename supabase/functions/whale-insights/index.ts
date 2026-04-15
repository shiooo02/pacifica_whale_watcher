import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { whaleEvents, momentum, volatility, symbol } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a concise market snapshot for the LLM
    const longCount = whaleEvents.filter((e: any) => e.trade.side === "long").length;
    const shortCount = whaleEvents.filter((e: any) => e.trade.side === "short").length;
    const totalUsd = whaleEvents.reduce((s: number, e: any) => s + (e.trade.sizeUsd || 0), 0);
    const avgScore = whaleEvents.length > 0
      ? (whaleEvents.reduce((s: number, e: any) => s + e.score, 0) / whaleEvents.length).toFixed(1)
      : "0";
    const labels = [...new Set(whaleEvents.map((e: any) => e.label))].join(", ");
    const hasLiquidations = whaleEvents.some((e: any) => e.trade.isLiquidation);
    const highScoreCount = whaleEvents.filter((e: any) => e.score > 70).length;

    const snapshot = `
Symbol: ${symbol}
Recent whale events: ${whaleEvents.length}
Long whales: ${longCount} | Short whales: ${shortCount}
Total whale volume: $${(totalUsd / 1000).toFixed(0)}K
Avg whale score: ${avgScore}/100
High-conviction entries (score>70): ${highScoreCount}
Detected patterns: ${labels || "None"}
Liquidations present: ${hasLiquidations ? "Yes" : "No"}
Market momentum: ${momentum > 0 ? "+" : ""}${momentum.toFixed(3)} (-1 to 1 scale)
Market volatility: ${(volatility * 100).toFixed(1)}%
`.trim();

    const systemPrompt = `You are an elite crypto whale analyst for Pacifica DEX on Solana.
You receive real-time whale activity snapshots and produce a single, concise market insight.

Rules:
- Write exactly ONE sentence (max 30 words)
- Be specific about what whales are doing and what it means
- Use trading jargon naturally: accumulation, distribution, squeeze, absorption, capitulation, stealth entries
- Never say "based on the data" or "it appears" — be direct and confident
- Sound like an insider tip from a whale desk, not a textbook
- If data is minimal, note the quiet and what it could mean`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Whale activity snapshot:\n${snapshot}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const insight = result.choices?.[0]?.message?.content?.trim() || "Monitoring whale activity...";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whale-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
