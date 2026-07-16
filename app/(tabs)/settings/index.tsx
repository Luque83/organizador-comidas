import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Toast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportBackup, importBackup } from '@/services/backupService';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.update);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  if (!settings) return null;

  const handleExport = async () => {
    try {
      const uri = await exportBackup();
      showToast('Copia de seguridad exportada correctamente');
    } catch (e) {
      showToast('Error al exportar los datos', 'error');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets[0]) {
        setPendingImportUri(result.assets[0].uri);
        setImportConfirm(true);
      }
    } catch (e) {
      showToast('Error al seleccionar el archivo', 'error');
    }
  };

  const confirmImport = async () => {
    if (!pendingImportUri) return;
    try {
      await importBackup(pendingImportUri);
      showToast('Datos importados correctamente');
    } catch (e) {
      showToast(`Error al importar: ${String(e)}`, 'error');
    } finally {
      setImportConfirm(false);
      setPendingImportUri(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cuenta */}
        <SettingSection title="👤 Cuenta">
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push('/(tabs)/settings/profile')}
          >
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Mi Perfil</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Gestionar cuenta y cerrar sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </SettingSection>

        {/* Preferencias de comida */}
        <SettingSection title="🍽️ Preferencias de comida">
          <SettingRow
            icon="people-outline"
            label="Personas habituales"
            value={String(settings.defaultServings)}
            onIncrease={() => updateSettings({ defaultServings: Math.min(20, settings.defaultServings + 1) })}
            onDecrease={() => updateSettings({ defaultServings: Math.max(1, settings.defaultServings - 1) })}
            type="stepper"
          />
          <SettingRow
            icon="restaurant-outline"
            label="Comidas por día"
            value={String(settings.mealsPerDay)}
            onIncrease={() => updateSettings({ mealsPerDay: Math.min(8, settings.mealsPerDay + 1) })}
            onDecrease={() => updateSettings({ mealsPerDay: Math.max(1, settings.mealsPerDay - 1) })}
            type="stepper"
          />
        </SettingSection>

        {/* Tipo de alimentación */}
        <SettingSection title="🥗 Tipo de alimentación">
          {[
            { value: 'sin_restricciones', label: 'Sin restricciones' },
            { value: 'vegetariana', label: 'Vegetariana' },
            { value: 'vegana', label: 'Vegana' },
            { value: 'sin_gluten', label: 'Sin gluten' },
            { value: 'sin_lactosa', label: 'Sin lactosa' },
            { value: 'baja_carbohidratos', label: 'Baja en carbohidratos' },
            { value: 'mediterranea', label: 'Mediterránea' },
          ].map(diet => (
            <TouchableOpacity
              key={diet.value}
              style={[styles.radioRow, { borderBottomColor: colors.separator }]}
              onPress={() => updateSettings({ dietType: diet.value as any })}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.dietType === diet.value }}
            >
              <View style={[styles.radio, { borderColor: settings.dietType === diet.value ? colors.primary : colors.border }]}>
                {settings.dietType === diet.value && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>{diet.label}</Text>
            </TouchableOpacity>
          ))}
        </SettingSection>

        {/* Semana */}
        <SettingSection title="📅 Semana">
          <SettingRow
            icon="calendar-outline"
            label="Inicio de semana"
            value={settings.weekStartsOn === 1 ? 'Lunes' : 'Domingo'}
            onPress={() => updateSettings({ weekStartsOn: settings.weekStartsOn === 1 ? 0 : 1 })}
            type="toggle-text"
          />
        </SettingSection>

        {/* Caducidades */}
        <SettingSection title="⚠️ Alertas de caducidad">
          <SettingRow
            icon="alarm-outline"
            label="Días de aviso previo"
            value={String(settings.expiryAlertDays)}
            onIncrease={() => updateSettings({ expiryAlertDays: Math.min(30, settings.expiryAlertDays + 1) })}
            onDecrease={() => updateSettings({ expiryAlertDays: Math.max(1, settings.expiryAlertDays - 1) })}
            type="stepper"
          />
        </SettingSection>

        {/* Notificaciones */}
        <SettingSection title="🔔 Notificaciones">
          <SwitchRow
            label="Activar notificaciones"
            value={settings.notificationsEnabled}
            onChange={v => updateSettings({ notificationsEnabled: v })}
          />
          {settings.notificationsEnabled && (
            <>
              <SwitchRow label="Próximas caducidades" value={settings.notifyExpiry} onChange={v => updateSettings({ notifyExpiry: v })} />
              <SwitchRow label="Stock bajo" value={settings.notifyLowStock} onChange={v => updateSettings({ notifyLowStock: v })} />
              <SwitchRow label="Planificar menú semanal" value={settings.notifyWeeklyPlanning} onChange={v => updateSettings({ notifyWeeklyPlanning: v })} />
              <SwitchRow label="Recordatorio de compra" value={settings.notifyShoppingReminder} onChange={v => updateSettings({ notifyShoppingReminder: v })} />
            </>
          )}
        </SettingSection>

        {/* Apariencia */}
        <SettingSection title="🎨 Apariencia">
          {[
            { value: 'system', label: 'Automático (sistema)', emoji: '⚙️' },
            { value: 'light', label: 'Modo claro', emoji: '☀️' },
            { value: 'dark', label: 'Modo oscuro', emoji: '🌙' },
          ].map(theme => (
            <TouchableOpacity
              key={theme.value}
              style={[styles.radioRow, { borderBottomColor: colors.separator }]}
              onPress={() => updateSettings({ darkMode: theme.value as any })}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.darkMode === theme.value }}
            >
              <View style={[styles.radio, { borderColor: settings.darkMode === theme.value ? colors.primary : colors.border }]}>
                {settings.darkMode === theme.value && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={styles.radioEmoji}>{theme.emoji}</Text>
              <Text style={[styles.radioLabel, { color: colors.text }]}>{theme.label}</Text>
            </TouchableOpacity>
          ))}
        </SettingSection>

        {/* Copia de seguridad */}
        <SettingSection title="💾 Datos y copia de seguridad">
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleExport}
            accessibilityRole="button"
            accessibilityLabel="Exportar copia de seguridad"
          >
            <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Exportar copia de seguridad</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Guarda todos tus datos como JSON</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleImport}
            accessibilityRole="button"
            accessibilityLabel="Importar copia de seguridad"
          >
            <Ionicons name="cloud-download-outline" size={22} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Importar copia de seguridad</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Restaurar datos desde un archivo JSON</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </SettingSection>

        {/* Info */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>Mi Menú Semanal v1.0.0</Text>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>Desarrollado con ❤️ en Expo + React Native</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={importConfirm}
        title="Importar datos"
        message="Esta acción reemplazará todos tus datos actuales con los del archivo. ¿Continuar?"
        confirmText="Importar y reemplazar"
        destructive
        onConfirm={confirmImport}
        onCancel={() => { setImportConfirm(false); setPendingImportUri(null); }}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────
function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.backgroundCard }]}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, onIncrease, onDecrease, type }: {
  icon: any; label: string; value: string; onPress?: () => void;
  onIncrease?: () => void; onDecrease?: () => void; type: 'stepper' | 'toggle-text';
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.separator }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      {type === 'stepper' && (
        <View style={styles.stepper}>
          <TouchableOpacity onPress={onDecrease} style={[styles.stepBtn, { borderColor: colors.border }]}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: colors.primary }]}>{value}</Text>
          <TouchableOpacity onPress={onIncrease} style={[styles.stepBtn, { borderColor: colors.border }]}>
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      {type === 'toggle-text' && (
        <TouchableOpacity onPress={onPress} style={[styles.toggleText, { backgroundColor: colors.primarySurface }]}>
          <Text style={[styles.toggleTextValue, { color: colors.primary }]}>{value}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.settingLabel, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textTertiary}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '800' },
  scroll: { padding: 16, gap: 8 },
  section: { gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  toggleText: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleTextValue: { fontSize: 14, fontWeight: '700' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioEmoji: { fontSize: 18 },
  radioLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    marginBottom: 8,
    borderRadius: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionHint: { fontSize: 12, marginTop: 2 },
  versionInfo: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  versionText: { fontSize: 12 },
});
