import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { initDatabase } from '@/database/db';
import { runSeed } from '@/database/seed';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRecipesStore } from '@/store/useRecipesStore';
import { usePantryStore } from '@/store/usePantryStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import { useMealPlanStore } from '@/store/useMealPlanStore';
import { useIngredientsStore } from '@/store/useIngredientsStore';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format, startOfWeek } from 'date-fns';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useHouseholdStore } from '@/store/useHouseholdStore';

function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { activeHousehold, isLoading: householdLoading, loadHouseholds } = useHouseholdStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (session) {
      loadHouseholds();
    }
  }, [session]);

  useEffect(() => {
    if (authLoading || (session && householdLoading)) return;

    const inAuthGroup = segments[0] === 'auth';
    const inHouseholdsGroup = segments[0] === 'households';

    if (!session && !inAuthGroup) {
      // Redirigir al login si no hay sesión y no estamos en /auth
      router.replace('/auth/login');
    } else if (session && !inHouseholdsGroup && !activeHousehold) {
      // Redirigir a households si hay sesión pero no hay hogar activo
      router.replace('/households');
    } else if (session && inAuthGroup) {
      // Si estamos en auth y ya hay sesión, vamos a tabs (o households si no hay)
      if (activeHousehold) {
        router.replace('/(tabs)');
      } else {
        router.replace('/households');
      }
    }
  }, [session, authLoading, householdLoading, activeHousehold, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="households" options={{ headerShown: false }} />
      <Stack.Screen
        name="modals/add-meal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modals/recipe-picker"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useSettingsStore(s => s.load);
  const loadRecipes = useRecipesStore(s => s.load);
  const loadPantry = usePantryStore(s => s.load);
  const loadShopping = useShoppingStore(s => s.loadActiveList);
  const loadIngredients = useIngredientsStore(s => s.load);
  const loadWeek = useMealPlanStore(s => s.loadWeek);

  useEffect(() => {
    async function initialize() {
      try {
        // 1. Inicializar la base de datos local
        await initDatabase();
        // 2. Insertar datos iniciales si es el primer inicio
        await runSeed();
        // 3. Cargar todos los stores en paralelo
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        await Promise.all([
          loadSettings(),
          loadIngredients(),
          loadRecipes(),
          loadPantry(),
          loadShopping(),
          loadWeek(weekStart),
        ]);
        setIsReady(true);
      } catch (e) {
        console.error('[Init] Error:', e);
        setError(String(e));
      }
    }
    initialize();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error al iniciar</Text>
        <Text style={styles.errorMsg}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Preparando Mi Menú Semanal..." />
      </View>
    );
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <RootLayoutNav />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E05A5A',
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 14,
    color: '#7A6552',
    textAlign: 'center',
  },
});
