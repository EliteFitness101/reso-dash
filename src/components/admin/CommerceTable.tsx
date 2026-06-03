import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { toSeoSlug } from "@/lib/slug";

type SyncState = "Synced" | "Pending" | "Drift";
interface Row {
  sku: string;
  title: string;
  channel: string;
  inventory: string;
  sync: SyncState;
}

const initial: Row[] = [
  { sku: "RF-HDP-1000", title: "1,000 kg Batch 1 High-Density Weight Plates", channel: "shop.resofit.fit", inventory: "In Stock · 1000kg", sync: "Synced" },
  { sku: "RF-SAB-021", title: "Smart Adjustable Benches", channel: "store.resofit.fit", inventory: "Low · 12 units", sync: "Pending" },
  { sku: "RF-ATE-007", title: "Advanced Treadmill Ecosystems", channel: "resofit.fit/store", inventory: "Pre-Order · 04", sync: "Drift" },
];

const syncTone: Record<SyncState, string> = {
  Synced: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  Pending: "text-gold border-gold/40 bg-gold/5",
  Drift: "text-destructive border-destructive/40 bg-destructive/10",
};

export function CommerceTable() {
  const [rows, setRows] = useState(initial);
  const allJson = JSON.stringify(rows.map((r) => ({ ...r, slug: toSeoSlug(r.title, r.sku) })), null, 2);

  const triggerSync = (sku: string) => {
    setRows((rs) => rs.map((r) => (r.sku === sku ? { ...r, sync: "Synced" } : r)));
  };

  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Module · 01</p>
          <h3 className="font-display text-base font-semibold">Multi-Tenant Commerce Pipeline</h3>
        </div>
        <CopyButton value={allJson} label="Export JSON" />
      </div>

      <div className="mt-4 hidden grid-cols-12 gap-2 border-b border-border pb-2 text-[9px] uppercase tracking-widest text-muted-foreground sm:grid">
        <div className="col-span-2">SKU</div>
        <div className="col-span-3">Title</div>
        <div className="col-span-3">Channel</div>
        <div className="col-span-2">Inventory</div>
        <div className="col-span-1">Sync</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      <ul className="mt-3 space-y-3">
        {rows.map((r) => {
          const slug = toSeoSlug(r.title, r.sku);
          return (
            <li key={r.sku} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-gold/30 bg-gold/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold tabular">
                      {r.sku}
                    </span>
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${syncTone[r.sync]}`}>
                      {r.sync}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">/{slug}</p>
                </div>
                <CopyButton value={slug} label="Slug" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Channel</p>
                  <p className="mt-0.5 truncate font-mono text-foreground">{r.channel}</p>
                </div>
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Inventory</p>
                  <p className="mt-0.5 truncate text-foreground">{r.inventory}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={`https://${r.channel}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-gold hover:underline"
                >
                  Open Channel ↗
                </a>
                <button
                  onClick={() => triggerSync(r.sku)}
                  className="rounded-md gold-bg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                >
                  Force Sync
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
