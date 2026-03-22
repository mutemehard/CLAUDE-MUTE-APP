import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Concert, Friend } from '../types';
import { colors, spacing, borderRadius, typography } from '../constants';
import { isToday, getRelativeDateLabel } from '../utils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.md * 2;

// Info sur les amis qui participent
interface FriendsInfo {
  going: Friend[];
  interested: Friend[];
}

interface ConcertCardProps {
  concert: Concert;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'large';
  distance?: string | null;
  friendsInfo?: FriendsInfo;
}

export const ConcertCard: React.FC<ConcertCardProps> = ({
  concert,
  onPress,
  onFavoritePress,
  isFavorite = false,
  variant = 'default',
  distance,
  friendsInfo,
}) => {
  const today = isToday(concert.date);

  // Nombre total d'amis qui participent
  const totalFriends = (friendsInfo?.going.length || 0) + (friendsInfo?.interested.length || 0);
  const hasFriends = totalFriends > 0;

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
              <Text style={styles.largeDate}>{getRelativeDateLabel(concert.date)}</Text>
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
              {/* Amis sur large card */}
              {hasFriends && (
                <View style={styles.largeFriendsRow}>
                  <View style={styles.largeFriendsAvatars}>
                    {[...friendsInfo!.going, ...friendsInfo!.interested].slice(0, 3).map((friend, index) => (
                      <View
                        key={friend.id}
                        style={[
                          styles.largeFriendAvatar,
                          { marginLeft: index > 0 ? -6 : 0 },
                        ]}
                      >
                        {friend.avatarUrl ? (
                          <Image source={{ uri: friend.avatarUrl }} style={styles.largeFriendAvatarImage} />
                        ) : (
                          <Text style={styles.largeFriendAvatarText}>
                            {friend.displayName.charAt(0)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                  <Text style={styles.largeFriendsText}>
                    {totalFriends} ami{totalFriends > 1 ? 's' : ''}
                  </Text>
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
            <Text style={styles.date}>{getRelativeDateLabel(concert.date)}</Text>
            <Text style={styles.time}>{concert.startTime}</Text>
          </View>
          {concert.price && (
            <Text style={styles.price}>
              {concert.price.min === 0 ? 'Gratuit' : `${concert.price.min}€`}
            </Text>
          )}
        </View>

        {/* Amis qui participent */}
        {hasFriends && (
          <View style={styles.friendsRow}>
            <View style={styles.friendsAvatars}>
              {friendsInfo!.going.slice(0, 3).map((friend, index) => (
                <View
                  key={friend.id}
                  style={[
                    styles.friendAvatar,
                    { marginLeft: index > 0 ? -8 : 0 },
                  ]}
                >
                  {friend.avatarUrl ? (
                    <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatarImage} />
                  ) : (
                    <Text style={styles.friendAvatarText}>
                      {friend.displayName.charAt(0)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.friendsText}>
              {friendsInfo!.going.length > 0
                ? `${friendsInfo!.going[0].displayName}${friendsInfo!.going.length > 1 ? ` +${friendsInfo!.going.length - 1}` : ''} y va`
                : `${friendsInfo!.interested[0].displayName}${friendsInfo!.interested.length > 1 ? ` +${friendsInfo!.interested.length - 1}` : ''} interesse`}
            </Text>
          </View>
        )}
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

// Export optimise avec memo pour eviter les re-renders inutiles
export const MemoizedConcertCard = memo(ConcertCard, (prev, next) => {
  return (
    prev.concert.id === next.concert.id &&
    prev.isFavorite === next.isFavorite &&
    prev.distance === next.distance &&
    prev.friendsInfo?.going.length === next.friendsInfo?.going.length
  );
});

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
  // Friends row for default card
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  friendsAvatars: {
    flexDirection: 'row',
  },
  friendAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  friendAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  friendAvatarText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  friendsText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  // Friends for large card
  largeFriendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  largeFriendsAvatars: {
    flexDirection: 'row',
  },
  largeFriendAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  largeFriendAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  largeFriendAvatarText: {
    fontSize: 9,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  largeFriendsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
});
