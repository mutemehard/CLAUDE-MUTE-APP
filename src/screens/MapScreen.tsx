import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, Concert } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const { concerts, fetchConcerts, isLoading } = useStore();
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const handleMarkerPress = (concert: Concert) => {
    setSelectedConcert(concert);
    setShowModal(true);
  };

  const handleConcertPress = () => {
    if (selectedConcert) {
      setShowModal(false);
      navigation.navigate('ConcertDetail', { concertId: selectedConcert.id });
    }
  };

  const formatDate = (dateStr: string): string => {
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

  // Groupe les concerts par venue pour éviter les markers superposés
  const concertsByVenue = concerts.reduce((acc, concert) => {
    const key = concert.venue.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(concert);
    return acc;
  }, {} as Record<string, Concert[]>);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Carte</Text>
        <Text style={styles.subtitle}>{concerts.length} concerts a Paris</Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: APP_CONFIG.defaultCoordinates.latitude,
            longitude: APP_CONFIG.defaultCoordinates.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          customMapStyle={mapStyle}
        >
          {Object.entries(concertsByVenue).map(([venueId, venueConcerts]) => {
            const firstConcert = venueConcerts[0];
            const hasToday = venueConcerts.some(c => isToday(c.date));

            return (
              <Marker
                key={venueId}
                coordinate={{
                  latitude: firstConcert.venue.latitude,
                  longitude: firstConcert.venue.longitude,
                }}
                onPress={() => handleMarkerPress(firstConcert)}
              >
                <View style={[
                  styles.markerContainer,
                  hasToday && styles.markerToday,
                ]}>
                  <Text style={styles.markerText}>
                    {venueConcerts.length > 1 ? venueConcerts.length : '🎵'}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Ce soir</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>A venir</Text>
          </View>
        </View>
      </View>

      {/* Modal concert sélectionné */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          {selectedConcert && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <TouchableOpacity
                style={styles.concertPreview}
                onPress={handleConcertPress}
              >
                <View style={styles.previewHeader}>
                  <Text style={styles.previewArtist}>{selectedConcert.artist.name}</Text>
                  {isToday(selectedConcert.date) && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayText}>CE SOIR</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.previewVenue}>{selectedConcert.venue.name}</Text>
                <Text style={styles.previewAddress}>{selectedConcert.venue.address}</Text>

                <View style={styles.previewDetails}>
                  <Text style={styles.previewDate}>
                    {formatDate(selectedConcert.date)} - {selectedConcert.startTime}
                  </Text>
                  {selectedConcert.price && (
                    <Text style={styles.previewPrice}>
                      {selectedConcert.price.min}-{selectedConcert.price.max} {selectedConcert.price.currency}
                    </Text>
                  )}
                </View>

                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>Voir les details</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mapContainer: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  markerToday: {
    backgroundColor: colors.primary,
  },
  markerText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  concertPreview: {
    padding: spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  previewArtist: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  todayText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  previewVenue: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewAddress: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  previewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewDate: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  previewPrice: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
