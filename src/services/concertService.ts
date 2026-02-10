// Service pour gerer les donnees de concerts avec support multi-API
// Sources: Bandsintown, Ticketmaster, OpenAgenda
import { Concert, ConcertFilters, Artist, Venue } from '../types';
import { bandsintownApi } from './api/bandsintown';
import { ticketmasterApi } from './api/ticketmaster';
import { openagendaApi } from './api/openagenda';
import { API_CONFIG } from '../config/api';

// Configuration
const CACHE_DURATION = API_CONFIG.cache.duration;
const USE_REAL_API = true; // Toggle to use real APIs vs mock data

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

// Artistes populaires a rechercher sur Bandsintown (concerts a Paris)
const POPULAR_ARTISTS = [
  // Francais - Pop/Rock
  'Phoenix', 'Christine and the Queens', 'Angele', 'Stromae', 'Clara Luciani',
  'Pomme', 'L\'Imperatrice', 'Juliette Armanet', 'Woodkid', 'Flavien Berger',
  // Francais - Rap/Hip-Hop
  'Orelsan', 'Nekfeu', 'PNL', 'Vald', 'Lomepal', 'Hamza', 'Laylow', 'SDM',
  'Josman', 'Ninho', 'Jul', 'Booba', 'Damso', 'Gazo', 'Tiakola',
  // Electronic - Francais
  'Justice', 'Polo & Pan', 'The Blaze', 'Myd', 'Petit Biscuit', 'Kungs',
  'DJ Snake', 'David Guetta', 'Gesaffelstein', 'Rone', 'Worakls', 'N\'to',
  'Bon Entendeur', 'Vladimir Cauchemar', 'Louisahhh', 'Folamour',
  // Electronic - International
  'Charlotte de Witte', 'Amelie Lens', 'Nina Kraviz', 'Jeff Mills', 'Bicep',
  'Moderat', 'Bonobo', 'Jamie xx', 'Four Tet', 'Floating Points', 'Solomun',
  'Tale Of Us', 'Peggy Gou', 'Ben Bohmer', 'RÜFÜS DU SOL', 'Fred Again',
  // Rock/Indie - International
  'Arctic Monkeys', 'Tame Impala', 'The 1975', 'Mac DeMarco', 'Parcels',
  'Disclosure', 'Khruangbin', 'Jungle', 'Kaytranada', 'Rosalia',
  // R&B/Soul
  'Aya Nakamura', 'Yseult', 'Lous and the Yakuza', 'Jorja Smith', 'SZA',
  // Classical/Piano
  'Sofiane Pamart', 'Ludovico Einaudi', 'Hans Zimmer',
  // Autres populaires
  'Dua Lipa', 'The Weeknd', 'Billie Eilish', 'Post Malone', 'Travis Scott',
  'Kendrick Lamar', 'Tyler the Creator', 'Frank Ocean', 'Bad Bunny',
];

// API publique du service
export const concertService = {
  // Récupère tous les concerts (avec cache)
  // Sources: Ticketmaster, Bandsintown, OpenAgenda
  async getAllConcerts(): Promise<Concert[]> {
    const cacheKey = 'all_concerts';
    const cached = cache.get<Concert[]>(cacheKey);
    if (cached) {
      console.log(`[MUTE] Returning ${cached.length} cached concerts`);
      return cached;
    }

    try {
      const concerts = await this.fetchFromApis();

      // Trie par date
      const sorted = concerts.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Cache les resultats
      if (sorted.length > 0) {
        cache.set(cacheKey, sorted);
      }

      return sorted;
    } catch (error) {
      console.error('[MUTE] Error fetching concerts:', error);
      return [];
    }
  },

  // Fetch depuis toutes les APIs configurees
  async fetchFromApis(): Promise<Concert[]> {
    const allConcerts: Concert[][] = [];
    const errors: string[] = [];

    console.log('[MUTE] Fetching concerts from APIs...');

    // 1. Ticketmaster - meilleure source pour les concerts (si cle configuree)
    if (API_CONFIG.ticketmaster?.enabled && API_CONFIG.ticketmaster?.apiKey) {
      try {
        console.log('[MUTE] Fetching from Ticketmaster...');
        const tmConcerts = await ticketmasterApi.getConcertsInParis({ size: 200 });
        if (tmConcerts.length > 0) {
          allConcerts.push(tmConcerts);
          console.log(`[MUTE] Ticketmaster: ${tmConcerts.length} concerts found`);
        }
      } catch (error) {
        errors.push('Ticketmaster API error');
        console.warn('[MUTE] Ticketmaster error:', error);
      }
    }

    // 2. Bandsintown - recherche par artistes populaires
    if (API_CONFIG.bandsintown?.enabled) {
      const batchSize = 10;
      let bandsintownTotal = 0;

      console.log('[MUTE] Fetching from Bandsintown...');

      for (let i = 0; i < POPULAR_ARTISTS.length; i += batchSize) {
        const batch = POPULAR_ARTISTS.slice(i, i + batchSize);
        const batchPromises = batch.map(artistName =>
          bandsintownApi.getArtistEventsInParis(artistName)
            .catch(() => [])
        );

        try {
          const batchResults = await Promise.all(batchPromises);
          const validResults = batchResults.filter(r => r.length > 0);
          allConcerts.push(...validResults);
          bandsintownTotal += validResults.reduce((sum, r) => sum + r.length, 0);
        } catch (error) {
          console.warn('[MUTE] Bandsintown batch error:', error);
        }

        // Rate limiting
        if (i + batchSize < POPULAR_ARTISTS.length) {
          await delay(150);
        }
      }

      console.log(`[MUTE] Bandsintown: ${bandsintownTotal} concerts found`);
    }

    // 3. OpenAgenda - evenements locaux (si configure)
    if (API_CONFIG.openagenda?.enabled && API_CONFIG.openagenda?.apiKey) {
      try {
        console.log('[MUTE] Fetching from OpenAgenda...');
        const oaConcerts = await openagendaApi.getWeekEvents();
        if (oaConcerts.length > 0) {
          allConcerts.push(oaConcerts);
          console.log(`[MUTE] OpenAgenda: ${oaConcerts.length} concerts found`);
        }
      } catch (error) {
        errors.push('OpenAgenda API error');
      }
    }

    const merged = mergeConcerts(allConcerts);
    console.log(`[MUTE] Total unique concerts: ${merged.length}`);

    if (errors.length > 0) {
      console.warn('[MUTE] API errors:', errors.join(', '));
    }

    return merged;
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

  // Concerts du weekend (vendredi, samedi, dimanche)
  async getWeekendConcerts(): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Trouve le prochain vendredi
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + (daysUntilFriday === 0 && today.getHours() < 18 ? 0 : daysUntilFriday));
    friday.setHours(0, 0, 0, 0);

    // Dimanche soir
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    return concerts.filter(c => {
      const concertDate = new Date(c.date);
      return concertDate >= friday && concertDate <= sunday;
    });
  },

  // Concerts d'un mois specifique
  async getMonthConcerts(year: number, month: number): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    return concerts.filter(c => {
      const date = new Date(c.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  },

  // Concerts des X prochains jours
  async getUpcomingConcerts(days: number = 30): Promise<Concert[]> {
    const concerts = await this.getAllConcerts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);

    return concerts.filter(c => {
      const concertDate = new Date(c.date);
      return concertDate >= today && concertDate <= endDate;
    });
  },

  // Stats sur les concerts disponibles
  async getStats(): Promise<{
    total: number;
    thisWeek: number;
    thisMonth: number;
    genres: Record<string, number>;
    venues: Record<string, number>;
  }> {
    const concerts = await this.getAllConcerts();
    const genres: Record<string, number> = {};
    const venues: Record<string, number> = {};

    concerts.forEach(c => {
      if (c.genre) {
        genres[c.genre] = (genres[c.genre] || 0) + 1;
      }
      venues[c.venue.name] = (venues[c.venue.name] || 0) + 1;
    });

    return {
      total: concerts.length,
      thisWeek: concerts.filter(c => isThisWeek(c.date)).length,
      thisMonth: concerts.filter(c => isThisMonth(c.date)).length,
      genres,
      venues,
    };
  },

  // Récupère un concert par ID
  async getConcertById(id: string): Promise<Concert | null> {
    const concerts = await this.getAllConcerts();
    return concerts.find(c => c.id === id) || null;
  },

  // Recherche de concerts par texte (multi-API)
  async searchConcerts(query: string): Promise<Concert[]> {
    const results: Concert[][] = [];

    // Recherche sur Ticketmaster
    if (API_CONFIG.ticketmaster?.enabled && API_CONFIG.ticketmaster?.apiKey) {
      try {
        const tmResults = await ticketmasterApi.searchByArtist(query);
        if (tmResults.length > 0) {
          results.push(tmResults);
        }
      } catch (error) {
        console.warn('[MUTE] Ticketmaster search error:', error);
      }
    }

    // Recherche sur Bandsintown
    if (API_CONFIG.bandsintown?.enabled) {
      try {
        const bitResults = await bandsintownApi.getArtistEventsInParis(query);
        if (bitResults.length > 0) {
          results.push(bitResults);
        }
      } catch (error) {
        console.warn('[MUTE] Bandsintown search error:', error);
      }
    }

    // Si resultats API, retourne les resultats fusionnes
    if (results.length > 0) {
      return mergeConcerts(results);
    }

    // Sinon recherche dans le cache local
    const allConcerts = await this.getAllConcerts();
    const lowerQuery = query.toLowerCase();
    return allConcerts.filter(c =>
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
  // Recupere tous les artistes depuis les concerts reels
  async getAllArtists(): Promise<Artist[]> {
    const cacheKey = 'all_artists';
    const cached = cache.get<Artist[]>(cacheKey);
    if (cached) return cached;

    // Extrait les artistes uniques des concerts reels
    const concerts = await concertService.getAllConcerts();
    const artistMap = new Map<string, Artist>();
    concerts.forEach(c => {
      if (!artistMap.has(c.artist.id)) {
        artistMap.set(c.artist.id, c.artist);
      }
    });

    const artists = Array.from(artistMap.values());
    cache.set(cacheKey, artists);
    return artists;
  },

  async getArtistById(id: string): Promise<Artist | null> {
    // Cherche dans les concerts reels
    const concerts = await concertService.getAllConcerts();
    const concert = concerts.find(c => c.artist.id === id);
    return concert?.artist || null;
  },

  // Recherche d'artistes via l'API Bandsintown
  async searchArtists(query: string): Promise<Artist[]> {
    // Recherche sur Bandsintown
    if (USE_REAL_API) {
      try {
        const apiArtist = await bandsintownApi.searchArtist(query);
        if (apiArtist) {
          return [apiArtist];
        }
      } catch (error) {
        console.warn('Artist search API error:', error);
      }
    }

    // Recherche dans les artistes des concerts caches
    const artists = await this.getAllArtists();
    const lowerQuery = query.toLowerCase();
    return artists.filter(a =>
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
  // Recupere toutes les salles depuis les concerts reels
  async getAllVenues(): Promise<Venue[]> {
    const cacheKey = 'all_venues';
    const cached = cache.get<Venue[]>(cacheKey);
    if (cached) return cached;

    // Extrait les salles uniques des concerts reels
    const concerts = await concertService.getAllConcerts();
    const venueMap = new Map<string, Venue>();
    concerts.forEach(c => {
      if (!venueMap.has(c.venue.id)) {
        venueMap.set(c.venue.id, c.venue);
      }
    });

    const venues = Array.from(venueMap.values());
    cache.set(cacheKey, venues);
    return venues;
  },

  async getVenueById(id: string): Promise<Venue | null> {
    // Cherche dans les concerts reels
    const concerts = await concertService.getAllConcerts();
    const concert = concerts.find(c => c.venue.id === id);
    return concert?.venue || null;
  },

  async searchVenues(query: string): Promise<Venue[]> {
    const venues = await this.getAllVenues();
    const lowerQuery = query.toLowerCase();
    return venues.filter(v =>
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
