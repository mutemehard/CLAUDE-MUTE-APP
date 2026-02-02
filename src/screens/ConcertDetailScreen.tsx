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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import { concertService } from '../services';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Concert } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'ConcertDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ConcertDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { concertId } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useStore();

  const [concert, setConcert] = useState<Concert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherDates, setOtherDates] = useState<Concert[]>([]);

  useEffect(() => {
    loadConcert();
  }, [concertId]);

  const loadConcert = async () => {
    setIsLoading(true);
    const data = await concertService.getConcertById(concertId);
    setConcert(data);

    // Charge les autres dates de l'artiste
    if (data) {
      const artistConcerts = await concertService.getConcertsByArtist(data.artist.id);
      setOtherDates(artistConcerts.filter(c => c.id !== concertId));
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

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
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
        message: `${concert.artist.name} en concert @ ${concert.venue.name} le ${formatDate(concert.date)} - ${concert.startTime}`,
        title: `Concert: ${concert.artist.name}`,
      });
    } catch (error) {
      // Ignore
    }
  };

  const handleAddToCalendar = () => {
    Alert.alert(
      'Ajouter au calendrier',
      'Cette fonctionnalite sera bientot disponible !',
      [{ text: 'OK' }]
    );
  };

  const handleOpenMaps = () => {
    if (!concert) return;
    const url = `https://maps.google.com/?q=${concert.venue.latitude},${concert.venue.longitude}`;
    Linking.openURL(url);
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

          {/* Badges */}
          <View style={styles.badgesContainer}>
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
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Artist name */}
          <Text style={styles.artistName}>{concert.artist.name}</Text>

          {/* Genre */}
          {concert.genre && (
            <View style={styles.genreContainer}>
              <Text style={styles.genre}>{concert.genre}</Text>
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionIcon}>📅</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.infoTitle}>{formatDate(concert.date)}</Text>
              <Text style={styles.infoSubtitle}>
                {concert.startTime}
                {concert.endTime && ` - ${concert.endTime}`}
              </Text>
            </View>
          </View>

          {/* Venue */}
          <TouchableOpacity style={styles.infoSection} onPress={handleOpenMaps}>
            <Text style={styles.sectionIcon}>📍</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.infoTitle}>{concert.venue.name}</Text>
              <Text style={styles.infoSubtitle}>{concert.venue.address}</Text>
              <Text style={styles.infoSubtitle}>
                {concert.venue.postalCode} {concert.venue.city}
                {concert.venue.arrondissement && ` (${concert.venue.arrondissement})`}
              </Text>
            </View>
            <Text style={styles.linkIcon}>→</Text>
          </TouchableOpacity>

          {/* Price */}
          {concert.price && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionIcon}>💰</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.infoTitle}>
                  {concert.price.min === concert.price.max
                    ? `${concert.price.min} ${concert.price.currency}`
                    : `${concert.price.min} - ${concert.price.max} ${concert.price.currency}`}
                </Text>
                <Text style={styles.infoSubtitle}>Prix des places</Text>
              </View>
            </View>
          )}

          {/* Source */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionIcon}>🔗</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.infoTitle}>Source: {concert.source}</Text>
              <Text style={styles.infoSubtitle}>Donnees de billetterie</Text>
            </View>
          </View>

          {/* Artist description */}
          {concert.artist.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>A propos de l'artiste</Text>
              <Text style={styles.description}>{concert.artist.description}</Text>
            </View>
          )}

          {/* Other dates */}
          {otherDates.length > 0 && (
            <View style={styles.otherDatesSection}>
              <Text style={styles.otherDatesTitle}>Autres dates</Text>
              {otherDates.map(other => (
                <TouchableOpacity
                  key={other.id}
                  style={styles.otherDateItem}
                  onPress={() => navigation.push('ConcertDetail', { concertId: other.id })}
                >
                  <Text style={styles.otherDateDate}>
                    {formatDate(other.date).split(' ').slice(0, 3).join(' ')}
                  </Text>
                  <Text style={styles.otherDateVenue}>{other.venue.name}</Text>
                  <Text style={styles.otherDateArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Actions secondaires */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <Text style={styles.secondaryButtonIcon}>📤</Text>
              <Text style={styles.secondaryButtonText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleAddToCalendar}>
              <Text style={styles.secondaryButtonIcon}>📆</Text>
              <Text style={styles.secondaryButtonText}>Calendrier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFavorite}>
              <Text style={styles.secondaryButtonIcon}>{favorite ? '❤️' : '🤍'}</Text>
              <Text style={styles.secondaryButtonText}>Favori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {!concert.isSoldOut && concert.ticketUrl && (
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
    height: 280,
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
    fontSize: 80,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    backgroundColor: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.md,
  },
  artistName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  sectionContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  infoSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linkIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  descriptionSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  descriptionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  otherDatesSection: {
    marginTop: spacing.lg,
  },
  otherDatesTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  otherDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  otherDateDate: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    width: 100,
  },
  otherDateVenue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  otherDateArrow: {
    color: colors.textMuted,
    fontSize: 18,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  secondaryButtonIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
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
});
