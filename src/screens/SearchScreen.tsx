import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { colors, spacing, typography, borderRadius, MUSIC_GENRES } from '../constants';
import { RootStackParamList, Concert, Artist, Venue, SearchResult } from '../types';
import { artistService, venueService, concertService } from '../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SearchTab = 'all' | 'concerts' | 'artists' | 'venues';

interface SearchResultsState {
  concerts: Concert[];
  artists: Artist[];
  venues: Venue[];
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    isFavorite,
    addFavorite,
    removeFavorite,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    getFriendsForConcert,
  } = useStore();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResultsState>({
    concerts: [],
    artists: [],
    venues: [],
  });

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ concerts: [], artists: [], venues: [] });
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Recherche en parallele dans les 3 categories
      const [concerts, artists, venues] = await Promise.all([
        concertService.searchConcerts(searchQuery),
        artistService.searchArtists(searchQuery),
        venueService.searchVenues(searchQuery),
      ]);

      setResults({ concerts, artists, venues });

      // Ajoute aux recherches recentes (persistees dans le store)
      addRecentSearch(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addRecentSearch]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    handleSearch(query);
  };

  const handleConcertPress = (concert: Concert) => {
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', { artistId: artist.id });
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', { venueId: venue.id });
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
    setResults({ concerts: [], artists: [], venues: [] });
    setHasSearched(false);
  };

  const totalResults = results.concerts.length + results.artists.length + results.venues.length;

  const tabs: { key: SearchTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tout', count: totalResults },
    { key: 'concerts', label: 'Concerts', count: results.concerts.length },
    { key: 'artists', label: 'Artistes', count: results.artists.length },
    { key: 'venues', label: 'Salles', count: results.venues.length },
  ];

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.artistItem}
      onPress={() => handleArtistPress(item)}
    >
      <View style={styles.artistImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
        ) : (
          <View style={styles.artistImagePlaceholder}>
            <Text style={styles.artistInitial}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.artistInfo}>
        <Text style={styles.artistName}>{item.name}</Text>
        <Text style={styles.artistGenres} numberOfLines={1}>
          {item.genres.slice(0, 3).join(' • ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => {
          if (isFavorite('artist', item.id)) {
            removeFavorite('artist', item.id);
          } else {
            addFavorite('artist', item.id);
          }
        }}
      >
        <Text style={styles.favoriteIcon}>
          {isFavorite('artist', item.id) ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueItem}
      onPress={() => handleVenuePress(item)}
    >
      <View style={styles.venueIconContainer}>
        <Text style={styles.venueIcon}>📍</Text>
      </View>
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueAddress} numberOfLines={1}>
          {item.address}
        </Text>
        {item.arrondissement && (
          <View style={styles.arrondissementBadge}>
            <Text style={styles.arrondissementText}>{item.arrondissement}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => {
          if (isFavorite('venue', item.id)) {
            removeFavorite('venue', item.id);
          } else {
            addFavorite('venue', item.id);
          }
        }}
      >
        <Text style={styles.favoriteIcon}>
          {isFavorite('venue', item.id) ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAllResults = () => (
    <ScrollView style={styles.allResultsContainer} showsVerticalScrollIndicator={false}>
      {/* Section Artistes */}
      {results.artists.length > 0 && (
        <View style={styles.resultSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artistes</Text>
            {results.artists.length > 3 && (
              <TouchableOpacity onPress={() => setActiveTab('artists')}>
                <Text style={styles.seeAllText}>Voir tout ({results.artists.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          {results.artists.slice(0, 3).map(artist => (
            <View key={artist.id}>
              {renderArtistItem({ item: artist })}
            </View>
          ))}
        </View>
      )}

      {/* Section Salles */}
      {results.venues.length > 0 && (
        <View style={styles.resultSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Salles</Text>
            {results.venues.length > 3 && (
              <TouchableOpacity onPress={() => setActiveTab('venues')}>
                <Text style={styles.seeAllText}>Voir tout ({results.venues.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          {results.venues.slice(0, 3).map(venue => (
            <View key={venue.id}>
              {renderVenueItem({ item: venue })}
            </View>
          ))}
        </View>
      )}

      {/* Section Concerts */}
      {results.concerts.length > 0 && (
        <View style={styles.resultSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Concerts</Text>
            {results.concerts.length > 3 && (
              <TouchableOpacity onPress={() => setActiveTab('concerts')}>
                <Text style={styles.seeAllText}>Voir tout ({results.concerts.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          {results.concerts.slice(0, 3).map(concert => (
            <ConcertCard
              key={concert.id}
              concert={concert}
              onPress={() => handleConcertPress(concert)}
              onFavoritePress={() => handleFavoritePress(concert)}
              isFavorite={isFavorite('concert', concert.id)}
              friendsInfo={getFriendsForConcert(concert.id)}
            />
          ))}
        </View>
      )}

      {/* Aucun resultat */}
      {totalResults === 0 && !isLoading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Aucun resultat pour "{query}"</Text>
          <Text style={styles.emptySubtext}>Essayez un autre terme de recherche</Text>
        </View>
      )}
    </ScrollView>
  );

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
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {/* Recherches recentes */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recherches recentes</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearAllText}>Effacer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipContainer}>
                {recentSearches.map((recent, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => handleRecentPress(recent)}
                  >
                    <Text style={styles.chipIcon}>🕐</Text>
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

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: '#FF4D4D' }]}
                onPress={() => handleGenrePress('Techno')}
              >
                <Text style={styles.categoryEmoji}>🎧</Text>
                <Text style={styles.categoryText}>Techno & House</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: '#8B5CF6' }]}
                onPress={() => handleGenrePress('Rock')}
              >
                <Text style={styles.categoryEmoji}>🎸</Text>
                <Text style={styles.categoryText}>Rock & Metal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleGenrePress('Hip-Hop')}
              >
                <Text style={styles.categoryEmoji}>🎤</Text>
                <Text style={styles.categoryText}>Hip-Hop & Rap</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: '#10B981' }]}
                onPress={() => handleGenrePress('Jazz')}
              >
                <Text style={styles.categoryEmoji}>🎷</Text>
                <Text style={styles.categoryText}>Jazz & Soul</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Artistes populaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendances</Text>
            <View style={styles.chipContainer}>
              {['Phoenix', 'Justice', 'Amelie Lens', 'Charlotte de Witte', 'Orelsan'].map((artist) => (
                <TouchableOpacity
                  key={artist}
                  style={[styles.chip, styles.artistChip]}
                  onPress={() => handleRecentPress(artist)}
                >
                  <Text style={styles.chipIcon}>🔥</Text>
                  <Text style={styles.chipText}>{artist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        // Resultats de recherche
        <View style={styles.resultsContainer}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View style={[
                      styles.tabBadge,
                      activeTab === tab.key && styles.tabBadgeActive,
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        activeTab === tab.key && styles.tabBadgeTextActive,
                      ]}>
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Recherche en cours...</Text>
            </View>
          )}

          {/* Results */}
          {!isLoading && (
            <>
              {activeTab === 'all' && renderAllResults()}

              {activeTab === 'concerts' && (
                <FlatList
                  data={results.concerts}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <ConcertCard
                      concert={item}
                      onPress={() => handleConcertPress(item)}
                      onFavoritePress={() => handleFavoritePress(item)}
                      isFavorite={isFavorite('concert', item.id)}
                      friendsInfo={getFriendsForConcert(item.id)}
                    />
                  )}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyEmoji}>🎵</Text>
                      <Text style={styles.emptyText}>Aucun concert trouve</Text>
                    </View>
                  }
                />
              )}

              {activeTab === 'artists' && (
                <FlatList
                  data={results.artists}
                  keyExtractor={item => item.id}
                  renderItem={renderArtistItem}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyEmoji}>🎤</Text>
                      <Text style={styles.emptyText}>Aucun artiste trouve</Text>
                    </View>
                  }
                />
              )}

              {activeTab === 'venues' && (
                <FlatList
                  data={results.venues}
                  keyExtractor={item => item.id}
                  renderItem={renderVenueItem}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyEmoji}>📍</Text>
                      <Text style={styles.emptyText}>Aucune salle trouvee</Text>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  clearAllText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  genreChip: {
    backgroundColor: colors.surfaceLight,
  },
  artistChip: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabBadgeTextActive: {
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  allResultsContainer: {
    flex: 1,
  },
  resultSection: {
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  artistImageContainer: {
    marginRight: spacing.md,
  },
  artistImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  artistImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitial: {
    ...typography.h2,
    color: colors.primary,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistGenres: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  venueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  venueIcon: {
    fontSize: 24,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  venueAddress: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: 4,
  },
  arrondissementBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  arrondissementText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  favoriteIcon: {
    fontSize: 20,
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
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
