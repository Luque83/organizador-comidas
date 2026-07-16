import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useMealPlanStore } from '@/store/useMealPlanStore';
import { useRecipesStore } from '@/store/useRecipesStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MEAL_TYPES, MealType } from '@/types';

const DAYS_IN_WEEK = 7;
const MEAL_ORDER: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'otro'];
const CELL_WIDTH = 150;
const HEADER_WIDTH = 100;

export default function WeekScreen() {
  const colors = useThemeColors();
  const currentWeekStart = useMealPlanStore(s => s.currentWeekStart);
  const plannedMeals = useMealPlanStore(s => s.plannedMeals);
  const recipes = useRecipesStore(s => s.recipes);
  const goNext = useMealPlanStore(s => s.goToNextWeek);
  const goPrev = useMealPlanStore(s => s.goToPrevWeek);
  const goCurrent = useMealPlanStore(s => s.goToCurrentWeek);
  const deleteMeal = useMealPlanStore(s => s.deleteMeal);
  const markPrepared = useMealPlanStore(s => s.markPrepared);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStartDate = parseISO(currentWeekStart);

  const days = Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return format(date, 'yyyy-MM-dd');
  });

  const isCurrentWeek = currentWeekStart === format(
    addDays(parseISO(today), -(((new Date(today).getDay() + 6) % 7))),
    'yyyy-MM-dd'
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Encabezado de Navegación Semanal */}
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Semana anterior">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goCurrent} style={styles.weekLabel}>
          <Text style={[styles.weekTitle, { color: colors.text }]}>
            {format(weekStartDate, "d 'de' MMM", { locale: es })} — {format(addDays(weekStartDate, 6), "d 'de' MMM", { locale: es })}
          </Text>
          {!isCurrentWeek && (
            <Text style={[styles.weekSubtitle, { color: colors.primary }]}>Volver a esta semana</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Semana siguiente">
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Matriz / Cuadrícula de 7 Días */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
        <View style={styles.gridContainer}>
          
          {/* Fila Cabecera: Días */}
          <View style={[styles.gridHeaderRow, { borderBottomColor: colors.separator }]}>
            <View style={[styles.cornerCell, { backgroundColor: colors.background }]} />
            {days.map(date => {
              const isToday = date === today;
              const dayName = format(parseISO(date), 'EEEE', { locale: es });
              const dayNum = format(parseISO(date), 'd');
              return (
                <View key={date} style={[styles.dayHeaderCell, { backgroundColor: isToday ? colors.primarySurface : colors.background }]}>
                  <Text style={[styles.dayNumText, { color: isToday ? colors.primary : colors.text }]}>{dayNum}</Text>
                  <Text style={[styles.dayNameText, { color: isToday ? colors.primary : colors.textSecondary }]}>
                    {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Filas: Tipos de Comida */}
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
            {MEAL_ORDER.map(mealType => {
              const mealLabel = MEAL_TYPES.find(m => m.value === mealType);
              return (
                <View key={mealType} style={styles.mealRow}>
                  {/* Cabecera de la fila (Izquierda) */}
                  <View style={[styles.mealTypeCell, { backgroundColor: colors.backgroundCard, borderRightColor: colors.separator, borderBottomColor: colors.separator }]}>
                    <Text style={styles.mealTypeEmoji}>{mealLabel?.emoji}</Text>
                    <Text style={[styles.mealTypeName, { color: colors.textSecondary }]}>{mealLabel?.label}</Text>
                  </View>

                  {/* Celdas para cada día */}
                  {days.map(date => {
                    const mealsOfType = plannedMeals.filter(m => m.date === date && m.mealType === mealType);
                    return (
                      <View key={date} style={[styles.gridCell, { borderBottomColor: colors.separator, borderRightColor: colors.separator }]}>
                        {mealsOfType.length > 0 ? (
                          mealsOfType.map(meal => {
                            const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
                            return (
                              <TouchableOpacity
                                key={meal.id}
                                style={[
                                  styles.mealCard,
                                  { backgroundColor: meal.isPrepared ? colors.success + '15' : colors.backgroundSecondary },
                                  meal.isPrepared && { opacity: 0.6 }
                                ]}
                                onPress={() => { if (!meal.isPrepared) markPrepared(meal.id); }}
                                disabled={meal.isPrepared}
                              >
                                <Text style={[
                                  styles.mealCardName, 
                                  { color: meal.isPrepared ? colors.success : colors.text },
                                  meal.isPrepared && { textDecorationLine: 'line-through' }
                                ]} numberOfLines={2}>
                                  {recipe?.name ?? meal.customDescription ?? 'Comida'}
                                </Text>
                                <View style={styles.mealCardActions}>
                                  {meal.isPrepared ? (
                                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                  ) : (
                                    <Ionicons name="ellipse-outline" size={18} color={colors.textTertiary} />
                                  )}
                                  <TouchableOpacity 
                                    onPress={(e) => { e.stopPropagation(); setDeleteId(meal.id); }}
                                    style={{ padding: 4 }}
                                  >
                                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                                  </TouchableOpacity>
                                </View>
                              </TouchableOpacity>
                            )
                          })
                        ) : (
                          <TouchableOpacity 
                            style={[styles.addBtnEmpty, { borderColor: colors.border }]}
                            onPress={() => router.push({ pathname: '/modals/add-meal', params: { date, mealType } })}
                          >
                            <Ionicons name="add" size={24} color={colors.textTertiary} />
                          </TouchableOpacity>
                        )}
                        
                        {/* Botón rápido para añadir más de una comida en la misma celda */}
                        {mealsOfType.length > 0 && (
                          <TouchableOpacity 
                            style={styles.addMoreBtn}
                            onPress={() => router.push({ pathname: '/modals/add-meal', params: { date, mealType } })}
                          >
                            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                            <Text style={[styles.addMoreText, { color: colors.primary }]}>Añadir</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={!!deleteId}
        title="Eliminar comida"
        message="¿Estás seguro de que quieres eliminar esta comida del menú?"
        confirmText="Eliminar"
        destructive
        onConfirm={() => { if (deleteId) deleteMeal(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { flex: 1, alignItems: 'center' },
  weekTitle: { fontSize: 16, fontWeight: '700' },
  weekSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  
  gridContainer: {
    flexDirection: 'column',
    minWidth: HEADER_WIDTH + (CELL_WIDTH * 7),
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  cornerCell: {
    width: HEADER_WIDTH,
    borderRightWidth: 0,
  },
  dayHeaderCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '800',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  mealRow: {
    flexDirection: 'row',
  },
  mealTypeCell: {
    width: HEADER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 20,
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  mealTypeName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridCell: {
    width: CELL_WIDTH,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 8,
    minHeight: 120,
  },
  mealCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealCardName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtnEmpty: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
