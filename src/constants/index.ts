export * from './theme';

// Configuration générale
export const APP_CONFIG = {
  name: 'ParisGigs',
  defaultCity: 'Paris',
  defaultCountry: 'France',
  defaultCoordinates: {
    latitude: 48.8566,
    longitude: 2.3522,
  },
  defaultRadius: 10, // km
  maxSearchResults: 50,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Genres musicaux disponibles
export const MUSIC_GENRES = [
  'Rock',
  'Pop',
  'Electronic',
  'Hip-Hop',
  'Jazz',
  'Classical',
  'Metal',
  'Indie',
  'R&B',
  'Folk',
  'Reggae',
  'Blues',
  'Soul',
  'Funk',
  'Punk',
  'Alternative',
  'World',
  'Latin',
] as const;

// Arrondissements de Paris
export const PARIS_ARRONDISSEMENTS = [
  '1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e', '10e',
  '11e', '12e', '13e', '14e', '15e', '16e', '17e', '18e', '19e', '20e',
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
