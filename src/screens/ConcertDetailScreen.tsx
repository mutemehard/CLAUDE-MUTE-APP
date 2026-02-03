import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Linking,
  Share,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import { concertService, notificationService } from '../services';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Concert } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'ConcertDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ConcertDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { concertId } = route.params;
  const { isFavorite, addFavorite, removeFavorite, addAttendedConcert } = useStore();

  const [concert, setConcert] = useState<Concert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherDates, setOtherDates] = useState<Concert[]>([]);
  const [similarConcerts, setSimilarConcerts] = useState<Concert[]>([]);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    loadConcert();
  }, [concertId]);

  const loadConcert = async () => {
    setIsLoading(true);
    const data = await concertService.getConcertById(concertId);
    setConcert(data);

    if (data) {
      // Charge les autres dates de l'artiste
      const artistConcerts = await concertService.getConcertsByArtist(data.artist.id);
      setOtherDates(artistConcerts.filter(c => c.id !== concertId));

      // Charge des concerts similaires (meme genre ou meme salle)
      const allConcerts = await concertService.getAllConcerts();
      const similar = allConcerts.filter(c =>
        c.id !== concertId &&
        (c.genre === data.genre || c.venue.id === data.venue.id)
      ).slice(0, 5);
      setSimilarConcerts(similar);
    }

    setIsLoading(false);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isTomorrow = (dateStr: string): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  };

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const concertDate = new Date(dateStr);
    const diff = concertDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleFavorite = () => {
    if (!concert) return;
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
    }
  };

  const handleBuyTickets = async () => {
    if (concert?.ticketUrl) {
      const supported = await Linking.canOpenURL(concert.ticketUrl);
      if (supported) {
        await Linking.openURL(concert.ticketUrl);
      }
    }
  };

  const handleShare = async () => {
    if (!concert) return;
    try {
      await Share.share({
        message: `${concert.artist.name} en concert @ ${concert.venue.name} le ${formatDate(concert.date)} - ${concert.startTime}\n\nDecouvre ce concert sur MUTE !`,
        title: `Concert: ${concert.artist.name}`,
      });
    } catch (error) {
      // Ignore
    }
  };

  const handleSetReminder = async () => {
    if (!concert) return;

    try {
      await notificationService.scheduleReminderNotification(concert, 1);
      setReminderSet(true);
      Alert.alert(
        'Rappel active',
        `Tu recevras une notification la veille du concert (${formatShortDate(concert.date)})`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible d\'activer le rappel. Verifie tes parametres de notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkAttended = () => {
    if (!concert) return;

    Alert.alert(
      'Marquer comme vu',
      'Ajouter ce concert a ton historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: () => {
            addAttendedConcert({
              concertId: concert.id,
              artistName: concert.artist.name,
              venueName: concert.venue.name,
              date: concert.date,
              addedAt: new Date().toISOString(),
            });
            Alert.alert('Concert ajoute !', 'Ce concert a ete ajoute a ton historique.');
          },
        },
      ]
    );
  };

  const handleOpenMaps = () => {
    if (!concert) return;
    const url = `https://maps.google.com/?q=${concert.venue.latitude},${concert.venue.longitude}`;
    Linking.openURL(url);
  };

  const handleArtistPress = () => {
    if (!concert) return;
    navigation.navigate('ArtistDetail', { artistId: concert.artist.id });
  };

  const handleVenuePress = () => {
    if (!concert) return;
    navigation.navigate('VenueDetail', { venueId: concert.venue.id });
  };

  const handleSimilarConcertPress = (similarConcert: Concert) => {
    navigation.push('ConcertDetail', { concertId: similarConcert.id });
  };

  if (isLoading || !concert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite('concert', concert.id);
  const today = isToday(concert.date);
  const tomorrow = isTomorrow(concert.date);
  const daysUntil = getDaysUntil(concert.date);
  const isPast = daysUntil < 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {concert.imageUrl ? (
            <Image source={{ uri: concert.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>{concert.artist.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Share & Favorite buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Text style={styles.headerActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleFavorite}>
              <Text style={styles.headerActionIcon}>{favorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {today && (
              <View style={styles.todayBadge}>
                <Text style={styles.badgeText}>CE SOIR</Text>
              </View>
            )}
            {tomorrow && !today && (
              <View style={[styles.todayBadge, { backgroundColor: colors.secondary }]}>
                <Text style={styles.badgeText}>DEMAIN</Text>
              </View>
            )}
            {concert.isSoldOut && (
              <View style={styles.soldOutBadge}>
                <Text style={styles.badgeText}>COMPLET</Text>
              </View>
            )}
            {isPast && (
              <View style={[styles.soldOutBadge, { backgroundColor: colors.textMuted }]}>
                <Text style={styles.badgeText}>PASSE</Text>
              </View>
            )}
          </View>

          {/* Countdown */}
          {!isPast && !today && daysUntil <= 7 && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>
                J-{daysUntil}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Artist name - clickable */}
          <TouchableOpacity onPress={handleArtistPress}>
            <Text style={styles.artistName}>{concert.artist.name}</Text>
            <Text style={styles.artistLink}>Voir le profil de l'artiste →</Text>
          </TouchableOpacity>

          {/* Genre */}
          {concert.genre && (
            <View style={styles.genreContainer}>
              <Text style={styles.genre}>{concert.genre}</Text>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {today ? 'Aujourd\'hui' : tomorrow ? 'Demain' : formatShortDate(concert.date)}
              </Text>
              <Text style={styles.quickStatLabel}>Date</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{concert.startTime}</Text>
              <Text style={styles.quickStatLabel}>Heure</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {concert.price ? `${concert.price.min}${concert.price.currency}` : 'Gratuit'}
              </Text>
              <Text style={styles.quickStatLabel}>A partir de</Text>
            </View>
          </View>

          {/* Venue - clickable */}
          <TouchableOpacity style={styles.venueCard} onPress={handleVenuePress}>
            <View style={styles.venueIconContainer}>
              <Text style={styles.venueIcon}>📍</Text>
            </View>
            <View style={styles.venueInfo}>
              <Text style={styles.venueName}>{concert.venue.name}</Text>
              <Text style={styles.venueAddress}>{concert.venue.address}</Text>
              <Text style={styles.venueCity}>
                {concert.venue.postalCode} {concert.venue.city}
                {concert.venue.arrondissement && ` (${concert.venue.arrondissement})`}
              </Text>
            </View>
            <TouchableOpacity style={styles.mapsButton} onPress={handleOpenMaps}>
              <Text style={styles.mapsButtonText}>Maps</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Artist description */}
          {concert.artist.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>A propos de l'artiste</Text>
              <Text style={styles.description}>{concert.artist.description}</Text>
              <TouchableOpacity onPress={handleArtistPress}>
                <Text style={styles.seeMoreLink}>En savoir plus →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, reminderSet && styles.actionButtonActive]}
              onPress={handleSetReminder}
              disabled={isPast || today}
            >
              <Text style={styles.actionIcon}>{reminderSet ? '🔔' : '🔕'}</Text>
              <Text style={styles.actionText}>
                {reminderSet ? 'Rappel active' : 'Me rappeler'}
              </Text>
            </TouchableOpacity>

            {isPast && (
              <TouchableOpacity style={styles.actionButton} onPress={handleMarkAttended}>
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={styles.actionText}>J'y etais !</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Other dates by same artist */}
          {otherDates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Autres dates de {concert.artist.name}</Text>
              {otherDates.map(other => (
                <TouchableOpacity
                  key={other.id}
                  style={styles.otherDateItem}
                  onPress={() => navigation.push('ConcertDetail', { concertId: other.id })}
                >
                  <View style={styles.otherDateInfo}>
                    <Text style={styles.otherDateDate}>{formatShortDate(other.date)}</Text>
                    <Text style={styles.otherDateVenue}>{other.venue.name}</Text>
                  </View>
                  {other.price && (
                    <Text style={styles.otherDatePrice}>
                      {other.price.min}{other.price.currency}
                    </Text>
                  )}
                  <Text style={styles.otherDateArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Similar concerts */}
          {similarConcerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tu pourrais aimer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarConcerts.map(similar => (
                  <TouchableOpacity
                    key={similar.id}
                    style={styles.similarCard}
                    onPress={() => handleSimilarConcertPress(similar)}
                  >
                    <View style={styles.similarImageContainer}>
                      <View style={styles.similarImagePlaceholder}>
                        <Text style={styles.similarInitial}>
                          {similar.artist.name.charAt(0)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.similarArtist} numberOfLines={1}>
                      {similar.artist.name}
                    </Text>
                    <Text style={styles.similarDate}>{formatShortDate(similar.date)}</Text>
                    <Text style={styles.similarVenue} numberOfLines={1}>
                      {similar.venue.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Source */}
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceText}>
              Source: {concert.source} • Mis a jour aujourd'hui
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {!concert.isSoldOut && concert.ticketUrl && !isPast && (
        <View style={styles.bottomCTA}>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyTickets}>
            <Text style={styles.buyButtonText}>Acheter des places</Text>
            {concert.price && (
              <Text style={styles.buyButtonPrice}>
                des {concert.price.min} {concert.price.currency}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Sold out or Past CTA */}
      {(concert.isSoldOut || isPast) && (
        <View style={styles.bottomCTA}>
          <View style={[styles.buyButton, styles.disabledButton]}>
            <Text style={styles.disabledButtonText}>
              {concert.isSoldOut ? 'Complet' : 'Concert passe'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: colors.primary,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 24,
  },
  headerActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },
  badgesContainer: {
    position: 'absolute',
    bottom: spacing.md,
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
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  countdownText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.md,
  },
  artistName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  artistLink: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  genreContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  genre: {
    ...typography.bodySmall,
    color: colors.secondary,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.sm,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  venueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  venueIcon: {
    fontSize: 24,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  venueAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  venueCity: {
    ...typography.caption,
    color: colors.textMuted,
  },
  mapsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  mapsButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  descriptionSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  seeMoreLink: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  otherDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  otherDateInfo: {
    flex: 1,
  },
  otherDateDate: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  otherDateVenue: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  otherDatePrice: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  otherDateArrow: {
    color: colors.textMuted,
    fontSize: 18,
  },
  similarCard: {
    width: 140,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  similarImageContainer: {
    marginBottom: spacing.xs,
  },
  similarImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarInitial: {
    ...typography.h2,
    color: colors.primary,
  },
  similarArtist: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  similarDate: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  similarVenue: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sourceInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  sourceText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  bottomCTA: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  buyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buyButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  buyButtonPrice: {
    ...typography.caption,
    color: colors.textPrimary,
    opacity: 0.8,
    marginTop: 2,
  },
  disabledButton: {
    backgroundColor: colors.surfaceLight,
  },
  disabledButtonText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
