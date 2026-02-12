// Liste des genres musicaux supportes par MUTE
// Utilisee pour les filtres, tags, et recommendations

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// Genres principaux avec leurs couleurs et icones
export const GENRES: Genre[] = [
  { id: 'electronic', name: 'Electronic', color: '#0A84FF', icon: '🎛️' },
  { id: 'techno', name: 'Techno', color: '#0A84FF', icon: '🔊' },
  { id: 'house', name: 'House', color: '#5AC8FA', icon: '🏠' },
  { id: 'rock', name: 'Rock', color: '#FF453A', icon: '🎸' },
  { id: 'pop', name: 'Pop', color: '#BF5AF2', icon: '🎤' },
  { id: 'hiphop', name: 'Hip-Hop', color: '#FF9F0A', icon: '🎤' },
  { id: 'rap', name: 'Rap', color: '#FF9500', icon: '🎙️' },
  { id: 'rnb', name: 'R&B', color: '#AF52DE', icon: '💜' },
  { id: 'jazz', name: 'Jazz', color: '#30D158', icon: '🎷' },
  { id: 'classical', name: 'Classique', color: '#5E5CE6', icon: '🎻' },
  { id: 'metal', name: 'Metal', color: '#8E8E93', icon: '🤘' },
  { id: 'indie', name: 'Indie', color: '#FF6482', icon: '🎵' },
  { id: 'folk', name: 'Folk', color: '#32D74B', icon: '🪕' },
  { id: 'disco', name: 'Disco', color: '#FF2D92', icon: '🪩' },
  { id: 'funk', name: 'Funk', color: '#FF9F0A', icon: '🎺' },
  { id: 'soul', name: 'Soul', color: '#AF52DE', icon: '💫' },
  { id: 'reggae', name: 'Reggae', color: '#30D158', icon: '🌴' },
  { id: 'blues', name: 'Blues', color: '#0A84FF', icon: '🎸' },
  { id: 'world', name: 'World', color: '#FF6482', icon: '🌍' },
  { id: 'latin', name: 'Latin', color: '#FF453A', icon: '💃' },
  { id: 'chanson', name: 'Chanson', color: '#5E5CE6', icon: '🇫🇷' },
  { id: 'variete', name: 'Variete', color: '#BF5AF2', icon: '🎭' },
];

// Map rapide pour acceder aux genres par ID
export const GENRE_MAP = new Map(GENRES.map(g => [g.id, g]));

// Recupere un genre par ID (avec fallback)
export const getGenre = (id: string): Genre => {
  const lowerId = id.toLowerCase().replace(/[^a-z]/g, '');
  return GENRE_MAP.get(lowerId) || {
    id: lowerId,
    name: id,
    color: '#636366',
    icon: '🎵',
  };
};

// Recupere la couleur d'un genre
export const getGenreColor = (genre: string): string => {
  return getGenre(genre).color;
};

// Recupere l'icone d'un genre
export const getGenreIcon = (genre: string): string => {
  return getGenre(genre).icon;
};

// Liste des noms de genres (pour les filtres)
export const GENRE_NAMES = GENRES.map(g => g.name);

// Liste des IDs de genres
export const GENRE_IDS = GENRES.map(g => g.id);

// Genres populaires (pour l'onboarding)
export const POPULAR_GENRES = [
  'Electronic',
  'Techno',
  'House',
  'Rock',
  'Pop',
  'Hip-Hop',
  'Rap',
  'Jazz',
  'Classique',
  'Indie',
];
