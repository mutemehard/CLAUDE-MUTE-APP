// Donnees de test pour le developpement - MUTE App
import { Artist, Venue, Concert } from '../types';

export const mockArtists: Artist[] = [
  {
    id: 'artist-1',
    name: 'Phoenix',
    imageUrl: 'https://picsum.photos/seed/phoenix/400/400',
    genres: ['Rock', 'Indie'],
    popularity: 85,
    description: 'Groupe de rock francais forme a Versailles en 1999.',
  },
  {
    id: 'artist-2',
    name: 'Christine and the Queens',
    imageUrl: 'https://picsum.photos/seed/christine/400/400',
    genres: ['Pop', 'Electronic'],
    popularity: 82,
    description: 'Projet musical de Heloise Letissier.',
  },
  {
    id: 'artist-3',
    name: 'Justice',
    imageUrl: 'https://picsum.photos/seed/justice/400/400',
    genres: ['Electronic', 'Techno'],
    popularity: 88,
    description: 'Duo francais de musique electronique.',
  },
  {
    id: 'artist-4',
    name: 'Disclosure',
    imageUrl: 'https://picsum.photos/seed/disclosure/400/400',
    genres: ['Electronic', 'House'],
    popularity: 80,
    description: 'Duo britannique de musique electronique.',
  },
  {
    id: 'artist-5',
    name: 'Arctic Monkeys',
    imageUrl: 'https://picsum.photos/seed/arctic/400/400',
    genres: ['Rock', 'Indie'],
    popularity: 92,
    description: 'Groupe de rock britannique forme a Sheffield.',
  },
  {
    id: 'artist-6',
    name: 'Aya Nakamura',
    imageUrl: 'https://picsum.photos/seed/aya/400/400',
    genres: ['Pop', 'R&B'],
    popularity: 90,
    description: 'Chanteuse et compositrice francaise.',
  },
  {
    id: 'artist-7',
    name: 'Parcels',
    imageUrl: 'https://picsum.photos/seed/parcels/400/400',
    genres: ['Disco', 'Funk'],
    popularity: 75,
    description: 'Groupe australien base a Berlin.',
  },
  {
    id: 'artist-8',
    name: 'Orelsan',
    imageUrl: 'https://picsum.photos/seed/orelsan/400/400',
    genres: ['Hip-Hop', 'Rap'],
    popularity: 88,
    description: 'Rappeur et realisateur francais.',
  },
  {
    id: 'artist-9',
    name: 'Amelie Lens',
    imageUrl: 'https://picsum.photos/seed/amelie/400/400',
    genres: ['Techno'],
    popularity: 85,
    description: 'DJ et productrice belge de techno.',
  },
  {
    id: 'artist-10',
    name: 'Charlotte de Witte',
    imageUrl: 'https://picsum.photos/seed/charlotte/400/400',
    genres: ['Techno'],
    popularity: 87,
    description: 'DJ et productrice belge.',
  },
  {
    id: 'artist-11',
    name: 'Folamour',
    imageUrl: 'https://picsum.photos/seed/folamour/400/400',
    genres: ['House', 'Disco'],
    popularity: 78,
    description: 'DJ et producteur francais de house.',
  },
  {
    id: 'artist-12',
    name: 'Myd',
    imageUrl: 'https://picsum.photos/seed/myd/400/400',
    genres: ['Electronic', 'House'],
    popularity: 72,
    description: 'Producteur francais, membre de Club Cheval.',
  },
  {
    id: 'artist-13',
    name: 'Vladimir Cauchemar',
    imageUrl: 'https://picsum.photos/seed/vladimir/400/400',
    genres: ['Electronic', 'Hip-Hop'],
    popularity: 70,
    description: 'Producteur et DJ francais masque.',
  },
  {
    id: 'artist-14',
    name: 'Polo & Pan',
    imageUrl: 'https://picsum.photos/seed/polopan/400/400',
    genres: ['Electronic', 'House'],
    popularity: 82,
    description: 'Duo francais de musique electronique.',
  },
  {
    id: 'artist-15',
    name: 'Louisahhh',
    imageUrl: 'https://picsum.photos/seed/louisahhh/400/400',
    genres: ['Techno'],
    popularity: 75,
    description: 'DJ et productrice americaine basee a Paris.',
  },
];

export const mockVenues: Venue[] = [
  {
    id: 'venue-1',
    name: 'Olympia',
    address: '28 Boulevard des Capucines',
    city: 'Paris',
    postalCode: '75009',
    arrondissement: '9e',
    latitude: 48.8701,
    longitude: 2.3280,
    capacity: 2000,
    imageUrl: 'https://picsum.photos/seed/olympia/600/400',
  },
  {
    id: 'venue-2',
    name: 'Zenith Paris',
    address: '211 Avenue Jean Jaures',
    city: 'Paris',
    postalCode: '75019',
    arrondissement: '19e',
    latitude: 48.8936,
    longitude: 2.3934,
    capacity: 6800,
    imageUrl: 'https://picsum.photos/seed/zenith/600/400',
  },
  {
    id: 'venue-3',
    name: 'La Cigale',
    address: '120 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    arrondissement: '18e',
    latitude: 48.8826,
    longitude: 2.3407,
    capacity: 1400,
    imageUrl: 'https://picsum.photos/seed/cigale/600/400',
  },
  {
    id: 'venue-4',
    name: 'Bataclan',
    address: '50 Boulevard Voltaire',
    city: 'Paris',
    postalCode: '75011',
    arrondissement: '11e',
    latitude: 48.8632,
    longitude: 2.3701,
    capacity: 1500,
    imageUrl: 'https://picsum.photos/seed/bataclan/600/400',
  },
  {
    id: 'venue-5',
    name: 'Accor Arena',
    address: '8 Boulevard de Bercy',
    city: 'Paris',
    postalCode: '75012',
    arrondissement: '12e',
    latitude: 48.8386,
    longitude: 2.3787,
    capacity: 20300,
    imageUrl: 'https://picsum.photos/seed/bercy/600/400',
  },
  {
    id: 'venue-6',
    name: 'Le Trabendo',
    address: '211 Avenue Jean Jaures',
    city: 'Paris',
    postalCode: '75019',
    arrondissement: '19e',
    latitude: 48.8910,
    longitude: 2.3922,
    capacity: 700,
    imageUrl: 'https://picsum.photos/seed/trabendo/600/400',
  },
  {
    id: 'venue-7',
    name: 'La Maroquinerie',
    address: '23 Rue Boyer',
    city: 'Paris',
    postalCode: '75020',
    arrondissement: '20e',
    latitude: 48.8673,
    longitude: 2.3918,
    capacity: 500,
    imageUrl: 'https://picsum.photos/seed/maroquinerie/600/400',
  },
  {
    id: 'venue-8',
    name: 'Elysee Montmartre',
    address: '72 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    arrondissement: '18e',
    latitude: 48.8833,
    longitude: 2.3483,
    capacity: 1500,
    imageUrl: 'https://picsum.photos/seed/elysee/600/400',
  },
  {
    id: 'venue-9',
    name: 'Rex Club',
    address: '5 Boulevard Poissonniere',
    city: 'Paris',
    postalCode: '75002',
    arrondissement: '2e',
    latitude: 48.8710,
    longitude: 2.3477,
    capacity: 800,
    imageUrl: 'https://picsum.photos/seed/rex/600/400',
  },
  {
    id: 'venue-10',
    name: 'Concrete',
    address: '69 Port de la Rapee',
    city: 'Paris',
    postalCode: '75012',
    arrondissement: '12e',
    latitude: 48.8436,
    longitude: 2.3665,
    capacity: 600,
    imageUrl: 'https://picsum.photos/seed/concrete/600/400',
  },
  {
    id: 'venue-11',
    name: 'Badaboum',
    address: '2 bis Rue des Taillandiers',
    city: 'Paris',
    postalCode: '75011',
    arrondissement: '11e',
    latitude: 48.8532,
    longitude: 2.3771,
    capacity: 400,
    imageUrl: 'https://picsum.photos/seed/badaboum/600/400',
  },
  {
    id: 'venue-12',
    name: 'Glazart',
    address: '7-15 Avenue de la Porte de la Villette',
    city: 'Paris',
    postalCode: '75019',
    arrondissement: '19e',
    latitude: 48.8976,
    longitude: 2.3867,
    capacity: 1200,
    imageUrl: 'https://picsum.photos/seed/glazart/600/400',
  },
  {
    id: 'venue-13',
    name: 'Le Petit Bain',
    address: '7 Port de la Gare',
    city: 'Paris',
    postalCode: '75013',
    arrondissement: '13e',
    latitude: 48.8318,
    longitude: 2.3761,
    capacity: 450,
    imageUrl: 'https://picsum.photos/seed/petitbain/600/400',
  },
  {
    id: 'venue-14',
    name: 'La Machine du Moulin Rouge',
    address: '90 Boulevard de Clichy',
    city: 'Paris',
    postalCode: '75018',
    arrondissement: '18e',
    latitude: 48.8841,
    longitude: 2.3324,
    capacity: 900,
    imageUrl: 'https://picsum.photos/seed/machine/600/400',
  },
  {
    id: 'venue-15',
    name: 'Wanderlust',
    address: '32 Quai d\'Austerlitz',
    city: 'Paris',
    postalCode: '75013',
    arrondissement: '13e',
    latitude: 48.8412,
    longitude: 2.3698,
    capacity: 1500,
    imageUrl: 'https://picsum.photos/seed/wanderlust/600/400',
  },
];

// Helper pour generer des dates futures
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Helper pour obtenir le prochain vendredi/samedi
const getNextWeekendDay = (isSaturday: boolean): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const targetDay = isSaturday ? 6 : 5;
  const daysUntil = (targetDay - dayOfWeek + 7) % 7 || 7;
  const date = new Date(today);
  date.setDate(today.getDate() + daysUntil);
  return date.toISOString().split('T')[0];
};

export const mockConcerts: Concert[] = [
  // Concerts ce soir
  {
    id: 'concert-1',
    artist: mockArtists[2], // Justice
    venue: mockVenues[1], // Zenith
    date: getFutureDate(0),
    startTime: '20:00',
    price: { min: 45, max: 65, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/1',
    source: 'bandsintown',
    sourceId: 'bit-456',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert1/800/400',
  },
  {
    id: 'concert-2',
    artist: mockArtists[8], // Amelie Lens
    venue: mockVenues[8], // Rex Club
    date: getFutureDate(0),
    startTime: '23:30',
    price: { min: 20, max: 25, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/2',
    source: 'bandsintown',
    sourceId: 'bit-457',
    genre: 'Techno',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert2/800/400',
  },

  // Demain
  {
    id: 'concert-3',
    artist: mockArtists[5], // Aya Nakamura
    venue: mockVenues[4], // Accor Arena
    date: getFutureDate(1),
    startTime: '20:00',
    price: { min: 55, max: 120, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/3',
    source: 'ticketmaster',
    sourceId: 'tm-123',
    genre: 'Pop',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert3/800/400',
  },
  {
    id: 'concert-4',
    artist: mockArtists[10], // Folamour
    venue: mockVenues[10], // Badaboum
    date: getFutureDate(1),
    startTime: '23:00',
    price: { min: 15, max: 18, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/4',
    source: 'bandsintown',
    sourceId: 'bit-458',
    genre: 'House',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert4/800/400',
  },

  // Ce week-end (Vendredi)
  {
    id: 'concert-5',
    artist: mockArtists[9], // Charlotte de Witte
    venue: mockVenues[9], // Concrete
    date: getNextWeekendDay(false),
    startTime: '23:59',
    endTime: '07:00',
    price: { min: 25, max: 30, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/5',
    source: 'bandsintown',
    sourceId: 'bit-459',
    genre: 'Techno',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert5/800/400',
  },
  {
    id: 'concert-6',
    artist: mockArtists[0], // Phoenix
    venue: mockVenues[0], // Olympia
    date: getNextWeekendDay(false),
    startTime: '20:30',
    price: { min: 45, max: 75, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/6',
    source: 'ticketmaster',
    sourceId: 'tm-124',
    genre: 'Rock',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert6/800/400',
  },

  // Ce week-end (Samedi)
  {
    id: 'concert-7',
    artist: mockArtists[13], // Polo & Pan
    venue: mockVenues[11], // Glazart
    date: getNextWeekendDay(true),
    startTime: '22:00',
    price: { min: 28, max: 35, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/7',
    source: 'bandsintown',
    sourceId: 'bit-460',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert7/800/400',
  },
  {
    id: 'concert-8',
    artist: mockArtists[7], // Orelsan
    venue: mockVenues[4], // Accor Arena
    date: getNextWeekendDay(true),
    startTime: '20:00',
    price: { min: 50, max: 95, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/8',
    source: 'ticketmaster',
    sourceId: 'tm-125',
    genre: 'Hip-Hop',
    isSoldOut: true,
    imageUrl: 'https://picsum.photos/seed/concert8/800/400',
  },
  {
    id: 'concert-9',
    artist: mockArtists[14], // Louisahhh
    venue: mockVenues[13], // La Machine
    date: getNextWeekendDay(true),
    startTime: '23:30',
    endTime: '06:00',
    price: { min: 18, max: 22, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/9',
    source: 'bandsintown',
    sourceId: 'bit-461',
    genre: 'Techno',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert9/800/400',
  },

  // Cette semaine
  {
    id: 'concert-10',
    artist: mockArtists[6], // Parcels
    venue: mockVenues[2], // La Cigale
    date: getFutureDate(3),
    startTime: '20:30',
    price: { min: 35, max: 45, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/10',
    source: 'songkick',
    sourceId: 'sk-123',
    genre: 'Disco',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert10/800/400',
  },
  {
    id: 'concert-11',
    artist: mockArtists[1], // Christine and the Queens
    venue: mockVenues[3], // Bataclan
    date: getFutureDate(4),
    startTime: '20:00',
    price: { min: 38, max: 55, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/11',
    source: 'ticketmaster',
    sourceId: 'tm-126',
    genre: 'Pop',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert11/800/400',
  },
  {
    id: 'concert-12',
    artist: mockArtists[11], // Myd
    venue: mockVenues[12], // Le Petit Bain
    date: getFutureDate(5),
    startTime: '21:00',
    price: { min: 18, max: 22, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/12',
    source: 'bandsintown',
    sourceId: 'bit-462',
    genre: 'House',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert12/800/400',
  },

  // Evenement gratuit
  {
    id: 'concert-13',
    artist: mockArtists[12], // Vladimir Cauchemar
    venue: mockVenues[14], // Wanderlust
    date: getFutureDate(6),
    startTime: '18:00',
    price: { min: 0, max: 0, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/13',
    source: 'bandsintown',
    sourceId: 'bit-463',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert13/800/400',
    description: 'Entree libre - Sunset session',
  },

  // Plus tard ce mois
  {
    id: 'concert-14',
    artist: mockArtists[4], // Arctic Monkeys
    venue: mockVenues[4], // Accor Arena
    date: getFutureDate(15),
    startTime: '20:00',
    price: { min: 65, max: 140, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/14',
    source: 'ticketmaster',
    sourceId: 'tm-127',
    genre: 'Rock',
    isSoldOut: true,
    imageUrl: 'https://picsum.photos/seed/concert14/800/400',
  },
  {
    id: 'concert-15',
    artist: mockArtists[3], // Disclosure
    venue: mockVenues[1], // Zenith
    date: getFutureDate(20),
    startTime: '20:30',
    price: { min: 42, max: 68, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/15',
    source: 'songkick',
    sourceId: 'sk-124',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert15/800/400',
  },

  // Autre date Phoenix
  {
    id: 'concert-16',
    artist: mockArtists[0], // Phoenix
    venue: mockVenues[0], // Olympia
    date: getFutureDate(22),
    startTime: '20:30',
    price: { min: 45, max: 75, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/16',
    source: 'ticketmaster',
    sourceId: 'tm-128',
    genre: 'Rock',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert16/800/400',
  },
];
