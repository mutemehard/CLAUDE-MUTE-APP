import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { colors, spacing, typography, borderRadius, MUSIC_GENRES } from '../constants';
import { RootStackParamList, Concert } from '../types';
import { artistService } from '../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { concerts, searchConcerts, isLoading, isFavorite, addFavorite, removeFavorite } = useStore();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Concert[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    await searchConcerts(searchQuery);

    // Ajoute aux recherches récentes
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5));
    }
  }, [searchConcerts, recentSearches]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    handleSearch(query);
  };

  const handleConcertPress = (concert: Concert) => {
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleFavoritePress = (concert: Concert) => {
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
    }
  };

  const handleGenrePress = (genre: string) => {
    setQuery(genre);
    handleSearch(genre);
  };

  const handleRecentPress = (recent: string) => {
    setQuery(recent);
    handleSearch(recent);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Artiste, salle, genre..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSubmit}>
          <Text style={styles.searchButtonText}>OK</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {!hasSearched ? (
        // Suggestions avant recherche
        <View style={styles.suggestionsContainer}>
          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recherches recentes</Text>
              <View style={styles.chipContainer}>
                {recentSearches.map((recent, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => handleRecentPress(recent)}
                  >
                    <Text style={styles.chipText}>{recent}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Genres populaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explorer par genre</Text>
            <View style={styles.chipContainer}>
              {MUSIC_GENRES.slice(0, 12).map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[styles.chip, styles.genreChip]}
                  onPress={() => handleGenrePress(genre)}
                >
                  <Text style={styles.chipText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Artistes populaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artistes populaires</Text>
            <View style={styles.chipContainer}>
              {['Phoenix', 'Justice', 'Orelsan', 'Aya Nakamura'].map((artist) => (
                <TouchableOpacity
                  key={artist}
                  style={[styles.chip, styles.artistChip]}
                  onPress={() => handleRecentPress(artist)}
                >
                  <Text style={styles.chipText}>{artist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        // Résultats de recherche
        <FlatList
          data={concerts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConcertCard
              concert={item}
              onPress={() => handleConcertPress(item)}
              onFavoritePress={() => handleFavoritePress(item)}
              isFavorite={isFavorite('concert', item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎵</Text>
              <Text style={styles.emptyText}>
                {isLoading ? 'Recherche en cours...' : `Aucun resultat pour "${query}"`}
              </Text>
            </View>
          }
          ListHeaderComponent={
            concerts.length > 0 ? (
              <Text style={styles.resultsCount}>
                {concerts.length} resultat{concerts.length > 1 ? 's' : ''}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    ...typography.body,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  genreChip: {
    backgroundColor: colors.surfaceLight,
  },
  artistChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  resultsCount: {
    ...typography.bodySmall,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
