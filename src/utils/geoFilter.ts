// Utilitaires de filtrage geographique
// Permet de filtrer les concerts par distance

import { Concert, Venue } from '../types';

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcule la distance entre deux points en km (formule de Haversine)
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

/**
 * Formate une distance pour l'affichage
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
};

/**
 * Options de filtre par distance
 */
export const DISTANCE_FILTERS = [
  { label: 'Tout Paris', value: null, maxKm: null },
  { label: '< 1 km', value: 1, maxKm: 1 },
  { label: '< 2 km', value: 2, maxKm: 2 },
  { label: '< 5 km', value: 5, maxKm: 5 },
  { label: '< 10 km', value: 10, maxKm: 10 },
  { label: '< 20 km', value: 20, maxKm: 20 },
] as const;

/**
 * Filtre les concerts par distance depuis une position
 */
export const filterConcertsByDistance = (
  concerts: Concert[],
  userLocation: Coordinates,
  maxDistanceKm: number | null
): Concert[] => {
  if (maxDistanceKm === null) {
    return concerts;
  }

  return concerts.filter(concert => {
    const distance = calculateDistance(userLocation, {
      latitude: concert.venue.latitude,
      longitude: concert.venue.longitude,
    });
    return distance <= maxDistanceKm;
  });
};

/**
 * Trie les concerts par distance depuis une position
 */
export const sortConcertsByDistance = (
  concerts: Concert[],
  userLocation: Coordinates
): Concert[] => {
  return [...concerts].sort((a, b) => {
    const distA = calculateDistance(userLocation, {
      latitude: a.venue.latitude,
      longitude: a.venue.longitude,
    });
    const distB = calculateDistance(userLocation, {
      latitude: b.venue.latitude,
      longitude: b.venue.longitude,
    });
    return distA - distB;
  });
};

/**
 * Ajoute les distances aux concerts
 */
export const addDistancesToConcerts = (
  concerts: Concert[],
  userLocation: Coordinates
): (Concert & { distance: number; formattedDistance: string })[] => {
  return concerts.map(concert => {
    const distance = calculateDistance(userLocation, {
      latitude: concert.venue.latitude,
      longitude: concert.venue.longitude,
    });
    return {
      ...concert,
      distance,
      formattedDistance: formatDistance(distance),
    };
  });
};

/**
 * Filtre les venues par distance
 */
export const filterVenuesByDistance = (
  venues: Venue[],
  userLocation: Coordinates,
  maxDistanceKm: number
): Venue[] => {
  return venues.filter(venue => {
    const distance = calculateDistance(userLocation, {
      latitude: venue.latitude,
      longitude: venue.longitude,
    });
    return distance <= maxDistanceKm;
  });
};

/**
 * Groupe les concerts par zone geographique
 */
export const groupConcertsByZone = (
  concerts: Concert[],
  userLocation: Coordinates
): Record<string, Concert[]> => {
  const zones: Record<string, Concert[]> = {
    'Tres proche (< 1 km)': [],
    'Proche (1-5 km)': [],
    'Moyen (5-10 km)': [],
    'Loin (> 10 km)': [],
  };

  concerts.forEach(concert => {
    const distance = calculateDistance(userLocation, {
      latitude: concert.venue.latitude,
      longitude: concert.venue.longitude,
    });

    if (distance < 1) {
      zones['Tres proche (< 1 km)'].push(concert);
    } else if (distance < 5) {
      zones['Proche (1-5 km)'].push(concert);
    } else if (distance < 10) {
      zones['Moyen (5-10 km)'].push(concert);
    } else {
      zones['Loin (> 10 km)'].push(concert);
    }
  });

  return zones;
};

/**
 * Trouve le concert le plus proche
 */
export const findNearestConcert = (
  concerts: Concert[],
  userLocation: Coordinates
): Concert | null => {
  if (concerts.length === 0) return null;

  let nearest = concerts[0];
  let minDistance = calculateDistance(userLocation, {
    latitude: nearest.venue.latitude,
    longitude: nearest.venue.longitude,
  });

  concerts.forEach(concert => {
    const distance = calculateDistance(userLocation, {
      latitude: concert.venue.latitude,
      longitude: concert.venue.longitude,
    });
    if (distance < minDistance) {
      minDistance = distance;
      nearest = concert;
    }
  });

  return nearest;
};

/**
 * Calcule le centre geographique d'une liste de concerts
 */
export const calculateConcertsCenter = (
  concerts: Concert[]
): Coordinates | null => {
  if (concerts.length === 0) return null;

  const sum = concerts.reduce(
    (acc, concert) => ({
      latitude: acc.latitude + concert.venue.latitude,
      longitude: acc.longitude + concert.venue.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / concerts.length,
    longitude: sum.longitude / concerts.length,
  };
};

export default {
  calculateDistance,
  formatDistance,
  filterConcertsByDistance,
  sortConcertsByDistance,
  addDistancesToConcerts,
  filterVenuesByDistance,
  groupConcertsByZone,
  findNearestConcert,
  calculateConcertsCenter,
  DISTANCE_FILTERS,
};
