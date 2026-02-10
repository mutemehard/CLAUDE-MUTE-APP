// Service de stockage persistant avec AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Favorite, UserPreferences, AttendedConcert, ConcertFilters } from '../types';
import { NotificationSettings } from './notificationService';

// Cles de stockage
const STORAGE_KEYS = {
  FAVORITES: '@mute/favorites',
  PREFERENCES: '@mute/preferences',
  ATTENDED_CONCERTS: '@mute/attended_concerts',
  NOTIFICATION_SETTINGS: '@mute/notification_settings',
  FILTERS: '@mute/filters',
  RECENT_SEARCHES: '@mute/recent_searches',
  ONBOARDING_COMPLETED: '@mute/onboarding_completed',
} as const;

// Valeurs par defaut
const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteGenres: [],
  favoriteCities: ['Paris'],
  notificationsEnabled: true,
  notifyNewConcerts: true,
  notifyPriceDrops: false,
  notifyNearby: true,
  nearbyRadius: 10,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  newConcerts: true,
  favoriteArtists: true,
  favoriteVenues: true,
  priceDrops: false,
  weeklyDigest: true,
  weeklyDigestDay: 'friday',
  weeklyDigestTime: '18:00',
  friendActivity: true,
  concertReminders: true,
};

export const storageService = {
  // === FAVORIS ===
  async getFavorites(): Promise<Favorite[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lecture favoris:', error);
      return [];
    }
  },

  async saveFavorites(favorites: Favorite[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Erreur sauvegarde favoris:', error);
    }
  },

  async addFavorite(favorite: Favorite): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.some(f => f.type === favorite.type && f.id === favorite.id)) {
      favorites.push(favorite);
      await this.saveFavorites(favorites);
    }
  },

  async removeFavorite(type: Favorite['type'], id: string): Promise<void> {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter(f => !(f.type === type && f.id === id));
    await this.saveFavorites(filtered);
  },

  // === PREFERENCES ===
  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Erreur lecture preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur sauvegarde preferences:', error);
    }
  },

  // === CONCERTS VUS ===
  async getAttendedConcerts(): Promise<AttendedConcert[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDED_CONCERTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lecture concerts vus:', error);
      return [];
    }
  },

  async saveAttendedConcerts(concerts: AttendedConcert[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDED_CONCERTS, JSON.stringify(concerts));
    } catch (error) {
      console.error('Erreur sauvegarde concerts vus:', error);
    }
  },

  async addAttendedConcert(concert: AttendedConcert): Promise<void> {
    const concerts = await this.getAttendedConcerts();
    concerts.push(concert);
    await this.saveAttendedConcerts(concerts);
  },

  async removeAttendedConcert(concertId: string): Promise<void> {
    const concerts = await this.getAttendedConcerts();
    const filtered = concerts.filter(c => c.concertId !== concertId);
    await this.saveAttendedConcerts(filtered);
  },

  async updateAttendedConcert(concertId: string, updates: Partial<AttendedConcert>): Promise<void> {
    const concerts = await this.getAttendedConcerts();
    const index = concerts.findIndex(c => c.concertId === concertId);
    if (index !== -1) {
      concerts[index] = { ...concerts[index], ...updates };
      await this.saveAttendedConcerts(concerts);
    }
  },

  // === NOTIFICATIONS ===
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return data ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      console.error('Erreur lecture settings notifications:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  },

  async saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getNotificationSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur sauvegarde settings notifications:', error);
    }
  },

  // === FILTRES ===
  async getFilters(): Promise<ConcertFilters | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FILTERS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lecture filtres:', error);
      return null;
    }
  },

  async saveFilters(filters: ConcertFilters): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
    } catch (error) {
      console.error('Erreur sauvegarde filtres:', error);
    }
  },

  // === RECHERCHES RECENTES ===
  async getRecentSearches(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lecture recherches recentes:', error);
      return [];
    }
  },

  async addRecentSearch(query: string): Promise<void> {
    try {
      const searches = await this.getRecentSearches();
      const filtered = searches.filter(s => s !== query);
      const updated = [query, ...filtered].slice(0, 10); // Max 10 recherches
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur ajout recherche recente:', error);
    }
  },

  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.error('Erreur suppression recherches recentes:', error);
    }
  },

  // === ONBOARDING ===
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return data === 'true';
    } catch (error) {
      return false;
    }
  },

  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
    }
  },

  // === UTILITAIRES ===
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Erreur suppression donnees:', error);
    }
  },

  async exportData(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(STORAGE_KEYS)) {
      const stored = await AsyncStorage.getItem(value);
      data[key] = stored ? JSON.parse(stored) : null;
    }
    return data;
  },

  async importData(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
      if (storageKey && value !== null) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(value));
      }
    }
  },
};

export default storageService;
