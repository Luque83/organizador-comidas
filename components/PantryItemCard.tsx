import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from './ui/useThemeColors';
import { PantryItem } from '@/types';
import { STORAGE_LOCATIONS } from '@/types';
import { formatQuantity } from '@/services/unitConversion';
import { useHouseholdStore } from '@/store/useHouseholdStore';

interface PantryItemCardProps {
  item: PantryItem;
  ingredientName?: string;
  onPress?: () => void;
  onQuickConsume?: () => void;
}

export function PantryItemCard({ item, ingredientName, onPress, onQuickConsume }: PantryItemCardProps) {
  const colors = useThemeColors();
  const membersProfiles = useHouseholdStore(s => s.membersProfiles);
  const modifierId = item.updatedBy || item.createdBy;
  const modifierName = modifierId ? (membersProfiles[modifierId]?.display_name || 'Alguien') : 'Alguien';
  
  const today = new Date().toISOString().split('T')[0];
  const locationEmoji = STORAGE_LOCATIONS.find(l => l.value === item.location)?.emoji ?? '📦';

  let expiryStatus: 'ok' | 'soon' | 'expired' = 'ok';
  let daysUntilExpiry: number | null = null;

  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate);
    const now = new Date();
    daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) expiryStatus = 'expired';
    else if (daysUntilExpiry <= 3) expiryStatus = 'soon';
  }

  const expiryColor = {
    ok: colors.textTertiary,
    soon: colors.warning,
    expired: colors.error,
  }[expiryStatus];

  const isLowStock = item.minQuantity != null && item.quantity < item.minQuantity;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadowColor }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${ingredientName ?? item.customName}. Cantidad: ${item.quantity} ${item.unit}.`}
    >
      <View style={styles.row}>
        <View style={[styles.locationBadge, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={styles.locationEmoji}>{locationEmoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {ingredientName ?? item.customName ?? 'Producto'}
          </Text>
          {item.brand && (
            <Text style={[styles.brand, { color: colors.textTertiary }]}>{item.brand}</Text>
          )}
          <View style={styles.tags}>
            {item.isOpen && (
              <View style={[styles.tag, { backgroundColor: colors.accentSurface }]}>
                <Text style={[styles.tagText, { color: colors.accent }]}>Abierto</Text>
              </View>
            )}
            {isLowStock && (
              <View style={[styles.tag, { backgroundColor: colors.warningSurface }]}>
                <Ionicons name="alert-circle-outline" size={11} color={colors.warning} />
                <Text style={[styles.tagText, { color: colors.warning }]}>Stock bajo</Text>
              </View>
            )}
          </View>
          {(item.updatedBy || item.createdBy) && (
            <Text style={[styles.modifierText, { color: colors.textTertiary, marginTop: 4, fontSize: 11 }]}>
              Modificado por {modifierName}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          <Text style={[styles.quantity, { color: colors.primary }]}>
            {formatQuantity(item.quantity, item.unit)}
          </Text>
          {item.expiryDate && (
            <Text style={[styles.expiry, { color: expiryColor }]}>
              {expiryStatus === 'expired' ? 'Caducado' :
               daysUntilExpiry === 0 ? 'Hoy' :
               daysUntilExpiry === 1 ? 'Mañana' :
               `${daysUntilExpiry}d`}
            </Text>
          )}
          {onQuickConsume && item.quantity > 0 && (
            <TouchableOpacity
              onPress={onQuickConsume}
              style={[styles.consumeBtn, { backgroundColor: colors.primarySurface }]}
              accessibilityRole="button"
              accessibilityLabel="Restar cantidad"
            >
              <Ionicons name="remove" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {item.minQuantity != null && (
        <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[
            styles.progressFill,
            {
              backgroundColor: isLowStock ? colors.warning : colors.secondary,
              width: `${Math.min(100, (item.quantity / item.minQuantity) * 100)}%` as any,
            }
          ]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationEmoji: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  brand: { fontSize: 12, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 4 },
  quantity: { fontSize: 16, fontWeight: '700' },
  expiry: { fontSize: 11, fontWeight: '600' },
  consumeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
