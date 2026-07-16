import { supabase } from './supabase';
import { executeRun, executeQuery } from '@/database/db';
import { useHouseholdStore } from '@/store/useHouseholdStore';
import NetInfo from '@react-native-community/netinfo';

type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export const SyncEngine = {
  // Encolar una operación localmente
  queueOperation: async (tableName: string, recordId: string, operation: SyncOperation, data: any) => {
    try {
      await executeRun(
        'INSERT INTO pending_sync_operations (table_name, record_id, operation, data) VALUES (?, ?, ?, ?)',
        [tableName, recordId, operation, data ? JSON.stringify(data) : null]
      );
      
      // Intentar sincronizar inmediatamente en segundo plano
      SyncEngine.pushPendingChanges();
    } catch (e) {
      console.error('Error al encolar operación de sincronización:', e);
    }
  },

  // Subir cambios pendientes a Supabase
  pushPendingChanges: async () => {
    // Verificar conexión
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    try {
      const pendingOps = await executeQuery<{ id: number, table_name: string, record_id: string, operation: SyncOperation, data: string, retry_count: number }>('SELECT * FROM pending_sync_operations ORDER BY id ASC LIMIT 50');
      
      if (pendingOps.length === 0) return;

      for (const op of pendingOps) {
        try {
          const parsedData = op.data ? JSON.parse(op.data) : null;
          
          if (op.operation === 'INSERT' || op.operation === 'UPDATE') {
            // Upsert a Supabase
            const { error } = await supabase
              .from(op.table_name)
              .upsert(parsedData);
              
            if (error) throw error;
          } else if (op.operation === 'DELETE') {
            // Delete de Supabase
            const { error } = await supabase
              .from(op.table_name)
              .delete()
              .eq('id', op.record_id);
              
            if (error) throw error;
          }

          // Si éxito, borrar de la cola
          await executeRun('DELETE FROM pending_sync_operations WHERE id = ?', [op.id]);
          
        } catch (opError) {
          console.error(`Error procesando op ${op.id}:`, opError);
          // Incrementar retry
          await executeRun('UPDATE pending_sync_operations SET retry_count = retry_count + 1, last_error = ? WHERE id = ?', [String(opError), op.id]);
        }
      }
      
    } catch (e) {
      console.error('Error en pushPendingChanges:', e);
    }
  },

  // Escuchar cambios desde Supabase en tiempo real
  startRealtimeSync: () => {
    const activeHouseholdId = useHouseholdStore.getState().activeHousehold?.id;
    if (!activeHouseholdId) return;

    const channel = supabase.channel(`household_${activeHouseholdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `household_id=eq.${activeHouseholdId}` },
        async (payload) => {
          console.log('Realtime Update Received:', payload);
          
          const tableName = payload.table;
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              // Convertimos el JSON de supabase a un objeto manejable
              const columns = Object.keys(newRecord).join(', ');
              const placeholders = Object.keys(newRecord).map(() => '?').join(', ');
              const values = Object.values(newRecord);
              
              // Upsert en SQLite
              await executeRun(
                `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`,
                values
              );
            } else if (eventType === 'DELETE') {
              await executeRun(
                `DELETE FROM ${tableName} WHERE id = ?`,
                [(oldRecord as any).id]
              );
            }
          } catch (e) {
            console.error('Error aplicando cambio Realtime a SQLite:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
