// Utilitaires de retour haptique
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Verifie si les haptics sont supportes
const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

// Impact leger - pour les interactions UI simples (boutons, toggles)
export const lightImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Ignore les erreurs (appareil sans moteur haptique)
  }
};

// Impact moyen - pour les actions confirmees (ajout favoris, etc.)
export const mediumImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Ignore
  }
};

// Impact fort - pour les actions importantes (achat billets, etc.)
export const heavyImpact = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Ignore
  }
};

// Notification de succes
export const successNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Ignore
  }
};

// Notification d'erreur
export const errorNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Ignore
  }
};

// Notification d'avertissement
export const warningNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Ignore
  }
};

// Selection (pour les pickers, sliders)
export const selectionFeedback = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Ignore
  }
};

// Export groupe pour faciliter l'usage
export const haptics = {
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  success: successNotification,
  error: errorNotification,
  warning: warningNotification,
  selection: selectionFeedback,
};
