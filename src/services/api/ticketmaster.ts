// Adapter pour l'API Ticketmaster Discovery
// Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
import { createApiClient } from './apiClient';
import { Artist, Concert, Venue } from '../../types';
import { API_CONFIG } from '../../config/api';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Types specifiques a Ticketmaster
interface TicketmasterImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
}

interface TicketmasterVenue {
  id: string;
  name: string;
  postalCode?: string;
  city?: {
    name: string;
  };
  address?: {
    line1: string;
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  images?: TicketmasterImage[];
}

interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: TicketmasterImage[];
  classifications?: Array<{
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  externalLinks?: {
    spotify?: Array<{ url: string }>;
    itunes?: Array<{ url: string }>;
  };
}

interface TicketmasterPriceRange {
  currency: string;
  min: number;
  max: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images?: TicketmasterImage[];
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    status?: {
      code: string;
    };
  };
  priceRanges?: TicketmasterPriceRange[];
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
  classifications?: Array<{
    genre?: { name: string };
    segment?: { name: string };
  }>;
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

const client = createApiClient(BASE_URL);

// Recupere la meilleure image disponible
const getBestImage = (images?: TicketmasterImage[]): string | undefined => {
  if (!images?.length) return undefined;
  // Prefere les images 16:9 ou 3:2 en haute resolution
  const preferred = images.find(img => img.ratio === '16_9' && img.width >= 640);
  return preferred?.url || images[0]?.url;
};

// Extrait les genres des classifications
const extractGenres = (event: TicketmasterEvent, attraction?: TicketmasterAttraction): string[] => {
  const genres: string[] = [];

  // Depuis l'evenement
  event.classifications?.forEach(c => {
    if (c.genre?.name && c.genre.name !== 'Undefined') {
      genres.push(c.genre.name);
    }
  });

  // Depuis l'attraction (artiste)
  attraction?.classifications?.forEach(c => {
    if (c.genre?.name && c.genre.name !== 'Undefined' && !genres.includes(c.genre.name)) {
      genres.push(c.genre.name);
    }
    if (c.subGenre?.name && c.subGenre.name !== 'Undefined' && !genres.includes(c.subGenre.name)) {
      genres.push(c.subGenre.name);
    }
  });

  return genres;
};

// Transforme une attraction Ticketmaster en Artist
const transformAttraction = (attraction: TicketmasterAttraction): Artist => ({
  id: `tm_${attraction.id}`,
  name: attraction.name,
  imageUrl: getBestImage(attraction.images),
  genres: attraction.classifications?.map(c => c.genre?.name).filter(Boolean) as string[] || [],
  popularity: undefined,
  spotifyUrl: attraction.externalLinks?.spotify?.[0]?.url,
  appleMusicUrl: attraction.externalLinks?.itunes?.[0]?.url,
});

// Transforme un venue Ticketmaster en Venue
const transformVenue = (venue: TicketmasterVenue): Venue => ({
  id: `tm_${venue.id}`,
  name: venue.name,
  address: venue.address?.line1 || '',
  city: venue.city?.name || 'Paris',
  postalCode: venue.postalCode || '',
  latitude: parseFloat(venue.location?.latitude || '48.8566'),
  longitude: parseFloat(venue.location?.longitude || '2.3522'),
  imageUrl: getBestImage(venue.images),
});

// Transforme un event Ticketmaster en Concert
const transformEvent = (event: TicketmasterEvent): Concert | null => {
  const tmVenue = event._embedded?.venues?.[0];
  const tmAttraction = event._embedded?.attractions?.[0];

  if (!tmVenue) return null;

  const venue = transformVenue(tmVenue);
  const artist: Artist = tmAttraction
    ? transformAttraction(tmAttraction)
    : {
        id: `tm_event_${event.id}`,
        name: event.name.replace(/ - .+$/, ''), // Nettoie le nom
        genres: extractGenres(event),
        imageUrl: getBestImage(event.images),
      };

  const genres = extractGenres(event, tmAttraction);

  return {
    id: `tm_${event.id}`,
    artist,
    venue,
    date: event.dates.start.localDate,
    startTime: event.dates.start.localTime?.slice(0, 5) || '20:00',
    price: event.priceRanges?.[0] ? {
      min: event.priceRanges[0].min,
      max: event.priceRanges[0].max,
      currency: event.priceRanges[0].currency,
    } : undefined,
    ticketUrl: event.url,
    source: 'ticketmaster',
    sourceId: event.id,
    genre: genres[0],
    isSoldOut: event.dates.status?.code === 'offsale',
    imageUrl: getBestImage(event.images),
  };
};

export const ticketmasterApi = {
  // Recherche des concerts a Paris et en Ile-de-France
  async getConcertsInParis(options: {
    startDate?: string;
    endDate?: string;
    keyword?: string;
    genre?: string;
    size?: number;
    page?: number;
  } = {}): Promise<Concert[]> {
    const apiKey = API_CONFIG.ticketmaster?.apiKey;
    if (!apiKey) {
      console.log('Ticketmaster API key not configured');
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const params: Record<string, string | number> = {
      apikey: apiKey,
      countryCode: 'FR',
      city: 'Paris',
      classificationName: 'music',
      startDateTime: `${options.startDate || today}T00:00:00Z`,
      endDateTime: `${endDate}T23:59:59Z`,
      size: options.size || 100,
      page: options.page || 0,
      sort: 'date,asc',
    };

    if (options.keyword) {
      params.keyword = options.keyword;
    }

    if (options.genre) {
      params.genreId = options.genre;
    }

    try {
      const response = await client.get<TicketmasterResponse>('/events.json', params);

      if (response.error || !response.data?._embedded?.events) {
        console.log('Ticketmaster API error:', response.error);
        return [];
      }

      const concerts = response.data._embedded.events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);

      console.log(`Ticketmaster: Found ${concerts.length} concerts in Paris`);
      return concerts;
    } catch (error) {
      console.error('Ticketmaster fetch error:', error);
      return [];
    }
  },

  // Recherche des concerts en Ile-de-France (rayon plus large)
  async getConcertsInIleDeFrance(options: {
    startDate?: string;
    endDate?: string;
    size?: number;
  } = {}): Promise<Concert[]> {
    const apiKey = API_CONFIG.ticketmaster?.apiKey;
    if (!apiKey) return [];

    const today = new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Recherche par coordonnees avec rayon de 50km autour de Paris
    const params: Record<string, string | number> = {
      apikey: apiKey,
      latlong: '48.8566,2.3522',
      radius: 50,
      unit: 'km',
      classificationName: 'music',
      startDateTime: `${options.startDate || today}T00:00:00Z`,
      endDateTime: `${endDate}T23:59:59Z`,
      size: options.size || 100,
      sort: 'date,asc',
    };

    try {
      const response = await client.get<TicketmasterResponse>('/events.json', params);

      if (response.error || !response.data?._embedded?.events) {
        return [];
      }

      return response.data._embedded.events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('Ticketmaster IDF fetch error:', error);
      return [];
    }
  },

  // Recherche par artiste
  async searchByArtist(artistName: string): Promise<Concert[]> {
    return this.getConcertsInParis({ keyword: artistName });
  },

  // Recupere les concerts ce soir
  async getTonightConcerts(): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getConcertsInParis({ startDate: today, endDate: today });
  },

  // Recupere les concerts du week-end
  async getWeekendConcerts(): Promise<Concert[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Calcule le prochain vendredi
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const friday = new Date(now);
    friday.setDate(friday.getDate() + (daysUntilFriday || 7));

    const sunday = new Date(friday);
    sunday.setDate(sunday.getDate() + 2);

    return this.getConcertsInParis({
      startDate: friday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    });
  },
};

export default ticketmasterApi;
