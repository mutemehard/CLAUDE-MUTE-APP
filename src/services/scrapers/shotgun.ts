// Scraper pour Shotgun (shotgun.live)
// Source principale pour les evenements electroniques a Paris

import { Concert, Artist, Venue } from '../../types';
import { ScraperOptions } from './index';

const SHOTGUN_API_URL = 'https://shotgun.live/api';
const PARIS_CITY_ID = 'paris';

interface ShotgunEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  ticketUrl?: string;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  venue: {
    id: string;
    name: string;
    address?: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  artists: Array<{
    id: string;
    name: string;
    genres?: string[];
    imageUrl?: string;
  }>;
  genres?: string[];
  soldOut?: boolean;
}

// Parse une date au format ISO
const parseDate = (dateStr: string): string => {
  return dateStr.split('T')[0];
};

// Parse l'heure
const parseTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Genere un ID unique
const generateId = (source: string, eventId: string): string => {
  return `${source}_${eventId}`;
};

// Transforme un evenement Shotgun en Concert
const transformEvent = (event: ShotgunEvent): Concert[] => {
  // Shotgun peut avoir plusieurs artistes par evenement
  // On cree un concert par artiste principal ou un seul concert avec l'artiste principal
  const mainArtist = event.artists[0];

  if (!mainArtist) {
    // Si pas d'artiste, on utilise le nom de l'evenement
    const artist: Artist = {
      id: generateId('shotgun', `artist_${event.id}`),
      name: event.name.split(' - ')[0].split(' @ ')[0].trim(),
      genres: event.genres || ['Electronic'],
      popularity: 50,
    };

    const venue: Venue = {
      id: generateId('shotgun', `venue_${event.venue.id}`),
      name: event.venue.name,
      address: event.venue.address || '',
      city: event.venue.city,
      postalCode: '',
      latitude: event.venue.latitude || 48.8566,
      longitude: event.venue.longitude || 2.3522,
    };

    return [{
      id: generateId('shotgun', event.id),
      artist,
      venue,
      date: parseDate(event.startDate),
      startTime: parseTime(event.startDate),
      endTime: event.endDate ? parseTime(event.endDate) : undefined,
      genre: event.genres?.[0] || 'Electronic',
      price: event.price ? {
        min: event.price.min,
        max: event.price.max,
        currency: event.price.currency || '€',
      } : undefined,
      ticketUrl: event.ticketUrl,
      imageUrl: event.imageUrl,
      isSoldOut: event.soldOut || false,
      source: 'shotgun',
    }];
  }

  // Avec artiste principal
  const artist: Artist = {
    id: generateId('shotgun', mainArtist.id),
    name: mainArtist.name,
    genres: mainArtist.genres || event.genres || ['Electronic'],
    imageUrl: mainArtist.imageUrl,
    popularity: 50,
  };

  const venue: Venue = {
    id: generateId('shotgun', event.venue.id),
    name: event.venue.name,
    address: event.venue.address || '',
    city: event.venue.city,
    postalCode: '',
    latitude: event.venue.latitude || 48.8566,
    longitude: event.venue.longitude || 2.3522,
  };

  return [{
    id: generateId('shotgun', event.id),
    artist,
    venue,
    date: parseDate(event.startDate),
    startTime: parseTime(event.startDate),
    endTime: event.endDate ? parseTime(event.endDate) : undefined,
    genre: event.genres?.[0] || mainArtist.genres?.[0] || 'Electronic',
    price: event.price ? {
      min: event.price.min,
      max: event.price.max,
      currency: event.price.currency || '€',
    } : undefined,
    ticketUrl: event.ticketUrl,
    imageUrl: event.imageUrl || mainArtist.imageUrl,
    isSoldOut: event.soldOut || false,
    source: 'shotgun',
  }];
};

// Fetch les evenements depuis Shotgun
const fetchEvents = async (options: ScraperOptions): Promise<ShotgunEvent[]> => {
  try {
    // Shotgun expose une API publique via GraphQL
    // On simule les donnees pour l'instant car l'API n'est pas documentee publiquement
    // Dans une vraie implementation, on utiliserait leur API GraphQL

    // Pour l'instant, on retourne des donnees simulees basees sur des vrais evenements
    const mockEvents: ShotgunEvent[] = [
      {
        id: 'sg_1',
        name: 'Concrete x MUTE',
        description: 'Soiree techno au Concrete',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        imageUrl: 'https://shotgun.live/events/concrete.jpg',
        ticketUrl: 'https://shotgun.live/events/concrete-mute',
        price: { min: 15, max: 25, currency: '€' },
        venue: {
          id: 'concrete',
          name: 'Concrete',
          address: '69 Port de la Rapee',
          city: 'Paris',
          latitude: 48.8439,
          longitude: 2.3656,
        },
        artists: [
          { id: 'dj1', name: 'Amelie Lens', genres: ['Techno'] },
          { id: 'dj2', name: 'I Hate Models', genres: ['Techno', 'Industrial'] },
        ],
        genres: ['Techno'],
        soldOut: false,
      },
      {
        id: 'sg_2',
        name: 'Rex Club presents',
        description: 'House music night',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        ticketUrl: 'https://shotgun.live/events/rex-club',
        price: { min: 18, max: 18, currency: '€' },
        venue: {
          id: 'rex',
          name: 'Rex Club',
          address: '5 Boulevard Poissonniere',
          city: 'Paris',
          latitude: 48.8717,
          longitude: 2.3468,
        },
        artists: [
          { id: 'dj3', name: 'Dixon', genres: ['House', 'Deep House'] },
        ],
        genres: ['House'],
        soldOut: false,
      },
      {
        id: 'sg_3',
        name: 'Trabendo Club Night',
        description: 'Electronic night at Le Trabendo',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        ticketUrl: 'https://shotgun.live/events/trabendo',
        price: { min: 22, max: 35, currency: '€' },
        venue: {
          id: 'trabendo',
          name: 'Le Trabendo',
          address: '211 Avenue Jean Jaures',
          city: 'Paris',
          latitude: 48.8893,
          longitude: 2.3934,
        },
        artists: [
          { id: 'dj4', name: 'Nina Kraviz', genres: ['Techno', 'Acid'] },
        ],
        genres: ['Techno'],
        soldOut: true,
      },
      {
        id: 'sg_4',
        name: 'Machine du Moulin Rouge',
        description: 'Warehouse party',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketUrl: 'https://shotgun.live/events/machine',
        price: { min: 12, max: 20, currency: '€' },
        venue: {
          id: 'machine',
          name: 'La Machine du Moulin Rouge',
          address: '90 Boulevard de Clichy',
          city: 'Paris',
          latitude: 48.8842,
          longitude: 2.3324,
        },
        artists: [
          { id: 'dj5', name: 'Solomun', genres: ['House', 'Melodic House'] },
        ],
        genres: ['House'],
        soldOut: false,
      },
      {
        id: 'sg_5',
        name: 'Petit Bain x Nowadays',
        description: 'Electronic and experimental',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        ticketUrl: 'https://shotgun.live/events/petit-bain',
        price: { min: 8, max: 15, currency: '€' },
        venue: {
          id: 'petitbain',
          name: 'Petit Bain',
          address: '7 Port de la Gare',
          city: 'Paris',
          latitude: 48.8296,
          longitude: 2.3758,
        },
        artists: [
          { id: 'dj6', name: 'Floating Points', genres: ['Electronic', 'Ambient'] },
        ],
        genres: ['Electronic'],
        soldOut: false,
      },
    ];

    return mockEvents;
  } catch (error) {
    console.error('Shotgun fetch error:', error);
    return [];
  }
};

// Scraper principal
export const shotgunScraper = {
  name: 'shotgun',

  async scrape(options: ScraperOptions = {}): Promise<Concert[]> {
    const events = await fetchEvents(options);
    const concerts = events.flatMap(transformEvent);

    // Filtre par date si specifie
    if (options.dateFrom || options.dateTo) {
      return concerts.filter(concert => {
        const concertDate = new Date(concert.date);
        if (options.dateFrom && concertDate < new Date(options.dateFrom)) return false;
        if (options.dateTo && concertDate > new Date(options.dateTo)) return false;
        return true;
      });
    }

    // Limite le nombre de resultats
    if (options.limit && concerts.length > options.limit) {
      return concerts.slice(0, options.limit);
    }

    return concerts;
  },
};
