import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { concertService, artistService, venueService } from '../services';
import { shareConcerts } from '../utils';
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, Concert, Artist, Venue } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'concerts' | 'artists' | 'venues';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites, isFavorite, removeFavorite, addFavorite, getFriendsForConcert } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('concerts');
  const [favoriteConcerts, setFavoriteConcerts] = useState<Concert[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);
  const [favoriteVenues, setFavoriteVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compte les favoris par type
  const counts = {
    concerts: favorites.filter(f => f.type === 'concert').length,
    artists: favorites.filter(f => f.type === 'artist').length,
    venues: favorites.filter(f => f.type === 'venue').length,
  };

  // Charge les favoris selon l'onglet actif
  useEffect(() => {
    loadFavorites();
  }, [favorites, activeTab]);

  const loadFavorites = async () => {
    setIsLoading(true);

    if (activeTab === 'concerts') {
      const concertFavorites = favorites.filter(f => f.type === 'concert');
      // Chargement en parallele au lieu de sequentiel
      const concertPromises = concertFavorites.map(fav => concertService.getConcertById(fav.id));
      const results = await Promise.all(concertPromises);
      const concerts = results.filter((c): c is Concert => c !== null);
      concerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setFavoriteConcerts(concerts);
    } else if (activeTab === 'artists') {
      const artistFavorites = favorites.filter(f => f.type === 'artist');
      // Chargement en parallele
      const artistPromises = artistFavorites.map(fav => artistService.getArtistById(fav.id));
      const results = await Promise.all(artistPromises);
      const artists = results.filter((a): a is Artist => a !== null);
      setFavoriteArtists(artists);
    } else if (activeTab === 'venues') {
      const venueFavorites = favorites.filter(f => f.type === 'venue');
      // Chargement en parallele
      const venuePromises = venueFavorites.map(fav => venueService.getVenueById(fav.id));
      const results = await Promise.all(venuePromises);
      const venues = results.filter((v): v is Venue => v !== null);
      setFavoriteVenues(venues);
    }

    setIsLoading(false);
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

  const handleRemoveArtist = (artistId: string) => {
    removeFavorite('artist', artistId);
  };

  const handleRemoveVenue = (venueId: string) => {
    removeFavorite('venue', venueId);
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', { artistId: artist.id });
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', { venueId: venue.id });
  };

  const handleShareFavorites = async () => {
    if (favoriteConcerts.length === 0) {
      Alert.alert('Aucun concert', 'Ajoute des concerts a tes favoris pour les partager');
      return;
    }
    const result = await shareConcerts(favoriteConcerts);
    if (!result.success && result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  const renderEmptyState = () => {
    const emptyConfig = {
      concerts: {
        icon: '🎵',
        title: 'Aucun concert sauvegarde',
        text: 'Ajoute des concerts a tes favoris pour les retrouver ici',
      },
      artists: {
        icon: '🎤',
        title: 'Aucun artiste suivi',
        text: 'Suis des artistes pour etre notifie de leurs prochains concerts',
      },
      venues: {
        icon: '📍',
        title: 'Aucune salle favorite',
        text: 'Ajoute des salles pour voir leurs prochains evenements',
      },
    };

    const config = emptyConfig[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{config.icon}</Text>
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptyText}>{config.text}</Text>
      </View>
    );
  };

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleArtistPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemAvatar}>
        <Text style={styles.listItemAvatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemSubtitle}>
          {item.genres.slice(0, 2).join(' · ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveArtist(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.removeButtonText}>Retirer</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleVenuePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemAvatar}>
        <Text style={styles.listItemAvatarText}>📍</Text>
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemSubtitle}>
          {item.arrondissement ? `${item.arrondissement} arr.` : item.city}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveVenue(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.removeButtonText}>Retirer</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logo}>{APP_CONFIG.name}</Text>
            <Text style={styles.subtitle}>Mes favoris</Text>
          </View>
          {activeTab === 'concerts' && favoriteConcerts.length > 0 && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareFavorites}
            >
              <Text style={styles.shareButtonIcon}>📤</Text>
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'concerts' && styles.tabActive]}
          onPress={() => setActiveTab('concerts')}
        >
          <Text style={[styles.tabLabel, activeTab === 'concerts' && styles.tabLabelActive]}>
            Concerts
          </Text>
          {counts.concerts > 0 && (
            <View style={[styles.tabBadge, activeTab === 'concerts' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{counts.concerts}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.tabActive]}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={[styles.tabLabel, activeTab === 'artists' && styles.tabLabelActive]}>
            Artistes
          </Text>
          {counts.artists > 0 && (
            <View style={[styles.tabBadge, activeTab === 'artists' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{counts.artists}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'venues' && styles.tabActive]}
          onPress={() => setActiveTab('venues')}
        >
          <Text style={[styles.tabLabel, activeTab === 'venues' && styles.tabLabelActive]}>
            Salles
          </Text>
          {counts.venues > 0 && (
            <View style={[styles.tabBadge, activeTab === 'venues' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{counts.venues}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'concerts' && (
        <FlatList
          data={favoriteConcerts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConcertCard
              concert={item}
              onPress={() => handleConcertPress(item)}
              onFavoritePress={() => handleFavoritePress(item)}
              isFavorite={true}
              friendsInfo={getFriendsForConcert(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'artists' && (
        <FlatList
          data={favoriteArtists}
          keyExtractor={item => item.id}
          renderItem={renderArtistItem}
          contentContainerStyle={styles.listContentPadded}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'venues' && (
        <FlatList
          data={favoriteVenues}
          keyExtractor={item => item.id}
          renderItem={renderVenueItem}
          contentContainerStyle={styles.listContentPadded}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  shareButtonIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  tabBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  listContentPadded: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listItemAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  listItemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
  },
  removeButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
