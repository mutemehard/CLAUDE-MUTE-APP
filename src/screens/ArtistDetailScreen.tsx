import React, { useEffect, useState, useMemo } from 'react';
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
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { artistService, concertService } from '../services';
import { shareArtist, haptics } from '../utils';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Artist, Concert, ArtistStats } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'ArtistDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ArtistDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { artistId } = route.params;
  const {
    isFavorite,
    addFavorite,
    removeFavorite,
    followArtist,
    unfollowArtist,
    isFollowingArtist,
    getArtistStats,
  } = useStore();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if following this artist
  const isFollowing = artist ? isFollowingArtist(artist.id) : false;

  // Get stats for this artist (how many times seen)
  const artistStats: ArtistStats | null = useMemo(() => {
    if (!artist) return null;
    return getArtistStats(artist.name);
  }, [artist, getArtistStats]);

  useEffect(() => {
    loadArtist();
  }, [artistId]);

  const loadArtist = async () => {
    setIsLoading(true);
    const [artistData, concertsData] = await Promise.all([
      artistService.getArtistById(artistId),
      concertService.getConcertsByArtist(artistId),
    ]);
    setArtist(artistData);
    setConcerts(concertsData);
    setIsLoading(false);
  };

  const handleFavorite = () => {
    if (!artist) return;
    haptics.light();
    if (isFavorite('artist', artist.id)) {
      removeFavorite('artist', artist.id);
    } else {
      addFavorite('artist', artist.id);
    }
  };

  const handleFollow = () => {
    if (!artist) return;
    haptics.medium();
    if (isFollowing) {
      unfollowArtist(artist.id);
    } else {
      followArtist(artist.id);
    }
  };

  const handleOpenSpotify = () => {
    if (artist?.spotifyUrl) {
      Linking.openURL(artist.spotifyUrl);
    }
  };

  const handleOpenAppleMusic = () => {
    if (artist?.appleMusicUrl) {
      Linking.openURL(artist.appleMusicUrl);
    }
  };

  const handleShare = async () => {
    if (!artist) return;
    const result = await shareArtist(artist);
    if (!result.success && result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleConcertPress = (concert: Concert) => {
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleConcertFavorite = (concert: Concert) => {
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
    }
  };

  if (isLoading || !artist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite('artist', artist.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {artist.imageUrl ? (
            <Image source={{ uri: artist.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>{artist.name.charAt(0)}</Text>
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

          {/* Header actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Text style={styles.headerActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleFavorite}>
              <Text style={styles.headerActionIcon}>{favorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Artist name */}
          <Text style={styles.artistName}>{artist.name}</Text>

          {/* Genres */}
          <View style={styles.genresContainer}>
            {artist.genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          {/* Popularity */}
          {artist.popularity !== undefined && (
            <View style={styles.popularityContainer}>
              <Text style={styles.popularityLabel}>Popularite</Text>
              <View style={styles.popularityBar}>
                <View
                  style={[
                    styles.popularityFill,
                    { width: `${artist.popularity}%` }
                  ]}
                />
              </View>
              <Text style={styles.popularityValue}>{artist.popularity}%</Text>
            </View>
          )}

          {/* Artist Stats - Show if user has seen this artist */}
          {artistStats && artistStats.seenCount > 0 && (
            <View style={styles.statsSection}>
              <View style={styles.statsCard}>
                <Text style={styles.statsEmoji}>🎤</Text>
                <View style={styles.statsContent}>
                  <Text style={styles.statsTitle}>
                    Vu {artistStats.seenCount} fois
                  </Text>
                  <Text style={styles.statsSubtitle}>
                    {artistStats.venues.length > 1
                      ? `Dans ${artistStats.venues.length} salles differentes`
                      : artistStats.venues[0] || ''}
                  </Text>
                  {artistStats.lastSeen && (
                    <Text style={styles.statsDate}>
                      Dernier concert: {new Date(artistStats.lastSeen).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {artist.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Biographie</Text>
              <Text style={styles.description}>{artist.description}</Text>
            </View>
          )}

          {/* Music platforms */}
          <View style={styles.platformsSection}>
            <Text style={styles.sectionTitle}>Ecouter sur</Text>
            <View style={styles.platformButtons}>
              {artist.spotifyUrl && (
                <TouchableOpacity
                  style={[styles.platformButton, { backgroundColor: '#1DB954' }]}
                  onPress={handleOpenSpotify}
                >
                  <Text style={styles.platformIcon}>🎵</Text>
                  <Text style={styles.platformText}>Spotify</Text>
                </TouchableOpacity>
              )}
              {artist.appleMusicUrl && (
                <TouchableOpacity
                  style={[styles.platformButton, { backgroundColor: '#FA243C' }]}
                  onPress={handleOpenAppleMusic}
                >
                  <Text style={styles.platformIcon}>🎵</Text>
                  <Text style={styles.platformText}>Apple Music</Text>
                </TouchableOpacity>
              )}
              {!artist.spotifyUrl && !artist.appleMusicUrl && (
                <Text style={styles.noPlatformText}>
                  Aucun lien de streaming disponible
                </Text>
              )}
            </View>
          </View>

          {/* Upcoming concerts */}
          <View style={styles.concertsSection}>
            <Text style={styles.sectionTitle}>
              Concerts a venir ({concerts.length})
            </Text>
            {concerts.length > 0 ? (
              concerts.map(concert => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  onPress={() => handleConcertPress(concert)}
                  onFavoritePress={() => handleConcertFavorite(concert)}
                  isFavorite={isFavorite('concert', concert.id)}
                />
              ))
            ) : (
              <View style={styles.noConcertsContainer}>
                <Text style={styles.noConcertsEmoji}>📅</Text>
                <Text style={styles.noConcertsText}>
                  Aucun concert prevu pour le moment
                </Text>
                <Text style={styles.noConcertsSubtext}>
                  Ajoutez cet artiste a vos favoris pour etre notifie
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followButtonActive]}
          onPress={handleFollow}
        >
          <Text style={styles.followButtonIcon}>{isFollowing ? '🔔' : '🔕'}</Text>
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? 'Notifications activees' : 'Suivre cet artiste'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: spacing.md,
  },
  artistName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genreTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  genreText: {
    ...typography.bodySmall,
    color: colors.secondary,
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  popularityLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    width: 70,
  },
  popularityBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  popularityFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  popularityValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statsEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  statsSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statsDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  platformsSection: {
    marginBottom: spacing.lg,
  },
  platformButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  platformIcon: {
    fontSize: 18,
  },
  platformText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  noPlatformText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  concertsSection: {
    marginBottom: spacing.xl,
  },
  noConcertsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  noConcertsEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noConcertsText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noConcertsSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomCTA: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  followButtonActive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  followButtonIcon: {
    fontSize: 18,
  },
  followButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  followButtonTextActive: {
    color: colors.primary,
  },
});
