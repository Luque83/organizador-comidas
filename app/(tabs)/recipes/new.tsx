import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useRecipesStore } from '@/store/useRecipesStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { Toast } from '@/components/ui/Toast';
import { RecipeSchema, RecipeFormData } from '@/schemas';
import { RECIPE_CATEGORIES, MEAL_TYPES, UNITS } from '@/types';

export default function NewRecipeScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const colors = useThemeColors();
  const existingRecipe = useRecipesStore(s => editId ? s.getById(editId) : undefined);
  const addRecipe = useRecipesStore(s => s.addRecipe);
  const updateRecipe = useRecipesStore(s => s.updateRecipe);
  const ingredients = useIngredientsStore(s => s.ingredients);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<RecipeFormData>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      name: existingRecipe?.name ?? '',
      description: existingRecipe?.description ?? '',
      category: existingRecipe?.category ?? 'carne',
      mealType: existingRecipe?.mealType ?? 'almuerzo',
      prepTime: existingRecipe?.prepTime ?? 15,
      cookTime: existingRecipe?.cookTime ?? 30,
      difficulty: existingRecipe?.difficulty ?? 'facil',
      servings: existingRecipe?.servings ?? 2,
      notes: existingRecipe?.notes ?? '',
      ingredients: existingRecipe?.ingredients.map(i => ({
        ingredientId: i.ingredientId ?? undefined,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        optional: i.optional,
        notes: i.notes ?? undefined,
      })) ?? [{ name: '', quantity: 1, unit: 'g', optional: false }],
      steps: existingRecipe?.steps.map(s => ({
        instruction: s.instruction,
        durationMinutes: s.durationMinutes ?? undefined,
      })) ?? [{ instruction: '' }],
    },
  });

  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' });
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' });

  const onSubmit = async (data: RecipeFormData) => {
    setSaving(true);
    try {
      const recipeData = {
        name: data.name,
        description: data.description ?? null,
        imageUri: null,
        category: data.category,
        mealType: data.mealType,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        difficulty: data.difficulty,
        servings: data.servings,
        tags: '[]',
        nutritionNotes: null,
        notes: data.notes ?? null,
        isFavorite: false,
        dietTags: '[]',
        allergens: '[]',
      };

      const stepsWithNumber = data.steps.map((s, i) => ({ ...s, stepNumber: i + 1 }));

      if (editId && existingRecipe) {
        await updateRecipe(editId, recipeData, data.ingredients, stepsWithNumber);
        setToast({ visible: true, message: 'Receta actualizada correctamente', type: 'success' });
      } else {
        await addRecipe(recipeData, data.ingredients, stepsWithNumber);
        setToast({ visible: true, message: 'Receta creada correctamente', type: 'success' });
      }
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      setToast({ visible: true, message: 'Error al guardar la receta', type: 'error' });
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
          <Text style={[styles.title, { color: colors.text }]}>{editId ? 'Editar receta' : 'Nueva receta'}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? colors.textTertiary : colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Guardar receta"
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Información básica */}
          <Section title="Información básica">
            <FormField label="Nombre de la receta *" error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: errors.name ? colors.error : colors.border, color: colors.text }]}
                    placeholder="Ej: Lentejas con verduras"
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={field.onChange}
                    value={field.value}
                    accessibilityLabel="Nombre de la receta"
                  />
                )}
              />
            </FormField>

            <FormField label="Descripción" error={errors.description?.message}>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextInput
                    style={[styles.input, styles.textarea, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                    placeholder="Descripción breve de la receta..."
                    placeholderTextColor={colors.textPlaceholder}
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    accessibilityLabel="Descripción de la receta"
                  />
                )}
              />
            </FormField>

            <View style={styles.row2}>
              <FormField label="Categoría *" error={errors.category?.message} style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                      {RECIPE_CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat.value}
                          style={[styles.pill, field.value === cat.value && { backgroundColor: colors.primary }]}
                          onPress={() => field.onChange(cat.value)}
                        >
                          <Text style={styles.pillEmoji}>{cat.emoji}</Text>
                          <Text style={[styles.pillText, { color: field.value === cat.value ? '#FFF' : colors.textSecondary }]}>{cat.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                />
              </FormField>
            </View>

            <View style={styles.row2}>
              <FormField label="Tipo de comida *" style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="mealType"
                  render={({ field }) => (
                    <View style={styles.pillRow}>
                      {MEAL_TYPES.map(mt => (
                        <TouchableOpacity
                          key={mt.value}
                          style={[styles.pill, field.value === mt.value && { backgroundColor: colors.secondary }]}
                          onPress={() => field.onChange(mt.value)}
                        >
                          <Text style={styles.pillEmoji}>{mt.emoji}</Text>
                          <Text style={[styles.pillText, { color: field.value === mt.value ? '#FFF' : colors.textSecondary }]}>{mt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </FormField>
            </View>
          </Section>

          {/* Tiempos y dificultad */}
          <Section title="Tiempos y dificultad">
            <View style={styles.row3}>
              <FormField label="Prep (min) *" error={errors.prepTime?.message} style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="prepTime"
                  render={({ field }) => (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                      keyboardType="numeric"
                      onChangeText={v => field.onChange(Number(v))}
                      value={String(field.value)}
                      accessibilityLabel="Tiempo de preparación en minutos"
                    />
                  )}
                />
              </FormField>
              <FormField label="Cocción (min) *" error={errors.cookTime?.message} style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="cookTime"
                  render={({ field }) => (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                      keyboardType="numeric"
                      onChangeText={v => field.onChange(Number(v))}
                      value={String(field.value)}
                      accessibilityLabel="Tiempo de cocción en minutos"
                    />
                  )}
                />
              </FormField>
              <FormField label="Raciones *" error={errors.servings?.message} style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="servings"
                  render={({ field }) => (
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                      keyboardType="numeric"
                      onChangeText={v => field.onChange(Number(v))}
                      value={String(field.value)}
                      accessibilityLabel="Número de raciones"
                    />
                  )}
                />
              </FormField>
            </View>

            <FormField label="Dificultad *">
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <View style={styles.pillRow}>
                    {[{ value: 'facil', label: 'Fácil', color: '#4CAF7A' }, { value: 'media', label: 'Media', color: '#E8A84A' }, { value: 'dificil', label: 'Difícil', color: '#E05A5A' }].map(d => (
                      <TouchableOpacity
                        key={d.value}
                        style={[styles.pill, field.value === d.value && { backgroundColor: d.color }]}
                        onPress={() => field.onChange(d.value)}
                      >
                        <Text style={[styles.pillText, { color: field.value === d.value ? '#FFF' : colors.textSecondary }]}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </FormField>
          </Section>

          {/* Ingredientes */}
          <Section title="Ingredientes" error={errors.ingredients?.message}>
            {ingFields.map((field, index) => (
              <View key={field.id} style={[styles.ingRow, { backgroundColor: colors.backgroundSecondary }]}>
                <Controller
                  control={control}
                  name={`ingredients.${index}.name`}
                  render={({ field: f }) => (
                    <TextInput
                      style={[styles.ingName, { color: colors.text }]}
                      placeholder="Nombre del ingrediente"
                      placeholderTextColor={colors.textPlaceholder}
                      onChangeText={f.onChange}
                      value={f.value}
                      accessibilityLabel={`Ingrediente ${index + 1}`}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`ingredients.${index}.quantity`}
                  render={({ field: f }) => (
                    <TextInput
                      style={[styles.ingQty, { color: colors.text }]}
                      placeholder="Qty"
                      placeholderTextColor={colors.textPlaceholder}
                      keyboardType="numeric"
                      onChangeText={v => f.onChange(parseFloat(v) || 0)}
                      value={String(f.value)}
                      accessibilityLabel="Cantidad"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`ingredients.${index}.unit`}
                  render={({ field: f }) => (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 100 }}>
                      {UNITS.slice(0, 6).map(u => (
                        <TouchableOpacity
                          key={u.value}
                          style={[styles.unitPill, f.value === u.value && { backgroundColor: colors.primary }]}
                          onPress={() => f.onChange(u.value)}
                        >
                          <Text style={[styles.unitText, { color: f.value === u.value ? '#FFF' : colors.textSecondary }]}>{u.value}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                />
                <TouchableOpacity onPress={() => removeIng(index)} accessibilityRole="button" accessibilityLabel="Eliminar ingrediente">
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addRow, { borderColor: colors.primary }]}
              onPress={() => appendIng({ name: '', quantity: 1, unit: 'g', optional: false })}
              accessibilityRole="button"
              accessibilityLabel="Añadir ingrediente"
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addRowText, { color: colors.primary }]}>Añadir ingrediente</Text>
            </TouchableOpacity>
          </Section>

          {/* Pasos */}
          <Section title="Pasos de preparación" error={errors.steps?.message}>
            {stepFields.map((field, index) => (
              <View key={field.id} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{index + 1}</Text>
                </View>
                <Controller
                  control={control}
                  name={`steps.${index}.instruction`}
                  render={({ field: f }) => (
                    <TextInput
                      style={[styles.stepInput, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                      placeholder={`Paso ${index + 1}...`}
                      placeholderTextColor={colors.textPlaceholder}
                      onChangeText={f.onChange}
                      value={f.value}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      accessibilityLabel={`Paso ${index + 1}`}
                    />
                  )}
                />
                <TouchableOpacity onPress={() => removeStep(index)} accessibilityRole="button" accessibilityLabel="Eliminar paso">
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addRow, { borderColor: colors.secondary }]}
              onPress={() => appendStep({ instruction: '' })}
              accessibilityRole="button"
              accessibilityLabel="Añadir paso"
            >
              <Ionicons name="add" size={18} color={colors.secondary} />
              <Text style={[styles.addRowText, { color: colors.secondary }]}>Añadir paso</Text>
            </TouchableOpacity>
          </Section>

          {/* Notas */}
          <Section title="Notas adicionales">
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextInput
                  style={[styles.input, styles.textarea, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
                  placeholder="Trucos, variantes, consejos..."
                  placeholderTextColor={colors.textPlaceholder}
                  onChangeText={field.onChange}
                  value={field.value ?? ''}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="Notas de la receta"
                />
              )}
            />
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

function Section({ title, children, error }: { title: string; children: React.ReactNode; error?: string }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {error && <Text style={[styles.sectionError, { color: colors.error }]}>{error}</Text>}
      {children}
    </View>
  );
}

function FormField({ label, children, error, style }: { label: string; children: React.ReactNode; error?: string; style?: any }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.fieldError, { color: colors.error }]}>{error}</Text>}
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
  sectionError: { fontSize: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  fieldError: { fontSize: 12 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1.5,
  },
  textarea: { height: 'auto', minHeight: 80, paddingTop: 12, paddingBottom: 12 },
  row2: { flexDirection: 'row', gap: 12 },
  row3: { flexDirection: 'row', gap: 10 },
  pillScroll: { marginHorizontal: -4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#00000010',
  },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: '600' },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  ingName: { flex: 2, fontSize: 14, height: 36 },
  ingQty: { width: 55, fontSize: 14, textAlign: 'center', height: 36 },
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#00000010',
    marginRight: 4,
  },
  unitText: { fontSize: 12, fontWeight: '600' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
  },
  addRowText: { fontSize: 14, fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexShrink: 0,
  },
  stepNumText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  stepInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1.5,
    minHeight: 60,
  },
});
