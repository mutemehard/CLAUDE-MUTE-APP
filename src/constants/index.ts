export * from './theme';

// Configuration generale
export const APP_CONFIG = {
  name: 'MUTE',
  tagline: 'Ne rate plus rien.',
  defaultCity: 'Paris',
  defaultCountry: 'France',
  defaultCoordinates: {
    latitude: 48.8566,
    longitude: 2.3522,
  },
  defaultRadius: 25, // km - pour couvrir la grande couronne
  maxSearchResults: 50,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Types d'evenements
export const EVENT_TYPES = [
  { value: 'concert', label: 'Concert' },
  { value: 'dj_set', label: 'DJ Set' },
  { value: 'club', label: 'Soiree club' },
  { value: 'festival', label: 'Festival' },
  { value: 'live', label: 'Live' },
  { value: 'free', label: 'Gratuit' },
] as const;

// Genres musicaux disponibles
export const MUSIC_GENRES = [
  'Techno',
  'House',
  'Electronic',
  'Hip-Hop',
  'Rap',
  'Rock',
  'Pop',
  'Indie',
  'Jazz',
  'R&B',
  'Soul',
  'Funk',
  'Metal',
  'Punk',
  'Reggae',
  'Afro',
  'Latin',
  'Classical',
  'World',
  'Disco',
  'Drum & Bass',
  'Trance',
] as const;

// Arrondissements de Paris
export const PARIS_ARRONDISSEMENTS = [
  '1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e', '10e',
  '11e', '12e', '13e', '14e', '15e', '16e', '17e', '18e', '19e', '20e',
] as const;

// Departements Ile-de-France (grande couronne)
export const IDF_DEPARTMENTS = [
  { code: '75', name: 'Paris' },
  { code: '92', name: 'Hauts-de-Seine' },
  { code: '93', name: 'Seine-Saint-Denis' },
  { code: '94', name: 'Val-de-Marne' },
  { code: '77', name: 'Seine-et-Marne' },
  { code: '78', name: 'Yvelines' },
  { code: '91', name: 'Essonne' },
  { code: '95', name: "Val-d'Oise" },
] as const;

// Options de tri
export const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'popularity', label: 'Popularite' },
  { value: 'price', label: 'Prix' },
  { value: 'distance', label: 'Distance' },
] as const;

// Plages de prix
export const PRICE_RANGES = [
  { label: 'Gratuit', min: 0, max: 0 },
  { label: '< 20 EUR', min: 0, max: 20 },
  { label: '20-50 EUR', min: 20, max: 50 },
  { label: '50-100 EUR', min: 50, max: 100 },
  { label: '> 100 EUR', min: 100, max: 999 },
] as const;

// Plages de dates
export const DATE_PRESETS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'tomorrow', label: 'Demain' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'custom', label: 'Personnalise' },
] as const;
