import { create } from 'zustand';
import type { Ingredient, IngredientAlias, IngredientConversion, IngredientCategory, Unit } from '@/types';
import { executeQuery, executeRun } from '@/database/db';
import { normalizeName, findPossibleDuplicates } from '@/services/ingredientMatcher';
import uuid from 'react-native-uuid';
const uuidv4 = () => uuid.v4() as string;

interface IngredientsState {
  ingredients: Ingredient[];
  aliases: IngredientAlias[];
  conversions: IngredientConversion[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  addConversion: (conv: Omit<IngredientConversion, 'id'>) => Promise<void>;
  deleteConversion: (id: string) => Promise<void>;
  searchByName: (query: string) => Ingredient[];
  filterByCategory: (category: IngredientCategory) => Ingredient[];
  checkDuplicates: (name: string) => Ingredient[];
  getConversionsForIngredient: (ingredientId: string) => IngredientConversion[];
}

export const useIngredientsStore = create<IngredientsState>((set, get) => ({
  ingredients: [],
  aliases: [],
  conversions: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [ingRows, aliasRows, convRows] = await Promise.all([
        executeQuery<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY name ASC'),
        executeQuery<Record<string, unknown>>('SELECT * FROM ingredient_aliases'),
        executeQuery<Record<string, unknown>>('SELECT * FROM ingredient_conversions'),
      ]);
      set({
        ingredients: ingRows.map(mapRowToIngredient),
        aliases: aliasRows.map(mapRowToAlias),
        conversions: convRows.map(mapRowToConversion),
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addIngredient: async (ingredient) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const normalized = normalizeName(ingredient.name);
    await executeRun(
      `INSERT INTO ingredients (id, name, normalized_name, category, default_unit, image_uri, calories, protein, carbs, fat, is_basic, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, ingredient.name, normalized, ingredient.category, ingredient.defaultUnit,
        ingredient.imageUri ?? null, ingredient.calories ?? null, ingredient.protein ?? null,
        ingredient.carbs ?? null, ingredient.fat ?? null, ingredient.isBasic ? 1 : 0,
        ingredient.notes ?? null, now, now,
      ]
    );
    await get().load();
    return id;
  },

  updateIngredient: async (id, updates) => {
    const now = new Date().toISOString();
    const current = get().ingredients.find(i => i.id === id);
    if (!current) return;
    const name = updates.name ?? current.name;
    await executeRun(
      `UPDATE ingredients SET name = ?, normalized_name = ?, category = ?, default_unit = ?, image_uri = ?, calories = ?, protein = ?, carbs = ?, fat = ?, is_basic = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        name, normalizeName(name), updates.category ?? current.category,
        updates.defaultUnit ?? current.defaultUnit, updates.imageUri ?? current.imageUri ?? null,
        updates.calories ?? current.calories ?? null, updates.protein ?? current.protein ?? null,
        updates.carbs ?? current.carbs ?? null, updates.fat ?? current.fat ?? null,
        (updates.isBasic ?? current.isBasic) ? 1 : 0, updates.notes ?? current.notes ?? null,
        now, id,
      ]
    );
    set(state => ({
      ingredients: state.ingredients.map(i =>
        i.id === id ? { ...i, ...updates, normalizedName: normalizeName(name), updatedAt: now } : i
      ),
    }));
  },

  deleteIngredient: async (id) => {
    await executeRun('DELETE FROM ingredients WHERE id = ?', [id]);
    set(state => ({ ingredients: state.ingredients.filter(i => i.id !== id) }));
  },

  addConversion: async (conv) => {
    const id = uuidv4();
    await executeRun(
      'INSERT INTO ingredient_conversions (id, ingredient_id, from_unit, to_unit, factor, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, conv.ingredientId, conv.fromUnit, conv.toUnit, conv.factor, conv.description ?? null]
    );
    set(state => ({ conversions: [...state.conversions, { ...conv, id }] }));
  },

  deleteConversion: async (id) => {
    await executeRun('DELETE FROM ingredient_conversions WHERE id = ?', [id]);
    set(state => ({ conversions: state.conversions.filter(c => c.id !== id) }));
  },

  searchByName: (query) => {
    const q = normalizeName(query);
    if (!q) return get().ingredients;
    const direct = get().ingredients.filter(i => i.normalizedName.includes(q));
    const aliasMatches = get().aliases
      .filter(a => a.normalizedAlias.includes(q))
      .map(a => get().ingredients.find(i => i.id === a.ingredientId))
      .filter(Boolean) as Ingredient[];
    const combined = [...direct, ...aliasMatches.filter(ai => !direct.some(d => d.id === ai.id))];
    return combined;
  },

  filterByCategory: (category) =>
    get().ingredients.filter(i => i.category === category),

  checkDuplicates: (name) => {
    const normalized = normalizeName(name);
    return get().ingredients.filter(i =>
      i.normalizedName === normalized ||
      get().aliases.some(a => a.ingredientId === i.id && a.normalizedAlias === normalized)
    );
  },

  getConversionsForIngredient: (ingredientId) =>
    get().conversions.filter(c => c.ingredientId === ingredientId),
}));

function mapRowToIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: String(row.id),
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    category: String(row.category) as IngredientCategory,
    defaultUnit: String(row.default_unit ?? 'g') as Unit,
    imageUri: row.image_uri ? String(row.image_uri) : null,
    calories: row.calories != null ? Number(row.calories) : null,
    protein: row.protein != null ? Number(row.protein) : null,
    carbs: row.carbs != null ? Number(row.carbs) : null,
    fat: row.fat != null ? Number(row.fat) : null,
    isBasic: Boolean(Number(row.is_basic ?? 0)),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapRowToAlias(row: Record<string, unknown>): IngredientAlias {
  return {
    id: String(row.id),
    ingredientId: String(row.ingredient_id),
    alias: String(row.alias),
    normalizedAlias: String(row.normalized_alias),
  };
}

function mapRowToConversion(row: Record<string, unknown>): IngredientConversion {
  return {
    id: String(row.id),
    ingredientId: String(row.ingredient_id),
    fromUnit: String(row.from_unit) as Unit,
    toUnit: String(row.to_unit) as Unit,
    factor: Number(row.factor),
    description: row.description ? String(row.description) : null,
  };
}
