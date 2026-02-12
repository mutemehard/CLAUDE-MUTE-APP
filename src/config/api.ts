// Configuration des APIs et environnement
// Sources de donnees: APIs gratuites + scrapers web

export const API_CONFIG = {
  // === APIs avec cle (optionnelles) ===

  // Ticketmaster Discovery API
  // Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
  // Inscription: https://developer.ticketmaster.com/ (gratuit, 5000 requetes/jour)
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY || '',
    enabled: !!process.env.TICKETMASTER_API_KEY, // Active seulement si cle presente
  },

  // OpenAgenda API
  // Documentation: https://openagenda.zendesk.com/hc/fr/articles/203034982
  openagenda: {
    apiKey: process.env.OPENAGENDA_API_KEY || '',
    agendaIds: [],
    enabled: !!process.env.OPENAGENDA_API_KEY,
  },

  // Songkick API (inactive)
  songkick: {
    apiKey: process.env.SONGKICK_API_KEY || '',
    enabled: false,
  },

  // === APIs gratuites (toujours actives) ===

  // Bandsintown API (gratuite, pas de cle requise)
  // Documentation: https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0
  bandsintown: {
    appId: 'mute_concert_app',
    enabled: true,
  },

  // Resident Advisor (scraping GraphQL interne)
  // Source principale pour l'electro/techno a Paris
  residentAdvisor: {
    enabled: true,
  },

  // Shotgun (scraping API interne)
  // Billetterie populaire pour l'electro
  shotgun: {
    enabled: true,
  },

  // Dice (scraping GraphQL + web)
  // Billetterie alternative
  dice: {
    enabled: true,
  },

  // Salles parisiennes (scraping direct)
  // Olympia, Bataclan, Zenith, etc.
  parisVenues: {
    enabled: true,
  },

  // === Configuration generale ===

  cache: {
    duration: 15 * 60 * 1000, // 15 minutes (plus frais)
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

// Verifie si au moins une source de donnees est active
export const isApiConfigured = (): boolean => {
  return (
    API_CONFIG.bandsintown.enabled ||
    API_CONFIG.residentAdvisor.enabled ||
    API_CONFIG.shotgun.enabled ||
    API_CONFIG.dice.enabled ||
    API_CONFIG.parisVenues.enabled ||
    (API_CONFIG.ticketmaster.enabled && !!API_CONFIG.ticketmaster.apiKey)
  );
};

// Liste les sources actives
export const getActiveApis = (): string[] => {
  const apis: string[] = [];

  // APIs gratuites (toujours actives)
  if (API_CONFIG.bandsintown.enabled) apis.push('Bandsintown');
  if (API_CONFIG.residentAdvisor.enabled) apis.push('Resident Advisor');
  if (API_CONFIG.shotgun.enabled) apis.push('Shotgun');
  if (API_CONFIG.dice.enabled) apis.push('Dice');
  if (API_CONFIG.parisVenues.enabled) apis.push('Paris Venues');

  // APIs avec cle
  if (API_CONFIG.ticketmaster.enabled && API_CONFIG.ticketmaster.apiKey) apis.push('Ticketmaster');
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
