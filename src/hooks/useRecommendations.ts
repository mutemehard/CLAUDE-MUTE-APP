// Hook pour les recommandations personnalisees
import { useState, useEffect, useCallback } from 'react';
import { useStore } from './useStore';
import { recommendationService } from '../services';
import { Concert } from '../types';

interface RecommendationsState {
  personalized: Concert[];
  trending: Concert[];
  discoveries: Concert[];
  budgetFriendly: Concert[];
  isLoading: boolean;
  error: string | null;
}

interface UseRecommendationsResult extends RecommendationsState {
  refresh: () => Promise<void>;
  getSimilar: (concertId: string) => Promise<Concert[]>;
  getNearbyTonight: (lat: number, lon: number) => Promise<Concert[]>;
}

export const useRecommendations = (): UseRecommendationsResult => {
  const { favorites, attendedConcerts, preferredGenres } = useStore();
  const [state, setState] = useState<RecommendationsState>({
    personalized: [],
    trending: [],
    discoveries: [],
    budgetFriendly: [],
    isLoading: true,
    error: null,
  });

  // Construit les preferences utilisateur a partir du store
  const buildPreferences = useCallback(() => {
    const favoriteArtistIds = favorites
      .filter(f => f.type === 'artist')
      .map(f => f.id);

    const favoriteVenueIds = favorites
      .filter(f => f.type === 'venue')
      .map(f => f.id);

    const favoriteGenres = preferredGenres?.map(g => g.toLowerCase()) || [];

    const attendedArtistNames = attendedConcerts?.map(c => c.artistName) || [];

    return {
      favoriteArtistIds,
      favoriteVenueIds,
      favoriteGenres,
      attendedArtistNames,
    };
  }, [favorites, attendedConcerts, preferredGenres]);

  // Charge toutes les recommandations
  const loadRecommendations = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const preferences = buildPreferences();

      // Charge en parallele
      const [personalizedResult, trendingResult, discoveriesResult, budgetResult] = await Promise.all([
        recommendationService.getPersonalizedRecommendations(preferences, 10),
        recommendationService.getTrendingConcerts(10),
        recommendationService.getDiscoveryConcerts(preferences, 5),
        recommendationService.getBudgetFriendlyConcerts(25),
      ]);

      setState({
        personalized: personalizedResult.map(r => r.concert),
        trending: trendingResult,
        discoveries: discoveriesResult,
        budgetFriendly: budgetResult.slice(0, 10),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors du chargement des recommandations',
      }));
    }
  }, [buildPreferences]);

  // Charge au montage et quand les favoris changent
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Recupere les concerts similaires
  const getSimilar = useCallback(async (concertId: string): Promise<Concert[]> => {
    return recommendationService.getSimilarConcerts(concertId, 5);
  }, []);

  // Recupere les concerts proches ce soir
  const getNearbyTonight = useCallback(async (
    lat: number,
    lon: number
  ): Promise<Concert[]> => {
    return recommendationService.getNearbyTonightConcerts(lat, lon, 5);
  }, []);

  return {
    ...state,
    refresh: loadRecommendations,
    getSimilar,
    getNearbyTonight,
  };
};
