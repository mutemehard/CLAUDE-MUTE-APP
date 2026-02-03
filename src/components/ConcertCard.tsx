import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Concert } from '../types';
import { colors, spacing, borderRadius, typography } from '../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.md * 2;

interface ConcertCardProps {
  concert: Concert;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'large';
  distance?: string | null; // Distance formatee (ex: "1.2 km")
}

// Formate la date en francais
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split('T')[0]) {
    return 'Ce soir';
  }
  if (dateStr === tomorrow.toISOString().split('T')[0]) {
    return 'Demain';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('fr-FR', options);
};

// Verifie si c'est aujourd'hui
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

export const ConcertCard: React.FC<ConcertCardProps> = ({
  concert,
  onPress,
  onFavoritePress,
  isFavorite = false,
  variant = 'default',
  distance,
}) => {
  const today = isToday(concert.date);

  if (variant === 'large') {
    return (
      <TouchableOpacity style={styles.largeContainer} onPress={onPress} activeOpacity={0.9}>
        {/* Image de fond */}
        <View style={styles.largeImageContainer}>
          {concert.imageUrl ? (
            <Image source={{ uri: concert.imageUrl }} style={styles.largeImage} />
          ) : (
            <View style={[styles.largeImage, styles.imagePlaceholder]}>
              <Text style={styles.largePlaceholderText}>
                {concert.artist.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.largeGradient} />

          {/* Badges */}
          <View style={styles.largeBadgeContainer}>
            {today && (
              <View style={styles.todayBadge}>
                <Text style={styles.badgeText}>CE SOIR</Text>
              </View>
            )}
            {concert.isSoldOut && (
              <View style={styles.soldOutBadge}>
                <Text style={styles.badgeText}>COMPLET</Text>
              </View>
            )}
          </View>

          {/* Contenu sur l'image */}
          <View style={styles.largeContent}>
            <Text style={styles.largeArtistName} numberOfLines={2}>
              {concert.artist.name}
            </Text>
            <View style={styles.largeInfoRow}>
              <Text style={styles.largeVenue}>{concert.venue.name}</Text>
              <Text style={styles.largeDot}>·</Text>
              <Text style={styles.largeDate}>{formatDate(concert.date)}</Text>
              <Text style={styles.largeDot}>·</Text>
              <Text style={styles.largeTime}>{concert.startTime}</Text>
            </View>
            <View style={styles.largePriceRow}>
              {concert.price && (
                <Text style={styles.largePrice}>
                  des {concert.price.min} {concert.price.currency}
                </Text>
              )}
              {distance && (
                <View style={styles.largeDistanceBadge}>
                  <Text style={styles.largeDistanceText}>📍 {distance}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Favori */}
          {onFavoritePress && (
            <TouchableOpacity
              style={styles.largeFavoriteButton}
              onPress={onFavoritePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Default card style
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {concert.imageUrl ? (
          <Image source={{ uri: concert.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>
              {concert.artist.name.charAt(0)}
            </Text>
          </View>
        )}
        {today && (
          <View style={styles.todayBadgeSmall}>
            <Text style={styles.badgeTextSmall}>CE SOIR</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <View style={styles.contentTop}>
          {/* Artiste */}
          <Text style={styles.artistName} numberOfLines={1}>
            {concert.artist.name}
          </Text>

          {/* Genre tag */}
          {concert.genre && (
            <View style={[
              styles.genreTag,
              { backgroundColor: colors.genreColors[concert.genre.toLowerCase()] || colors.genreColors.other }
            ]}>
              <Text style={styles.genreText}>{concert.genre}</Text>
            </View>
          )}
        </View>

        {/* Salle & Distance */}
        <View style={styles.venueRow}>
          <Text style={styles.venue} numberOfLines={1}>
            {concert.venue.name}
          </Text>
          {distance && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>

        {/* Date & Heure & Prix */}
        <View style={styles.bottomRow}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.date}>{formatDate(concert.date)}</Text>
            <Text style={styles.time}>{concert.startTime}</Text>
          </View>
          {concert.price && (
            <Text style={styles.price}>
              {concert.price.min === 0 ? 'Gratuit' : `${concert.price.min}€`}
            </Text>
          )}
        </View>
      </View>

      {/* Bouton favori */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.favoriteIconSmall}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default card
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  todayBadgeSmall: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeTextSmall: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  contentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  artistName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  genreTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  genreText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  venue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  price: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  favoriteIconSmall: {
    fontSize: 18,
  },

  // Large card
  largeContainer: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  largeImageContainer: {
    width: CARD_WIDTH,
    height: 200,
    position: 'relative',
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  largePlaceholderText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  largeGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  largeBadgeContainer: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  soldOutBadge: {
    backgroundColor: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  largeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  largeArtistName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  largeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  largeVenue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  largeDot: {
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  largeDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  largeTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  largePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  largePrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  largeDistanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  largeDistanceText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 11,
  },
  largeFavoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
});
