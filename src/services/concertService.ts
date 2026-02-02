// Service pour gérer les données de concerts
import { Concert, ConcertFilters, Artist, Venue } from '../types';
import { mockConcerts, mockArtists, mockVenues } from './mockData';

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
      c.genre && filters.genres!.includes(c.genre)
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

// API publique du service
export const concertService = {
  // Récupère tous les concerts
  async getAllConcerts(): Promise<Concert[]> {
    await delay(300);
    return mockConcerts.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  // Récupère les concerts avec filtres
  async getConcerts(filters?: ConcertFilters): Promise<Concert[]> {
    await delay(300);
    const concerts = await this.getAllConcerts();
    if (!filters) return concerts;
    return filterConcerts(concerts, filters);
  },

  // Concerts d'aujourd'hui
  async getTodayConcerts(): Promise<Concert[]> {
    await delay(200);
    return mockConcerts.filter(c => isToday(c.date));
  },

  // Concerts de la semaine
  async getWeekConcerts(): Promise<Concert[]> {
    await delay(200);
    return mockConcerts.filter(c => isThisWeek(c.date));
  },

  // Récupère un concert par ID
  async getConcertById(id: string): Promise<Concert | null> {
    await delay(100);
    return mockConcerts.find(c => c.id === id) || null;
  },

  // Recherche de concerts par texte
  async searchConcerts(query: string): Promise<Concert[]> {
    await delay(200);
    const lowerQuery = query.toLowerCase();
    return mockConcerts.filter(c =>
      c.artist.name.toLowerCase().includes(lowerQuery) ||
      c.venue.name.toLowerCase().includes(lowerQuery) ||
      c.genre?.toLowerCase().includes(lowerQuery)
    );
  },

  // Récupère les concerts d'un artiste
  async getConcertsByArtist(artistId: string): Promise<Concert[]> {
    await delay(200);
    return mockConcerts.filter(c => c.artist.id === artistId);
  },

  // Récupère les concerts d'une salle
  async getConcertsByVenue(venueId: string): Promise<Concert[]> {
    await delay(200);
    return mockConcerts.filter(c => c.venue.id === venueId);
  },
};

export const artistService = {
  async getAllArtists(): Promise<Artist[]> {
    await delay(200);
    return mockArtists;
  },

  async getArtistById(id: string): Promise<Artist | null> {
    await delay(100);
    return mockArtists.find(a => a.id === id) || null;
  },

  async searchArtists(query: string): Promise<Artist[]> {
    await delay(200);
    const lowerQuery = query.toLowerCase();
    return mockArtists.filter(a =>
      a.name.toLowerCase().includes(lowerQuery) ||
      a.genres.some(g => g.toLowerCase().includes(lowerQuery))
    );
  },

  async getPopularArtists(limit: number = 10): Promise<Artist[]> {
    await delay(200);
    return mockArtists
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  },
};

export const venueService = {
  async getAllVenues(): Promise<Venue[]> {
    await delay(200);
    return mockVenues;
  },

  async getVenueById(id: string): Promise<Venue | null> {
    await delay(100);
    return mockVenues.find(v => v.id === id) || null;
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
    await delay(200);
    // Trie par capacite (les plus grandes salles sont souvent les plus populaires)
    return mockVenues
      .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
      .slice(0, limit);
  },
};
