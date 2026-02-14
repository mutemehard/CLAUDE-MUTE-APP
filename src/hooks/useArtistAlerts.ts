// Hook pour les alertes d'artistes favoris
// Notifie quand un artiste suivi a un nouveau concert

import { useEffect, useMemo, useCallback } from 'react';
import { useStore } from './useStore';
import { Concert } from '../types';

interface ArtistAlert {
  artistId: string;
  artistName: string;
  concertCount: number;
  nextConcert: Concert | null;
  allConcerts: Concert[];
}

interface UseArtistAlertsReturn {
  alerts: ArtistAlert[];
  hasAlerts: boolean;
  totalNewConcerts: number;
  dismissAlert: (artistId: string) => void;
  markAllAsRead: () => void;
}

/**
 * Hook pour suivre les alertes de concerts des artistes favoris
 */
export function useArtistAlerts(): UseArtistAlertsReturn {
  const { concerts, followedArtists } = useStore();

  // Trouve les concerts des artistes suivis
  const alerts = useMemo(() => {
    if (followedArtists.length === 0 || concerts.length === 0) {
      return [];
    }

    const now = new Date();
    const alertsMap = new Map<string, ArtistAlert>();

    // Filtre les concerts futurs des artistes suivis
    concerts.forEach(concert => {
      const concertDate = new Date(concert.date);
      if (concertDate < now) return; // Ignorer les concerts passes

      // Verifier si l'artiste est suivi (par ID ou nom)
      const isFollowed = followedArtists.some(
        followed =>
          followed === concert.artist.id ||
          followed.toLowerCase() === concert.artist.name.toLowerCase()
      );

      if (!isFollowed) return;

      const artistId = concert.artist.id;
      const existing = alertsMap.get(artistId);

      if (existing) {
        existing.concertCount++;
        existing.allConcerts.push(concert);
        // Mettre a jour le prochain concert si celui-ci est plus proche
        if (
          !existing.nextConcert ||
          new Date(concert.date) < new Date(existing.nextConcert.date)
        ) {
          existing.nextConcert = concert;
        }
      } else {
        alertsMap.set(artistId, {
          artistId,
          artistName: concert.artist.name,
          concertCount: 1,
          nextConcert: concert,
          allConcerts: [concert],
        });
      }
    });

    // Trier par date du prochain concert
    return Array.from(alertsMap.values()).sort((a, b) => {
      if (!a.nextConcert || !b.nextConcert) return 0;
      return (
        new Date(a.nextConcert.date).getTime() -
        new Date(b.nextConcert.date).getTime()
      );
    });
  }, [concerts, followedArtists]);

  const hasAlerts = alerts.length > 0;

  const totalNewConcerts = useMemo(
    () => alerts.reduce((sum, alert) => sum + alert.concertCount, 0),
    [alerts]
  );

  // Fonctions pour gerer les alertes (a connecter au store si necessaire)
  const dismissAlert = useCallback((artistId: string) => {
    // TODO: Implementer la logique de dismiss dans le store
    console.log('Dismiss alert for artist:', artistId);
  }, []);

  const markAllAsRead = useCallback(() => {
    // TODO: Implementer la logique de mark all as read dans le store
    console.log('Mark all alerts as read');
  }, []);

  return {
    alerts,
    hasAlerts,
    totalNewConcerts,
    dismissAlert,
    markAllAsRead,
  };
}

/**
 * Hook simplifie pour verifier si un artiste a des concerts
 */
export function useArtistHasConcerts(artistName: string): {
  hasConcerts: boolean;
  upcomingCount: number;
  nextConcertDate: string | null;
} {
  const { concerts } = useStore();

  return useMemo(() => {
    const now = new Date();
    const artistConcerts = concerts.filter(c => {
      const concertDate = new Date(c.date);
      return (
        concertDate >= now &&
        c.artist.name.toLowerCase() === artistName.toLowerCase()
      );
    });

    const sorted = artistConcerts.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      hasConcerts: artistConcerts.length > 0,
      upcomingCount: artistConcerts.length,
      nextConcertDate: sorted[0]?.date || null,
    };
  }, [concerts, artistName]);
}

/**
 * Hook pour obtenir des suggestions d'artistes similaires
 */
export function useSimilarArtists(
  artistId: string,
  limit: number = 5
): string[] {
  const { concerts, followedArtists } = useStore();

  return useMemo(() => {
    // Trouve les genres de l'artiste
    const artistConcerts = concerts.filter(c => c.artist.id === artistId);
    const artistGenres = new Set<string>();
    artistConcerts.forEach(c => {
      if (c.genre) artistGenres.add(c.genre.toLowerCase());
      c.artist.genres?.forEach(g => artistGenres.add(g.toLowerCase()));
    });

    if (artistGenres.size === 0) return [];

    // Trouve d'autres artistes avec les memes genres
    const similarArtistsMap = new Map<string, number>();

    concerts.forEach(c => {
      if (c.artist.id === artistId) return;
      if (followedArtists.includes(c.artist.id)) return; // Deja suivi

      let matchScore = 0;
      if (c.genre && artistGenres.has(c.genre.toLowerCase())) {
        matchScore += 2;
      }
      c.artist.genres?.forEach(g => {
        if (artistGenres.has(g.toLowerCase())) matchScore += 1;
      });

      if (matchScore > 0) {
        const current = similarArtistsMap.get(c.artist.name) || 0;
        similarArtistsMap.set(c.artist.name, current + matchScore);
      }
    });

    // Trier par score et retourner les top
    return Array.from(similarArtistsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }, [concerts, artistId, followedArtists, limit]);
}

export default {
  useArtistAlerts,
  useArtistHasConcerts,
  useSimilarArtists,
};
