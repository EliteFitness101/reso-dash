import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Sex = "male" | "female";
export type Goal = "cut" | "recomp" | "bulk";
export type Experience = "novice" | "intermediate" | "advanced";
export type Location = "gym" | "home" | "hybrid";

export interface Intake {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  restrictions: string[]; // e.g. ["onions","dairy"]
  cuisine: string;
  mealsPerDay: number;
  location: Location;
  equipment: string[];
}

export interface SubscriberProfile {
  rsid: string;
  reference: string;
  createdAt: string;
  amountPaid: number; // kobo
  product: string;
  intake?: Intake;
  upsells: string[]; // productIds
}

interface ProfileStore {
  current: SubscriberProfile | null;
  all: SubscriberProfile[];
  upsert: (p: SubscriberProfile) => void;
  setIntake: (intake: Intake) => void;
  addUpsell: (productId: string) => void;
  setCurrentByRsid: (rsid: string) => void;
  clear: () => void;
}

const Ctx = createContext<ProfileStore | null>(null);
const KEY = "resoflex.subscribers.v1";
const CUR_KEY = "resoflex.subscribers.current.v1";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<SubscriberProfile[]>([]);
  const [currentRsid, setCurrentRsid] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAll(JSON.parse(raw));
      const cur = localStorage.getItem(CUR_KEY);
      if (cur) setCurrentRsid(cur);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
  }, [all]);

  useEffect(() => {
    try {
      if (currentRsid) localStorage.setItem(CUR_KEY, currentRsid);
    } catch {}
  }, [currentRsid]);

  const value = useMemo<ProfileStore>(() => {
    const current = all.find((p) => p.rsid === currentRsid) ?? null;
    return {
      current,
      all,
      upsert: (p) => {
        setAll((prev) => {
          const idx = prev.findIndex((x) => x.rsid === p.rsid);
          if (idx === -1) return [p, ...prev];
          const next = [...prev];
          next[idx] = { ...next[idx], ...p };
          return next;
        });
        setCurrentRsid(p.rsid);
      },
      setIntake: (intake) => {
        if (!currentRsid) return;
        setAll((prev) =>
          prev.map((p) => (p.rsid === currentRsid ? { ...p, intake } : p)),
        );
      },
      addUpsell: (productId) => {
        if (!currentRsid) return;
        setAll((prev) =>
          prev.map((p) =>
            p.rsid === currentRsid && !p.upsells.includes(productId)
              ? { ...p, upsells: [...p.upsells, productId] }
              : p,
          ),
        );
      },
      setCurrentByRsid: (rsid) => setCurrentRsid(rsid),
      clear: () => {
        setAll([]);
        setCurrentRsid(null);
        try {
          localStorage.removeItem(KEY);
          localStorage.removeItem(CUR_KEY);
        } catch {}
      },
    };
  }, [all, currentRsid]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfileStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfileStore must be inside ProfileProvider");
  return v;
}
