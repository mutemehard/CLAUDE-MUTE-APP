// Composant pour afficher les concerts a proximite
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLocation } from '../hooks';
import { concertService } from '../services';
import { haptics } from '../utils';
import { colors, spacing, typography, borderRadius } from '../constants';
import { Concert, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NearbyConcertsProps {
  maxDistance?: number; // en km
  limit?: number;
  onSeeAllPress?: () => void;
}

export const NearbyConcerts: React.FC<NearbyConcertsProps> = ({
  maxDistance = 5,
  limit = 5,
  onSeeAllPress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { location, getDistanceFromUser, formatDistance, isLoading: locationLoading, requestPermission } = useLocation();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNearbyConcerts = useCallback(async () => {
    if (!location) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allConcerts = await concertService.getAllConcerts();

      // Filtre les concerts d'aujourd'hui et proches
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const nearbyToday = allConcerts
        .filter(c => c.date === today || c.date === tomorrowStr)
        .map(c => {
          const distance = getDistanceFromUser(c.venue.latitude, c.venue.longitude);
          return { concert: c, distance };
        })
        .filter(item => item.distance !== null && item.distance <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, limit);

      setConcerts(nearbyToday.map(item => item.concert));
    } catch (error) {
      console.error('Error loading nearby concerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location, maxDistance, limit, getDistanceFromUser]);

  useEffect(() => {
    loadNearbyConcerts();
  }, [loadNearbyConcerts]);

  const handleConcertPress = (concert: Concert) => {
    haptics.light();
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleRequestLocation = () => {
    haptics.light();
    requestPermission();
  };

  // Si pas de permission de localisation
  if (!locationLoading && !location) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>A proximite</Text>
        </View>
        <TouchableOpacity
          style={styles.locationPrompt}
          onPress={handleRequestLocation}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationPromptContent}>
            <Text style={styles.locationPromptTitle}>Active ta localisation</Text>
            <Text style={styles.locationPromptText}>
              Pour voir les concerts pres de toi
            </Text>
          </View>
          <Text style={styles.locationArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Chargement
  if (isLoading || locationLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>A proximite</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Recherche des concerts...</Text>
        </View>
      </View>
    );
  }

  // Pas de concerts proches
  if (concerts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>A proximite</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎭</Text>
          <Text style={styles.emptyText}>
            Pas de concert dans un rayon de {maxDistance}km ce soir
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>A proximite</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        {onSeeAllPress && concerts.length > 0 && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAllText}>Voir la carte</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {concerts.map(concert => {
          const distance = getDistanceFromUser(concert.venue.latitude, concert.venue.longitude);
          const distanceFormatted = distance !== null ? formatDistance(distance) : null;

          return (
            <TouchableOpacity
              key={concert.id}
              style={styles.concertCard}
              onPress={() => handleConcertPress(concert)}
              activeOpacity={0.8}
            >
              <View style={styles.concertHeader}>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceIcon}>📍</Text>
                  <Text style={styles.distanceText}>{distanceFormatted}</Text>
                </View>
                <Text style={styles.concertTime}>{concert.startTime}</Text>
              </View>

              <View style={styles.concertContent}>
                <Text style={styles.concertArtist} numberOfLines={1}>
                  {concert.artist.name}
                </Text>
                <Text style={styles.concertVenue} numberOfLines={1}>
                  {concert.venue.name}
                </Text>
                {concert.venue.arrondissement && (
                  <Text style={styles.concertArrondissement}>
                    {concert.venue.arrondissement}
                  </Text>
                )}
              </View>

              <View style={styles.concertFooter}>
                {concert.price ? (
                  <Text style={styles.concertPrice}>
                    {concert.price.min}{concert.price.currency}
                  </Text>
                ) : (
                  <Text style={styles.concertPriceFree}>Gratuit</Text>
                )}
                {concert.isSoldOut && (
                  <View style={styles.soldOutBadge}>
                    <Text style={styles.soldOutText}>Complet</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  liveText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 9,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  concertCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  concertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  distanceIcon: {
    fontSize: 10,
  },
  distanceText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
  },
  concertTime: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  concertContent: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  concertArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  concertVenue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  concertArrondissement: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  concertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  concertPrice: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  concertPriceFree: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  soldOutBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  soldOutText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 9,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  locationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  locationPromptContent: {
    flex: 1,
  },
  locationPromptTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  locationPromptText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  locationArrow: {
    fontSize: 18,
    color: colors.primary,
  },
});
