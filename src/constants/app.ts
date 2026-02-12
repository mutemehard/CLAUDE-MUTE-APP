// Constantes globales de l'application MUTE

// Nom de l'app
export const APP_NAME = 'MUTE';
export const APP_TAGLINE = "L'app des concerts a Paris";
export const APP_VERSION = '1.0.0';

// URLs
export const APP_STORE_URL = 'https://apps.apple.com/app/mute/id123456789';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mute.app';
export const WEBSITE_URL = 'https://mute.app';
export const SUPPORT_EMAIL = 'support@mute.app';

// Deep links
export const DEEP_LINK_SCHEME = 'mute';
export const DEEP_LINK_PREFIX = 'mute://';

// Limites
export const MAX_RECENT_SEARCHES = 10;
export const MAX_FAVORITES = 500;
export const MAX_FRIENDS = 1000;
export const CONCERTS_PER_PAGE = 20;

// Timeouts (en ms)
export const API_TIMEOUT = 15000;
export const SEARCH_DEBOUNCE = 300;
export const LOCATION_TIMEOUT = 10000;

// Cache durations (en ms)
export const CACHE_CONCERTS = 30 * 60 * 1000; // 30 minutes
export const CACHE_ARTISTS = 60 * 60 * 1000; // 1 heure
export const CACHE_VENUES = 24 * 60 * 60 * 1000; // 24 heures

// Localisation (Paris par defaut)
export const DEFAULT_LOCATION = {
  latitude: 48.8566,
  longitude: 2.3522,
  city: 'Paris',
  country: 'France',
};

// Distance max pour "a proximite" (en km)
export const NEARBY_RADIUS_KM = 5;

// Animation durations (en ms)
export const ANIMATION_FAST = 150;
export const ANIMATION_NORMAL = 300;
export const ANIMATION_SLOW = 500;

// Tab bar
export const TAB_BAR_HEIGHT = 60;
export const TAB_ICON_SIZE = 24;

// Dates
export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';

// Social
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_BIO_LENGTH = 160;
export const MAX_DISPLAY_NAME_LENGTH = 30;
