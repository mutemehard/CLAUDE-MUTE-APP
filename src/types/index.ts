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
