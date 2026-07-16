import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useRecipesStore } from '@/store/useRecipesStore';
import { usePantryStore } from '@/store/usePantryStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { RecipeCard } from '@/components/RecipeCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { generateRecommendations } from '@/services/recommendationEngine';
import { RECIPE_CATEGORIES, RecipeCategory, Difficulty } from '@/types';

type FilterTab = 'todas' | 'favoritas' | RecipeCategory;

export default function RecipesScreen() {
  const colors = useThemeColors();
  const recipes = useRecipesStore(s => s.recipes);
  const toggleFavorite = useRecipesStore(s => s.toggleFavorite);
  const pantryItems = usePantryStore(s => s.items);
  const conversions = useIngredientsStore(s => s.conversions);
  const settings = useSettingsStore(s => s.settings);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'todas'>('todas');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const recommendations = useMemo(() => {
    if (!settings) return null;
    return generateRecommendations({
      recipes,
      pantryItems,
      conversions,
      recipeHistory: [],
      settings,
      expiringItemIds: new Set(),
    });
  }, [recipes, pantryItems, settings]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    if (activeTab === 'favoritas') {
      result = result.filter(r => r.isFavorite);
    } else if (activeTab !== 'todas') {
      result = result.filter(r => r.category === activeTab);
    }
    if (diffFilter !== 'todas') {
      result = result.filter(r => r.difficulty === diffFilter);
    }
    if (showOnlyAvailable) {
      const availableIds = new Set(recommendations?.puedes_ahora.map(r => r.recipe.id) ?? []);
      result = result.filter(r => availableIds.has(r.id));
    }
    return result;
  }, [recipes, search, activeTab, diffFilter, showOnlyAvailable, recommendations]);

  const getCompatibility = (recipeId: string) => {
    const all = [
      ...(recommendations?.puedes_ahora ?? []),
      ...(recommendations?.falta_uno ?? []),
      ...(recommendations?.aprovecha_caducidad ?? []),
      ...(recommendations?.ideas_semana ?? []),
    ];
    return all.find(r => r.recipe.id === recipeId);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.text }]}>Recetas</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/recipes/new')}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva receta"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundInput, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar recetas..."
            placeholderTextColor={colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            accessibilityLabel="Buscar recetas"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros rápidos */}
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterChip, showOnlyAvailable && { backgroundColor: colors.primary }]}
            onPress={() => setShowOnlyAvailable(!showOnlyAvailable)}
          >
            <Ionicons name="flash" size={13} color={showOnlyAvailable ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: showOnlyAvailable ? '#FFFFFF' : colors.textSecondary }]}>
              Disponibles
            </Text>
          </TouchableOpacity>
          {(['todas', 'facil', 'media', 'dificil'] as const).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.filterChip, diffFilter === d && { backgroundColor: colors.secondary }]}
              onPress={() => setDiffFilter(d)}
            >
              <Text style={[styles.filterChipText, { color: diffFilter === d ? '#FFFFFF' : colors.textSecondary }]}>
                {d === 'todas' ? 'Todas' : d === 'facil' ? 'Fácil' : d === 'media' ? 'Media' : 'Difícil'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tabs de categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.backgroundCard }]}
        contentContainerStyle={styles.tabs}
      >
        {[{ value: 'todas' as const, label: 'Todas', emoji: '📋' }, { value: 'favoritas' as const, label: 'Favoritas', emoji: '❤️' }, ...RECIPE_CATEGORIES].map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.tab, activeTab === cat.value && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(cat.value as FilterTab)}
          >
            <Text style={styles.tabEmoji}>{cat.emoji}</Text>
            <Text style={[styles.tabText, { color: activeTab === cat.value ? '#FFFFFF' : colors.textSecondary }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de recetas */}
      {filteredRecipes.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title={search ? 'Sin resultados' : 'Sin recetas'}
          description={search ? `No hay recetas que coincidan con "${search}"` : 'Crea tu primera receta para empezar'}
        >
          {!search && (
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/recipes/new')}
            >
              <Text style={styles.createBtnText}>Crear receta</Text>
            </TouchableOpacity>
          )}
        </EmptyState>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const compat = getCompatibility(item.id);
            return (
              <RecipeCard
                recipe={item}
                compatibilityPercent={compat?.compatibilityPercent}
                missingCount={compat?.missingCount}
                onPress={() => router.push({ pathname: '/(tabs)/recipes/[id]', params: { id: item.id } })}
                onFavoritePress={() => toggleFavorite(item.id)}
              />
            );
          }}
        />
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, height: 24 },
  quickFilters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#00000010',
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  tabsContainer: { maxHeight: 56, borderBottomWidth: 1 },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#00000010',
  },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
