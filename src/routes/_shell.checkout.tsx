import { createFileRoute } from "@tanstack/react-router";

const COMMERCE_URL =
  import.meta.env.VITE_COMMERCE_URL || "https://store.resofit.fit/";

export const Route = createFileRoute("/_shell/checkout")({
  component: CommerceRedirect,
});

function CommerceRedirect() {
  const target = new URL(COMMERCE_URL);
  target.searchParams.set("source", "reso-dash");
  target.searchParams.set("surface", "personal-trainer");
  target.searchParams.set("intent", "upgrade");

  if (typeof window !== "undefined") {
    window.location.replace(target.toString());
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ResoFit Commerce
        </p>
        <h1 className="mt-3 text-2xl font-bold">Taking you to secure checkout…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Checkout is handled by the canonical ResoFlex commerce layer.
        </p>
        <a
          href={target.toString()}
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Continue to secure checkout
        </a>
      </section>
    </main>
  );
}
