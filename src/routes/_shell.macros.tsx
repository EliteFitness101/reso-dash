import { createFileRoute } from "@tanstack/react-router";
import { MacroEngine } from "@/components/MacroEngine";

export const Route = createFileRoute("/_shell/macros")({
  component: MacroEngine,
});
