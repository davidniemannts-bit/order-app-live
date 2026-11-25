import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, CheckCircle2, Clock3, Loader2, MapPin, Minus, Plus, ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { getPublicRestaurant } from "@/lib/restaurant.functions";
import { placeOrder } from "@/lib/orders";
import { supabase } from "@/integrations/supabase/client";
import { euro, ORDER_STATUS_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/r/$slug")({
  staticData: { sitemap: false },
  loader: async ({ params }) => getPublicRestaurant({ data: { slug: params.slug } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.restaurant?.name ? `Bestellen bei ${loaderData.restaurant.name}` : "Online bestellen" },
      { name: "description", content: "Speisekarte ansehen und einfach online bestellen." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CustomerOrderPage,
});

type OrderType = "table" | "pickup" | "delivery";
type MenuItem = { id: string; category_id: string; name: string; description: string | null; price: number; sold_out: boolean };
type CartLine = { item: MenuItem; quantity: number };
type OrderStatus = { order_number: number; status: string; total: number; items: { name: string; quantity: number; unit_price: number }[] };

const ORDER_STEPS = [
  { key: "new", label: "Eingegangen" },
  { key: "accepted", label: "Angenommen" },
  { key: "preparing", label: "In Zubereitung" },
  { key: "ready", label: "Abholbereit" },
  { key: "completed", label: "Abgeschlossen" },
];

function CustomerOrderPage() {
  const data = Route.useLoaderData();
  const restaurant = data?.restaurant;
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [orderType, setOrderType] = useState<OrderType>(() => restaurant?.pickup_enabled ? "pickup" : restaurant?.delivery_enabled ? "delivery" : "table");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  const lines = Object.values(cart);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.item.price) * line.quantity, 0);
  const deliveryFee = orderType === "delivery" ? Number(restaurant?.delivery_fee ?? 0) : 0;
  const total = subtotal + deliveryFee;

  const statusQuery = useQuery({
    queryKey: ["public-order-status", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_status", { _order_id: orderId! });
      if (error) throw error;
      return data as unknown as OrderStatus;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return !status || ["completed", "cancelled"].includes(status) ? false : 5000;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (statusQuery.data) setOrderStatus(statusQuery.data);
  }, [statusQuery.data]);

  if (!restaurant) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5">
        <div className="max-w-md text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-extrabold">Restaurant nicht gefunden</h1>
          <p className="mt-2 text-muted-foreground">Dieser Bestell-Link ist möglicherweise nicht mehr gültig.</p>
        </div>
      </main>
    );
  }

  const categories = data.categories ?? [];
  const items = data.items as MenuItem[];

  function add(item: MenuItem) {
    setCart((current) => ({
      ...current,
      [item.id]: { item, quantity: Math.min(99, (current[item.id]?.quantity ?? 0) + 1) },
    }));
  }

  function changeQuantity(itemId: string, delta: number) {
    setCart((current) => {
      const line = current[itemId];
      if (!line) return current;
      const quantity = line.quantity + delta;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return { ...current, [itemId]: { ...line, quantity: Math.min(99, quantity) } };
    });
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!count || busy) return;
    if ((orderType === "pickup" || orderType === "delivery") && !name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    if (orderType === "table" && !table.trim()) {
      toast.error("Bitte gib deine Tischnummer ein.");
      return;
    }
    if (orderType === "delivery" && (!phone.trim() || !address.trim())) {
      toast.error("Für die Lieferung benötigen wir Telefonnummer und Adresse.");
      return;
    }
    if (orderType === "delivery" && subtotal < Number(restaurant.min_order ?? 0)) {
      toast.error(`Mindestbestellwert: ${euro(Number(restaurant.min_order))}`);
      return;
    }

    setBusy(true);
    try {
      const id = await placeOrder({
        restaurantId: restaurant.id,
        type: orderType,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        table: table.trim(),
        note: note.trim(),
        items: lines.map(({ item, quantity }) => ({ id: item.id, quantity })),
      });
      setOrderId(id);
      setCart({});
      setOrderStatus(null);
      toast.success("Deine Bestellung wurde übermittelt.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bestellung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  if (orderId) {
    const status = orderStatus?.status ?? "new";
    const currentStep = ORDER_STEPS.findIndex((step) => step.key === status);
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-9">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="mt-5 text-center">
              <p className="text-sm font-semibold text-brand-blue">{restaurant.name}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Bestellung erhalten!</h1>
              <p className="mt-2 text-muted-foreground">Deine Bestellung wurde erfolgreich übermittelt.</p>
              <p className="mt-4 font-display text-4xl font-black">{orderStatus?.order_number ? `#${orderStatus.order_number}` : "…"}</p>
            </div>
            <div className="mt-8 rounded-2xl bg-muted/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Bestellstatus</span>
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-sm font-bold text-brand-blue">{ORDER_STATUS_LABEL[status] ?? "Eingegangen"}</span>
              </div>
              <ol className="mt-5 grid gap-4">
                {ORDER_STEPS.map((step, index) => {
                  const done = currentStep >= index && status !== "cancelled";
                  return (
                    <li key={step.key} className="flex items-center gap-3 text-sm">
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${done ? "bg-brand-blue text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <span>{index + 1}</span>}
                      </span>
                      <span className={done ? "font-semibold" : "text-muted-foreground"}>{step.label}</span>
                    </li>
                  );
                })}
              </ol>
              {status === "cancelled" && <p className="mt-4 text-sm font-semibold text-destructive">Diese Bestellung wurde storniert. Bitte wende dich an das Restaurant.</p>}
            </div>
            {orderStatus?.items?.length ? (
              <div className="mt-6 border-t pt-4">
                <h2 className="font-bold">Deine Bestellung</h2>
                {orderStatus.items.map((item, index) => (
                  <div key={index} className="mt-2 flex justify-between gap-3 text-sm">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{euro(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t pt-3 font-bold">
                  <span>Gesamt</span><span>{euro(orderStatus.total)}</span>
                </div>
              </div>
            ) : null}
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" /> Status wird automatisch aktualisiert.</p>
            <Button className="mt-6 w-full" variant="outline" onClick={() => { setOrderId(null); setOrderStatus(null); }}>Zur Speisekarte</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ ["--brand" as string]: restaurant.primary_color, ["--brand-2" as string]: restaurant.accent_color }}>
      <header className="relative overflow-hidden bg-gradient-ink text-ink-foreground">
        {restaurant.background_url && <img src={restaurant.background_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
        <div className="relative mx-auto flex max-w-5xl items-center gap-4 px-5 py-8">
          {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-2xl font-black text-brand-foreground"><Store /></span>}
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">Willkommen bei</p>
            <h1 className="truncate text-3xl font-black tracking-tight sm:text-4xl">{restaurant.name}</h1>
            {restaurant.headline && <p className="mt-1 text-ink-muted">{restaurant.headline}</p>}
          </div>
        </div>
        {restaurant.welcome_text && <p className="relative mx-auto max-w-5xl px-5 pb-7 text-sm text-ink-muted">{restaurant.welcome_text}</p>}
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_350px]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-2xl font-black tracking-tight">Speisekarte</h2><p className="text-sm text-muted-foreground">Wähle deine Lieblingsgerichte.</p></div>
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">{items.length} Gerichte</span>
          </div>
          {categories.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Die Speisekarte wird gerade vorbereitet.</div>}
          <div className="grid gap-7">
            {categories.map((category) => (
              <section key={category.id}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><UtensilsCrossed className="h-5 w-5 text-brand-blue" />{category.name}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.filter((item) => item.category_id === category.id).map((item) => (
                    <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-card">
                      <div className="min-w-0">
                        <h4 className="font-bold">{item.name}</h4>
                        {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                        <p className="mt-2 font-display text-lg font-extrabold">{euro(item.price)}</p>
                        {item.sold_out && <span className="mt-1 inline-block text-xs font-semibold text-destructive">Ausverkauft</span>}
                      </div>
                      <Button size="icon" variant="outline" aria-label={`${item.name} hinzufügen`} disabled={item.sold_out} onClick={() => add(item)}><Plus /></Button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-5">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black">Warenkorb</h2><ShoppingBag className="h-5 w-5 text-brand-blue" /></div>
          {lines.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Dein Warenkorb ist noch leer.</p> : (
            <ul className="mt-4 grid gap-3">
              {lines.map(({ item, quantity }) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="text-muted-foreground">{euro(Number(item.price) * quantity)}</p></div>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Menge verringern" onClick={() => changeQuantity(item.id, -1)}><Minus /></Button>
                  <span className="w-5 text-center font-bold">{quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Menge erhöhen" onClick={() => changeQuantity(item.id, 1)}><Plus /></Button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid gap-1 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Zwischensumme</span><span>{euro(subtotal)}</span></div>
            {orderType === "delivery" && <div className="flex justify-between"><span className="text-muted-foreground">Liefergebühr</span><span>{euro(deliveryFee)}</span></div>}
            <div className="mt-2 flex justify-between text-lg font-black"><span>Gesamt</span><span>{euro(total)}</span></div>
          </div>
          <form onSubmit={submitOrder} className="mt-5 grid gap-3 border-t pt-5">
            <Label>Wie möchtest du bestellen?</Label>
            <div className="grid grid-cols-3 gap-2">
              {restaurant.table_enabled && <button type="button" onClick={() => setOrderType("table")} className={`rounded-xl border p-2 text-xs font-semibold ${orderType === "table" ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "bg-background"}`}><UtensilsCrossed className="mx-auto mb-1 h-4 w-4" />Am Tisch</button>}
              {restaurant.pickup_enabled && <button type="button" onClick={() => setOrderType("pickup")} className={`rounded-xl border p-2 text-xs font-semibold ${orderType === "pickup" ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "bg-background"}`}><ShoppingBag className="mx-auto mb-1 h-4 w-4" />Abholung</button>}
              {restaurant.delivery_enabled && <button type="button" onClick={() => setOrderType("delivery")} className={`rounded-xl border p-2 text-xs font-semibold ${orderType === "delivery" ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "bg-background"}`}><Bike className="mx-auto mb-1 h-4 w-4" />Lieferung</button>}
            </div>
            {orderType === "table" && <div className="grid gap-1"><Label htmlFor="table">Tischnummer</Label><Input id="table" value={table} onChange={(e) => setTable(e.target.value)} maxLength={20} required /></div>}
            {(orderType === "pickup" || orderType === "delivery") && <div className="grid gap-1"><Label htmlFor="customer-name">Dein Name</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></div>}
            {orderType === "delivery" && <>
              <div className="grid gap-1"><Label htmlFor="phone">Telefonnummer</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} type="tel" required /></div>
              <div className="grid gap-1"><Label htmlFor="address">Lieferadresse</Label><Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} required rows={2} /></div>
              <p className="text-xs text-muted-foreground">Mindestbestellwert: {euro(Number(restaurant.min_order ?? 0))}</p>
            </>}
            <div className="grid gap-1"><Label htmlFor="note">Hinweis (optional)</Label><Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} placeholder="Besondere Wünsche" /></div>
            <Button type="submit" variant="hero" size="xl" disabled={busy || count === 0} className="mt-1 w-full">
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {busy ? "Wird gesendet…" : "Kostenpflichtig bestellen"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Bezahlung erfolgt direkt vor Ort beim Restaurant.</p>
          </form>
        </aside>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{restaurant.address || restaurant.name}</span><p className="mt-2">Online bestellen · Bezahlung vor Ort</p></footer>
    </div>
  );
}
