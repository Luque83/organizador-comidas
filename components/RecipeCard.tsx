import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from './ui/useThemeColors';
import { RecipeWithIngredients, RecipeCategory, Difficulty } from '@/types';
import { RECIPE_CATEGORIES } from '@/types';

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  compatibilityPercent?: number;
  missingCount?: number;
  onPress?: () => void;
  onFavoritePress?: () => void;
  compact?: boolean;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  facil: '#4CAF7A',
  media: '#E8A84A',
  dificil: '#E05A5A',
};

export function RecipeCard({ recipe, compatibilityPercent, missingCount, onPress, onFavoritePress, compact = false }: RecipeCardProps) {
  const colors = useThemeColors();
  const totalTime = recipe.prepTime + recipe.cookTime;
  const categoryEmoji = RECIPE_CATEGORIES.find(c => c.value === recipe.category)?.emoji ?? '🍽️';

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Receta: ${recipe.name}`}
      >
        <Text style={styles.compactEmoji}>{categoryEmoji}</Text>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>{recipe.name}</Text>
          <Text style={[styles.compactTime, { color: colors.textSecondary }]}>⏱ {totalTime} min</Text>
        </View>
        {recipe.isFavorite && (
          <Ionicons name="heart" size={16} color={colors.error} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadowColor }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Receta ${recipe.name}. ${totalTime} minutos. ${recipe.servings} raciones.`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.emojiContainer, { backgroundColor: colors.primarySurface }]}>
          <Text style={styles.emoji}>{categoryEmoji}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{recipe.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[recipe.difficulty] + '22' }]}>
              <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[recipe.difficulty] }]}>
                {DIFFICULTY_LABEL[recipe.difficulty]}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onFavoritePress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={recipe.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Ionicons
            name={recipe.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={recipe.isFavorite ? colors.error : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.stats, { borderTopColor: colors.separator }]}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{totalTime} min</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{recipe.servings} rac.</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="list-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{recipe.ingredients.length} ing.</Text>
        </View>
        {compatibilityPercent !== undefined && (
          <View style={[styles.compatBadge, {
            backgroundColor: compatibilityPercent === 100 ? colors.successSurface :
              compatibilityPercent >= 70 ? colors.warningSurface : colors.errorSurface
          }]}>
            <Text style={[styles.compatText, {
              color: compatibilityPercent === 100 ? colors.success :
                compatibilityPercent >= 70 ? colors.warning : colors.error
            }]}>
              {compatibilityPercent}%
            </Text>
          </View>
        )}
      </View>

      {/* Missing ingredients warning */}
      {missingCount !== undefined && missingCount > 0 && (
        <View style={[styles.missingBanner, { backgroundColor: colors.warningSurface }]}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
          <Text style={[styles.missingText, { color: colors.warning }]}>
            Faltan {missingCount} ingrediente{missingCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 24 },
  headerInfo: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  badges: { flexDirection: 'row', gap: 6 },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: { fontSize: 11, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '500' },
  compatBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  compatText: { fontSize: 12, fontWeight: '700' },
  missingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  missingText: { fontSize: 12, fontWeight: '600' },
  // Compact
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  compactEmoji: { fontSize: 22 },
  compactInfo: { flex: 1 },
  compactName: { fontSize: 14, fontWeight: '600' },
  compactTime: { fontSize: 12, marginTop: 2 },
});
