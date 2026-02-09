import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import { ConcertCard } from '../components/ConcertCard';
import { useStore } from '../hooks';
import { venueService, concertService } from '../services';
import { shareVenue } from '../utils';
import { colors, spacing, typography, borderRadius } from '../constants';
import { RootStackParamList, Venue, Concert } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'VenueDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// Style sombre pour la carte
const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8ec3b9' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a3646' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
];

export const VenueDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { venueId } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useStore();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVenue();
  }, [venueId]);

  const loadVenue = async () => {
    setIsLoading(true);
    const [venueData, concertsData] = await Promise.all([
      venueService.getVenueById(venueId),
      concertService.getConcertsByVenue(venueId),
    ]);
    setVenue(venueData);
    setConcerts(concertsData);
    setIsLoading(false);
  };

  const handleFavorite = () => {
    if (!venue) return;
    if (isFavorite('venue', venue.id)) {
      removeFavorite('venue', venue.id);
    } else {
      addFavorite('venue', venue.id);
    }
  };

  const handleOpenMaps = () => {
    if (!venue) return;
    const url = `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`;
    Linking.openURL(url);
  };

  const handleOpenWebsite = () => {
    if (venue?.website) {
      Linking.openURL(venue.website);
    }
  };

  const handleShare = async () => {
    if (!venue) return;
    const result = await shareVenue(venue);
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

  if (isLoading || !venue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite('venue', venue.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map Header */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: venue.latitude,
              longitude: venue.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            customMapStyle={mapStyle}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: venue.latitude,
                longitude: venue.longitude,
              }}
            >
              <View style={styles.markerContainer}>
                <Text style={styles.markerText}>📍</Text>
              </View>
            </Marker>
          </MapView>
          <View style={styles.mapOverlay} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Header actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShare}
            >
              <Text style={styles.headerActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleFavorite}
            >
              <Text style={styles.headerActionIcon}>{favorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Open in Maps button */}
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={handleOpenMaps}
          >
            <Text style={styles.openMapsText}>Ouvrir dans Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Venue name */}
          <Text style={styles.venueName}>{venue.name}</Text>

          {/* Arrondissement badge */}
          {venue.arrondissement && (
            <View style={styles.arrondissementBadge}>
              <Text style={styles.arrondissementText}>{venue.arrondissement}</Text>
            </View>
          )}

          {/* Address */}
          <TouchableOpacity style={styles.infoSection} onPress={handleOpenMaps}>
            <Text style={styles.sectionIcon}>📍</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.infoTitle}>{venue.address}</Text>
              <Text style={styles.infoSubtitle}>
                {venue.postalCode} {venue.city}
              </Text>
            </View>
            <Text style={styles.linkIcon}>→</Text>
          </TouchableOpacity>

          {/* Capacity */}
          {venue.capacity && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionIcon}>👥</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.infoTitle}>
                  {venue.capacity.toLocaleString('fr-FR')} places
                </Text>
                <Text style={styles.infoSubtitle}>Capacite de la salle</Text>
              </View>
            </View>
          )}

          {/* Website */}
          {venue.website && (
            <TouchableOpacity style={styles.infoSection} onPress={handleOpenWebsite}>
              <Text style={styles.sectionIcon}>🌐</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.infoTitle}>Site officiel</Text>
                <Text style={styles.infoSubtitle} numberOfLines={1}>
                  {venue.website.replace('https://', '').replace('http://', '')}
                </Text>
              </View>
              <Text style={styles.linkIcon}>→</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{concerts.length}</Text>
              <Text style={styles.statLabel}>Concerts a venir</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {concerts.length > 0
                  ? [...new Set(concerts.map(c => c.genre))].filter(Boolean).length
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Genres musicaux</Text>
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
                <Text style={styles.noConcertsEmoji}>🎭</Text>
                <Text style={styles.noConcertsText}>
                  Aucun concert prevu pour le moment
                </Text>
                <Text style={styles.noConcertsSubtext}>
                  Ajoutez cette salle a vos favoris pour etre notifie
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.followButton, favorite && styles.followButtonActive]}
          onPress={handleFavorite}
        >
          <Text style={styles.followButtonIcon}>{favorite ? '❤️' : '🤍'}</Text>
          <Text style={[styles.followButtonText, favorite && styles.followButtonTextActive]}>
            {favorite ? 'Salle suivie' : 'Suivre cette salle'}
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
  mapContainer: {
    height: 220,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  markerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  markerText: {
    fontSize: 20,
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
  openMapsButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  openMapsText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  venueName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  arrondissementBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  arrondissementText: {
    ...typography.bodySmall,
    color: colors.secondary,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.md,
  },
  concertsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
