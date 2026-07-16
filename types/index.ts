// ============================================================
// TIPOS CENTRALES — Mi Menú Semanal
// ============================================================

// ─── Unidades ───────────────────────────────────────────────
export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'unidad'
  | 'paquete'
  | 'lata'
  | 'bote'
  | 'cucharada'
  | 'cucharadita'
  | 'taza'
  | 'pizca';

export const UNITS: { value: Unit; label: string; family: string }[] = [
  { value: 'g', label: 'Gramos (g)', family: 'weight' },
  { value: 'kg', label: 'Kilogramos (kg)', family: 'weight' },
  { value: 'ml', label: 'Mililitros (ml)', family: 'volume' },
  { value: 'l', label: 'Litros (l)', family: 'volume' },
  { value: 'unidad', label: 'Unidades', family: 'count' },
  { value: 'paquete', label: 'Paquetes', family: 'count' },
  { value: 'lata', label: 'Latas', family: 'count' },
  { value: 'bote', label: 'Botes', family: 'count' },
  { value: 'cucharada', label: 'Cucharadas', family: 'count' },
  { value: 'cucharadita', label: 'Cucharaditas', family: 'count' },
  { value: 'taza', label: 'Tazas', family: 'count' },
  { value: 'pizca', label: 'Pizcas', family: 'count' },
];

// ─── Categorías de ingredientes ─────────────────────────────
export type IngredientCategory =
  | 'frutas'
  | 'verduras'
  | 'carne'
  | 'pescado'
  | 'lacteos'
  | 'huevos'
  | 'cereales'
  | 'pasta_arroz'
  | 'legumbres'
  | 'conservas'
  | 'congelados'
  | 'panaderia'
  | 'especias'
  | 'salsas'
  | 'bebidas'
  | 'limpieza'
  | 'higiene'
  | 'otros';

export const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: 'frutas', label: 'Frutas', emoji: '🍎' },
  { value: 'verduras', label: 'Verduras', emoji: '🥦' },
  { value: 'carne', label: 'Carne', emoji: '🥩' },
  { value: 'pescado', label: 'Pescado', emoji: '🐟' },
  { value: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { value: 'huevos', label: 'Huevos', emoji: '🥚' },
  { value: 'cereales', label: 'Cereales', emoji: '🌾' },
  { value: 'pasta_arroz', label: 'Pasta y Arroz', emoji: '🍝' },
  { value: 'legumbres', label: 'Legumbres', emoji: '🫘' },
  { value: 'conservas', label: 'Conservas', emoji: '🥫' },
  { value: 'congelados', label: 'Congelados', emoji: '🧊' },
  { value: 'panaderia', label: 'Panadería', emoji: '🍞' },
  { value: 'especias', label: 'Especias', emoji: '🧂' },
  { value: 'salsas', label: 'Salsas', emoji: '🫙' },
  { value: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { value: 'limpieza', label: 'Limpieza', emoji: '🧹' },
  { value: 'higiene', label: 'Higiene', emoji: '🧴' },
  { value: 'otros', label: 'Otros', emoji: '📦' },
];

// ─── Categorías de recetas ───────────────────────────────────
export type RecipeCategory =
  | 'desayunos'
  | 'entrantes'
  | 'ensaladas'
  | 'pasta'
  | 'arroz'
  | 'legumbres'
  | 'carne'
  | 'pescado'
  | 'verduras'
  | 'sopas'
  | 'bocadillos'
  | 'postres'
  | 'bebidas'
  | 'rapidas'
  | 'sobras';

export const RECIPE_CATEGORIES: { value: RecipeCategory; label: string; emoji: string }[] = [
  { value: 'desayunos', label: 'Desayunos', emoji: '🌅' },
  { value: 'entrantes', label: 'Entrantes', emoji: '🥗' },
  { value: 'ensaladas', label: 'Ensaladas', emoji: '🥬' },
  { value: 'pasta', label: 'Pasta', emoji: '🍝' },
  { value: 'arroz', label: 'Arroz', emoji: '🍚' },
  { value: 'legumbres', label: 'Legumbres', emoji: '🫘' },
  { value: 'carne', label: 'Carne', emoji: '🥩' },
  { value: 'pescado', label: 'Pescado', emoji: '🐟' },
  { value: 'verduras', label: 'Verduras', emoji: '🥦' },
  { value: 'sopas', label: 'Sopas y Cremas', emoji: '🍲' },
  { value: 'bocadillos', label: 'Bocadillos', emoji: '🥪' },
  { value: 'postres', label: 'Postres', emoji: '🍮' },
  { value: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { value: 'rapidas', label: 'Recetas Rápidas', emoji: '⚡' },
  { value: 'sobras', label: 'Aprovechamiento de Sobras', emoji: '♻️' },
];

// ─── Tipos de comida ─────────────────────────────────────────
export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'otro';

export const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'desayuno', label: 'Desayuno', emoji: '☀️' },
  { value: 'almuerzo', label: 'Almuerzo', emoji: '🍽️' },
  { value: 'merienda', label: 'Merienda', emoji: '🫖' },
  { value: 'cena', label: 'Cena', emoji: '🌙' },
  { value: 'otro', label: 'Otro', emoji: '🍴' },
];

// ─── Dificultad ──────────────────────────────────────────────
export type Difficulty = 'facil' | 'media' | 'dificil';

// ─── Ubicación en almacén ────────────────────────────────────
export type StorageLocation = 'despensa' | 'frigorifico' | 'congelador' | 'otro';

export const STORAGE_LOCATIONS: { value: StorageLocation; label: string; emoji: string }[] = [
  { value: 'despensa', label: 'Despensa', emoji: '🗄️' },
  { value: 'frigorifico', label: 'Frigorífico', emoji: '❄️' },
  { value: 'congelador', label: 'Congelador', emoji: '🧊' },
  { value: 'otro', label: 'Otro', emoji: '📦' },
];

// ─── Tipo de alimentación ────────────────────────────────────
export type DietType =
  | 'sin_restricciones'
  | 'vegetariana'
  | 'vegana'
  | 'sin_gluten'
  | 'sin_lactosa'
  | 'baja_carbohidratos'
  | 'mediterranea'
  | 'personalizada';

// ─── Entidades del modelo de datos ──────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: IngredientCategory;
  defaultUnit: Unit;
  imageUri?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  isBasic: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientAlias {
  id: string;
  ingredientId: string;
  alias: string;
  normalizedAlias: string;
}

export interface IngredientConversion {
  id: string;
  ingredientId: string;
  fromUnit: Unit;
  toUnit: Unit;
  factor: number; // fromUnit * factor = toUnit
  description?: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string | null;
  imageUri?: string | null;
  category: RecipeCategory;
  mealType: MealType;
  prepTime: number; // minutos
  cookTime: number; // minutos
  difficulty: Difficulty;
  servings: number;
  tags: string; // JSON array string
  nutritionNotes?: string | null;
  notes?: string | null;
  isFavorite: boolean;
  dietTags: string; // JSON array: ['vegetariana', 'sin_gluten', ...]
  allergens: string; // JSON array: ['gluten', 'lactosa', ...]
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId?: string | null;
  name: string; // nombre mostrado
  quantity: number;
  unit: Unit;
  optional: boolean;
  notes?: string | null;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
  durationMinutes?: number | null;
}

export interface MealPlan {
  id: string;
  weekStart: string; // ISO date YYYY-MM-DD (lunes)
  notes?: string | null;
  budget?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedMeal {
  id: string;
  mealPlanId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  customMealTypeName?: string | null;
  recipeId?: string | null;
  customDescription?: string | null;
  servings: number;
  isPrepared: boolean;
  hasLeftovers: boolean;
  leftoverServings?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItem {
  id: string;
  ingredientId?: string | null;
  customName?: string | null;
  quantity: number;
  unit: Unit;
  minQuantity?: number | null;
  location: StorageLocation;
  purchaseDate?: string | null;
  expiryDate?: string | null;
  brand?: string | null;
  price?: number | null;
  notes?: string | null;
  isOpen: boolean;
  openedDate?: string | null;
  batchId?: string | null; // para agrupar lotes del mismo producto
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  weekStart?: string | null;
  isActive: boolean;
  totalEstimated?: number | null;
  totalActual?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  shoppingListId: string;
  ingredientId?: string | null;
  name: string;
  neededQuantity: number;
  unit: Unit;
  category: IngredientCategory;
  sourceRecipes: string; // JSON array of recipe names
  isAutoGenerated: boolean;
  isBought: boolean;
  boughtQuantity?: number | null;
  price?: number | null;
  store?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PurchaseHistory {
  id: string;
  shoppingListId?: string | null;
  purchaseDate: string;
  totalAmount?: number | null;
  store?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseHistoryId: string;
  ingredientId?: string | null;
  name: string;
  quantity: number;
  unit: Unit;
  price?: number | null;
  expiryDate?: string | null;
  location: StorageLocation;
  brand?: string | null;
  addedToPantry: boolean;
  pantryItemId?: string | null;
}

export interface Leftover {
  id: string;
  plannedMealId: string;
  recipeId?: string | null;
  description: string;
  servings: number;
  date: string;
  isConsumed: boolean;
  consumedDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface RecipeHistory {
  id: string;
  recipeId: string;
  plannedMealId?: string | null;
  preparedAt: string;
  servings: number;
  rating?: number | null;
  notes?: string | null;
  ingredientsConsumed: boolean;
}

export interface UserSettings {
  id: string;
  defaultServings: number;
  mealsPerDay: number;
  dietType: DietType;
  allergies: string; // JSON array
  intolerances: string; // JSON array
  excludedIngredients: string; // JSON array de ingredientId
  favoriteIngredients: string; // JSON array de ingredientId
  maxCookTime?: number | null; // minutos
  weeklyBudget?: number | null;
  preferredUnit: 'metric' | 'custom';
  weekStartsOn: 0 | 1; // 0=domingo, 1=lunes
  expiryAlertDays: number; // días antes para alertar caducidad
  notificationsEnabled: boolean;
  notifyExpiry: boolean;
  notifyLowStock: boolean;
  notifyWeeklyPlanning: boolean;
  notifyShoppingReminder: boolean;
  notifyTomorrowMeals: boolean;
  darkMode: 'system' | 'light' | 'dark';
  updatedAt: string;
}

// ─── Tipos derivados / UI ────────────────────────────────────

export interface IngredientWithStock extends Ingredient {
  totalQuantity: number;
  unit: Unit;
  pantryItems: PantryItem[];
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeAvailability {
  recipeId: string;
  available: RecipeIngredientStatus[];
  partial: RecipeIngredientStatus[];
  missing: RecipeIngredientStatus[];
  compatibilityPercent: number;
  missingCount: number;
}

export interface RecipeIngredientStatus {
  ingredient: RecipeIngredient;
  needed: number;
  available: number;
  unit: Unit;
  status: 'available' | 'partial' | 'missing';
}

export interface WeekDay {
  date: string; // YYYY-MM-DD
  dayName: string;
  isToday: boolean;
  meals: PlannedMeal[];
}

export interface ShoppingCalculationResult {
  items: ShoppingItemCalculated[];
  totalIngredients: number;
  coveredIngredients: number;
  missingIngredients: number;
}

export interface ShoppingItemCalculated {
  ingredientId?: string;
  name: string;
  needed: number;
  available: number;
  missing: number;
  unit: Unit;
  category: IngredientCategory;
  sourceRecipes: string[];
}

export interface RecipeRecommendation {
  recipe: RecipeWithIngredients;
  score: number;
  compatibilityPercent: number;
  missingCount: number;
  expiringCount: number;
  group: RecommendationGroup;
}

export type RecommendationGroup =
  | 'puedes_ahora'
  | 'falta_uno'
  | 'aprovecha_caducidad'
  | 'rapidas'
  | 'favoritas'
  | 'ideas_semana';
