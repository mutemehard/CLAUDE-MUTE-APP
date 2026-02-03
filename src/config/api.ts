// Configuration des APIs et environnement
// Pour activer les vraies APIs, configurez les cles ci-dessous

export const API_CONFIG = {
  // Bandsintown API
  // Documentation: https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0
  // Inscription: https://www.artists.bandsintown.com/support/api-installation
  bandsintown: {
    appId: 'mute_concert_app', // Votre app_id Bandsintown
    enabled: false, // Passer a true apres configuration
  },

  // OpenAgenda API
  // Documentation: https://openagenda.zendesk.com/hc/fr/articles/203034982
  // Inscription: https://openagenda.com/
  openagenda: {
    apiKey: '', // Votre cle API OpenAgenda
    // IDs des agendas de concerts parisiens a suivre
    agendaIds: [
      // Ajoutez ici les IDs des agendas que vous voulez suivre
      // Exemple: '12345678'
    ],
    enabled: false, // Passer a true apres configuration
  },

  // Configuration generale
  cache: {
    duration: 5 * 60 * 1000, // 5 minutes en millisecondes
    enabled: true,
  },

  // Delai simule pour les mocks (en ms)
  mockDelay: 300,

  // Mode debug
  debug: __DEV__ || false,
};

// Verifie si au moins une API est configuree
export const isApiConfigured = (): boolean => {
  return API_CONFIG.bandsintown.enabled || API_CONFIG.openagenda.enabled;
};

// Log de debug conditionnel
export const debugLog = (message: string, ...args: any[]): void => {
  if (API_CONFIG.debug) {
    console.log(`[MUTE] ${message}`, ...args);
  }
};

// Variable globale pour le mode dev
declare const __DEV__: boolean;
