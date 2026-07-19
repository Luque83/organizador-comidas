import { create } from 'zustand';
import type { PantryItem, StorageLocation, Unit } from '@/types';
import { executeQuery, executeRun, executeFirst } from '@/database/db';
import uuid from 'react-native-uuid';
const uuidv4 = () => uuid.v4() as string;

interface PantryState {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addItem: (item: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  updateQuantity: (id: string, newQuantity: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markEmpty: (id: string) => Promise<void>;
  moveItem: (id: string, newLocation: StorageLocation) => Promise<void>;
  getByIngredient: (ingredientId: string) => PantryItem[];
  getExpiringSoon: (days: number) => PantryItem[];
  getLowStock: () => PantryItem[];
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await executeQuery<Record<string, unknown>>(
        'SELECT * FROM pantry_items ORDER BY location, expiry_date ASC'
      );
      set({ items: rows.map(mapRowToPantryItem), isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addItem: async (item) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Obtener datos de sincronización
    const { useHouseholdStore } = await import('@/store/useHouseholdStore');
    const { supabase } = await import('@/lib/supabase');
    const householdId = useHouseholdStore.getState().activeHousehold?.id || null;
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const rowData = {
      id, 
      household_id: householdId,
      ingredient_id: item.ingredientId ?? null, 
      custom_name: item.customName ?? null,
      quantity: item.quantity, 
      unit: item.unit, 
      min_quantity: item.minQuantity ?? null,
      location: item.location, 
      purchase_date: item.purchaseDate ?? null, 
      expiry_date: item.expiryDate ?? null,
      brand: item.brand ?? null, 
      price: item.price ?? null, 
      notes: item.notes ?? null,
      is_open: item.isOpen ? 1 : 0, 
      opened_date: item.openedDate ?? null, 
      batch_id: item.batchId ?? null,
      created_by: userId,
      updated_by: userId,
      created_at: now, 
      updated_at: now
    };

    await executeRun(
      `INSERT INTO pantry_items (
        id, household_id, ingredient_id, custom_name, quantity, unit, min_quantity,
        location, purchase_date, expiry_date, brand, price, notes,
        is_open, opened_date, batch_id, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rowData.id, rowData.household_id, rowData.ingredient_id, rowData.custom_name, 
        rowData.quantity, rowData.unit, rowData.min_quantity, rowData.location, 
        rowData.purchase_date, rowData.expiry_date, rowData.brand, rowData.price, 
        rowData.notes, rowData.is_open, rowData.opened_date, rowData.batch_id, 
        rowData.created_by, rowData.updated_by, rowData.created_at, rowData.updated_at
      ]
    );

    // Encolar sincronización
    const { SyncEngine } = await import('@/lib/syncEngine');
    await SyncEngine.queueOperation('pantry_items', id, 'INSERT', rowData);

    await get().load();
    return id;
  },

  updateItem: async (id, updates) => {
    const current = get().items.find(i => i.id === id);
    if (!current) return;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    
    await executeRun(
      `UPDATE pantry_items SET
        ingredient_id = ?, custom_name = ?, quantity = ?, unit = ?,
        min_quantity = ?, location = ?, purchase_date = ?, expiry_date = ?,
        brand = ?, price = ?, notes = ?, is_open = ?, opened_date = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        updated.ingredientId ?? null, updated.customName ?? null,
        updated.quantity, updated.unit, updated.minQuantity ?? null,
        updated.location, updated.purchaseDate ?? null, updated.expiryDate ?? null,
        updated.brand ?? null, updated.price ?? null, updated.notes ?? null,
        updated.isOpen ? 1 : 0, updated.openedDate ?? null, updated.updatedAt,
        id,
      ]
    );

    // Encolar sincronización
    const { SyncEngine } = await import('@/lib/syncEngine');
    const { useHouseholdStore } = await import('@/store/useHouseholdStore');
    const householdId = useHouseholdStore.getState().activeHousehold?.id || null;
    
    await SyncEngine.queueOperation('pantry_items', id, 'UPDATE', {
      id, household_id: householdId, ingredient_id: updated.ingredientId ?? null, custom_name: updated.customName ?? null,
      quantity: updated.quantity, unit: updated.unit, min_quantity: updated.minQuantity ?? null,
      location: updated.location, purchase_date: updated.purchaseDate ?? null, expiry_date: updated.expiryDate ?? null,
      brand: updated.brand ?? null, price: updated.price ?? null, notes: updated.notes ?? null,
      is_open: updated.isOpen ? 1 : 0, opened_date: updated.openedDate ?? null, updated_at: updated.updatedAt
    });

    set(state => ({
      items: state.items.map(i => i.id === id ? updated : i),
    }));
  },

  updateQuantity: async (id, newQuantity) => {
    const qty = Math.max(0, newQuantity);
    const now = new Date().toISOString();
    await executeRun(
      'UPDATE pantry_items SET quantity = ?, updated_at = ? WHERE id = ?',
      [qty, now, id]
    );

    // Encolar sincronización (solo mandamos los campos modificados en la cola local, el SyncEngine hará UPSERT o usará un RPC)
    // Para simplificar el UPSERT, deberíamos mandar todo el objeto actualizado, así que lo buscamos:
    const item = get().items.find(i => i.id === id);
    if (item) {
      const { SyncEngine } = await import('@/lib/syncEngine');
      const { useHouseholdStore } = await import('@/store/useHouseholdStore');
      await SyncEngine.queueOperation('pantry_items', id, 'UPDATE', {
        id, household_id: useHouseholdStore.getState().activeHousehold?.id || null, quantity: qty, updated_at: now
      });
    }

    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, quantity: qty } : i),
    }));
  },

  deleteItem: async (id) => {
    await executeRun('DELETE FROM pantry_items WHERE id = ?', [id]);
    
    // Encolar sincronización
    const { SyncEngine } = await import('@/lib/syncEngine');
    await SyncEngine.queueOperation('pantry_items', id, 'DELETE', null);

    set(state => ({ items: state.items.filter(i => i.id !== id) }));
  },

  markEmpty: async (id) => {
    await get().updateQuantity(id, 0);
  },

  moveItem: async (id, newLocation) => {
    await get().updateItem(id, { location: newLocation });
  },

  getByIngredient: (ingredientId) => {
    return get().items.filter(i => i.ingredientId === ingredientId);
  },

  getExpiringSoon: (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return get().items.filter(
      i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= cutoffStr && i.quantity > 0
    );
  },

  getLowStock: () => {
    return get().items.filter(
      i => i.minQuantity != null && i.quantity < (i.minQuantity ?? 0)
    );
  },
}));

function mapRowToPantryItem(row: Record<string, unknown>): PantryItem {
  return {
    id: String(row.id),
    ingredientId: row.ingredient_id ? String(row.ingredient_id) : null,
    customName: row.custom_name ? String(row.custom_name) : null,
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit ?? 'g') as Unit,
    minQuantity: row.min_quantity != null ? Number(row.min_quantity) : null,
    location: String(row.location ?? 'despensa') as StorageLocation,
    purchaseDate: row.purchase_date ? String(row.purchase_date) : null,
    expiryDate: row.expiry_date ? String(row.expiry_date) : null,
    brand: row.brand ? String(row.brand) : null,
    price: row.price != null ? Number(row.price) : null,
    notes: row.notes ? String(row.notes) : null,
    isOpen: Boolean(Number(row.is_open ?? 0)),
    openedDate: row.opened_date ? String(row.opened_date) : null,
    batchId: row.batch_id ? String(row.batch_id) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}
