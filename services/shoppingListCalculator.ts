import type {
  RecipeIngredient,
  PantryItem,
  IngredientConversion,
  ShoppingCalculationResult,
  ShoppingItemCalculated,
  IngredientCategory,
  Unit,
} from '@/types';
import { convertWithCustom, toBaseUnit, roundForShopping } from './unitConversion';

interface RecipeRequirement {
  ingredientId?: string | null;
  name: string;
  totalQuantity: number;
  unit: Unit;
  category: IngredientCategory;
  sourceRecipes: string[];
}

/**
 * Suma todos los ingredientes requeridos por un conjunto de recetas,
 * escalado según las raciones indicadas.
 */
export function aggregateIngredients(
  recipeIngredients: { recipeName: string; servings: number; scaleFactor: number; ingredients: RecipeIngredient[] }[],
): RecipeRequirement[] {
  const map = new Map<string, RecipeRequirement>();

  for (const recipe of recipeIngredients) {
    for (const ing of recipe.ingredients) {
      if (ing.optional) continue;

      const scaledQty = ing.quantity * recipe.scaleFactor;
      const key = ing.ingredientId ?? `name:${ing.name.toLowerCase()}`;

      const existing = map.get(key);
      if (existing && existing.unit === ing.unit) {
        existing.totalQuantity += scaledQty;
        if (!existing.sourceRecipes.includes(recipe.recipeName)) {
          existing.sourceRecipes.push(recipe.recipeName);
        }
      } else if (existing) {
        // Diferente unidad — guardamos como entrada separada por ahora
        map.set(`${key}_${ing.unit}`, {
          ingredientId: ing.ingredientId,
          name: ing.name,
          totalQuantity: scaledQty,
          unit: ing.unit,
          category: 'otros',
          sourceRecipes: [recipe.recipeName],
        });
      } else {
        map.set(key, {
          ingredientId: ing.ingredientId ?? undefined,
          name: ing.name,
          totalQuantity: scaledQty,
          unit: ing.unit,
          category: 'otros',
          sourceRecipes: [recipe.recipeName],
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Calcula la cantidad disponible de un ingrediente en el almacén,
 * usando FIFO (primero lo que caduca antes) y convirtiendo unidades.
 */
export function getAvailableQuantity(
  ingredientId: string | null | undefined,
  requiredUnit: Unit,
  pantryItems: PantryItem[],
  conversions: IngredientConversion[],
): number {
  if (!ingredientId) return 0;

  const items = pantryItems
    .filter(p => p.ingredientId === ingredientId && p.quantity > 0)
    .sort((a, b) => {
      // FIFO: primero los que caducan antes
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });

  let totalInRequiredUnit = 0;

  for (const item of items) {
    if (item.unit === requiredUnit) {
      totalInRequiredUnit += item.quantity;
    } else {
      const converted = convertWithCustom(
        item.quantity,
        item.unit,
        requiredUnit,
        conversions
          .filter(c => c.ingredientId === ingredientId)
          .map(c => ({ fromUnit: c.fromUnit, toUnit: c.toUnit, factor: c.factor }))
      );
      if (converted !== null) {
        totalInRequiredUnit += converted;
      }
      // Si no se puede convertir, no contamos esa cantidad
    }
  }

  return totalInRequiredUnit;
}

/**
 * Genera la lista de la compra completa a partir del menú semanal y el almacén.
 */
export function calculateShoppingList(
  requirements: RecipeRequirement[],
  pantryItems: PantryItem[],
  conversions: IngredientConversion[],
  minQuantities: Record<string, { quantity: number; unit: Unit }> = {},
): ShoppingCalculationResult {
  const items: ShoppingItemCalculated[] = [];
  let covered = 0;
  let missing = 0;

  for (const req of requirements) {
    const available = getAvailableQuantity(
      req.ingredientId,
      req.unit,
      pantryItems,
      conversions
    );

    const minQty = req.ingredientId && minQuantities[req.ingredientId]
      ? convertWithCustom(
          minQuantities[req.ingredientId].quantity,
          minQuantities[req.ingredientId].unit,
          req.unit,
          conversions.filter(c => c.ingredientId === req.ingredientId).map(c => ({
            fromUnit: c.fromUnit, toUnit: c.toUnit, factor: c.factor
          }))
        ) ?? 0
      : 0;

    // Total necesario = lo que requiere la receta + reserva mínima
    const totalNeeded = req.totalQuantity + Math.max(0, minQty - Math.max(0, available - req.totalQuantity));
    const deficit = Math.max(0, totalNeeded - available);

    if (deficit > 0) {
      missing++;
      items.push({
        ingredientId: req.ingredientId ?? undefined,
        name: req.name,
        needed: roundForShopping(deficit, req.unit),
        available,
        missing: roundForShopping(deficit, req.unit),
        unit: req.unit,
        category: req.category,
        sourceRecipes: req.sourceRecipes,
      });
    } else {
      covered++;
    }
  }

  return {
    items,
    totalIngredients: requirements.length,
    coveredIngredients: covered,
    missingIngredients: missing,
  };
}

/**
 * Escala un conjunto de ingredientes según el ratio de raciones.
 */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  originalServings: number,
  targetServings: number,
): RecipeIngredient[] {
  if (originalServings <= 0 || targetServings <= 0) return ingredients;
  const factor = targetServings / originalServings;
  return ingredients.map(ing => ({
    ...ing,
    quantity: Math.max(0, +(ing.quantity * factor).toFixed(3)),
  }));
}

/**
 * Determina la disponibilidad de los ingredientes de una receta.
 */
export function checkIngredientAvailability(
  ingredients: RecipeIngredient[],
  servings: number,
  originalServings: number,
  pantryItems: PantryItem[],
  conversions: IngredientConversion[],
) {
  const scaled = scaleIngredients(ingredients, originalServings, servings);
  const result = {
    available: [] as typeof scaled,
    partial: [] as typeof scaled,
    missing: [] as typeof scaled,
    availableQty: {} as Record<string, number>,
  };

  for (const ing of scaled) {
    const avail = getAvailableQuantity(ing.ingredientId, ing.unit, pantryItems, conversions);
    result.availableQty[ing.id] = avail;

    if (avail >= ing.quantity) {
      result.available.push(ing);
    } else if (avail > 0) {
      result.partial.push(ing);
    } else {
      result.missing.push(ing);
    }
  }

  return result;
}

/**
 * Consume ingredientes del almacén usando FIFO.
 * Retorna las actualizaciones necesarias para la BD.
 */
export function consumeIngredientsFIFO(
  ingredientId: string,
  quantityNeeded: number,
  unit: Unit,
  pantryItems: PantryItem[],
  conversions: IngredientConversion[],
): { pantryItemId: string; newQuantity: number }[] {
  const updates: { pantryItemId: string; newQuantity: number }[] = [];

  const items = pantryItems
    .filter(p => p.ingredientId === ingredientId && p.quantity > 0)
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });

  let remaining = quantityNeeded;

  for (const item of items) {
    if (remaining <= 0) break;

    // Convertir item.quantity a la unidad requerida
    let itemQtyInRequiredUnit: number;
    if (item.unit === unit) {
      itemQtyInRequiredUnit = item.quantity;
    } else {
      const converted = convertWithCustom(
        item.quantity,
        item.unit,
        unit,
        conversions.filter(c => c.ingredientId === ingredientId).map(c => ({
          fromUnit: c.fromUnit, toUnit: c.toUnit, factor: c.factor
        }))
      );
      if (converted === null) continue;
      itemQtyInRequiredUnit = converted;
    }

    const toConsume = Math.min(remaining, itemQtyInRequiredUnit);
    remaining -= toConsume;

    // Calcular nueva cantidad en la unidad original del item
    let newQtyInItemUnit: number;
    if (item.unit === unit) {
      newQtyInItemUnit = item.quantity - toConsume;
    } else {
      const consumed = convertWithCustom(toConsume, unit, item.unit, conversions.filter(c => c.ingredientId === ingredientId).map(c => ({
        fromUnit: c.fromUnit, toUnit: c.toUnit, factor: c.factor
      })));
      newQtyInItemUnit = consumed !== null ? Math.max(0, item.quantity - consumed) : item.quantity;
    }

    updates.push({ pantryItemId: item.id, newQuantity: Math.max(0, +newQtyInItemUnit.toFixed(4)) });
  }

  return updates;
}
