// Service de cache pour les donnees hors-ligne
// Permet de stocker et recuperer les concerts meme sans connexion

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Concert, Artist, Venue } from '../types';

// Cles de cache
const CACHE_KEYS = {
  CONCERTS: '@mute/cache/concerts',
  ARTISTS: '@mute/cache/artists',
  VENUES: '@mute/cache/venues',
  LAST_SYNC: '@mute/cache/last_sync',
  CACHE_VERSION: '@mute/cache/version',
} as const;

// Version du cache (incrementer si la structure change)
const CURRENT_CACHE_VERSION = '1.0.0';

// Duree de validite du cache (24 heures)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CacheMetadata {
  timestamp: number;
  count: number;
  version: string;
}

interface ConcertCache {
  data: Concert[];
  metadata: CacheMetadata;
}

interface ArtistCache {
  data: Artist[];
  metadata: CacheMetadata;
}

interface VenueCache {
  data: Venue[];
  metadata: CacheMetadata;
}

export const cacheService = {
  // === CONCERTS ===
  async cacheConcerts(concerts: Concert[]): Promise<void> {
    try {
      const cache: ConcertCache = {
        data: concerts,
        metadata: {
          timestamp: Date.now(),
          count: concerts.length,
          version: CURRENT_CACHE_VERSION,
        },
      };
      await AsyncStorage.setItem(CACHE_KEYS.CONCERTS, JSON.stringify(cache));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Erreur mise en cache concerts:', error);
    }
  },

  async getCachedConcerts(): Promise<Concert[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.CONCERTS);
      if (!data) return null;

      const cache: ConcertCache = JSON.parse(data);

      // Verifie la version du cache
      if (cache.metadata.version !== CURRENT_CACHE_VERSION) {
        await this.clearConcertCache();
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Erreur lecture cache concerts:', error);
      return null;
    }
  },

  async isConcertCacheValid(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.CONCERTS);
      if (!data) return false;

      const cache: ConcertCache = JSON.parse(data);
      const age = Date.now() - cache.metadata.timestamp;

      return age < CACHE_DURATION_MS && cache.metadata.version === CURRENT_CACHE_VERSION;
    } catch {
      return false;
    }
  },

  async clearConcertCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.CONCERTS);
    } catch (error) {
      console.error('Erreur suppression cache concerts:', error);
    }
  },

  // === ARTISTES ===
  async cacheArtists(artists: Artist[]): Promise<void> {
    try {
      const cache: ArtistCache = {
        data: artists,
        metadata: {
          timestamp: Date.now(),
          count: artists.length,
          version: CURRENT_CACHE_VERSION,
        },
      };
      await AsyncStorage.setItem(CACHE_KEYS.ARTISTS, JSON.stringify(cache));
    } catch (error) {
      console.error('Erreur mise en cache artistes:', error);
    }
  },

  async getCachedArtists(): Promise<Artist[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.ARTISTS);
      if (!data) return null;

      const cache: ArtistCache = JSON.parse(data);

      if (cache.metadata.version !== CURRENT_CACHE_VERSION) {
        await this.clearArtistCache();
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Erreur lecture cache artistes:', error);
      return null;
    }
  },

  async clearArtistCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.ARTISTS);
    } catch (error) {
      console.error('Erreur suppression cache artistes:', error);
    }
  },

  // === VENUES ===
  async cacheVenues(venues: Venue[]): Promise<void> {
    try {
      const cache: VenueCache = {
        data: venues,
        metadata: {
          timestamp: Date.now(),
          count: venues.length,
          version: CURRENT_CACHE_VERSION,
        },
      };
      await AsyncStorage.setItem(CACHE_KEYS.VENUES, JSON.stringify(cache));
    } catch (error) {
      console.error('Erreur mise en cache venues:', error);
    }
  },

  async getCachedVenues(): Promise<Venue[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.VENUES);
      if (!data) return null;

      const cache: VenueCache = JSON.parse(data);

      if (cache.metadata.version !== CURRENT_CACHE_VERSION) {
        await this.clearVenueCache();
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Erreur lecture cache venues:', error);
      return null;
    }
  },

  async clearVenueCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.VENUES);
    } catch (error) {
      console.error('Erreur suppression cache venues:', error);
    }
  },

  // === UTILITAIRES ===
  async getLastSyncTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch {
      return null;
    }
  },

  async getTimeSinceLastSync(): Promise<string | null> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return null;

    const diff = Date.now() - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `il y a ${hours}h`;
    }
    if (minutes > 0) {
      return `il y a ${minutes}min`;
    }
    return 'a l\'instant';
  },

  async getCacheStats(): Promise<{
    concertsCount: number;
    artistsCount: number;
    venuesCount: number;
    lastSync: string | null;
    isStale: boolean;
  }> {
    const [concerts, artists, venues, lastSyncStr, cacheValid] = await Promise.all([
      this.getCachedConcerts(),
      this.getCachedArtists(),
      this.getCachedVenues(),
      this.getTimeSinceLastSync(),
      this.isConcertCacheValid(),
    ]);

    return {
      concertsCount: concerts?.length || 0,
      artistsCount: artists?.length || 0,
      venuesCount: venues?.length || 0,
      lastSync: lastSyncStr,
      isStale: !cacheValid,
    };
  },

  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Erreur suppression du cache:', error);
    }
  },

  // Prefetch intelligent - met en cache avant que l'utilisateur n'en ait besoin
  async prefetchData(
    fetchConcerts: () => Promise<Concert[]>,
    fetchArtists: () => Promise<Artist[]>,
    fetchVenues: () => Promise<Venue[]>
  ): Promise<void> {
    try {
      const [concerts, artists, venues] = await Promise.all([
        fetchConcerts(),
        fetchArtists(),
        fetchVenues(),
      ]);

      await Promise.all([
        this.cacheConcerts(concerts),
        this.cacheArtists(artists),
        this.cacheVenues(venues),
      ]);

      console.log(`Cache prefetch: ${concerts.length} concerts, ${artists.length} artistes, ${venues.length} venues`);
    } catch (error) {
      console.error('Erreur prefetch cache:', error);
    }
  },

  // Methode pour recuperer les donnees avec fallback sur le cache
  async getWithCacheFallback<T>(
    cacheKey: keyof typeof CACHE_KEYS,
    fetchFn: () => Promise<T[]>,
    cacheFn: (data: T[]) => Promise<void>
  ): Promise<{ data: T[]; fromCache: boolean }> {
    try {
      // Essaie de recuperer les donnees fraiches
      const freshData = await fetchFn();

      // Met en cache
      await cacheFn(freshData);

      return { data: freshData, fromCache: false };
    } catch (error) {
      // En cas d'erreur, utilise le cache
      console.log('Utilisation du cache (hors-ligne)');

      let cachedData: T[] | null = null;

      switch (cacheKey) {
        case 'CONCERTS':
          cachedData = await this.getCachedConcerts() as T[] | null;
          break;
        case 'ARTISTS':
          cachedData = await this.getCachedArtists() as T[] | null;
          break;
        case 'VENUES':
          cachedData = await this.getCachedVenues() as T[] | null;
          break;
      }

      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }

      throw error;
    }
  },
};

export default cacheService;
