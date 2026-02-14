// Composant d'insights sur les habitudes de concerts
// Affiche des statistiques interessantes sur l'activite de l'utilisateur

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants';
import { AttendedConcert } from '../types';

interface ConcertInsightsProps {
  attendedConcerts: AttendedConcert[];
  followedArtists: string[];
  favoritesCount: number;
}

interface InsightCard {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

// Calcule les statistiques a partir des concerts vus
const calculateStats = (concerts: AttendedConcert[]) => {
  if (concerts.length === 0) {
    return {
      totalConcerts: 0,
      averageRating: 0,
      topVenue: null,
      topMonth: null,
      concertsThisYear: 0,
      streak: 0,
    };
  }

  // Note moyenne
  const ratedConcerts = concerts.filter(c => c.rating);
  const averageRating = ratedConcerts.length > 0
    ? ratedConcerts.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedConcerts.length
    : 0;

  // Top venue
  const venueCounts: Record<string, number> = {};
  concerts.forEach(c => {
    const venue = c.venueName || 'Inconnu';
    venueCounts[venue] = (venueCounts[venue] || 0) + 1;
  });
  const topVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0];

  // Top mois
  const monthCounts: Record<string, number> = {};
  concerts.forEach(c => {
    const month = new Date(c.date).toLocaleDateString('fr-FR', { month: 'long' });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });
  const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

  // Concerts cette annee
  const currentYear = new Date().getFullYear();
  const concertsThisYear = concerts.filter(c =>
    new Date(c.date).getFullYear() === currentYear
  ).length;

  // Calculer la "streak" (mois consecutifs avec au moins un concert)
  let streak = 0;
  const sortedDates = concerts
    .map(c => new Date(c.date))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length > 0) {
    let currentMonth = new Date();
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const hasConcertInMonth = sortedDates.some(
        d => d >= monthStart && d <= monthEnd
      );

      if (hasConcertInMonth) {
        streak++;
        currentMonth.setMonth(currentMonth.getMonth() - 1);
      } else {
        break;
      }
    }
  }

  return {
    totalConcerts: concerts.length,
    averageRating,
    topVenue,
    topMonth,
    concertsThisYear,
    streak,
  };
};

export const ConcertInsights: React.FC<ConcertInsightsProps> = ({
  attendedConcerts,
  followedArtists,
  favoritesCount,
}) => {
  const stats = useMemo(() => calculateStats(attendedConcerts), [attendedConcerts]);

  const insights: InsightCard[] = useMemo(() => {
    const cards: InsightCard[] = [];

    // Concerts cette annee
    cards.push({
      icon: '🎵',
      title: 'Cette annee',
      value: stats.concertsThisYear,
      subtitle: 'concerts',
      color: colors.primary,
    });

    // Streak
    if (stats.streak > 0) {
      cards.push({
        icon: '🔥',
        title: 'Streak',
        value: stats.streak,
        subtitle: stats.streak > 1 ? 'mois consecutifs' : 'mois',
        color: '#FF6B6B',
      });
    }

    // Note moyenne
    if (stats.averageRating > 0) {
      cards.push({
        icon: '⭐',
        title: 'Note moyenne',
        value: stats.averageRating.toFixed(1),
        subtitle: '/5',
        color: '#FFD700',
      });
    }

    // Top venue
    if (stats.topVenue) {
      cards.push({
        icon: '📍',
        title: 'Salle preferee',
        value: stats.topVenue[0],
        subtitle: `${stats.topVenue[1]} fois`,
        color: '#9B59B6',
      });
    }

    // Artistes suivis
    if (followedArtists.length > 0) {
      cards.push({
        icon: '👤',
        title: 'Artistes suivis',
        value: followedArtists.length,
        subtitle: '',
        color: '#E74C3C',
      });
    }

    // Favoris
    if (favoritesCount > 0) {
      cards.push({
        icon: '❤️',
        title: 'Favoris',
        value: favoritesCount,
        subtitle: '',
        color: '#E91E63',
      });
    }

    return cards;
  }, [stats, followedArtists, favoritesCount]);

  if (attendedConcerts.length === 0 && followedArtists.length === 0 && favoritesCount === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Pas encore de stats</Text>
        <Text style={styles.emptySubtitle}>
          Commence a aller a des concerts pour voir tes insights !
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tes insights</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight, index) => (
          <View
            key={index}
            style={[styles.card, { borderLeftColor: insight.color }]}
          >
            <Text style={styles.cardIcon}>{insight.icon}</Text>
            <Text style={styles.cardValue}>{insight.value}</Text>
            <Text style={styles.cardSubtitle}>{insight.subtitle}</Text>
            <Text style={styles.cardTitle}>{insight.title}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Achievements / Badges */}
      {stats.totalConcerts >= 10 && (
        <View style={styles.achievementContainer}>
          <Text style={styles.achievementTitle}>Achievements</Text>
          <View style={styles.achievementsRow}>
            {stats.totalConcerts >= 10 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🏆</Text>
                <Text style={styles.badgeText}>10+ concerts</Text>
              </View>
            )}
            {stats.totalConcerts >= 25 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🎖️</Text>
                <Text style={styles.badgeText}>25+ concerts</Text>
              </View>
            )}
            {stats.streak >= 3 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🔥</Text>
                <Text style={styles.badgeText}>3 mois streak</Text>
              </View>
            )}
            {stats.averageRating >= 4 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>⭐</Text>
                <Text style={styles.badgeText}>Critique exigeant</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 120,
    borderLeftWidth: 3,
    marginRight: spacing.sm,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  cardValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  achievementContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  achievementTitle: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default ConcertInsights;
