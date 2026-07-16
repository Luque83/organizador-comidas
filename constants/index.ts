// ============================================================
// CONSTANTES — Mi Menú Semanal
// ============================================================

export const APP_NAME = 'Mi Menú Semanal';
export const DB_NAME = 'mi_menu_semanal.db';
export const DB_VERSION = 1;

// Días de la semana en español
export const WEEKDAYS = [
  { index: 1, short: 'Lun', long: 'Lunes' },
  { index: 2, short: 'Mar', long: 'Martes' },
  { index: 3, short: 'Mié', long: 'Miércoles' },
  { index: 4, short: 'Jue', long: 'Jueves' },
  { index: 5, short: 'Vie', long: 'Viernes' },
  { index: 6, short: 'Sáb', long: 'Sábado' },
  { index: 0, short: 'Dom', long: 'Domingo' },
];

// Colores de estado para ingredientes
export const STATUS_COLORS = {
  available: '#4CAF50',
  partial: '#FF9800',
  missing: '#F44336',
};

// Días de alerta de caducidad por defecto
export const DEFAULT_EXPIRY_ALERT_DAYS = 3;

// Máximo de días de historial de recetas para penalizar repetición
export const RECIPE_HISTORY_PENALTY_DAYS = 7;

// Puntuaciones del motor de recomendaciones
export const RECOMMENDATION_SCORES = {
  allIngredientsAvailable: 100,
  perIngredientAvailable: 3,
  perExpiringIngredient: 15,
  perFavorite: 20,
  recentlyPreparedPenalty: -30,
};

// Grupos de recomendación
export const RECOMMENDATION_THRESHOLDS = {
  puedesAhora: 100, // % compatibilidad
  faltaUno: 1, // número de ingredientes que faltan
  rapidas: 20, // minutos máximos
};
