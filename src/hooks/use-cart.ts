import { useMemo, useState } from "react";

export type CartItem = { id: string; name: string; price: number; quantity: number };

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const api = useMemo(
    () => ({
      add(item: { id: string; name: string; price: number }) {
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) return prev.map((p) => (p.id === item.id ? { ...p, quantity: Math.min(99, p.quantity + 1) } : p));
          return [...prev, { ...item, quantity: 1 }];
        });
      },
      decrement(id: string) {
        setItems((prev) =>
          prev.flatMap((p) => (p.id === id ? (p.quantity > 1 ? [{ ...p, quantity: p.quantity - 1 }] : []) : [p])),
        );
      },
      clear() {
        setItems([]);
      },
    }),
    [],
  );

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const qty = (id: string) => items.find((i) => i.id === id)?.quantity ?? 0;

  return { items, count, subtotal, qty, ...api };
}
