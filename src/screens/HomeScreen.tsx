import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard, NearbyConcerts } from '../components';
import { useStore, useLocation } from '../hooks';
import { colors, spacing, typography, borderRadius, APP_CONFIG, MUSIC_GENRES } from '../constants';
import { RootStackParamList, Concert, Artist, Venue } from '../types';
import { artistService, venueService } from '../services';
import { haptics, getRelativeDateLabel } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// Onglets principaux
const mainTabs = [
  { id: 'tonight', label: 'Ce soir', icon: '🌙' },
  { id: 'weekend', label: 'Week-end', icon: '🎉' },
  { id: 'week', label: 'Semaine', icon: '📅' },
  { id: 'month', label: 'Ce mois', icon: '📆' },
  { id: 'all', label: 'Tout', icon: '🎵' },
];

// Noms des mois en francais
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Fonction pour verifier si c'est le week-end
const getNextWeekendDates = (): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 6;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  if (dayOfWeek >= 5 || dayOfWeek === 0) {
    const thisWeekendStart = new Date(now);
    thisWeekendStart.setHours(0, 0, 0, 0);

    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const thisWeekendEnd = new Date(now);
    thisWeekendEnd.setDate(now.getDate() + daysUntilSunday);
    thisWeekendEnd.setHours(23, 59, 59, 999);

    return { start: thisWeekendStart, end: thisWeekendEnd };
  }

  return { start: friday, end: sunday };
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { concerts, filters, isLoading, fetchConcerts, isFavorite, addFavorite, removeFavorite, getFriendsForConcert, friends, friendsActivity } = useStore();
  const { location, getDistanceFromUser, formatDistance, requestPermission } = useLocation();
  const [activeTab, setActiveTab] = useState('tonight');
  const [displayedConcerts, setDisplayedConcerts] = useState<Concert[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<Venue[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Genere les mois disponibles (4 prochains mois)
  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: MONTH_NAMES[date.getMonth()],
      });
    }
    return months;
  }, []);

  // Calculate distances for concerts
  const concertDistances = useMemo(() => {
    if (!location) return {};
    const distances: Record<string, string | null> = {};
    displayedConcerts.forEach(concert => {
      distances[concert.id] = formatDistance(concert.venue.latitude, concert.venue.longitude);
    });
    return distances;
  }, [displayedConcerts, location, formatDistance]);

  // Count active filters
  const activeFiltersCount = [
    filters.genres?.length,
    filters.arrondissements?.length,
    filters.priceRange,
    filters.showSoldOut === false,
  ].filter(Boolean).length;

  // Charge les donnees au demarrage
  useEffect(() => {
    loadData();
    requestPermission(); // Request location for distance display
  }, []);

  const loadData = async () => {
    fetchConcerts();
    const artists = await artistService.getPopularArtists(8);
    const venues = await venueService.getPopularVenues(6);
    setPopularArtists(artists);
    setTrendingVenues(venues);
  };

  // Met a jour les concerts affiches selon l'onglet et le genre
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let filtered = [...concerts];

    // Filtre par genre si selectionne
    if (selectedGenre) {
      filtered = filtered.filter(c =>
        c.genre?.toLowerCase() === selectedGenre.toLowerCase() ||
        c.artist.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    switch (activeTab) {
      case 'tonight':
        setDisplayedConcerts(filtered.filter(c => c.date === today));
        break;
      case 'weekend':
        const { start, end } = getNextWeekendDates();
        setDisplayedConcerts(
          filtered.filter(c => {
            const concertDate = new Date(c.date);
            return concertDate >= start && concertDate <= end;
          })
        );
        break;
      case 'week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        setDisplayedConcerts(
          filtered.filter(c => new Date(c.date) <= weekFromNow)
        );
        break;
      case 'month':
        setDisplayedConcerts(
          filtered.filter(c => {
            const concertDate = new Date(c.date);
            return concertDate.getMonth() === selectedMonth &&
                   concertDate.getFullYear() === selectedYear;
          })
        );
        break;
      default:
        setDisplayedConcerts(filtered);
    }
  }, [activeTab, concerts, selectedGenre, selectedMonth, selectedYear]);

  const handleConcertPress = (concert: Concert) => {
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleFavoritePress = (concert: Concert) => {
    haptics.medium();
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
    }
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', { artistId: artist.id });
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', { venueId: venue.id });
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleGenrePress = (genre: string) => {
    haptics.selection();
    setSelectedGenre(selectedGenre === genre ? null : genre);
  };

  const handleTabPress = (tabId: string) => {
    if (tabId !== activeTab) {
      haptics.light();
      setActiveTab(tabId);
    }
  };

  // Message contextuel selon l'onglet
  const getEmptyMessage = () => {
    // Si pas de concerts du tout, probleme de connexion API
    if (concerts.length === 0 && !isLoading) {
      return {
        icon: '📡',
        title: 'Connexion aux sources...',
        subtitle: 'Tirez vers le bas pour actualiser',
        showRetry: true,
      };
    }

    if (selectedGenre) {
      return {
        icon: '🎸',
        title: `Pas de concert ${selectedGenre}`,
        subtitle: 'Essayez un autre genre ou periode',
        showRetry: false,
      };
    }

    switch (activeTab) {
      case 'tonight':
        return {
          icon: '😴',
          title: 'Pas de concert ce soir',
          subtitle: 'Repose-toi ou regarde le week-end !',
          showRetry: false,
        };
      case 'weekend':
        return {
          icon: '🎉',
          title: 'Rien ce week-end',
          subtitle: 'Consultez la semaine prochaine',
          showRetry: false,
        };
      case 'week':
        return {
          icon: '📅',
          title: 'Semaine calme',
          subtitle: 'Explorez les mois a venir',
          showRetry: false,
        };
      case 'month':
        return {
          icon: '📆',
          title: 'Aucun concert ce mois',
          subtitle: 'Essayez un autre mois',
          showRetry: false,
        };
      default:
        return {
          icon: '🔍',
          title: 'Aucun evenement',
          subtitle: 'De nouveaux concerts arrivent bientot',
          showRetry: true,
        };
    }
  };

  // Handler pour selectionner un mois
  const handleMonthPress = (month: number, year: number) => {
    haptics.selection();
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Compte pour chaque onglet
  const getCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    const { start, end } = getNextWeekendDates();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return {
      tonight: concerts.filter(c => c.date === today).length,
      weekend: concerts.filter(c => {
        const d = new Date(c.date);
        return d >= start && d <= end;
      }).length,
      week: concerts.filter(c => new Date(c.date) <= weekFromNow).length,
      month: concerts.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }).length,
      all: concerts.length,
    };
  };

  const counts = getCounts();

  // Render month picker (only when month tab is active)
  const renderMonthPicker = () => {
    if (activeTab !== 'month') return null;

    return (
      <View style={styles.monthPicker}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthPickerContent}
        >
          {availableMonths.map((m, index) => (
            <TouchableOpacity
              key={`${m.year}-${m.month}`}
              style={[
                styles.monthButton,
                selectedMonth === m.month && selectedYear === m.year && styles.monthButtonActive,
              ]}
              onPress={() => handleMonthPress(m.month, m.year)}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  selectedMonth === m.month && selectedYear === m.year && styles.monthButtonTextActive,
                ]}
              >
                {m.label}
              </Text>
              {index === 0 && (
                <Text style={styles.monthButtonSubtext}>En cours</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Featured concert (first one for tonight or first one available)
  const featuredConcert = displayedConcerts[0];

  // Render featured concert card
  const renderFeaturedConcert = () => {
    if (!featuredConcert) return null;

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handleConcertPress(featuredConcert)}
        activeOpacity={0.8}
      >
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>A LA UNE</Text>
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredArtist}>{featuredConcert.artist.name}</Text>
            <Text style={styles.featuredVenue}>{featuredConcert.venue.name}</Text>
            <View style={styles.featuredFooter}>
              <View style={styles.featuredTimeRow}>
                <Text style={styles.featuredTime}>
                  {getRelativeDateLabel(featuredConcert.date)} - {featuredConcert.startTime}
                </Text>
                {concertDistances[featuredConcert.id] && (
                  <Text style={styles.featuredDistance}>
                    📍 {concertDistances[featuredConcert.id]}
                  </Text>
                )}
              </View>
              {featuredConcert.price && (
                <Text style={styles.featuredPrice}>
                  Des {featuredConcert.price.min}{featuredConcert.price.currency}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render artist horizontal item
  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.artistCard}
      onPress={() => handleArtistPress(item)}
    >
      <View style={styles.artistImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
        ) : (
          <View style={[styles.artistImage, styles.artistPlaceholder]}>
            <Text style={styles.artistInitial}>{item.name.charAt(0)}</Text>
          </View>
        )}
        {isFavorite('artist', item.id) && (
          <View style={styles.artistFavoriteBadge}>
            <Text style={styles.artistFavoriteIcon}>❤️</Text>
          </View>
        )}
      </View>
      <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.artistGenre} numberOfLines={1}>
        {item.genres[0] || 'Musique'}
      </Text>
    </TouchableOpacity>
  );

  // Render venue horizontal item
  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => handleVenuePress(item)}
    >
      <View style={styles.venueIcon}>
        <Text style={styles.venueEmoji}>🎭</Text>
      </View>
      <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
      {item.arrondissement && (
        <Text style={styles.venueLocation}>{item.arrondissement}</Text>
      )}
    </TouchableOpacity>
  );

  const handleSeeMapPress = () => {
    haptics.light();
    navigation.navigate('Map');
  };

  // Render header with sections
  const renderHeader = () => (
    <>
      {/* Featured concert */}
      {featuredConcert && renderFeaturedConcert()}

      {/* Nearby concerts - only show on "tonight" or "weekend" tabs */}
      {(activeTab === 'tonight' || activeTab === 'weekend') && (
        <NearbyConcerts
          maxDistance={5}
          limit={5}
          onSeeAllPress={handleSeeMapPress}
        />
      )}

      {/* Friends going section - show if friends have upcoming concerts */}
      {friends.length > 0 && displayedConcerts.some(c => {
        const friendsInfo = getFriendsForConcert(c.id);
        return friendsInfo.going.length > 0 || friendsInfo.interested.length > 0;
      }) && (
        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tes amis y vont</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Social')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsConcertList}>
            {displayedConcerts
              .filter(c => {
                const friendsInfo = getFriendsForConcert(c.id);
                return friendsInfo.going.length > 0;
              })
              .slice(0, 5)
              .map(concert => {
                const friendsInfo = getFriendsForConcert(concert.id);
                return (
                  <TouchableOpacity
                    key={concert.id}
                    style={styles.friendsConcertCard}
                    onPress={() => handleConcertPress(concert)}
                  >
                    <View style={styles.friendsConcertDate}>
                      <Text style={styles.friendsConcertDay}>
                        {new Date(concert.date).getDate()}
                      </Text>
                      <Text style={styles.friendsConcertMonth}>
                        {new Date(concert.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </Text>
                    </View>
                    <Text style={styles.friendsConcertArtist} numberOfLines={1}>
                      {concert.artist.name}
                    </Text>
                    <Text style={styles.friendsConcertVenue} numberOfLines={1}>
                      {concert.venue.name}
                    </Text>
                    <View style={styles.friendsConcertAvatars}>
                      {friendsInfo.going.slice(0, 3).map((friend, i) => (
                        <View key={friend.id} style={[styles.friendAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                          <Text style={styles.friendAvatarText}>{friend.displayName.charAt(0)}</Text>
                        </View>
                      ))}
                      {friendsInfo.going.length > 0 && (
                        <Text style={styles.friendsCount}>
                          {friendsInfo.going.length} ami{friendsInfo.going.length > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      )}

      {/* Quick genre filters */}
      <View style={styles.genreSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Techno', 'Rock', 'Hip-Hop', 'Jazz', 'Electronic', 'Pop'].map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreChip,
                selectedGenre === genre && styles.genreChipActive,
              ]}
              onPress={() => handleGenrePress(genre)}
            >
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenre === genre && styles.genreChipTextActive,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular artists */}
      {popularArtists.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artistes populaires</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main' as any)}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={popularArtists}
            keyExtractor={item => item.id}
            renderItem={renderArtistItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Trending venues */}
      {trendingVenues.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Salles tendances</Text>
          </View>
          <FlatList
            horizontal
            data={trendingVenues}
            keyExtractor={item => item.id}
            renderItem={renderVenueItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Concerts section title */}
      <View style={styles.concertsSectionHeader}>
        <Text style={styles.concertsSectionTitle}>
          {selectedGenre ? `Concerts ${selectedGenre}` : 'Tous les concerts'}
        </Text>
        <Text style={styles.concertsCount}>
          {displayedConcerts.length} evenement{displayedConcerts.length > 1 ? 's' : ''}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>{APP_CONFIG.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('Filters')}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Onglets principaux */}
      <View style={styles.tabsContainer}>
        {mainTabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {counts[tab.id as keyof typeof counts] > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.id && styles.tabBadgeActive,
              ]}>
                <Text style={styles.tabBadgeText}>
                  {counts[tab.id as keyof typeof counts]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Month picker - visible only when month tab is active */}
      {renderMonthPicker()}

      {/* Liste des concerts avec header */}
      <FlatList
        data={displayedConcerts.slice(featuredConcert ? 1 : 0)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConcertCard
            concert={item}
            onPress={() => handleConcertPress(item)}
            onFavoritePress={() => handleFavoritePress(item)}
            isFavorite={isFavorite('concert', item.id)}
            distance={concertDistances[item.id]}
            friendsInfo={getFriendsForConcert(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !featuredConcert ? (
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <>
                  <Text style={styles.emptyIcon}>⏳</Text>
                  <Text style={styles.emptyTitle}>Chargement des concerts...</Text>
                  <Text style={styles.emptySubtitle}>
                    Connexion a Bandsintown et Ticketmaster
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>{getEmptyMessage().icon}</Text>
                  <Text style={styles.emptyTitle}>{getEmptyMessage().title}</Text>
                  <Text style={styles.emptySubtitle}>{getEmptyMessage().subtitle}</Text>
                  {getEmptyMessage().showRetry && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRefresh}
                    >
                      <Text style={styles.retryButtonText}>Actualiser</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 9,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  // Month picker
  monthPicker: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthPickerContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  monthButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    minWidth: 100,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: colors.primary,
  },
  monthButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  monthButtonTextActive: {
    color: colors.textPrimary,
  },
  monthButtonSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  // Featured concert
  featuredCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    height: 180,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featuredBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  featuredContent: {
    marginTop: 'auto',
  },
  featuredArtist: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 28,
    marginBottom: 4,
  },
  featuredVenue: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featuredTime: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  featuredDistance: {
    ...typography.caption,
    color: colors.textMuted,
  },
  featuredPrice: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  // Genre filters
  genreSection: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
  },
  genreChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  genreChipActive: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  genreChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  genreChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Sections
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  // Artist card
  artistCard: {
    width: 100,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  artistImageContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  artistPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitial: {
    ...typography.h2,
    color: colors.primary,
  },
  artistFavoriteBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistFavoriteIcon: {
    fontSize: 10,
  },
  artistName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  artistGenre: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Venue card
  venueCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  venueEmoji: {
    fontSize: 24,
  },
  venueName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  venueLocation: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // Friends section
  friendsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  friendsConcertList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  friendsConcertCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  friendsConcertDate: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  friendsConcertDay: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  friendsConcertMonth: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  friendsConcertArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendsConcertVenue: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  friendsConcertAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  friendAvatarText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  friendsCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  // Concerts section
  concertsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  concertsSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  concertsCount: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
