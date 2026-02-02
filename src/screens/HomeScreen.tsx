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
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, Concert } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Onglets principaux style Dice
const mainTabs = [
  { id: 'tonight', label: 'Ce soir', icon: '🌙' },
  { id: 'weekend', label: 'Week-end', icon: '🎉' },
  { id: 'week', label: 'Semaine', icon: '📅' },
  { id: 'all', label: 'Tout', icon: '🎵' },
];

// Fonction pour verifier si c'est le week-end
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0; // Vendredi, Samedi, Dimanche
};

// Fonction pour obtenir les dates du prochain week-end
const getNextWeekendDates = (): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Jours jusqu'a vendredi
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 6;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  // Si on est deja vendredi-dimanche, on prend ce week-end
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
  const { concerts, isLoading, fetchConcerts, isFavorite, addFavorite, removeFavorite } = useStore();
  const [activeTab, setActiveTab] = useState('tonight');
  const [displayedConcerts, setDisplayedConcerts] = useState<Concert[]>([]);

  // Charge les donnees au demarrage
  useEffect(() => {
    fetchConcerts();
  }, []);

  // Met a jour les concerts affiches selon l'onglet
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (activeTab) {
      case 'tonight':
        setDisplayedConcerts(concerts.filter(c => c.date === today));
        break;
      case 'weekend':
        const { start, end } = getNextWeekendDates();
        setDisplayedConcerts(
          concerts.filter(c => {
            const concertDate = new Date(c.date);
            return concertDate >= start && concertDate <= end;
          })
        );
        break;
      case 'week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        setDisplayedConcerts(
          concerts.filter(c => new Date(c.date) <= weekFromNow)
        );
        break;
      default:
        setDisplayedConcerts(concerts);
    }
  }, [activeTab, concerts]);

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
  };

  // Message contextuel selon l'onglet
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'tonight':
        return 'Pas de concert ce soir. Repose-toi !';
      case 'weekend':
        return 'Rien de prevu ce week-end pour l\'instant.';
      case 'week':
        return 'Semaine calme. Ca arrive !';
      default:
        return 'Aucun evenement trouve.';
    }
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
      all: concerts.length,
    };
  };

  const counts = getCounts();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header minimaliste */}
      <View style={styles.header}>
        <Text style={styles.logo}>{APP_CONFIG.name}</Text>
        <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
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
            onPress={() => setActiveTab(tab.id)}
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

      {/* Separateur */}
      <View style={styles.separator} />

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
            <Text style={styles.emptyIcon}>
              {activeTab === 'tonight' ? '😴' : '🔍'}
            </Text>
            <Text style={styles.emptyText}>
              {isLoading ? 'Chargement...' : getEmptyMessage()}
            </Text>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  tabBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
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
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
