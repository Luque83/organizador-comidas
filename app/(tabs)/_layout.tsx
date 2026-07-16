import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useShoppingStore } from '@/store/useShoppingStore';
import { usePantryStore } from '@/store/usePantryStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const shoppingItems = useShoppingStore(s => s.items);
  const settings = useSettingsStore(s => s.settings);
  const pantryItems = usePantryStore(s => s.items);

  const pendingItems = shoppingItems.filter(i => !i.isBought).length;
  const expiryDays = settings?.expiryAlertDays ?? 3;
  const today = new Date().toISOString().split('T')[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + expiryDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const expiringCount = pantryItems.filter(
    p => p.expiryDate && p.expiryDate >= today && p.expiryDate <= cutoffStr && p.quantity > 0
  ).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes/index"
        options={{
          title: 'Recetas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="layers-outline" size={size} color={color} />
              {(expiringCount > 0 || pendingItems > 0) && (
                <View style={[styles.badge, { backgroundColor: expiringCount > 0 ? colors.warning : colors.primary }]} />
              )}
            </View>
          ),
        }}
      />
      {/* Ocultar las rutas anidadas para que no aparezcan como pestañas */}
      <Tabs.Screen name="recipes/new" options={{ href: null }} />
      <Tabs.Screen name="recipes/[id]" options={{ href: null }} />
      <Tabs.Screen name="pantry/index" options={{ href: null }} />
      <Tabs.Screen name="pantry/new" options={{ href: null }} />
      <Tabs.Screen name="shopping/index" options={{ href: null }} />
      <Tabs.Screen name="settings/index" options={{ href: null }} />
      <Tabs.Screen name="week" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
