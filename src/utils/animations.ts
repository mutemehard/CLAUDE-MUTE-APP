// Utilitaires d'animation pour l'app
// Animations fluides pour les listes et transitions

import { Animated, Easing, LayoutAnimation, Platform, UIManager } from 'react-native';

// Active les animations de layout sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Configurations de LayoutAnimation predefinies
export const layoutAnimations = {
  // Animation douce pour les ajouts/suppressions de liste
  spring: LayoutAnimation.Presets.spring,
  easeInOut: LayoutAnimation.Presets.easeInEaseOut,
  linear: LayoutAnimation.Presets.linear,

  // Animation personnalisee pour les cartes
  card: {
    duration: 250,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.scaleXY,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },

  // Animation rapide pour les filtres
  quick: {
    duration: 150,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
  },
};

// Declenche une animation de layout
export const animateLayout = (preset: 'spring' | 'easeInOut' | 'card' | 'quick' = 'spring') => {
  const config = layoutAnimations[preset];
  LayoutAnimation.configureNext(config);
};

// Animation d'entree pour une liste (fade in + slide up)
export const createListEntryAnimation = (index: number, animValue: Animated.Value) => {
  const delay = index * 50; // Delai progressif par item

  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]),
  ]);
};

// Style anime pour un item de liste
export const getListItemStyle = (
  animValue: Animated.Value,
  slideDistance: number = 20
) => ({
  opacity: animValue,
  transform: [
    {
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [slideDistance, 0],
      }),
    },
  ],
});

// Animation de pulse (pour les notifications, badges)
export const createPulseAnimation = (
  animValue: Animated.Value,
  minScale: number = 0.95,
  maxScale: number = 1.05
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: maxScale,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: minScale,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// Animation de shake (pour les erreurs)
export const createShakeAnimation = (animValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

// Animation de bounce (pour les boutons)
export const createBounceAnimation = (animValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animValue, {
      toValue: 0.9,
      duration: 100,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.spring(animValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

// Animation de fade in/out
export const createFadeAnimation = (
  animValue: Animated.Value,
  toValue: number,
  duration: number = 300
) => {
  return Animated.timing(animValue, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  });
};

// Animation de slide (horizontal ou vertical)
export const createSlideAnimation = (
  animValue: Animated.Value,
  toValue: number,
  duration: number = 300
) => {
  return Animated.spring(animValue, {
    toValue,
    friction: 8,
    tension: 50,
    useNativeDriver: true,
  });
};

// Hook-like helper pour creer une animation de liste
export const useListAnimation = () => {
  const values: Animated.Value[] = [];

  const getAnimatedValue = (index: number): Animated.Value => {
    if (!values[index]) {
      values[index] = new Animated.Value(0);
    }
    return values[index];
  };

  const startAnimation = (itemCount: number) => {
    const animations = Array.from({ length: itemCount }).map((_, index) =>
      createListEntryAnimation(index, getAnimatedValue(index))
    );
    Animated.parallel(animations).start();
  };

  const resetAnimations = () => {
    values.forEach(value => value.setValue(0));
  };

  return {
    getAnimatedValue,
    getItemStyle: (index: number) => getListItemStyle(getAnimatedValue(index)),
    startAnimation,
    resetAnimations,
  };
};

// Interpolation helper pour les couleurs (utilise JS car color interpolation native non supportee)
export const interpolateColor = (
  progress: number,
  fromColor: string,
  toColor: string
): string => {
  // Parse hex colors
  const fromRgb = hexToRgb(fromColor);
  const toRgb = hexToRgb(toColor);

  if (!fromRgb || !toRgb) return fromColor;

  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * progress);
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * progress);
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * progress);

  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export default {
  layoutAnimations,
  animateLayout,
  createListEntryAnimation,
  getListItemStyle,
  createPulseAnimation,
  createShakeAnimation,
  createBounceAnimation,
  createFadeAnimation,
  createSlideAnimation,
  useListAnimation,
  interpolateColor,
};
