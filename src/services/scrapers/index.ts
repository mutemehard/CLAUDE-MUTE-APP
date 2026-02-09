// Services de scraping pour les evenements
// Ce module coordonne les differents scrapers

import { Concert } from '../../types';
import { shotgunScraper } from './shotgun';
import { residentAdvisorScraper } from './residentAdvisor';
import { parisByScraper } from './parisBy';

export interface ScraperResult {
  concerts: Concert[];
  source: string;
  scrapedAt: string;
  error?: string;
}

export interface ScraperOptions {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

// Liste des scrapers disponibles
// DESACTIVES: Ces scrapers utilisent des donnees simulees, pas de vrais concerts
// TODO: Reactiver quand on aura des vrais scrapers qui fetchent depuis les sites
const scrapers = [
  { name: 'shotgun', scraper: shotgunScraper, enabled: false },
  { name: 'residentAdvisor', scraper: residentAdvisorScraper, enabled: false },
  { name: 'parisBy', scraper: parisByScraper, enabled: false },
];

// Scrape tous les evenements de toutes les sources
export const scrapeAllEvents = async (options: ScraperOptions = {}): Promise<ScraperResult[]> => {
  const results: ScraperResult[] = [];
  const enabledScrapers = scrapers.filter(s => s.enabled);

  // Execute tous les scrapers en parallele
  const promises = enabledScrapers.map(async ({ name, scraper }) => {
    try {
      const concerts = await scraper.scrape(options);
      return {
        concerts,
        source: name,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Scraper ${name} error:`, error);
      return {
        concerts: [],
        source: name,
        scrapedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  const scraperResults = await Promise.all(promises);
  return scraperResults;
};

// Merge les resultats de tous les scrapers
export const mergeScrapedConcerts = (results: ScraperResult[]): Concert[] => {
  const allConcerts = results.flatMap(r => r.concerts);

  // Deduplique par artiste + venue + date
  const seen = new Set<string>();
  return allConcerts.filter(concert => {
    const key = `${concert.artist.name.toLowerCase()}_${concert.venue.name.toLowerCase()}_${concert.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Export des scrapers individuels
export { shotgunScraper } from './shotgun';
export { residentAdvisorScraper } from './residentAdvisor';
export { parisByScraper } from './parisBy';
