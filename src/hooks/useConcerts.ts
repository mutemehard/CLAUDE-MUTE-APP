// Hook pour accéder facilement aux concerts avec filtrage
import { useMemo, useCallback, useEffect } from 'react';
import { useStore } from './useStore';
import { Concert, ConcertFilters } from '../types';

interface UseConcertsOptions {
  autoFetch?: boolean;
  filter?: 'today' | 'weekend' | 'week' | 'month' | 'all';
}

export const useConcerts = (options: UseConcertsOptions = {}) => {
  const { autoFetch = true, filter = 'all' } = options;

  const concerts = useStore(state => state.concerts);
  const isLoading = useStore(state => state.isLoading);
  const error = useStore(state => state.error);
  const filters = useStore(state => state.filters);
  const fetchConcerts = useStore(state => state.fetchConcerts);
  const setFilters = useStore(state => state.setFilters);

  // Fetch on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch && concerts.length === 0) {
      fetchConcerts();
    }
  }, [autoFetch]);

  // Filter concerts based on the filter option
  const filteredConcerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        return concerts.filter(c => c.date === todayStr);

      case 'weekend': {
        const dayOfWeek = today.getDay();
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        const friday = new Date(today);
        friday.setDate(today.getDate() + (daysUntilFriday || 7));
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);

        return concerts.filter(c => {
          const date = new Date(c.date);
          return date >= friday && date <= sunday;
        });
      }

      case 'week': {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);

        return concerts.filter(c => {
          const date = new Date(c.date);
          return date >= today && date <= weekFromNow;
        });
      }

      case 'month': {
        return concerts.filter(c => {
          const date = new Date(c.date);
          return date.getMonth() === today.getMonth() &&
                 date.getFullYear() === today.getFullYear();
        });
      }

      default:
        return concerts;
    }
  }, [concerts, filter]);

  // Get a concert by ID
  const getConcertById = useCallback((id: string): Concert | undefined => {
    return concerts.find(c => c.id === id);
  }, [concerts]);

  // Search concerts locally
  const searchLocal = useCallback((query: string): Concert[] => {
    if (!query.trim()) return filteredConcerts;
    const lowerQuery = query.toLowerCase();
    return filteredConcerts.filter(c =>
      c.artist.name.toLowerCase().includes(lowerQuery) ||
      c.venue.name.toLowerCase().includes(lowerQuery) ||
      c.genre?.toLowerCase().includes(lowerQuery)
    );
  }, [filteredConcerts]);

  // Get concerts by genre
  const getByGenre = useCallback((genre: string): Concert[] => {
    return filteredConcerts.filter(c =>
      c.genre?.toLowerCase() === genre.toLowerCase() ||
      c.artist.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
  }, [filteredConcerts]);

  // Get concerts by venue
  const getByVenue = useCallback((venueId: string): Concert[] => {
    return filteredConcerts.filter(c => c.venue.id === venueId);
  }, [filteredConcerts]);

  // Get concerts by artist
  const getByArtist = useCallback((artistId: string): Concert[] => {
    return filteredConcerts.filter(c => c.artist.id === artistId);
  }, [filteredConcerts]);

  return {
    concerts: filteredConcerts,
    allConcerts: concerts,
    isLoading,
    error,
    filters,
    fetchConcerts,
    setFilters,
    getConcertById,
    searchLocal,
    getByGenre,
    getByVenue,
    getByArtist,
    count: filteredConcerts.length,
    isEmpty: filteredConcerts.length === 0 && !isLoading,
  };
};
