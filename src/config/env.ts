// Configuration d'environnement pour MUTE
// Les variables sont lues depuis les variables d'environnement ou utilisent des valeurs par defaut

// Mode de l'application
export const ENV = {
  // Mode development ou production
  isDev: __DEV__ || process.env.NODE_ENV === 'development',

  // Utiliser les donnees mock quand les APIs ne repondent pas
  useMockFallback: true,

  // Timeout pour les requetes API (en ms)
  apiTimeout: 15000,

  // Activer les logs de debug
  debugLogs: __DEV__ || false,

  // Version de l'app
  appVersion: '1.0.0',

  // URL de base pour les deep links
  deepLinkScheme: 'mute',
  deepLinkBaseUrl: 'https://mute.app',
};

// Cles API (a configurer dans les variables d'environnement)
export const API_KEYS = {
  // Ticketmaster Discovery API
  // Inscription: https://developer.ticketmaster.com/
  ticketmaster: process.env.TICKETMASTER_API_KEY || '',

  // Songkick API (si utilise)
  songkick: process.env.SONGKICK_API_KEY || '',

  // OpenAgenda API
  openagenda: process.env.OPENAGENDA_API_KEY || '',

  // Google Maps (pour la carte)
  googleMaps: process.env.GOOGLE_MAPS_API_KEY || '',
};

// Configuration des features
export const FEATURES = {
  // Activer les notifications push
  pushNotifications: true,

  // Activer la geolocalisation
  location: true,

  // Activer l'integration calendrier
  calendar: true,

  // Activer les fonctionnalites sociales
  social: true,

  // Activer le mode offline avec cache
  offlineMode: true,

  // Activer les analytics (a implementer)
  analytics: false,
};

// Configuration du cache
export const CACHE_CONFIG = {
  // Duree de validite du cache des concerts (en ms)
  concertsCacheDuration: 30 * 60 * 1000, // 30 minutes

  // Duree de validite du cache des artistes (en ms)
  artistsCacheDuration: 60 * 60 * 1000, // 1 heure

  // Duree de validite du cache des salles (en ms)
  venuesCacheDuration: 24 * 60 * 60 * 1000, // 24 heures
};

// Log conditionnel
export const log = (message: string, ...args: unknown[]): void => {
  if (ENV.debugLogs) {
    console.log(`[MUTE] ${message}`, ...args);
  }
};

export const logError = (message: string, error?: unknown): void => {
  console.error(`[MUTE Error] ${message}`, error);
};

// Declaration globale pour __DEV__
declare const __DEV__: boolean;
