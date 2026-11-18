import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/use-restaurant";
import { uploadRestaurantImage } from "@/lib/upload";
import { canUse } from "@/lib/plans";
import { errorMessage, readableOn } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProLock } from "@/components/app/ProLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/$id/design")({
  component: DesignPage,
});

const PRESETS: [string, string, string][] = [
  ["Tomate", "#ff4d2e", "#ffb800"],
  ["Lagune", "#0ea5e9", "#22d3ee"],
  ["Basilikum", "#16a34a", "#a3e635"],
  ["Beere", "#db2777", "#f97316"],
  ["Nacht", "#1e3a8a", "#f59e0b"],
  ["Lavendel", "#7c3aed", "#f472b6"],
];

function DesignPage() {
  const { id } = Route.useParams();
  const { restaurant, plan } = useRestaurant(id);
  const qc = useQueryClient();
  const [primary, setPrimary] = useState("#ff4d2e");
  const [accent, setAccent] = useState("#ffb800");
  const [logo, setLogo] = useState<string | null>(null);
  const [bg, setBg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const locked = !canUse(plan, "branding");

  useEffect(() => {
    if (!restaurant) return;
    setPrimary(restaurant.primary_color);
    setAccent(restaurant.accent_color);
    setLogo(restaurant.logo_url);
    setBg(restaurant.background_url);
  }, [restaurant]);

  if (!restaurant) return null;

  async function save(patch: Record<string, string | null>, label: string) {
    setBusy(label);
    const { error } = await supabase.from("restaurants").update(patch).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(errorMessage(error));
      return false;
    }
    await qc.invalidateQueries({ queryKey: ["restaurant", id] });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
    toast.success("Gespeichert");
    return true;
  }

  async function onUpload(kind: "logo" | "background", file: File | undefined) {
    if (!file) return;
    setBusy(kind);
    try {
      const url = await uploadRestaurantImage(id, kind, file);
      const ok = await save(kind === "logo" ? { logo_url: url } : { background_url: url }, kind);
      if (ok) kind === "logo" ? setLogo(url) : setBg(url);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const previewStyle = {
    ["--brand" as string]: primary,
    ["--brand-2" as string]: accent,
    ["--brand-foreground" as string]: readableOn(primary),
  };

  return (
    <ProLock locked={locked} restaurantId={id}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-extrabold">Logo</h2>
            <p className="text-sm text-muted-foreground">Quadratisch wirkt am besten. PNG oder JPG, max. 5 MB.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {logo ? (
                <img src={logo} alt="Logo" className="h-24 w-24 rounded-2xl object-cover shadow-card" />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-dashed text-muted-foreground"><ImagePlus /></span>
              )}
              <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload("logo", e.target.files?.[0])} />
              <Button variant="hero" onClick={() => logoInput.current?.click()} disabled={busy !== null}>
                {busy === "logo" ? <Loader2 className="animate-spin" /> : <ImagePlus />} Logo hochladen
              </Button>
              {logo && (
                <Button variant="ghost" onClick={async () => (await save({ logo_url: null }, "logo")) && setLogo(null)} disabled={busy !== null}>
                  <Trash2 /> Entfernen
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-extrabold">Farben</h2>
            <p className="text-sm text-muted-foreground">Wähle eine Vorlage oder eigene Farben für deine Kundenansicht.</p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {PRESETS.map(([name, p, a]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => { setPrimary(p); setAccent(a); }}
                  className={cn("rounded-xl border-2 p-2 text-xs font-semibold transition", primary === p && accent === a ? "border-foreground" : "border-transparent hover:border-border")}
                  style={{ ["--brand" as string]: p, ["--brand-2" as string]: a }}
                >
                  <span className="block h-10 rounded-lg bg-gradient-brand" />
                  <span className="mt-1 block">{name}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ColorField id="primary" label="Hauptfarbe" value={primary} onChange={setPrimary} />
              <ColorField id="accent" label="Akzentfarbe" value={accent} onChange={setAccent} />
            </div>
            <Button className="mt-5" variant="hero" disabled={busy !== null} onClick={() => save({ primary_color: primary, accent_color: accent }, "colors")}>
              {busy === "colors" && <Loader2 className="animate-spin" />} Farben speichern
            </Button>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-extrabold">Hintergrundbild</h2>
            <p className="text-sm text-muted-foreground">Erscheint groß oben in deiner Kundenansicht. Querformat, max. 5 MB.</p>
            <div className="mt-4">
              {bg ? (
                <img src={bg} alt="Hintergrund" className="aspect-[16/7] w-full rounded-2xl object-cover shadow-card" />
              ) : (
                <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl border-2 border-dashed text-muted-foreground"><ImagePlus /></div>
              )}
              <input ref={bgInput} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload("background", e.target.files?.[0])} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="hero" onClick={() => bgInput.current?.click()} disabled={busy !== null}>
                  {busy === "background" ? <Loader2 className="animate-spin" /> : <ImagePlus />} Bild hochladen
                </Button>
                {bg && (
                  <Button variant="ghost" onClick={async () => (await save({ background_url: null }, "background")) && setBg(null)} disabled={busy !== null}>
                    <Trash2 /> Entfernen
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="text-sm font-semibold text-muted-foreground">Vorschau</div>
          <div className="mt-2 overflow-hidden rounded-3xl border shadow-pop customer-canvas" style={previewStyle}>
            <div className="relative h-36 bg-gradient-brand">
              {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
            </div>
            <div className="-mt-10 px-5 pb-6">
              {logo ? (
                <img src={logo} alt="" className="relative h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-card" />
              ) : (
                <span className="relative grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-gradient-brand text-3xl font-black text-brand-foreground shadow-card">
                  {restaurant.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="mt-3 font-display text-2xl font-black">{restaurant.name}</div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-foreground">Pizza</span>
                <span className="rounded-full bg-brand-2-soft px-3 py-1 text-xs font-bold">Getränke</span>
              </div>
              <Button variant="brand" className="mt-4 w-full">Bestellen</Button>
            </div>
          </div>
        </aside>
      </div>
    </ProLock>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-md border bg-background p-1" />
        <Input value={value} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} className="h-11 font-mono uppercase" />
      </div>
    </div>
  );
}
