import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { menuQuery } from "@/lib/queries";
import { placeOrder } from "@/lib/orders";
import { useCart } from "@/hooks/use-cart";
import { euro, errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/$id/kasse")({
  component: KassePage,
});

function KassePage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(menuQuery(id));
  const cart = useCart();
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (cart.count === 0) return;
    setBusy(true);
    try {
      await placeOrder({ restaurantId: id, type: "staff", table, note, items: cart.items.map((i) => ({ id: i.id, quantity: i.quantity })) });
      toast.success("An die Küche gesendet");
      cart.clear();
      setTable("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["orders", id] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-6">
        {data?.categories.length === 0 && <p className="text-muted-foreground">Lege zuerst Gerichte in der Speisekarte an.</p>}
        {data?.categories.map((c) => (
          <section key={c.id}>
            <h2 className="mb-3 text-lg font-extrabold">{c.name}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.items.filter((i) => i.category_id === c.id).map((i) => {
                const q = cart.qty(i.id);
                return (
                  <button
                    key={i.id}
                    disabled={i.sold_out}
                    onClick={() => cart.add({ id: i.id, name: i.name, price: Number(i.price) })}
                    className={cn("relative rounded-xl border bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5 disabled:opacity-40", q > 0 && "ring-2 ring-brand-blue")}
                  >
                    {q > 0 && <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand-blue px-1.5 text-xs font-bold text-primary-foreground">{q}</span>}
                    <div className="font-semibold">{i.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{i.sold_out ? "Ausverkauft" : euro(i.price)}</div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-20">
        <h2 className="text-lg font-extrabold">Bestellung aufnehmen</h2>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ktable">Tisch (optional)</Label>
            <Input id="ktable" maxLength={20} value={table} onChange={(e) => setTable(e.target.value)} placeholder="z. B. 7" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="knote">Notiz (optional)</Label>
            <Input id="knote" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ohne Zwiebeln" />
          </div>
        </div>
        <ul className="mt-4 grid gap-2 border-t pt-4 text-sm">
          {cart.items.length === 0 && <li className="text-muted-foreground">Tippe auf Gerichte, um sie hinzuzufügen.</li>}
          {cart.items.map((i) => (
            <li key={i.id} className="flex items-center gap-2">
              <span className="flex-1">{i.name}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Weniger" onClick={() => cart.decrement(i.id)}><Minus /></Button>
              <span className="w-5 text-center font-bold">{i.quantity}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Mehr" onClick={() => cart.add(i)}><Plus /></Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground">Summe</span>
          <span className="font-display text-2xl font-black">{euro(cart.subtotal)}</span>
        </div>
        <Button variant="hero" size="xl" className="mt-4 w-full" disabled={busy || cart.count === 0} onClick={send}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />} An die Küche senden
        </Button>
      </aside>
    </div>
  );
}
