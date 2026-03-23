# The Happy Cup — Online Ordering Platform

**Date:** 2026-03-22
**Status:** Reviewed

## Overview

The Happy Cup is an online ordering platform for a home-based drink business selling non-alcoholic Red Bull energy drinks with flavoring, matcha, coffee, and treats. Customers browse a menu, customize drinks, and place orders for pickup or self-delivery. The platform includes customer accounts with a loyalty points system, saved payment methods, and an admin dashboard for order and menu management.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Storefront + admin, SSR/SSG |
| Database | Supabase (Postgres) | Data, auth, real-time, file storage |
| Payments | Stripe (Checkout + saved cards) | Online card payments, PCI compliance |
| Hosting | Vercel | Deployment, edge network, serverless functions |
| UI | shadcn/ui + Tailwind CSS | Component library, warm theme |
| Email | Resend | Order confirmation emails |

## Visual Design

- **Direction:** Warm & inviting
- **Palette:** Creamy whites (#faf6f1), warm browns (#3d2c1e, #6b5440), soft accents (#c4a882, #e8ddd0)
- **Typography:** Geist Sans for UI, Geist Mono for prices/order IDs
- **Shape language:** Rounded corners (12–16px), soft shadows, gentle borders
- **Layout:** Menu-first homepage — no hero splash, straight to ordering

## Site Structure

### Customer Storefront (Public)

#### Menu Page (Homepage)
- Category filter tabs: All | Energy Drinks | Matcha | Coffee | Treats
- Item cards: photo, name, short description, price
- Click item to open customization view
- Header: logo, navigation (Menu, Points, Profile), cart with item count
- Shows "We're closed" banner outside store hours

#### Item Customization (Modal/Slide-over)
- Item photo, full description
- Option groups: size, flavoring, ice level (varies per item)
- Price adjustments shown in real-time as options are selected
- Quantity selector
- "Add to Cart" button with total

#### Cart Page
- Line items with selected options, quantity, line total
- Edit/remove items
- Order type toggle: Pickup or Delivery
- If delivery: address input (saved addresses for logged-in users), zip code validated against delivery zones, delivery fee shown
- Order notes field (e.g., "extra ice")
- Subtotal, delivery fee, total

#### Checkout
- Contact info: name, email, phone (pre-filled if logged in)
- Payment method selection:
  - Saved card (logged-in users with prior payments)
  - New card via Stripe Checkout
  - Cash/Venmo (order placed with payment_status: pending)
- Account nudge for guest users: "Create an account to earn points on this order!"
- Place Order button

#### Order Confirmation Page
- Order number, summary of items, total
- Estimated pickup/delivery time
- Confirmation email sent via Resend

#### Customer Profile (Authenticated)
- Order history with status
- Saved delivery addresses (add/edit/remove, set default)
- Saved payment methods (managed via Stripe)
- Loyalty points balance and history

#### Authentication
- Sign up / log in with email + password (Supabase Auth)
- Guest checkout available without an account

### Admin Dashboard (Protected)

#### Orders View
- Real-time order feed via Supabase real-time subscriptions
- Order cards: customer name, items, order type badge (pickup/delivery), payment status, time since placed
- Filter tabs: All | New | Preparing | Ready | Completed
- Expand order for full details
- One-click status advancement: "Start Preparing" → "Mark Ready" → "Out for Delivery" → "Complete"
- Audio/browser notification on new orders

#### Menu Management
- Items listed by category
- Add/edit item: name, description, price, photo upload (Supabase Storage), category, customization option groups
- Toggle availability switch (sold out without deleting)
- Drag to reorder within categories

#### Customers
- Customer list: name, email, order count, total spent, points balance
- Manually adjust loyalty points (bonus points, promos)

#### Settings
- Delivery zones: manage zip codes, set delivery fee per zone
- Store hours: set open/close times per day, controls ordering availability
- Contact info displayed on storefront

## Database Schema

### Tables

**menu_categories**
- id (uuid, PK)
- name (text)
- display_order (int)
- image_url (text, nullable)
- created_at (timestamptz)

**menu_items**
- id (uuid, PK)
- category_id (uuid, FK → menu_categories)
- name (text)
- description (text)
- price (decimal)
- image_url (text, nullable)
- is_available (boolean, default true)
- display_order (int)
- created_at (timestamptz)

**item_options**
- id (uuid, PK)
- item_id (uuid, FK → menu_items)
- option_group (text, e.g., "size", "flavor", "ice")
- option_name (text, e.g., "Large", "Vanilla", "Light Ice")
- price_adjustment (decimal, default 0)
- display_order (int)

**customers**
- id (uuid, PK)
- user_id (uuid, FK → Supabase Auth)
- name (text)
- email (text)
- phone (text, nullable)
- stripe_customer_id (text, nullable)
- points_balance (int, default 0)
- created_at (timestamptz)

**customer_addresses**
- id (uuid, PK)
- customer_id (uuid, FK → customers)
- label (text, e.g., "Home", "Work")
- address_line (text)
- city (text)
- zip_code (text)
- is_default (boolean, default false)

**orders**
- id (uuid, PK)
- customer_id (uuid, FK → customers, nullable for guest orders)
- status (enum: pending, confirmed, preparing, ready, out_for_delivery, completed, cancelled)
- order_type (enum: pickup, delivery)
- payment_method (enum: card, cash_venmo)
- payment_status (enum: pending, paid, failed, refunded)
- stripe_checkout_session_id (text, nullable)
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- delivery_address (text, nullable)
- delivery_zip (text, nullable)
- delivery_fee (decimal, default 0)
- subtotal (decimal)
- discount (decimal, default 0)
- total (decimal)
- notes (text, nullable)
- points_earned (int, default 0)
- points_redeemed (int, default 0)
- created_at (timestamptz)

**order_items**
- id (uuid, PK)
- order_id (uuid, FK → orders)
- menu_item_id (uuid, FK → menu_items)
- item_name (text, snapshot at order time)
- quantity (int)
- unit_price (decimal)
- selected_options (jsonb, e.g., {"size": "Large", "flavor": "Vanilla"})
- line_total (decimal)

**loyalty_points**
- id (uuid, PK)
- customer_id (uuid, FK → customers)
- order_id (uuid, FK → orders, nullable)
- points (int, positive for earned, negative for redeemed)
- type (enum: earned, redeemed, adjustment)
- description (text, e.g., "Earned from order #123", "Redeemed $5 off")
- created_at (timestamptz)

**delivery_zones**
- id (uuid, PK)
- zip_code (text)
- delivery_fee (decimal)
- is_active (boolean, default true)

**store_settings**
- id (uuid, PK)
- key (text, unique)
- value (jsonb)

### Key Relationships
- menu_items → menu_categories (many-to-one)
- item_options → menu_items (many-to-one)
- orders → customers (many-to-one, nullable)
- order_items → orders (many-to-one)
- order_items → menu_items (many-to-one)
- loyalty_points → customers (many-to-one)
- customer_addresses → customers (many-to-one)

## Order Flow

```
Customer browses menu
  → Selects item → Customizes (size, flavor, ice) → Adds to cart
  → Reviews cart → Chooses pickup or delivery
  → If delivery: enters address → zip validated against delivery_zones → fee applied
  → Enters contact info (or uses saved profile)
  → Chooses payment:
      → Card: Stripe Checkout Session created → customer pays → webhook confirms
      → Cash/Venmo: order placed with payment_status: pending
  → Order created with status: pending
  → Confirmation page shown + email sent via Resend
  → If logged in: loyalty points earned
  → Admin sees order in real-time → advances status
  → Customer receives order → status: completed
```

## Payment Integration

- **Stripe Checkout** for card payments (hosted by Stripe, no custom card form)
- **Stripe Customer** objects created for logged-in users
- **Saved cards:** Stripe Checkout with `customer` parameter — returning customers see their saved payment methods within the Stripe Checkout page. No custom card form needed.
- **Stripe Webhooks** at `/api/webhooks/stripe` to confirm payment status (checkout.session.completed). Must verify webhook signature.
- **Cash/Venmo** orders tracked manually — payment_status updated by admin
- **Tax:** not collected at launch. A `tax` field can be added to `orders` later if required by jurisdiction.
- **Refunds:** handled manually through Stripe Dashboard at launch. Future: admin-initiated refund button.

## Loyalty Points

- Earn: 1 point per $1 spent (applied after payment confirmed)
- Redeem: 50 points = $5 discount, in 50-point increments only (no partial redemption)
- Checkout UI: "Use points" toggle appears if customer has 50+ points, shows how many increments they can redeem
- Points balance stored on customers table, ledger in loyalty_points table
- Points updates use atomic SQL (UPDATE ... SET points_balance = points_balance + X) to prevent race conditions
- Admin can manually adjust points for promotions
- Points displayed in header (logged-in), profile page, and checkout

## Authentication & Authorization

- **Supabase Auth** for both customer and admin accounts
- **Customers:** email + password sign-up, guest checkout available
- **Admins:** admin role stored via Supabase Auth custom claims (app_metadata.role = "admin"), set manually in Supabase dashboard or via admin API
- **Route protection:** /admin/* routes require admin role claim, /profile/* routes require authentication
- **RLS policies:** customers can only read/write their own data, admins (role = "admin" in JWT) have full access
- **Guest order linking:** guest orders are not retroactively linked to accounts. If a guest later signs up, their previous orders remain unlinked. Future enhancement if needed.

## Email

- **Resend** for transactional emails
- Order confirmation: order summary, items, total, order type, estimated time
- Future: order status updates, loyalty points notifications

## Delivery

- Self-delivery by the business
- Delivery zone defined by zip codes in delivery_zones table
- Delivery fee configurable per zip code
- Address validated at checkout — rejected if zip not in active delivery zones
- Future upgrade path: radius-based delivery zones

## Non-Functional Requirements

- **Mobile-first:** majority of orders will come from phones
- **Performance:** menu page should load in under 2 seconds
- **Accessibility:** WCAG 2.1 AA compliance for all customer-facing pages
- **Security:** Supabase RLS for data access, Stripe for PCI compliance, input validation on all forms
- **Scalability:** Supabase + Vercel serverless handles growth without infrastructure changes

## Implementation Notes

- **Cart storage:** localStorage for all users. Cart is client-side only — not synced to database.
- **Store hours:** when closed, menu is visible but "Add to Cart" and ordering are disabled. Banner shows next open time.
- **Pickup orders:** skip `out_for_delivery` status — flow is pending → confirmed → preparing → ready → completed. Admin UI is context-aware.
- **Image uploads:** menu item photos stored in Supabase Storage. Max 5MB, JPEG/PNG/WebP. Rendered with next/image for optimization.
- **Webhook route:** `/api/webhooks/stripe` must be excluded from CSRF/auth middleware.
