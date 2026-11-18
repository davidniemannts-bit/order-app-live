import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/use-restaurant";
import { canUse } from "@/lib/plans";
import { errorMessage } from "@/lib/format";
import { ProLock } from "@/components/app/ProLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/$id/pages")({
  component: PagesPage,
});

const FIELDS = ["headline", "welcome_text", "address", "phone", "opening_hours"] as const;
type Field = (typeof FIELDS)[number];

function PagesPage() {
  const { id } = Route.useParams();
  const { restaurant, plan } = useRestaurant(id);
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<Field, string>>({ headline: "", welcome_text: "", address: "", phone: "", opening_hours: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    setValues({
      headline: restaurant.headline ?? "",
      welcome_text: restaurant.welcome_text ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      opening_hours: restaurant.opening_hours ?? "",
    });
  }, [restaurant]);

  if (!restaurant) return null;
  const set = (k: Field) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const patch = Object.fromEntries(FIELDS.map((k) => [k, values[k].trim() || null]));
    const { error } = await supabase.from("restaurants").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    await qc.invalidateQueries({ queryKey: ["restaurant", id] });
    toast.success("Seite gespeichert");
  }

  return (
    <ProLock locked={!canUse(plan, "pages")} restaurantId={id}>
      <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold">Startseite deiner Kundenansicht</h2>
          <p className="text-sm text-muted-foreground">Diese Texte sehen deine Gäste ganz oben.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="headline">Überschrift</Label>
          <Input id="headline" maxLength={80} placeholder="Frisch. Hausgemacht. Für dich." value={values.headline} onChange={set("headline")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="welcome">Begrüßungstext</Label>
          <Textarea id="welcome" maxLength={400} rows={4} placeholder="Willkommen! Bestell bequem am Tisch oder zum Abholen." value={values.welcome_text} onChange={set("welcome_text")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" maxLength={160} placeholder="Hauptstraße 1, 10115 Berlin" value={values.address} onChange={set("address")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" maxLength={40} placeholder="030 123456" value={values.phone} onChange={set("phone")} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hours">Öffnungszeiten</Label>
          <Textarea id="hours" maxLength={300} rows={3} placeholder={"Mo–Fr 11–22 Uhr\nSa–So 12–23 Uhr"} value={values.opening_hours} onChange={set("opening_hours")} />
        </div>
        <div>
          <Button type="submit" variant="hero" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Speichern</Button>
        </div>
      </form>
    </ProLock>
  );
}
