// Theme et constantes de style

export const colors = {
  // Couleurs principales
  primary: '#FF6B6B',      // Rouge corail - accent principal
  secondary: '#4ECDC4',    // Turquoise - accent secondaire
  accent: '#FFE66D',       // Jaune - highlights

  // Backgrounds
  background: '#1A1A2E',   // Fond sombre principal
  surface: '#16213E',      // Cartes et surfaces
  surfaceLight: '#0F3460', // Surface légèrement plus claire

  // Textes
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B8D1',
  textMuted: '#6B6B8D',

  // États
  success: '#4ECDC4',
  warning: '#FFE66D',
  error: '#FF6B6B',

  // Genres (pour les tags)
  genreColors: {
    rock: '#E74C3C',
    pop: '#9B59B6',
    electronic: '#3498DB',
    hiphop: '#F39C12',
    jazz: '#1ABC9C',
    classical: '#34495E',
    metal: '#2C3E50',
    indie: '#E67E22',
    rnb: '#8E44AD',
    folk: '#27AE60',
    other: '#95A5A6',
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
