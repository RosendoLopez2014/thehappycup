# The Happy Cup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an online drink ordering platform with menu browsing, cart, checkout (Stripe + cash), customer accounts with loyalty points, and an admin dashboard for order/menu management.

**Architecture:** Next.js 16 App Router with Supabase for database/auth/storage/real-time, Stripe Checkout for payments, Resend for emails. Storefront and admin share one Next.js app with route-based separation. Server Components by default, Client Components only for interactivity (cart, filters, real-time).

**Tech Stack:** Next.js 16, Supabase (Postgres + Auth + Storage + Realtime), Stripe, Resend, shadcn/ui, Tailwind CSS, Geist fonts, Vercel

**Spec:** `docs/superpowers/specs/2026-03-22-the-happy-cup-design.md`

---

## File Structure

```
thehappycup/
├── app/
│   ├── layout.tsx                    # Root layout: Geist fonts, warm theme, Toaster
│   ├── page.tsx                      # Menu page (homepage)
│   ├── cart/
│   │   └── page.tsx                  # Cart + delivery/pickup selection
│   ├── checkout/
│   │   └── page.tsx                  # Contact info + payment method
│   ├── confirmation/
│   │   └── page.tsx                  # Order confirmation
│   ├── auth/
│   │   ├── login/page.tsx            # Login page
│   │   ├── signup/page.tsx           # Signup page
│   │   └── callback/route.ts        # Supabase auth callback
│   ├── profile/
│   │   ├── page.tsx                  # Profile overview + points
│   │   ├── orders/page.tsx           # Order history
│   │   └── addresses/page.tsx        # Saved addresses
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout with sidebar nav
│   │   ├── page.tsx                  # Orders dashboard (default)
│   │   ├── menu/page.tsx             # Menu management
│   │   ├── customers/page.tsx        # Customer list + points
│   │   └── settings/page.tsx         # Delivery zones, store hours
│   └── api/
│       ├── checkout/route.ts         # Create Stripe Checkout session
│       ├── orders/route.ts           # Create order (POST)
│       ├── orders/[id]/status/route.ts  # Update order status (PATCH)
│       ├── webhooks/stripe/route.ts  # Stripe webhook handler
│       └── admin/
│           ├── menu/route.ts         # Menu CRUD
│           ├── menu/[id]/route.ts    # Single menu item CRUD
│           ├── menu/upload/route.ts  # Image upload to Supabase Storage
│           ├── customers/[id]/points/route.ts  # Adjust loyalty points
│           ├── settings/route.ts     # Store settings CRUD
│           └── delivery-zones/route.ts  # Delivery zone CRUD
├── components/
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   ├── header.tsx                    # Site header: logo, nav, cart count, points
│   ├── menu-filters.tsx              # Category filter tabs (client)
│   ├── menu-grid.tsx                 # Menu item card grid
│   ├── menu-item-card.tsx            # Single item card
│   ├── item-customization-modal.tsx  # Customization modal (client)
│   ├── cart-provider.tsx             # Cart context + localStorage (client)
│   ├── cart-summary.tsx              # Cart line items display
│   ├── delivery-form.tsx             # Address input + zip validation (client)
│   ├── checkout-form.tsx             # Contact info + payment selection (client)
│   ├── store-status-banner.tsx       # Open/closed banner
│   ├── admin/
│   │   ├── admin-sidebar.tsx         # Admin navigation sidebar
│   │   ├── order-card.tsx            # Order card with status controls
│   │   ├── order-feed.tsx            # Real-time order feed (client)
│   │   ├── menu-item-form.tsx        # Add/edit menu item form (client)
│   │   ├── menu-list.tsx             # Menu items list with toggles
│   │   ├── customer-table.tsx        # Customer list table
│   │   ├── delivery-zone-manager.tsx # Zip code + fee management (client)
│   │   └── store-hours-form.tsx      # Store hours config (client)
│   └── email/
│       └── order-confirmation.tsx    # React Email template for Resend
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client (cookies)
│   │   └── admin.ts                  # Service role client for admin ops
│   ├── stripe.ts                     # Stripe client init
│   ├── resend.ts                     # Resend client init
│   ├── cart.ts                       # Cart types + localStorage helpers
│   ├── store-hours.ts                # Store hours check utility
│   └── types.ts                      # Shared TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # All tables, enums, RLS policies
├── proxy.ts                          # Next.js 16 proxy (auth session refresh)
├── tailwind.config.ts                # Warm theme colors
├── next.config.ts                    # Next.js config
├── .env.local                        # Environment variables (pulled via vercel env pull)
└── package.json
```

---

## Phase 1: Project Setup & Database

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Create Next.js 16 project**

Run:
```bash
cd /Users/rosendolopez && npx create-next-app@latest thehappycup --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

Note: If the directory already exists (it does — has logo assets), move the assets out first, scaffold, then move them back:
```bash
cd /Users/rosendolopez
mv thehappycup/1x /tmp/thc-1x
mv thehappycup/2x /tmp/thc-2x
mv thehappycup/3x /tmp/thc-3x
mv thehappycup/SVG /tmp/thc-svg
mv thehappycup/docs /tmp/thc-docs
```
Then scaffold, then move back:
```bash
mv /tmp/thc-1x thehappycup/public/logo/1x
mv /tmp/thc-2x thehappycup/public/logo/2x
mv /tmp/thc-3x thehappycup/public/logo/3x
mv /tmp/thc-svg thehappycup/public/logo/SVG
mv /tmp/thc-docs thehappycup/docs
```

- [ ] **Step 2: Install core dependencies**

Run:
```bash
cd /Users/rosendolopez/thehappycup
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js resend react-email @react-email/components @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init
```
Select: New York style, Zinc base color, CSS variables: yes.

- [ ] **Step 4: Add shadcn/ui components needed for the project**

Run:
```bash
npx shadcn@latest add button card dialog input label select separator sheet tabs badge toggle-group toast sonner switch textarea dropdown-menu table avatar
```

- [ ] **Step 5: Configure warm theme in Tailwind**

Update `tailwind.config.ts` to add the warm palette as custom colors:
```typescript
// In the theme.extend.colors section:
warm: {
  50: '#faf6f1',
  100: '#f0e8dd',
  200: '#e8ddd0',
  300: '#c4a882',
  400: '#a08060',
  500: '#6b5440',
  600: '#3d2c1e',
  700: '#2a1e14',
}
```

- [ ] **Step 6: Set up root layout with Geist fonts and warm background**

Update `app/layout.tsx`:
- Import Geist Sans and Geist Mono from `next/font/google` (or `geist` package)
- Set `<body>` background to `bg-warm-50`
- Add `<Toaster />` from sonner for notifications

- [ ] **Step 7: Create placeholder homepage**

Update `app/page.tsx` to show "The Happy Cup — Coming Soon" with the logo.

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`
Expected: App loads at localhost:3000 with warm background and placeholder text.

- [ ] **Step 9: Initialize git and commit**

```bash
cd /Users/rosendolopez/thehappycup
echo ".env*.local\n.superpowers/" >> .gitignore
git init
git add .
git commit -m "chore: scaffold Next.js 16 project with shadcn/ui and warm theme"
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Set up Supabase project**

Go to https://supabase.com/dashboard and create a new project called "thehappycup". Save the project URL and anon key.

Or use Vercel Marketplace:
```bash
vercel link
vercel integration add supabase
vercel env pull .env.local
```

- [ ] **Step 2: Create the migration file with full schema**

Create `supabase/migrations/001_initial_schema.sql` with all tables from the spec:
- Enums: `order_status`, `order_type`, `payment_method`, `payment_status`, `points_type`
- Tables: `menu_categories`, `menu_items`, `item_options`, `customers`, `customer_addresses`, `orders`, `order_items`, `loyalty_points`, `delivery_zones`, `store_settings`
- RLS policies:
  - `menu_categories`, `menu_items`, `item_options`: public read, admin write
  - `customers`: users read/write own row, admin read all
  - `customer_addresses`: users read/write own, admin read all
  - `orders`: users read own, admin read/write all
  - `order_items`: users read own (via order), admin read all
  - `loyalty_points`: users read own, admin read/write all
  - `delivery_zones`: public read, admin write
  - `store_settings`: public read, admin write
- Seed data: insert initial `store_settings` rows for `store_hours` and `contact_info`

```sql
-- Enums
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
CREATE TYPE order_type AS ENUM ('pickup', 'delivery');
CREATE TYPE payment_method AS ENUM ('card', 'cash_venmo');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE points_type AS ENUM ('earned', 'redeemed', 'adjustment');

-- Tables
CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price decimal(10,2) NOT NULL,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE item_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  option_group text NOT NULL,
  option_name text NOT NULL,
  price_adjustment decimal(10,2) NOT NULL DEFAULT 0,
  display_order int NOT NULL DEFAULT 0
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  stripe_customer_id text,
  points_balance int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  address_line text NOT NULL,
  city text NOT NULL,
  zip_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  status order_status NOT NULL DEFAULT 'pending',
  order_type order_type NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id text,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text,
  delivery_zip text,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(10,2) NOT NULL,
  discount decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL,
  notes text,
  points_earned int NOT NULL DEFAULT 0,
  points_redeemed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  item_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  selected_options jsonb NOT NULL DEFAULT '{}',
  line_total decimal(10,2) NOT NULL
);

CREATE TABLE loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  points int NOT NULL,
  type points_type NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code text NOT NULL UNIQUE,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies (menu, delivery zones, store settings)
CREATE POLICY "Public read menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read item_options" ON item_options FOR SELECT USING (true);
CREATE POLICY "Public read delivery_zones" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "Public read store_settings" ON store_settings FOR SELECT USING (true);

-- Customer policies
CREATE POLICY "Users read own customer" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own customer" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own customer" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own addresses" ON customer_addresses FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own addresses" ON customer_addresses FOR ALL USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

-- Order policies
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own order_items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
);
CREATE POLICY "Anyone can insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Loyalty points policies
CREATE POLICY "Users read own points" ON loyalty_points FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

-- Admin policies (using app_metadata.role = 'admin')
-- These use service role client on the server side, so RLS is bypassed for admin operations.
-- No explicit admin RLS policies needed — admin API routes use supabase admin client.

-- Seed store settings
INSERT INTO store_settings (key, value) VALUES
  ('store_hours', '{"monday":{"open":"07:00","close":"19:00"},"tuesday":{"open":"07:00","close":"19:00"},"wednesday":{"open":"07:00","close":"19:00"},"thursday":{"open":"07:00","close":"19:00"},"friday":{"open":"07:00","close":"20:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"08:00","close":"18:00"}}'),
  ('contact_info', '{"phone":"(555) 123-4567","email":"hello@thehappycup.com"}');
```

- [ ] **Step 3: Run migration in Supabase**

Run the SQL in Supabase SQL Editor (Dashboard > SQL Editor > paste and run), or use the Supabase CLI:
```bash
npx supabase db push
```

- [ ] **Step 4: Create Supabase client utilities**

Create `lib/supabase/client.ts` — browser client using `createBrowserClient` from `@supabase/ssr`.
Create `lib/supabase/server.ts` — server client using `createServerClient` from `@supabase/ssr` with cookie handling.
Create `lib/supabase/admin.ts` — service role client for admin operations (bypasses RLS).

Reference: @vercel:bootstrap skill, Supabase SSR docs.

- [ ] **Step 5: Create shared TypeScript types**

Create `lib/types.ts` with interfaces for all database tables:
`MenuCategory`, `MenuItem`, `ItemOption`, `Customer`, `CustomerAddress`, `Order`, `OrderItem`, `LoyaltyPoints`, `DeliveryZone`, `StoreSetting`

Also create `CartItem` type:
```typescript
export type CartItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>
  lineTotal: number
  imageUrl: string | null
}
```

- [ ] **Step 6: Set up proxy.ts for auth session refresh**

Create `proxy.ts` at project root (same level as `app/`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser()
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const role = user.app_metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect profile routes
  if (request.nextUrl.pathname.startsWith('/profile')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}
```

- [ ] **Step 7: Add environment variables to .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 8: Seed sample menu data**

Run in Supabase SQL Editor:
```sql
INSERT INTO menu_categories (name, display_order) VALUES
  ('Energy Drinks', 1),
  ('Matcha', 2),
  ('Coffee', 3),
  ('Treats', 4);

-- Get category IDs and insert sample items
WITH cats AS (SELECT id, name FROM menu_categories)
INSERT INTO menu_items (category_id, name, description, price, display_order) VALUES
  ((SELECT id FROM cats WHERE name = 'Energy Drinks'), 'Blue Raspberry Burst', 'Red Bull + blue raspberry syrup over ice', 6.00, 1),
  ((SELECT id FROM cats WHERE name = 'Energy Drinks'), 'Tropical Mango Splash', 'Red Bull + mango + coconut', 6.50, 2),
  ((SELECT id FROM cats WHERE name = 'Energy Drinks'), 'Strawberry Lemonade Rush', 'Red Bull + strawberry + fresh lemon', 6.00, 3),
  ((SELECT id FROM cats WHERE name = 'Matcha'), 'Iced Matcha Latte', 'Ceremonial grade matcha + oat milk', 5.50, 1),
  ((SELECT id FROM cats WHERE name = 'Matcha'), 'Vanilla Matcha', 'Matcha + vanilla + oat milk', 6.00, 2),
  ((SELECT id FROM cats WHERE name = 'Coffee'), 'Caramel Cold Brew', 'House cold brew + caramel drizzle', 4.50, 1),
  ((SELECT id FROM cats WHERE name = 'Coffee'), 'Vanilla Iced Latte', 'Espresso + vanilla + oat milk', 5.00, 2),
  ((SELECT id FROM cats WHERE name = 'Treats'), 'Chocolate Chip Cookie', 'Fresh baked, chewy center', 3.00, 1),
  ((SELECT id FROM cats WHERE name = 'Treats'), 'Banana Bread Slice', 'Homemade, moist and sweet', 3.50, 2);

-- Add options to energy drinks
INSERT INTO item_options (item_id, option_group, option_name, price_adjustment, display_order)
SELECT mi.id, o.option_group, o.option_name, o.price_adjustment, o.display_order
FROM menu_items mi
CROSS JOIN (VALUES
  ('size', 'Regular (16oz)', 0, 1),
  ('size', 'Large (24oz)', 1.50, 2),
  ('ice', 'Regular Ice', 0, 1),
  ('ice', 'Light Ice', 0, 2),
  ('ice', 'No Ice', 0, 3)
) AS o(option_group, option_name, price_adjustment, display_order)
WHERE mi.category_id = (SELECT id FROM menu_categories WHERE name = 'Energy Drinks');

-- Add options to matcha & coffee
INSERT INTO item_options (item_id, option_group, option_name, price_adjustment, display_order)
SELECT mi.id, o.option_group, o.option_name, o.price_adjustment, o.display_order
FROM menu_items mi
CROSS JOIN (VALUES
  ('size', 'Regular (12oz)', 0, 1),
  ('size', 'Large (16oz)', 1.00, 2),
  ('ice', 'Iced', 0, 1),
  ('ice', 'Hot', 0, 2)
) AS o(option_group, option_name, price_adjustment, display_order)
WHERE mi.category_id IN (SELECT id FROM menu_categories WHERE name IN ('Matcha', 'Coffee'));
```

- [ ] **Step 9: Verify database setup**

Run a quick query in Supabase SQL Editor:
```sql
SELECT mi.name, mc.name as category, mi.price
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
ORDER BY mc.display_order, mi.display_order;
```
Expected: 9 menu items across 4 categories.

- [ ] **Step 10: Commit**

```bash
git add supabase/ lib/ proxy.ts .env.local.example
git commit -m "feat: add Supabase schema, client utilities, and seed data"
```

Note: Create `.env.local.example` with placeholder values (no real secrets). Do NOT commit `.env.local`.

---

## Phase 2: Customer Storefront

### Task 3: Cart System

**Files:**
- Create: `lib/cart.ts`
- Create: `components/cart-provider.tsx`

- [ ] **Step 1: Create cart types and localStorage helpers**

Create `lib/cart.ts` with:
- `CartItem` type (already in types.ts, re-export)
- `getCart(): CartItem[]` — reads from localStorage
- `saveCart(items: CartItem[]): void` — writes to localStorage
- `addToCart(item: CartItem): CartItem[]` — adds or increments quantity
- `removeFromCart(menuItemId: string, selectedOptions: Record<string, ...>): CartItem[]`
- `updateQuantity(menuItemId: string, selectedOptions: Record<string, ...>, quantity: number): CartItem[]`
- `clearCart(): void`
- `getCartTotal(): { subtotal: number, itemCount: number }`

All functions return new arrays (immutable).

- [ ] **Step 2: Create CartProvider context**

Create `components/cart-provider.tsx` — a `'use client'` component:
- React Context with `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `itemCount`, `subtotal`
- Initialize from localStorage on mount
- Sync to localStorage on every change
- Wrap the app in this provider from `app/layout.tsx`

- [ ] **Step 3: Verify cart works**

Temporarily add a test button to the homepage that adds an item to cart and displays the count. Verify it persists across page refresh.

- [ ] **Step 4: Commit**

```bash
git add lib/cart.ts components/cart-provider.tsx app/layout.tsx
git commit -m "feat: add cart system with localStorage persistence"
```

---

### Task 4: Menu Page (Homepage)

**Files:**
- Create: `components/header.tsx`
- Create: `components/menu-filters.tsx`
- Create: `components/menu-grid.tsx`
- Create: `components/menu-item-card.tsx`
- Create: `components/store-status-banner.tsx`
- Create: `lib/store-hours.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create store hours utility**

Create `lib/store-hours.ts`:
- `isStoreOpen(storeHours: StoreHours): boolean` — checks current day/time against store hours
- `getNextOpenTime(storeHours: StoreHours): string` — returns "Opens Monday at 7:00 AM"
- Uses the user's local timezone

- [ ] **Step 2: Create Header component**

Create `components/header.tsx`:
- Logo (from `/logo/SVG/Asset 1.svg` — render as dark circle on warm background, or use `next/image` with the PNG)
- Navigation: Menu, Points (if logged in), Profile (if logged in) / Login
- Cart icon with item count badge (from CartProvider)
- Mobile-responsive: hamburger menu on small screens using shadcn Sheet

- [ ] **Step 3: Create StoreStatusBanner component**

Create `components/store-status-banner.tsx`:
- If closed: warm brown banner with "We're currently closed. Opens [next open time]"
- If open: no banner (or subtle "Open until [close time]")

- [ ] **Step 4: Create MenuFilters component**

Create `components/menu-filters.tsx` (`'use client'`):
- Horizontal scrollable tabs: "All" + one tab per category
- Uses shadcn ToggleGroup
- Takes `categories: MenuCategory[]` as prop
- Emits `onFilterChange(categoryId: string | null)`
- "All" selected by default

- [ ] **Step 5: Create MenuItemCard component**

Create `components/menu-item-card.tsx`:
- shadcn Card with: item image (or placeholder gradient), name, short description, price
- "Add" button (disabled if store is closed)
- Clicking the card opens customization modal
- Warm styling: rounded-2xl, warm-50 bg, warm-200 border

- [ ] **Step 6: Create MenuGrid component**

Create `components/menu-grid.tsx` (`'use client'`):
- Receives `items: MenuItem[]` and `selectedCategory: string | null`
- Filters items by category
- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- Gap-4

- [ ] **Step 7: Wire up the homepage**

Update `app/page.tsx` (Server Component):
- Fetch categories and items from Supabase (server-side)
- Fetch store_settings for store hours
- Render Header, StoreStatusBanner, MenuFilters, MenuGrid
- Pass data as props to client components

- [ ] **Step 8: Verify menu page**

Run: `npm run dev`
Expected: Menu page shows categories, items with prices, filter tabs work, warm theme applied.

- [ ] **Step 9: Commit**

```bash
git add components/ lib/store-hours.ts app/page.tsx
git commit -m "feat: add menu page with category filters and item cards"
```

---

### Task 5: Item Customization Modal

**Files:**
- Create: `components/item-customization-modal.tsx`

- [ ] **Step 1: Create customization modal**

Create `components/item-customization-modal.tsx` (`'use client'`):
- Uses shadcn Dialog (or Sheet on mobile)
- Props: `item: MenuItem & { options: ItemOption[] }`, `open`, `onClose`
- Displays: item image, full description
- Option groups rendered dynamically: radio buttons for single-select groups (size, ice)
- Real-time price calculation: base price + sum of selected option adjustments
- Quantity selector (1-10)
- "Add to Cart" button showing total (e.g., "Add to Cart — $7.50")
- On add: calls `addItem` from CartProvider, shows toast, closes modal

- [ ] **Step 2: Wire modal to MenuItemCard**

Update `components/menu-item-card.tsx` to open the modal on click. Fetch item options when modal opens (or pre-fetch with the menu data).

- [ ] **Step 3: Update homepage data fetching**

Update `app/page.tsx` to also fetch `item_options` joined with menu items so the modal has the data it needs.

- [ ] **Step 4: Verify customization flow**

Test: Click item → modal opens → select options → price updates → add to cart → toast shows → cart count increases.

- [ ] **Step 5: Commit**

```bash
git add components/item-customization-modal.tsx components/menu-item-card.tsx app/page.tsx
git commit -m "feat: add item customization modal with real-time pricing"
```

---

### Task 6: Cart Page

**Files:**
- Create: `app/cart/page.tsx`
- Create: `components/cart-summary.tsx`
- Create: `components/delivery-form.tsx`

- [ ] **Step 1: Create CartSummary component**

Create `components/cart-summary.tsx` (`'use client'`):
- Lists cart items with: name, selected options, quantity, line total
- Edit quantity (increment/decrement) and remove buttons
- Uses CartProvider to read and modify cart
- Empty cart state: "Your cart is empty" with link back to menu

- [ ] **Step 2: Create DeliveryForm component**

Create `components/delivery-form.tsx` (`'use client'`):
- Order type toggle: Pickup / Delivery (shadcn ToggleGroup)
- If Delivery selected:
  - Address input fields: street, city, zip code
  - For logged-in users: dropdown of saved addresses + "Use new address"
  - Zip code validated against `delivery_zones` table (fetch on blur)
  - If valid: show delivery fee. If invalid: show error "We don't deliver to this area yet"
- Fetch delivery zones from Supabase on component mount
- Order notes textarea

- [ ] **Step 3: Create cart page**

Create `app/cart/page.tsx`:
- CartSummary + DeliveryForm side by side (stacked on mobile)
- Order summary sidebar: subtotal, delivery fee, total
- "Proceed to Checkout" button (disabled if cart empty or delivery zip invalid)
- Link to continue shopping

- [ ] **Step 4: Verify cart page**

Test: Add items → go to cart → see items → change quantities → toggle delivery → enter zip → see fee → proceed.

- [ ] **Step 5: Commit**

```bash
git add app/cart/ components/cart-summary.tsx components/delivery-form.tsx
git commit -m "feat: add cart page with delivery zone validation"
```

---

### Task 7: Authentication

**Files:**
- Create: `app/auth/login/page.tsx`
- Create: `app/auth/signup/page.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create login page**

Create `app/auth/login/page.tsx`:
- Email + password form using shadcn Input, Label, Button
- "Don't have an account? Sign up" link
- Supabase `signInWithPassword` on submit
- Redirect to homepage on success
- Error display for invalid credentials
- Warm styling consistent with site

- [ ] **Step 2: Create signup page**

Create `app/auth/signup/page.tsx`:
- Name, email, phone, password fields
- Supabase `signUp` on submit
- After auth signup, create a row in `customers` table
- "Already have an account? Log in" link
- Redirect to homepage on success

- [ ] **Step 3: Create auth callback route**

Create `app/auth/callback/route.ts`:
- Handles Supabase auth redirects (email confirmation)
- Exchanges code for session
- Redirects to homepage

- [ ] **Step 4: Update header with auth state**

Update `components/header.tsx`:
- Check auth state via Supabase client
- Show "Login" / "Sign Up" when logged out
- Show "Profile" / "Points: X" / "Log Out" when logged in
- Points balance fetched from `customers` table

- [ ] **Step 5: Verify auth flow**

Test: Sign up → verify email shows up → log in → header updates → log out → header updates.

- [ ] **Step 6: Commit**

```bash
git add app/auth/ components/header.tsx
git commit -m "feat: add authentication with login, signup, and session handling"
```

---

### Task 8: Checkout & Stripe Integration

**Files:**
- Create: `app/checkout/page.tsx`
- Create: `components/checkout-form.tsx`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/orders/route.ts`
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/confirmation/page.tsx`
- Create: `lib/stripe.ts`

- [ ] **Step 1: Create Stripe client utility**

Create `lib/stripe.ts`:
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

- [ ] **Step 2: Create order creation API route**

Create `app/api/orders/route.ts` (POST):
- Receives: cart items, order type, delivery info, contact info, payment method, points to redeem
- Validates: items exist and prices match, delivery zip is valid (if delivery), points are available
- Creates order + order_items in Supabase (using admin client)
- If customer is logged in: link order to customer_id, handle points redemption (atomic update)
- Returns: order ID

- [ ] **Step 3: Create Stripe Checkout API route**

Create `app/api/checkout/route.ts` (POST):
- Receives: order ID
- Fetches order from Supabase
- Creates Stripe Checkout Session:
  - line_items from order_items
  - If logged-in customer has stripe_customer_id: pass `customer` parameter (enables saved cards)
  - If new customer: create Stripe Customer, save stripe_customer_id to customers table
  - success_url: `/confirmation?order_id={ORDER_ID}`
  - cancel_url: `/cart`
  - payment_intent_data.setup_future_usage: 'on_session' (to save card)
- Returns: Stripe Checkout URL

- [ ] **Step 4: Create Stripe webhook handler**

Create `app/api/webhooks/stripe/route.ts` (POST):
- Verify webhook signature using `stripe.webhooks.constructEvent`
- Handle `checkout.session.completed`:
  - Update order `payment_status` to 'paid', `status` to 'confirmed'
  - If customer logged in: award loyalty points (1 point per $1)
  - Insert `loyalty_points` ledger entry
  - Atomic update `customers.points_balance`
- Export `const runtime = 'nodejs'` (webhooks need Node.js)
- Do NOT apply auth middleware (already excluded via proxy.ts path check)

- [ ] **Step 5: Create checkout form component**

Create `components/checkout-form.tsx` (`'use client'`):
- Contact info fields: name, email, phone (pre-filled if logged in)
- Payment method selection:
  - "Pay with Card" → redirects to Stripe Checkout
  - "Pay with Cash/Venmo" → places order directly
- If logged in with 50+ points: "Use Points" toggle, shows redemption in 50-point increments ($5 each)
- Account nudge for guest users: "Create an account to earn points on this order!" banner with sign-up link
- Order summary: items, subtotal, discount (if points), delivery fee, total
- "Place Order" button (disabled if store is closed — server-side validation in order route too):
  - If card: POST to `/api/orders` → POST to `/api/checkout` → redirect to Stripe
  - If cash: POST to `/api/orders` → redirect to `/confirmation?order_id=X`

- [ ] **Step 6: Create checkout page**

Create `app/checkout/page.tsx`:
- Reads cart from CartProvider
- Reads delivery info from URL params or session state
- Renders CheckoutForm
- Redirects to cart if cart is empty

- [ ] **Step 7: Create confirmation page**

Create `app/confirmation/page.tsx`:
- Reads `order_id` from URL search params
- Fetches order details from Supabase
- Displays: order number, items, total, order type, payment status, estimated time (e.g., "~15-20 minutes for pickup", "~30-45 minutes for delivery")
- "Back to Menu" button
- Clears cart on mount

- [ ] **Step 8: Verify checkout flow (card)**

Test: Add items → cart → checkout → fill info → select card → Stripe Checkout opens → use test card 4242... → redirected to confirmation → order in Supabase with status confirmed.

- [ ] **Step 9: Verify checkout flow (cash/venmo)**

Test: Add items → cart → checkout → select cash/venmo → place order → confirmation page → order in Supabase with payment_status pending.

- [ ] **Step 10: Commit**

```bash
git add app/checkout/ app/confirmation/ app/api/ components/checkout-form.tsx lib/stripe.ts
git commit -m "feat: add checkout with Stripe payments and cash/venmo option"
```

---

### Task 9: Order Confirmation Email

**Files:**
- Create: `lib/resend.ts`
- Create: `components/email/order-confirmation.tsx`
- Modify: `app/api/orders/route.ts`

- [ ] **Step 1: Create Resend client**

Create `lib/resend.ts`:
```typescript
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY!)
```

- [ ] **Step 2: Create email template**

Create `components/email/order-confirmation.tsx` using React Email:
- "The Happy Cup" header
- Order number, date
- Items table: name, options, qty, price
- Subtotal, discount, delivery fee, total
- Order type (pickup/delivery) + address if delivery
- Payment method + status
- "Thank you for your order!" footer

- [ ] **Step 3: Send email after order creation**

Modify `app/api/orders/route.ts`:
- After creating the order, send confirmation email via Resend
- Use `resend.emails.send()` with the React Email template
- Send to customer_email
- From: "The Happy Cup <orders@thehappycup.com>" (or your verified domain)

- [ ] **Step 4: Verify email**

Test: Place an order → check email inbox for confirmation. (Use Resend test mode or a real email.)

- [ ] **Step 5: Commit**

```bash
git add lib/resend.ts components/email/ app/api/orders/route.ts
git commit -m "feat: add order confirmation email via Resend"
```

---

### Task 10: Customer Profile

**Files:**
- Create: `app/profile/page.tsx`
- Create: `app/profile/orders/page.tsx`
- Create: `app/profile/addresses/page.tsx`

- [ ] **Step 1: Create profile overview page**

Create `app/profile/page.tsx`:
- Customer name, email, phone
- Loyalty points balance (large, prominent)
- Points history: recent earned/redeemed entries
- Quick links: Order History, Saved Addresses, Saved Payment Methods
- Saved payment methods: link to Stripe Customer Portal (or list saved cards via Stripe API with last4/brand)
- "Log Out" button

- [ ] **Step 2: Create order history page**

Create `app/profile/orders/page.tsx`:
- List of past orders, newest first
- Each order: date, items summary, total, status badge, order type badge
- Click to expand full details

- [ ] **Step 3: Create saved addresses page**

Create `app/profile/addresses/page.tsx`:
- List saved addresses with "Default" badge
- Add new address form
- Edit/delete existing addresses
- Set default address

- [ ] **Step 4: Verify profile**

Test: Log in → go to profile → see points → check order history → manage addresses.

- [ ] **Step 5: Commit**

```bash
git add app/profile/
git commit -m "feat: add customer profile with order history and addresses"
```

---

## Phase 3: Admin Dashboard

### Task 11: Admin Layout & Orders

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/admin-sidebar.tsx`
- Create: `components/admin/order-card.tsx`
- Create: `components/admin/order-feed.tsx`
- Create: `app/api/orders/[id]/status/route.ts`

- [ ] **Step 1: Create admin sidebar**

Create `components/admin/admin-sidebar.tsx`:
- Vertical nav: Orders, Menu, Customers, Settings
- Active state highlighting
- Logo at top
- Dark warm-600 background, white text

- [ ] **Step 2: Create admin layout**

Create `app/admin/layout.tsx`:
- Sidebar + main content area
- Responsive: sidebar collapses to top nav on mobile
- No public header/footer — separate admin chrome

- [ ] **Step 3: Create OrderCard component**

Create `components/admin/order-card.tsx`:
- Displays: customer name, items list, order type badge (pickup/delivery), payment status badge, time ago
- Expandable: shows full order details, delivery address, notes
- Status advancement button: shows next logical status
  - Pickup: pending → confirmed → preparing → ready → completed
  - Delivery: pending → confirmed → preparing → ready → out_for_delivery → completed
- Calls PATCH `/api/orders/[id]/status` on click

- [ ] **Step 4: Create order status API route**

Create `app/api/orders/[id]/status/route.ts` (PATCH):
- Receives: new status
- Validates: status transition is valid
- Updates order in Supabase (admin client)
- Returns updated order

- [ ] **Step 5: Create OrderFeed component with real-time**

Create `components/admin/order-feed.tsx` (`'use client'`):
- Fetches orders from Supabase
- Filter tabs: All | New | Preparing | Ready | Completed
- Subscribes to Supabase real-time channel on `orders` table
- New order: plays notification sound + browser notification
- Renders list of OrderCard components

- [ ] **Step 6: Create admin orders page**

Create `app/admin/page.tsx`:
- Renders OrderFeed
- "Today's Stats" summary: total orders, revenue, pending orders

- [ ] **Step 7: Verify admin orders**

Test: Place an order from storefront → admin page shows it in real-time → advance status → status updates.

- [ ] **Step 8: Commit**

```bash
git add app/admin/ components/admin/ app/api/orders/
git commit -m "feat: add admin orders dashboard with real-time updates"
```

---

### Task 12: Admin Menu Management

**Files:**
- Create: `app/admin/menu/page.tsx`
- Create: `components/admin/menu-list.tsx`
- Create: `components/admin/menu-item-form.tsx`
- Create: `app/api/admin/menu/route.ts`
- Create: `app/api/admin/menu/[id]/route.ts`
- Create: `app/api/admin/menu/upload/route.ts`

- [ ] **Step 1: Create menu CRUD API routes**

Create `app/api/admin/menu/route.ts`:
- GET: list all items with categories and options
- POST: create new item (with options)

Create `app/api/admin/menu/[id]/route.ts`:
- PATCH: update item fields, options, availability
- DELETE: delete item

Create `app/api/admin/menu/upload/route.ts`:
- POST: upload image to Supabase Storage, return public URL
- Validate: max 5MB, JPEG/PNG/WebP only. Reject with 400 if invalid.

All routes use admin Supabase client. Verify admin role from session.

- [ ] **Step 2: Create MenuItemForm component**

Create `components/admin/menu-item-form.tsx` (`'use client'`):
- Form fields: name, description, price, category (dropdown), image upload
- Dynamic option groups: add/remove option groups, add/remove options within groups
- Edit mode: pre-fills form with existing data
- Submit: POST or PATCH to API

- [ ] **Step 3: Create MenuList component**

Create `components/admin/menu-list.tsx` (`'use client'`):
- Items grouped by category
- Each item: name, price, availability toggle (Switch), edit button, delete button
- Drag-to-reorder items within categories using `@dnd-kit/sortable`. On drop, PATCH `display_order` for affected items.
- Toggle calls PATCH to update `is_available`
- Delete shows confirmation dialog (AlertDialog)

- [ ] **Step 4: Create admin menu page**

Create `app/admin/menu/page.tsx`:
- "Add Item" button → opens MenuItemForm in a Dialog
- MenuList showing all items
- Category management (add/rename/reorder categories)

- [ ] **Step 5: Verify menu management**

Test: Add item with options → appears in storefront → toggle availability → item shows "Sold Out" → edit item → changes reflected → delete item → removed.

- [ ] **Step 6: Commit**

```bash
git add app/admin/menu/ components/admin/menu-list.tsx components/admin/menu-item-form.tsx app/api/admin/menu/
git commit -m "feat: add admin menu management with image upload"
```

---

### Task 13: Admin Customers & Settings

**Files:**
- Create: `app/admin/customers/page.tsx`
- Create: `components/admin/customer-table.tsx`
- Create: `app/api/admin/customers/[id]/points/route.ts`
- Create: `app/admin/settings/page.tsx`
- Create: `components/admin/delivery-zone-manager.tsx`
- Create: `components/admin/store-hours-form.tsx`
- Create: `app/api/admin/settings/route.ts`
- Create: `app/api/admin/delivery-zones/route.ts`

- [ ] **Step 1: Create customer points API**

Create `app/api/admin/customers/[id]/points/route.ts` (POST):
- Receives: points amount, description
- Creates loyalty_points ledger entry (type: adjustment)
- Atomic update customers.points_balance
- Returns updated customer

- [ ] **Step 2: Create CustomerTable component**

Create `components/admin/customer-table.tsx`:
- shadcn Table: name, email, orders count, total spent, points balance
- "Adjust Points" button per row → opens dialog with amount + reason input
- Sortable columns

- [ ] **Step 3: Create admin customers page**

Create `app/admin/customers/page.tsx`:
- Fetches customers with order stats (using Supabase aggregate query)
- Renders CustomerTable

- [ ] **Step 4: Create settings API routes**

Create `app/api/admin/settings/route.ts`:
- GET: fetch store_settings
- PATCH: update store_settings by key

Create `app/api/admin/delivery-zones/route.ts`:
- GET: list all delivery zones
- POST: add zone (zip + fee)
- DELETE: remove zone

- [ ] **Step 5: Create DeliveryZoneManager component**

Create `components/admin/delivery-zone-manager.tsx` (`'use client'`):
- List of zip codes with delivery fee
- Add new zip + fee
- Remove zip
- Toggle active/inactive

- [ ] **Step 6: Create StoreHoursForm component**

Create `components/admin/store-hours-form.tsx` (`'use client'`):
- Day-by-day open/close time inputs
- "Closed" toggle per day
- Save button → PATCH store_settings

- [ ] **Step 7: Create admin settings page**

Create `app/admin/settings/page.tsx`:
- Tabs: Delivery Zones | Store Hours | Contact Info
- Each tab renders its respective component

- [ ] **Step 8: Verify admin settings**

Test: Add delivery zone → storefront validates it → change store hours → storefront reflects → adjust customer points → profile reflects.

- [ ] **Step 9: Commit**

```bash
git add app/admin/customers/ app/admin/settings/ components/admin/ app/api/admin/
git commit -m "feat: add admin customers, delivery zones, and store hours management"
```

---

## Phase 4: Polish & Deploy

### Task 14: Mobile Responsiveness & Polish

**Files:**
- Modify: various component files

- [ ] **Step 1: Audit mobile layouts**

Test all pages at 375px (iPhone SE) and 390px (iPhone 14) widths:
- Menu page: single column grid, horizontal scrolling filter tabs
- Cart page: stacked layout
- Checkout: full-width form
- Admin: sidebar collapses to top hamburger menu
- Profile: stacked cards

- [ ] **Step 2: Fix any responsive issues**

Address any overflow, truncation, or layout issues found in mobile audit.

- [ ] **Step 3: Add loading states**

Add loading.tsx files for key routes:
- `app/loading.tsx` — skeleton menu grid
- `app/cart/loading.tsx` — skeleton cart
- `app/admin/loading.tsx` — skeleton order feed

- [ ] **Step 4: Add error boundaries**

Add error.tsx files:
- `app/error.tsx` — generic error with "Try again" button
- `app/admin/error.tsx` — admin error boundary

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add mobile responsiveness, loading states, and error boundaries"
```

- [ ] **Step 6: Accessibility audit**

Check all customer-facing pages for WCAG 2.1 AA compliance:
- Keyboard navigation: all interactive elements reachable via Tab, actionable via Enter/Space
- ARIA labels on icon-only buttons (cart, close, menu toggle)
- Color contrast: verify warm palette meets 4.5:1 ratio for text (use browser DevTools)
- Focus indicators visible on all interactive elements
- Screen reader test: verify logical reading order on menu and checkout pages
- Add `not-found.tsx` pages for 404 states

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add accessibility improvements and not-found pages"
```

---

### Task 15: Deploy to Vercel

**Files:**
- Modify: `next.config.ts` (if needed for image domains)

- [ ] **Step 1: Link to Vercel**

```bash
cd /Users/rosendolopez/thehappycup
vercel link
```

- [ ] **Step 2: Add environment variables**

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```

- [ ] **Step 3: Configure Stripe webhook for production**

In Stripe Dashboard:
- Add webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
- Subscribe to: `checkout.session.completed`
- Copy webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel

- [ ] **Step 4: Configure next.config.ts for Supabase images**

Add Supabase Storage domain to `images.remotePatterns` in `next.config.ts`.

- [ ] **Step 5: Deploy**

```bash
vercel --prod
```

- [ ] **Step 6: Verify production**

Test full flow on production URL:
- Browse menu → add to cart → checkout with test card → confirmation email received
- Admin login → see order → advance status
- Mobile: full flow on phone

- [ ] **Step 7: Set up your admin account**

In Supabase Dashboard > Authentication > Users:
- Find your user account
- Edit user > Raw app_metadata: `{"role": "admin"}`
- Save

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "chore: configure deployment and production settings"
```

---

## Summary

| Phase | Tasks | What's Working After |
|-------|-------|---------------------|
| 1: Setup | Tasks 1-2 | Project scaffolded, DB ready, seed data loaded |
| 2: Storefront | Tasks 3-10 | Full ordering flow: browse → customize → cart → checkout → confirmation + email + auth + profile |
| 3: Admin | Tasks 11-13 | Admin dashboard: real-time orders, menu CRUD, customer management, settings |
| 4: Polish | Tasks 14-15 | Mobile-ready, deployed to Vercel, production-ready |
