// Scraper pour Dice - Billetterie populaire avec beaucoup de concerts a Paris
// Dice a une API GraphQL interne
import { Concert, Artist, Venue } from '../../types';

const BASE_URL = 'https://api.dice.fm';
const GRAPHQL_URL = 'https://dice.fm/api/graphql';

// Types pour l'API Dice
interface DiceImage {
  url: string;
  width?: number;
  height?: number;
}

interface DiceVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface DiceArtist {
  id: string;
  name: string;
  images?: DiceImage[];
}

interface DiceEvent {
  id: string;
  name: string;
  date: string;
  doors_open?: string;
  show_starts?: string;
  show_ends?: string;
  description?: string;
  venue: DiceVenue;
  lineup?: DiceArtist[];
  images?: DiceImage[];
  price?: {
    total: number;
    currency: string;
  };
  max_price?: {
    total: number;
    currency: string;
  };
  url: string;
  sold_out?: boolean;
  genre?: string;
  tags?: string[];
}

// Query GraphQL pour Dice
const EVENTS_QUERY = `
  query EventsInCity($city: String!, $after: String, $first: Int) {
    events(city: $city, after: $after, first: $first, filter: { genres: ["music"] }) {
      edges {
        node {
          id
          name
          date
          doors_open
          show_starts
          show_ends
          description
          venue {
            id
            name
            address
            city
            country
            latitude
            longitude
          }
          lineup {
            id
            name
            images {
              url
            }
          }
          images {
            url
          }
          price {
            total
            currency
          }
          max_price {
            total
            currency
          }
          url
          sold_out
          genre
          tags
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Transforme un artiste Dice en format MUTE
const transformArtist = (diceArtist: DiceArtist | undefined, eventName: string): Artist => {
  if (diceArtist) {
    return {
      id: `dice_${diceArtist.id}`,
      name: diceArtist.name,
      imageUrl: diceArtist.images?.[0]?.url,
      genres: [],
    };
  }

  // Extrait le nom de l'artiste du titre de l'evenement
  const artistName = eventName
    .split(' - ')[0]
    .split(' @ ')[0]
    .split(' | ')[0]
    .split(' presents ')[0]
    .trim();

  return {
    id: `dice_event_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
    name: artistName,
    genres: [],
  };
};

// Transforme un venue Dice en format MUTE
const transformVenue = (diceVenue: DiceVenue): Venue => ({
  id: `dice_${diceVenue.id}`,
  name: diceVenue.name,
  address: diceVenue.address || '',
  city: diceVenue.city || 'Paris',
  postalCode: '',
  latitude: diceVenue.latitude || 48.8566,
  longitude: diceVenue.longitude || 2.3522,
});

// Transforme un event Dice en format MUTE
const transformEvent = (event: DiceEvent): Concert | null => {
  if (!event.venue) return null;

  const artist = transformArtist(event.lineup?.[0], event.name);
  const venue = transformVenue(event.venue);

  const eventDate = new Date(event.date);
  const date = eventDate.toISOString().split('T')[0];
  const startTime = event.show_starts
    ? new Date(event.show_starts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : event.doors_open
      ? new Date(event.doors_open).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '20:00';

  return {
    id: `dice_${event.id}`,
    artist,
    venue,
    date,
    startTime,
    endTime: event.show_ends
      ? new Date(event.show_ends).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    price: event.price ? {
      min: event.price.total / 100,
      max: event.max_price ? event.max_price.total / 100 : event.price.total / 100,
      currency: event.price.currency || 'EUR',
    } : undefined,
    ticketUrl: event.url || `https://dice.fm/event/${event.id}`,
    source: 'dice',
    sourceId: event.id,
    genre: event.genre || event.tags?.[0],
    imageUrl: event.images?.[0]?.url,
    description: event.description,
    isSoldOut: event.sold_out,
  };
};

export const diceApi = {
  // Recupere les evenements a Paris via l'API REST
  async getParisEvents(options: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Concert[]> {
    try {
      // Dice utilise un endpoint REST pour la liste des evenements
      const params = new URLSearchParams({
        city: 'paris',
        country: 'fr',
        page: String(options.page || 1),
        limit: String(options.limit || 100),
      });

      if (options.startDate) params.append('from', options.startDate);
      if (options.endDate) params.append('to', options.endDate);

      const response = await fetch(`${BASE_URL}/v1/events?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          'x-dice-version': '3.0.0',
        },
      });

      if (!response.ok) {
        console.warn('[Dice] API error:', response.status);
        return this.getEventsFromWeb(options);
      }

      const data = await response.json();
      const events: DiceEvent[] = data.events || data.data || [];

      console.log(`[Dice] Found ${events.length} events in Paris`);

      return events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('[Dice] API error:', error);
      return this.getEventsFromWeb(options);
    }
  },

  // Fallback: recuperation depuis la page web
  async getEventsFromWeb(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Concert[]> {
    try {
      const response = await fetch('https://dice.fm/browse/paris', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      });

      if (!response.ok) return [];

      const html = await response.text();

      // Cherche les donnees JSON embedees
      const jsonMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?\})<\/script>/);
      if (!jsonMatch) return [];

      const nextData = JSON.parse(jsonMatch[1]);
      const pageProps = nextData.props?.pageProps;

      if (!pageProps?.events) return [];

      const events: DiceEvent[] = pageProps.events;

      return events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('[Dice] Web scraping error:', error);
      return [];
    }
  },

  // Recupere les evenements via GraphQL
  async getEventsGraphQL(city: string = 'Paris', first: number = 100): Promise<Concert[]> {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify({
          query: EVENTS_QUERY,
          variables: { city, first },
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const edges = data.data?.events?.edges || [];
      const events = edges.map((edge: { node: DiceEvent }) => edge.node);

      return events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('[Dice] GraphQL error:', error);
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
    const events = await this.getParisEvents({ limit: 200 });
    const lowerQuery = artistName.toLowerCase();

    return events.filter(concert =>
      concert.artist.name.toLowerCase().includes(lowerQuery) ||
      concert.description?.toLowerCase().includes(lowerQuery)
    );
  },
};

export default diceApi;
