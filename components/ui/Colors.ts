// ============================================================
// DESIGN TOKENS — Mi Menú Semanal
// Paleta cálida: terracota / crema / verde salvia / gris cálido
// ============================================================

export const Colors = {
  light: {
    // Fondo
    background: '#FFF8F0',
    backgroundCard: '#FFFFFF',
    backgroundSecondary: '#F5EDE4',
    backgroundInput: '#FAF5EE',

    // Primario: terracota / naranja cálido
    primary: '#E8784A',
    primaryDark: '#C45E32',
    primaryLight: '#F4A47A',
    primarySurface: '#FEF0E8',

    // Secundario: verde salvia suave
    secondary: '#7BAF7A',
    secondaryDark: '#5D9060',
    secondaryLight: '#A8CFA7',
    secondarySurface: '#EEF7EE',

    // Acento: amarillo dorado
    accent: '#E8A84A',
    accentSurface: '#FEF5E8',

    // Estado
    success: '#4CAF7A',
    successSurface: '#E8F5EE',
    warning: '#E8A84A',
    warningSurface: '#FEF5E8',
    error: '#E05A5A',
    errorSurface: '#FEEEEE',
    info: '#5A9AE0',
    infoSurface: '#EEF4FE',

    // Texto
    text: '#2D2416',
    textSecondary: '#7A6552',
    textTertiary: '#A89585',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textPlaceholder: '#C4B5A8',

    // Bordes
    border: '#EAE0D5',
    borderFocus: '#E8784A',
    separator: '#F0E8DF',

    // Tabs y navegación
    tabBar: '#FFFFFF',
    tabBarBorder: '#EAE0D5',
    tabActive: '#E8784A',
    tabInactive: '#B0A098',

    // Chips / Badges
    chipBackground: '#F0E8DF',
    chipText: '#7A6552',

    // Sombras
    shadowColor: '#2D2416',
  },
  dark: {
    background: '#1A1410',
    backgroundCard: '#261E18',
    backgroundSecondary: '#2E2420',
    backgroundInput: '#332822',

    primary: '#F4916A',
    primaryDark: '#E8784A',
    primaryLight: '#F8B898',
    primarySurface: '#2E1E16',

    secondary: '#8DC48C',
    secondaryDark: '#7BAF7A',
    secondaryLight: '#ADCFAC',
    secondarySurface: '#1A2618',

    accent: '#F0BC70',
    accentSurface: '#2E2418',

    success: '#5DC48C',
    successSurface: '#1A2822',
    warning: '#F0BC70',
    warningSurface: '#2E2418',
    error: '#E87878',
    errorSurface: '#2E1818',
    info: '#78B4E8',
    infoSurface: '#182430',

    text: '#F5EDE4',
    textSecondary: '#C4B0A0',
    textTertiary: '#8A7868',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textPlaceholder: '#5A4A3A',

    border: '#3A2E26',
    borderFocus: '#F4916A',
    separator: '#332822',

    tabBar: '#1E1612',
    tabBarBorder: '#3A2E26',
    tabActive: '#F4916A',
    tabInactive: '#6A5848',

    chipBackground: '#332822',
    chipText: '#C4B0A0',

    shadowColor: '#000000',
  },
};

export type ColorScheme = typeof Colors.light;
