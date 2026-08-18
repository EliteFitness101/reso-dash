export type ChatB2KActionType = "MOVE" | "EAT" | "RECOVER" | "LEARN" | "UPGRADE";

export interface ChatB2KProductMatch {
  id: string;
  sku?: string;
  name: string;
  priceNGN: number;
  inStock: boolean;
  category?: string;
  shopUrl: string;
  image?: string;
}

export interface ChatB2KAction {
  id: string;
  type: ChatB2KActionType;
  title: string;
  subtitle: string;
  xpReward: number;
  durationOrPortion: string;
  ctaText: string;
  productMatch?: ChatB2KProductMatch;
}

export interface ChatB2KStateInput {
  dayCount: number;
  currentPhase: string;
  primaryObjective?: string | null;
  budgetTier?: string | null;
  equipmentAccess?: string | null;
  lifeStage?: string | null;
}

export interface ChatB2KOrchestration {
  nextBestAction: ChatB2KAction;
  secondaryActions: ChatB2KAction[];
}

/**
 * ChatB2K™ deterministic recommendation layer.
 * Server-side XP remains authoritative; this engine only selects the experience.
 */
export function rankRecommendations(state: ChatB2KStateInput): ChatB2KAction[] {
  const equipment = state.equipmentAccess && state.equipmentAccess !== "minimal"
    ? "your available equipment"
    : "your bodyweight";

  const pool: ChatB2KAction[] = [
    {
      id: "nba-daily-move",
      type: "MOVE",
      title: "12-Minute Lower-Body Sculpt",
      subtitle: `Targeted glute & core activation using ${equipment}, matched to your current journey.`,
      xpReward: 50,
      durationOrPortion: "12 mins • High intensity",
      ctaText: "Start Move Session",
    },
    {
      id: "act-eat-01",
      type: "EAT",
      title: "High-Protein Local Meal Protocol",
      subtitle: "A practical Nigerian meal option designed around your current goal and constraints.",
      xpReward: 30,
      durationOrPortion: "Lunch protocol",
      ctaText: "View Meal Guidance",
    },
    {
      id: "act-recover-01",
      type: "RECOVER",
      title: "10-Minute Hip & Core Mobility",
      subtitle: "A short recovery sequence to improve movement quality after training or desk work.",
      xpReward: 25,
      durationOrPortion: "10 mins • Recovery",
      ctaText: "Begin Recovery",
    },
    {
      id: "act-learn-01",
      type: "LEARN",
      title: "Consistency & Progress Guide",
      subtitle: "A concise guide for turning your wellness routine into a sustainable weekly system.",
      xpReward: 40,
      durationOrPortion: "5-min read",
      ctaText: "Read Guide",
    },
  ];

  if (state.dayCount >= 7 || state.currentPhase === "day_7_milestone") {
    pool.unshift({
      id: "nba-day7-upgrade",
      type: "UPGRADE",
      title: "7-Day Reset Milestone Achieved",
      subtitle: "Your consistency unlocks the next personalized progression layer. Upgrade only when the matched product is available.",
      xpReward: 250,
      durationOrPortion: "4-Week progression",
      ctaText: "Claim Milestone Upgrade",
      productMatch: {
        id: "rf-sculpt-001",
        sku: "RF-RES-KIT-01",
        name: "ResoFlex™ Sculpting & Resistance Kit",
        priceNGN: 22000,
        inStock: true,
        category: "Hardware",
        shopUrl: "https://shop.resofit.fit/products/resoflex-kit",
        image: "/assets/products/resoflex-kit.jpg",
      },
    });
  }

  return pool;
}

export function orchestrateNextExperience(state: ChatB2KStateInput): ChatB2KOrchestration {
  const ranked = rankRecommendations(state);
  return {
    nextBestAction: ranked[0],
    secondaryActions: ranked.slice(1),
  };
}

export function evaluateNextBestAction(state: ChatB2KStateInput): ChatB2KAction {
  return orchestrateNextExperience(state).nextBestAction;
}
