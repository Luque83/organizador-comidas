import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { usePantryStore } from '@/store/usePantryStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { PantryItemCard } from '@/components/PantryItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StorageLocation, STORAGE_LOCATIONS } from '@/types';

type ActiveTab = StorageLocation | 'todos';

export default function PantryScreen({ isEmbedded }: { isEmbedded?: boolean }) {
  const colors = useThemeColors();
  const pantryItems = usePantryStore(s => s.items);
  const isLoading = usePantryStore(s => s.isLoading);
  const ingredients = useIngredientsStore(s => s.ingredients);
  const settings = useIngredientsStore(s => s.ingredients);

  const [activeTab, setActiveTab] = useState<ActiveTab>('todos');
  const [search, setSearch] = useState('');
  const [showExpiring, setShowExpiring] = useState(false);

  const getIngredientName = (id: string | null | undefined) =>
    id ? (ingredients.find(i => i.id === id)?.name ?? null) : null;

  const filteredItems = useMemo(() => {
    let result = pantryItems;
    if (activeTab !== 'todos') result = result.filter(i => i.location === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(i => {
        const name = getIngredientName(i.ingredientId) ?? i.customName ?? '';
        return name.toLowerCase().includes(q);
      });
    }
    if (showExpiring) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 3);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= cutoffStr);
    }
    return result;
  }, [pantryItems, activeTab, search, showExpiring, ingredients]);

  const sections = useMemo(() => {
    if (activeTab !== 'todos') {
      return [{ title: STORAGE_LOCATIONS.find(l => l.value === activeTab)?.label ?? '', data: filteredItems }];
    }
    return STORAGE_LOCATIONS.map(loc => ({
      title: `${loc.emoji} ${loc.label}`,
      data: filteredItems.filter(i => i.location === loc.value),
    })).filter(s => s.data.length > 0);
  }, [filteredItems, activeTab]);

  if (isLoading) return <LoadingSpinner message="Cargando almacén..." />;

  const Wrapper = isEmbedded ? View : SafeAreaView;
  const wrapperProps = isEmbedded ? { style: [styles.safe, { backgroundColor: colors.background }] } : { style: [styles.safe, { backgroundColor: colors.background }], edges: ['top'] as any };

  return (
    <Wrapper {...wrapperProps}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }, isEmbedded && { paddingTop: 0, paddingBottom: 8, borderBottomWidth: 0 }]}>
        {!isEmbedded ? <Text style={[styles.title, { color: colors.text }]}>Almacén</Text> : <View style={{flex: 1}} />}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/pantry/new')}
          accessibilityRole="button"
          accessibilityLabel="Añadir producto"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchBar, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.backgroundInput, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchText, { color: colors.text }]}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Buscar productos en el almacén"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.expiryBtn, showExpiring && { backgroundColor: colors.warning }]}
          onPress={() => setShowExpiring(!showExpiring)}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por próxima caducidad"
        >
          <Ionicons name="alarm" size={18} color={showExpiring ? '#FFFFFF' : colors.warning} />
        </TouchableOpacity>
      </View>

      {/* Tabs de ubicación */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}
        contentContainerStyle={styles.tabs}
      >
        {[{ value: 'todos' as const, label: 'Todos', emoji: '📦' }, ...STORAGE_LOCATIONS].map(loc => (
          <TouchableOpacity
            key={loc.value}
            style={[styles.tab, activeTab === loc.value && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(loc.value)}
          >
            <Text style={styles.tabEmoji}>{loc.emoji}</Text>
            <Text style={[styles.tabText, { color: activeTab === loc.value ? '#FFFFFF' : colors.textSecondary }]}>
              {loc.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={search ? 'Sin resultados' : 'Almacén vacío'}
          description={search ? `No hay productos que coincidan con "${search}"` : 'Añade los productos que tienes en casa'}
        >
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/pantry/new')}
          >
            <Text style={styles.emptyBtnText}>Añadir producto</Text>
          </TouchableOpacity>
        </EmptyState>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            activeTab === 'todos' ? (
              <Text style={[styles.sectionHeader, { color: colors.text, backgroundColor: colors.background }]}>
                {title}
              </Text>
            ) : null
          )}
          renderItem={({ item }) => (
            <PantryItemCard
              item={item}
              ingredientName={getIngredientName(item.ingredientId) ?? item.customName ?? undefined}
              onPress={() => (router.push as any)({ pathname: '/(tabs)/pantry/[id]', params: { id: item.id } })}
            />
          )}
          stickySectionHeadersEnabled
        />
      )}
    </Wrapper>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchText: { flex: 1, fontSize: 15 },
  expiryBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000010',
  },
  tabsContainer: { maxHeight: 56, borderBottomWidth: 1 },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#00000010',
  },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
