-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
CREATE TYPE order_type AS ENUM ('pickup', 'delivery');
CREATE TYPE payment_method AS ENUM ('card', 'cash_venmo');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE points_type AS ENUM ('earned', 'redeemed', 'adjustment');

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE menu_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  display_order int  NOT NULL DEFAULT 0,
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  price         decimal(10,2) NOT NULL,
  image_url     text,
  is_available  boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE item_options (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  option_group     text NOT NULL,
  option_name      text NOT NULL,
  price_adjustment decimal(10,2) NOT NULL DEFAULT 0,
  display_order    int NOT NULL DEFAULT 0
);

CREATE TABLE customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  email              text NOT NULL,
  phone              text,
  stripe_customer_id text,
  points_balance     int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_addresses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        text NOT NULL,
  address_line text NOT NULL,
  city         text NOT NULL,
  zip_code     text NOT NULL,
  is_default   boolean NOT NULL DEFAULT false
);

CREATE TABLE orders (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 uuid REFERENCES customers(id),
  status                      order_status NOT NULL DEFAULT 'pending',
  order_type                  order_type NOT NULL,
  payment_method              payment_method NOT NULL,
  payment_status              payment_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id  text,
  customer_name               text NOT NULL,
  customer_email              text NOT NULL,
  customer_phone              text,
  delivery_address            text,
  delivery_zip                text,
  delivery_fee                decimal(10,2) NOT NULL DEFAULT 0,
  subtotal                    decimal(10,2) NOT NULL,
  discount                    decimal(10,2) NOT NULL DEFAULT 0,
  total                       decimal(10,2) NOT NULL,
  notes                       text,
  points_earned               int NOT NULL DEFAULT 0,
  points_redeemed             int NOT NULL DEFAULT 0,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id     uuid NOT NULL REFERENCES menu_items(id),
  item_name        text NOT NULL,
  quantity         int NOT NULL,
  unit_price       decimal(10,2) NOT NULL,
  selected_options jsonb NOT NULL DEFAULT '{}',
  line_total       decimal(10,2) NOT NULL
);

CREATE TABLE loyalty_points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id),
  points      int NOT NULL,
  type        points_type NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_zones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code     text NOT NULL UNIQUE,
  delivery_fee decimal(10,2) NOT NULL,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE store_settings (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key   text NOT NULL UNIQUE,
  value jsonb NOT NULL
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE menu_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings     ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read menu categories"
  ON menu_categories FOR SELECT USING (true);

CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Public can read item options"
  ON item_options FOR SELECT USING (true);

CREATE POLICY "Public can read delivery zones"
  ON delivery_zones FOR SELECT USING (true);

CREATE POLICY "Public can read store settings"
  ON store_settings FOR SELECT USING (true);

-- Customers: own record only
CREATE POLICY "Customers can select own record"
  ON customers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can update own record"
  ON customers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert own record"
  ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customer addresses: own addresses only
CREATE POLICY "Customers can manage own addresses"
  ON customer_addresses FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Orders: own orders + anyone can insert
CREATE POLICY "Customers can select own orders"
  ON orders FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT WITH CHECK (true);

-- Order items: own order items (via orders) + anyone can insert
CREATE POLICY "Customers can select own order items"
  ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders
    WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  ));

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- Loyalty points: own records only
CREATE POLICY "Customers can select own loyalty points"
  ON loyalty_points FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- ============================================================
-- Seed: Store Settings
-- ============================================================

INSERT INTO store_settings (key, value) VALUES
  ('store_hours', '{"monday":{"open":"07:00","close":"19:00"},"tuesday":{"open":"07:00","close":"19:00"},"wednesday":{"open":"07:00","close":"19:00"},"thursday":{"open":"07:00","close":"19:00"},"friday":{"open":"07:00","close":"20:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"08:00","close":"18:00"}}'),
  ('contact_info', '{"phone":"(555) 123-4567","email":"hello@thehappycup.com"}');
