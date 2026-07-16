import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';
import { executeQuery, executeRun, withTransaction } from '@/database/db';

// ─── Schema de validación para importación ────────────────────
const BackupSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    ingredients: z.array(z.record(z.unknown())),
    ingredient_aliases: z.array(z.record(z.unknown())),
    ingredient_conversions: z.array(z.record(z.unknown())),
    recipes: z.array(z.record(z.unknown())),
    recipe_ingredients: z.array(z.record(z.unknown())),
    recipe_steps: z.array(z.record(z.unknown())),
    pantry_items: z.array(z.record(z.unknown())),
    shopping_lists: z.array(z.record(z.unknown())),
    shopping_items: z.array(z.record(z.unknown())),
    meal_plans: z.array(z.record(z.unknown())),
    planned_meals: z.array(z.record(z.unknown())),
    user_settings: z.array(z.record(z.unknown())),
  }),
});

type BackupData = z.infer<typeof BackupSchema>;

const BACKUP_TABLES = [
  'user_settings',
  'ingredients',
  'ingredient_aliases',
  'ingredient_conversions',
  'recipes',
  'recipe_ingredients',
  'recipe_steps',
  'meal_plans',
  'planned_meals',
  'pantry_items',
  'shopping_lists',
  'shopping_items',
];

/**
 * Exporta todos los datos de la BD a un archivo JSON.
 * Retorna la URI del archivo generado.
 */
export async function exportBackup(): Promise<string> {
  const exportData: Record<string, unknown[]> = {};

  for (const table of BACKUP_TABLES) {
    exportData[table] = await executeQuery(`SELECT * FROM ${table}`);
  }

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: exportData,
  };

  const json = JSON.stringify(backup, null, 2);
  const fileName = `mi_menu_semanal_backup_${Date.now()}.json`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

/**
 * Comparte el archivo de backup mediante las opciones nativas del dispositivo.
 */
export async function shareBackup(): Promise<void> {
  const fileUri = await exportBackup();
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Compartir copia de seguridad',
    });
  } else {
    throw new Error('El dispositivo no soporta compartir archivos.');
  }
}

/**
 * Importa datos desde un archivo JSON de backup.
 * Valida el formato antes de modificar la BD.
 */
export async function importBackup(fileUri: string): Promise<void> {
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  // Validar estructura
  const result = BackupSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Formato de backup inválido: ${result.error.message}`);
  }

  const backup = result.data as BackupData;

  await withTransaction(async () => {
    // Limpiar tablas en orden inverso (dependencias)
    const tablesToClear = [...BACKUP_TABLES].reverse();
    for (const table of tablesToClear) {
      await executeRun(`DELETE FROM ${table}`);
    }

    // Insertar datos del backup
    for (const table of BACKUP_TABLES) {
      const rows = (backup.data as Record<string, Record<string, unknown>[]>)[table] ?? [];
      for (const row of rows) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(c => {
          const v = row[c];
          return v === null || v === undefined ? null : String(v);
        });
        await executeRun(
          `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }
  });
}

/**
 * Exporta la lista de compra activa como texto plano.
 */
export async function exportShoppingListAsText(listId: string): Promise<string> {
  const items = await executeQuery<{
    name: string;
    needed_quantity: number;
    unit: string;
    category: string;
    is_bought: number;
  }>(
    `SELECT name, needed_quantity, unit, category, is_bought
     FROM shopping_items
     WHERE shopping_list_id = ?
     ORDER BY category, name`,
    [listId]
  );

  if (items.length === 0) return 'La lista de la compra está vacía.';

  let text = '🛒 Lista de la compra — Mi Menú Semanal\n';
  text += `Generada el ${new Date().toLocaleDateString('es-ES')}\n\n`;

  let currentCategory = '';
  for (const item of items) {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      text += `\n📦 ${currentCategory.toUpperCase()}\n`;
    }
    const check = item.is_bought ? '✅' : '☐';
    text += `${check} ${item.name}: ${item.needed_quantity} ${item.unit}\n`;
  }

  return text;
}

/**
 * Comparte la lista de compra como texto mediante las opciones nativas.
 */
export async function shareShoppingList(listId: string): Promise<void> {
  const text = await exportShoppingListAsText(listId);
  const fileName = `lista_compra_${Date.now()}.txt`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartir lista de la compra',
    });
  } else {
    throw new Error('El dispositivo no soporta compartir archivos.');
  }
}
