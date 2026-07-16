import type {
  RecipeWithIngredients,
  PantryItem,
  RecipeHistory,
  UserSettings,
  RecipeRecommendation,
  RecommendationGroup,
  IngredientConversion,
} from '@/types';
import { getAvailableQuantity } from './shoppingListCalculator';
import { RECIPE_HISTORY_PENALTY_DAYS, RECOMMENDATION_SCORES } from '@/constants';

interface RecommendationInput {
  recipes: RecipeWithIngredients[];
  pantryItems: PantryItem[];
  conversions: IngredientConversion[];
  recipeHistory: RecipeHistory[];
  settings: UserSettings;
  expiringItemIds: Set<string>; // ingredientIds próximos a caducar
  targetMealType?: string;
  maxPrepMinutes?: number;
}

/**
 * Motor de recomendaciones local determinista.
 * Puntúa cada receta y la asigna a un grupo.
 */
export function generateRecommendations(
  input: RecommendationInput
): Record<RecommendationGroup, RecipeRecommendation[]> {
  const {
    recipes,
    pantryItems,
    conversions,
    recipeHistory,
    settings,
    expiringItemIds,
    targetMealType,
    maxPrepMinutes,
  } = input;

  const userAllergies: string[] = JSON.parse(settings.allergies || '[]');
  const userIntolerances: string[] = JSON.parse(settings.intolerances || '[]');
  const excludedIds: string[] = JSON.parse(settings.excludedIngredients || '[]');
  const favoriteIds: string[] = JSON.parse(settings.favoriteIngredients || '[]');
  const maxTime = maxPrepMinutes ?? settings.maxCookTime ?? Infinity;

  // Recetas preparadas recientemente (en los últimos N días)
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - RECIPE_HISTORY_PENALTY_DAYS);
  const recentRecipeIds = new Set(
    recipeHistory
      .filter(h => new Date(h.preparedAt) > recentCutoff)
      .map(h => h.recipeId)
  );

  const scored: RecipeRecommendation[] = [];

  for (const recipe of recipes) {
    const allergens: string[] = JSON.parse(recipe.allergens || '[]');

    // Filtro duro: alergias e intolerancias
    const hasAllergen = allergens.some(a =>
      userAllergies.includes(a) || userIntolerances.includes(a)
    );
    if (hasAllergen) continue;

    // Filtro por tipo de comida
    if (targetMealType && recipe.mealType !== targetMealType) continue;

    // Verificar ingredientes excluidos
    const hasExcluded = recipe.ingredients.some(
      i => i.ingredientId && excludedIds.includes(i.ingredientId)
    );
    if (hasExcluded) continue;

    // Calcular disponibilidad
    let availableCount = 0;
    let missingCount = 0;
    let expiringCount = 0;

    for (const ing of recipe.ingredients) {
      if (ing.optional) continue;
      const avail = getAvailableQuantity(
        ing.ingredientId,
        ing.unit,
        pantryItems,
        conversions
      );
      if (avail >= ing.quantity) {
        availableCount++;
        if (ing.ingredientId && expiringItemIds.has(ing.ingredientId)) {
          expiringCount++;
        }
      } else if (avail > 0) {
        missingCount += 0.5; // parcialmente disponible cuenta como medio faltante
      } else {
        missingCount++;
      }
    }

    const totalRequired = recipe.ingredients.filter(i => !i.optional).length;
    const compatibilityPercent =
      totalRequired > 0 ? Math.round((availableCount / totalRequired) * 100) : 0;

    // Calcular puntuación
    let score = compatibilityPercent;
    score += expiringCount * RECOMMENDATION_SCORES.perExpiringIngredient;
    score += availableCount * RECOMMENDATION_SCORES.perIngredientAvailable;

    if (recipe.isFavorite) score += RECOMMENDATION_SCORES.perFavorite;
    if (recentRecipeIds.has(recipe.id)) score += RECOMMENDATION_SCORES.recentlyPreparedPenalty;

    // Penalización por tiempo excedido
    const totalTime = recipe.prepTime + recipe.cookTime;
    if (totalTime > maxTime) score -= 50;

    // Determinar grupo
    const group = determineGroup(
      compatibilityPercent,
      Math.ceil(missingCount),
      totalTime,
      expiringCount,
      recipe.isFavorite
    );

    scored.push({
      recipe,
      score,
      compatibilityPercent,
      missingCount: Math.ceil(missingCount),
      expiringCount,
      group,
    });
  }

  // Ordenar por puntuación descendente
  scored.sort((a, b) => b.score - a.score);

  // Agrupar
  const groups: Record<RecommendationGroup, RecipeRecommendation[]> = {
    puedes_ahora: [],
    falta_uno: [],
    aprovecha_caducidad: [],
    rapidas: [],
    favoritas: [],
    ideas_semana: [],
  };

  for (const rec of scored) {
    groups[rec.group].push(rec);
    // También incluir en ideas_semana todas las que tengan > 50% compatibilidad
    if (rec.group !== 'ideas_semana' && rec.compatibilityPercent >= 50) {
      groups.ideas_semana.push(rec);
    }
  }

  // Limitar cada grupo a máximo 10 recetas
  for (const key of Object.keys(groups) as RecommendationGroup[]) {
    groups[key] = groups[key].slice(0, 10);
  }

  return groups;
}

function determineGroup(
  compatibilityPercent: number,
  missingCount: number,
  totalTime: number,
  expiringCount: number,
  isFavorite: boolean
): RecommendationGroup {
  if (compatibilityPercent === 100) return 'puedes_ahora';
  if (missingCount === 1) return 'falta_uno';
  if (expiringCount > 0 && compatibilityPercent >= 70) return 'aprovecha_caducidad';
  if (totalTime <= 20) return 'rapidas';
  if (isFavorite) return 'favoritas';
  return 'ideas_semana';
}

// ─── Interfaz para futura API de IA ──────────────────────────
export interface AIRecipeSuggestionService {
  generateRecipes(prompt: string, context: {
    availableIngredients: string[];
    dietType: string;
    servings: number;
    maxTime?: number;
  }): Promise<{ name: string; description: string; ingredients: string[]; steps: string[] }[]>;
}

/**
 * Placeholder para el servicio de IA.
 * Implementar esta interfaz cuando se conecte a una API externa.
 */
export class LocalAIService implements AIRecipeSuggestionService {
  async generateRecipes(): Promise<never[]> {
    // Implementación futura: conectar a OpenAI, Gemini, etc.
    console.log('[AI] Servicio de IA no configurado. Usando recomendaciones locales.');
    return [];
  }
}
