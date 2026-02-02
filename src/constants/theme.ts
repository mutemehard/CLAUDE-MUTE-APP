// Theme MUTE - Style Dice (dark, minimal, clean)

export const colors = {
  // Couleurs principales
  primary: '#FF4D4D',      // Rouge vif - accent principal (style Dice)
  secondary: '#FF8C42',    // Orange - accent secondaire
  accent: '#FFFFFF',       // Blanc pour highlights

  // Backgrounds - Tres sombre style Dice
  background: '#000000',   // Noir pur
  surface: '#121212',      // Cartes et surfaces
  surfaceLight: '#1C1C1E', // Surface legerement plus claire
  surfaceHover: '#2C2C2E', // Hover state

  // Textes
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A6',
  textMuted: '#636366',

  // Etats
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',

  // Bordures
  border: '#2C2C2E',
  borderLight: '#3A3A3C',

  // Genres (pour les tags)
  genreColors: {
    rock: '#FF453A',
    pop: '#BF5AF2',
    electronic: '#0A84FF',
    hiphop: '#FF9F0A',
    jazz: '#30D158',
    classical: '#5E5CE6',
    metal: '#8E8E93',
    indie: '#FF6482',
    rnb: '#AF52DE',
    folk: '#32D74B',
    techno: '#0A84FF',
    house: '#5AC8FA',
    rap: '#FF9500',
    other: '#636366',
  } as Record<string, string>,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};
