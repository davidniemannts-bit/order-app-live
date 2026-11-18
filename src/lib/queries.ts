import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myRestaurantsQuery = () =>
  queryOptions({
    queryKey: ["my-restaurants"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, plan, logo_url, primary_color, accent_color, created_at")
        .eq("owner_id", u.user.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const restaurantQuery = (id: string) =>
  queryOptions({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const menuQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["menu", restaurantId],
    queryFn: async () => {
      const [c, i] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("position").order("created_at"),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).order("position").order("created_at"),
      ]);
      if (c.error) throw c.error;
      if (i.error) throw i.error;
      return { categories: c.data, items: i.data };
    },
  });

export const ordersQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: ["orders", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
