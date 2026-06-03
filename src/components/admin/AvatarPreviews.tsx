import { CopyButton } from "./CopyButton";

function BuchiSvg() {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full">
      <defs>
        <linearGradient id="bg-b" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="gold-b" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#E6C45A" />
          <stop offset="100%" stopColor="#B8941F" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#bg-b)" />
      {/* shoulders */}
      <path d="M20 240 C30 170 70 150 100 150 C130 150 170 170 180 240 Z" fill="#fafafa" />
      {/* neck */}
      <rect x="88" y="118" width="24" height="34" rx="6" fill="#4a2e22" />
      {/* head */}
      <ellipse cx="100" cy="98" rx="32" ry="38" fill="#5a3826" />
      {/* turban */}
      <path d="M62 88 C62 60 138 60 138 88 C138 96 130 102 100 102 C70 102 62 96 62 88 Z" fill="#fafafa" />
      <path d="M64 84 C80 76 120 76 136 84" stroke="#d4d4d4" strokeWidth="1.2" fill="none" />
      {/* face details */}
      <circle cx="90" cy="104" r="2" fill="#1a1a1a" />
      <circle cx="110" cy="104" r="2" fill="#1a1a1a" />
      <path d="M92 120 Q100 124 108 120" stroke="#2a1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* compression top straps */}
      <path d="M82 152 L82 220" stroke="#e5e5e5" strokeWidth="1" />
      <path d="M118 152 L118 220" stroke="#e5e5e5" strokeWidth="1" />
      {/* gold accent */}
      <rect x="0" y="232" width="200" height="2" fill="url(#gold-b)" />
    </svg>
  );
}

function MaviaSvg() {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full">
      <defs>
        <linearGradient id="bg-m" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="gold-m" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#E6C45A" />
          <stop offset="100%" stopColor="#B8941F" />
        </linearGradient>
        <pattern id="ribbed" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#2d2d2d" />
          <path d="M0 0 L0 6" stroke="#3d3d3d" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="200" height="240" fill="url(#bg-m)" />
      {/* hourglass torso */}
      <path d="M55 240 C50 200 80 180 75 158 C73 152 73 152 80 150 L120 150 C127 152 127 152 125 158 C120 180 150 200 145 240 Z" fill="url(#ribbed)" />
      {/* neck */}
      <rect x="92" y="120" width="16" height="32" rx="5" fill="#7a4e35" />
      {/* head */}
      <ellipse cx="100" cy="100" rx="28" ry="34" fill="#8b5a3c" />
      {/* head wrap */}
      <path d="M68 92 C68 60 132 60 132 92 C132 100 124 104 100 104 C76 104 68 100 68 92 Z" fill="#fafafa" />
      <path d="M70 78 C80 86 120 86 130 78" stroke="#e0e0e0" strokeWidth="1" fill="none" />
      <path d="M132 80 L140 70 L138 90 Z" fill="#fafafa" />
      {/* face details */}
      <circle cx="92" cy="106" r="1.8" fill="#1a1a1a" />
      <circle cx="108" cy="106" r="1.8" fill="#1a1a1a" />
      <path d="M94 120 Q100 123 106 120" stroke="#2a1810" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* gold seam */}
      <path d="M100 152 L100 240" stroke="url(#gold-m)" strokeWidth="0.8" opacity="0.6" />
      <rect x="0" y="232" width="200" height="2" fill="url(#gold-m)" />
    </svg>
  );
}

const buchiScript = `[00:00] OPEN — Coach Buchi, hands chalked, white turban catching obsidian light.
[00:03] VO: "ResoFit isn't a brand. It's a standard."
[00:08] CUT — 1,000kg Batch 1 plates locking into Smart Adjustable Bench.
[00:14] VO: "Built once. Engineered to outlive trends."
[00:20] LOGO — LuxeGold mark settles over matte black.`;

const maviaScript = `[00:00] OPEN — Mavia, charcoal ribbed activewear, white wrap, mid-step on treadmill.
[00:04] VO: "Discipline is the aesthetic."
[00:09] CUT — Mid-bicep tape measure, weekly delta projected.
[00:15] VO: "Sunday isn't rest. It's the audit."
[00:20] CTA — Operate on ResoFlex OS.`;

export function AvatarPreviews() {
  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Module · 03</p>
          <h3 className="font-display text-base font-semibold">Autonomous Media Factory</h3>
        </div>
        <CopyButton value={`${buchiScript}\n\n---\n\n${maviaScript}`} label="Copy All" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { name: "Coach Buchi", role: "CEO", node: <BuchiSvg /> },
          { name: "Mavia", role: "Aesthetic Lead", node: <MaviaSvg /> },
        ].map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl border border-border bg-background/50">
            <div className="aspect-[5/6] w-full">{p.node}</div>
            <div className="border-t border-border p-2">
              <p className="font-display text-xs font-semibold leading-tight text-foreground">{p.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{p.role}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {[
          { name: "Buchi · Spot v1", body: buchiScript },
          { name: "Mavia · Spot v1", body: maviaScript },
        ].map((s) => (
          <div key={s.name} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-gold">{s.name}</p>
              <CopyButton value={s.body} label="Script" />
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">{s.body}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
