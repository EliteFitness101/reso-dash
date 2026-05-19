import { createFileRoute } from "@tanstack/react-router";
import { TrainingMatrix } from "@/components/TrainingMatrix";

export const Route = createFileRoute("/_shell/training")({
  component: TrainingMatrix,
});
