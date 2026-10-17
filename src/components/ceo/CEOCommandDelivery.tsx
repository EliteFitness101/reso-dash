import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, CircleAlert, LoaderCircle, Smartphone, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

type Props = { briefing: string };
type DeliveryStatus = { id: string; status: string; receipts?: { event_type: string; status: string; created_at: string }[] };

const vapidKey = import.meta.env.VITE_CEO_COMMAND_VAPID_PUBLIC_KEY as string | undefined;
const PUSH_FUNCTION = "ceo-command-push";

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function CEOCommandDelivery({ briefing }: Props) {
  const { session, user, isSuperAdmin } = useAuth();
  const [busy, setBusy] = useState<"enable" | "test" | null>(null);
  const [pushState, setPushState] = useState("Checking this device…");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [lastDelivery, setLastDelivery] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const pushSupported = useMemo(() =>
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window, []);

  useEffect(() => {
    if (!pushSupported) {
      setPushState("Push notifications are not supported by this browser.");
      return;
    }
    setPushState(Notification.permission === "granted"
      ? "Browser permission granted. Subscription still needs verification."
      : Notification.permission === "denied"
        ? "Notifications are blocked in browser settings."
        : "Notifications are not enabled on this device.");
    let active = true;
    void navigator.serviceWorker.getRegistration("/").then(async (registration) => {
      if (!active || !registration) return;
      const subscription = await registration.pushManager.getSubscription();
      if (!active) return;
      if (subscription) {
        setPushEnabled(true);
        setPushState("Device subscription exists. Server delivery must be tested.");
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [pushSupported]);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      setError("Speech playback is not supported in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(briefing);
    utterance.lang = "en-NG";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setError("");
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [briefing, speaking]);

  const enablePush = useCallback(async () => {
    setError("");
    if (!supabase || !session || !user) {
      setError("Sign in to the CEO dashboard first.");
      return;
    }
    if (!pushSupported) {
      setError("This browser cannot register Web Push notifications.");
      return;
    }
    if (!vapidKey) {
      setError("The public push key is missing from this deployment. Rebuild after configuring VITE_CEO_COMMAND_VAPID_PUBLIC_KEY.");
      return;
    }
    if (isIos() && !isStandalone()) {
      setPushState("On iPhone, first use Safari Share → Add to Home Screen, open the installed app, then enable push here.");
      setError("iPhone Web Push requires the installed Home Screen web app on supported iOS versions.");
      return;
    }
    setBusy("enable");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "Notifications blocked in browser settings." : "Notification permission was not granted.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/ceo-command-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ??
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(vapidKey),
        });
      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!subscription.endpoint || !p256dh || !auth) throw new Error("The browser returned an incomplete push subscription.");
      const { error: saveError } = await supabase.from("ceo_command_push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 500),
        device_label: isIos() ? "iPhone / iPad" : "CEO browser",
        enabled: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (saveError) throw saveError;
      setPushEnabled(true);
      setPushState("Subscription saved. Send a test push to verify server acceptance and device receipt.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable push notifications.");
    } finally {
      setBusy(null);
    }
  }, [pushSupported, session, user]);

  const checkDelivery = useCallback(async (eventId: string) => {
    if (!supabase) return null;
    const { data, error: invokeError } = await supabase.functions.invoke(PUSH_FUNCTION, {
      body: { action: "delivery_status", eventId },
    });
    if (invokeError) throw invokeError;
    if (!data?.ok) throw new Error(data?.error || "Delivery status is unavailable.");
    return data.event as DeliveryStatus;
  }, []);

  const sendTest = useCallback(async () => {
    if (!supabase || !session || !user) {
      setError("Sign in to the CEO dashboard first.");
      return;
    }
    setBusy("test");
    setError("");
    setLastDelivery("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(PUSH_FUNCTION, {
        body: { action: "send_test" },
      });
      if (invokeError) throw invokeError;
      if (!data?.ok) throw new Error(data?.error || "The push test did not complete.");
      const first = (data.events || [])[0];
      if (!first?.id) {
        setLastDelivery("No active device subscription was found.");
        return;
      }
      setLastDelivery(data.accepted > 0
        ? "Push service accepted the test. Waiting for device receipt…"
        : "The push service did not accept the test. Check the delivery record.");
      let latest: DeliveryStatus | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 1800));
        latest = await checkDelivery(first.id);
        if (latest?.receipts?.some((receipt) => receipt.event_type === "push_received")) break;
      }
      if (latest?.receipts?.some((receipt) => receipt.event_type === "push_received")) {
        setLastDelivery("VERIFIED: the service worker reported receipt of the test push.");
        setPushState("Push receipt confirmed by this device.");
      } else if (latest?.status === "accepted") {
        setLastDelivery("PARTIAL: the push service accepted the message, but no device receipt arrived during the 9-second verification window.");
      } else {
        setLastDelivery("FAILED OR UNCONFIRMED: inspect the event status before relying on push.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Push test failed.");
    } finally {
      setBusy(null);
    }
  }, [session, user, checkDelivery]);

  return (
    <section className="mt-5 glass-card rounded-3xl border border-amber-300/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">CEO Command · delivery</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Spoken briefing & push alerts</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Voice playback runs on this device while the dashboard is open. Push is recorded separately and must return a device receipt before it is marked verified.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
          <BellRing size={18} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Briefing script</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{briefing}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={speak} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black">
            {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}{speaking ? "Stop speaking" : "Speak briefing"}
          </button>
          <button type="button" onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(briefing).catch(() => undefined); }} className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground">Copy script</button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <Smartphone size={18} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Device push notifications</p>
            <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{pushState}</p>
            {pushEnabled && <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 size={14} /> Subscription registered; delivery still requires a test.</p>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void enablePush()} disabled={busy !== null || !isSuperAdmin} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "enable" ? <LoaderCircle size={15} className="animate-spin" /> : <BellRing size={15} />} Enable on this device
          </button>
          <button type="button" onClick={() => void sendTest()} disabled={busy !== null || !pushEnabled || !isSuperAdmin} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 px-4 py-2.5 text-xs font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
            {busy === "test" ? <LoaderCircle size={15} className="animate-spin" /> : <BellRing size={15} />} Send test push
          </button>
        </div>
        {lastDelivery && <p className="mt-3 rounded-xl border border-border px-3 py-2 text-xs leading-relaxed text-foreground">{lastDelivery}</p>}
      </div>

      {(error || !isSuperAdmin) && <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-200/90"><CircleAlert size={14} className="mt-0.5 shrink-0" />{error || "CEO-only controls. Voice playback is available independently of push permission."}</p>}
    </section>
  );
}
