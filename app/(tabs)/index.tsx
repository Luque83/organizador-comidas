import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePantryStore } from '@/store/usePantryStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import { useMealPlanStore } from '@/store/useMealPlanStore';
import { useRecipesStore } from '@/store/useRecipesStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { RecipeCard } from '@/components/RecipeCard';
import { generateRecommendations } from '@/services/recommendationEngine';
import { MEAL_TYPES } from '@/types';

export default function HomeScreen() {
  const colors = useThemeColors();
  const settings = useSettingsStore(s => s.settings);
  const pantryItems = usePantryStore(s => s.items);
  const shoppingItems = useShoppingStore(s => s.items);
  const plannedMeals = useMealPlanStore(s => s.plannedMeals);
  const recipes = useRecipesStore(s => s.recipes);
  const conversions = useIngredientsStore(s => s.conversions);

  const [refreshing, setRefreshing] = React.useState(false);
  const loadPantry = usePantryStore(s => s.load);
  const loadShopping = useShoppingStore(s => s.loadActiveList);

  const today = format(new Date(), 'yyyy-MM-dd');
  const expiryDays = settings?.expiryAlertDays ?? 3;

  // Comidas de hoy
  const todayMeals = plannedMeals.filter(m => m.date === today);

  // Productos próximos a caducar
  const expiringItems = usePantryStore(s => s.getExpiringSoon)(expiryDays);

  // Pendientes de compra
  const pendingShoppingItems = shoppingItems.filter(i => !i.isBought);

  // Productos con stock bajo
  const lowStockItems = usePantryStore(s => s.getLowStock)();

  // Recomendaciones rápidas
  const recommendations = useMemo(() => {
    if (!settings) return null;
    const expiringIds = new Set(
      expiringItems
        .map(i => i.ingredientId)
        .filter(Boolean) as string[]
    );
    return generateRecommendations({
      recipes,
      pantryItems,
      conversions,
      recipeHistory: [],
      settings,
      expiringItemIds: expiringIds,
    });
  }, [recipes, pantryItems, settings, expiringItems]);

  const topRecommendations = [
    ...(recommendations?.puedes_ahora ?? []),
    ...(recommendations?.falta_uno ?? []),
  ].slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPantry(), loadShopping()]);
    setRefreshing(false);
  };

  // Siguiente comida (primera no preparada de hoy)
  const nextMeal = todayMeals.find(m => !m.isPrepared);

  // Progreso semanal
  const totalWeekMeals = plannedMeals.length;
  const preparedWeekMeals = plannedMeals.filter(m => m.isPrepared).length;
  const progressPercent = totalWeekMeals > 0 ? Math.round((preparedWeekMeals / totalWeekMeals) * 100) : 0;

  // Zero Waste (aprovecha caducidad)
  const zeroWasteRecommendations = recommendations?.aprovecha_caducidad ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colors.background === '#FFF8F0' ? 'dark-content' : 'light-content'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </Text>
            <Text style={[styles.appTitle, { color: colors.text }]}>Inicio</Text>
          </View>
          <TouchableOpacity 
            style={[styles.logoCircle, { backgroundColor: colors.backgroundInput }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progreso Semanal */}
        <View style={[styles.progressCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progreso Semanal</Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              {preparedWeekMeals} de {totalWeekMeals} comidas consumidas
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Próxima comida */}
        {nextMeal && (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader title="Tu próxima comida" icon="time" onPress={() => router.push('/(tabs)/plan')} />
            <View style={[styles.nextMealCard, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '30' }]}>
              <View style={styles.nextMealHeader}>
                <Text style={styles.nextMealType}>{MEAL_TYPES.find(m => m.value === nextMeal.mealType)?.label}</Text>
                <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.nextMealName, { color: colors.primaryDark }]}>
                {nextMeal.recipeId ? recipes.find(r => r.id === nextMeal.recipeId)?.name : (nextMeal.customDescription ?? 'Comida personalizada')}
              </Text>
            </View>
          </View>
        )}

        {/* Tarjetas de resumen */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="calendar"
            label="Comidas hoy"
            value={String(todayMeals.length)}
            color={colors.primary}
            bg={colors.primarySurface}
            onPress={() => router.push('/(tabs)/plan')}
          />
          <SummaryCard
            icon="alert-circle"
            label="Caducan pronto"
            value={String(expiringItems.length)}
            color={expiringItems.length > 0 ? colors.warning : colors.secondary}
            bg={expiringItems.length > 0 ? colors.warningSurface : colors.secondarySurface}
            onPress={() => router.push('/(tabs)/pantry')}
          />
          <SummaryCard
            icon="cart"
            label="En la lista"
            value={String(pendingShoppingItems.length)}
            color={colors.info}
            bg={colors.infoSurface}
            onPress={() => router.push('/(tabs)/shopping')}
          />
          <SummaryCard
            icon="warning"
            label="Stock bajo"
            value={String(lowStockItems.length)}
            color={lowStockItems.length > 0 ? colors.error : colors.secondary}
            bg={lowStockItems.length > 0 ? colors.errorSurface : colors.secondarySurface}
            onPress={() => router.push('/(tabs)/pantry')}
          />
        </View>

        {/* Comidas de hoy */}
        <SectionHeader title="Comidas de hoy" icon="today" onPress={() => router.push('/(tabs)/plan')} />
        {todayMeals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.backgroundCard }]}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin comidas planificadas</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Planifica tu menú de hoy
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/plan')}
            >
              <Text style={styles.emptyBtnText}>Planificar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.mealsContainer, { backgroundColor: colors.backgroundCard }]}>
            {todayMeals.map(meal => {
              const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
              const mealLabel = MEAL_TYPES.find(m => m.value === meal.mealType);
              return (
                <View key={meal.id} style={[styles.mealRow, { borderBottomColor: colors.separator }]}>
                  <Text style={styles.mealEmoji}>{mealLabel?.emoji ?? '🍴'}</Text>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealType, { color: colors.textSecondary }]}>
                      {mealLabel?.label ?? meal.mealType}
                    </Text>
                    <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                      {recipe?.name ?? meal.customDescription ?? 'Comida personalizada'}
                    </Text>
                  </View>
                  {meal.isPrepared && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Botones de acción rápida */}
        <SectionHeader title="Acciones rápidas" icon="flash" />
        <View style={styles.quickActions}>
          <QuickActionBtn
            icon="add-circle"
            label="Añadir comida"
            color={colors.primary}
            onPress={() => router.push('/(tabs)/plan')}
          />
          <QuickActionBtn
            icon="cube"
            label="Añadir producto"
            color={colors.secondary}
            onPress={() => router.push({ pathname: '/(tabs)/pantry', params: { openNew: '1' } })}
          />
          <QuickActionBtn
            icon="cart"
            label="Inventario"
            color={colors.info}
            onPress={() => router.push('/(tabs)/inventory')}
          />
        </View>

        {/* Recomendaciones */}
        {topRecommendations.length > 0 && (
          <>
            <SectionHeader title="Puedes preparar ahora" icon="sparkles" onPress={() => router.push('/(tabs)/recipes')} />
            {topRecommendations.map(rec => (
              <RecipeCard
                key={rec.recipe.id}
                recipe={rec.recipe}
                compatibilityPercent={rec.compatibilityPercent}
                missingCount={rec.missingCount}
                onPress={() => router.push({ pathname: '/(tabs)/recipes/[id]', params: { id: rec.recipe.id } })}
                onFavoritePress={() => useRecipesStore.getState().toggleFavorite(rec.recipe.id)}
              />
            ))}
          </>
        )}

        {/* Asistente Zero Waste */}
        {zeroWasteRecommendations.length > 0 && (
          <>
            <SectionHeader title="Asistente Zero Waste" icon="leaf" onPress={() => router.push('/(tabs)/recipes')} />
            <Text style={[styles.zeroWasteSubtitle, { color: colors.textSecondary }]}>
              Recetas sugeridas para usar ingredientes a punto de caducar:
            </Text>
            {zeroWasteRecommendations.slice(0, 2).map(rec => (
              <RecipeCard
                key={rec.recipe.id}
                recipe={rec.recipe}
                compatibilityPercent={rec.compatibilityPercent}
                missingCount={rec.missingCount}
                onPress={() => router.push({ pathname: '/(tabs)/recipes/[id]', params: { id: rec.recipe.id } })}
                onFavoritePress={() => useRecipesStore.getState().toggleFavorite(rec.recipe.id)}
              />
            ))}
          </>
        )}

        {/* Alertas de caducidad */}
        {expiringItems.length > 0 && (
          <>
            <SectionHeader title="Próximos a caducar" icon="alarm" onPress={() => router.push('/(tabs)/pantry')} />
            <View style={[styles.alertCard, { backgroundColor: colors.warningSurface, borderColor: colors.warning + '44' }]}>
              {expiringItems.slice(0, 3).map(item => (
                <View key={item.id} style={[styles.alertRow, { borderBottomColor: colors.warning + '22' }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.warning} />
                  <Text style={[styles.alertText, { color: colors.text }]}>
                    {item.customName ?? 'Producto'} — {item.quantity} {item.unit}
                  </Text>
                  <Text style={[styles.alertDate, { color: colors.warning }]}>
                    {item.expiryDate}
                  </Text>
                </View>
              ))}
              {expiringItems.length > 3 && (
                <Text style={[styles.moreText, { color: colors.warning }]}>
                  +{expiringItems.length - 3} más
                </Text>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Componentes locales ──────────────────────────────────────
function SummaryCard({ icon, label, value, color, bg, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; color: string; bg: string; onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.summaryCard, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadowColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.summaryIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon, onPress }: {
  title: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress} style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todo</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickActionBtn({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: color + '15', borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  appTitle: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 26 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryValue: { fontSize: 28, fontWeight: '800' },
  summaryLabel: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  mealsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  mealEmoji: { fontSize: 22 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  quickBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  alertCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  alertDate: { fontSize: 11, fontWeight: '600' },
  moreText: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  bottomPadding: { height: 32 },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressSubtitle: { fontSize: 13, fontWeight: '500' },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextMealCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  nextMealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextMealType: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMealName: {
    fontSize: 20,
    fontWeight: '800',
  },
  zeroWasteSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },
});
