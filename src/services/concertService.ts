// Service pour gerer les donnees de concerts avec support multi-API
// Sources: Bandsintown, Ticketmaster, OpenAgenda, Resident Advisor, Shotgun, Dice, Paris Venues
import { Concert, ConcertFilters, Artist, Venue } from '../types';
import { bandsintownApi } from './api/bandsintown';
import { ticketmasterApi } from './api/ticketmaster';
import { openagendaApi } from './api/openagenda';
import { residentAdvisorApi } from './api/residentAdvisor';
import { shotgunApi } from './api/shotgun';
import { diceApi } from './api/dice';
import { parisVenuesApi } from './api/parisVenues';
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

// Normalise une chaine pour la comparaison (retire accents, ponctuation, espaces)
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/[^\w\s]/g, '') // Retire la ponctuation
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim();
};

// Calcule un score de similarite entre deux chaines (0-1)
const stringSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Levenshtein simplifie pour les cas courants
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const maxWords = Math.max(words1.length, words2.length);

  return commonWords / maxWords;
};

// Verifie si deux concerts sont probablement le meme evenement
const areSameConcert = (a: Concert, b: Concert): boolean => {
  // Meme date obligatoire
  if (a.date !== b.date) return false;

  // Similarite artiste
  const artistSimilarity = stringSimilarity(a.artist.name, b.artist.name);
  if (artistSimilarity < 0.6) return false;

  // Similarite venue
  const venueSimilarity = stringSimilarity(a.venue.name, b.venue.name);
  if (venueSimilarity < 0.5) return false;

  // Si artiste ET venue sont tres similaires, c'est probablement le meme
  return artistSimilarity >= 0.8 || venueSimilarity >= 0.8;
};

// Priorite des sources (plus haut = plus fiable)
const SOURCE_PRIORITY: Record<string, number> = {
  ticketmaster: 10,
  bandsintown: 9,
  venue: 8,
  dice: 7,
  shotgun: 6,
  residentAdvisor: 5,
  openagenda: 4,
  mock: 1,
};

// Fusionne les concerts de differentes sources et supprime les doublons intelligemment
const mergeConcerts = (concertArrays: Concert[][]): Concert[] => {
  const allConcerts = concertArrays.flat();

  // Tri par priorite de source (pour garder les plus fiables)
  allConcerts.sort((a, b) => {
    const priorityA = SOURCE_PRIORITY[a.source || 'mock'] || 0;
    const priorityB = SOURCE_PRIORITY[b.source || 'mock'] || 0;
    return priorityB - priorityA;
  });

  const uniqueConcerts: Concert[] = [];

  for (const concert of allConcerts) {
    const isDuplicate = uniqueConcerts.some(existing => areSameConcert(existing, concert));
    if (!isDuplicate) {
      uniqueConcerts.push(concert);
    }
  }

  return uniqueConcerts;
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
    const startTime = Date.now();

    console.log('[MUTE] Fetching concerts from all sources...');

    // Fetch en parallele depuis toutes les sources
    const fetchPromises: Promise<{ source: string; concerts: Concert[] }>[] = [];

    // 1. Ticketmaster - billetterie officielle
    if (API_CONFIG.ticketmaster?.enabled && API_CONFIG.ticketmaster?.apiKey) {
      fetchPromises.push(
        ticketmasterApi.getConcertsInParis({ size: 200 })
          .then(concerts => ({ source: 'Ticketmaster', concerts }))
          .catch(err => {
            errors.push('Ticketmaster');
            console.warn('[MUTE] Ticketmaster error:', err);
            return { source: 'Ticketmaster', concerts: [] };
          })
      );
    }

    // 2. Bandsintown - par artistes populaires
    if (API_CONFIG.bandsintown?.enabled) {
      fetchPromises.push(
        (async () => {
          const batchSize = 10;
          const results: Concert[] = [];

          for (let i = 0; i < POPULAR_ARTISTS.length; i += batchSize) {
            const batch = POPULAR_ARTISTS.slice(i, i + batchSize);
            const batchPromises = batch.map(artistName =>
              bandsintownApi.getArtistEventsInParis(artistName).catch(() => [])
            );

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(r => results.push(...r));

            if (i + batchSize < POPULAR_ARTISTS.length) {
              await delay(150);
            }
          }

          return { source: 'Bandsintown', concerts: results };
        })().catch(err => {
          errors.push('Bandsintown');
          console.warn('[MUTE] Bandsintown error:', err);
          return { source: 'Bandsintown', concerts: [] };
        })
      );
    }

    // 3. OpenAgenda - evenements locaux
    if (API_CONFIG.openagenda?.enabled && API_CONFIG.openagenda?.apiKey) {
      fetchPromises.push(
        openagendaApi.getWeekEvents()
          .then(concerts => ({ source: 'OpenAgenda', concerts }))
          .catch(err => {
            errors.push('OpenAgenda');
            return { source: 'OpenAgenda', concerts: [] };
          })
      );
    }

    // 4. Resident Advisor - electro/techno
    fetchPromises.push(
      residentAdvisorApi.getParisEvents()
        .then(concerts => ({ source: 'Resident Advisor', concerts }))
        .catch(err => {
          errors.push('Resident Advisor');
          console.warn('[MUTE] RA error:', err);
          return { source: 'Resident Advisor', concerts: [] };
        })
    );

    // 5. Shotgun - electro/clubs
    fetchPromises.push(
      shotgunApi.getParisEvents()
        .then(concerts => ({ source: 'Shotgun', concerts }))
        .catch(err => {
          errors.push('Shotgun');
          console.warn('[MUTE] Shotgun error:', err);
          return { source: 'Shotgun', concerts: [] };
        })
    );

    // 6. Dice - billetterie alternative
    fetchPromises.push(
      diceApi.getParisEvents()
        .then(concerts => ({ source: 'Dice', concerts }))
        .catch(err => {
          errors.push('Dice');
          console.warn('[MUTE] Dice error:', err);
          return { source: 'Dice', concerts: [] };
        })
    );

    // 7. Paris Venues - salles parisiennes directement
    fetchPromises.push(
      parisVenuesApi.getAllEvents()
        .then(concerts => ({ source: 'Paris Venues', concerts }))
        .catch(err => {
          errors.push('Paris Venues');
          console.warn('[MUTE] Paris Venues error:', err);
          return { source: 'Paris Venues', concerts: [] };
        })
    );

    // Execute toutes les requetes en parallele
    const results = await Promise.all(fetchPromises);

    // Log les resultats par source
    results.forEach(({ source, concerts }) => {
      if (concerts.length > 0) {
        allConcerts.push(concerts);
        console.log(`[MUTE] ${source}: ${concerts.length} concerts`);
      }
    });

    // Fusion et deduplication
    const merged = mergeConcerts(allConcerts);
    const elapsed = Date.now() - startTime;

    console.log(`[MUTE] Total: ${merged.length} unique concerts (${elapsed}ms)`);

    if (errors.length > 0) {
      console.warn('[MUTE] Sources with errors:', errors.join(', '));
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
    const searchPromises: Promise<Concert[]>[] = [];

    // Recherche sur Ticketmaster
    if (API_CONFIG.ticketmaster?.enabled && API_CONFIG.ticketmaster?.apiKey) {
      searchPromises.push(
        ticketmasterApi.searchByArtist(query).catch(() => [])
      );
    }

    // Recherche sur Bandsintown
    if (API_CONFIG.bandsintown?.enabled) {
      searchPromises.push(
        bandsintownApi.getArtistEventsInParis(query).catch(() => [])
      );
    }

    // Recherche sur Resident Advisor
    searchPromises.push(
      residentAdvisorApi.searchByArtist(query).catch(() => [])
    );

    // Recherche sur Shotgun
    searchPromises.push(
      shotgunApi.searchByArtist(query).catch(() => [])
    );

    // Recherche sur Dice
    searchPromises.push(
      diceApi.searchByArtist(query).catch(() => [])
    );

    // Recherche dans les salles parisiennes
    searchPromises.push(
      parisVenuesApi.searchByArtist(query).catch(() => [])
    );

    // Execute toutes les recherches en parallele
    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(r => {
      if (r.length > 0) results.push(r);
    });

    // Si resultats API, retourne les resultats fusionnes
    if (results.length > 0) {
      return mergeConcerts(results);
    }

    // Sinon recherche dans le cache local
    const allConcerts = await this.getAllConcerts();
    const normalizedQuery = normalizeString(query);
    return allConcerts.filter(c =>
      normalizeString(c.artist.name).includes(normalizedQuery) ||
      normalizeString(c.venue.name).includes(normalizedQuery) ||
      (c.genre && normalizeString(c.genre).includes(normalizedQuery))
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
