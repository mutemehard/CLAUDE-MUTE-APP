// Types principaux pour l'application de concerts

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  genres: string[];
  popularity?: number; // 0-100
  description?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  arrondissement?: string; // Pour Paris
  latitude: number;
  longitude: number;
  capacity?: number;
  imageUrl?: string;
  website?: string;
}

export interface Concert {
  id: string;
  artist: Artist;
  venue: Venue;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime?: string;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  ticketUrl?: string;
  source: DataSource;
  sourceId: string; // ID from the original API
  genre?: string;
  isSoldOut?: boolean;
  imageUrl?: string;
  description?: string;
}

export type DataSource =
  | 'bandsintown'
  | 'songkick'
  | 'ticketmaster'
  | 'eventbrite'
  | 'openagenda'
  | 'shotgun'
  | 'residentAdvisor'
  | 'parisBy'
  | 'fnac'
  | 'digitick'
  | 'manual';

export interface ConcertFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  genres?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  venues?: string[]; // venue IDs
  arrondissements?: string[];
  maxDistance?: number; // in km
  showSoldOut?: boolean;
  sortBy?: 'date' | 'popularity' | 'price' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

export interface SearchResult {
  artists: Artist[];
  concerts: Concert[];
  venues: Venue[];
}

export interface Favorite {
  type: 'artist' | 'venue' | 'concert';
  id: string;
  addedAt: string;
}

export interface UserPreferences {
  favoriteGenres: string[];
  favoriteCities: string[];
  notificationsEnabled: boolean;
  notifyNewConcerts: boolean;
  notifyPriceDrops: boolean;
  notifyNearby: boolean;
  nearbyRadius: number; // in km
}

// Navigation types
export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Map: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ConcertDetail: { concertId: string };
  ArtistDetail: { artistId: string };
  VenueDetail: { venueId: string };
  Filters: undefined;
  Settings: undefined;
  Map: undefined;
  Social: undefined;
};

// Type pour l'historique des concerts vus
export interface AttendedConcert {
  concertId: string;
  artistName: string;
  venueName: string;
  date: string;
  addedAt: string;
  rating?: number; // 1-5
  notes?: string;
  photos?: string[];
}

// Profil utilisateur avec historique
export interface UserProfile {
  id?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  attendedConcerts: AttendedConcert[];
  favoriteArtists: string[];
  favoriteVenues: string[];
  createdAt?: string;
}

// === SOCIAL FEATURES (Facebook Events style) ===

// Statut de participation a un concert
export type ParticipationStatus = 'going' | 'interested' | 'not_going' | null;

// Participation utilisateur a un concert
export interface ConcertParticipation {
  concertId: string;
  status: ParticipationStatus;
  addedAt: string;
  artistName: string;
  venueName: string;
  date: string;
}

// Ami/contact
export interface Friend {
  id: string;
  displayName: string;
  avatarUrl?: string;
  addedAt: string;
}

// Activite d'un ami sur un concert
export interface FriendActivity {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  concertId: string;
  artistName: string;
  venueName: string;
  date: string;
  status: ParticipationStatus;
  timestamp: string;
}

// Resume des participations a un concert
export interface ConcertSocialInfo {
  concertId: string;
  goingCount: number;
  interestedCount: number;
  friendsGoing: Friend[];
  friendsInterested: Friend[];
}

// Stats sociales de l'utilisateur
export interface SocialStats {
  totalFriends: number;
  concertsGoing: number;
  concertsInterested: number;
  sharedConcertsWithFriends: number;
}

// Visibilite du profil (comme BeReal - controle utilisateur)
export type VisibilityLevel = 'public' | 'friends' | 'private';

export interface ProfileVisibility {
  score: VisibilityLevel;          // Visibilite du score total
  history: VisibilityLevel;        // Visibilite de l'historique des concerts
  activity: VisibilityLevel;       // Visibilite de l'activite (going/interested)
  followedArtists: VisibilityLevel; // Visibilite des artistes suivis
}

// Stats par artiste (vu X fois, etc.)
export interface ArtistStats {
  artistId: string;
  artistName: string;
  seenCount: number;          // Nombre de fois vu
  firstSeen?: string;         // Date du premier concert vu
  lastSeen?: string;          // Date du dernier concert vu
  venues: string[];           // Salles ou l'artiste a ete vu
  totalScore: number;         // Score total pour cet artiste
}

// === MUTUAL FOLLOW SYSTEM (BeReal style) ===

// Statut d'une demande de suivi
export type FollowRequestStatus = 'pending' | 'accepted' | 'declined';

// Demande de suivi envoyee
export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  status: FollowRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

// Demande de suivi recue
export interface IncomingFollowRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  createdAt: string;
}

// Relation d'amitie (follow mutuel confirme)
export interface Friendship {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  createdAt: string;          // Date de creation de l'amitie
  mutualSince: string;        // Date du follow mutuel
}
