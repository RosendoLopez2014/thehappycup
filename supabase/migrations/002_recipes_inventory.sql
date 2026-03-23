-- ============================================================
-- Ingredients
-- ============================================================

CREATE TABLE ingredients (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  unit               text NOT NULL,
  cost_per_unit      decimal(10,2) NOT NULL DEFAULT 0,
  stock_quantity     decimal(10,2) NOT NULL DEFAULT 0,
  low_stock_threshold decimal(10,2) NOT NULL DEFAULT 0,
  supplier           text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Recipes
-- ============================================================

CREATE TABLE recipes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id   uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  item_option_id uuid REFERENCES item_options(id) ON DELETE CASCADE,
  size_variant   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recipes_has_parent CHECK (
    (menu_item_id IS NOT NULL AND item_option_id IS NULL) OR
    (menu_item_id IS NULL AND item_option_id IS NOT NULL)
  )
);

-- Unique: one recipe per (menu_item + size) or (item_option + size)
CREATE UNIQUE INDEX recipes_menu_item_size_uq
  ON recipes (menu_item_id, COALESCE(size_variant, ''))
  WHERE menu_item_id IS NOT NULL;

CREATE UNIQUE INDEX recipes_item_option_size_uq
  ON recipes (item_option_id, COALESCE(size_variant, ''))
  WHERE item_option_id IS NOT NULL;

-- ============================================================
-- Recipe Ingredients
-- ============================================================

CREATE TABLE recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id),
  quantity      decimal(10,3) NOT NULL DEFAULT 0,
  notes         text
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_recipes_menu_item ON recipes(menu_item_id);
CREATE INDEX idx_recipes_item_option ON recipes(item_option_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE ingredients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- No public access — service role bypasses RLS
-- (No public policies needed; admin routes use service role key)
