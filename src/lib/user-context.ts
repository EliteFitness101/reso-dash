export type DayType = "gym" | "home" | "rest";

export const userProfile = {
  name: "Maria",
  role: "NYSC Corper / Teacher",
  programWeeks: 4,
  currentWeek: 1,
  goal: "Rapid Body Recomposition",
  dietaryRestrictions: ["onions"] as string[],
};

export const weekSchedule: { day: string; short: string; type: DayType; label: string }[] = [
  { day: "Monday", short: "Mon", type: "gym", label: "Push / Pull" },
  { day: "Tuesday", short: "Tue", type: "home", label: "Density Circuit" },
  { day: "Wednesday", short: "Wed", type: "rest", label: "Active Recovery" },
  { day: "Thursday", short: "Thu", type: "gym", label: "Legs / Core" },
  { day: "Friday", short: "Fri", type: "home", label: "Density Circuit" },
  { day: "Saturday", short: "Sat", type: "rest", label: "Mobility" },
  { day: "Sunday", short: "Sun", type: "rest", label: "Biometric Check-In" },
];

export const gymExercises = [
  { name: "Lat Pulldowns", scheme: "4 × 10", note: "Progressive overload" },
  { name: "Shoulder Press", scheme: "4 × 8", note: "Add 2.5 kg weekly" },
  { name: "Leg Press", scheme: "4 × 12", note: "Controlled eccentric" },
  { name: "Cable Tricep + Bicep Superset", scheme: "3 × 12 / 12", note: "60s rest" },
  { name: "Hanging Knee Raises", scheme: "3 × 15", note: "Core finisher" },
];

export const homeCircuit = [
  { name: "Incline Dips", scheme: "3 × 12" },
  { name: "Diamond Push-ups (knees)", scheme: "3 × 10" },
  { name: "Plank Shoulder Taps", scheme: "3 × 20" },
  { name: "Deadbugs", scheme: "3 × 12 / side" },
];
