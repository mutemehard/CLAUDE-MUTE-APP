// Store global avec Zustand et persistence AsyncStorage
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Concert, Artist, Venue, ConcertFilters, Favorite, UserLocation, AttendedConcert } from '../types';
import { concertService } from '../services';

interface AppState {
  // Donnees
  concerts: Concert[];
  todayConcerts: Concert[];
  favorites: Favorite[];
  attendedConcerts: AttendedConcert[];
  userLocation: UserLocation | null;
  preferredGenres: string[];

  // UI State
  isLoading: boolean;
  error: string | null;
  filters: ConcertFilters;
  searchQuery: string;
  recentSearches: string[];
  onboardingCompleted: boolean;

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
  getFavoritesByType: (type: Favorite['type']) => Favorite[];

  // Actions - Concerts vus
  addAttendedConcert: (concert: AttendedConcert) => void;
  removeAttendedConcert: (concertId: string) => void;
  updateAttendedConcert: (concertId: string, updates: Partial<AttendedConcert>) => void;

  // Actions - Location
  setUserLocation: (location: UserLocation | null) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Actions - Onboarding
  setOnboardingCompleted: (completed: boolean) => void;

  // Actions - Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const defaultFilters: ConcertFilters = {
  sortBy: 'date',
  sortOrder: 'asc',
  showSoldOut: true,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      concerts: [],
      todayConcerts: [],
      favorites: [],
      attendedConcerts: [],
      userLocation: null,
      isLoading: false,
      error: null,
      filters: defaultFilters,
      searchQuery: '',
      recentSearches: [],
      onboardingCompleted: false,
      _hasHydrated: false,

      // Hydration handler
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

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
        const existing = get().favorites.find(f => f.type === type && f.id === id);
        if (!existing) {
          set(state => ({
            favorites: [
              ...state.favorites,
              { type, id, addedAt: new Date().toISOString() }
            ]
          }));
        }
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

      // Get favorites by type
      getFavoritesByType: (type) => {
        return get().favorites.filter(f => f.type === type);
      },

      // Add attended concert
      addAttendedConcert: (concert) => {
        const existing = get().attendedConcerts.find(c => c.concertId === concert.concertId);
        if (!existing) {
          set(state => ({
            attendedConcerts: [...state.attendedConcerts, concert]
          }));
        }
      },

      // Remove attended concert
      removeAttendedConcert: (concertId) => {
        set(state => ({
          attendedConcerts: state.attendedConcerts.filter(c => c.concertId !== concertId)
        }));
      },

      // Update attended concert
      updateAttendedConcert: (concertId, updates) => {
        set(state => ({
          attendedConcerts: state.attendedConcerts.map(c =>
            c.concertId === concertId ? { ...c, ...updates } : c
          )
        }));
      },

      // Set location
      setUserLocation: (location) => {
        set({ userLocation: location });
      },

      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Add recent search
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        set(state => {
          const filtered = state.recentSearches.filter(s => s !== query);
          return {
            recentSearches: [query, ...filtered].slice(0, 10)
          };
        });
      },

      // Clear recent searches
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      // Set onboarding completed
      setOnboardingCompleted: (completed) => {
        set({ onboardingCompleted: completed });
      },
    }),
    {
      name: 'mute-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persister seulement certaines donnees
      partialize: (state) => ({
        favorites: state.favorites,
        attendedConcerts: state.attendedConcerts,
        filters: state.filters,
        recentSearches: state.recentSearches,
        onboardingCompleted: state.onboardingCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook pour attendre l'hydration
export const useHydration = () => {
  return useStore(state => state._hasHydrated);
};
