// Scraper pour Resident Advisor - Source principale pour l'electro a Paris
// Note: RA n'a pas d'API publique, on utilise leur GraphQL internal API
import { createApiClient } from './apiClient';
import { Concert, Artist, Venue } from '../../types';

const BASE_URL = 'https://ra.co/graphql';

// Types pour l'API GraphQL de RA
interface RAImage {
  filename: string;
}

interface RAVenue {
  id: number;
  name: string;
  address: string;
  area: {
    name: string;
    country: {
      name: string;
    };
  };
  contentUrl: string;
}

interface RAArtist {
  id: number;
  name: string;
  contentUrl: string;
  image?: RAImage;
}

interface RAEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  contentUrl: string;
  images: RAImage[];
  venue: RAVenue;
  artists: RAArtist[];
  pick: boolean;
  cost: string;
  attending: number;
}

interface RAEventsResponse {
  data: {
    listing: {
      data: RAEvent[];
      totalResults: number;
    };
  };
}

const client = createApiClient(BASE_URL);

// Query GraphQL pour les evenements
const EVENTS_QUERY = `
  query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) {
    listing(filters: $filters, pageSize: $pageSize, page: 1, sort: { attending: DESCENDING }) {
      data {
        ... on Event {
          id
          title
          date
          startTime
          endTime
          contentUrl
          images {
            filename
          }
          venue {
            id
            name
            address
            area {
              name
              country {
                name
              }
            }
            contentUrl
          }
          artists {
            id
            name
            contentUrl
            image {
              filename
            }
          }
          pick
          cost
          attending
        }
      }
      totalResults
    }
  }
`;

// Construit l'URL d'image RA
const buildImageUrl = (filename?: string, size: string = '770x770'): string | undefined => {
  if (!filename) return undefined;
  return `https://ra.co/images/events/flyer/${filename}`;
};

// Transforme un artiste RA en format MUTE
const transformArtist = (raArtist: RAArtist): Artist => ({
  id: `ra_${raArtist.id}`,
  name: raArtist.name,
  imageUrl: buildImageUrl(raArtist.image?.filename),
  genres: ['Electronic', 'Techno'], // RA est principalement electro
  popularity: undefined,
});

// Transforme un venue RA en format MUTE
const transformVenue = (raVenue: RAVenue): Venue => ({
  id: `ra_${raVenue.id}`,
  name: raVenue.name,
  address: raVenue.address || '',
  city: raVenue.area?.name || 'Paris',
  postalCode: '',
  latitude: 48.8566, // Default Paris, a ameliorer avec geocoding
  longitude: 2.3522,
});

// Transforme un event RA en format MUTE
const transformEvent = (event: RAEvent): Concert | null => {
  if (!event.venue || !event.artists?.length) return null;

  const artist = transformArtist(event.artists[0]);
  const venue = transformVenue(event.venue);

  // Parse le prix (format: "15 - 25 EUR" ou "Free")
  let price: { min: number; max: number; currency: string } | undefined;
  if (event.cost && event.cost !== 'Free' && event.cost !== 'TBA') {
    const priceMatch = event.cost.match(/(\d+)(?:\s*-\s*(\d+))?\s*(\w+)?/);
    if (priceMatch) {
      price = {
        min: parseInt(priceMatch[1], 10),
        max: parseInt(priceMatch[2] || priceMatch[1], 10),
        currency: priceMatch[3] || 'EUR',
      };
    }
  }

  return {
    id: `ra_${event.id}`,
    artist,
    venue,
    date: event.date,
    startTime: event.startTime || '23:00',
    endTime: event.endTime,
    price,
    ticketUrl: `https://ra.co${event.contentUrl}`,
    source: 'residentAdvisor',
    sourceId: String(event.id),
    genre: 'Electronic',
    imageUrl: buildImageUrl(event.images?.[0]?.filename),
    description: event.title !== artist.name ? event.title : undefined,
  };
};

// Salles parisiennes populaires sur RA
const PARIS_VENUES_IDS = [
  3394,   // Rex Club
  5765,   // Concrete
  61547,  // Djoon
  127419, // Badaboum
  134089, // La Machine du Moulin Rouge
  2247,   // Batofar
  4283,   // Wanderlust
  167619, // Dehors Brut
  127707, // Glazart
  75459,  // Petit Bain
  54855,  // Trabendo
  139,    // Elysee Montmartre
  169035, // Cabaret Sauvage
  107579, // Garage
  169247, // Weather Paris
];

export const residentAdvisorApi = {
  // Recupere les evenements a Paris
  async getParisEvents(options: {
    startDate?: string;
    endDate?: string;
    pageSize?: number;
  } = {}): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://ra.co/events/fr/paris',
        },
        body: JSON.stringify({
          query: EVENTS_QUERY,
          variables: {
            filters: {
              areas: { eq: 44 }, // Paris area ID
              listingDate: {
                gte: options.startDate || today,
                lte: endDate,
              },
            },
            pageSize: options.pageSize || 100,
          },
        }),
      });

      if (!response.ok) {
        console.warn('[RA] API error:', response.status);
        return [];
      }

      const data: RAEventsResponse = await response.json();
      const events = data.data?.listing?.data || [];

      console.log(`[RA] Found ${events.length} events in Paris`);

      return events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('[RA] Fetch error:', error);
      return [];
    }
  },

  // Recupere les evenements du weekend
  async getWeekendEvents(): Promise<Concert[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;

    const friday = new Date(now);
    friday.setDate(friday.getDate() + (daysUntilFriday || 7));

    const sunday = new Date(friday);
    sunday.setDate(sunday.getDate() + 2);

    return this.getParisEvents({
      startDate: friday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    });
  },

  // Recupere les evenements de ce soir
  async getTonightEvents(): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getParisEvents({
      startDate: today,
      endDate: today,
    });
  },

  // Recherche par artiste
  async searchByArtist(artistName: string): Promise<Concert[]> {
    // RA n'a pas de recherche par artiste facile via GraphQL
    // On filtre les resultats localement
    const events = await this.getParisEvents({ pageSize: 200 });
    const lowerQuery = artistName.toLowerCase();

    return events.filter(concert =>
      concert.artist.name.toLowerCase().includes(lowerQuery)
    );
  },
};

export default residentAdvisorApi;
