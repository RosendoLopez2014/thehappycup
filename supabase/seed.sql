-- Store settings
INSERT INTO store_settings (key, value) VALUES
  ('store_hours', '{"monday":{"open":"07:00","close":"19:00"},"tuesday":{"open":"07:00","close":"19:00"},"wednesday":{"open":"07:00","close":"19:00"},"thursday":{"open":"07:00","close":"19:00"},"friday":{"open":"07:00","close":"20:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"08:00","close":"18:00"}}'),
  ('contact_info', '{"phone":"(555) 123-4567","email":"hello@thehappycup.com"}');

INSERT INTO menu_categories (name, display_order) VALUES
  ('Energy Drinks', 1), ('Matcha', 2), ('Coffee', 3), ('Treats', 4);

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

-- Energy drink options
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

-- Matcha & coffee options
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
