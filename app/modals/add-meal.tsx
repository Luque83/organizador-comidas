import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useMealPlanStore } from '@/store/useMealPlanStore';
import { useRecipesStore } from '@/store/useRecipesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Toast } from '@/components/ui/Toast';
import { MEAL_TYPES, MealType } from '@/types';
import { RecipeCard } from '@/components/RecipeCard';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AddMealModal() {
  const { date: paramDate, mealType: paramMealType, recipeId: paramRecipeId } = useLocalSearchParams<{
    date?: string; mealType?: string; recipeId?: string;
  }>();
  const colors = useThemeColors();
  const recipes = useRecipesStore(s => s.recipes);
  const addMeal = useMealPlanStore(s => s.addMeal);
  const settings = useSettingsStore(s => s.settings);
  const currentWeekStart = useMealPlanStore(s => s.currentWeekStart);

  const [selectedDate, setSelectedDate] = useState(paramDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [selectedMealType, setSelectedMealType] = useState<MealType>((paramMealType as MealType) ?? 'almuerzo');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(paramRecipeId ?? null);
  const [customDescription, setCustomDescription] = useState('');
  const [servings, setServings] = useState(settings?.defaultServings ?? 2);
  const [searchRecipe, setSearchRecipe] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(parseISO(currentWeekStart), i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d', { locale: es }) };
  });

  const filteredRecipes = searchRecipe.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(searchRecipe.toLowerCase()))
    : recipes;

  const handleSave = async () => {
    if (!selectedRecipeId && !customDescription.trim()) {
      setToast({ visible: true, message: 'Selecciona una receta o escribe una descripción' });
      return;
    }
    setSaving(true);
    try {
      await addMeal({
        mealPlanId: '',
        date: selectedDate,
        mealType: selectedMealType,
        customMealTypeName: null,
        recipeId: selectedRecipeId,
        customDescription: customDescription.trim() || null,
        servings,
        isPrepared: false,
        hasLeftovers: false,
        leftoverServings: null,
        notes: null,
      });
      router.back();
    } catch (e) {
      setToast({ visible: true, message: 'Error al añadir la comida' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cancelar">
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Añadir comida</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.textTertiary : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar comida en el menú"
        >
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Añadir'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Día */}
        <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Día</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {weekDays.map(day => (
              <TouchableOpacity
                key={day.date}
                style={[styles.dayPill, selectedDate === day.date && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text style={[styles.dayPillText, { color: selectedDate === day.date ? '#FFF' : colors.textSecondary }]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tipo de comida */}
        <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipo de comida</Text>
          <View style={styles.pillRow}>
            {MEAL_TYPES.map(mt => (
              <TouchableOpacity
                key={mt.value}
                style={[styles.pill, selectedMealType === mt.value && { backgroundColor: colors.secondary }]}
                onPress={() => setSelectedMealType(mt.value)}
              >
                <Text style={styles.pillEmoji}>{mt.emoji}</Text>
                <Text style={[styles.pillText, { color: selectedMealType === mt.value ? '#FFF' : colors.textSecondary }]}>
                  {mt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Raciones */}
        <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Raciones</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: colors.border }]}
              onPress={() => setServings(Math.max(1, servings - 1))}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: colors.primary }]}>{servings}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: colors.border }]}
              onPress={() => setServings(servings + 1)}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Descripción personalizada */}
        <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>O escribe una descripción</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundInput, borderColor: colors.border, color: colors.text }]}
            placeholder="Ej: Tortilla de patatas casera"
            placeholderTextColor={colors.textPlaceholder}
            value={customDescription}
            onChangeText={setCustomDescription}
            accessibilityLabel="Descripción personalizada de la comida"
          />
        </View>

        {/* Seleccionar receta */}
        <View style={[styles.section, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Seleccionar receta</Text>
          <View style={[styles.searchBar, { backgroundColor: colors.backgroundInput, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar receta..."
              placeholderTextColor={colors.textPlaceholder}
              value={searchRecipe}
              onChangeText={setSearchRecipe}
              accessibilityLabel="Buscar receta"
            />
          </View>

          {selectedRecipeId && (
            <View style={[styles.selectedRecipe, { backgroundColor: colors.secondarySurface }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
              <Text style={[styles.selectedRecipeName, { color: colors.secondary }]}>
                {recipes.find(r => r.id === selectedRecipeId)?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRecipeId(null)}>
                <Ionicons name="close" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filteredRecipes.slice(0, 10).map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              compact
              onPress={() => setSelectedRecipeId(recipe.id)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type="warning" onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
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
  section: { borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  dayScroll: {},
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#00000010',
    marginRight: 8,
  },
  dayPillText: { fontSize: 13, fontWeight: '600' },
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
  pillEmoji: { fontSize: 15 },
  pillText: { fontSize: 13, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 26, fontWeight: '800', minWidth: 36, textAlign: 'center' },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1.5,
  },
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
  selectedRecipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  selectedRecipeName: { flex: 1, fontSize: 14, fontWeight: '600' },
});
