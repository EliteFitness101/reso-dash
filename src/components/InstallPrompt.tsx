import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "resoflex_install_dismiss";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;

    if (standalone) {
      setInstalled(true);
      return;
    }

    const raw = localStorage.getItem(DISMISS_KEY);
    const until = raw ? parseInt(raw, 10) : 0;
    const stillDismissed = until > Date.now();
    setDismissed(stillDismissed);

    const onBIP = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // Lovable/iframe previews and iOS Safari may not expose beforeinstallprompt.
    // In those cases show install guidance rather than pretending installation is automatic.
    const timer = window.setTimeout(() => {
      if (!stillDismissed) setSimulated(true);
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const visible = !installed && !dismissed && (deferred !== null || simulated);
  if (!visible) return null;

  const dismiss = () => {
    const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(sevenDays));
    setDismissed(true);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }

    alert(
      "To install ResoFlex OS:\n\nSafari iOS: Share → Add to Home Screen\nChrome/Edge: Menu → Install app",
    );
    dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-40 safe-bottom pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full max-w-md px-4">
        <div className="glass-card-gold flex items-center gap-3 rounded-2xl p-3 pl-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gold-bg">
            <Download size={18} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold leading-tight">Install ResoFlex OS</p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              App-like access · fast launch · built for your phone
            </p>
          </div>
          <button
            onClick={install}
            className="rounded-xl gold-bg px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.97]"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
