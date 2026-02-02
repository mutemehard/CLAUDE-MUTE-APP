import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { concertService } from '../services';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Concert } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites, isFavorite, removeFavorite, addFavorite } = useStore();
  const [favoriteConcerts, setFavoriteConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charge les concerts favoris
  useEffect(() => {
    loadFavorites();
  }, [favorites]);

  const loadFavorites = async () => {
    setIsLoading(true);
    const concertFavorites = favorites.filter(f => f.type === 'concert');
    const concerts: Concert[] = [];

    for (const fav of concertFavorites) {
      const concert = await concertService.getConcertById(fav.id);
      if (concert) {
        concerts.push(concert);
      }
    }

    // Tri par date
    concerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setFavoriteConcerts(concerts);
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

  const concertFavoritesCount = favorites.filter(f => f.type === 'concert').length;
  const artistFavoritesCount = favorites.filter(f => f.type === 'artist').length;
  const venueFavoritesCount = favorites.filter(f => f.type === 'venue').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Favoris</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{concertFavoritesCount}</Text>
          <Text style={styles.statLabel}>Concerts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{artistFavoritesCount}</Text>
          <Text style={styles.statLabel}>Artistes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{venueFavoritesCount}</Text>
          <Text style={styles.statLabel}>Salles</Text>
        </View>
      </View>

      {/* Section titre */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Concerts sauvegardes</Text>
      </View>

      {/* Liste des favoris */}
      <FlatList
        data={favoriteConcerts}
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
            <Text style={styles.emptyEmoji}>💜</Text>
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>
              Ajoute des concerts a tes favoris pour les retrouver ici
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.exploreButtonText}>Explorer les concerts</Text>
            </TouchableOpacity>
          </View>
        }
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surfaceLight,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  exploreButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
