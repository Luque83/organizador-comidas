import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/components/ui/useThemeColors';
import PantryScreen from './pantry/index';
import ShoppingScreen from './shopping/index';

export default function InventoryScreen() {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping'>('pantry');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Segmented Control Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <View style={[styles.segmentContainer, { backgroundColor: colors.backgroundInput }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'pantry' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('pantry')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'pantry' ? '#FFF' : colors.textSecondary }]}>
              Almacén
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'shopping' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('shopping')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'shopping' ? '#FFF' : colors.textSecondary }]}>
              Lista de Compra
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Render Active Tab */}
      <View style={styles.content}>
        {activeTab === 'pantry' ? <PantryScreen isEmbedded /> : <ShoppingScreen isEmbedded />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
});
