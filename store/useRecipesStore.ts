import { create } from 'zustand';
import type { Recipe, RecipeIngredient, RecipeStep, RecipeWithIngredients, RecipeCategory, MealType } from '@/types';
import { executeQuery, executeRun, executeFirst } from '@/database/db';
import uuid from 'react-native-uuid';
const uuidv4 = () => uuid.v4() as string;

interface RecipesState {
  recipes: RecipeWithIngredients[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  getById: (id: string) => RecipeWithIngredients | undefined;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipeId'>[], steps: Omit<RecipeStep, 'id' | 'recipeId'>[]) => Promise<string>;
  updateRecipe: (id: string, recipe: Partial<Recipe>, ingredients?: Omit<RecipeIngredient, 'id' | 'recipeId'>[], steps?: Omit<RecipeStep, 'id' | 'recipeId'>[]) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  duplicateRecipe: (id: string) => Promise<string>;
  filterByCategory: (category: RecipeCategory) => RecipeWithIngredients[];
  filterByMealType: (mealType: MealType) => RecipeWithIngredients[];
  searchByName: (query: string) => RecipeWithIngredients[];
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipeRows = await executeQuery<Record<string, unknown>>(
        'SELECT * FROM recipes ORDER BY name ASC'
      );
      const recipes: RecipeWithIngredients[] = [];

      for (const row of recipeRows) {
        const recipeId = String(row.id);
        const ingredients = await executeQuery<Record<string, unknown>>(
          'SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY rowid ASC',
          [recipeId]
        );
        const steps = await executeQuery<Record<string, unknown>>(
          'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC',
          [recipeId]
        );
        recipes.push({
          ...mapRowToRecipe(row),
          ingredients: ingredients.map(mapRowToIngredient),
          steps: steps.map(mapRowToStep),
        });
      }

      set({ recipes, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  getById: (id) => get().recipes.find(r => r.id === id),

  addRecipe: async (recipe, ingredients, steps) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO recipes (id, name, description, image_uri, category, meal_type, prep_time, cook_time, difficulty, servings, tags, nutrition_notes, notes, is_favorite, diet_tags, allergens, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, recipe.name, recipe.description ?? null, recipe.imageUri ?? null, recipe.category, recipe.mealType, recipe.prepTime, recipe.cookTime, recipe.difficulty, recipe.servings, recipe.tags, recipe.nutritionNotes ?? null, recipe.notes ?? null, recipe.isFavorite ? 1 : 0, recipe.dietTags, recipe.allergens, now, now]
    );

    for (const ing of ingredients) {
      await executeRun(
        'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, name, quantity, unit, optional, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), id, ing.ingredientId ?? null, ing.name, ing.quantity, ing.unit, ing.optional ? 1 : 0, ing.notes ?? null]
      );
    }

    for (let i = 0; i < steps.length; i++) {
      await executeRun(
        'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction, duration_minutes) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), id, i + 1, steps[i].instruction, steps[i].durationMinutes ?? null]
      );
    }

    await get().load();
    return id;
  },

  updateRecipe: async (id, recipe, ingredients, steps) => {
    const now = new Date().toISOString();
    const current = get().getById(id);
    if (!current) return;

    await executeRun(
      `UPDATE recipes SET name = ?, description = ?, image_uri = ?, category = ?, meal_type = ?, prep_time = ?, cook_time = ?, difficulty = ?, servings = ?, tags = ?, nutrition_notes = ?, notes = ?, is_favorite = ?, diet_tags = ?, allergens = ?, updated_at = ?
       WHERE id = ?`,
      [
        recipe.name ?? current.name, recipe.description ?? current.description ?? null,
        recipe.imageUri ?? current.imageUri ?? null, recipe.category ?? current.category,
        recipe.mealType ?? current.mealType, recipe.prepTime ?? current.prepTime,
        recipe.cookTime ?? current.cookTime, recipe.difficulty ?? current.difficulty,
        recipe.servings ?? current.servings, recipe.tags ?? current.tags,
        recipe.nutritionNotes ?? current.nutritionNotes ?? null, recipe.notes ?? current.notes ?? null,
        recipe.isFavorite !== undefined ? (recipe.isFavorite ? 1 : 0) : (current.isFavorite ? 1 : 0),
        recipe.dietTags ?? current.dietTags, recipe.allergens ?? current.allergens,
        now, id,
      ]
    );

    if (ingredients !== undefined) {
      await executeRun('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      for (const ing of ingredients) {
        await executeRun(
          'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, name, quantity, unit, optional, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, ing.ingredientId ?? null, ing.name, ing.quantity, ing.unit, ing.optional ? 1 : 0, ing.notes ?? null]
        );
      }
    }

    if (steps !== undefined) {
      await executeRun('DELETE FROM recipe_steps WHERE recipe_id = ?', [id]);
      for (let i = 0; i < steps.length; i++) {
        await executeRun(
          'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction, duration_minutes) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), id, i + 1, steps[i].instruction, steps[i].durationMinutes ?? null]
        );
      }
    }

    await get().load();
  },

  deleteRecipe: async (id) => {
    await executeRun('DELETE FROM recipes WHERE id = ?', [id]);
    set(state => ({ recipes: state.recipes.filter(r => r.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const recipe = get().getById(id);
    if (!recipe) return;
    const newVal = !recipe.isFavorite;
    await executeRun(
      'UPDATE recipes SET is_favorite = ?, updated_at = ? WHERE id = ?',
      [newVal ? 1 : 0, new Date().toISOString(), id]
    );
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? { ...r, isFavorite: newVal } : r),
    }));
  },

  duplicateRecipe: async (id) => {
    const recipe = get().getById(id);
    if (!recipe) throw new Error('Receta no encontrada');
    const newId = await get().addRecipe(
      { ...recipe, name: `${recipe.name} (copia)`, isFavorite: false },
      recipe.ingredients.map(i => ({ ...i, id: undefined as any })),
      recipe.steps.map(s => ({ ...s, id: undefined as any }))
    );
    return newId;
  },

  filterByCategory: (category) => get().recipes.filter(r => r.category === category),
  filterByMealType: (mealType) => get().recipes.filter(r => r.mealType === mealType),
  searchByName: (query) => {
    const q = query.toLowerCase().trim();
    return get().recipes.filter(r => r.name.toLowerCase().includes(q));
  },
}));

function mapRowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    imageUri: row.image_uri ? String(row.image_uri) : null,
    category: String(row.category) as Recipe['category'],
    mealType: String(row.meal_type) as Recipe['mealType'],
    prepTime: Number(row.prep_time ?? 0),
    cookTime: Number(row.cook_time ?? 0),
    difficulty: String(row.difficulty ?? 'facil') as Recipe['difficulty'],
    servings: Number(row.servings ?? 2),
    tags: String(row.tags ?? '[]'),
    nutritionNotes: row.nutrition_notes ? String(row.nutrition_notes) : null,
    notes: row.notes ? String(row.notes) : null,
    isFavorite: Boolean(Number(row.is_favorite ?? 0)),
    dietTags: String(row.diet_tags ?? '[]'),
    allergens: String(row.allergens ?? '[]'),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapRowToIngredient(row: Record<string, unknown>): RecipeIngredient {
  return {
    id: String(row.id),
    recipeId: String(row.recipe_id),
    ingredientId: row.ingredient_id ? String(row.ingredient_id) : null,
    name: String(row.name),
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit ?? 'g') as RecipeIngredient['unit'],
    optional: Boolean(Number(row.optional ?? 0)),
    notes: row.notes ? String(row.notes) : null,
  };
}

function mapRowToStep(row: Record<string, unknown>): RecipeStep {
  return {
    id: String(row.id),
    recipeId: String(row.recipe_id),
    stepNumber: Number(row.step_number),
    instruction: String(row.instruction),
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
  };
}
