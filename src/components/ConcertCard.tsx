import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Concert } from '../types';
import { colors, spacing, borderRadius, typography } from '../constants';

interface ConcertCardProps {
  concert: Concert;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

// Formate la date en français
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('fr-FR', options);
};

// Vérifie si c'est aujourd'hui
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

export const ConcertCard: React.FC<ConcertCardProps> = ({
  concert,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const today = isToday(concert.date);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
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
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>CE SOIR</Text>
          </View>
        )}
        {concert.isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>COMPLET</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Artiste */}
        <Text style={styles.artistName} numberOfLines={1}>
          {concert.artist.name}
        </Text>

        {/* Genre */}
        {concert.genre && (
          <View style={styles.genreContainer}>
            <Text style={styles.genre}>{concert.genre}</Text>
          </View>
        )}

        {/* Salle */}
        <Text style={styles.venue} numberOfLines={1}>
          {concert.venue.name}
        </Text>

        {/* Date & Heure */}
        <View style={styles.dateRow}>
          <Text style={styles.date}>{formatDate(concert.date)}</Text>
          <Text style={styles.time}>{concert.startTime}</Text>
        </View>

        {/* Prix */}
        {concert.price && (
          <Text style={styles.price}>
            {concert.price.min === concert.price.max
              ? `${concert.price.min} ${concert.price.currency}`
              : `${concert.price.min} - ${concert.price.max} ${concert.price.currency}`}
          </Text>
        )}

        {/* Source */}
        <Text style={styles.source}>{concert.source}</Text>
      </View>

      {/* Bouton favori */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    height: 140,
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
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  todayBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  todayText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  soldOutBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  soldOutText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  artistName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  genreContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  genre: {
    ...typography.caption,
    color: colors.secondary,
  },
  venue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  time: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  price: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  source: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: spacing.xs,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  favoriteIcon: {
    fontSize: 24,
    color: colors.primary,
  },
});
