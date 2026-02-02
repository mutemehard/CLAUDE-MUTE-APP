// Store global avec Zustand
import { create } from 'zustand';
import { Concert, Artist, Venue, ConcertFilters, Favorite, UserLocation } from '../types';
import { concertService } from '../services';

interface AppState {
  // Données
  concerts: Concert[];
  todayConcerts: Concert[];
  favorites: Favorite[];
  userLocation: UserLocation | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: ConcertFilters;
  searchQuery: string;

  // Actions - Concerts
  fetchConcerts: () => Promise<void>;
  fetchTodayConcerts: () => Promise<void>;
  searchConcerts: (query: string) => Promise<void>;

  // Actions - Filtres
  setFilters: (filters: Partial<ConcertFilters>) => void;
  resetFilters: () => void;

  // Actions - Favoris
  addFavorite: (type: Favorite['type'], id: string) => void;
  removeFavorite: (type: Favorite['type'], id: string) => void;
  isFavorite: (type: Favorite['type'], id: string) => boolean;

  // Actions - Location
  setUserLocation: (location: UserLocation | null) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
}

const defaultFilters: ConcertFilters = {
  sortBy: 'date',
  sortOrder: 'asc',
  showSoldOut: true,
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  concerts: [],
  todayConcerts: [],
  favorites: [],
  userLocation: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,
  searchQuery: '',

  // Fetch all concerts
  fetchConcerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const filters = get().filters;
      const concerts = await concertService.getConcerts(filters);
      set({ concerts, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des concerts', isLoading: false });
    }
  },

  // Fetch today's concerts
  fetchTodayConcerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayConcerts = await concertService.getTodayConcerts();
      set({ todayConcerts, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur lors du chargement', isLoading: false });
    }
  },

  // Search concerts
  searchConcerts: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      if (!query.trim()) {
        const concerts = await concertService.getAllConcerts();
        set({ concerts, isLoading: false });
        return;
      }
      const concerts = await concertService.searchConcerts(query);
      set({ concerts, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur lors de la recherche', isLoading: false });
    }
  },

  // Set filters
  setFilters: (newFilters: Partial<ConcertFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Refetch with new filters
    get().fetchConcerts();
  },

  // Reset filters
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchConcerts();
  },

  // Add to favorites
  addFavorite: (type, id) => {
    set(state => ({
      favorites: [
        ...state.favorites,
        { type, id, addedAt: new Date().toISOString() }
      ]
    }));
  },

  // Remove from favorites
  removeFavorite: (type, id) => {
    set(state => ({
      favorites: state.favorites.filter(f => !(f.type === type && f.id === id))
    }));
  },

  // Check if favorite
  isFavorite: (type, id) => {
    return get().favorites.some(f => f.type === type && f.id === id);
  },

  // Set location
  setUserLocation: (location) => {
    set({ userLocation: location });
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
}));
