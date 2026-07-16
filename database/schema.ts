// ============================================================
// ESQUEMA SQLITE — Mi Menú Semanal
// ============================================================

export const CREATE_TABLES_SQL = `
-- Tabla de configuración del usuario
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_servings INTEGER NOT NULL DEFAULT 2,
  meals_per_day INTEGER NOT NULL DEFAULT 3,
  diet_type TEXT NOT NULL DEFAULT 'sin_restricciones',
  allergies TEXT NOT NULL DEFAULT '[]',
  intolerances TEXT NOT NULL DEFAULT '[]',
  excluded_ingredients TEXT NOT NULL DEFAULT '[]',
  favorite_ingredients TEXT NOT NULL DEFAULT '[]',
  max_cook_time INTEGER,
  weekly_budget REAL,
  preferred_unit TEXT NOT NULL DEFAULT 'metric',
  week_starts_on INTEGER NOT NULL DEFAULT 1,
  expiry_alert_days INTEGER NOT NULL DEFAULT 3,
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  notify_expiry INTEGER NOT NULL DEFAULT 1,
  notify_low_stock INTEGER NOT NULL DEFAULT 1,
  notify_weekly_planning INTEGER NOT NULL DEFAULT 1,
  notify_shopping_reminder INTEGER NOT NULL DEFAULT 1,
  notify_tomorrow_meals INTEGER NOT NULL DEFAULT 0,
  dark_mode TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo de ingredientes
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_unit TEXT NOT NULL DEFAULT 'g',
  image_uri TEXT,
  calories REAL,
  protein REAL,
  carbs REAL,
  fat REAL,
  is_basic INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ingredients_normalized ON ingredients(normalized_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Sinónimos de ingredientes
CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_aliases_normalized ON ingredient_aliases(normalized_alias);

-- Conversiones personalizadas de unidades
CREATE TABLE IF NOT EXISTS ingredient_conversions (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  factor REAL NOT NULL,
  description TEXT,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Recetas
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_uri TEXT,
  category TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'almuerzo',
  prep_time INTEGER NOT NULL DEFAULT 15,
  cook_time INTEGER NOT NULL DEFAULT 30,
  difficulty TEXT NOT NULL DEFAULT 'facil',
  servings INTEGER NOT NULL DEFAULT 2,
  tags TEXT NOT NULL DEFAULT '[]',
  nutrition_notes TEXT,
  notes TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  diet_tags TEXT NOT NULL DEFAULT '[]',
  allergens TEXT NOT NULL DEFAULT '[]',
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_favorite ON recipes(is_favorite);

-- Ingredientes de recetas
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  ingredient_id TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  optional INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- Pasos de recetas
CREATE TABLE IF NOT EXISTS recipe_steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  duration_minutes INTEGER,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- Planes de menú semanal
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  week_start TEXT NOT NULL UNIQUE,
  notes TEXT,
  budget REAL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(week_start);

-- Comidas planificadas
CREATE TABLE IF NOT EXISTS planned_meals (
  id TEXT PRIMARY KEY,
  meal_plan_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  custom_meal_type_name TEXT,
  recipe_id TEXT,
  custom_description TEXT,
  servings INTEGER NOT NULL DEFAULT 2,
  is_prepared INTEGER NOT NULL DEFAULT 0,
  has_leftovers INTEGER NOT NULL DEFAULT 0,
  leftover_servings REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_planned_meals_plan ON planned_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);

-- Almacén (productos en casa)
CREATE TABLE IF NOT EXISTS pantry_items (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  ingredient_id TEXT,
  custom_name TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_quantity REAL,
  location TEXT NOT NULL DEFAULT 'despensa',
  purchase_date TEXT,
  expiry_date TEXT,
  brand TEXT,
  price REAL,
  notes TEXT,
  is_open INTEGER NOT NULL DEFAULT 0,
  opened_date TEXT,
  batch_id TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_pantry_ingredient ON pantry_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_pantry_location ON pantry_items(location);
CREATE INDEX IF NOT EXISTS idx_pantry_expiry ON pantry_items(expiry_date);

-- Cola de sincronización Offline-First
CREATE TABLE IF NOT EXISTS pending_sync_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data TEXT, -- JSON con los datos de la fila
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

-- Listas de la compra
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  name TEXT NOT NULL,
  week_start TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  total_estimated REAL,
  total_actual REAL,
  completed_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ítems de la lista de la compra
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  shopping_list_id TEXT NOT NULL,
  ingredient_id TEXT,
  name TEXT NOT NULL,
  needed_quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'otros',
  source_recipes TEXT NOT NULL DEFAULT '[]',
  is_auto_generated INTEGER NOT NULL DEFAULT 0,
  is_bought INTEGER NOT NULL DEFAULT 0,
  bought_quantity REAL,
  price REAL,
  store TEXT,
  notes TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(shopping_list_id);

-- Historial de compras
CREATE TABLE IF NOT EXISTS purchase_history (
  id TEXT PRIMARY KEY,
  shopping_list_id TEXT,
  purchase_date TEXT NOT NULL,
  total_amount REAL,
  store TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE SET NULL
);

-- Productos de cada compra
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_history_id TEXT NOT NULL,
  ingredient_id TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  price REAL,
  expiry_date TEXT,
  location TEXT NOT NULL DEFAULT 'despensa',
  brand TEXT,
  added_to_pantry INTEGER NOT NULL DEFAULT 0,
  pantry_item_id TEXT,
  FOREIGN KEY (purchase_history_id) REFERENCES purchase_history(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
);

-- Sobras
CREATE TABLE IF NOT EXISTS leftovers (
  id TEXT PRIMARY KEY,
  planned_meal_id TEXT NOT NULL,
  recipe_id TEXT,
  description TEXT NOT NULL,
  servings REAL NOT NULL,
  date TEXT NOT NULL,
  is_consumed INTEGER NOT NULL DEFAULT 0,
  consumed_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (planned_meal_id) REFERENCES planned_meals(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);

-- Historial de recetas preparadas
CREATE TABLE IF NOT EXISTS recipe_history (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  planned_meal_id TEXT,
  prepared_at TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 2,
  rating INTEGER,
  notes TEXT,
  ingredients_consumed INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (planned_meal_id) REFERENCES planned_meals(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_recipe_history_recipe ON recipe_history(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_history_date ON recipe_history(prepared_at);
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS recipe_history;
  DROP TABLE IF EXISTS leftovers;
  DROP TABLE IF EXISTS purchase_items;
  DROP TABLE IF EXISTS purchase_history;
  DROP TABLE IF EXISTS shopping_items;
  DROP TABLE IF EXISTS shopping_lists;
  DROP TABLE IF EXISTS pantry_items;
  DROP TABLE IF EXISTS planned_meals;
  DROP TABLE IF EXISTS meal_plans;
  DROP TABLE IF EXISTS recipe_steps;
  DROP TABLE IF EXISTS recipe_ingredients;
  DROP TABLE IF EXISTS recipes;
  DROP TABLE IF EXISTS ingredient_conversions;
  DROP TABLE IF EXISTS ingredient_aliases;
  DROP TABLE IF EXISTS ingredients;
  DROP TABLE IF EXISTS user_settings;
`;
