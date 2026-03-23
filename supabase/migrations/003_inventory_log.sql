-- ============================================================
-- Inventory Log
-- ============================================================

CREATE TABLE inventory_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   uuid NOT NULL REFERENCES ingredients(id),
  order_id        uuid REFERENCES orders(id),
  quantity_change decimal(10,3) NOT NULL,
  reason          text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_log_ingredient ON inventory_log(ingredient_id);
CREATE INDEX idx_inventory_log_order      ON inventory_log(order_id);
CREATE INDEX idx_inventory_log_created_at ON inventory_log(created_at DESC);

ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;

-- No public access — service role bypasses RLS
