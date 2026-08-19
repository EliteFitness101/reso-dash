import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export function AccessGate({ children }: { children: ReactNode }) {
  const { session, user, loading, signInWithMagicLink, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [entitled, setEntitled] = useState(false);
  const [message, setMessage] = useState("");

  const refreshEntitlement = async () => {
    if (!supabase || !user) return false;
    setChecking(true);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("claim-dashboard-entitlement", {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: {},
    });
    if (error) {
      setMessage("We couldn't verify your purchase yet. Please try again.");
      setChecking(false);
      return false;
    }
    if (!data?.entitled) {
      setMessage("No verified ResoFit purchase was found for this email.");
      setChecking(false);
      return false;
    }
    setEntitled(true);
    setChecking(false);
    return true;
  };

  useEffect(() => {
    if (user) void refreshEntitlement();
    else setEntitled(false);
  }, [user?.id]);

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Checking secure access…</div>;
  }

  if (!session || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-5 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reso-Dash</p>
          <h1 className="mt-3 text-2xl font-bold">Member access</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with the email used for your verified ResoFit purchase.</p>
          <form
            className="mt-6 space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setSending(true);
              setMessage("");
              const result = await signInWithMagicLink(email);
              setSending(false);
              setMessage(result.error ?? "Check your email for the secure sign-in link.");
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button disabled={sending} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {sending ? "Sending secure link…" : "Send secure sign-in link"}
            </button>
          </form>
          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    );
  }

  if (!entitled) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-5 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secure access</p>
          <h1 className="mt-3 text-2xl font-bold">Purchase verification required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reso-Dash unlocks only after Supabase verifies a successful payment.</p>
          <button onClick={refreshEntitlement} disabled={checking} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {checking ? "Verifying…" : "Check verified purchase"}
          </button>
          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
          <button onClick={() => void signOut()} className="mt-3 w-full rounded-xl border border-input px-4 py-3 text-sm font-medium">Sign out</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
