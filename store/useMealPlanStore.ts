import { create } from 'zustand';
import type { MealPlan, PlannedMeal, MealType } from '@/types';
import { executeQuery, executeRun, executeFirst } from '@/database/db';
import uuid from 'react-native-uuid';
const uuidv4 = () => uuid.v4() as string;
import { format, startOfWeek, addWeeks, subWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRecipesStore } from './useRecipesStore';
import { usePantryStore } from './usePantryStore';
import { useIngredientsStore } from './useIngredientsStore';
import { consumeIngredientsFIFO, scaleIngredients } from '@/services/shoppingListCalculator';

interface MealPlanState {
  currentWeekStart: string; // YYYY-MM-DD
  mealPlan: MealPlan | null;
  plannedMeals: PlannedMeal[];
  isLoading: boolean;
  error: string | null;
  loadWeek: (weekStart: string) => Promise<void>;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  goToCurrentWeek: () => void;
  addMeal: (meal: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMeal: (id: string, updates: Partial<PlannedMeal>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  markPrepared: (id: string) => Promise<void>;
  duplicateMeal: (id: string, newDate: string, newMealType: MealType) => Promise<string>;
  getMealsForDate: (date: string) => PlannedMeal[];
}

function getCurrentWeekStart(weekStartsOn: 0 | 1 = 1): string {
  const start = startOfWeek(new Date(), { weekStartsOn });
  return format(start, 'yyyy-MM-dd');
}

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentWeekStart: getCurrentWeekStart(1),
  mealPlan: null,
  plannedMeals: [],
  isLoading: false,
  error: null,

  loadWeek: async (weekStart) => {
    set({ isLoading: true, error: null, currentWeekStart: weekStart });
    try {
      // Buscar o crear plan para esta semana
      let plan = await executeFirst<Record<string, unknown>>(
        'SELECT * FROM meal_plans WHERE week_start = ?',
        [weekStart]
      );

      if (!plan) {
        const planId = uuidv4();
        const now = new Date().toISOString();
        await executeRun(
          'INSERT INTO meal_plans (id, week_start, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [planId, weekStart, now, now]
        );
        plan = { id: planId, week_start: weekStart, created_at: now, updated_at: now };
      }

      const mealPlan: MealPlan = {
        id: String(plan.id),
        weekStart: String(plan.week_start),
        notes: plan.notes ? String(plan.notes) : null,
        budget: plan.budget != null ? Number(plan.budget) : null,
        createdAt: String(plan.created_at),
        updatedAt: String(plan.updated_at),
      };

      const meals = await executeQuery<Record<string, unknown>>(
        'SELECT * FROM planned_meals WHERE meal_plan_id = ? ORDER BY date, meal_type',
        [mealPlan.id]
      );

      set({
        mealPlan,
        plannedMeals: meals.map(mapRowToPlannedMeal),
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  goToNextWeek: () => {
    const next = format(
      addWeeks(parseISO(get().currentWeekStart), 1),
      'yyyy-MM-dd'
    );
    get().loadWeek(next);
  },

  goToPrevWeek: () => {
    const prev = format(
      subWeeks(parseISO(get().currentWeekStart), 1),
      'yyyy-MM-dd'
    );
    get().loadWeek(prev);
  },

  goToCurrentWeek: () => {
    const current = getCurrentWeekStart(1);
    get().loadWeek(current);
  },

  addMeal: async (meal) => {
    const { mealPlan } = get();
    if (!mealPlan) throw new Error('No hay plan semanal activo');

    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO planned_meals (id, meal_plan_id, date, meal_type, custom_meal_type_name, recipe_id, custom_description, servings, is_prepared, has_leftovers, leftover_servings, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, mealPlan.id, meal.date, meal.mealType, meal.customMealTypeName ?? null,
        meal.recipeId ?? null, meal.customDescription ?? null, meal.servings,
        meal.isPrepared ? 1 : 0, meal.hasLeftovers ? 1 : 0,
        meal.leftoverServings ?? null, meal.notes ?? null, now, now,
      ]
    );

    set(state => ({
      plannedMeals: [...state.plannedMeals, {
        ...meal, id, createdAt: now, updatedAt: now,
      }],
    }));

    return id;
  },

  updateMeal: async (id, updates) => {
    const now = new Date().toISOString();
    await executeRun(
      `UPDATE planned_meals SET meal_type = COALESCE(?, meal_type), recipe_id = ?, custom_description = ?, servings = COALESCE(?, servings), is_prepared = COALESCE(?, is_prepared), has_leftovers = COALESCE(?, has_leftovers), leftover_servings = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        updates.mealType ?? null, updates.recipeId ?? null,
        updates.customDescription ?? null, updates.servings ?? null,
        updates.isPrepared !== undefined ? (updates.isPrepared ? 1 : 0) : null,
        updates.hasLeftovers !== undefined ? (updates.hasLeftovers ? 1 : 0) : null,
        updates.leftoverServings ?? null, updates.notes ?? null, now, id,
      ]
    );
    set(state => ({
      plannedMeals: state.plannedMeals.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: now } : m
      ),
    }));
  },

  deleteMeal: async (id) => {
    await executeRun('DELETE FROM planned_meals WHERE id = ?', [id]);
    set(state => ({
      plannedMeals: state.plannedMeals.filter(m => m.id !== id),
    }));
  },

  markPrepared: async (id) => {
    const meal = get().plannedMeals.find(m => m.id === id);
    if (!meal || meal.isPrepared) return;
    
    await get().updateMeal(id, { isPrepared: true });

    // Consumir ingredientes del almacén automáticamente
    if (meal.recipeId) {
      try {
        const recipe = useRecipesStore.getState().getById(meal.recipeId);
        if (recipe) {
          const scaled = scaleIngredients(recipe.ingredients, recipe.servings, meal.servings);
          const pantryItems = usePantryStore.getState().items;
          const conversions = useIngredientsStore.getState().conversions;
          const updatePantryQty = usePantryStore.getState().updateQuantity;

          for (const ing of scaled) {
            if (!ing.ingredientId || ing.optional) continue;
            const updates = consumeIngredientsFIFO(ing.ingredientId, ing.quantity, ing.unit, pantryItems, conversions);
            for (const up of updates) {
              await updatePantryQty(up.pantryItemId, up.newQuantity);
            }
          }
        }
      } catch (e) {
        console.error('Error al descontar ingredientes', e);
      }
    }
  },

  duplicateMeal: async (id, newDate, newMealType) => {
    const meal = get().plannedMeals.find(m => m.id === id);
    if (!meal) throw new Error('Comida no encontrada');
    return get().addMeal({ ...meal, date: newDate, mealType: newMealType, isPrepared: false });
  },

  getMealsForDate: (date) => get().plannedMeals.filter(m => m.date === date),
}));

function mapRowToPlannedMeal(row: Record<string, unknown>): PlannedMeal {
  return {
    id: String(row.id),
    mealPlanId: String(row.meal_plan_id),
    date: String(row.date),
    mealType: String(row.meal_type) as MealType,
    customMealTypeName: row.custom_meal_type_name ? String(row.custom_meal_type_name) : null,
    recipeId: row.recipe_id ? String(row.recipe_id) : null,
    customDescription: row.custom_description ? String(row.custom_description) : null,
    servings: Number(row.servings ?? 2),
    isPrepared: Boolean(Number(row.is_prepared ?? 0)),
    hasLeftovers: Boolean(Number(row.has_leftovers ?? 0)),
    leftoverServings: row.leftover_servings != null ? Number(row.leftover_servings) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}
