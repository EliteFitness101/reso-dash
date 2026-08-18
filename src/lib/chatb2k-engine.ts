export type ChatB2KActionType = "MOVE" | "EAT" | "RECOVER" | "LEARN" | "UPGRADE";

export interface ChatB2KProductMatch {
  id: string;
  name: string;
  price: string;
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

/**
 * Commercial recommendations are deterministic and bounded here.
 * The XP value is still server-authoritative once the action is completed.
 */
export function evaluateNextBestAction(state: ChatB2KStateInput): ChatB2KAction {
  if (state.dayCount >= 7 || state.currentPhase === "day_7_milestone") {
    return {
      id: "nba-day7-upgrade",
      type: "UPGRADE",
      title: "7-Day Reset Milestone Completed",
      subtitle: "Your consistency unlocks the next personalized progression layer.",
      xpReward: 250,
      durationOrPortion: "4-Week Transformation",
      ctaText: "Claim Milestone Upgrade",
      productMatch: {
        id: "rf-sculpt-001",
        name: "ResoFlex™ Sculpting & Resistance Kit",
        price: "₦22,000",
        image: "/assets/products/resoflex-kit.jpg",
      },
    };
  }

  const equipment = state.equipmentAccess && state.equipmentAccess !== "minimal"
    ? "your available equipment"
    : "your bodyweight";

  return {
    id: "nba-daily-move-001",
    type: "MOVE",
    title: "12-Minute Full-Body Reset",
    subtitle: `A practical home session using ${equipment}, matched to your current journey.`,
    xpReward: 50,
    durationOrPortion: "12 mins",
    ctaText: "Start Session Now",
  };
}
