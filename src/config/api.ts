// Configuration des APIs et environnement
// Pour activer les vraies APIs, configurez les cles ci-dessous

export const API_CONFIG = {
  // Bandsintown API (gratuite, pas de cle requise)
  // Documentation: https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0
  bandsintown: {
    appId: 'mute_concert_app',
    enabled: true,
  },

  // Ticketmaster Discovery API
  // Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
  // Inscription: https://developer.ticketmaster.com/ (gratuit, 5000 requetes/jour)
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY || '', // Votre cle API Ticketmaster
    enabled: true, // Active meme sans cle pour tester
  },

  // Songkick API
  // Documentation: https://www.songkick.com/developer
  songkick: {
    apiKey: process.env.SONGKICK_API_KEY || '',
    enabled: false,
  },

  // OpenAgenda API
  // Documentation: https://openagenda.zendesk.com/hc/fr/articles/203034982
  openagenda: {
    apiKey: process.env.OPENAGENDA_API_KEY || '',
    agendaIds: [],
    enabled: false,
  },

  // Configuration generale
  cache: {
    duration: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 seconde
    maxDelay: 10000, // 10 secondes
  },

  // Rate limiting
  rateLimit: {
    requestsPerSecond: 5,
    burstLimit: 10,
  },

  // Mode debug
  debug: __DEV__ || false,
};

// Verifie si au moins une API est configuree
export const isApiConfigured = (): boolean => {
  return (
    API_CONFIG.bandsintown.enabled ||
    (API_CONFIG.ticketmaster.enabled && !!API_CONFIG.ticketmaster.apiKey) ||
    (API_CONFIG.openagenda.enabled && !!API_CONFIG.openagenda.apiKey)
  );
};

// Liste les APIs actives
export const getActiveApis = (): string[] => {
  const apis: string[] = [];
  if (API_CONFIG.bandsintown.enabled) apis.push('Bandsintown');
  if (API_CONFIG.ticketmaster.enabled && API_CONFIG.ticketmaster.apiKey) apis.push('Ticketmaster');
  if (API_CONFIG.songkick.enabled && API_CONFIG.songkick.apiKey) apis.push('Songkick');
  if (API_CONFIG.openagenda.enabled && API_CONFIG.openagenda.apiKey) apis.push('OpenAgenda');
  return apis;
};

// Log de debug conditionnel
export const debugLog = (message: string, ...args: any[]): void => {
  if (API_CONFIG.debug) {
    console.log(`[MUTE] ${message}`, ...args);
  }
};

// Variable globale pour le mode dev
declare const __DEV__: boolean;
