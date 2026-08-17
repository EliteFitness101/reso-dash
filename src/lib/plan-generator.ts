import type { Intake } from "./profile-store";

export interface GeneratedPlan {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  trainingSplit: string;
  weeklyFrames: string[];
  notes: string[];
}

// Mifflin–St Jeor
export function generatePlan(intake: Intake): GeneratedPlan {
  const s = intake.sex === "male" ? 5 : -161;
  const bmr = Math.round(10 * intake.weightKg + 6.25 * intake.heightCm - 5 * intake.age + s);
  const activity = 1.35 + (intake.daysPerWeek - 3) * 0.05;
  const tdee = Math.round(bmr * Math.max(1.2, Math.min(1.75, activity)));
  const deltaByGoal = { cut: -450, recomp: -150, bulk: 250 }[intake.goal];
  const targetKcal = tdee + deltaByGoal;
  const proteinG = Math.round(intake.weightKg * (intake.goal === "cut" ? 2.2 : 2.0));
  const fatG = Math.round((targetKcal * 0.27) / 9);
  const carbsG = Math.max(80, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));

  const splitByDays: Record<number, string> = {
    2: "Full-Body × 2", 3: "Push / Pull / Legs", 4: "Upper / Lower × 2",
    5: "PPL + Upper/Lower", 6: "PPL × 2",
  };
  const trainingSplit = splitByDays[Math.max(2, Math.min(6, intake.daysPerWeek))] ?? "Full-Body × 3";
  const frames: string[] = [];
  for (let i = 0; i < intake.daysPerWeek; i++) {
    const isHome = intake.location === "home" || (intake.location === "hybrid" && i % 2 === 1);
    frames.push(isHome ? "Home Density Circuit" : "Gym Progressive Overload");
  }
  const notes: string[] = [];
  if (intake.restrictions.length) notes.push(`Strict zero: ${intake.restrictions.join(", ")}.`);
  if (intake.goal === "cut") notes.push("Carb portions auto-scale −25% on home days.");
  if (intake.experience === "novice") notes.push("Tempo cap 3-1-1 for first 2 weeks.");
  notes.push(`${intake.mealsPerDay} meals/day, ${intake.cuisine || "mixed"} cuisine bias.`);
  return { bmr, tdee, targetKcal, proteinG, carbsG, fatG, trainingSplit, weeklyFrames: frames, notes };
}

export const upsellCatalog = [
  { id: "coach-call-30", name: "1:1 Coaching Call", tagline: "30-min strategy session with Coach Buchi", amount: 25_000_00, perks: ["Live form review", "Custom block design", "WhatsApp follow-up"], badge: "Elite" },
  { id: "premium-meal-pack", name: "Premium Meal Pack", tagline: "8-week rotation + grocery list (West-African biased)", amount: 15_000_00, perks: ["56 meals", "Auto grocery list", "Onion-free variants"], badge: "Most Picked" },
  { id: "accountability-monthly", name: "Accountability Loop", tagline: "Weekly WhatsApp check-ins + form review", amount: 10_000_00, perks: ["Weekly video review", "Photo audit", "Replies <12h"], badge: "Subscription" },
] as const;

export const starterProduct = {
  id: "martialx-7day-combat-conditioning",
  name: "Martial-X™ · 7-Day Combat Conditioning",
  amount: 1_000_00,
} as const;
