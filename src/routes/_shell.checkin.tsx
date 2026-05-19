import { createFileRoute } from "@tanstack/react-router";
import { BiometricCheckIn } from "@/components/BiometricCheckIn";

export const Route = createFileRoute("/_shell/checkin")({
  component: BiometricCheckIn,
});
