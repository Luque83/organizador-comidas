import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from './Colors';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Hook que retorna los colores del tema actual.
 * Respeta la preferencia del usuario de la configuración.
 */
export function useThemeColors(): ColorScheme {
  const systemScheme = useColorScheme();
  const settings = useSettingsStore(s => s.settings);
  
  const darkMode = settings?.darkMode ?? 'system';
  const isDark = darkMode === 'dark' || (darkMode === 'system' && systemScheme === 'dark');
  
  return isDark ? Colors.dark : Colors.light;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const settings = useSettingsStore(s => s.settings);
  const darkMode = settings?.darkMode ?? 'system';
  return darkMode === 'dark' || (darkMode === 'system' && systemScheme === 'dark');
}
