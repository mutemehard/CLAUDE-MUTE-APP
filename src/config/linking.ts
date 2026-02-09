// Configuration du deep linking pour l'app MUTE
import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

// Prefix pour les deep links
const prefix = Linking.createURL('/');

// URL scheme pour l'app
const APP_SCHEME = 'mute';
const WEB_URL = 'https://mute.app'; // Future URL web

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    `${APP_SCHEME}://`,
    WEB_URL,
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Search: 'search',
          Map: 'map',
          Favorites: 'favorites',
          Profile: 'profile',
        },
      },
      ConcertDetail: {
        path: 'concert/:concertId',
        parse: {
          concertId: (concertId: string) => concertId,
        },
      },
      ArtistDetail: {
        path: 'artist/:artistId',
        parse: {
          artistId: (artistId: string) => artistId,
        },
      },
      VenueDetail: {
        path: 'venue/:venueId',
        parse: {
          venueId: (venueId: string) => venueId,
        },
      },
      Settings: 'settings',
      Filters: 'filters',
      Onboarding: 'onboarding',
    },
  },
};

// Genere un deep link pour un concert
export const generateConcertLink = (concertId: string): string => {
  return Linking.createURL(`concert/${concertId}`);
};

// Genere un deep link pour un artiste
export const generateArtistLink = (artistId: string): string => {
  return Linking.createURL(`artist/${artistId}`);
};

// Genere un deep link pour une salle
export const generateVenueLink = (venueId: string): string => {
  return Linking.createURL(`venue/${venueId}`);
};

// Ouvre un deep link
export const openDeepLink = async (url: string): Promise<boolean> => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error opening deep link:', error);
    return false;
  }
};

// Gere les URLs entrantes
export const handleIncomingURL = (url: string): { screen: string; params?: Record<string, string> } | null => {
  try {
    const parsed = Linking.parse(url);

    if (!parsed.path) return null;

    // Parse les differents types de liens
    if (parsed.path.startsWith('concert/')) {
      const concertId = parsed.path.replace('concert/', '');
      return { screen: 'ConcertDetail', params: { concertId } };
    }

    if (parsed.path.startsWith('artist/')) {
      const artistId = parsed.path.replace('artist/', '');
      return { screen: 'ArtistDetail', params: { artistId } };
    }

    if (parsed.path.startsWith('venue/')) {
      const venueId = parsed.path.replace('venue/', '');
      return { screen: 'VenueDetail', params: { venueId } };
    }

    // Routes simples
    const simpleRoutes: Record<string, string> = {
      'home': 'Main',
      'search': 'Search',
      'map': 'Map',
      'favorites': 'Favorites',
      'profile': 'Profile',
      'settings': 'Settings',
    };

    if (simpleRoutes[parsed.path]) {
      return { screen: simpleRoutes[parsed.path] };
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};
