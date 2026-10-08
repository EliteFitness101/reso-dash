import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    if (!supabase) { setMessage("Authentication is not configured."); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) setMessage(error.message);
    else await navigate({ to: "/digital-products" });
    setBusy(false);
  }

  async function magic() {
    setBusy(true); setMessage("");
    if (!supabase) { setMessage("Authentication is not configured."); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: "https://dashboard.resofit.fit/ceo-growth" },
    });
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
    setBusy(false);
  }

  return <AuthShell title="Sign in" subtitle="Access your ResoFit production dashboard.">
    <form onSubmit={submit} className="space-y-3">
      <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none" />
      <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none" />
      <button disabled={busy} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <button onClick={()=>void magic()} disabled={busy||!email.trim()} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium disabled:opacity-40">Send secure magic link</button>
    {message && <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">{message}</p>}
    <div className="mt-5 flex flex-wrap justify-between gap-3 text-xs text-white/55">
      <Link to="/signup" className="hover:text-white">Create account</Link>
      <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
    </div>
  </AuthShell>;
}

function AuthShell({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) {
  return <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">ResoFit Digital Factory</div><h1 className="mt-3 text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-white/50">{subtitle}</p><div className="mt-6">{children}</div><Link to="/digital-products" className="mt-6 block text-center text-xs text-white/35 hover:text-white">Back to factory</Link></div></main>;
}
