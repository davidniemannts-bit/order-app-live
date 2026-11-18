
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$'),
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','pro')),
  logo_url text,
  background_url text,
  primary_color text NOT NULL DEFAULT '#ff4d2e' CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text NOT NULL DEFAULT '#ffb800' CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  headline text,
  welcome_text text,
  address text,
  phone text,
  opening_hours text,
  table_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT false,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  min_order numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  table_count integer NOT NULL DEFAULT 10 CHECK (table_count BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX restaurants_owner_idx ON public.restaurants(owner_id);

GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners create basic restaurants" ON public.restaurants FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND plan = 'basic');
CREATE POLICY "Owners update restaurants" ON public.restaurants FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete restaurants" ON public.restaurants FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_restaurant_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Das Paket kann nur mit dem Pro-Code geändert werden';
  END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Inhaber kann nicht geändert werden';
  END IF;
  IF OLD.plan = 'basic' AND (
       NEW.logo_url IS DISTINCT FROM OLD.logo_url
    OR NEW.background_url IS DISTINCT FROM OLD.background_url
    OR NEW.primary_color IS DISTINCT FROM OLD.primary_color
    OR NEW.accent_color IS DISTINCT FROM OLD.accent_color
    OR NEW.headline IS DISTINCT FROM OLD.headline
    OR NEW.welcome_text IS DISTINCT FROM OLD.welcome_text
    OR NEW.address IS DISTINCT FROM OLD.address
    OR NEW.phone IS DISTINCT FROM OLD.phone
    OR NEW.opening_hours IS DISTINCT FROM OLD.opening_hours
  ) THEN
    RAISE EXCEPTION 'Diese Funktion ist nur mit Pro verfügbar';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER restaurants_guard BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.guard_restaurant_update();

CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = auth.uid())
$$;

CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_categories_restaurant_idx ON public.menu_categories(restaurant_id);
GRANT SELECT ON public.menu_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners insert categories" ON public.menu_categories FOR INSERT TO authenticated WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners update categories" ON public.menu_categories FOR UPDATE TO authenticated USING (public.is_restaurant_owner(restaurant_id)) WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners delete categories" ON public.menu_categories FOR DELETE TO authenticated USING (public.is_restaurant_owner(restaurant_id));

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text CHECK (description IS NULL OR char_length(description) <= 300),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  sold_out boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_items_restaurant_idx ON public.menu_items(restaurant_id);
CREATE INDEX menu_items_category_idx ON public.menu_items(category_id);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view items" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners insert items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners update items" ON public.menu_items FOR UPDATE TO authenticated USING (public.is_restaurant_owner(restaurant_id)) WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners delete items" ON public.menu_items FOR DELETE TO authenticated USING (public.is_restaurant_owner(restaurant_id));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_number integer NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('table','pickup','delivery','staff')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','accepted','preparing','ready','completed','cancelled')),
  customer_name text,
  customer_phone text,
  table_number text,
  address text,
  note text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, order_number)
);
CREATE INDEX orders_restaurant_created_idx ON public.orders(restaurant_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view orders" ON public.orders FOR SELECT TO authenticated USING (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_restaurant_owner(restaurant_id)) WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "Owners delete orders" ON public.orders FOR DELETE TO authenticated USING (public.is_restaurant_owner(restaurant_id));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid,
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99)
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_restaurant_owner(o.restaurant_id)));

CREATE OR REPLACE FUNCTION public.place_order(
  _restaurant_id uuid,
  _order_type text,
  _customer_name text,
  _customer_phone text,
  _table_number text,
  _address text,
  _note text,
  _items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.restaurants%ROWTYPE;
  it jsonb;
  mi public.menu_items%ROWTYPE;
  qty integer;
  sub numeric(10,2) := 0;
  fee numeric(10,2) := 0;
  next_no integer;
  new_id uuid;
BEGIN
  SELECT * INTO r FROM public.restaurants WHERE id = _restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Restaurant nicht gefunden'; END IF;

  IF _order_type = 'table' AND NOT r.table_enabled THEN RAISE EXCEPTION 'Bestellen am Tisch ist nicht aktiv'; END IF;
  IF _order_type = 'pickup' AND NOT r.pickup_enabled THEN RAISE EXCEPTION 'Abholung ist nicht aktiv'; END IF;
  IF _order_type = 'delivery' AND NOT r.delivery_enabled THEN RAISE EXCEPTION 'Lieferung ist nicht aktiv'; END IF;
  IF _order_type = 'staff' AND r.owner_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Nur das Personal kann diese Bestellung aufgeben'; END IF;
  IF _order_type NOT IN ('table','pickup','delivery','staff') THEN RAISE EXCEPTION 'Unbekannte Bestellart'; END IF;

  IF _order_type = 'table' AND coalesce(btrim(_table_number), '') = '' THEN RAISE EXCEPTION 'Bitte Tischnummer angeben'; END IF;
  IF _order_type IN ('pickup','delivery') AND coalesce(btrim(_customer_name), '') = '' THEN RAISE EXCEPTION 'Bitte Namen angeben'; END IF;
  IF _order_type = 'delivery' AND (coalesce(btrim(_address), '') = '' OR coalesce(btrim(_customer_phone), '') = '') THEN RAISE EXCEPTION 'Bitte Adresse und Telefon angeben'; END IF;

  IF char_length(coalesce(_customer_name,'')) > 80 OR char_length(coalesce(_customer_phone,'')) > 40
     OR char_length(coalesce(_table_number,'')) > 20 OR char_length(coalesce(_address,'')) > 200
     OR char_length(coalesce(_note,'')) > 300 THEN
    RAISE EXCEPTION 'Eingabe zu lang';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Der Warenkorb ist leer';
  END IF;
  IF jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Zu viele Positionen'; END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (it->>'quantity')::integer;
    IF qty IS NULL OR qty < 1 OR qty > 99 THEN RAISE EXCEPTION 'Ungültige Menge'; END IF;
    SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'id')::uuid AND restaurant_id = _restaurant_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ein Gericht ist nicht mehr verfügbar'; END IF;
    IF mi.sold_out THEN RAISE EXCEPTION '% ist ausverkauft', mi.name; END IF;
    sub := sub + mi.price * qty;
  END LOOP;

  IF _order_type = 'delivery' THEN
    IF sub < r.min_order THEN RAISE EXCEPTION 'Mindestbestellwert für Lieferung: % €', r.min_order; END IF;
    fee := r.delivery_fee;
  END IF;

  SELECT coalesce(max(order_number), 0) + 1 INTO next_no FROM public.orders WHERE restaurant_id = _restaurant_id;

  INSERT INTO public.orders (restaurant_id, order_number, order_type, customer_name, customer_phone, table_number, address, note, subtotal, delivery_fee, total)
  VALUES (_restaurant_id, next_no, _order_type, nullif(btrim(_customer_name),''), nullif(btrim(_customer_phone),''),
          nullif(btrim(_table_number),''), nullif(btrim(_address),''), nullif(btrim(_note),''), sub, fee, sub + fee)
  RETURNING id INTO new_id;

  INSERT INTO public.order_items (order_id, menu_item_id, name, unit_price, quantity)
  SELECT new_id, m.id, m.name, m.price, (e->>'quantity')::integer
  FROM jsonb_array_elements(_items) e
  JOIN public.menu_items m ON m.id = (e->>'id')::uuid;

  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.place_order(uuid,text,text,text,text,text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.place_order(uuid,text,text,text,text,text,text,jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_order_status(_order_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'order_type', o.order_type,
    'status', o.status,
    'table_number', o.table_number,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'created_at', o.created_at,
    'restaurant_slug', r.slug,
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit_price', i.unit_price)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb)
  )
  FROM public.orders o JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.id = _order_id
$$;
REVOKE ALL ON FUNCTION public.get_order_status(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE POLICY "Owners upload own media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners read own media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'restaurant-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update own media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'restaurant-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete own media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'restaurant-media' AND (storage.foldername(name))[1] = auth.uid()::text);
