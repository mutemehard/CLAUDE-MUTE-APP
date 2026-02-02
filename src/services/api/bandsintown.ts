// Adapter pour l'API Bandsintown
// Documentation: https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0
import { createApiClient, ApiResponse } from './apiClient';
import { Artist, Concert, Venue } from '../../types';

const BASE_URL = 'https://rest.bandsintown.com';
const APP_ID = 'mute_concert_app'; // A remplacer par votre app_id

// Types specifiques a Bandsintown
interface BandsintownArtist {
  id: string;
  name: string;
  url: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url: string;
  mbid: string;
  tracker_count: number;
  upcoming_event_count: number;
}

interface BandsintownVenue {
  name: string;
  latitude: string;
  longitude: string;
  city: string;
  region: string;
  country: string;
}

interface BandsintownEvent {
  id: string;
  artist_id: string;
  url: string;
  on_sale_datetime: string;
  datetime: string;
  description: string;
  venue: BandsintownVenue;
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup: string[];
}

const client = createApiClient(BASE_URL);

// Transforme un artiste Bandsintown en format MUTE
const transformArtist = (bit: BandsintownArtist): Artist => ({
  id: `bit_${bit.id}`,
  name: bit.name,
  imageUrl: bit.image_url,
  genres: [], // Bandsintown ne fournit pas les genres
  popularity: Math.min(100, Math.round(bit.tracker_count / 1000)), // Estimation
  description: undefined,
  spotifyUrl: undefined,
  appleMusicUrl: undefined,
});

// Transforme un event Bandsintown en format MUTE
const transformEvent = (event: BandsintownEvent, artist: Artist): Concert => {
  const datetime = new Date(event.datetime);
  const venue: Venue = {
    id: `bit_venue_${event.venue.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: event.venue.name,
    address: '', // Non fourni par Bandsintown
    city: event.venue.city,
    postalCode: '', // Non fourni
    latitude: parseFloat(event.venue.latitude),
    longitude: parseFloat(event.venue.longitude),
  };

  return {
    id: `bit_${event.id}`,
    artist,
    venue,
    date: datetime.toISOString().split('T')[0],
    startTime: datetime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    ticketUrl: event.offers?.[0]?.url || event.url,
    source: 'bandsintown',
    sourceId: event.id,
    isSoldOut: event.offers?.some(o => o.status === 'sold_out'),
    description: event.description || undefined,
  };
};

export const bandsintownApi = {
  // Recherche un artiste par nom
  async searchArtist(artistName: string): Promise<Artist | null> {
    const response = await client.get<BandsintownArtist>(`/artists/${encodeURIComponent(artistName)}`, {
      app_id: APP_ID,
    });

    if (response.error || !response.data) {
      console.log('Bandsintown searchArtist error:', response.error);
      return null;
    }

    return transformArtist(response.data);
  },

  // Recupere les concerts d'un artiste
  async getArtistEvents(artistName: string): Promise<Concert[]> {
    // D'abord recuperer l'artiste
    const artist = await this.searchArtist(artistName);
    if (!artist) return [];

    const response = await client.get<BandsintownEvent[]>(`/artists/${encodeURIComponent(artistName)}/events`, {
      app_id: APP_ID,
      date: 'upcoming', // ou 'all', 'past', ou une date range 'YYYY-MM-DD,YYYY-MM-DD'
    });

    if (response.error || !response.data) {
      console.log('Bandsintown getArtistEvents error:', response.error);
      return [];
    }

    return response.data.map(event => transformEvent(event, artist));
  },

  // Recupere les concerts d'un artiste dans une ville
  async getArtistEventsInCity(artistName: string, city: string): Promise<Concert[]> {
    const events = await this.getArtistEvents(artistName);
    return events.filter(event =>
      event.venue.city.toLowerCase().includes(city.toLowerCase())
    );
  },

  // Recupere les concerts a Paris
  async getArtistEventsInParis(artistName: string): Promise<Concert[]> {
    return this.getArtistEventsInCity(artistName, 'Paris');
  },
};

// Export pour utilisation dans d'autres services
export default bandsintownApi;
