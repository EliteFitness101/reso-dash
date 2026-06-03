import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {}
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-gold active:bg-card"
      aria-label={`${label} to clipboard`}
    >
      {done ? <Check size={12} className="text-gold" /> : <Copy size={12} />}
      {done ? "Copied" : label}
    </button>
  );
}
