import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GridBackdrop } from "@/components/GridBackdrop";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { XPProgress } from "@/components/XPProgress";
import { AccessGate } from "@/components/AccessGate";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <AccessGate>
      <div className="relative min-h-dvh bg-background text-foreground antialiased">
        <GridBackdrop />
        <AppHeader />
        <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-44 pt-4">
          <AdminPanel />
          <XPProgress />
          <div className="mt-4">
            <Outlet />
          </div>
        </main>
        <InstallPrompt />
        <BottomTabBar />
      </div>
    </AccessGate>
  );
}
