// ============================================================
// Enum Union Types
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type OrderType = 'pickup' | 'delivery'

export type PaymentMethod = 'card' | 'cash_venmo'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type PointsType = 'earned' | 'redeemed' | 'adjustment'

// ============================================================
// Store Settings Types
// ============================================================

export type DayHours = {
  open: string  // e.g. "07:00"
  close: string // e.g. "19:00"
}

export type StoreHours = {
  monday:    DayHours
  tuesday:   DayHours
  wednesday: DayHours
  thursday:  DayHours
  friday:    DayHours
  saturday:  DayHours
  sunday:    DayHours
}

// ============================================================
// Database Table Interfaces
// ============================================================

export type MenuCategory = {
  id:           string
  name:         string
  display_order: number
  image_url:    string | null
  created_at:   string
}

export type MenuItem = {
  id:           string
  category_id:  string
  name:         string
  description:  string | null
  price:        number
  image_url:    string | null
  is_available: boolean
  display_order: number
  created_at:   string
}

export type ItemOption = {
  id:               string
  item_id:          string
  option_group:     string
  option_name:      string
  price_adjustment: number
  display_order:    number
}

export type Customer = {
  id:                 string
  user_id:            string
  name:               string
  email:              string
  phone:              string | null
  stripe_customer_id: string | null
  points_balance:     number
  created_at:         string
}

export type CustomerAddress = {
  id:           string
  customer_id:  string
  label:        string
  address_line: string
  city:         string
  zip_code:     string
  is_default:   boolean
}

export type Order = {
  id:                         string
  customer_id:                string | null
  status:                     OrderStatus
  order_type:                 OrderType
  payment_method:             PaymentMethod
  payment_status:             PaymentStatus
  stripe_checkout_session_id: string | null
  customer_name:              string
  customer_email:             string
  customer_phone:             string | null
  delivery_address:           string | null
  delivery_zip:               string | null
  delivery_fee:               number
  subtotal:                   number
  discount:                   number
  total:                      number
  notes:                      string | null
  points_earned:              number
  points_redeemed:            number
  created_at:                 string
}

export type OrderItem = {
  id:               string
  order_id:         string
  menu_item_id:     string
  item_name:        string
  quantity:         number
  unit_price:       number
  selected_options: Record<string, { name: string; priceAdjustment: number }>
  line_total:       number
}

export type LoyaltyPoints = {
  id:          string
  customer_id: string
  order_id:    string | null
  points:      number
  type:        PointsType
  description: string | null
  created_at:  string
}

export type DeliveryZone = {
  id:           string
  zip_code:     string
  delivery_fee: number
  is_active:    boolean
}

export type StoreSetting = {
  id:    string
  key:   string
  value: Record<string, unknown>
}

// ============================================================
// Recipe & Inventory Types
// ============================================================

export type Ingredient = {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  stock_quantity: number
  low_stock_threshold: number
  supplier: string | null
  created_at: string
}

export type Recipe = {
  id: string
  menu_item_id: string | null
  item_option_id: string | null
  size_variant: string | null
  created_at: string
}

export type RecipeIngredient = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  notes: string | null
}

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & { ingredients: Ingredient })[]
}

// ============================================================
// Cart Type
// ============================================================

export type CartItem = {
  menuItemId:      string
  name:            string
  price:           number
  quantity:        number
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>
  lineTotal:       number
  imageUrl:        string | null
}
