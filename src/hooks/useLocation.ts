// Hook pour utiliser le service de localisation
import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services';
import { UserLocation } from '../types';
import { useStore } from './useStore';

interface UseLocationResult {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  getDistanceFromUser: (lat: number, lon: number) => number | null;
  formatDistance: (lat: number, lon: number) => string | null;
}

export const useLocation = (): UseLocationResult => {
  const { userLocation, setUserLocation } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Verifie la permission au montage
  useEffect(() => {
    let isMounted = true;

    const checkAndFetchLocation = async () => {
      const permitted = await locationService.checkPermission();
      if (!isMounted) return;
      setHasPermission(permitted);

      // Si permission accordee, on recupere la position
      if (permitted) {
        setIsLoading(true);
        try {
          const location = await locationService.getCurrentLocation();
          if (isMounted && location) {
            setUserLocation(location);
          }
        } catch {
          // Silent fail on initial load
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    checkAndFetchLocation();

    return () => {
      isMounted = false;
    };
  }, [setUserLocation]);

  // Demande la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const granted = await locationService.requestPermission();
      setHasPermission(granted);
      if (granted) {
        await refreshLocation();
      }
      return granted;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rafraichit la position
  const refreshLocation = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        setError('Impossible d\'obtenir la position');
      }
    } catch (err) {
      setError('Erreur lors de la recuperation de la position');
    } finally {
      setIsLoading(false);
    }
  }, [setUserLocation]);

  // Calcule la distance depuis la position de l'utilisateur
  const getDistanceFromUser = useCallback(
    (lat: number, lon: number): number | null => {
      if (!userLocation) return null;
      return locationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lon
      );
    },
    [userLocation]
  );

  // Formate la distance pour l'affichage
  const formatDistance = useCallback(
    (lat: number, lon: number): string | null => {
      const distance = getDistanceFromUser(lat, lon);
      if (distance === null) return null;
      return locationService.formatDistance(distance);
    },
    [getDistanceFromUser]
  );

  return {
    location: userLocation,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    refreshLocation,
    getDistanceFromUser,
    formatDistance,
  };
};
