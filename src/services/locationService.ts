// Service de localisation pour obtenir la position de l'utilisateur
import * as Location from 'expo-location';
import { UserLocation } from '../types';
import { APP_CONFIG } from '../constants';

class LocationService {
  private static instance: LocationService;
  private lastKnownLocation: UserLocation | null = null;
  private permissionStatus: Location.PermissionStatus | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Demande la permission de localisation
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionStatus = status;
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  /**
   * Verifie si la permission est accordee
   */
  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.permissionStatus = status;
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la verification de permission:', error);
      return false;
    }
  }

  /**
   * Obtient la position actuelle de l'utilisateur
   */
  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      // Verifie d'abord la permission
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          console.log('Permission de localisation refusee');
          return this.getDefaultLocation();
        }
      }

      // Obtient la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding pour obtenir le nom de la ville
      let city: string | undefined;
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        city = address?.city || address?.subregion || undefined;
      } catch (geocodeError) {
        console.warn('Erreur reverse geocoding:', geocodeError);
      }

      this.lastKnownLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city,
      };

      return this.lastKnownLocation;
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la position:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * Obtient la derniere position connue (plus rapide)
   */
  async getLastKnownLocation(): Promise<UserLocation | null> {
    if (this.lastKnownLocation) {
      return this.lastKnownLocation;
    }

    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return this.getDefaultLocation();
      }

      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        this.lastKnownLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        return this.lastKnownLocation;
      }

      return this.getDefaultLocation();
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la derniere position:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * Retourne la position par defaut (Paris)
   */
  getDefaultLocation(): UserLocation {
    return {
      latitude: APP_CONFIG.defaultCoordinates.latitude,
      longitude: APP_CONFIG.defaultCoordinates.longitude,
      city: 'Paris',
    };
  }

  /**
   * Calcule la distance entre deux points (formule de Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  /**
   * Verifie si un point est a une certaine distance
   */
  isWithinDistance(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number,
    maxDistanceKm: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= maxDistanceKm;
  }

  /**
   * Formate la distance pour l'affichage
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Surveille les changements de position (optionnel)
   */
  async watchPosition(
    callback: (location: UserLocation) => void,
    options?: { distanceInterval?: number }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 100, // 100m par defaut
        },
        (location) => {
          const userLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          this.lastKnownLocation = userLocation;
          callback(userLocation);
        }
      );
    } catch (error) {
      console.error('Erreur lors du watch position:', error);
      return null;
    }
  }
}

export const locationService = LocationService.getInstance();
