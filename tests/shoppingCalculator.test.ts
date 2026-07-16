import {
  aggregateIngredients,
  calculateShoppingList,
  scaleIngredients,
  checkIngredientAvailability,
} from '../services/shoppingListCalculator';
import type { RecipeIngredient, PantryItem } from '../types';

const mockIngredient = (overrides: Partial<RecipeIngredient> = {}): RecipeIngredient => ({
  id: 'ing-1',
  recipeId: 'rec-1',
  ingredientId: 'cat-1',
  name: 'Arroz',
  quantity: 200,
  unit: 'g',
  optional: false,
  notes: null,
  ...overrides,
});

const mockPantryItem = (overrides: Partial<PantryItem> = {}): PantryItem => ({
  id: 'pantry-1',
  ingredientId: 'cat-1',
  customName: 'Arroz',
  quantity: 500,
  unit: 'g',
  minQuantity: null,
  location: 'despensa',
  purchaseDate: null,
  expiryDate: null,
  brand: null,
  price: null,
  notes: null,
  isOpen: false,
  openedDate: null,
  batchId: null,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

describe('shoppingListCalculator', () => {
  describe('scaleIngredients', () => {
    it('escala ingredientes correctamente', () => {
      const ingredients = [mockIngredient({ quantity: 200, unit: 'g' })];
      const scaled = scaleIngredients(ingredients, 2, 4);
      expect(scaled[0].quantity).toBe(400);
    });

    it('no cambia con escala 1:1', () => {
      const ingredients = [mockIngredient({ quantity: 300, unit: 'g' })];
      const scaled = scaleIngredients(ingredients, 3, 3);
      expect(scaled[0].quantity).toBe(300);
    });

    it('escala hacia abajo correctamente', () => {
      const ingredients = [mockIngredient({ quantity: 400, unit: 'g' })];
      const scaled = scaleIngredients(ingredients, 4, 2);
      expect(scaled[0].quantity).toBe(200);
    });
  });

  describe('aggregateIngredients', () => {
    it('suma ingredientes de múltiples recetas', () => {
      const input = [
        { recipeName: 'Receta A', servings: 2, scaleFactor: 1, ingredients: [mockIngredient({ quantity: 200, unit: 'g' })] },
        { recipeName: 'Receta B', servings: 2, scaleFactor: 1, ingredients: [mockIngredient({ quantity: 300, unit: 'g' })] },
      ];
      const result = aggregateIngredients(input);
      expect(result.length).toBe(1);
      expect(result[0].totalQuantity).toBe(500);
    });

    it('no suma ingredientes con unidades distintas', () => {
      const input = [
        { recipeName: 'Receta A', servings: 2, scaleFactor: 1, ingredients: [mockIngredient({ quantity: 200, unit: 'g' })] },
        { recipeName: 'Receta B', servings: 2, scaleFactor: 1, ingredients: [mockIngredient({ quantity: 1, unit: 'kg' })] },
      ];
      const result = aggregateIngredients(input);
      expect(result.length).toBe(2);
    });

    it('omite ingredientes opcionales', () => {
      const input = [
        { recipeName: 'Receta A', servings: 2, scaleFactor: 1, ingredients: [mockIngredient({ optional: true })] },
      ];
      const result = aggregateIngredients(input);
      expect(result.length).toBe(0);
    });
  });

  describe('calculateShoppingList', () => {
    it('calcula correctamente ingredientes que faltan', () => {
      const requirements = [{
        ingredientId: 'cat-1', name: 'Arroz', totalQuantity: 800, unit: 'g' as const,
        category: 'cereales' as const, sourceRecipes: ['Arroz con pollo'],
      }];
      const pantry = [mockPantryItem({ quantity: 500, unit: 'g' })];
      const result = calculateShoppingList(requirements, pantry, []);
      expect(result.missingIngredients).toBe(1);
      expect(result.items[0].missing).toBeGreaterThan(0);
    });

    it('no añade a la lista si hay suficiente', () => {
      const requirements = [{
        ingredientId: 'cat-1', name: 'Arroz', totalQuantity: 200, unit: 'g' as const,
        category: 'cereales' as const, sourceRecipes: ['Arroz blanco'],
      }];
      const pantry = [mockPantryItem({ quantity: 500, unit: 'g' })];
      const result = calculateShoppingList(requirements, pantry, []);
      expect(result.missingIngredients).toBe(0);
      expect(result.items.length).toBe(0);
    });

    it('maneja almacén vacío correctamente', () => {
      const requirements = [{
        ingredientId: 'cat-2', name: 'Cebolla', totalQuantity: 3, unit: 'unidad' as const,
        category: 'verduras' as const, sourceRecipes: ['Lentejas'],
      }];
      const result = calculateShoppingList(requirements, [], []);
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('Cebolla');
    });
  });

  describe('checkIngredientAvailability', () => {
    it('clasifica ingredientes disponibles correctamente', () => {
      const ingredients = [mockIngredient({ quantity: 200, unit: 'g', ingredientId: 'cat-1' })];
      const pantry = [mockPantryItem({ quantity: 500, unit: 'g' })];
      const result = checkIngredientAvailability(ingredients, 2, 2, pantry, []);
      expect(result.available).toHaveLength(1);
      expect(result.missing).toHaveLength(0);
    });

    it('clasifica ingredientes parcialmente disponibles', () => {
      const ingredients = [mockIngredient({ quantity: 400, unit: 'g', ingredientId: 'cat-1' })];
      const pantry = [mockPantryItem({ quantity: 200, unit: 'g' })];
      const result = checkIngredientAvailability(ingredients, 2, 2, pantry, []);
      expect(result.partial).toHaveLength(1);
    });

    it('clasifica ingredientes no disponibles', () => {
      const ingredients = [mockIngredient({ quantity: 300, unit: 'g', ingredientId: 'cat-99' })];
      const pantry = [mockPantryItem({ ingredientId: 'cat-1' })];
      const result = checkIngredientAvailability(ingredients, 2, 2, pantry, []);
      expect(result.missing).toHaveLength(1);
    });
  });
});
