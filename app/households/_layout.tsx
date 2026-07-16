import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '../../components/ui/Colors';

export default function HouseholdsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.light.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Hogares',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
