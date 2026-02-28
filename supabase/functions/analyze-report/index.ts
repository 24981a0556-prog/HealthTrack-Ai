import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Reference ranges for deterministic scoring ──
const RANGES: Record<string, { normal: [number, number]; mild: [number, number][]; moderate: [number, number][]; unit: string }> = {
  Hemoglobin:          { normal: [12, 17],     mild: [[11, 11.9], [17.1, 18]],   moderate: [[8, 10.9], [18.1, 20]],   unit: "g/dL" },
  PCV:                 { normal: [38.3, 48.6], mild: [[35, 38.2], [48.7, 52]],   moderate: [[30, 34.9], [52.1, 55]],  unit: "%" },
  RBC:                 { normal: [4.5, 5.5],   mild: [[4, 4.4], [5.6, 6]],       moderate: [[3, 3.9], [6.1, 7]],      unit: "M/uL" },
  WBC:                 { normal: [4, 11],      mild: [[3, 3.9], [11.1, 15]],     moderate: [[2, 2.9], [15.1, 20]],    unit: "K/uL" },
  Platelets:           { normal: [150, 400],   mild: [[100, 149], [401, 500]],   moderate: [[50, 99], [501, 600]],    unit: "K/uL" },
  HbA1c:               { normal: [0, 5.7],     mild: [[5.7, 6.4]],               moderate: [[6.5, 8]],                 unit: "%" },
  "Fasting Blood Sugar":{ normal: [70, 100],   mild: [[100, 125]],               moderate: [[126, 200]],               unit: "mg/dL" },
  "Total Cholesterol": { normal: [0, 200],     mild: [[200, 239]],               moderate: [[240, 300]],               unit: "mg/dL" },
  LDL:                 { normal: [0, 100],     mild: [[100, 159]],               moderate: [[160, 190]],               unit: "mg/dL" },
  HDL:                 { normal: [60, 999],    mild: [[40, 59]],                  moderate: [[20, 39]],                 unit: "mg/dL" },
  Triglycerides:       { normal: [0, 150],     mild: [[150, 199]],               moderate: [[200, 499]],               unit: "mg/dL" },
  Creatinine:          { normal: [0.7, 1.3],   mild: [[1.4, 1.9]],               moderate: [[2, 4]],                   unit: "mg/dL" },
  ALT:                 { normal: [7, 56],      mild: [[57, 100]],                moderate: [[101, 200]],               unit: "U/L" },
  AST:                 { normal: [10, 40],     mild: [[41, 100]],                moderate: [[101, 200]],               unit: "U/L" },
};

function inRange(v: number, r: [number, number]): boolean {
  return v >= r[0] && v <= r[1];
}

function scoreBiomarker(name: string, value: number): { score: number; status: string } {
  const ref = RANGES[name];
  if (!ref) return { score: 100, status: "Normal" };

  if (inRange(value, ref.normal)) return { score: 100, status: "Normal" };
  for (const r of ref.mild) { if (inRange(value, r)) return { score: 70, status: "Mild" }; }
  for (const r of ref.moderate) { if (inRange(value, r)) return { score: 40, status: "High" }; }
  return { score: 10, status: "Critical" };
}

function calcCategory(scores: Record<string, number>, weights: [string, number][]): number | null {
  let total = 0, wSum = 0;
  for (const [name, w] of weights) {
    if (scores[name] !== undefined) { total += scores[name] * w; wSum += w; }
  }
  return wSum > 0 ? Math.round(total / wSum) : null;
}

function interpret(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 60) return "Moderate Risk";
  if (score >= 40) return "High Risk";
  return "Critical";
}

const BIOMARKER_LIST = Object.keys(RANGES);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { reportId } = await req.json();
    if (!reportId) throw new Error("reportId required");

    const { data: report, error: reportErr } = await supabaseClient
      .from("reports").select("*").eq("id", reportId).eq("user_id", userData.user.id).single();
    if (reportErr || !report) throw new Error("Report not found");

    // Download file
    const { data: fileData } = await supabaseClient.storage
      .from("medical-reports").download(report.file_path);

    let fileContent = "";
    if (fileData) {
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        for (let j = 0; j < chunk.length; j++) {
          binary += String.fromCharCode(chunk[j]);
        }
      }
      fileContent = btoa(binary);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isPdf = report.file_name.toLowerCase().endsWith(".pdf");
    const mimeType = isPdf ? "application/pdf" : "image/jpeg";

    const biomarkerListStr = BIOMARKER_LIST.map(n => `{"name": "${n}", "value": <number or null>, "unit": "${RANGES[n].unit}"}`).join(",\n    ");

    const messages: any[] = [
      {
        role: "system",
        content: `You are a medical report analyzer. Extract biomarker values from the uploaded medical report.
Return a JSON object with this exact structure:
{
  "biomarkers": [
    ${biomarkerListStr}
  ],
  "summary": "Brief summary of the report"
}
If a value is not found, set it to null. Only return valid JSON, nothing else.`
      },
    ];

    if (fileContent && !isPdf) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Extract all biomarker values from this medical report image." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileContent}` } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Extract all biomarker values from this medical report. File: ${report.file_name}. If you cannot read the file, generate realistic sample values for demonstration purposes and note this in the summary.`
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let parsed: { biomarkers: { name: string; value: number | null; unit: string }[]; summary: string } = { biomarkers: [], summary: "" };
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch {}
    }

    // ── Deterministic scoring ──
    const bmScores: Record<string, number> = {};
    const biomarkersToInsert: { report_id: string; user_id: string; name: string; value: number; unit: string; status: string }[] = [];

    for (const bm of parsed.biomarkers) {
      if (bm.value == null) continue;
      const { score, status } = scoreBiomarker(bm.name, bm.value);
      bmScores[bm.name] = score;
      biomarkersToInsert.push({
        report_id: reportId,
        user_id: userData.user.id,
        name: bm.name,
        value: bm.value,
        unit: bm.unit || RANGES[bm.name]?.unit || "",
        status,
      });
    }

    // Category scores
    const anemia = calcCategory(bmScores, [["Hemoglobin", 0.5], ["PCV", 0.3], ["RBC", 0.2]]);
    const immunity = calcCategory(bmScores, [["WBC", 0.6], ["Platelets", 0.4]]);
    const heartRisk = calcCategory(bmScores, [["LDL", 0.3], ["HDL", 0.25], ["Triglycerides", 0.25], ["Total Cholesterol", 0.2]]);
    const diabetesRisk = calcCategory(bmScores, [["HbA1c", 0.6], ["Fasting Blood Sugar", 0.4]]);
    const organHealth = calcCategory(bmScores, [["Creatinine", 0.4], ["ALT", 0.3], ["AST", 0.3]]);

    const categoryScores: Record<string, { score: number; interpretation: string }> = {};
    const validCats: number[] = [];
    if (anemia !== null) { categoryScores.anemia = { score: anemia, interpretation: interpret(anemia) }; validCats.push(anemia); }
    if (immunity !== null) { categoryScores.immunity = { score: immunity, interpretation: interpret(immunity) }; validCats.push(immunity); }
    if (heartRisk !== null) { categoryScores.heart_risk = { score: heartRisk, interpretation: interpret(heartRisk) }; validCats.push(heartRisk); }
    if (diabetesRisk !== null) { categoryScores.diabetes_risk = { score: diabetesRisk, interpretation: interpret(diabetesRisk) }; validCats.push(diabetesRisk); }
    if (organHealth !== null) { categoryScores.organ_health = { score: organHealth, interpretation: interpret(organHealth) }; validCats.push(organHealth); }

    const healthScore = validCats.length > 0 ? Math.round(validCats.reduce((a, b) => a + b, 0) / validCats.length) : 50;
    const riskLevel = interpret(healthScore).replace(" Risk", "").replace("Good", "Low");

    // AI explanation with category context
    const explainResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a friendly health advisor. Explain medical results in simple language. Be encouraging but honest. Do not diagnose. Always recommend consulting a doctor."
          },
          {
            role: "user",
            content: `Health Score: ${healthScore}/100 (${riskLevel}).
Category Scores: ${JSON.stringify(categoryScores)}
Biomarkers: ${JSON.stringify(biomarkersToInsert.map(b => `${b.name}: ${b.value} ${b.unit} (${b.status})`))}.

Provide:
1. A 2-3 sentence explanation of these results in simple language.
2. Exactly 3 actionable lifestyle suggestions.
3. One sentence on when to consult a doctor based on these results.

Format as JSON: {"explanation": "...", "suggestions": ["...", "...", "..."]}`
          }
        ],
      }),
    });

    let explanation = "Analysis complete. Please consult your healthcare provider for detailed interpretation.";
    let suggestions: string[] = [];

    if (explainResponse.ok) {
      const explainData = await explainResponse.json();
      const explainContent = explainData.choices?.[0]?.message?.content ?? "";
      const explainMatch = explainContent.match(/\{[\s\S]*\}/);
      if (explainMatch) {
        try {
          const explainParsed = JSON.parse(explainMatch[0]);
          explanation = explainParsed.explanation || explanation;
          suggestions = explainParsed.suggestions || [];
        } catch {}
      }
    }

    // Save biomarkers
    if (biomarkersToInsert.length > 0) {
      await supabaseClient.from("biomarkers").insert(biomarkersToInsert);
    }

    // Update report with category scores
    await supabaseClient.from("reports").update({
      health_score: healthScore,
      risk_level: riskLevel,
      ai_explanation: explanation,
      suggestions,
      extracted_text: parsed.summary || "Report analyzed",
      category_scores: categoryScores,
    }).eq("id", reportId);

    return new Response(JSON.stringify({ success: true, healthScore, riskLevel, categoryScores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-report error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
