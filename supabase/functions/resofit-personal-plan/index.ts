import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "https://dashboard.resofit.fit",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Intake = {
  fullName?: string; email?: string; age: number; sex: "male" | "female";
  heightCm: number; weightKg: number; goal: "cut" | "recomp" | "bulk";
  experience?: "novice" | "intermediate" | "advanced"; daysPerWeek: number;
  restrictions?: string[]; cuisine?: string; mealsPerDay?: number;
  location?: "gym" | "home" | "hybrid"; equipment?: string[];
};

const mealLibrary = [
  { breakfast: "Oats + banana + eggs", lunch: "Jollof rice + grilled chicken + mixed vegetables", dinner: "Beans + boiled plantain + greens", snack: "Orange + groundnuts" },
  { breakfast: "Pap + moi moi + fruit", lunch: "Ofada rice + lean beef + vegetable sauce", dinner: "Grilled fish + sweet potato + salad", snack: "Greek yogurt or fortified soy yogurt + fruit" },
  { breakfast: "Whole-grain toast + eggs + avocado", lunch: "Beans + brown rice + grilled fish + vegetables", dinner: "Chicken pepper soup + boiled yam + greens", snack: "Apple + unsalted nuts" },
  { breakfast: "Yam + egg and tomato sauce", lunch: "Rice + beans + chicken + vegetables", dinner: "Efo riro + lean protein + modest swallow portion", snack: "Banana + peanut butter" },
  { breakfast: "Oats + pawpaw + eggs", lunch: "Sweet potato + grilled chicken + vegetables", dinner: "Beans porridge + fish + greens", snack: "Watermelon + nuts" },
  { breakfast: "Moi moi + fruit + unsweetened drink", lunch: "Jollof rice + fish + vegetables", dinner: "Boiled plantain + egg sauce + salad", snack: "Pear + nuts" },
  { breakfast: "Pap + eggs + fruit", lunch: "Yam + fish + vegetable sauce", dinner: "Beans + rice + vegetables", snack: "Pawpaw + yogurt/soy yogurt" },
];

const workoutLibrary = [
  { name: "Full Body Strength", exercises: ["Squat 3×8–12", "Push-up or press 3×8–12", "Row 3×8–12", "Hip hinge 3×8–12", "Plank 3×30–45s"] },
  { name: "Lower Body + Core", exercises: ["Squat variation 3×8–12", "Reverse lunge 3×8/side", "Hip thrust 3×10–15", "Calf raise 3×12–20", "Dead bug 3×8/side"] },
  { name: "Upper Body + Core", exercises: ["Press 3×8–12", "Row 3×8–12", "Shoulder raise 3×10–15", "Biceps curl 2×10–15", "Side plank 3×20–40s/side"] },
  { name: "Conditioning + Mobility", exercises: ["Brisk walk/dance 20–30 min", "Hip mobility 5 min", "Shoulder mobility 5 min", "Breathing cooldown 3 min"] },
  { name: "Recovery", exercises: ["Easy walk 15–30 min", "Gentle mobility 10 min", "Light stretching 5 min"] },
];

const hacks = [
  "Prepare two protein options and one bulk carbohydrate in advance so the next meal requires less decision-making.",
  "Keep a water bottle visible and pair hydration with existing routines such as waking, meals and commuting.",
  "Use a simple plate structure: vegetables/fruit, protein foods and a sensible grain/tuber portion.",
  "For travel days, keep a portable protein/fibre option available instead of relying on whatever is closest.",
  "Protect a consistent sleep window and make the last hour before bed lower-stimulation.",
  "Use a 10-minute minimum on difficult days: a short walk or mobility session keeps the habit alive.",
  "Track completion, not perfection: meal consistency, movement, recovery and weekly check-ins.",
];

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function buildPlan(intake: Intake, durationDays: number, accessories: unknown[]) {
  const age = clamp(Number(intake.age) || 30, 18, 80);
  const height = clamp(Number(intake.heightCm) || 170, 130, 230);
  const weight = clamp(Number(intake.weightKg) || 70, 35, 250);
  const days = clamp(Math.round(Number(intake.daysPerWeek) || 3), 2, 6);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (intake.sex === "male" ? 5 : -161));
  const activity = clamp(1.2 + days * 0.08, 1.35, 1.75);
  const tdee = Math.round(bmr * activity);
  const delta = intake.goal === "cut" ? -350 : intake.goal === "bulk" ? 250 : -100;
  const targetKcal = clamp(tdee + delta, 1500, 3200);
  const proteinG = Math.round(weight * (intake.goal === "cut" ? 1.8 : 1.6));
  const fatG = Math.round(targetKcal * 0.27 / 9);
  const carbsG = Math.max(100, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));

  const restrictions = new Set((intake.restrictions ?? []).map((x) => x.toLowerCase()));
  const allowed = (meal: string) => {
    const s = meal.toLowerCase();
    if (restrictions.has("dairy") && (s.includes("yogurt") || s.includes("milk"))) return false;
    if (restrictions.has("gluten") && (s.includes("toast") || s.includes("whole-grain"))) return false;
    if (restrictions.has("pork") && s.includes("pork")) return false;
    if (restrictions.has("shellfish") && s.includes("shellfish")) return false;
    return true;
  };

  const daysOut = Array.from({ length: durationDays }, (_, i) => {
    const lib = mealLibrary[i % mealLibrary.length];
    const meals = {
      breakfast: allowed(lib.breakfast) ? lib.breakfast : mealLibrary[(i + 1) % mealLibrary.length].breakfast,
      lunch: allowed(lib.lunch) ? lib.lunch : mealLibrary[(i + 2) % mealLibrary.length].lunch,
      dinner: allowed(lib.dinner) ? lib.dinner : mealLibrary[(i + 3) % mealLibrary.length].dinner,
      snack: allowed(lib.snack) ? lib.snack : "Fruit + unsalted nuts",
    };
    const trainDay = i % 7;
    const workout = trainDay < days
      ? workoutLibrary[trainDay % 4]
      : workoutLibrary[4];
    return {
      day: i + 1,
      meals,
      workout,
      lifestyleHack: hacks[i % hacks.length],
      consistencyTarget: "Complete the planned meals, movement and recovery action; log one line of feedback.",
    };
  });

  const weeklySchedule = Array.from({ length: days }, (_, i) => ({
    session: i + 1,
    focus: workoutLibrary[i % 4].name,
    progression: intake.experience === "novice" ? "Leave 2–3 reps in reserve and prioritize technique." : "Add a small amount of load or reps when all sets are completed cleanly.",
  }));

  const shoppingList = [
    "Oats, rice, yam, sweet potato, plantain",
    "Beans, moi moi ingredients, lentils",
    "Eggs, chicken, fish, lean beef",
    "Leafy vegetables, tomatoes, peppers, onions if tolerated",
    "Banana, pawpaw, oranges, watermelon and other seasonal fruit",
    "Groundnuts/unsalted nuts, avocado",
  ];

  return {
    version: "canva-consolidated-v1",
    generatedAt: new Date().toISOString(),
    durationDays,
    summary: {
      bmr, tdee, targetKcal, proteinG, carbsG, fatG,
      goal: intake.goal, daysPerWeek: days, mealsPerDay: intake.mealsPerDay ?? 3,
      cuisine: intake.cuisine ?? "Nigerian/West-African",
      location: intake.location ?? "hybrid",
    },
    weeklyProgramming: weeklySchedule,
    days: daysOut,
    shoppingList,
    mealPrep: [
      "Batch-cook one grain/tuber base and two protein options.",
      "Wash and portion vegetables and fruit for quick assembly.",
      "Keep one emergency meal option ready for travel or busy workdays.",
    ],
    lifestyleHacks: hacks,
    accessoryRecommendations: accessories,
    safety: "This is a general wellness plan, not medical diagnosis or treatment. Adjust or seek qualified professional guidance for pregnancy, eating disorders, significant medical conditions, or medication-related nutrition/training needs.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Server configuration unavailable" }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sign in required" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json().catch(() => ({}));
  const sku = typeof body?.product_sku === "string" ? body.product_sku.trim() : "";
  const intake = (body?.intake ?? {}) as Intake;

  let entitlementQuery = admin.from("resofit_entitlement_states")
    .select("id,entitlement_key,source_product,status,access,start_at,end_at,grace_end_at,commerce_action_url,metadata,updated_at")
    .eq("user_id", userData.user.id)
    .in("status", ["TRIAL","ACTIVE","GRACE","PAST_DUE"])
    .order("updated_at", { ascending: false })
    .limit(10);

  if (sku) entitlementQuery = entitlementQuery.eq("source_product", sku);
  const { data: entitlements, error: entitlementError } = await entitlementQuery;
  if (entitlementError) return json({ error: "Unable to verify entitlement" }, 500);
  const entitlement = (entitlements ?? []).find((x) => x.status !== "PAST_DUE") ?? entitlements?.[0];
  if (!entitlement) return json({ error: "No active ResoFit plan entitlement", code: "NO_ENTITLEMENT" }, 403);

  if (entitlement.status === "PAST_DUE" || entitlement.access !== "active") {
    return json({
      error: "Your plan is currently restricted until payment is resolved.",
      code: "PAST_DUE",
      status: entitlement.status,
      commerce_action_url: entitlement.commerce_action_url,
    }, 402);
  }

  const sourceProduct = entitlement.source_product;
  const { data: experience } = await admin.from("resofit_product_experience_config")
    .select("product_sku,teaser,promise,delivery,plan,meal_workout,lifestyle_hacks,accessory_skus")
    .eq("product_sku", sourceProduct)
    .maybeSingle();

  const accessorySkus = Array.isArray(experience?.accessory_skus) ? experience.accessory_skus.filter((x): x is string => typeof x === "string") : [];
  const { data: accessories } = accessorySkus.length
    ? await admin.from("products").select("sku,handle,title,variant_price,image_src,published").in("sku", accessorySkus).eq("published", true)
    : { data: [] };

  const durationDays = Math.max(7, Number(experience?.plan?.duration_days ?? experience?.plan?.days ?? 30));
  const plan = buildPlan(intake, Math.min(durationDays, 30), accessories ?? []);

  const { data: saved, error: saveError } = await admin.from("resofit_personalized_plans").upsert({
    user_id: userData.user.id,
    entitlement_key: entitlement.entitlement_key,
    source_product: sourceProduct,
    plan_version: "canva-consolidated-v1",
    intake,
    plan,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,entitlement_key,source_product" })
  .select("id,plan_version,intake,plan,generated_at,updated_at")
  .single();

  if (saveError) return json({ error: "Unable to save personalized plan", detail: saveError.message }, 500);

  return json({
    ok: true,
    entitlement: {
      status: entitlement.status,
      access: entitlement.access,
      source_product: sourceProduct,
      start_at: entitlement.start_at,
      end_at: entitlement.end_at,
      grace_end_at: entitlement.grace_end_at,
    },
    experience: {
      teaser: experience?.teaser ?? {},
      promise: experience?.promise ?? {},
      delivery: experience?.delivery ?? {},
      plan: experience?.plan ?? {},
      meal_workout: experience?.meal_workout ?? {},
      lifestyle_hacks: experience?.lifestyle_hacks ?? {},
    },
    plan: saved?.plan ?? plan,
    plan_id: saved?.id,
    generated_at: saved?.generated_at,
    accessories: accessories ?? [],
  });
});
