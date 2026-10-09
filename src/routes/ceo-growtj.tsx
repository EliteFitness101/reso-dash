import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Backward-compatible typo alias.
 *
 * Keep old bookmarks from breaking, but route all dashboard access through
 * the canonical /ceo-growth implementation and its single authorization path.
 */
export const Route = createFileRoute("/ceo-growtj")({
  beforeLoad: () => {
    throw redirect({ to: "/ceo-growth", replace: true });
  },
});
