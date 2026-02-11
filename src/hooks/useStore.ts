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
  ProfileVisibility,
  ArtistStats,
  FollowRequest,
  IncomingFollowRequest,
  Friendship,
} from '../types';
import { concertService } from '../services';

// Visibilite par defaut du profil
const defaultProfileVisibility: ProfileVisibility = {
  score: 'friends',
  history: 'friends',
  activity: 'friends',
  followedArtists: 'public',
};

interface AppState {
  // Donnees
  concerts: Concert[];
  todayConcerts: Concert[];
  favorites: Favorite[];
  attendedConcerts: AttendedConcert[];
  userLocation: UserLocation | null;
  preferredGenres: string[];
  followedArtists: string[]; // IDs des artistes suivis

  // Profile settings
  profileVisibility: ProfileVisibility;

  // Social (Facebook Events style)
  participations: ConcertParticipation[];
  friends: Friend[];
  friendsActivity: FriendActivity[];

  // Mutual Follow System (BeReal style)
  outgoingFollowRequests: FollowRequest[];
  incomingFollowRequests: IncomingFollowRequest[];
  friendships: Friendship[];

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
  getArtistStats: (artistName: string) => ArtistStats;

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

  // Actions - Follow Artists
  followArtist: (artistId: string) => void;
  unfollowArtist: (artistId: string) => void;
  isFollowingArtist: (artistId: string) => boolean;

  // Actions - Profile Visibility
  setProfileVisibility: (visibility: Partial<ProfileVisibility>) => void;

  // Actions - Social (Participations)
  setParticipation: (concertId: string, status: ParticipationStatus, concertInfo: { artistName: string; venueName: string; date: string }) => void;
  getParticipation: (concertId: string) => ParticipationStatus;
  getUpcomingParticipations: (status?: ParticipationStatus) => ConcertParticipation[];

  // Actions - Social (Friends)
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  getFriendsForConcert: (concertId: string) => { going: Friend[]; interested: Friend[] };

  // Actions - Mutual Follow (BeReal style)
  sendFollowRequest: (toUserId: string, toUserName: string, toUserAvatar?: string) => void;
  cancelFollowRequest: (requestId: string) => void;
  acceptFollowRequest: (requestId: string) => void;
  declineFollowRequest: (requestId: string) => void;
  removeFriendship: (friendshipId: string) => void;
  getPendingRequestsCount: () => number;
  isFriendWith: (userId: string) => boolean;
  hasSentRequestTo: (userId: string) => boolean;

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
      followedArtists: [],
      profileVisibility: defaultProfileVisibility,
      participations: [],
      friends: [],
      friendsActivity: [],
      outgoingFollowRequests: [],
      incomingFollowRequests: [],
      friendships: [],
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

      // === Follow Artists ===

      followArtist: (artistId) => {
        set(state => ({
          followedArtists: state.followedArtists.includes(artistId)
            ? state.followedArtists
            : [...state.followedArtists, artistId]
        }));
      },

      unfollowArtist: (artistId) => {
        set(state => ({
          followedArtists: state.followedArtists.filter(id => id !== artistId)
        }));
      },

      isFollowingArtist: (artistId) => {
        return get().followedArtists.includes(artistId);
      },

      // === Profile Visibility ===

      setProfileVisibility: (visibility) => {
        set(state => ({
          profileVisibility: { ...state.profileVisibility, ...visibility }
        }));
      },

      // === Artist Stats (calculated from attendedConcerts) ===

      getArtistStats: (artistName) => {
        const concerts = get().attendedConcerts.filter(
          c => c.artistName.toLowerCase() === artistName.toLowerCase()
        );

        if (concerts.length === 0) {
          return {
            artistId: '',
            artistName,
            seenCount: 0,
            venues: [],
            totalScore: 0,
          };
        }

        const sortedByDate = [...concerts].sort((a, b) => a.date.localeCompare(b.date));
        const venues = [...new Set(concerts.map(c => c.venueName))];

        return {
          artistId: concerts[0].concertId.split('_')[0] || '',
          artistName,
          seenCount: concerts.length,
          firstSeen: sortedByDate[0].date,
          lastSeen: sortedByDate[sortedByDate.length - 1].date,
          venues,
          totalScore: concerts.reduce((sum, c) => sum + (c.rating || 0), 0),
        };
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

      // === Mutual Follow System (BeReal style) ===

      // Envoyer une demande de suivi
      sendFollowRequest: (toUserId, toUserName, toUserAvatar) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const request: FollowRequest = {
          id: requestId,
          fromUserId: 'current_user', // En production: ID de l'utilisateur connecte
          toUserId,
          toUserName,
          toUserAvatar,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          outgoingFollowRequests: [...state.outgoingFollowRequests, request]
        }));
      },

      // Annuler une demande envoyee
      cancelFollowRequest: (requestId) => {
        set(state => ({
          outgoingFollowRequests: state.outgoingFollowRequests.filter(r => r.id !== requestId)
        }));
      },

      // Accepter une demande recue (cree une amitie mutuelle)
      acceptFollowRequest: (requestId) => {
        const request = get().incomingFollowRequests.find(r => r.id === requestId);
        if (!request) return;

        const friendshipId = `friendship_${Date.now()}`;
        const now = new Date().toISOString();

        // Creer l'amitie
        const friendship: Friendship = {
          id: friendshipId,
          friendId: request.fromUserId,
          friendName: request.fromUserName,
          friendAvatar: request.fromUserAvatar,
          createdAt: now,
          mutualSince: now,
        };

        // Aussi ajouter comme Friend (pour compatibilite avec le systeme existant)
        const friend: Friend = {
          id: request.fromUserId,
          displayName: request.fromUserName,
          avatarUrl: request.fromUserAvatar,
          addedAt: now,
        };

        set(state => ({
          incomingFollowRequests: state.incomingFollowRequests.filter(r => r.id !== requestId),
          friendships: [...state.friendships, friendship],
          friends: [...state.friends, friend],
        }));
      },

      // Refuser une demande recue
      declineFollowRequest: (requestId) => {
        set(state => ({
          incomingFollowRequests: state.incomingFollowRequests.filter(r => r.id !== requestId)
        }));
      },

      // Supprimer une amitie
      removeFriendship: (friendshipId) => {
        const friendship = get().friendships.find(f => f.id === friendshipId);
        if (!friendship) return;

        set(state => ({
          friendships: state.friendships.filter(f => f.id !== friendshipId),
          friends: state.friends.filter(f => f.id !== friendship.friendId),
          friendsActivity: state.friendsActivity.filter(a => a.friendId !== friendship.friendId),
        }));
      },

      // Compter les demandes en attente
      getPendingRequestsCount: () => {
        return get().incomingFollowRequests.length;
      },

      // Verifier si on est ami avec quelqu'un
      isFriendWith: (userId) => {
        return get().friendships.some(f => f.friendId === userId);
      },

      // Verifier si on a deja envoye une demande
      hasSentRequestTo: (userId) => {
        return get().outgoingFollowRequests.some(
          r => r.toUserId === userId && r.status === 'pending'
        );
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
        // Artists
        followedArtists: state.followedArtists,
        // Profile settings
        profileVisibility: state.profileVisibility,
        // Social data
        participations: state.participations,
        friends: state.friends,
        friendsActivity: state.friendsActivity,
        // Mutual follow data
        outgoingFollowRequests: state.outgoingFollowRequests,
        incomingFollowRequests: state.incomingFollowRequests,
        friendships: state.friendships,
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
