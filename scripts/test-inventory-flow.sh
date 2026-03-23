#!/usr/bin/env bash
# Test script: verifies inventory deduction on order confirmation
# Usage: BASE_URL=http://localhost:3000 bash scripts/test-inventory-flow.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ3ZwYmdwaXh5dXJzYnV1cWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIyNzgyOCwiZXhwIjoyMDg5ODAzODI4fQ.bktZ36AXymTaqNVjoeRZ7Ro03nds6VIfReX8ZU72Emk"
SUPABASE_URL="https://zhgvpbgpixyursbuuqfr.supabase.co"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

echo ""
echo "=== Inventory Deduction Flow Test ==="
echo "Base URL: $BASE_URL"
echo ""

# ── 1. Find a menu item that has a recipe ─────────────────────────────────────
echo "1. Finding a menu item with a recipe..."
RECIPES=$(curl -s "$SUPABASE_URL/rest/v1/recipes?select=id,menu_item_id,size_variant&limit=1" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK")

RECIPE_ID=$(echo "$RECIPES" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null || echo "")
MENU_ITEM_ID=$(echo "$RECIPES" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['menu_item_id'] if d else '')" 2>/dev/null || echo "")
SIZE_VARIANT=$(echo "$RECIPES" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['size_variant'] or '' if d else '')" 2>/dev/null || echo "")

if [ -z "$MENU_ITEM_ID" ]; then
  echo "  SKIP: No recipes found in DB — seed recipes first"
  exit 0
fi
echo "  Menu item: $MENU_ITEM_ID  size: ${SIZE_VARIANT:-base}"

# ── 2. Record stock of all ingredients in this recipe ─────────────────────────
echo ""
echo "2. Recording ingredient stock before order..."
RECIPE_INGREDIENTS=$(curl -s "$SUPABASE_URL/rest/v1/recipe_ingredients?select=ingredient_id,quantity&recipe_id=eq.$RECIPE_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK")

INGREDIENT_ID=$(echo "$RECIPE_INGREDIENTS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['ingredient_id'] if d else '')" 2>/dev/null || echo "")
RECIPE_QTY=$(echo "$RECIPE_INGREDIENTS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['quantity'] if d else 0)" 2>/dev/null || echo "0")

if [ -z "$INGREDIENT_ID" ]; then
  echo "  SKIP: Recipe has no ingredients"
  exit 0
fi

STOCK_BEFORE=$(curl -s "$SUPABASE_URL/rest/v1/ingredients?select=stock_quantity&id=eq.$INGREDIENT_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['stock_quantity'] if d else 0)" 2>/dev/null || echo "0")
echo "  Ingredient: $INGREDIENT_ID"
echo "  Stock before: $STOCK_BEFORE  recipe qty: $RECIPE_QTY"

# ── 3. Fetch menu item price ───────────────────────────────────────────────────
MENU_ITEM=$(curl -s "$SUPABASE_URL/rest/v1/menu_items?select=name,price&id=eq.$MENU_ITEM_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK")
ITEM_NAME=$(echo "$MENU_ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['name'] if d else 'Test Item')" 2>/dev/null || echo "Test Item")
ITEM_PRICE=$(echo "$MENU_ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['price'] if d else 5.00)" 2>/dev/null || echo "5.00")

# ── 4. Build selected_options (include size if recipe has size_variant) ────────
if [ -n "$SIZE_VARIANT" ]; then
  SIZE_LABEL="Small (12oz)"
  if [ "$SIZE_VARIANT" = "medium" ]; then SIZE_LABEL="Medium (16oz)"; fi
  if [ "$SIZE_VARIANT" = "large" ]; then SIZE_LABEL="Large (24oz)"; fi
  SELECTED_OPTS="{\"size\":{\"name\":\"$SIZE_LABEL\",\"priceAdjustment\":0}}"
else
  SELECTED_OPTS="{}"
fi

# ── 5. Create a test order ─────────────────────────────────────────────────────
echo ""
echo "3. Creating test order..."
ORDER_PAYLOAD=$(python3 -c "
import json
payload = {
  'customer_name': 'Test Script',
  'customer_email': 'test@script.local',
  'order_type': 'pickup',
  'payment_method': 'cash_venmo',
  'subtotal': float('$ITEM_PRICE'),
  'delivery_fee': 0,
  'discount': 0,
  'total': float('$ITEM_PRICE'),
  'items': [{
    'menu_item_id': '$MENU_ITEM_ID',
    'item_name': '$ITEM_NAME',
    'quantity': 1,
    'unit_price': float('$ITEM_PRICE'),
    'selected_options': $SELECTED_OPTS,
    'line_total': float('$ITEM_PRICE')
  }]
}
print(json.dumps(payload))
")

ORDER_RESP=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d "$ORDER_PAYLOAD")

ORDER_ID=$(echo "$ORDER_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
if [ -z "$ORDER_ID" ]; then
  echo "  Response: $ORDER_RESP"
  fail "Failed to create test order"
  echo ""
  echo "Summary: $PASS passed, $FAIL failed"
  exit 1
fi
pass "Order created: $ORDER_ID"

# ── 6. Confirm the order (triggers inventory deduction) ───────────────────────
echo ""
echo "4. Confirming order (triggers inventory deduction)..."
CONFIRM_RESP=$(curl -s -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}')

CONFIRMED_STATUS=$(echo "$CONFIRM_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
if [ "$CONFIRMED_STATUS" = "confirmed" ]; then
  pass "Order status updated to confirmed"
else
  echo "  Response: $CONFIRM_RESP"
  fail "Order confirmation failed"
fi

# Give DB a moment to propagate
sleep 1

# ── 7. Check ingredient stock decreased ───────────────────────────────────────
echo ""
echo "5. Checking ingredient stock decreased..."
STOCK_AFTER=$(curl -s "$SUPABASE_URL/rest/v1/ingredients?select=stock_quantity&id=eq.$INGREDIENT_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['stock_quantity'] if d else 0)" 2>/dev/null || echo "0")

EXPECTED=$(python3 -c "before=float('$STOCK_BEFORE'); qty=float('$RECIPE_QTY'); print(max(0, before-qty))")
echo "  Stock after:    $STOCK_AFTER"
echo "  Expected:       $EXPECTED"

if python3 -c "import sys; sys.exit(0 if abs(float('$STOCK_AFTER') - float('$EXPECTED')) < 0.001 else 1)"; then
  pass "Ingredient stock decreased by $RECIPE_QTY"
else
  fail "Stock mismatch — got $STOCK_AFTER, expected $EXPECTED"
fi

# ── 8. Check inventory_log entry was created ──────────────────────────────────
echo ""
echo "6. Checking inventory_log entry was created..."
LOG_ENTRY=$(curl -s "$SUPABASE_URL/rest/v1/inventory_log?select=id,quantity_change&order_id=eq.$ORDER_ID&ingredient_id=eq.$INGREDIENT_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK")

LOG_COUNT=$(echo "$LOG_ENTRY" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
if [ "$LOG_COUNT" -gt 0 ]; then
  LOG_CHANGE=$(echo "$LOG_ENTRY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['quantity_change'])" 2>/dev/null || echo "?")
  pass "inventory_log entry found (quantity_change: $LOG_CHANGE)"
else
  fail "No inventory_log entry found for order $ORDER_ID"
fi

# ── 9. Clean up test data ─────────────────────────────────────────────────────
echo ""
echo "7. Cleaning up test data..."
# Restore stock
curl -s -X PATCH "$SUPABASE_URL/rest/v1/ingredients?id=eq.$INGREDIENT_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"stock_quantity\": $STOCK_BEFORE}" > /dev/null

# Delete inventory_log entries for this order
curl -s -X DELETE "$SUPABASE_URL/rest/v1/inventory_log?order_id=eq.$ORDER_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Prefer: return=minimal" > /dev/null

# Delete order items then order
curl -s -X DELETE "$SUPABASE_URL/rest/v1/order_items?order_id=eq.$ORDER_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Prefer: return=minimal" > /dev/null

curl -s -X DELETE "$SUPABASE_URL/rest/v1/orders?id=eq.$ORDER_ID" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Prefer: return=minimal" > /dev/null

echo "  Cleaned up order $ORDER_ID and restored stock to $STOCK_BEFORE"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
