import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Factor = { id: string; status: string; factor_type: string };

export function CEOAccessMFA() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"setup" | "verify">("setup");

  useEffect(() => {
    let active = true;
    async function loadFactors() {
      if (!supabase) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorError) {
        setError(factorError.message);
      } else {
        const factors = (data?.totp ?? []) as Factor[];
        const verified = factors.find((factor) => factor.status === "verified");
        if (verified) {
          setFactorId(verified.id);
          setMode("verify");
        } else {
          setMode("setup");
          if (factors.some((factor) => factor.status === "unverified")) {
            setNotice("An unfinished authenticator setup exists. If you cannot access its original QR code, remove that unverified factor in Supabase Auth and retry setup.");
          }
        }
      }
      setLoading(false);
    }
    void loadFactors();
    return () => { active = false; };
  }, []);

  async function beginSetup() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ResoFit CEO authenticator",
    });
    setBusy(false);
    if (enrollError) {
      setError(enrollError.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setMode("verify");
    setNotice("Scan the QR code with an authenticator app, then enter the current six-digit code to finish enrollment.");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !factorId) return;
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim().replace(/\s/g, ""),
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setNotice("MFA verified. Refreshing your CEO access…");
    window.location.reload();
  }

  if (loading) return <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-border p-6 text-sm text-muted-foreground">Checking CEO security requirements…</div>;

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <section className="mx-auto max-w-xl rounded-3xl border border-gold/30 bg-card p-6 shadow-xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">ResoFit CEO Growth</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Complete administrator MFA</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your CEO role is recognized, but privileged controls require a verified authenticator (AAL2). This screen never bypasses the MFA gate.
        </p>
        {mode === "setup" && !factorId && (
          <button type="button" onClick={() => void beginSetup()} disabled={busy || !supabase} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Preparing secure setup…" : "Set up authenticator"}
          </button>
        )}
        {qrCode && (
          <div className="mt-6 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Scan this QR code</p>
            <img className="mx-auto mt-3 h-52 w-52 rounded-lg bg-white p-2" src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`} alt="Authenticator setup QR code" />
            <p className="mt-3 text-xs text-muted-foreground">If scanning is unavailable, enter this setup key manually in your authenticator app:</p>
            <code className="mt-2 block break-all rounded-lg bg-muted p-3 text-sm">{secret}</code>
          </div>
        )}
        {mode === "verify" && factorId && (
          <form onSubmit={verifyCode} className="mt-6 space-y-3">
            <label htmlFor="ceo-mfa-code" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authenticator code</label>
            <input id="ceo-mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} placeholder="000000" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg tracking-[0.35em] outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy || code.trim().length !== 6} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? "Verifying…" : "Verify and unlock CEO access"}
            </button>
          </form>
        )}
        {notice && <p role="status" className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm text-muted-foreground">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
        <p className="mt-5 text-xs leading-5 text-muted-foreground">Keep the authenticator key private. Do not send the QR code or setup key to anyone. If you lose access, use the approved account recovery process.</p>
      </section>
    </main>
  );
}
