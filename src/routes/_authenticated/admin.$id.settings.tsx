import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Crown, Download, Loader2, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/use-restaurant";
import { errorMessage } from "@/lib/format";
import { PlanBadge } from "@/components/app/PlanBadge";
import { ProCodeDialog } from "@/components/app/ProCodeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/$id/settings")({
  staticData: { sitemap: false },
  component: SettingsPage,
});

function SettingsPage() {
  const { id } = Route.useParams();
  const { restaurant, plan } = useRestaurant(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [table, setTable] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [delivery, setDelivery] = useState(false);
  const [fee, setFee] = useState("0");
  const [minOrder, setMinOrder] = useState("0");
  const [tables, setTables] = useState("10");
  const [busy, setBusy] = useState(false);
  const [qrs, setQrs] = useState<{ n: number; url: string; img: string }[]>([]);

  useEffect(() => {
    if (!restaurant) return;
    setName(restaurant.name);
    setTable(restaurant.table_enabled);
    setPickup(restaurant.pickup_enabled);
    setDelivery(restaurant.delivery_enabled);
    setFee(String(restaurant.delivery_fee).replace(".", ","));
    setMinOrder(String(restaurant.min_order).replace(".", ","));
    setTables(String(restaurant.table_count));
  }, [restaurant]);

  if (!restaurant) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const f = Number(fee.replace(",", "."));
    const m = Number(minOrder.replace(",", "."));
    const t = Math.round(Number(tables));
    if (![f, m].every((n) => Number.isFinite(n) && n >= 0)) { toast.error("Bitte gültige Beträge eingeben."); return; }
    if (!Number.isFinite(t) || t < 1 || t > 200) { toast.error("Anzahl Tische: 1 bis 200."); return; }
    if (name.trim().length < 2) { toast.error("Der Name ist zu kurz."); return; }
    setBusy(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ name: name.trim(), table_enabled: table, pickup_enabled: pickup, delivery_enabled: delivery, delivery_fee: f, min_order: m, table_count: t })
      .eq("id", id);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    await qc.invalidateQueries({ queryKey: ["restaurant", id] });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
    toast.success("Einstellungen gespeichert");
  }

  async function makeQrs() {
    const count = restaurant!.table_count;
    const list = await Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const n = i + 1;
        const url = `${window.location.origin}/r/${restaurant!.slug}?tisch=${n}`;
        const img = await QRCode.toDataURL(url, { margin: 1, width: 320 });
        return { n, url, img };
      }),
    );
    setQrs(list);
  }

  async function deleteRestaurant() {
    if (window.prompt(`Zum Löschen den Namen „${restaurant!.name}" eingeben`) !== restaurant!.name) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) { toast.error(errorMessage(error)); return; }
    await qc.invalidateQueries({ queryKey: ["my-restaurants"] });
    toast.success("Restaurant gelöscht");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold">Dein Paket</h2>
            <PlanBadge plan={plan} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan === "pro" ? "Alle Funktionen sind freigeschaltet." : "Mit Pro bearbeitest du Logo, Farben, Hintergrundbild und Seitentexte."}
          </p>
        </div>
        {plan === "basic" ? <ProCodeDialog restaurantId={id} /> : <span className="inline-flex items-center gap-1 font-semibold text-pro"><Crown className="h-4 w-4" /> Pro aktiv</span>}
      </section>

      <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border bg-card p-6 shadow-card">
        <div className="grid gap-2 sm:max-w-md">
          <Label htmlFor="sname">Name des Restaurants</Label>
          <Input id="sname" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <h3 className="font-extrabold">Bestellarten für Gäste</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Toggle label="Am Tisch (QR-Code)" checked={table} onChange={setTable} />
            <Toggle label="Abholung" checked={pickup} onChange={setPickup} />
            <Toggle label="Lieferung" checked={delivery} onChange={setDelivery} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Bestellungen durchs Personal gehen immer über die Kasse.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="fee">Liefergebühr (€)</Label>
            <Input id="fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="min">Mindestbestellwert Lieferung (€)</Label>
            <Input id="min" inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tables">Anzahl Tische</Label>
            <Input id="tables" type="number" min={1} max={200} value={tables} onChange={(e) => setTables(e.target.value)} />
          </div>
        </div>
        <div>
          <Button type="submit" variant="hero" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Speichern</Button>
        </div>
      </form>

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">QR-Codes für Tische</h2>
            <p className="text-sm text-muted-foreground">Jeder Tisch bekommt seinen eigenen Code. Gäste scannen, wählen, bestellen.</p>
          </div>
          <Button variant="outline" onClick={makeQrs}><QrCode /> QR-Codes erstellen</Button>
        </div>
        {qrs.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {qrs.map((q) => (
              <div key={q.n} className="rounded-xl border p-3 text-center">
                <img src={q.img} alt={`QR-Code Tisch ${q.n}`} className="mx-auto w-full max-w-[160px]" />
                <div className="mt-2 font-bold">Tisch {q.n}</div>
                <a href={q.img} download={`tisch-${q.n}.png`} className="mt-1 inline-flex items-center gap-1 text-xs text-brand-blue hover:underline">
                  <Download className="h-3 w-3" /> Herunterladen
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-extrabold text-destructive">Restaurant löschen</h2>
        <p className="text-sm text-muted-foreground">Löscht Speisekarte und alle Bestellungen endgültig.</p>
        <Button variant="destructive" className="mt-4" onClick={deleteRestaurant}><Trash2 /> Löschen</Button>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4">
      <span className="text-sm font-semibold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
