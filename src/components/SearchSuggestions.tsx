// Composant de suggestions de recherche
// Affiche des suggestions basees sur les recherches populaires et les tendances

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants';
import { Artist, Venue, Concert } from '../types';

interface SearchSuggestionsProps {
  recentSearches: string[];
  popularArtists?: Artist[];
  trendingVenues?: Venue[];
  upcomingConcerts?: Concert[];
  onSuggestionPress: (query: string) => void;
  onArtistPress?: (artist: Artist) => void;
  onVenuePress?: (venue: Venue) => void;
  onClearRecent?: () => void;
}

// Suggestions de recherche par defaut
const DEFAULT_SUGGESTIONS = [
  { label: 'Ce soir', icon: '🌙', query: 'ce soir' },
  { label: 'Week-end', icon: '🎉', query: 'week-end' },
  { label: 'Electro', icon: '🎧', query: 'electro' },
  { label: 'Rock', icon: '🎸', query: 'rock' },
  { label: 'Rap', icon: '🎤', query: 'rap' },
  { label: 'Jazz', icon: '🎷', query: 'jazz' },
];

// Venues tendance a Paris
const TRENDING_QUERIES = [
  { label: 'Olympia', icon: '🎭' },
  { label: 'Bataclan', icon: '🎵' },
  { label: 'Rex Club', icon: '🔊' },
  { label: 'Zenith', icon: '🏟️' },
  { label: 'Accor Arena', icon: '🎪' },
];

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  recentSearches,
  popularArtists = [],
  trendingVenues = [],
  upcomingConcerts = [],
  onSuggestionPress,
  onArtistPress,
  onVenuePress,
  onClearRecent,
}) => {
  // Artistes avec concerts bientot
  const artistsWithUpcoming = useMemo(() => {
    const artistIds = new Set(upcomingConcerts.map(c => c.artist.id));
    return popularArtists.filter(a => artistIds.has(a.id)).slice(0, 5);
  }, [popularArtists, upcomingConcerts]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Recherches recentes */}
      {recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recherches recentes</Text>
            {onClearRecent && (
              <TouchableOpacity onPress={onClearRecent}>
                <Text style={styles.clearButton}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chipsContainer}>
            {recentSearches.slice(0, 5).map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentChip}
                onPress={() => onSuggestionPress(search)}
              >
                <Text style={styles.recentIcon}>🕐</Text>
                <Text style={styles.recentText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Suggestions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        <View style={styles.chipsContainer}>
          {DEFAULT_SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => onSuggestionPress(suggestion.query)}
            >
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <Text style={styles.suggestionText}>{suggestion.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Artistes populaires */}
      {artistsWithUpcoming.length > 0 && onArtistPress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artistes avec concerts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artistsContainer}
          >
            {artistsWithUpcoming.map(artist => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                onPress={() => onArtistPress(artist)}
              >
                <View style={styles.artistAvatar}>
                  <Text style={styles.artistInitial}>
                    {artist.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                {artist.genres && artist.genres[0] && (
                  <Text style={styles.artistGenre} numberOfLines={1}>
                    {artist.genres[0]}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Venues tendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salles populaires</Text>
        <View style={styles.venuesGrid}>
          {(trendingVenues.length > 0 ? trendingVenues.slice(0, 6) : []).map((venue, index) => (
            <TouchableOpacity
              key={venue.id || index}
              style={styles.venueChip}
              onPress={() => onVenuePress ? onVenuePress(venue) : onSuggestionPress(venue.name)}
            >
              <Text style={styles.venueIcon}>📍</Text>
              <Text style={styles.venueText} numberOfLines={1}>{venue.name}</Text>
            </TouchableOpacity>
          ))}
          {trendingVenues.length === 0 && TRENDING_QUERIES.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.venueChip}
              onPress={() => onSuggestionPress(item.label)}
            >
              <Text style={styles.venueIcon}>{item.icon}</Text>
              <Text style={styles.venueText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Astuce</Text>
        <Text style={styles.tipsText}>
          Recherche par artiste, salle, genre ou date pour trouver ton prochain concert !
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  clearButton: {
    ...typography.caption,
    color: colors.primary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recentIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  recentText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  suggestionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  artistsContainer: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  artistCard: {
    alignItems: 'center',
    width: 80,
    marginRight: spacing.sm,
  },
  artistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  artistInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  artistName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  artistGenre: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  venuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  venueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  venueText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  tipsContainer: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default SearchSuggestions;
