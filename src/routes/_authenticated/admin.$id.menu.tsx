import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery } from "@/lib/queries";
import { euro, errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/$id/menu")({
  component: MenuPage,
});

type Item = { id: string; category_id: string; name: string; description: string | null; price: number; sold_out: boolean };

function MenuPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(menuQuery(id));
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<{ categoryId: string; item?: Item } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu", id] });

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    const position = (data?.categories.length ?? 0) + 1;
    const { error } = await supabase.from("menu_categories").insert({ restaurant_id: id, name, position });
    if (error) return toast.error(errorMessage(error));
    setNewCat("");
    refresh();
  }

  async function renameCategory(catId: string, current: string) {
    const name = window.prompt("Neuer Name der Kategorie", current)?.trim();
    if (!name || name === current) return;
    const { error } = await supabase.from("menu_categories").update({ name }).eq("id", catId);
    if (error) return toast.error(errorMessage(error));
    refresh();
  }

  async function deleteCategory(catId: string, name: string) {
    if (!window.confirm(`Kategorie „${name}" mit allen Gerichten löschen?`)) return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", catId);
    if (error) return toast.error(errorMessage(error));
    refresh();
  }

  async function toggleSoldOut(item: Item) {
    const { error } = await supabase.from("menu_items").update({ sold_out: !item.sold_out }).eq("id", item.id);
    if (error) return toast.error(errorMessage(error));
    refresh();
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`„${item.name}" löschen?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) return toast.error(errorMessage(error));
    refresh();
  }

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid gap-6">
      <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-5 shadow-card">
        <div className="grid min-w-[220px] flex-1 gap-2">
          <Label htmlFor="newcat">Neue Kategorie</Label>
          <Input id="newcat" placeholder="z. B. Pizza, Getränke, Desserts" value={newCat} maxLength={60} onChange={(e) => setNewCat(e.target.value)} className="h-11" />
        </div>
        <Button type="submit" variant="hero" size="lg" disabled={!newCat.trim()}><Plus /> Hinzufügen</Button>
      </form>

      {data?.categories.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Deine Speisekarte ist noch leer</p>
          <p className="mt-1 text-sm text-muted-foreground">Lege zuerst eine Kategorie an, dann deine Gerichte.</p>
        </div>
      )}

      {data?.categories.map((c) => {
        const items = data.items.filter((i) => i.category_id === c.id);
        return (
          <section key={c.id} className="rounded-2xl border bg-card shadow-card">
            <header className="flex items-center justify-between gap-2 border-b px-5 py-4">
              <h2 className="text-xl font-extrabold">{c.name}</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Kategorie umbenennen" onClick={() => renameCategory(c.id, c.name)}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label="Kategorie löschen" onClick={() => deleteCategory(c.id, c.name)}><Trash2 /></Button>
              </div>
            </header>
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3", item.sold_out && "opacity-60")}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{item.name}{item.sold_out && <span className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-bold text-destructive">Ausverkauft</span>}</div>
                    {item.description && <div className="truncate text-sm text-muted-foreground">{item.description}</div>}
                  </div>
                  <div className="font-display font-extrabold">{euro(item.price)}</div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={!item.sold_out} onCheckedChange={() => toggleSoldOut(item)} aria-label="Verfügbar" />
                    Verfügbar
                  </label>
                  <Button variant="ghost" size="icon" aria-label="Gericht bearbeiten" onClick={() => setEditing({ categoryId: c.id, item })}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label="Gericht löschen" onClick={() => deleteItem(item)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
            <div className="p-4">
              <Button variant="outline" onClick={() => setEditing({ categoryId: c.id })}><Plus /> Gericht hinzufügen</Button>
            </div>
          </section>
        );
      })}

      <ItemDialog
        restaurantId={id}
        state={editing}
        position={(data?.items.length ?? 0) + 1}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
      />
    </div>
  );
}

function ItemDialog({
  restaurantId,
  state,
  position,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  state: { categoryId: string; item?: Item } | null;
  position: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state?.item ? "Gericht bearbeiten" : "Neues Gericht"}</DialogTitle>
        </DialogHeader>
        {state && <ItemForm key={state.item?.id ?? "new"} restaurantId={restaurantId} state={state} position={position} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({ restaurantId, state, position, onSaved }: { restaurantId: string; state: { categoryId: string; item?: Item }; position: number; onSaved: () => void }) {
  const [name, setName] = useState(state.item?.name ?? "");
  const [description, setDescription] = useState(state.item?.description ?? "");
  const [price, setPrice] = useState(state.item ? String(state.item.price).replace(".", ",") : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const p = Number(price.replace(",", "."));
    if (!name.trim()) return toast.error("Bitte einen Namen eingeben.");
    if (!Number.isFinite(p) || p < 0) return toast.error("Bitte einen gültigen Preis eingeben.");
    setBusy(true);
    const payload = { name: name.trim(), description: description.trim() || null, price: Math.round(p * 100) / 100 };
    const { error } = state.item
      ? await supabase.from("menu_items").update(payload).eq("id", state.item.id)
      : await supabase.from("menu_items").insert({ ...payload, restaurant_id: restaurantId, category_id: state.categoryId, position });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Gespeichert");
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="iname">Name</Label>
        <Input id="iname" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Pizza Margherita" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="idesc">Beschreibung (optional)</Label>
        <Textarea id="idesc" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tomate, Mozzarella, Basilikum" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="iprice">Preis (€)</Label>
        <Input id="iprice" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9,50" />
      </div>
      <Button type="submit" variant="hero" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Speichern</Button>
    </form>
  );
}
