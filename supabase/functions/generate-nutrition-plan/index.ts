// Edge function: generate personalized daily nutrition + water + exercise targets via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tool = {
  type: "function",
  function: {
    name: "set_nutrition_plan",
    description: "Return personalized daily nutrition, hydration and exercise targets.",
    parameters: {
      type: "object",
      properties: {
        calories: { type: "number" },
        protein_g: { type: "number" },
        carbs_g: { type: "number" },
        fat_g: { type: "number" },
        fiber_g: { type: "number" },
        water_ml: { type: "number" },
        magnesium_mg: { type: "number" },
        potassium_mg: { type: "number" },
        calcium_mg: { type: "number" },
        iron_mg: { type: "number" },
        notes: { type: "string", description: "Short rationale (≤2 sentences)." },
        suggested_foods: {
          type: "array",
          items: { type: "string" },
          description: "5-8 food names matching the user's diet preference.",
        },
        suggested_exercises: {
          type: "array",
          items: { type: "string" },
          description: "4-6 exercise names suited to activity level and goal.",
        },
      },
      required: [
        "calories", "protein_g", "carbs_g", "fat_g", "fiber_g",
        "water_ml", "magnesium_mg", "potassium_mg", "calcium_mg", "iron_mg",
        "notes", "suggested_foods", "suggested_exercises",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    const { data: prefs } = await supabase
      .from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();

    const dietPref = prefs?.diet_preference ?? "non_veg";

    const userPrompt = `Build a daily nutrition + hydration + exercise plan.
Profile:
- Age: ${profile?.age ?? "unknown"}
- Gender: ${profile?.gender ?? "unknown"}
- Height: ${profile?.height_cm ?? "unknown"} cm
- Weight: ${profile?.weight_kg ?? "unknown"} kg
- Goal: ${profile?.goal ?? "maintenance"}
- Activity level: ${profile?.activity_level ?? "beginner"}
- Diet preference: ${dietPref}

Use the Mifflin-St Jeor equation for BMR, apply an activity multiplier, then adjust for goal (fat_loss: -15%, muscle_gain: +10%, maintenance: 0). Protein 1.6-2.2 g/kg, fat 25-30% of calories, rest carbs. Water 30-40 ml/kg. Provide reasonable RDA values for micronutrients. Foods MUST respect diet preference (${dietPref}: veg = no meat/fish, vegan = no animal products, non_veg = anything).`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an evidence-based sports nutritionist and coach. Be precise and conservative." },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "set_nutrition_plan" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = await aiResp.json();
    const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No structured response");
    const plan = JSON.parse(args);

    // Upsert nutrition_targets for user
    const { error: upErr } = await supabase
      .from("nutrition_targets")
      .upsert({
        user_id: user.id,
        calories: plan.calories,
        protein_g: plan.protein_g,
        carbs_g: plan.carbs_g,
        fat_g: plan.fat_g,
        fiber_g: plan.fiber_g,
        water_ml: plan.water_ml,
        magnesium_mg: plan.magnesium_mg,
        potassium_mg: plan.potassium_mg,
        calcium_mg: plan.calcium_mg,
        iron_mg: plan.iron_mg,
        source: "ai",
        notes: plan.notes,
      }, { onConflict: "user_id" });

    if (upErr) {
      console.error("upsert targets failed", upErr);
      return new Response(JSON.stringify({ error: "Could not save plan" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-nutrition-plan error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
