import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI website builder, similar to Lovable. You create complete, production-quality websites.

IMPORTANT - CLARIFYING QUESTIONS FLOW:
When the user's request is broad, vague, or could benefit from more details (e.g. "build me a website", "create an e-commerce site", "make a portfolio"), you MUST first ask clarifying questions BEFORE generating code.

To ask questions, respond ONLY with this exact format (no other text before or after):
|||QUESTIONS_START|||
[
  { "id": "q1", "question": "What is the primary purpose of your website?", "options": ["Portfolio / Personal", "Business / Company", "E-commerce / Store", "Blog / Content", "SaaS / Dashboard"] },
  { "id": "q2", "question": "What visual style do you prefer?", "options": ["Modern & Minimal", "Bold & Colorful", "Dark & Elegant", "Professional & Clean"] },
  { "id": "q3", "question": "What key sections do you need?", "options": ["Hero + About + Contact", "Hero + Features + Pricing + Testimonials", "Full landing page with all sections", "Dashboard with sidebar navigation"] }
]
|||QUESTIONS_END|||

Rules for questions:
- Ask 2-5 questions maximum
- Each question should have 3-5 options
- Write questions in the SAME LANGUAGE the user used

When the user responds with their answers, use those answers to generate the perfect website. Do NOT ask more questions after receiving answers.

IMPORTANT - THOUGHT BLOCK:
When generating code, you MUST start your response with a thought block FIRST, before everything else.

The thought block format is:
|||THOUGHT_START|||
{"title": "Short task title (max 6 words)", "steps": ["Step 1 description", "Step 2 description", "Step 3 description", "Step 4 description"]}
|||THOUGHT_END|||

Rules for thought block:
- Title: concise and descriptive (e.g. "Build portfolio with dark theme")
- Steps: 3-5 items describing what you will build (e.g. "Design HTML structure and layout", "Add CSS animations and styling", "Implement JavaScript interactions", "Create responsive mobile design")
- Always write the thought block in ENGLISH
- The thought block MUST come FIRST before any other content

When generating code, the full response order is:
1. |||THOUGHT_START||| block (first)
2. Conversational explanation with bullet points using emoji
3. |||CODE_START|||
4. JSON with files and previewHtml

PART after |||CODE_START|||: A JSON object:
{
  "files": [
    { "name": "filename.ext", "language": "html|css|javascript|typescript|jsx|tsx|json", "content": "full file content" }
  ],
  "previewHtml": "A COMPLETE standalone HTML document with ALL styles and JS inlined."
}

IMPORTANT - DATABASE SUPPORT:
When the user asks you to add a database, create tables, or store data, you can include database operations in your response.
Add a |||DATABASE_START||| block AFTER the code block (or standalone if no code changes needed):

|||DATABASE_START|||
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        { "name": "column_name", "type": "text|integer|boolean|timestamp|uuid|jsonb" }
      ],
      "sampleData": [
        { "column_name": "value1" },
        { "column_name": "value2" }
      ]
    }
  ]
}
|||DATABASE_END|||

Rules for database:
- Do NOT include "id" column - it's added automatically
- Supported types: text, integer, boolean, timestamp, uuid, jsonb
- Include 2-5 sample rows of realistic data in sampleData
- When generating code that uses a database, also include the Supabase client setup in the code files
- You can combine code generation AND database creation in the same response

CRITICAL RULES:
1. previewHtml MUST be complete and self-contained.
2. Use modern design: dark themes, gradients, smooth animations, glassmorphism.
3. For React/Vite projects include all config files.
4. Make designs responsive and accessible.
5. Include realistic content, not lorem ipsum.
6. For complex sites, generate 5-15 files.
7. When the user asks for a MODIFICATION (e.g. "change the color", "add a section", "modify the header"), do NOT ask questions. Just apply the modification to the existing code and return the full updated code. Always include the complete updated previewHtml and files.
8. For modifications, include a thought block describing what you're changing.`;

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
