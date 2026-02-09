// Service de recommandations de concerts
import { Concert, Artist, Venue, ConcertFilters } from '../types';
import { concertService, artistService, venueService } from './concertService';

// Poids pour le scoring des recommandations
const WEIGHTS = {
  favoriteArtist: 50,        // Artiste dans les favoris
  favoriteVenue: 30,         // Salle dans les favoris
  favoriteGenre: 25,         // Genre prefere
  attendedArtist: 20,        // Artiste deja vu
  similarGenre: 15,          // Genre similaire
  nearbyVenue: 10,           // Salle proche
  popularity: 5,             // Popularite de l'artiste
  priceMatch: 5,             // Correspond au budget habituel
};

interface UserPreferences {
  favoriteArtistIds: string[];
  favoriteVenueIds: string[];
  favoriteGenres: string[];
  attendedArtistNames: string[];
  averagePrice?: number;
  preferredArrondissements?: string[];
}

interface ScoredConcert {
  concert: Concert;
  score: number;
  reasons: string[];
}

// Calcule le score de recommandation pour un concert
const calculateScore = (
  concert: Concert,
  preferences: UserPreferences
): ScoredConcert => {
  let score = 0;
  const reasons: string[] = [];

  // Artiste favori
  if (preferences.favoriteArtistIds.includes(concert.artist.id)) {
    score += WEIGHTS.favoriteArtist;
    reasons.push('Artiste que tu suis');
  }

  // Salle favorite
  if (preferences.favoriteVenueIds.includes(concert.venue.id)) {
    score += WEIGHTS.favoriteVenue;
    reasons.push('Salle que tu aimes');
  }

  // Genre prefere
  if (concert.genre && preferences.favoriteGenres.includes(concert.genre.toLowerCase())) {
    score += WEIGHTS.favoriteGenre;
    reasons.push(`Tu aimes le ${concert.genre}`);
  }

  // Genre similaire (artiste)
  const artistGenresLower = concert.artist.genres.map(g => g.toLowerCase());
  const matchingGenres = artistGenresLower.filter(g =>
    preferences.favoriteGenres.includes(g)
  );
  if (matchingGenres.length > 0 && !reasons.includes(`Tu aimes le ${concert.genre}`)) {
    score += WEIGHTS.similarGenre * matchingGenres.length;
    reasons.push(`Style ${matchingGenres[0]} que tu apprecies`);
  }

  // Artiste deja vu en concert
  if (preferences.attendedArtistNames.some(
    name => name.toLowerCase() === concert.artist.name.toLowerCase()
  )) {
    score += WEIGHTS.attendedArtist;
    reasons.push('Tu as deja vu cet artiste');
  }

  // Arrondissement prefere
  if (
    concert.venue.arrondissement &&
    preferences.preferredArrondissements?.includes(concert.venue.arrondissement)
  ) {
    score += WEIGHTS.nearbyVenue;
    reasons.push('Dans ton quartier');
  }

  // Popularite de l'artiste
  if (concert.artist.popularity) {
    score += (concert.artist.popularity / 100) * WEIGHTS.popularity;
  }

  // Correspondance de prix
  if (preferences.averagePrice && concert.price) {
    const priceDiff = Math.abs(concert.price.min - preferences.averagePrice);
    if (priceDiff <= 10) {
      score += WEIGHTS.priceMatch;
      reasons.push('Dans ton budget');
    }
  }

  return { concert, score, reasons };
};

// Service de recommandations
export const recommendationService = {
  // Obtient les recommandations personnalisees
  async getPersonalizedRecommendations(
    preferences: UserPreferences,
    limit: number = 10
  ): Promise<ScoredConcert[]> {
    const concerts = await concertService.getAllConcerts();

    // Score tous les concerts
    const scoredConcerts = concerts.map(concert =>
      calculateScore(concert, preferences)
    );

    // Trie par score decroissant
    scoredConcerts.sort((a, b) => b.score - a.score);

    // Retourne les meilleurs
    return scoredConcerts.slice(0, limit);
  },

  // Recommandations basees sur un concert (similaires)
  async getSimilarConcerts(
    concertId: string,
    limit: number = 5
  ): Promise<Concert[]> {
    const concert = await concertService.getConcertById(concertId);
    if (!concert) return [];

    const allConcerts = await concertService.getAllConcerts();

    // Calcule la similarite
    const similar = allConcerts
      .filter(c => c.id !== concertId)
      .map(c => {
        let similarity = 0;

        // Meme genre
        if (c.genre === concert.genre) similarity += 30;

        // Meme salle
        if (c.venue.id === concert.venue.id) similarity += 20;

        // Genres artiste en commun
        const commonGenres = c.artist.genres.filter(
          g => concert.artist.genres.includes(g)
        );
        similarity += commonGenres.length * 10;

        // Meme arrondissement
        if (c.venue.arrondissement === concert.venue.arrondissement) {
          similarity += 5;
        }

        // Prix similaire
        if (c.price && concert.price) {
          const priceDiff = Math.abs(c.price.min - concert.price.min);
          if (priceDiff <= 15) similarity += 5;
        }

        return { concert: c, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return similar.slice(0, limit).map(s => s.concert);
  },

  // Concerts populaires cette semaine
  async getTrendingConcerts(limit: number = 10): Promise<Concert[]> {
    const concerts = await concertService.getWeekConcerts();

    // Trie par popularite de l'artiste
    return concerts
      .sort((a, b) => (b.artist.popularity || 0) - (a.artist.popularity || 0))
      .slice(0, limit);
  },

  // Decouvertes (artistes moins connus mais bon score)
  async getDiscoveryConcerts(
    preferences: UserPreferences,
    limit: number = 5
  ): Promise<Concert[]> {
    const concerts = await concertService.getAllConcerts();

    // Filtre les artistes peu connus mais avec genres qui matchent
    const discoveries = concerts
      .filter(c => {
        // Popularite moyenne ou faible
        const popularity = c.artist.popularity || 50;
        if (popularity > 70) return false;

        // Mais genre qui correspond aux preferences
        const genreMatch = c.genre &&
          preferences.favoriteGenres.includes(c.genre.toLowerCase());
        const artistGenreMatch = c.artist.genres.some(
          g => preferences.favoriteGenres.includes(g.toLowerCase())
        );

        return genreMatch || artistGenreMatch;
      })
      .sort((a, b) => {
        // Trie par correspondance de genre puis popularite
        const aMatch = a.artist.genres.filter(
          g => preferences.favoriteGenres.includes(g.toLowerCase())
        ).length;
        const bMatch = b.artist.genres.filter(
          g => preferences.favoriteGenres.includes(g.toLowerCase())
        ).length;

        if (aMatch !== bMatch) return bMatch - aMatch;
        return (b.artist.popularity || 0) - (a.artist.popularity || 0);
      });

    return discoveries.slice(0, limit);
  },

  // Concerts gratuits ou pas chers
  async getBudgetFriendlyConcerts(maxPrice: number = 20): Promise<Concert[]> {
    const concerts = await concertService.getAllConcerts();

    return concerts
      .filter(c => {
        if (!c.price) return true; // Gratuit
        return c.price.min <= maxPrice;
      })
      .sort((a, b) => {
        const priceA = a.price?.min || 0;
        const priceB = b.price?.min || 0;
        return priceA - priceB;
      });
  },

  // Concerts ce soir pres de moi
  async getNearbyTonightConcerts(
    userLat: number,
    userLon: number,
    radiusKm: number = 5
  ): Promise<Concert[]> {
    const todayConcerts = await concertService.getTodayConcerts();

    // Calcul distance Haversine
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return todayConcerts.filter(c =>
      getDistance(userLat, userLon, c.venue.latitude, c.venue.longitude) <= radiusKm
    );
  },
};
