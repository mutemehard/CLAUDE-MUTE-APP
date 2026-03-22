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
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import { concertService, notificationService, calendarService } from '../services';
import { shareConcert, inviteFriendToConcert, haptics, isToday, daysUntil, formatDateFullFr, formatDateFr } from '../utils';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Concert, ParticipationStatus } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'ConcertDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ConcertDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { concertId } = route.params;
  const {
    isFavorite,
    addFavorite,
    removeFavorite,
    addAttendedConcert,
    setParticipation,
    getParticipation,
    getFriendsForConcert,
  } = useStore();

  const [concert, setConcert] = useState<Concert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherDates, setOtherDates] = useState<Concert[]>([]);
  const [similarConcerts, setSimilarConcerts] = useState<Concert[]>([]);
  const [reminderSet, setReminderSet] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  // Social participation (Facebook Events style)
  const participation = getParticipation(concertId);
  const friendsInfo = getFriendsForConcert(concertId);

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

  const isTomorrow = (dateStr: string): boolean => {
    return daysUntil(dateStr) === 1;
  };

  const handleFavorite = () => {
    if (!concert) return;
    haptics.medium();
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
    }
  };

  const handleBuyTickets = async () => {
    if (concert?.ticketUrl) {
      haptics.light();
      const supported = await Linking.canOpenURL(concert.ticketUrl);
      if (supported) {
        await Linking.openURL(concert.ticketUrl);
      }
    }
  };

  const handleShare = async () => {
    if (!concert) return;
    const result = await shareConcert(concert);
    if (!result.success && result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleInviteFriend = async () => {
    if (!concert) return;
    haptics.light();
    const result = await inviteFriendToConcert(concert);
    if (!result.success && result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleSetReminder = async () => {
    if (!concert) return;

    try {
      await notificationService.scheduleReminderNotification(concert, 1);
      haptics.success();
      setReminderSet(true);
      Alert.alert(
        'Rappel active',
        `Tu recevras une notification la veille du concert (${formatDateFr(concert.date)})`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      haptics.error();
      Alert.alert(
        'Erreur',
        'Impossible d\'activer le rappel. Verifie tes parametres de notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddToCalendar = async () => {
    if (!concert) return;

    try {
      const result = await calendarService.addConcert(concert);
      if (result.success) {
        haptics.success();
        setCalendarAdded(true);
        Alert.alert(
          'Ajoute au calendrier',
          `${concert.artist.name} a ete ajoute a ton calendrier`,
          [{ text: 'OK' }]
        );
      } else {
        haptics.error();
        Alert.alert('Erreur', result.error || 'Impossible d\'ajouter au calendrier');
      }
    } catch (error) {
      haptics.error();
      Alert.alert('Erreur', 'Impossible d\'ajouter au calendrier');
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

  // Handle participation (Going / Interested)
  const handleParticipation = (status: ParticipationStatus) => {
    if (!concert) return;
    haptics.medium();

    // Toggle if already set
    const newStatus = participation === status ? null : status;

    setParticipation(concertId, newStatus, {
      artistName: concert.artist.name,
      venueName: concert.venue.name,
      date: concert.date,
    });
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
  const daysUntilConcert = daysUntil(concert.date);
  const isPast = daysUntilConcert < 0;

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

          {/* Share, Invite & Favorite buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleInviteFriend}>
              <Text style={styles.headerActionIcon}>👥</Text>
            </TouchableOpacity>
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
          {!isPast && !today && daysUntilConcert <= 7 && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>
                J-{daysUntilConcert}
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
                {today ? 'Aujourd\'hui' : tomorrow ? 'Demain' : formatDateFr(concert.date)}
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

          {/* Participation Buttons (Facebook Events style) */}
          {!isPast && (
            <View style={styles.participationSection}>
              <TouchableOpacity
                style={[
                  styles.participationButton,
                  participation === 'going' && styles.participationButtonActive,
                ]}
                onPress={() => handleParticipation('going')}
              >
                <Text style={styles.participationIcon}>
                  {participation === 'going' ? '✓' : '🎫'}
                </Text>
                <Text style={[
                  styles.participationText,
                  participation === 'going' && styles.participationTextActive,
                ]}>
                  {participation === 'going' ? 'J\'y vais !' : 'J\'y vais'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.participationButton,
                  styles.participationButtonSecondary,
                  participation === 'interested' && styles.participationButtonInterested,
                ]}
                onPress={() => handleParticipation('interested')}
              >
                <Text style={styles.participationIcon}>
                  {participation === 'interested' ? '⭐' : '☆'}
                </Text>
                <Text style={[
                  styles.participationText,
                  participation === 'interested' && styles.participationTextActive,
                ]}>
                  {participation === 'interested' ? 'Interesse' : 'Ca m\'interesse'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Friends going (social proof) */}
          {(friendsInfo.going.length > 0 || friendsInfo.interested.length > 0) && (
            <View style={styles.friendsSection}>
              {friendsInfo.going.length > 0 && (
                <View style={styles.friendsRow}>
                  <View style={styles.friendsAvatars}>
                    {friendsInfo.going.slice(0, 3).map((friend, i) => (
                      <View key={friend.id} style={[styles.friendAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                        <Text style={styles.friendAvatarText}>
                          {friend.displayName.charAt(0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.friendsText}>
                    {friendsInfo.going.length === 1
                      ? `${friendsInfo.going[0].displayName} y va`
                      : `${friendsInfo.going[0].displayName} et ${friendsInfo.going.length - 1} autre${friendsInfo.going.length > 2 ? 's' : ''} y vont`
                    }
                  </Text>
                </View>
              )}
              {friendsInfo.interested.length > 0 && (
                <View style={styles.friendsRow}>
                  <Text style={styles.friendsTextMuted}>
                    {friendsInfo.interested.length} ami{friendsInfo.interested.length > 1 ? 's' : ''} interesse{friendsInfo.interested.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

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

            {!isPast && (
              <TouchableOpacity
                style={[styles.actionButton, calendarAdded && styles.actionButtonActive]}
                onPress={handleAddToCalendar}
                disabled={calendarAdded}
              >
                <Text style={styles.actionIcon}>{calendarAdded ? '📅' : '📆'}</Text>
                <Text style={styles.actionText}>
                  {calendarAdded ? 'Dans le calendrier' : 'Ajouter au calendrier'}
                </Text>
              </TouchableOpacity>
            )}

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
                    <Text style={styles.otherDateDate}>{formatDateFr(other.date)}</Text>
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
                    <Text style={styles.similarDate}>{formatDateFr(similar.date)}</Text>
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
  // Participation section (Facebook Events style)
  participationSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  participationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  participationButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  participationButtonActive: {
    backgroundColor: colors.success,
  },
  participationButtonInterested: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  participationIcon: {
    fontSize: 18,
  },
  participationText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  participationTextActive: {
    color: colors.textPrimary,
  },
  // Friends section
  friendsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  friendsAvatars: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  friendAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  friendAvatarText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  friendsText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  friendsTextMuted: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
