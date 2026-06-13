import { Link, useLocation } from "@tanstack/react-router";
import { Utensils, Dumbbell, LineChart, CreditCard, Sparkles } from "lucide-react";

const tabs = [
  { to: "/macros", label: "Macros", Icon: Utensils },
  { to: "/training", label: "Train", Icon: Dumbbell },
  { to: "/checkin", label: "Log", Icon: LineChart },
  { to: "/checkout", label: "Pay", Icon: CreditCard },
  { to: "/upsells", label: "Boost", Icon: Sparkles },
] as const;


export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
      <div className="mx-auto w-full max-w-md px-4 pb-2">
        <div className="glass-card flex items-center justify-around rounded-2xl px-2 py-2">
          {tabs.map(({ to, label, Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="group relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors"
              >
                {active && (
                  <span className="absolute inset-x-4 top-0 h-[2px] gold-bg rounded-b" />
                )}
                <Icon
                  size={20}
                  className={active ? "text-gold" : "text-muted-foreground group-active:text-foreground"}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={`text-[10px] font-medium uppercase tracking-widest ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
