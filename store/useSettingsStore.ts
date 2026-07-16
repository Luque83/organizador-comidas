import { create } from 'zustand';
import type { UserSettings, DietType } from '@/types';
import { executeFirst, executeRun } from '@/database/db';

interface SettingsState {
  settings: UserSettings | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  defaultServings: 2,
  mealsPerDay: 3,
  dietType: 'sin_restricciones' as DietType,
  allergies: '[]',
  intolerances: '[]',
  excludedIngredients: '[]',
  favoriteIngredients: '[]',
  maxCookTime: null,
  weeklyBudget: null,
  preferredUnit: 'metric',
  weekStartsOn: 1,
  expiryAlertDays: 3,
  notificationsEnabled: false,
  notifyExpiry: true,
  notifyLowStock: true,
  notifyWeeklyPlanning: true,
  notifyShoppingReminder: true,
  notifyTomorrowMeals: false,
  darkMode: 'system',
  updatedAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoaded: false,

  load: async () => {
    try {
      const row = await executeFirst<Record<string, unknown>>(
        'SELECT * FROM user_settings WHERE id = ?',
        ['default']
      );
      if (row) {
        set({ settings: mapRowToSettings(row), isLoaded: true });
      } else {
        set({ settings: DEFAULT_SETTINGS, isLoaded: true });
      }
    } catch (e) {
      console.error('[Settings] Error loading settings:', e);
      set({ settings: DEFAULT_SETTINGS, isLoaded: true });
    }
  },

  update: async (partial) => {
    const current = get().settings ?? DEFAULT_SETTINGS;
    const updated: UserSettings = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    set({ settings: updated });

    await executeRun(
      `INSERT OR REPLACE INTO user_settings (
        id, default_servings, meals_per_day, diet_type, allergies, intolerances,
        excluded_ingredients, favorite_ingredients, max_cook_time, weekly_budget,
        preferred_unit, week_starts_on, expiry_alert_days, notifications_enabled,
        notify_expiry, notify_low_stock, notify_weekly_planning,
        notify_shopping_reminder, notify_tomorrow_meals, dark_mode, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        updated.defaultServings,
        updated.mealsPerDay,
        updated.dietType,
        updated.allergies,
        updated.intolerances,
        updated.excludedIngredients,
        updated.favoriteIngredients,
        updated.maxCookTime ?? null,
        updated.weeklyBudget ?? null,
        updated.preferredUnit,
        updated.weekStartsOn,
        updated.expiryAlertDays,
        updated.notificationsEnabled ? 1 : 0,
        updated.notifyExpiry ? 1 : 0,
        updated.notifyLowStock ? 1 : 0,
        updated.notifyWeeklyPlanning ? 1 : 0,
        updated.notifyShoppingReminder ? 1 : 0,
        updated.notifyTomorrowMeals ? 1 : 0,
        updated.darkMode,
        updated.updatedAt,
      ]
    );
  },
}));

function mapRowToSettings(row: Record<string, unknown>): UserSettings {
  return {
    id: String(row.id ?? 'default'),
    defaultServings: Number(row.default_servings ?? 2),
    mealsPerDay: Number(row.meals_per_day ?? 3),
    dietType: String(row.diet_type ?? 'sin_restricciones') as DietType,
    allergies: String(row.allergies ?? '[]'),
    intolerances: String(row.intolerances ?? '[]'),
    excludedIngredients: String(row.excluded_ingredients ?? '[]'),
    favoriteIngredients: String(row.favorite_ingredients ?? '[]'),
    maxCookTime: row.max_cook_time != null ? Number(row.max_cook_time) : null,
    weeklyBudget: row.weekly_budget != null ? Number(row.weekly_budget) : null,
    preferredUnit: String(row.preferred_unit ?? 'metric') as 'metric' | 'custom',
    weekStartsOn: Number(row.week_starts_on ?? 1) as 0 | 1,
    expiryAlertDays: Number(row.expiry_alert_days ?? 3),
    notificationsEnabled: Boolean(Number(row.notifications_enabled ?? 0)),
    notifyExpiry: Boolean(Number(row.notify_expiry ?? 1)),
    notifyLowStock: Boolean(Number(row.notify_low_stock ?? 1)),
    notifyWeeklyPlanning: Boolean(Number(row.notify_weekly_planning ?? 1)),
    notifyShoppingReminder: Boolean(Number(row.notify_shopping_reminder ?? 1)),
    notifyTomorrowMeals: Boolean(Number(row.notify_tomorrow_meals ?? 0)),
    darkMode: String(row.dark_mode ?? 'system') as 'system' | 'light' | 'dark',
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}
