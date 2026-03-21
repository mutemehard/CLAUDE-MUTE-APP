export { concertService, artistService, venueService } from './concertService';
export { mockConcerts, mockArtists, mockVenues } from './mockData';

// APIs externes
export {
  apiClient,
  bandsintownApi,
  openagendaApi,
  ticketmasterApi,
  residentAdvisorApi,
  shotgunApi,
  diceApi,
  parisVenuesApi,
} from './api';

// Scrapers
export { scrapeAllEvents, mergeScrapedConcerts } from './scrapers';

// Notifications
export { notificationService } from './notificationService';
export type { NotificationSettings } from './notificationService';

// Storage
export { storageService } from './storageService';

// Cache (offline support)
export { cacheService } from './cacheService';

// Location
export { locationService } from './locationService';

// Calendar
export { calendarService } from './calendarService';
export type { CalendarEventResult } from './calendarService';

// Recommendations
export { recommendationService } from './recommendationService';
