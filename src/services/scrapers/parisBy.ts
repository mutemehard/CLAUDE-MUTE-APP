// Scraper pour Paris.by et autres sources locales
// Concerts rock, pop, indie, jazz a Paris

import { Concert, Artist, Venue } from '../../types';
import { ScraperOptions } from './index';

// Genere un ID unique
const generateId = (source: string, eventId: string): string => {
  return `${source}_${eventId}`;
};

// Scraper pour les concerts parisiens (rock, pop, jazz, etc.)
export const parisByScraper = {
  name: 'parisBy',

  async scrape(options: ScraperOptions = {}): Promise<Concert[]> {
    try {
      const today = new Date();

      // Donnees simulees pour des concerts varies a Paris
      const mockConcerts: Concert[] = [
        {
          id: generateId('parisBy', 'pb_1'),
          artist: {
            id: generateId('parisBy', 'artist_pb1'),
            name: 'Phoenix',
            genres: ['Indie Rock', 'Synth-pop'],
            popularity: 88,
            description: 'Groupe de rock indie francais forme a Versailles',
          },
          venue: {
            id: generateId('parisBy', 'venue_zenith'),
            name: 'Zenith Paris',
            address: '211 Avenue Jean Jaures',
            city: 'Paris',
            postalCode: '75019',
            arrondissement: '19e',
            latitude: 48.8893,
            longitude: 2.3934,
            capacity: 6300,
          },
          date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:00',
          genre: 'Indie Rock',
          price: { min: 45, max: 75, currency: '€' },
          ticketUrl: 'https://www.fnacspectacles.com',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_2'),
          artist: {
            id: generateId('parisBy', 'artist_pb2'),
            name: 'Jazz a la Villette',
            genres: ['Jazz', 'World Jazz'],
            popularity: 70,
          },
          venue: {
            id: generateId('parisBy', 'venue_villette'),
            name: 'Grande Halle de la Villette',
            address: '211 Avenue Jean Jaures',
            city: 'Paris',
            postalCode: '75019',
            arrondissement: '19e',
            latitude: 48.8893,
            longitude: 2.3934,
          },
          date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '19:30',
          genre: 'Jazz',
          price: { min: 25, max: 45, currency: '€' },
          ticketUrl: 'https://jazzalavillette.com',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_3'),
          artist: {
            id: generateId('parisBy', 'artist_pb3'),
            name: 'Stromae',
            genres: ['Electronic', 'Hip-Hop', 'Chanson'],
            popularity: 95,
            description: 'Artiste belge melangeant musique electronique et chanson francaise',
          },
          venue: {
            id: generateId('parisBy', 'venue_accor'),
            name: 'Accor Arena',
            address: '8 Boulevard de Bercy',
            city: 'Paris',
            postalCode: '75012',
            arrondissement: '12e',
            latitude: 48.8386,
            longitude: 2.3788,
            capacity: 20300,
          },
          date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:30',
          genre: 'Electronic',
          price: { min: 55, max: 120, currency: '€' },
          ticketUrl: 'https://www.accor-arena.com',
          isSoldOut: true,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_4'),
          artist: {
            id: generateId('parisBy', 'artist_pb4'),
            name: 'Aya Nakamura',
            genres: ['R&B', 'Pop', 'Afropop'],
            popularity: 92,
          },
          venue: {
            id: generateId('parisBy', 'venue_olympia'),
            name: "L'Olympia",
            address: '28 Boulevard des Capucines',
            city: 'Paris',
            postalCode: '75009',
            arrondissement: '9e',
            latitude: 48.8701,
            longitude: 2.3283,
            capacity: 2000,
          },
          date: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:00',
          genre: 'R&B',
          price: { min: 45, max: 85, currency: '€' },
          ticketUrl: 'https://www.olympiahall.com',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_5'),
          artist: {
            id: generateId('parisBy', 'artist_pb5'),
            name: 'Orelsan',
            genres: ['Rap', 'Hip-Hop'],
            popularity: 90,
          },
          venue: {
            id: generateId('parisBy', 'venue_stade'),
            name: 'Stade de France',
            address: 'Rue Henri Delaunay',
            city: 'Saint-Denis',
            postalCode: '93200',
            latitude: 48.9244,
            longitude: 2.3601,
            capacity: 81338,
          },
          date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '21:00',
          genre: 'Hip-Hop',
          price: { min: 65, max: 150, currency: '€' },
          ticketUrl: 'https://www.stadefrance.com',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_6'),
          artist: {
            id: generateId('parisBy', 'artist_pb6'),
            name: 'Ibrahim Maalouf',
            genres: ['Jazz', 'World', 'Oriental Jazz'],
            popularity: 82,
          },
          venue: {
            id: generateId('parisBy', 'venue_philharmonie'),
            name: 'Philharmonie de Paris',
            address: '221 Avenue Jean Jaures',
            city: 'Paris',
            postalCode: '75019',
            arrondissement: '19e',
            latitude: 48.8897,
            longitude: 2.3936,
            capacity: 2400,
          },
          date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:30',
          genre: 'Jazz',
          price: { min: 35, max: 70, currency: '€' },
          ticketUrl: 'https://philharmoniedeparis.fr',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_7'),
          artist: {
            id: generateId('parisBy', 'artist_pb7'),
            name: 'Louise Attaque',
            genres: ['Rock', 'French Rock'],
            popularity: 78,
          },
          venue: {
            id: generateId('parisBy', 'venue_bataclan'),
            name: 'Le Bataclan',
            address: '50 Boulevard Voltaire',
            city: 'Paris',
            postalCode: '75011',
            arrondissement: '11e',
            latitude: 48.8631,
            longitude: 2.3708,
            capacity: 1500,
          },
          date: new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:00',
          genre: 'Rock',
          price: { min: 38, max: 55, currency: '€' },
          ticketUrl: 'https://www.le-bataclan.com',
          isSoldOut: false,
          source: 'parisBy',
        },
        {
          id: generateId('parisBy', 'pb_8'),
          artist: {
            id: generateId('parisBy', 'artist_pb8'),
            name: 'Angele',
            genres: ['Pop', 'Electropop'],
            popularity: 91,
          },
          venue: {
            id: generateId('parisBy', 'venue_accor2'),
            name: 'Accor Arena',
            address: '8 Boulevard de Bercy',
            city: 'Paris',
            postalCode: '75012',
            arrondissement: '12e',
            latitude: 48.8386,
            longitude: 2.3788,
            capacity: 20300,
          },
          date: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '20:00',
          genre: 'Pop',
          price: { min: 50, max: 95, currency: '€' },
          ticketUrl: 'https://www.accor-arena.com',
          isSoldOut: false,
          source: 'parisBy',
        },
      ];

      // Filtre par date si specifie
      let filtered = mockConcerts;
      if (options.dateFrom || options.dateTo) {
        filtered = mockConcerts.filter(concert => {
          const concertDate = new Date(concert.date);
          if (options.dateFrom && concertDate < new Date(options.dateFrom)) return false;
          if (options.dateTo && concertDate > new Date(options.dateTo)) return false;
          return true;
        });
      }

      // Limite le nombre de resultats
      if (options.limit && filtered.length > options.limit) {
        return filtered.slice(0, options.limit);
      }

      return filtered;
    } catch (error) {
      console.error('ParisBy scraper error:', error);
      return [];
    }
  },
};
