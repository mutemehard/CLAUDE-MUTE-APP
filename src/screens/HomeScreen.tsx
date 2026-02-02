import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { colors, spacing, typography, APP_CONFIG } from '../constants';
import { RootStackParamList, Concert } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Onglets de filtrage rapide
const quickFilters = [
  { id: 'all', label: 'Tous' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'popular', label: 'Populaires' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { concerts, todayConcerts, isLoading, fetchConcerts, fetchTodayConcerts, isFavorite, addFavorite, removeFavorite } = useStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [displayedConcerts, setDisplayedConcerts] = useState<Concert[]>([]);

  // Charge les données au démarrage
  useEffect(() => {
    fetchConcerts();
    fetchTodayConcerts();
  }, []);

  // Met à jour les concerts affichés selon le filtre
  useEffect(() => {
    switch (activeFilter) {
      case 'today':
        setDisplayedConcerts(todayConcerts);
        break;
      case 'week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        setDisplayedConcerts(
          concerts.filter(c => new Date(c.date) <= weekFromNow)
        );
        break;
      case 'popular':
        setDisplayedConcerts(
          [...concerts].sort((a, b) => (b.artist.popularity || 0) - (a.artist.popularity || 0))
        );
        break;
      default:
        setDisplayedConcerts(concerts);
    }
  }, [activeFilter, concerts, todayConcerts]);

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

  const handleRefresh = () => {
    fetchConcerts();
    fetchTodayConcerts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ParisGigs</Text>
        <Text style={styles.subtitle}>Quoi faire ce soir ?</Text>
      </View>

      {/* Filtres rapides */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={quickFilters}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.id && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Stats rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{todayConcerts.length}</Text>
          <Text style={styles.statLabel}>Ce soir</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{concerts.length}</Text>
          <Text style={styles.statLabel}>A venir</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{APP_CONFIG.defaultCity}</Text>
          <Text style={styles.statLabel}>Ville</Text>
        </View>
      </View>

      {/* Liste des concerts */}
      <FlatList
        data={displayedConcerts}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Chargement...' : 'Aucun concert trouve'}
            </Text>
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
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filtersContainer: {
    marginBottom: spacing.sm,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
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
    color: colors.textPrimary,
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
  listContent: {
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};
