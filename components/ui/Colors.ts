// ============================================================
// DESIGN TOKENS — Mi Menú Semanal
// Paleta cálida: terracota / crema / verde salvia / gris cálido
// ============================================================

export const Colors = {
  light: {
    // Fondo más cálido
    background: '#FFF5E8',
    backgroundCard: '#FFFCF9',
    backgroundSecondary: '#F2E8DF',
    backgroundInput: '#F8F1EB',

    // Primario: naranja terracota más vibrante para mayor contraste
    primary: '#D65828',
    primaryDark: '#B23A0D',
    primaryLight: '#F49B75',
    primarySurface: '#FDEAE3',

    // Secundario: verde salvia oscuro
    secondary: '#508552',
    secondaryDark: '#386339',
    secondaryLight: '#94C696',
    secondarySurface: '#E6F3E7',

    // Acento: ocre intenso
    accent: '#D48C24',
    accentSurface: '#FDF1DF',

    // Estado
    success: '#3A965E',
    successSurface: '#E3F4EB',
    warning: '#D48C24',
    warningSurface: '#FDF1DF',
    error: '#D34242',
    errorSurface: '#FCECEC',
    info: '#4182D3',
    infoSurface: '#E6EFFF',

    // Texto - Más oscuros para máxima legibilidad
    text: '#1F1712',
    textSecondary: '#54463C',
    textTertiary: '#8E7B6D',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textPlaceholder: '#B5A599',

    // Bordes
    border: '#E8DED6',
    borderFocus: '#D65828',
    separator: '#EDE4DC',

    // Tabs y navegación
    tabBar: '#FFFCF9',
    tabBarBorder: '#E8DED6',
    tabActive: '#D65828',
    tabInactive: '#968579',

    // Chips / Badges
    chipBackground: '#EFE6DE',
    chipText: '#7A6552',

    // Sombras
    shadowColor: '#1F1712',
  },
  dark: {
    // Fondo más profundo pero cálido
    background: '#181310',
    backgroundCard: '#241D19',
    backgroundSecondary: '#2E2520',
    backgroundInput: '#201A16',

    // Primario: brillante en fondo oscuro
    primary: '#F07542',
    primaryDark: '#E85B20',
    primaryLight: '#F7A380',
    primarySurface: '#3A2016',

    // Secundario: verde vibrante
    secondary: '#8ACD89',
    secondaryDark: '#6BA86A',
    secondaryLight: '#AEDCAE',
    secondarySurface: '#243A24',

    // Acento
    accent: '#EFA642',
    accentSurface: '#3A2816',

    // Estado
    success: '#6AC68D',
    successSurface: '#1B3826',
    warning: '#EFA642',
    warningSurface: '#3A2816',
    error: '#E86666',
    errorSurface: '#3D1C1C',
    info: '#66A5E8',
    infoSurface: '#192C45',

    // Texto - Alto contraste
    text: '#FDF5F0',
    textSecondary: '#C8B5A7',
    textTertiary: '#948376',
    textOnPrimary: '#1F1712',
    textOnSecondary: '#1F1712',
    textPlaceholder: '#7A6B60',

    // Bordes
    border: '#382D26',
    borderFocus: '#F07542',
    separator: '#2E2520',

    // Tabs y navegación
    tabBar: '#241D19',
    tabBarBorder: '#382D26',
    tabActive: '#F07542',
    tabInactive: '#7A6B60',

    // Chips / Badges
    chipBackground: '#332923',
    chipText: '#C4B0A0',

    shadowColor: '#000000',
  },
};

export type ColorScheme = typeof Colors.light;
