import type { Unit } from '@/types';

// Familias de unidades compatibles para conversión directa
const UNIT_FAMILIES: Record<string, string> = {
  g: 'weight',
  kg: 'weight',
  ml: 'volume',
  l: 'volume',
};

// Factores de conversión dentro de la misma familia (hacia la unidad base)
// Base weight: g, Base volume: ml
const TO_BASE: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
};

/**
 * Convierte un valor de una unidad a otra si son compatibles.
 * Retorna null si las unidades no son compatibles sin equivalencia personalizada.
 */
export function convertUnit(
  value: number,
  fromUnit: Unit,
  toUnit: Unit
): number | null {
  if (fromUnit === toUnit) return value;

  const fromFamily = UNIT_FAMILIES[fromUnit];
  const toFamily = UNIT_FAMILIES[toUnit];

  // Unidades sin familia (count, paquete, etc.) no se convierten automáticamente
  if (!fromFamily || !toFamily) return null;

  // Familias diferentes (peso vs volumen) no se convierten
  if (fromFamily !== toFamily) return null;

  // Convertir: fromUnit → base → toUnit
  const baseValue = value * TO_BASE[fromUnit];
  const result = baseValue / TO_BASE[toUnit];
  return result;
}

/**
 * Intenta convertir usando equivalencias personalizadas del ingrediente.
 * conversions es la lista de IngredientConversion del ingrediente.
 */
export function convertWithCustom(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  conversions: { fromUnit: Unit; toUnit: Unit; factor: number }[]
): number | null {
  // Primero intento conversión estándar
  const standard = convertUnit(value, fromUnit, toUnit);
  if (standard !== null) return standard;

  // Busco conversión directa
  const direct = conversions.find(
    c => c.fromUnit === fromUnit && c.toUnit === toUnit
  );
  if (direct) return value * direct.factor;

  // Busco conversión inversa
  const inverse = conversions.find(
    c => c.fromUnit === toUnit && c.toUnit === fromUnit
  );
  if (inverse) return value / inverse.factor;

  return null;
}

/**
 * Determina si dos unidades son de la misma familia.
 */
export function areSameFamily(unitA: Unit, unitB: Unit): boolean {
  if (unitA === unitB) return true;
  const familyA = UNIT_FAMILIES[unitA];
  const familyB = UNIT_FAMILIES[unitB];
  if (!familyA || !familyB) return false;
  return familyA === familyB;
}

/**
 * Normaliza una cantidad a la unidad base de su familia.
 * g/kg → g, ml/l → ml. Otras unidades se devuelven sin cambio.
 */
export function toBaseUnit(value: number, unit: Unit): { value: number; unit: Unit } {
  const factor = TO_BASE[unit];
  if (!factor) return { value, unit };
  return {
    value: value * factor,
    unit: unit === 'kg' ? 'g' : unit === 'l' ? 'ml' : unit,
  };
}

/**
 * Formatea una cantidad de forma legible (p.ej. 1500g → "1.5 kg")
 */
export function formatQuantity(value: number, unit: Unit): string {
  if (unit === 'g' && value >= 1000) {
    return `${+(value / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && value >= 1000) {
    return `${+(value / 1000).toFixed(2)} l`;
  }
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${unit}`;
}

/**
 * Redondea una cantidad de compra de forma comprensible.
 * p.ej. 430g → 500g, 0.8kg → 1kg
 */
export function roundForShopping(value: number, unit: Unit): number {
  if (value <= 0) return 0;
  if (unit === 'g') {
    if (value < 50) return Math.ceil(value / 10) * 10;
    if (value < 500) return Math.ceil(value / 50) * 50;
    return Math.ceil(value / 100) * 100;
  }
  if (unit === 'ml') {
    if (value < 100) return Math.ceil(value / 25) * 25;
    if (value < 1000) return Math.ceil(value / 100) * 100;
    return Math.ceil(value / 250) * 250;
  }
  if (unit === 'kg' || unit === 'l') {
    return Math.ceil(value * 4) / 4; // múltiplos de 0.25
  }
  return Math.ceil(value);
}
