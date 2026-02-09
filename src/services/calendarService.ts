// Service d'integration calendrier iOS/Android
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Concert } from '../types';

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

// Demande les permissions calendrier
export const requestCalendarPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Calendar permission error:', error);
    return false;
  }
};

// Verifie si on a les permissions
export const hasCalendarPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

// Recupere le calendrier par defaut ou en cree un
const getDefaultCalendarId = async (): Promise<string | null> => {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Sur iOS, cherche le calendrier par defaut
    if (Platform.OS === 'ios') {
      const defaultCalendar = calendars.find(
        cal => cal.source?.name === 'iCloud' || cal.source?.name === 'Default'
      );
      if (defaultCalendar) return defaultCalendar.id;

      // Sinon prend le premier calendrier modifiable
      const writableCalendar = calendars.find(cal => cal.allowsModifications);
      if (writableCalendar) return writableCalendar.id;
    }

    // Sur Android
    if (Platform.OS === 'android') {
      const primaryCalendar = calendars.find(
        cal => cal.isPrimary && cal.allowsModifications
      );
      if (primaryCalendar) return primaryCalendar.id;

      // Sinon prend le premier calendrier modifiable
      const writableCalendar = calendars.find(cal => cal.allowsModifications);
      if (writableCalendar) return writableCalendar.id;

      // Si aucun calendrier, en cree un
      const newCalendarId = await Calendar.createCalendarAsync({
        title: 'MUTE Concerts',
        color: '#FF4D4D',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: calendars[0]?.source?.id,
        source: {
          isLocalAccount: true,
          name: 'MUTE',
          type: Calendar.SourceType.LOCAL,
        },
        name: 'MUTE Concerts',
        ownerAccount: 'MUTE',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      return newCalendarId;
    }

    return calendars[0]?.id || null;
  } catch (error) {
    console.error('Get calendar error:', error);
    return null;
  }
};

// Formate les details du concert pour l'evenement
const formatConcertDetails = (concert: Concert): string => {
  const lines = [];

  if (concert.artist.genres.length > 0) {
    lines.push(`Genre: ${concert.artist.genres.join(', ')}`);
  }

  if (concert.price) {
    if (concert.price.min === concert.price.max) {
      lines.push(`Prix: ${concert.price.min}${concert.price.currency}`);
    } else {
      lines.push(`Prix: ${concert.price.min} - ${concert.price.max}${concert.price.currency}`);
    }
  }

  if (concert.ticketUrl) {
    lines.push(`Billets: ${concert.ticketUrl}`);
  }

  lines.push('');
  lines.push('Ajoute via MUTE - L\'app des concerts a Paris');

  return lines.join('\n');
};

// Ajoute un concert au calendrier
export const addConcertToCalendar = async (concert: Concert): Promise<CalendarEventResult> => {
  try {
    // Verifie les permissions
    const hasPermission = await hasCalendarPermission();
    if (!hasPermission) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        return {
          success: false,
          error: 'Permission calendrier refusee',
        };
      }
    }

    // Recupere le calendrier
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      return {
        success: false,
        error: 'Aucun calendrier disponible',
      };
    }

    // Parse la date et l'heure
    const [hours, minutes] = concert.startTime.split(':').map(Number);
    const startDate = new Date(concert.date);
    startDate.setHours(hours, minutes, 0, 0);

    // Date de fin (par defaut 3h apres)
    const endDate = new Date(startDate);
    if (concert.endTime) {
      const [endHours, endMinutes] = concert.endTime.split(':').map(Number);
      // Gere le cas ou le concert finit apres minuit
      if (endHours < hours) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endDate.setHours(endHours, endMinutes, 0, 0);
    } else {
      endDate.setHours(startDate.getHours() + 3);
    }

    // Cree l'evenement
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${concert.artist.name} @ ${concert.venue.name}`,
      startDate,
      endDate,
      location: `${concert.venue.name}, ${concert.venue.address}, ${concert.venue.city}`,
      notes: formatConcertDetails(concert),
      timeZone: 'Europe/Paris',
      alarms: [
        { relativeOffset: -60 * 24 }, // 1 jour avant
        { relativeOffset: -60 * 2 },  // 2 heures avant
      ],
    });

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    console.error('Add to calendar error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout au calendrier',
    };
  }
};

// Supprime un evenement du calendrier
export const removeConcertFromCalendar = async (eventId: string): Promise<boolean> => {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    console.error('Remove from calendar error:', error);
    return false;
  }
};

// Verifie si un concert est deja dans le calendrier (recherche approximative)
export const isConcertInCalendar = async (concert: Concert): Promise<string | null> => {
  try {
    const hasPermission = await hasCalendarPermission();
    if (!hasPermission) return null;

    const startDate = new Date(concert.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(concert.date);
    endDate.setHours(23, 59, 59, 999);

    const events = await Calendar.getEventsAsync(
      [(await getDefaultCalendarId()) || ''],
      startDate,
      endDate
    );

    // Cherche un evenement qui correspond
    const matchingEvent = events.find(
      event => event.title?.includes(concert.artist.name) ||
               event.title?.includes(concert.venue.name)
    );

    return matchingEvent?.id || null;
  } catch (error) {
    console.error('Check calendar error:', error);
    return null;
  }
};

// Service exporte
export const calendarService = {
  requestPermission: requestCalendarPermission,
  hasPermission: hasCalendarPermission,
  addConcert: addConcertToCalendar,
  removeConcert: removeConcertFromCalendar,
  isConcertInCalendar,
};
