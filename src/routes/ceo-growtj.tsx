import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Backward-compatible typo alias. Keep old bookmarks working while
 * routing all access through the canonical CEO Growth route.
 */
export const Route = createFileRoute("/ceo-growtj")({
  beforeLoad: () => {
    throw redirect({ to: "/ceo-growth", replace: true });
  },
});
