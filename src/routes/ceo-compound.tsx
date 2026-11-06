import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BatteryCharging, CalendarDays, CheckCircle2, ChevronRight, Dumbbell, Flower2, Leaf, LockKeyhole, Plus, Save, ShieldCheck, Sprout, Sun, TreePine, Utensils, Video, Wheat, Zap } from "lucide-react";
import { AccessGate } from "@/components/AccessGate";
import { CEOAccessMFA } from "@/components/CEOAccessMFA";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/ceo-compound")({ component: CompoundRoute });

type CompoundRecord = {
  id: string;
  record_type: string;
  title: string;
  payload: Record<string, unknown>;
  created_at: string;
};

const visualSets = [
  {
    title: "The compound",
    description: "Aerial reference for the entrance, mature canopy, lawn and quiet garden zones.",
    images: [
      { src: "https://mindtrip.ai/locations/92ff/f099/7d09/7668/8c57/a610/1d51/efa6", alt: "Aerial view of a tropical walled compound with driveway and mature trees", source: "Mindtrip · Okeigbo" },
      { src: "https://sariuspalmetum.com/assets/garden-area-2-BjQ0aNiA.webp", alt: "Aerial view of a lush tropical garden with paths and palms", source: "Sarius Palmetum" },
    ],
  },
  {
    title: "Garden egg enterprise",
    description: "Crop-row reference for bed layout, mulch, access lanes and irrigation.",
    images: [
      { src: "https://indeegenus.com/cdn/shop/files/fresh-green-garden-eggs-6012512_1800x1800.jpg?v=1782965467", alt: "Rows of green garden egg plants in a cultivated field", source: "Indeegenus" },
      { src: "https://trueloveseeds.com/cdn/shop/files/nyanyachungu_2048x.jpg?v=1712196225", alt: "African eggplant plants in mulched rows", source: "Truelove Seeds" },
    ],
  },
  {
    title: "Plantain plantation",
    description: "Plant spacing, access lanes and understory ground cover reference.",
    images: [
      { src: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/26850593535_aae3774316_k.jpg", alt: "Plantain trees growing in orderly tropical farm rows", source: "USGS" },
      { src: "https://static.wixstatic.com/media/3238a8_57287b6c40704f26b1f41e33c6c20990~mv2.png/v1/fill/w_980%2Ch_551%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/3238a8_57287b6c40704f26b1f41e33c6c20990~mv2.png", alt: "Banana plantation rows with drip irrigation", source: "Thai Tissues" },
    ],
  },
  {
    title: "Solar and energy",
    description: "Reference for rooftop panels, inverter placement and household energy resilience.",
    images: [
      { src: "https://xnergs.in/wp-content/uploads/2025/10/install-solar-power-at-home-1024x683.jpg", alt: "Home rooftop solar panels and inverter installation", source: "Xnergs" },
      { src: "https://solgenindia.com/wp-content/uploads/2025/05/a-modern-solar-inverter-system-installed_xfg9-xbETsCUu6EWrWq89g_CXL20xDlQ0SfOQuyOsxzKQ.png", alt: "Solar inverter and rooftop panels beside a tropical garden", source: "Solgen India" },
    ],
  },
];

const workouts = [
  { day: "MON", title: "Upper strength A", focus: "Bench press · row · shoulder press · arms", detail: "3–4 sets each · 6–12 reps · leave 1–3 reps in reserve" },
  { day: "TUE", title: "Lower strength A", focus: "Squat pattern · hinge · split squat · core", detail: "Use controlled loads; no heavy barbell squat without rack and safeties" },
  { day: "THU", title: "Upper strength B", focus: "Incline press · pull · lateral raise · arms", detail: "Progress reps before load; keep shoulders and wrists pain-free" },
  { day: "SAT", title: "Lower strength B", focus: "Romanian deadlift · lunge · glutes · calves", detail: "80 kg is total available equipment, not a prescribed working weight" },
];

const meals = [
  ["Breakfast", "Oats + eggs + banana", "Protein, fibre and steady energy"],
  ["Lunch", "Rice + beans + mackerel + vegetables", "Economical protein and carbohydrates"],
  ["Snack", "Groundnuts + fruit or yoghurt", "Convenient calories and micronutrients"],
  ["Dinner", "Sweet potato or yam + eggs / beans + greens", "Recovery meal with flexible portions"],
];

function CompoundRoute() {
  return <AccessGate><CompoundAccess /></AccessGate>;
}

function CompoundAccess() {
  const { user, isSuperAdmin, twoFactorVerified } = useAuth();
  if (!isSuperAdmin) return <div className="min-h-dvh bg-white p-6 text-slate-900"><div className="mx-auto max-w-md rounded-3xl border border-slate-200 p-6"><LockKeyhole className="mb-3 text-slate-500" /><h1 className="text-xl font-semibold">Owner access only</h1><p className="mt-2 text-sm text-slate-600">This private compound and personal training workspace is restricted to the verified super-admin account.</p></div></div>;
  if (!twoFactorVerified) return <CEOAccessMFA />;
  return <CompoundDashboard userId={user?.id ?? ""} />;
}

function CompoundDashboard({ userId }: { userId: string }) {
  const [records, setRecords] = useState<CompoundRecord[]>([]);
  const [note, setNote] = useState("");
  const [waistUnit, setWaistUnit] = useState<"in" | "cm" | "">("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [activeImage, setActiveImage] = useState<Record<string, number>>({});
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!supabase || !userId) return;
    void supabase.from("ceo_compound_records").select("id,record_type,title,payload,created_at").eq("owner_user_id", userId).order("updated_at", { ascending: false }).limit(100).then(({ data, error }) => {
      if (error) setStatus("Saved records could not be loaded. Your workspace remains usable.");
      else setRecords((data ?? []) as CompoundRecord[]);
    });
  }, [userId]);

  const latestNote = useMemo(() => records.find((record) => record.record_type === "task"), [records]);

  async function saveNote() {
    const title = note.trim();
    if (!title || !supabase || !userId) return;
    setSaving(true);
    setStatus("");
    const { data, error } = await supabase.from("ceo_compound_records").insert({
      owner_user_id: userId,
      record_type: "task",
      title,
      payload: { source: "ceo-compound-v1.0.1", status: "open" },
    }).select("id,record_type,title,payload,created_at").single();
    if (error) setStatus("Save failed: " + error.message);
    else {
      setRecords((current) => [data as CompoundRecord, ...current]);
      setNote("");
      setStatus("Saved to your private compound workspace.");
    }
    setSaving(false);
  }

  async function generateVideo() {
    if (!supabase) return;
    setVideoBusy(true);
    setVideoError("");
    setStatus("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Secure sign-in session not found.");
      const response = await fetch("/api/ceo-compound-video", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Cinematic 8-second 16:9 establishing shot for a private Nigerian ancestral villa compound: preserve existing mature tropical trees, sweeping clean driveway, natural stone walkways, flowering hibiscus borders, productive garden egg beds and plantain rows. Lush but realistic West African landscape, warm late-afternoon natural light, premium architectural landscape film, smooth slow drone glide, no text, no logos, no invented buildings.",
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gemini video generation returned HTTP " + response.status);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : "Video generation failed.");
    } finally {
      setVideoBusy(false);
    }
  }

  const nav = [
    ["overview", "Overview"], ["training", "Training"], ["nutrition", "Nutrition"],
    ["compound", "Compound"], ["farm", "Farm"], ["solar", "Solar"], ["review", "CEO log"],
  ];

  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1.15fr_.85fr] md:p-9">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-700">ResoFit · Personal command</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Compound &amp; Performance</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">One private operating view for strength, nutrition, the ancestral compound, productive gardens and home energy.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">v1.0.1</span>
                <span className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">White canvas · mobile-first</span>
                <span className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">Private · MFA protected</span>
              </div>
            </div>
            <div className="relative min-h-56 overflow-hidden rounded-3xl bg-emerald-50">
              <img src={visualSets[0].images[0].src} alt={visualSets[0].images[0].alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white"><p className="text-[10px] uppercase tracking-[.2em] text-white/80">Landscape reference</p><p className="mt-1 text-lg font-semibold">Protect the canopy. Grow the estate.</p></div>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 [scrollbar-width:none]">
            {nav.map(([key, label]) => <button key={key} onClick={() => { setTab(key); document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={"shrink-0 rounded-full px-4 py-2 text-xs font-semibold " + (tab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{label}</button>)}
          </nav>
        </header>

        {status && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{status}</p>}

        <section id="overview" className="scroll-mt-6 pt-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-emerald-700">Owner snapshot</p><h2 className="mt-1 text-2xl font-semibold">Baseline &amp; priorities</h2></div><span className="text-xs text-slate-500">Personal profile · editable</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Age" value="36 years" />
            <Stat label="Height" value="175 cm" />
            <Stat label="Body mass" value="78 kg" />
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Waist measurement</p><p className="mt-2 text-2xl font-semibold text-slate-950">40</p><p className="mt-1 text-xs text-amber-900">Unit required before interpretation</p><div className="mt-3 flex gap-2"><button onClick={() => setWaistUnit("in")} className={"rounded-full px-3 py-1.5 text-xs " + (waistUnit === "in" ? "bg-amber-800 text-white" : "border border-amber-300 text-amber-900")}>Inches</button><button onClick={() => setWaistUnit("cm")} className={"rounded-full px-3 py-1.5 text-xs " + (waistUnit === "cm" ? "bg-amber-800 text-white" : "border border-amber-300 text-amber-900")}>Centimetres</button></div></div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <InfoCard icon={<Activity />} title="Primary outcome" text="Lean bulk with strength progression, recovery and waist trend monitored together." />
            <InfoCard icon={<CalendarDays />} title="Weekly rhythm" text="Four strength days, two Muay Thai technique / conditioning sessions and one recovery day." />
            <InfoCard icon={<ShieldCheck />} title="Training safety" text="80 kg is available total loading, not a target. No heavy bench or squat without appropriate safeties and a spotter." />
          </div>
          {waistUnit === "in" && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">40 inches is a substantial waist measurement. Use a controlled recomposition phase rather than an aggressive calorie surplus; confirm the measurement and track the trend.</p>}
          {waistUnit === "cm" && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">40 cm is unusually small for an adult waist measurement. Recheck the value and measurement method before using it.</p>}
        </section>

        <section id="training" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Strength & conditioning" title="Four-day strength split" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workouts.map((workout) => <article key={workout.day} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-800">{workout.day}</span><Dumbbell size={18} className="text-emerald-700" /></div><h3 className="mt-3 text-lg font-semibold">{workout.title}</h3><p className="mt-1 text-sm text-slate-700">{workout.focus}</p><p className="mt-2 text-xs leading-5 text-slate-500">{workout.detail}</p></article>)}
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-5"><div className="flex items-center gap-2"><Activity className="text-emerald-700" size={18}/><h3 className="font-semibold">Muay Thai · two weekly sessions</h3></div><p className="mt-2 text-sm leading-6 text-slate-600">Technique, stance, footwork, shadowboxing, rope intervals and controlled pad work. Keep hard sparring supervised; separate intense conditioning from heavy lower-body sessions.</p></div>
        </section>

        <section id="nutrition" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Food strategy" title="Economical Nigerian lean-bulk menu" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><Stat label="Starting energy estimate" value="2,400 kcal" /><Stat label="Protein target" value="150 g" /><Stat label="Carbs / fat" value="290 g / 70 g" /></div>
          <p className="mt-2 text-xs text-slate-500">Editable starting estimate, not a clinical prescription. Macro arithmetic is approximately 2,390 kcal. Adjust after 14 days using average body-mass trend, waist, strength and recovery.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{meals.map(([name, meal, detail]) => <div key={name} className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{name}</p><h3 className="mt-2 font-semibold">{meal}</h3><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}</div>
        </section>

        <section id="compound" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Estate restoration" title="Compound, trees & landscape" />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Preserve mature ancestral trees and their root zones first. Plan the entrance, driveway, turning area, walkways, shade garden, flower borders, nursery, compost and drainage around existing site conditions.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoCard icon={<TreePine />} title="Mature tree sanctuary" text="Inventory each tree: species if known, trunk condition, canopy spread, root zone, shade footprint, health and preservation needs." /><InfoCard icon={<Flower2 />} title="Flowers & pollinator borders" text="Use hibiscus, bougainvillea, ixora, allamanda and suitable native pollinator plants, matched to sun, shade and water." /><InfoCard icon={<ArrowRight />} title="Driveway & pathways" text="Map gate-to-house access, turning radius, runoff, non-slip stone or gravel paths, low-glare lighting and step-free routes." /><InfoCard icon={<Leaf />} title="Soil & water" text="Protect roots, mulch beds, compost on site and route stormwater away from foundations and tree trunks." /></div>
          <MediaCarousel sets={visualSets.slice(0,1)} activeImage={activeImage} setActiveImage={setActiveImage} />
        </section>

        <section id="farm" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Productive landscape" title="Garden egg & plantain revenue" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoCard icon={<Sprout />} title="Garden egg enterprise" text="Track seed variety, nursery batches, transplant date, bed count, irrigation, pest checks, harvest weight, grade, sales and input costs." /><InfoCard icon={<Wheat />} title="Plantain plantation" text="Track mother plants and suckers, spacing, mulch, desuckering, bunch count, harvest date, buyer, transport and net margin." /></div>
          <MediaCarousel sets={visualSets.slice(1,3)} activeImage={activeImage} setActiveImage={setActiveImage} />
        </section>

        <section id="solar" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Home resilience" title="Solar & iPhone operations" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><InfoCard icon={<Sun />} title="Generation" text="Log PV output, peak sunlight hours and daily kWh." /><InfoCard icon={<BatteryCharging />} title="Storage" text="Track inverter state, battery percentage, charge cycles and backup runtime." /><InfoCard icon={<Zap />} title="Critical loads" text="Prioritise router, iPhone, lighting, security and essential refrigeration." /></div>
          <MediaCarousel sets={visualSets.slice(3)} activeImage={activeImage} setActiveImage={setActiveImage} />
        </section>

        <section id="review" className="scroll-mt-6 pt-9">
          <SectionHeading eyebrow="Weekly CEO review" title="Capture decisions and next actions" />
          <div className="mt-4 rounded-3xl border border-slate-200 p-5 shadow-sm">
            <label htmlFor="ceo-note" className="text-sm font-semibold">Add a compound, training, farm or solar action</label>
            <textarea id="ceo-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="e.g. Map the garden egg beds and record the available irrigation point…" className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            <button onClick={() => void saveNote()} disabled={!note.trim() || saving} className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40"><Save size={15}/>{saving ? "Saving…" : "Save private action"}</button>
            {latestNote && <p className="mt-3 text-xs text-slate-500">Latest saved: {latestNote.title}</p>}
          </div>
          <div className="mt-4 space-y-2">{records.filter((record) => record.record_type === "task").map((record) => <div key={record.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><CheckCircle2 className="mt-0.5 text-emerald-700" size={17}/><div><p className="text-sm font-medium">{record.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(record.created_at).toLocaleString()}</p></div></div>)}</div>
        </section>

        <section className="mt-9 rounded-3xl bg-slate-50 p-5 sm:p-7">
          <div className="flex items-center gap-2"><Video className="text-emerald-700" size={19}/><p className="text-[10px] font-bold uppercase tracking-[.25em] text-emerald-700">Gemini video studio</p></div>
          <h2 className="mt-2 text-xl font-semibold">Create the missing compound film</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">No verified compound video URL was found in the audited assets. This action uses the server-side Gemini Omni Flash video endpoint; the API key is never sent to the browser. Generated previews are session-only until media storage/readback is wired and verified.</p>
          <button onClick={() => void generateVideo()} disabled={videoBusy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"><Video size={15}/>{videoBusy ? "Generating video…" : "Generate compound video preview"}<ChevronRight size={15}/></button>
          {videoError && <p className="mt-3 text-sm text-red-700" role="alert">{videoError}</p>}
          {videoUrl && <video className="mt-4 w-full rounded-2xl bg-black" controls playsInline src={videoUrl} />}
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>ResoFit · CEO Compound v1.0.1</span><span>White canvas · owner-scoped records · MFA gate</span></footer>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-emerald-700">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2></div>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div>;
}
function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-emerald-700">{icon}<h3 className="text-sm font-semibold text-slate-900">{title}</h3></div><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}
function MediaCarousel({ sets, activeImage, setActiveImage }: { sets: typeof visualSets; activeImage: Record<string, number>; setActiveImage: (value: Record<string, number>) => void }) {
  return <div className="mt-5 space-y-5">{sets.map((set) => <div key={set.title}><div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="font-semibold">{set.title}</h3><p className="mt-1 text-xs text-slate-500">{set.description}</p></div><span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Swipe →</span></div><div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">{set.images.map((image, index) => <figure key={image.src} className="w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white sm:w-[48%]"><img src={image.src} alt={image.alt} loading="lazy" className="h-52 w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /><figcaption className="p-3"><p className="text-xs font-medium text-slate-800">{image.alt}</p><p className="mt-1 text-[10px] text-slate-500">Reference image · {image.source}</p></figcaption></figure>)}</div></div>)}</div>;
}
