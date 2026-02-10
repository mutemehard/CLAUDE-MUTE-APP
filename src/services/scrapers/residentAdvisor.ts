// Scraper pour Resident Advisor (ra.co)
// Source pour les evenements electroniques

import { Concert, Artist, Venue } from '../../types';
import { ScraperOptions } from './index';

// Genere un ID unique
const generateId = (source: string, eventId: string): string => {
  return `${source}_${eventId}`;
};

// Scraper principal pour Resident Advisor
export const residentAdvisorScraper = {
  name: 'residentAdvisor',

  async scrape(options: ScraperOptions = {}): Promise<Concert[]> {
    try {
      // RA a une API GraphQL mais elle necessite une authentification
      // On utilise des donnees simulees basees sur des vrais evenements parisiens

      const today = new Date();
      const mockConcerts: Concert[] = [
        {
          id: generateId('ra', 'ra_1'),
          sourceId: 'ra_1',
          artist: {
            id: generateId('ra', 'artist_ra1'),
            name: 'Ben Klock',
            genres: ['Techno', 'Industrial Techno'],
            popularity: 85,
          },
          venue: {
            id: generateId('ra', 'venue_rex'),
            name: 'Rex Club',
            address: '5 Boulevard Poissonniere',
            city: 'Paris',
            postalCode: '75002',
            arrondissement: '2e',
            latitude: 48.8717,
            longitude: 2.3468,
          },
          date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '23:30',
          endTime: '06:00',
          genre: 'Techno',
          price: { min: 20, max: 20, currency: '€' },
          ticketUrl: 'https://ra.co/events/paris',
          isSoldOut: false,
          source: 'residentAdvisor',
        },
        {
          id: generateId('ra', 'ra_2'),
          sourceId: 'ra_2',
          artist: {
            id: generateId('ra', 'artist_ra2'),
            name: 'Peggy Gou',
            genres: ['House', 'Techno', 'Disco'],
            popularity: 90,
          },
          venue: {
            id: generateId('ra', 'venue_concrete'),
            name: 'Concrete',
            address: '69 Port de la Rapee',
            city: 'Paris',
            postalCode: '75012',
            arrondissement: '12e',
            latitude: 48.8439,
            longitude: 2.3656,
          },
          date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '23:00',
          endTime: '07:00',
          genre: 'House',
          price: { min: 25, max: 35, currency: '€' },
          ticketUrl: 'https://ra.co/events/paris',
          isSoldOut: false,
          source: 'residentAdvisor',
        },
        {
          id: generateId('ra', 'ra_3'),
          sourceId: 'ra_3',
          artist: {
            id: generateId('ra', 'artist_ra3'),
            name: 'Charlotte de Witte',
            genres: ['Techno', 'Acid Techno'],
            popularity: 92,
          },
          venue: {
            id: generateId('ra', 'venue_machine'),
            name: 'La Machine du Moulin Rouge',
            address: '90 Boulevard de Clichy',
            city: 'Paris',
            postalCode: '75018',
            arrondissement: '18e',
            latitude: 48.8842,
            longitude: 2.3324,
          },
          date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '23:00',
          endTime: '06:00',
          genre: 'Techno',
          price: { min: 28, max: 40, currency: '€' },
          ticketUrl: 'https://ra.co/events/paris',
          isSoldOut: true,
          source: 'residentAdvisor',
        },
        {
          id: generateId('ra', 'ra_4'),
          sourceId: 'ra_4',
          artist: {
            id: generateId('ra', 'artist_ra4'),
            name: 'Maceo Plex',
            genres: ['Techno', 'House', 'Electro'],
            popularity: 88,
          },
          venue: {
            id: generateId('ra', 'venue_rex2'),
            name: 'Rex Club',
            address: '5 Boulevard Poissonniere',
            city: 'Paris',
            postalCode: '75002',
            arrondissement: '2e',
            latitude: 48.8717,
            longitude: 2.3468,
          },
          date: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '23:30',
          endTime: '06:00',
          genre: 'Techno',
          price: { min: 22, max: 22, currency: '€' },
          ticketUrl: 'https://ra.co/events/paris',
          isSoldOut: false,
          source: 'residentAdvisor',
        },
        {
          id: generateId('ra', 'ra_5'),
          sourceId: 'ra_5',
          artist: {
            id: generateId('ra', 'artist_ra5'),
            name: 'Richie Hawtin',
            genres: ['Minimal Techno', 'Techno'],
            popularity: 95,
          },
          venue: {
            id: generateId('ra', 'venue_warehouse'),
            name: 'Warehouse Nanterre',
            address: 'Zone Industrielle',
            city: 'Nanterre',
            postalCode: '92000',
            latitude: 48.8924,
            longitude: 2.2071,
          },
          date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '22:00',
          endTime: '08:00',
          genre: 'Techno',
          price: { min: 35, max: 50, currency: '€' },
          ticketUrl: 'https://ra.co/events/paris',
          isSoldOut: false,
          source: 'residentAdvisor',
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
      console.error('Resident Advisor scraper error:', error);
      return [];
    }
  },
};
