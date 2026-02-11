// Scraper pour Shotgun - Billetterie populaire pour l'electro a Paris
// Shotgun a une API interne utilisee par leur app
import { Concert, Artist, Venue } from '../../types';

const BASE_URL = 'https://api.shotgun.live/api/v2';

// Types pour l'API Shotgun
interface ShotgunImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

interface ShotgunVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface ShotgunArtist {
  id: string;
  name: string;
  image?: ShotgunImage;
}

interface ShotgunEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  start_time: string;
  end_time?: string;
  venue: ShotgunVenue;
  lineup?: ShotgunArtist[];
  image?: ShotgunImage;
  cover?: ShotgunImage;
  min_price?: number;
  max_price?: number;
  currency?: string;
  tickets_url?: string;
  sold_out?: boolean;
  tags?: string[];
}

interface ShotgunEventsResponse {
  events: ShotgunEvent[];
  total: number;
  page: number;
  per_page: number;
}

// Transforme un artiste Shotgun en format MUTE
const transformArtist = (sgArtist: ShotgunArtist | undefined, eventTitle: string): Artist => {
  if (sgArtist) {
    return {
      id: `sg_${sgArtist.id}`,
      name: sgArtist.name,
      imageUrl: sgArtist.image?.url,
      genres: ['Electronic'],
    };
  }

  // Si pas d'artiste, utilise le titre de l'evenement
  return {
    id: `sg_event_${eventTitle.toLowerCase().replace(/\s+/g, '_')}`,
    name: eventTitle.split(' - ')[0].split(' @ ')[0].trim(),
    genres: ['Electronic'],
  };
};

// Transforme un venue Shotgun en format MUTE
const transformVenue = (sgVenue: ShotgunVenue): Venue => ({
  id: `sg_${sgVenue.id}`,
  name: sgVenue.name,
  address: sgVenue.address || '',
  city: sgVenue.city || 'Paris',
  postalCode: '',
  latitude: sgVenue.latitude || 48.8566,
  longitude: sgVenue.longitude || 2.3522,
});

// Transforme un event Shotgun en format MUTE
const transformEvent = (event: ShotgunEvent): Concert | null => {
  if (!event.venue) return null;

  const artist = transformArtist(event.lineup?.[0], event.title);
  const venue = transformVenue(event.venue);

  const startDate = new Date(event.start_time);
  const date = startDate.toISOString().split('T')[0];
  const startTime = startDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let genre = 'Electronic';
  if (event.tags?.length) {
    const genreTag = event.tags.find(t =>
      ['techno', 'house', 'electro', 'drum and bass', 'trance', 'ambient'].includes(t.toLowerCase())
    );
    if (genreTag) {
      genre = genreTag.charAt(0).toUpperCase() + genreTag.slice(1);
    }
  }

  return {
    id: `sg_${event.id}`,
    artist,
    venue,
    date,
    startTime,
    endTime: event.end_time ? new Date(event.end_time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }) : undefined,
    price: event.min_price ? {
      min: event.min_price / 100, // Shotgun stocke en centimes
      max: (event.max_price || event.min_price) / 100,
      currency: event.currency || 'EUR',
    } : undefined,
    ticketUrl: event.tickets_url || `https://shotgun.live/events/${event.slug}`,
    source: 'shotgun',
    sourceId: event.id,
    genre,
    imageUrl: event.cover?.url || event.image?.url,
    description: event.description,
    isSoldOut: event.sold_out,
  };
};

export const shotgunApi = {
  // Recupere les evenements a Paris
  async getParisEvents(options: {
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  } = {}): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const params = new URLSearchParams({
        city: 'paris',
        country: 'fr',
        start_date: options.startDate || today,
        end_date: endDate,
        page: String(options.page || 1),
        per_page: String(options.perPage || 100),
        sort: 'start_time',
      });

      const response = await fetch(`${BASE_URL}/events?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      });

      if (!response.ok) {
        console.warn('[Shotgun] API error:', response.status);
        // Fallback: essayer l'endpoint public web
        return this.getEventsFromWeb(options);
      }

      const data: ShotgunEventsResponse = await response.json();
      const events = data.events || [];

      console.log(`[Shotgun] Found ${events.length} events in Paris`);

      return events
        .map(transformEvent)
        .filter((c): c is Concert => c !== null);
    } catch (error) {
      console.error('[Shotgun] Fetch error:', error);
      // Fallback vers le scraping web
      return this.getEventsFromWeb(options);
    }
  },

  // Fallback: recuperation depuis la page web
  async getEventsFromWeb(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Concert[]> {
    try {
      const response = await fetch('https://shotgun.live/fr/cities/paris', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      });

      if (!response.ok) return [];

      const html = await response.text();

      // Cherche les donnees JSON embedees dans la page
      const jsonMatch = html.match(/__NUXT_DATA__\s*=\s*(\[[\s\S]*?\])\s*<\/script>/);
      if (!jsonMatch) return [];

      // Parse les donnees (format Nuxt 3)
      const nuxtData = JSON.parse(jsonMatch[1]);

      // Extraction des evenements depuis les donnees Nuxt
      const concerts: Concert[] = [];

      // Les donnees Nuxt sont complexes, on cherche les objets qui ressemblent a des evenements
      nuxtData.forEach((item: any) => {
        if (item && typeof item === 'object' && item.id && item.title && item.venue) {
          const concert = transformEvent(item as ShotgunEvent);
          if (concert) concerts.push(concert);
        }
      });

      return concerts;
    } catch (error) {
      console.error('[Shotgun] Web scraping error:', error);
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
    const events = await this.getParisEvents({ perPage: 200 });
    const lowerQuery = artistName.toLowerCase();

    return events.filter(concert =>
      concert.artist.name.toLowerCase().includes(lowerQuery) ||
      concert.description?.toLowerCase().includes(lowerQuery)
    );
  },
};

export default shotgunApi;
