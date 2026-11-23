import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Crown, Loader2, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { createRestaurant } from "@/lib/restaurant.functions";
import { myRestaurantsQuery } from "@/lib/queries";
import { errorMessage, slugify, SLUG_PATTERN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app/AppHeader";
import { PlanBadge } from "@/components/app/PlanBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Meine Restaurants – OrderApp Free" },
      { name: "description", content: "Verwalte deine Restaurants, Speisekarten und Bestellungen." },
      { property: "og:title", content: "Meine Restaurants – OrderApp Free" },
      { property: "og:description", content: "Restaurants verwalten mit OrderApp Free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: restaurants, isLoading } = useQuery(myRestaurantsQuery());
  const [creating, setCreating] = useState(false);
  const showForm = creating || (!isLoading && (restaurants?.length ?? 0) === 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Meine Restaurants</h1>
            <p className="mt-1 text-muted-foreground">Wähle ein Restaurant oder lege ein neues an.</p>
          </div>
          {!showForm && (
            <Button variant="hero" size="xl" onClick={() => setCreating(true)}>
              <Plus /> Neues Restaurant
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {(restaurants?.length ?? 0) > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants!.map((r) => (
                  <Link
                    key={r.id}
                    to="/admin/$id"
                    params={{ id: r.id }}
                    className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
                    style={{ ["--brand" as string]: r.primary_color, ["--brand-2" as string]: r.accent_color }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />
                    <div className="flex items-center gap-3">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-lg font-black text-brand-foreground">
                          {r.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-lg font-extrabold">{r.name}</div>
                        <div className="truncate text-xs text-muted-foreground">/r/{r.slug}</div>
                      </div>
                      <PlanBadge plan={r.plan} />
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-blue">
                      Verwalten <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {showForm && (
              <CreateRestaurant
                onCancel={(restaurants?.length ?? 0) > 0 ? () => setCreating(false) : undefined}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CreateRestaurant({ onCancel }: { onCancel?: (() => void) | undefined }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<"basic" | "pro">("basic");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createRestaurant);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const slugValid = SLUG_PATTERN.test(effectiveSlug);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slugValid) { toast.error("Bitte eine gültige Web-Adresse wählen (mind. 3 Zeichen, a–z, 0–9, -)."); return; }
    if (plan === "pro" && !code.trim()) { toast.error("Bitte gib deinen Pro-Code ein."); return; }
    setBusy(true);
    try {
      const res = await create({ data: { name, slug: effectiveSlug, plan, code: plan === "pro" ? code : undefined } });
      await qc.invalidateQueries({ queryKey: ["my-restaurants"] });
      toast.success(plan === "pro" ? "Pro-Restaurant angelegt!" : "Restaurant angelegt!");
      navigate({ to: "/admin/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const plans = [
    {
      id: "basic" as const,
      title: "Basic",
      price: "Kostenlos",
      features: ["Bestellungen live empfangen", "Tisch, Abholung, Lieferung & Personal", "Speisekarte bearbeiten", "Kundenansicht"],
    },
    {
      id: "pro" as const,
      title: "Pro",
      price: "Mit Pro-Code",
      features: ["Alles aus Basic", "Eigenes Logo", "Eigene Farben", "Hintergrundbild", "Seitentexte bearbeiten"],
    },
  ];

  return (
    <form onSubmit={onSubmit} className="mt-8 rounded-3xl border bg-card p-6 shadow-card sm:p-10 animate-pop-in">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"><Store className="h-5 w-5" /></span>
        <h2 className="text-2xl font-extrabold tracking-tight">Restaurant anlegen</h2>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rname">Name des Restaurants</Label>
          <Input id="rname" required minLength={2} maxLength={80} placeholder="z. B. Trattoria Sole" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rslug">Web-Adresse</Label>
          <div className="flex h-12 items-center rounded-md border border-input bg-background pl-3 focus-within:ring-1 focus-within:ring-ring">
            <span className="text-sm text-muted-foreground">/r/</span>
            <input
              id="rslug"
              className="h-full flex-1 bg-transparent px-1 text-sm outline-none"
              placeholder="trattoria-sole"
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
            />
          </div>
          {effectiveSlug && !slugValid && <p className="text-xs text-destructive">Mind. 3 Zeichen, nur a–z, 0–9 und Bindestrich.</p>}
        </div>
      </div>

      <div className="mt-8">
        <Label>Paket wählen</Label>
        <div className="mt-3 grid gap-4 md:grid-cols-2" role="radiogroup">
          {plans.map((p) => {
            const active = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPlan(p.id)}
                className={cn(
                  "relative rounded-2xl border-2 p-5 text-left transition",
                  active ? (p.id === "pro" ? "border-pro bg-pro/10 shadow-card" : "border-brand-blue bg-brand-blue/5 shadow-card") : "border-border hover:border-muted-foreground/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.id === "pro" && <Crown className="h-5 w-5 text-pro" />}
                    <span className="font-display text-xl font-extrabold">{p.title}</span>
                  </div>
                  <PlanBadge plan={p.id} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{p.price}</div>
                <ul className="mt-4 grid gap-1.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {f}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        {plan === "pro" && (
          <div className="mt-4 grid max-w-md gap-2 animate-pop-in">
            <Label htmlFor="procode">Pro-Code</Label>
            <Input id="procode" placeholder="Dein Pro-Code" value={code} onChange={(e) => setCode(e.target.value)} className="h-12" autoComplete="off" />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="submit" variant={plan === "pro" ? "pro" : "hero"} size="xl" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Restaurant anlegen
        </Button>
        {onCancel && <Button type="button" variant="ghost" size="xl" onClick={onCancel}>Abbrechen</Button>}
      </div>
    </form>
  );
}
