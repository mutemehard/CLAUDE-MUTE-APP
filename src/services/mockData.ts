// Données de test pour le développement
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
    genres: ['Electronic'],
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
    name: 'AccorHotels Arena',
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
];

// Helper pour générer des dates futures
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

export const mockConcerts: Concert[] = [
  {
    id: 'concert-1',
    artist: mockArtists[0], // Phoenix
    venue: mockVenues[4], // AccorHotels Arena
    date: getFutureDate(2),
    startTime: '20:00',
    price: { min: 45, max: 85, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/1',
    source: 'ticketmaster',
    sourceId: 'tm-123',
    genre: 'Rock',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert1/800/400',
  },
  {
    id: 'concert-2',
    artist: mockArtists[2], // Justice
    venue: mockVenues[1], // Zenith
    date: getFutureDate(0), // Aujourd'hui
    startTime: '21:00',
    price: { min: 40, max: 65, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/2',
    source: 'bandsintown',
    sourceId: 'bit-456',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert2/800/400',
  },
  {
    id: 'concert-3',
    artist: mockArtists[1], // Christine and the Queens
    venue: mockVenues[0], // Olympia
    date: getFutureDate(5),
    startTime: '20:30',
    price: { min: 35, max: 55, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/3',
    source: 'songkick',
    sourceId: 'sk-789',
    genre: 'Pop',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert3/800/400',
  },
  {
    id: 'concert-4',
    artist: mockArtists[4], // Arctic Monkeys
    venue: mockVenues[4], // AccorHotels Arena
    date: getFutureDate(10),
    startTime: '20:00',
    price: { min: 55, max: 120, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/4',
    source: 'ticketmaster',
    sourceId: 'tm-234',
    genre: 'Rock',
    isSoldOut: true,
    imageUrl: 'https://picsum.photos/seed/concert4/800/400',
  },
  {
    id: 'concert-5',
    artist: mockArtists[5], // Aya Nakamura
    venue: mockVenues[1], // Zenith
    date: getFutureDate(1), // Demain
    startTime: '20:00',
    price: { min: 40, max: 75, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/5',
    source: 'eventbrite',
    sourceId: 'eb-567',
    genre: 'Pop',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert5/800/400',
  },
  {
    id: 'concert-6',
    artist: mockArtists[6], // Parcels
    venue: mockVenues[2], // La Cigale
    date: getFutureDate(3),
    startTime: '21:00',
    price: { min: 32, max: 42, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/6',
    source: 'bandsintown',
    sourceId: 'bit-890',
    genre: 'Disco',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert6/800/400',
  },
  {
    id: 'concert-7',
    artist: mockArtists[7], // Orelsan
    venue: mockVenues[4], // AccorHotels Arena
    date: getFutureDate(15),
    startTime: '20:30',
    price: { min: 50, max: 95, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/7',
    source: 'ticketmaster',
    sourceId: 'tm-345',
    genre: 'Hip-Hop',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert7/800/400',
  },
  {
    id: 'concert-8',
    artist: mockArtists[3], // Disclosure
    venue: mockVenues[3], // Bataclan
    date: getFutureDate(7),
    startTime: '22:00',
    price: { min: 38, max: 48, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/8',
    source: 'songkick',
    sourceId: 'sk-012',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert8/800/400',
  },
  {
    id: 'concert-9',
    artist: mockArtists[0], // Phoenix (autre date)
    venue: mockVenues[0], // Olympia
    date: getFutureDate(20),
    startTime: '20:00',
    price: { min: 42, max: 68, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/9',
    source: 'bandsintown',
    sourceId: 'bit-111',
    genre: 'Rock',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert9/800/400',
  },
  {
    id: 'concert-10',
    artist: mockArtists[2], // Justice (autre date)
    venue: mockVenues[5], // Le Trabendo
    date: getFutureDate(0), // Aujourd'hui aussi
    startTime: '23:00',
    price: { min: 25, max: 35, currency: 'EUR' },
    ticketUrl: 'https://example.com/tickets/10',
    source: 'eventbrite',
    sourceId: 'eb-222',
    genre: 'Electronic',
    isSoldOut: false,
    imageUrl: 'https://picsum.photos/seed/concert10/800/400',
  },
];
