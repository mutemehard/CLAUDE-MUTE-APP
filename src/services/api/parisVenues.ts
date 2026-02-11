// Scraper pour les salles de concert parisiennes
// Recupere les programmations directement depuis les sites des salles
import { Concert, Artist, Venue } from '../../types';

// Configuration des salles parisiennes majeures
interface VenueConfig {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  capacity: number;
  website: string;
  calendarUrl?: string;
  genres: string[];
}

const PARIS_VENUES: VenueConfig[] = [
  {
    id: 'olympia',
    name: "L'Olympia",
    address: '28 Boulevard des Capucines',
    city: 'Paris',
    postalCode: '75009',
    latitude: 48.8704,
    longitude: 2.3285,
    capacity: 1996,
    website: 'https://www.olympiahall.com',
    calendarUrl: 'https://www.olympiahall.com/programmation/',
    genres: ['Pop', 'Rock', 'Chanson'],
  },
  {
    id: 'bataclan',
    name: 'Le Bataclan',
    address: '50 Boulevard Voltaire',
    city: 'Paris',
    postalCode: '75011',
    latitude: 48.8631,
    longitude: 2.3701,
    capacity: 1500,
    website: 'https://www.bataclan.fr',
    calendarUrl: 'https://www.bataclan.fr/programmation/',
    genres: ['Rock', 'Pop', 'Indie'],
  },
  {
    id: 'zenith',
    name: 'Zenith Paris - La Villette',
    address: '211 Avenue Jean Jaures',
    city: 'Paris',
    postalCode: '75019',
    latitude: 48.8934,
    longitude: 2.3932,
    capacity: 6293,
    website: 'https://www.zenith-paris.fr',
    calendarUrl: 'https://www.zenith-paris.fr/agenda',
    genres: ['Pop', 'Rock', 'Rap', 'Variete'],
  },
  {
    id: 'accor_arena',
    name: 'Accor Arena',
    address: '8 Boulevard de Bercy',
    city: 'Paris',
    postalCode: '75012',
    latitude: 48.8388,
    longitude: 2.3788,
    capacity: 20300,
    website: 'https://www.accor-arena.com',
    calendarUrl: 'https://www.accor-arena.com/fr/agenda',
    genres: ['Pop', 'Rock', 'Rap', 'International'],
  },
  {
    id: 'philharmonie',
    name: 'Philharmonie de Paris',
    address: '221 Avenue Jean Jaures',
    city: 'Paris',
    postalCode: '75019',
    latitude: 48.8909,
    longitude: 2.3936,
    capacity: 2400,
    website: 'https://philharmoniedeparis.fr',
    calendarUrl: 'https://philharmoniedeparis.fr/fr/programmation',
    genres: ['Classique', 'Jazz', 'World'],
  },
  {
    id: 'cigale',
    name: 'La Cigale',
    address: '120 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    latitude: 48.8822,
    longitude: 2.3401,
    capacity: 1400,
    website: 'https://www.lacigale.fr',
    calendarUrl: 'https://www.lacigale.fr/programmation/',
    genres: ['Rock', 'Pop', 'Indie', 'Hip-Hop'],
  },
  {
    id: 'trianon',
    name: 'Le Trianon',
    address: '80 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    latitude: 48.8826,
    longitude: 2.3448,
    capacity: 1100,
    website: 'https://www.letrianon.fr',
    calendarUrl: 'https://www.letrianon.fr/programmation/',
    genres: ['Pop', 'Rock', 'Electro'],
  },
  {
    id: 'elysee_montmartre',
    name: 'Elysee Montmartre',
    address: '72 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    latitude: 48.8826,
    longitude: 2.3455,
    capacity: 1500,
    website: 'https://www.elysee-montmartre.com',
    calendarUrl: 'https://www.elysee-montmartre.com/programmation/',
    genres: ['Rock', 'Electro', 'Indie'],
  },
  {
    id: 'casino_paris',
    name: 'Casino de Paris',
    address: '16 Rue de Clichy',
    city: 'Paris',
    postalCode: '75009',
    latitude: 48.8797,
    longitude: 2.3292,
    capacity: 1500,
    website: 'https://www.casinodeparis.fr',
    calendarUrl: 'https://www.casinodeparis.fr/agenda',
    genres: ['Variete', 'Pop', 'Humour'],
  },
  {
    id: 'trabendo',
    name: 'Le Trabendo',
    address: 'Parc de la Villette',
    city: 'Paris',
    postalCode: '75019',
    latitude: 48.8915,
    longitude: 2.3934,
    capacity: 700,
    website: 'https://www.letrabendo.fr',
    calendarUrl: 'https://www.letrabendo.fr/programmation/',
    genres: ['Rock', 'Indie', 'Electro'],
  },
  {
    id: 'cabaret_sauvage',
    name: 'Cabaret Sauvage',
    address: 'Parc de la Villette',
    city: 'Paris',
    postalCode: '75019',
    latitude: 48.8924,
    longitude: 2.3908,
    capacity: 1200,
    website: 'https://www.cabaretsauvage.com',
    calendarUrl: 'https://www.cabaretsauvage.com/programmation/',
    genres: ['World', 'Jazz', 'Electro'],
  },
  {
    id: 'new_morning',
    name: 'New Morning',
    address: '7-9 Rue des Petites Ecuries',
    city: 'Paris',
    postalCode: '75010',
    latitude: 48.8742,
    longitude: 2.3509,
    capacity: 500,
    website: 'https://www.newmorning.com',
    calendarUrl: 'https://www.newmorning.com/programmation/',
    genres: ['Jazz', 'Blues', 'World', 'Soul'],
  },
  {
    id: 'gaite_lyrique',
    name: 'La Gaite Lyrique',
    address: '3bis Rue Papin',
    city: 'Paris',
    postalCode: '75003',
    latitude: 48.8666,
    longitude: 2.3541,
    capacity: 1000,
    website: 'https://www.gaite-lyrique.net',
    calendarUrl: 'https://www.gaite-lyrique.net/programme',
    genres: ['Electro', 'Experimental', 'Hip-Hop'],
  },
  {
    id: 'salle_pleyel',
    name: 'Salle Pleyel',
    address: '252 Rue du Faubourg Saint-Honore',
    city: 'Paris',
    postalCode: '75008',
    latitude: 48.8775,
    longitude: 2.3006,
    capacity: 1913,
    website: 'https://www.sallepleyel.com',
    calendarUrl: 'https://www.sallepleyel.com/saison',
    genres: ['Classique', 'Jazz'],
  },
  {
    id: 'theatre_chatelet',
    name: 'Theatre du Chatelet',
    address: '1 Place du Chatelet',
    city: 'Paris',
    postalCode: '75001',
    latitude: 48.8579,
    longitude: 2.3476,
    capacity: 2500,
    website: 'https://www.chatelet.com',
    calendarUrl: 'https://www.chatelet.com/saison/',
    genres: ['Classique', 'Opera', 'Musical'],
  },
  {
    id: 'maroquinerie',
    name: 'La Maroquinerie',
    address: '23 Rue Boyer',
    city: 'Paris',
    postalCode: '75020',
    latitude: 48.8681,
    longitude: 2.3906,
    capacity: 450,
    website: 'https://www.lamaroquinerie.fr',
    calendarUrl: 'https://www.lamaroquinerie.fr/programmation/',
    genres: ['Rock', 'Indie', 'Folk'],
  },
  {
    id: 'boule_noire',
    name: 'La Boule Noire',
    address: '120 Boulevard de Rochechouart',
    city: 'Paris',
    postalCode: '75018',
    latitude: 48.8822,
    longitude: 2.3401,
    capacity: 250,
    website: 'https://www.laboule-noire.fr',
    calendarUrl: 'https://www.laboule-noire.fr/programmation/',
    genres: ['Rock', 'Indie', 'Pop'],
  },
  {
    id: 'point_ephemere',
    name: 'Point Ephemere',
    address: '200 Quai de Valmy',
    city: 'Paris',
    postalCode: '75010',
    latitude: 48.8814,
    longitude: 2.3679,
    capacity: 400,
    website: 'https://www.pointephemere.org',
    calendarUrl: 'https://www.pointephemere.org/agenda/',
    genres: ['Electro', 'Experimental', 'Indie'],
  },
  {
    id: 'supersonic',
    name: 'Le Supersonic',
    address: '9 Rue Biscornet',
    city: 'Paris',
    postalCode: '75012',
    latitude: 48.8522,
    longitude: 2.3703,
    capacity: 200,
    website: 'https://www.supersonic-club.fr',
    calendarUrl: 'https://www.supersonic-club.fr/agenda/',
    genres: ['Rock', 'Garage', 'Punk'],
  },
];

// Interface pour les evenements scrapes
interface ScrapedEvent {
  title: string;
  date: string;
  time?: string;
  artists: string[];
  imageUrl?: string;
  ticketUrl?: string;
  price?: string;
  description?: string;
}

// Parse une chaine de prix en objet
const parsePrice = (priceStr?: string): { min: number; max: number; currency: string } | undefined => {
  if (!priceStr) return undefined;

  const match = priceStr.match(/(\d+(?:[.,]\d+)?)\s*(?:€|EUR)?(?:\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:€|EUR)?)?/i);
  if (!match) return undefined;

  const min = parseFloat(match[1].replace(',', '.'));
  const max = match[2] ? parseFloat(match[2].replace(',', '.')) : min;

  return { min, max, currency: 'EUR' };
};

// Transforme un venue config en Venue
const configToVenue = (config: VenueConfig): Venue => ({
  id: `pv_${config.id}`,
  name: config.name,
  address: config.address,
  city: config.city,
  postalCode: config.postalCode,
  latitude: config.latitude,
  longitude: config.longitude,
});

// Transforme un evenement scrape en Concert
const transformScrapedEvent = (
  event: ScrapedEvent,
  venueConfig: VenueConfig
): Concert | null => {
  if (!event.date || !event.artists.length) return null;

  const artist: Artist = {
    id: `pv_${event.artists[0].toLowerCase().replace(/\s+/g, '_')}`,
    name: event.artists[0],
    genres: venueConfig.genres,
  };

  const venue = configToVenue(venueConfig);

  return {
    id: `pv_${venueConfig.id}_${event.date}_${artist.id}`,
    artist,
    venue,
    date: event.date,
    startTime: event.time || '20:00',
    price: parsePrice(event.price),
    ticketUrl: event.ticketUrl || venueConfig.website,
    source: 'venue',
    sourceId: `${venueConfig.id}_${event.date}`,
    genre: venueConfig.genres[0],
    imageUrl: event.imageUrl,
    description: event.description,
  };
};

// Scraper generique pour les pages de programmation
const scrapeVenuePage = async (venueConfig: VenueConfig): Promise<ScrapedEvent[]> => {
  if (!venueConfig.calendarUrl) return [];

  try {
    const response = await fetch(venueConfig.calendarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const events: ScrapedEvent[] = [];

    // Strategie 1: Recherche de JSON-LD
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const item of items) {
          if (item['@type'] === 'MusicEvent' || item['@type'] === 'Event') {
            const dateStr = item.startDate || item.date;
            if (!dateStr) continue;

            const date = new Date(dateStr);
            const formattedDate = date.toISOString().split('T')[0];
            const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            const artistName = item.performer?.name ||
              item.performer?.[0]?.name ||
              item.name?.split(' - ')[0] ||
              item.name;

            events.push({
              title: item.name,
              date: formattedDate,
              time,
              artists: [artistName],
              imageUrl: item.image?.url || item.image,
              ticketUrl: item.offers?.url || item.url,
              price: item.offers?.price ? `${item.offers.price}€` : undefined,
              description: item.description,
            });
          }
        }
      } catch {
        // JSON invalide, continuer
      }
    }

    // Strategie 2: Patterns HTML communs (si pas de JSON-LD)
    if (events.length === 0) {
      // Pattern pour dates format YYYY-MM-DD ou DD/MM/YYYY
      const datePatterns = [
        /data-date="(\d{4}-\d{2}-\d{2})"/g,
        /datetime="(\d{4}-\d{2}-\d{2})/g,
        /(\d{2}\/\d{2}\/\d{4})/g,
      ];

      // Recherche des articles/cartes d'evenements
      const eventBlocks = html.matchAll(/<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi);
      for (const block of eventBlocks) {
        const blockHtml = block[1];

        // Extraction de la date
        let date: string | undefined;
        for (const pattern of datePatterns) {
          const dateMatch = blockHtml.match(pattern);
          if (dateMatch) {
            date = dateMatch[1];
            if (date.includes('/')) {
              const [d, m, y] = date.split('/');
              date = `${y}-${m}-${d}`;
            }
            break;
          }
        }

        // Extraction du titre/artiste
        const titleMatch = blockHtml.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

        // Extraction de l'image
        const imgMatch = blockHtml.match(/src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
        const imageUrl = imgMatch ? imgMatch[1] : undefined;

        // Extraction du lien
        const linkMatch = blockHtml.match(/href="([^"]+)"/i);
        const ticketUrl = linkMatch ? new URL(linkMatch[1], venueConfig.website).href : undefined;

        if (date && title) {
          events.push({
            title,
            date,
            artists: [title.split(' - ')[0].split(' + ')[0].trim()],
            imageUrl,
            ticketUrl,
          });
        }
      }
    }

    return events;
  } catch (error) {
    console.error(`[ParisVenues] Error scraping ${venueConfig.name}:`, error);
    return [];
  }
};

// Utilise l'API Fnac Spectacles comme source de donnees
const getFnacEvents = async (venueId: string): Promise<ScrapedEvent[]> => {
  try {
    const response = await fetch(`https://www.fnacspectacles.com/api/v2/events?venue=${venueId}&limit=50`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.events || []).map((e: any) => ({
      title: e.name,
      date: e.date?.split('T')[0],
      time: e.time,
      artists: e.artists?.map((a: any) => a.name) || [e.name],
      imageUrl: e.image,
      ticketUrl: e.url,
      price: e.price_range,
    }));
  } catch {
    return [];
  }
};

export const parisVenuesApi = {
  // Liste des salles disponibles
  getVenues(): Venue[] {
    return PARIS_VENUES.map(configToVenue);
  },

  // Recupere la config d'une salle
  getVenueConfig(venueId: string): VenueConfig | undefined {
    return PARIS_VENUES.find(v => v.id === venueId);
  },

  // Recupere les evenements d'une salle specifique
  async getVenueEvents(venueId: string): Promise<Concert[]> {
    const venueConfig = PARIS_VENUES.find(v => v.id === venueId);
    if (!venueConfig) return [];

    const events = await scrapeVenuePage(venueConfig);

    return events
      .map(e => transformScrapedEvent(e, venueConfig))
      .filter((c): c is Concert => c !== null);
  },

  // Recupere tous les evenements de toutes les salles
  async getAllEvents(options: {
    startDate?: string;
    endDate?: string;
    venueIds?: string[];
  } = {}): Promise<Concert[]> {
    const venues = options.venueIds
      ? PARIS_VENUES.filter(v => options.venueIds!.includes(v.id))
      : PARIS_VENUES;

    const results = await Promise.allSettled(
      venues.map(async venue => {
        const events = await scrapeVenuePage(venue);
        return events
          .map(e => transformScrapedEvent(e, venue))
          .filter((c): c is Concert => c !== null);
      })
    );

    let concerts: Concert[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        concerts = concerts.concat(result.value);
      }
    }

    // Filtre par date si specifie
    if (options.startDate || options.endDate) {
      const start = options.startDate ? new Date(options.startDate) : new Date(0);
      const end = options.endDate ? new Date(options.endDate) : new Date('2099-12-31');

      concerts = concerts.filter(c => {
        const date = new Date(c.date);
        return date >= start && date <= end;
      });
    }

    // Tri par date
    concerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`[ParisVenues] Found ${concerts.length} events from ${venues.length} venues`);

    return concerts;
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

    return this.getAllEvents({
      startDate: friday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    });
  },

  // Recupere les evenements de ce soir
  async getTonightEvents(): Promise<Concert[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAllEvents({
      startDate: today,
      endDate: today,
    });
  },

  // Recherche par artiste
  async searchByArtist(artistName: string): Promise<Concert[]> {
    const allEvents = await this.getAllEvents();
    const lowerQuery = artistName.toLowerCase();

    return allEvents.filter(concert =>
      concert.artist.name.toLowerCase().includes(lowerQuery) ||
      concert.description?.toLowerCase().includes(lowerQuery)
    );
  },

  // Recherche par salle
  async searchByVenue(venueName: string): Promise<Concert[]> {
    const lowerQuery = venueName.toLowerCase();
    const matchingVenues = PARIS_VENUES.filter(v =>
      v.name.toLowerCase().includes(lowerQuery)
    );

    if (matchingVenues.length === 0) return [];

    return this.getAllEvents({
      venueIds: matchingVenues.map(v => v.id),
    });
  },

  // Recherche par genre
  async searchByGenre(genre: string): Promise<Concert[]> {
    const lowerGenre = genre.toLowerCase();
    const matchingVenues = PARIS_VENUES.filter(v =>
      v.genres.some(g => g.toLowerCase().includes(lowerGenre))
    );

    if (matchingVenues.length === 0) return [];

    return this.getAllEvents({
      venueIds: matchingVenues.map(v => v.id),
    });
  },
};

export default parisVenuesApi;
