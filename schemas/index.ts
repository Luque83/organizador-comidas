import { z } from 'zod';

// ─── Schemas de validación con Zod ────────────────────────────

export const UnitSchema = z.enum([
  'g', 'kg', 'ml', 'l', 'unidad', 'paquete', 'lata', 'bote',
  'cucharada', 'cucharadita', 'taza', 'pizca'
]);

export const IngredientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  category: z.enum([
    'frutas', 'verduras', 'carne', 'pescado', 'lacteos', 'huevos',
    'cereales', 'pasta_arroz', 'legumbres', 'conservas', 'congelados',
    'panaderia', 'especias', 'salsas', 'bebidas', 'limpieza', 'higiene', 'otros'
  ]),
  defaultUnit: UnitSchema,
  isBasic: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  calories: z.number().min(0).max(9999).optional().nullable(),
  protein: z.number().min(0).max(999).optional().nullable(),
  carbs: z.number().min(0).max(999).optional().nullable(),
  fat: z.number().min(0).max(999).optional().nullable(),
});

export const RecipeIngredientSchema = z.object({
  ingredientId: z.string().optional().nullable(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  quantity: z.number().min(0.001, 'La cantidad debe ser positiva'),
  unit: UnitSchema,
  optional: z.boolean().default(false),
  notes: z.string().max(200).optional(),
});

export const RecipeStepSchema = z.object({
  instruction: z.string().min(1, 'La instrucción es obligatoria').max(1000),
  durationMinutes: z.number().min(1).max(480).optional().nullable(),
});

export const RecipeSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(150),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum([
    'desayunos', 'entrantes', 'ensaladas', 'pasta', 'arroz', 'legumbres',
    'carne', 'pescado', 'verduras', 'sopas', 'bocadillos', 'postres',
    'bebidas', 'rapidas', 'sobras'
  ]),
  mealType: z.enum(['desayuno', 'almuerzo', 'merienda', 'cena', 'otro']),
  prepTime: z.number().min(0).max(480, 'Máximo 8 horas'),
  cookTime: z.number().min(0).max(720, 'Máximo 12 horas'),
  difficulty: z.enum(['facil', 'media', 'dificil']),
  servings: z.number().min(1, 'Mínimo 1 ración').max(50),
  notes: z.string().max(1000).optional().nullable(),
  ingredients: z.array(RecipeIngredientSchema).min(1, 'Añade al menos un ingrediente'),
  steps: z.array(RecipeStepSchema).min(1, 'Añade al menos un paso'),
});

export const PantryItemSchema = z.object({
  ingredientId: z.string().optional().nullable(),
  customName: z.string().max(150).optional().nullable(),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  unit: UnitSchema,
  minQuantity: z.number().min(0).optional().nullable(),
  location: z.enum(['despensa', 'frigorifico', 'congelador', 'otro']),
  purchaseDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  isOpen: z.boolean().default(false),
});

export const ShoppingItemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(150),
  neededQuantity: z.number().min(0.001, 'La cantidad debe ser positiva'),
  unit: UnitSchema,
  notes: z.string().max(300).optional().nullable(),
  store: z.string().max(100).optional().nullable(),
});

export const PlannedMealSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  mealType: z.enum(['desayuno', 'almuerzo', 'merienda', 'cena', 'otro']),
  customMealTypeName: z.string().max(50).optional().nullable(),
  recipeId: z.string().optional().nullable(),
  customDescription: z.string().max(200).optional().nullable(),
  servings: z.number().min(1).max(50),
  notes: z.string().max(300).optional().nullable(),
});

export const UserSettingsSchema = z.object({
  defaultServings: z.number().min(1).max(20),
  mealsPerDay: z.number().min(1).max(8),
  dietType: z.enum([
    'sin_restricciones', 'vegetariana', 'vegana', 'sin_gluten',
    'sin_lactosa', 'baja_carbohidratos', 'mediterranea', 'personalizada'
  ]),
  maxCookTime: z.number().min(5).max(480).optional().nullable(),
  weeklyBudget: z.number().min(0).max(99999).optional().nullable(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  expiryAlertDays: z.number().min(1).max(30),
  notificationsEnabled: z.boolean(),
  notifyExpiry: z.boolean(),
  notifyLowStock: z.boolean(),
  notifyWeeklyPlanning: z.boolean(),
  notifyShoppingReminder: z.boolean(),
  notifyTomorrowMeals: z.boolean(),
  darkMode: z.enum(['system', 'light', 'dark']),
});

// Tipos inferidos
export type IngredientFormData = z.infer<typeof IngredientSchema>;
export type RecipeFormData = z.infer<typeof RecipeSchema>;
export type PantryItemFormData = z.infer<typeof PantryItemSchema>;
export type ShoppingItemFormData = z.infer<typeof ShoppingItemSchema>;
export type PlannedMealFormData = z.infer<typeof PlannedMealSchema>;
export type UserSettingsFormData = z.infer<typeof UserSettingsSchema>;
