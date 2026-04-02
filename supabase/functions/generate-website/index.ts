import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI website builder, similar to Lovable. You create complete, production-quality websites.

When the user asks you to build a website, you MUST respond with TWO parts separated by exactly this marker: |||CODE_START|||

PART 1 (before the marker): A conversational response explaining what you built, features included, tech choices, etc. Use bullet points with ✅ emoji. Be enthusiastic and detailed.

PART 2 (after the marker): A JSON object with this exact structure:
{
  "files": [
    { "name": "filename.ext", "language": "html|css|javascript|typescript|jsx|tsx|json", "content": "full file content" }
  ],
  "previewHtml": "A COMPLETE standalone HTML document that previews the website. This must be a full <!DOCTYPE html> page with ALL styles inlined and ALL JavaScript included. Make it look stunning."
}

CRITICAL RULES:
1. The previewHtml MUST be a complete, self-contained HTML document with inlined CSS and JS. It should look professional and polished.
2. Create multiple files showing proper project structure (index.html, styles, scripts, config files).
3. Use modern design: dark themes, gradients, smooth animations, glassmorphism, proper spacing.
4. For React/Vite projects, include: vite.config.ts, package.json, tsconfig.json, src/App.tsx, src/main.tsx, src/index.css, etc.
5. Make designs responsive and accessible.
6. Include realistic content, not lorem ipsum.
7. Use modern CSS: CSS Grid, Flexbox, CSS variables, animations, transitions.
8. For complex sites, generate 5-15 files showing proper architecture.
9. Think deeply about the user's needs. Ask clarifying questions if the request is vague.
10. Support any tech stack: HTML/CSS/JS, React, Vue, Vite, Tailwind, etc.

If the user asks a question or is vague, respond conversationally WITHOUT the code marker. Ask what they need to make the best website possible.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
          reasoning: { effort: "high" },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-website error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
