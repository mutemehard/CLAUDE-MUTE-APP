// Hook pour l'integration calendrier
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { calendarService } from '../services';
import { Concert } from '../types';

interface UseCalendarResult {
  addToCalendar: (concert: Concert) => Promise<boolean>;
  isAdding: boolean;
  calendarIds: Record<string, string>; // concertId -> eventId
  isInCalendar: (concertId: string) => boolean;
}

export const useCalendar = (): UseCalendarResult => {
  const [isAdding, setIsAdding] = useState(false);
  const [calendarIds, setCalendarIds] = useState<Record<string, string>>({});

  const addToCalendar = useCallback(async (concert: Concert): Promise<boolean> => {
    // Verifie si deja ajoute
    if (calendarIds[concert.id]) {
      Alert.alert(
        'Deja ajoute',
        'Ce concert est deja dans ton calendrier',
        [{ text: 'OK' }]
      );
      return false;
    }

    setIsAdding(true);

    try {
      const result = await calendarService.addConcert(concert);

      if (result.success && result.eventId) {
        setCalendarIds(prev => ({
          ...prev,
          [concert.id]: result.eventId!,
        }));

        Alert.alert(
          'Ajoute au calendrier',
          `${concert.artist.name} @ ${concert.venue.name} a ete ajoute a ton calendrier`,
          [{ text: 'Super !' }]
        );
        return true;
      } else {
        Alert.alert(
          'Erreur',
          result.error || 'Impossible d\'ajouter au calendrier',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'ajout au calendrier',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsAdding(false);
    }
  }, [calendarIds]);

  const isInCalendar = useCallback((concertId: string): boolean => {
    return !!calendarIds[concertId];
  }, [calendarIds]);

  return {
    addToCalendar,
    isAdding,
    calendarIds,
    isInCalendar,
  };
};
