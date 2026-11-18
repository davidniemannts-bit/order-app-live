import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadRestaurantImage(restaurantId: string, kind: "logo" | "background", file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Bitte ein Bild auswählen.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Das Bild ist größer als 5 MB.");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Bitte melde dich an.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${u.user.id}/${restaurantId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("restaurant-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Hochladen fehlgeschlagen.");
  const { data, error: urlErr } = await supabase.storage.from("restaurant-media").createSignedUrl(path, TEN_YEARS);
  if (urlErr || !data) throw new Error("Bild-Link konnte nicht erstellt werden.");
  return data.signedUrl;
}
