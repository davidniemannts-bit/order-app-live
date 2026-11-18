import { useQuery } from "@tanstack/react-query";
import { restaurantQuery } from "@/lib/queries";
import type { Plan } from "@/lib/plans";

export function useRestaurant(id: string) {
  const q = useQuery(restaurantQuery(id));
  const plan: Plan = q.data?.plan === "pro" ? "pro" : "basic";
  return { ...q, restaurant: q.data ?? null, plan };
}
