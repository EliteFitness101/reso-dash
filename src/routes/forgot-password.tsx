import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage(){
 const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");if(!supabase){setMessage("Authentication is not configured.");setBusy(false);return}const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+"/reset-password"});setMessage(error?error.message:"If the account exists, a password recovery link has been sent.");setBusy(false);}
 return <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">ResoFit Digital Factory</div><h1 className="mt-3 text-2xl font-semibold">Recover access</h1><p className="mt-2 text-sm text-white/50">Enter your account email and we’ll send a secure password-reset link.</p><form onSubmit={submit} className="mt-6 space-y-3"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/><button disabled={busy} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy?"Sending…":"Send recovery link"}</button></form>{message&&<p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">{message}</p>}<Link to="/login" className="mt-5 block text-center text-xs text-white/55 hover:text-white">Back to sign in</Link></div></main>;
}
