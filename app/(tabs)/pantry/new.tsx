import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { usePantryStore } from '@/store/usePantryStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Toast } from '@/components/ui/Toast';
import { PantryItemSchema, PantryItemFormData } from '@/schemas';
import { STORAGE_LOCATIONS, UNITS } from '@/types';

export default function NewPantryItemScreen() {
  const colors = useThemeColors();
  const addItem = usePantryStore(s => s.addItem);
  const ingredients = useIngredientsStore(s => s.ingredients);
  const settings = useSettingsStore(s => s.settings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [searchIng, setSearchIng] = useState('');
  const [selectedIngId, setSelectedIngId] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<PantryItemFormData>({
    resolver: zodResolver(PantryItemSchema),
    defaultValues: {
      ingredientId: null,
      customName: '',
      quantity: 0,
      unit: 'g',
      minQuantity: null,
      location: 'despensa',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: null,
      brand: null,
      price: null,
      notes: null,
      isOpen: false,
    },
  });

  const filteredIngredients = searchIng.trim()
    ? ingredients.filter(i => i.name.toLowerCase().includes(searchIng.toLowerCase()))
    : ingredients.slice(0, 20);

  const onSubmit = async (data: PantryItemFormData) => {
    setSaving(true);
    try {
      await addItem({
        ingredientId: selectedIngId,
        customName: data.customName ?? null,
        quantity: data.quantity,
        unit: data.unit,
        minQuantity: data.minQuantity ?? null,
        location: data.location,
        purchaseDate: data.purchaseDate ?? null,
        expiryDate: data.expiryDate ?? null,
        brand: data.brand ?? null,
        price: data.price ?? null,
        notes: data.notes ?? null,
        isOpen: data.isOpen,
        openedDate: null,
        batchId: null,
      });
      setToast({ visible: true, message: 'Producto añadido al almacén', type: 'success' });
      setTimeout(() => router.back(), 1000);
    } catch (e) {
      setToast({ visible: true, message: 'Error al añadir el producto', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Añadir producto</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? colors.textTertiary : colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Guardar producto"
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Seleccionar ingrediente */}
          <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingrediente</Text>
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundInput, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar ingrediente..."
                placeholderTextColor={colors.textPlaceholder}
                value={searchIng}
                onChangeText={setSearchIng}
                accessibilityLabel="Buscar ingrediente del catálogo"
              />
            </View>
            <ScrollView style={styles.ingList} nestedScrollEnabled>
              <TouchableOpacity
                style={[styles.ingOption, !selectedIngId && { backgroundColor: colors.primarySurface }]}
                onPress={() => { setSelectedIngId(null); setSearchIng(''); }}
              >
                <Text style={[styles.ingOptionText, { color: !selectedIngId ? colors.primary : colors.textSecondary }]}>
                  Sin vincular (producto personalizado)
                </Text>
              </TouchableOpacity>
              {filteredIngredients.map(ing => (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.ingOption, selectedIngId === ing.id && { backgroundColor: colors.primarySurface }]}
                  onPress={() => { setSelectedIngId(ing.id); setSearchIng(ing.name); setValue('unit', ing.defaultUnit); }}
                >
                  <Text style={[styles.ingOptionText, { color: selectedIngId === ing.id ? colors.primary : colors.text }]}>
                    {ing.name}
                  </Text>
                  <Text style={[styles.ingCat, { color: colors.textTertiary }]}>{ing.category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Nombre personalizado */}
          <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Detalles</Text>

            <FieldLabel label="Nombre personalizado" hint="Opcional si ya seleccionaste un ingrediente">
              <Controller control={control} name="customName" render={({ field }) => (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                  placeholder="Ej: Arroz integral marca X"
                  placeholderTextColor={colors.textPlaceholder}
                  onChangeText={field.onChange}
                  value={field.value ?? ''}
                  accessibilityLabel="Nombre personalizado del producto"
                />
              )} />
            </FieldLabel>

            <View style={styles.row2}>
              <FieldLabel label="Cantidad *" error={errors.quantity?.message} style={{ flex: 1 }}>
                <Controller control={control} name="quantity" render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: errors.quantity ? colors.error : colors.border, color: colors.text }]}
                    keyboardType="numeric"
                    onChangeText={v => field.onChange(parseFloat(v) || 0)}
                    value={String(field.value)}
                    accessibilityLabel="Cantidad del producto"
                  />
                )} />
              </FieldLabel>

              <FieldLabel label="Unidad *" style={{ flex: 1 }}>
                <Controller control={control} name="unit" render={({ field }) => (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {UNITS.map(u => (
                      <TouchableOpacity
                        key={u.value}
                        style={[styles.unitPill, field.value === u.value && { backgroundColor: colors.primary }]}
                        onPress={() => field.onChange(u.value)}
                      >
                        <Text style={[styles.unitText, { color: field.value === u.value ? '#FFF' : colors.textSecondary }]}>
                          {u.value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )} />
              </FieldLabel>
            </View>

            <FieldLabel label="Ubicación *">
              <Controller control={control} name="location" render={({ field }) => (
                <View style={styles.pillRow}>
                  {STORAGE_LOCATIONS.map(loc => (
                    <TouchableOpacity
                      key={loc.value}
                      style={[styles.pill, field.value === loc.value && { backgroundColor: colors.secondary }]}
                      onPress={() => field.onChange(loc.value)}
                    >
                      <Text style={styles.pillEmoji}>{loc.emoji}</Text>
                      <Text style={[styles.pillText, { color: field.value === loc.value ? '#FFF' : colors.textSecondary }]}>
                        {loc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
            </FieldLabel>
          </View>

          {/* Fechas */}
          <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fechas</Text>
            <View style={styles.row2}>
              <FieldLabel label="Fecha compra" hint="AAAA-MM-DD" style={{ flex: 1 }}>
                <Controller control={control} name="purchaseDate" render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                    placeholder="2025-01-15"
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                    accessibilityLabel="Fecha de compra"
                  />
                )} />
              </FieldLabel>
              <FieldLabel label="Caducidad" hint="AAAA-MM-DD" style={{ flex: 1 }}>
                <Controller control={control} name="expiryDate" render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                    placeholder="2025-12-31"
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                    accessibilityLabel="Fecha de caducidad"
                  />
                )} />
              </FieldLabel>
            </View>
          </View>

          {/* Opcionales */}
          <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Información adicional</Text>
            <View style={styles.row2}>
              <FieldLabel label="Marca" style={{ flex: 1 }}>
                <Controller control={control} name="brand" render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                    placeholder="Marca"
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                    accessibilityLabel="Marca del producto"
                  />
                )} />
              </FieldLabel>
              <FieldLabel label="Precio (€)" style={{ flex: 1 }}>
                <Controller control={control} name="price" render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={v => field.onChange(parseFloat(v) || null)}
                    value={field.value ? String(field.value) : ''}
                    accessibilityLabel="Precio del producto"
                  />
                )} />
              </FieldLabel>
            </View>

            <FieldLabel label="Stock mínimo deseado">
              <Controller control={control} name="minQuantity" render={({ field }) => (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0 (sin mínimo)"
                  placeholderTextColor={colors.textPlaceholder}
                  onChangeText={v => field.onChange(parseFloat(v) || null)}
                  value={field.value ? String(field.value) : ''}
                  accessibilityLabel="Cantidad mínima deseada en almacén"
                />
              )} />
            </FieldLabel>

            <FieldLabel label="Notas">
              <Controller control={control} name="notes" render={({ field }) => (
                <TextInput
                  style={[styles.input, styles.textarea, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                  placeholder="Notas sobre este producto..."
                  placeholderTextColor={colors.textPlaceholder}
                  onChangeText={field.onChange}
                  value={field.value ?? ''}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Notas sobre el producto"
                />
              )} />
            </FieldLabel>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

function FieldLabel({ label, children, error, hint, style }: { label: string; children: React.ReactNode; error?: string; hint?: string; style?: any }) {
  const colors = useThemeColors();
  return (
    <View style={[{ gap: 5 }, style]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {hint && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
      {children}
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  scroll: { padding: 16, gap: 14 },
  section: { borderRadius: 16, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  ingList: { maxHeight: 200 },
  ingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  ingOptionText: { fontSize: 14, fontWeight: '500' },
  ingCat: { fontSize: 11 },
  row2: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 11 },
  error: { fontSize: 12 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1.5,
  },
  textarea: { height: 'auto', minHeight: 80, paddingTop: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#00000010',
  },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 13, fontWeight: '600' },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#00000010',
    marginRight: 6,
  },
  unitText: { fontSize: 12, fontWeight: '600' },
});
