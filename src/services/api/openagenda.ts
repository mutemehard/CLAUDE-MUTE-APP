// Adapter pour l'API OpenAgenda
// Documentation: https://openagenda.zendesk.com/hc/fr/articles/203034982-Documentation-de-l-API
import { createApiClient, ApiResponse } from './apiClient';
import { Concert, Artist, Venue } from '../../types';

const BASE_URL = 'https://api.openagenda.com/v2';
const API_KEY = ''; // A configurer avec votre cle API OpenAgenda

// Types specifiques a OpenAgenda
interface OpenAgendaLocation {
  uid: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  department: string;
  region: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  website?: string;
  capacity?: number;
}

interface OpenAgendaEvent {
  uid: number;
  slug: string;
  title: { fr: string; en?: string };
  description?: { fr: string; en?: string };
  longDescription?: { fr: string; en?: string };
  keywords?: { fr: string[] };
  image?: {
    base: string;
    filename: string;
  };
  location: OpenAgendaLocation;
  timings: Array<{
    start: string;
    end: string;
  }>;
  registration?: Array<{
    type: string;
    value?: string;
  }>;
  attendanceMode?: 'offline' | 'online' | 'mixed';
  status?: 'scheduled' | 'rescheduled' | 'cancelled';
  accessibility?: {
    hi?: boolean; // Handicap auditif
    pi?: boolean; // Handicap psychique
    vi?: boolean; // Handicap visuel
    mi?: boolean; // Handicap moteur
    ii?: boolean; // Handicap intellectuel
  };
  age?: {
    min?: number;
    max?: number;
  };
  conditions?: {
    max?: number;
    min?: number;
    price?: string;
  };
}

interface OpenAgendaSearchResponse {
  total: number;
  offset: number;
  events: OpenAgendaEvent[];
}

const client = createApiClient(BASE_URL);

// Extrait le prix d'une chaine de texte
const extractPrice = (priceStr?: string): { min: number; max: number } | undefined => {
  if (!priceStr) return undefined;

  // Cas "Gratuit"
  if (priceStr.toLowerCase().includes('gratuit') || priceStr.toLowerCase().includes('free')) {
    return { min: 0, max: 0 };
  }

  // Essaie d'extraire les nombres
  const numbers = priceStr.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers) return undefined;

  const prices = numbers.map(n => parseFloat(n.replace(',', '.')));
  if (prices.length === 0) return undefined;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

// Transforme un event OpenAgenda en format MUTE
const transformEvent = (event: OpenAgendaEvent): Concert | null => {
  // Prend le premier timing
  const timing = event.timings?.[0];
  if (!timing) return null;

  const startDate = new Date(timing.start);
  const endDate = timing.end ? new Date(timing.end) : undefined;

  // Cree un artiste a partir du titre de l'evenement
  const artist: Artist = {
    id: `oa_artist_${event.uid}`,
    name: event.title.fr,
    imageUrl: event.image ? `${event.image.base}${event.image.filename}` : undefined,
    genres: event.keywords?.fr || [],
    popularity: undefined,
    description: event.description?.fr,
  };

  // Cree le venue
  const venue: Venue = {
    id: `oa_venue_${event.location.uid}`,
    name: event.location.name,
    address: event.location.address,
    city: event.location.city,
    postalCode: event.location.postalCode,
    latitude: event.location.latitude,
    longitude: event.location.longitude,
    website: event.location.website,
    capacity: event.location.capacity,
  };

  // Determine l'arrondissement si Paris
  let arrondissement: string | undefined;
  if (event.location.city === 'Paris' && event.location.postalCode) {
    const code = event.location.postalCode;
    if (code.startsWith('75')) {
      const arr = parseInt(code.slice(-2), 10);
      if (arr >= 1 && arr <= 20) {
        arrondissement = `${arr}${arr === 1 ? 'er' : 'e'}`;
      }
    }
  }
  venue.arrondissement = arrondissement;

  // Extrait le prix
  const price = extractPrice(event.conditions?.price);

  // Trouve le lien de billetterie
  const ticketUrl = event.registration?.find(r => r.type === 'link')?.value;

  return {
    id: `oa_${event.uid}`,
    artist,
    venue,
    date: startDate.toISOString().split('T')[0],
    startTime: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    endTime: endDate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    price: price ? { ...price, currency: 'EUR' } : undefined,
    ticketUrl,
    source: 'openagenda',
    sourceId: String(event.uid),
    genre: event.keywords?.fr?.[0],
    isSoldOut: false,
    imageUrl: event.image ? `${event.image.base}${event.image.filename}` : undefined,
    description: event.longDescription?.fr || event.description?.fr,
  };
};

export const openagendaApi = {
  // Recherche des evenements avec des filtres
  async searchEvents(options: {
    query?: string;
    city?: string;
    categories?: string[];
    from?: string; // Date ISO
    to?: string; // Date ISO
    limit?: number;
    offset?: number;
  }): Promise<Concert[]> {
    if (!API_KEY) {
      console.warn('OpenAgenda: API key not configured');
      return [];
    }

    const params: Record<string, string | number | boolean | undefined> = {
      key: API_KEY,
      size: options.limit || 50,
      from: options.offset || 0,
      monolingual: 'fr',
    };

    // Filtre par texte
    if (options.query) {
      params['what'] = options.query;
    }

    // Filtre par ville
    if (options.city) {
      params['locationCity'] = options.city;
    }

    // Filtre par date
    if (options.from) {
      params['timings[gte]'] = options.from;
    }
    if (options.to) {
      params['timings[lte]'] = options.to;
    }

    // Agendas de concerts/musique a Paris
    // Ces IDs sont a configurer selon les agendas que vous voulez suivre
    const MUSIC_AGENDA_IDS: string[] = [
      // Exemples d'agendas musicaux parisiens:
      // '12345678', // Agenda concerts Paris
    ];

    const allEvents: Concert[] = [];

    // Pour chaque agenda, recuperer les evenements
    for (const agendaId of MUSIC_AGENDA_IDS) {
      const response = await client.get<OpenAgendaSearchResponse>(
        `/agendas/${agendaId}/events`,
        params
      );

      if (response.data?.events) {
        const concerts = response.data.events
          .map(transformEvent)
          .filter((c): c is Concert => c !== null);
        allEvents.push(...concerts);
      }
    }

    return allEvents;
  },

  // Recupere les concerts a Paris
  async getParisEvents(options: {
    query?: string;
    from?: string;
    to?: string;
    limit?: number;
  } = {}): Promise<Concert[]> {
    return this.searchEvents({
      ...options,
      city: 'Paris',
    });
  },

  // Recupere les concerts du jour
  async getTodayEvents(): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getParisEvents({
      from: today,
      to: today,
    });
  },

  // Recupere les concerts de la semaine
  async getWeekEvents(): Promise<Concert[]> {
    const today = new Date();
    const weekLater = new Date();
    weekLater.setDate(today.getDate() + 7);

    return this.getParisEvents({
      from: today.toISOString().split('T')[0],
      to: weekLater.toISOString().split('T')[0],
    });
  },

  // Recherche par artiste/nom
  async searchByQuery(query: string): Promise<Concert[]> {
    return this.getParisEvents({ query });
  },
};

export default openagendaApi;
