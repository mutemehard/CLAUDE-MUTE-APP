// Service pour gérer les données de concerts avec support API et cache
import { Concert, ConcertFilters, Artist, Venue } from '../types';
import { mockConcerts, mockArtists, mockVenues } from './mockData';
import { bandsintownApi } from './api/bandsintown';
import { openagendaApi } from './api/openagenda';
import { scrapeAllEvents, mergeScrapedConcerts } from './scrapers';

// Configuration
const USE_REAL_API = false; // Passer a true quand les cles API sont configurees
const USE_SCRAPERS = true; // Utilise les scrapers pour plus de donnees
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache simple en memoire
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Simule un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utilitaires de date
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

const isThisWeek = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  return date >= today && date <= weekFromNow;
};

const isThisMonth = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

// Filtre les concerts selon les critères
const filterConcerts = (concerts: Concert[], filters: ConcertFilters): Concert[] => {
  let result = [...concerts];

  // Filtre par date
  if (filters.dateRange) {
    result = result.filter(c => {
      const concertDate = new Date(c.date);
      const start = new Date(filters.dateRange!.start);
      const end = new Date(filters.dateRange!.end);
      return concertDate >= start && concertDate <= end;
    });
  }

  // Filtre par genre
  if (filters.genres && filters.genres.length > 0) {
    result = result.filter(c =>
      c.genre && filters.genres!.some(g =>
        g.toLowerCase() === c.genre?.toLowerCase() ||
        c.artist.genres.some(ag => ag.toLowerCase() === g.toLowerCase())
      )
    );
  }

  // Filtre par prix
  if (filters.priceRange) {
    result = result.filter(c => {
      if (!c.price) return filters.priceRange!.min === 0;
      return c.price.min >= filters.priceRange!.min && c.price.max <= filters.priceRange!.max;
    });
  }

  // Filtre par salle
  if (filters.venues && filters.venues.length > 0) {
    result = result.filter(c => filters.venues!.includes(c.venue.id));
  }

  // Filtre par arrondissement
  if (filters.arrondissements && filters.arrondissements.length > 0) {
    result = result.filter(c =>
      c.venue.arrondissement && filters.arrondissements!.includes(c.venue.arrondissement)
    );
  }

  // Exclure les sold out si demandé
  if (filters.showSoldOut === false) {
    result = result.filter(c => !c.isSoldOut);
  }

  // Tri
  if (filters.sortBy) {
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'popularity':
          comparison = (b.artist.popularity || 0) - (a.artist.popularity || 0);
          break;
        case 'price':
          comparison = (a.price?.min || 0) - (b.price?.min || 0);
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return result;
};

// Fusionne les concerts de differentes sources et supprime les doublons
const mergeConcerts = (concertArrays: Concert[][]): Concert[] => {
  const allConcerts = concertArrays.flat();
  const seen = new Set<string>();

  return allConcerts.filter(concert => {
    // Cree une cle unique basee sur artiste + venue + date
    const key = `${concert.artist.name.toLowerCase()}_${concert.venue.name.toLowerCase()}_${concert.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Artistes populaires a rechercher sur Bandsintown
const POPULAR_ARTISTS = [
  'Phoenix', 'Justice', 'Daft Punk', 'Air', 'M83',
  'Charlotte de Witte', 'Amelie Lens', 'Nina Kraviz',
  'Orelsan', 'PNL', 'Angele', 'Stromae',
  'The Blaze', 'Polo & Pan', 'Parcels',
];

// API publique du service
export const concertService = {
  // Récupère tous les concerts (avec cache)
  async getAllConcerts(): Promise<Concert[]> {
    const cacheKey = 'all_concerts';
    const cached = cache.get<Concert[]>(cacheKey);
    if (cached) return cached;

    let concerts: Concert[] = [];
    const concertSources: Concert[][] = [mockConcerts];

    // Fetch depuis les APIs si active
    if (USE_REAL_API) {
      try {
        const apiConcerts = await this.fetchFromApis();
        if (apiConcerts.length > 0) {
          concertSources.push(apiConcerts);
        }
      } catch (error) {
        console.error('Error fetching from APIs:', error);
      }
    }

    // Fetch depuis les scrapers si active
    if (USE_SCRAPERS) {
      try {
        const scraperResults = await scrapeAllEvents({ city: 'Paris' });
        const scrapedConcerts = mergeScrapedConcerts(scraperResults);
        if (scrapedConcerts.length > 0) {
          concertSources.push(scrapedConcerts);
        }
      } catch (error) {
        console.error('Error fetching from scrapers:', error);
      }
    }

    // Merge toutes les sources
    concerts = mergeConcerts(concertSources);

    // Si aucun resultat, fallback sur mocks
    if (concerts.length === 0) {
      await delay(300);
      concerts = mockConcerts;
    }

    const sorted = concerts.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    cache.set(cacheKey, sorted);
    return sorted;
  },

  // Fetch depuis les vraies APIs
  async fetchFromApis(): Promise<Concert[]> {
    const concertPromises: Promise<Concert[]>[] = [];

    // Bandsintown - recherche par artistes populaires
    for (const artistName of POPULAR_ARTISTS.slice(0, 5)) {
      concertPromises.push(
        bandsintownApi.getArtistEventsInParis(artistName)
          .catch(err => {
            console.warn(`Bandsintown error for ${artistName}:`, err);
            return [];
          })
      );
    }

    // OpenAgenda - concerts a Paris
    concertPromises.push(
      openagendaApi.getWeekEvents()
        .catch(err => {
          console.warn('OpenAgenda error:', err);
          return [];
        })
    );

    const results = await Promise.all(concertPromises);
    return mergeConcerts(results);
  },

  // Récupère les concerts avec filtres
  async getConcerts(filters?: ConcertFilters): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    if (!filters) return concerts;
    return filterConcerts(concerts, filters);
  },

  // Concerts d'aujourd'hui
  async getTodayConcerts(): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    return concerts.filter(c => isToday(c.date));
  },

  // Concerts de la semaine
  async getWeekConcerts(): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    return concerts.filter(c => isThisWeek(c.date));
  },

  // Récupère un concert par ID
  async getConcertById(id: string): Promise<Concert | null> {
    const concerts = await this.getAllConcerts();
    return concerts.find(c => c.id === id) || null;
  },

  // Recherche de concerts par texte
  async searchConcerts(query: string): Promise<Concert[]> {
    const lowerQuery = query.toLowerCase();

    // Si API active, recherche aussi sur Bandsintown
    if (USE_REAL_API) {
      try {
        const apiResults = await bandsintownApi.getArtistEventsInParis(query);
        if (apiResults.length > 0) {
          // Combine avec les mocks qui matchent
          const mockResults = mockConcerts.filter(c =>
            c.artist.name.toLowerCase().includes(lowerQuery) ||
            c.venue.name.toLowerCase().includes(lowerQuery) ||
            c.genre?.toLowerCase().includes(lowerQuery)
          );
          return mergeConcerts([apiResults, mockResults]);
        }
      } catch (error) {
        console.warn('Search API error:', error);
      }
    }

    await delay(200);
    return mockConcerts.filter(c =>
      c.artist.name.toLowerCase().includes(lowerQuery) ||
      c.venue.name.toLowerCase().includes(lowerQuery) ||
      c.genre?.toLowerCase().includes(lowerQuery)
    );
  },

  // Récupère les concerts d'un artiste
  async getConcertsByArtist(artistId: string): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    return concerts.filter(c => c.artist.id === artistId);
  },

  // Récupère les concerts d'une salle
  async getConcertsByVenue(venueId: string): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    return concerts.filter(c => c.venue.id === venueId);
  },

  // Recupere les concerts similaires (meme genre ou meme salle)
  async getSimilarConcerts(concertId: string, limit: number = 5): Promise<Concert[]> {
    const concert = await this.getConcertById(concertId);
    if (!concert) return [];

    const allConcerts = await this.getAllConcerts();

    return allConcerts
      .filter(c =>
        c.id !== concertId && (
          c.genre === concert.genre ||
          c.venue.id === concert.venue.id ||
          c.artist.genres.some(g => concert.artist.genres.includes(g))
        )
      )
      .slice(0, limit);
  },

  // Vide le cache
  clearCache(): void {
    cache.clear();
  },
};

export const artistService = {
  async getAllArtists(): Promise<Artist[]> {
    const cacheKey = 'all_artists';
    const cached = cache.get<Artist[]>(cacheKey);
    if (cached) return cached;

    await delay(200);
    cache.set(cacheKey, mockArtists);
    return mockArtists;
  },

  async getArtistById(id: string): Promise<Artist | null> {
    // Essaie d'abord dans les mocks
    const mockArtist = mockArtists.find(a => a.id === id);
    if (mockArtist) return mockArtist;

    // Essaie de le trouver dans les concerts
    const concerts = await concertService.getAllConcerts();
    const concert = concerts.find(c => c.artist.id === id);
    return concert?.artist || null;
  },

  async searchArtists(query: string): Promise<Artist[]> {
    const lowerQuery = query.toLowerCase();

    // Si API active, recherche aussi sur Bandsintown
    if (USE_REAL_API) {
      try {
        const apiArtist = await bandsintownApi.searchArtist(query);
        if (apiArtist) {
          // Combine avec les mocks qui matchent
          const mockResults = mockArtists.filter(a =>
            a.name.toLowerCase().includes(lowerQuery) ||
            a.genres.some(g => g.toLowerCase().includes(lowerQuery))
          );
          // Evite les doublons
          const combined = [apiArtist, ...mockResults.filter(m =>
            m.name.toLowerCase() !== apiArtist.name.toLowerCase()
          )];
          return combined;
        }
      } catch (error) {
        console.warn('Artist search API error:', error);
      }
    }

    await delay(200);
    return mockArtists.filter(a =>
      a.name.toLowerCase().includes(lowerQuery) ||
      a.genres.some(g => g.toLowerCase().includes(lowerQuery))
    );
  },

  async getPopularArtists(limit: number = 10): Promise<Artist[]> {
    const artists = await this.getAllArtists();
    return artists
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  },

  async getArtistConcerts(artistId: string): Promise<Concert[]> {
    return concertService.getConcertsByArtist(artistId);
  },
};

export const venueService = {
  async getAllVenues(): Promise<Venue[]> {
    const cacheKey = 'all_venues';
    const cached = cache.get<Venue[]>(cacheKey);
    if (cached) return cached;

    await delay(200);
    cache.set(cacheKey, mockVenues);
    return mockVenues;
  },

  async getVenueById(id: string): Promise<Venue | null> {
    // Essaie d'abord dans les mocks
    const mockVenue = mockVenues.find(v => v.id === id);
    if (mockVenue) return mockVenue;

    // Essaie de le trouver dans les concerts
    const concerts = await concertService.getAllConcerts();
    const concert = concerts.find(c => c.venue.id === id);
    return concert?.venue || null;
  },

  async searchVenues(query: string): Promise<Venue[]> {
    await delay(200);
    const lowerQuery = query.toLowerCase();
    return mockVenues.filter(v =>
      v.name.toLowerCase().includes(lowerQuery) ||
      v.address.toLowerCase().includes(lowerQuery) ||
      v.arrondissement?.toLowerCase().includes(lowerQuery)
    );
  },

  async getPopularVenues(limit: number = 10): Promise<Venue[]> {
    const venues = await this.getAllVenues();
    return venues
      .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
      .slice(0, limit);
  },

  async getVenueConcerts(venueId: string): Promise<Concert[]> {
    return concertService.getConcertsByVenue(venueId);
  },

  async getNearbyVenues(lat: number, lon: number, radiusKm: number = 5): Promise<Venue[]> {
    const venues = await this.getAllVenues();

    // Calcul distance simple (approximation)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Rayon terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return venues.filter(v =>
      getDistance(lat, lon, v.latitude, v.longitude) <= radiusKm
    );
  },
};
