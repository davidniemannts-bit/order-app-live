import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Bell, BellOff, Bike, Check, ChefHat, ClipboardList, HandPlatter, Loader2, MapPin, Phone, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ordersQuery } from "@/lib/queries";
import { playChime } from "@/lib/orders";
import { euro, errorMessage, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/$id/")({
  component: OrdersPage,
});

const TYPE_ICON = { table: UtensilsCrossed, pickup: ShoppingBag, delivery: Bike, staff: HandPlatter } as const;
const NEXT: Record<string, { status: string; label: string } | undefined> = {
  new: { status: "accepted", label: "Annehmen" },
  accepted: { status: "preparing", label: "Zubereiten" },
  preparing: { status: "ready", label: "Fertig" },
  ready: { status: "completed", label: "Abschließen" },
};
const STATUS_STYLE: Record<string, string> = {
  new: "bg-brand-blue text-primary-foreground",
  accepted: "bg-primary-glow/20 text-brand-blue",
  preparing: "bg-warning text-warning-foreground",
  ready: "bg-success text-success-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function OrdersPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery(ordersQuery(id));
  const [tab, setTab] = useState<"open" | "done">("open");
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const channel = supabase
      .channel(`orders-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          if (soundRef.current) playChime();
          toast.info(`Neue Bestellung #${(payload.new as { order_number: number }).order_number}`);
        }
        qc.invalidateQueries({ queryKey: ["orders", id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  async function setStatus(orderId: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error(errorMessage(error)); return; }
    qc.invalidateQueries({ queryKey: ["orders", id] });
  }

  const open = (orders ?? []).filter((o) => !["completed", "cancelled"].includes(o.status));
  const done = (orders ?? []).filter((o) => ["completed", "cancelled"].includes(o.status));
  const list = tab === "open" ? open : done;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {(["open", "done"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition", tab === t ? "bg-card shadow-card" : "text-muted-foreground")}
            >
              {t === "open" ? `Offen (${open.length})` : `Erledigt (${done.length})`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setSound((s) => !s)}>
          {sound ? <Bell /> : <BellOff />} Ton {sound ? "an" : "aus"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">{tab === "open" ? "Noch keine offenen Bestellungen" : "Noch nichts erledigt"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Neue Bestellungen erscheinen hier sofort – mit Ton.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((o) => {
            const Icon = TYPE_ICON[o.order_type as keyof typeof TYPE_ICON] ?? ShoppingBag;
            const next = NEXT[o.status];
            return (
              <article key={o.id} className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-card animate-pop-in", o.status === "new" && "ring-2 ring-brand-blue")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-3xl font-black">#{o.order_number}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-brand-blue" />
                      {ORDER_TYPE_LABEL[o.order_type]}
                      {o.table_number && <span>· Tisch {o.table_number}</span>}
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                </div>
                {(o.customer_name || o.customer_phone || o.address) && (
                  <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    {o.customer_name && <div className="font-medium text-foreground">{o.customer_name}</div>}
                    {o.customer_phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{o.customer_phone}</div>}
                    {o.address && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{o.address}</div>}
                  </div>
                )}
                <ul className="mt-4 grid gap-1 border-t pt-3 text-sm">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span><b>{i.quantity}×</b> {i.name}</span>
                      <span className="text-muted-foreground">{euro(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {o.note && <p className="mt-2 rounded-lg bg-warning/20 px-3 py-2 text-sm">„{o.note}"</p>}
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: de })}</span>
                  <span className="font-display text-xl font-black">{euro(o.total)}</span>
                </div>
                {(next || o.status !== "cancelled") && !["completed", "cancelled"].includes(o.status) && (
                  <div className="mt-4 flex gap-2">
                    {next && (
                      <Button variant="hero" className="flex-1" onClick={() => setStatus(o.id, next.status)}>
                        {next.status === "preparing" ? <ChefHat /> : <Check />} {next.label}
                      </Button>
                    )}
                    <Button variant="outline" size="icon" aria-label="Stornieren" onClick={() => setStatus(o.id, "cancelled")}>
                      <X />
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
