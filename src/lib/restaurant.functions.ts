import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { checkProCode } from "@/lib/plans";
import { SLUG_PATTERN } from "@/lib/format";

const createSchema = z.object({
  name: z.string().trim().min(2, "Name ist zu kurz").max(80),
  slug: z.string().trim().regex(SLUG_PATTERN, "Web-Adresse: 3–40 Zeichen, nur a–z, 0–9 und -"),
  plan: z.enum(["basic", "pro"]),
  code: z.string().max(200).optional(),
});

export const createRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.plan === "pro" && !checkProCode(data.code ?? "", process.env["PRO_UNLOCK_CODE"])) {
      throw new Error("Der Pro-Code ist falsch.");
    }
    const { data: row, error } = await context.supabase
      .from("restaurants")
      .insert({ name: data.name, slug: data.slug, owner_id: context.userId, plan: "basic" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Diese Web-Adresse ist schon vergeben.");
      throw new Error("Restaurant konnte nicht angelegt werden.");
    }
    if (data.plan === "pro") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: upErr } = await supabaseAdmin.from("restaurants").update({ plan: "pro" }).eq("id", row.id);
      if (upErr) throw new Error("Pro konnte nicht freigeschaltet werden.");
    }
    return { id: row.id };
  });

const unlockSchema = z.object({ restaurantId: z.string().uuid(), code: z.string().max(200) });

export const unlockPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof unlockSchema>) => unlockSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: r } = await context.supabase
      .from("restaurants")
      .select("id, owner_id")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (!r || r.owner_id !== context.userId) throw new Error("Restaurant nicht gefunden.");
    if (!checkProCode(data.code, process.env["PRO_UNLOCK_CODE"])) {
      throw new Error("Der Pro-Code ist falsch.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("restaurants").update({ plan: "pro" }).eq("id", r.id);
    if (error) throw new Error("Pro konnte nicht freigeschaltet werden.");
    return { ok: true };
  });

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicRestaurant = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 60) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: restaurant } = await sb
      .from("restaurants")
      .select(
        "id, name, slug, plan, logo_url, background_url, primary_color, accent_color, headline, welcome_text, address, phone, opening_hours, table_enabled, pickup_enabled, delivery_enabled, delivery_fee, min_order",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (!restaurant) return null;
    const [{ data: categories }, { data: items }] = await Promise.all([
      sb.from("menu_categories").select("id, name, position").eq("restaurant_id", restaurant.id).order("position").order("created_at"),
      sb
        .from("menu_items")
        .select("id, category_id, name, description, price, sold_out, position")
        .eq("restaurant_id", restaurant.id)
        .order("position")
        .order("created_at"),
    ]);
    return { restaurant, categories: categories ?? [], items: items ?? [] };
  });

export type PublicRestaurant = NonNullable<Awaited<ReturnType<typeof getPublicRestaurant>>>;
