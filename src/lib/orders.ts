import { supabase } from "@/integrations/supabase/client";
import type { OrderType } from "@/lib/plans";

export async function placeOrder(input: {
  restaurantId: string;
  type: OrderType;
  name?: string;
  phone?: string;
  table?: string;
  address?: string;
  note?: string;
  items: { id: string; quantity: number }[];
}): Promise<string> {
  const { data, error } = await supabase.rpc("place_order", {
    _restaurant_id: input.restaurantId,
    _order_type: input.type,
    _customer_name: input.name ?? "",
    _customer_phone: input.phone ?? "",
    _table_number: input.table ?? "",
    _address: input.address ?? "",
    _note: input.note ?? "",
    _items: input.items,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Short two-tone chime for new orders. */
export function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* sound not available */
  }
}
