import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch user's latest biomarkers and reports for context
    const [reportsRes, biomarkersRes] = await Promise.all([
      supabase.from("reports").select("health_score, risk_level, ai_explanation, suggestions, category_scores, created_at")
        .eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(3),
      supabase.from("biomarkers").select("name, value, unit, status, created_at")
        .eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(15),
    ]);

    const healthContext = `
User's recent health data:
Reports: ${JSON.stringify(reportsRes.data ?? [])}
Biomarkers: ${JSON.stringify(biomarkersRes.data ?? [])}
`;

    const systemPrompt = `You are a friendly, knowledgeable health assistant for a medical report analysis app. You have access to the user's health data below. Help them understand their results, answer health questions, and provide lifestyle advice. Always be encouraging but honest. Always remind them to consult their doctor for medical decisions. Keep responses concise and easy to understand.

${healthContext}

Important rules:
- Never diagnose conditions, only explain what biomarker values might indicate
- Always recommend consulting a healthcare professional
- Be warm, supportive, and use simple language
- Use markdown formatting for readability`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI request failed");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("health-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
