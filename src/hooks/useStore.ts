// Store global avec Zustand et persistence AsyncStorage
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Concert,
  Artist,
  Venue,
  ConcertFilters,
  Favorite,
  UserLocation,
  AttendedConcert,
  ConcertParticipation,
  ParticipationStatus,
  Friend,
  FriendActivity,
} from '../types';
import { concertService } from '../services';

interface AppState {
  // Donnees
  concerts: Concert[];
  todayConcerts: Concert[];
  favorites: Favorite[];
  attendedConcerts: AttendedConcert[];
  userLocation: UserLocation | null;
  preferredGenres: string[];

  // Social (Facebook Events style)
  participations: ConcertParticipation[];
  friends: Friend[];
  friendsActivity: FriendActivity[];

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

  // Actions - Preferences
  setPreferredGenres: (genres: string[]) => void;
  addPreferredGenre: (genre: string) => void;
  removePreferredGenre: (genre: string) => void;

  // Actions - Social (Participations)
  setParticipation: (concertId: string, status: ParticipationStatus, concertInfo: { artistName: string; venueName: string; date: string }) => void;
  getParticipation: (concertId: string) => ParticipationStatus;
  getUpcomingParticipations: (status?: ParticipationStatus) => ConcertParticipation[];

  // Actions - Social (Friends)
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  getFriendsForConcert: (concertId: string) => { going: Friend[]; interested: Friend[] };

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
      preferredGenres: [],
      participations: [],
      friends: [],
      friendsActivity: [],
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

      // Preferences - Genres
      setPreferredGenres: (genres) => {
        set({ preferredGenres: genres });
      },

      addPreferredGenre: (genre) => {
        set(state => ({
          preferredGenres: state.preferredGenres.includes(genre)
            ? state.preferredGenres
            : [...state.preferredGenres, genre]
        }));
      },

      removePreferredGenre: (genre) => {
        set(state => ({
          preferredGenres: state.preferredGenres.filter(g => g !== genre)
        }));
      },

      // === Social Actions (Facebook Events style) ===

      // Definir la participation a un concert (Going/Interested)
      setParticipation: (concertId, status, concertInfo) => {
        set(state => {
          const existing = state.participations.findIndex(p => p.concertId === concertId);

          if (status === null) {
            // Retirer la participation
            return {
              participations: state.participations.filter(p => p.concertId !== concertId)
            };
          }

          const participation: ConcertParticipation = {
            concertId,
            status,
            addedAt: new Date().toISOString(),
            ...concertInfo,
          };

          if (existing >= 0) {
            // Mettre a jour
            const updated = [...state.participations];
            updated[existing] = participation;
            return { participations: updated };
          } else {
            // Ajouter
            return { participations: [...state.participations, participation] };
          }
        });
      },

      // Recuperer le statut de participation
      getParticipation: (concertId) => {
        const participation = get().participations.find(p => p.concertId === concertId);
        return participation?.status || null;
      },

      // Recuperer les concerts a venir avec participation
      getUpcomingParticipations: (status?) => {
        const now = new Date().toISOString().split('T')[0];
        return get().participations.filter(p => {
          const isFuture = p.date >= now;
          const matchesStatus = !status || p.status === status;
          return isFuture && matchesStatus;
        }).sort((a, b) => a.date.localeCompare(b.date));
      },

      // Ajouter un ami
      addFriend: (friend) => {
        set(state => {
          if (state.friends.some(f => f.id === friend.id)) {
            return state;
          }
          return { friends: [...state.friends, friend] };
        });
      },

      // Retirer un ami
      removeFriend: (friendId) => {
        set(state => ({
          friends: state.friends.filter(f => f.id !== friendId),
          friendsActivity: state.friendsActivity.filter(a => a.friendId !== friendId),
        }));
      },

      // Recuperer les amis qui participent a un concert
      getFriendsForConcert: (concertId) => {
        const { friends, friendsActivity } = get();
        const concertActivities = friendsActivity.filter(a => a.concertId === concertId);

        const going = concertActivities
          .filter(a => a.status === 'going')
          .map(a => friends.find(f => f.id === a.friendId))
          .filter((f): f is Friend => f !== undefined);

        const interested = concertActivities
          .filter(a => a.status === 'interested')
          .map(a => friends.find(f => f.id === a.friendId))
          .filter((f): f is Friend => f !== undefined);

        return { going, interested };
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
        preferredGenres: state.preferredGenres,
        onboardingCompleted: state.onboardingCompleted,
        // Social data
        participations: state.participations,
        friends: state.friends,
        friendsActivity: state.friendsActivity,
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
