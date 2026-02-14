import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, Concert } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'today' | 'weekend' | 'week';

const { width, height } = Dimensions.get('window');

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const { concerts, fetchConcerts, isLoading, isFavorite, addFavorite, removeFavorite } = useStore();
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [selectedVenueConcerts, setSelectedVenueConcerts] = useState<Concert[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showListView, setShowListView] = useState(false);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isThisWeekend = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    const targetDate = new Date(dateStr);
    return (
      targetDate.toDateString() === saturday.toDateString() ||
      targetDate.toDateString() === sunday.toDateString()
    );
  };

  const isThisWeek = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return date >= today && date <= weekEnd;
  };

  const filteredConcerts = concerts.filter(concert => {
    switch (activeFilter) {
      case 'today':
        return isToday(concert.date);
      case 'weekend':
        return isThisWeekend(concert.date);
      case 'week':
        return isThisWeek(concert.date);
      default:
        return true;
    }
  });

  const handleMarkerPress = (venueConcerts: Concert[]) => {
    if (venueConcerts.length === 1) {
      setSelectedConcert(venueConcerts[0]);
      setSelectedVenueConcerts([]);
    } else {
      setSelectedConcert(null);
      setSelectedVenueConcerts(venueConcerts);
    }
    setShowModal(true);
  };

  const handleConcertPress = (concert: Concert) => {
    setShowModal(false);
    navigation.navigate('ConcertDetail', { concertId: concert.id });
  };

  const handleVenuePress = () => {
    const venue = selectedConcert?.venue || selectedVenueConcerts[0]?.venue;
    if (venue) {
      setShowModal(false);
      navigation.navigate('VenueDetail', { venueId: venue.id });
    }
  };

  const handleFavoritePress = (concert: Concert) => {
    if (isFavorite('concert', concert.id)) {
      removeFavorite('concert', concert.id);
    } else {
      addFavorite('concert', concert.id);
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

  const centerOnParis = () => {
    mapRef.current?.animateToRegion({
      latitude: APP_CONFIG.defaultCoordinates.latitude,
      longitude: APP_CONFIG.defaultCoordinates.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
  };

  // Groupe les concerts par venue pour éviter les markers superposés
  const concertsByVenue = filteredConcerts.reduce((acc, concert) => {
    const key = concert.venue.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(concert);
    return acc;
  }, {} as Record<string, Concert[]>);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'today', label: 'Ce soir' },
    { key: 'weekend', label: 'Week-end' },
    { key: 'week', label: 'Semaine' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Carte</Text>
            <Text style={styles.subtitle}>{filteredConcerts.length} concerts</Text>
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, showListView && styles.viewToggleActive]}
            onPress={() => setShowListView(!showListView)}
          >
            <Text style={styles.viewToggleText}>{showListView ? '🗺️' : '📋'}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filterButtons.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter.key && styles.filterChipTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map or List */}
      <View style={styles.mapContainer}>
        {showListView ? (
          <FlatList
            data={filteredConcerts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleConcertPress(item)}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemArtist}>{item.artist.name}</Text>
                    {isToday(item.date) && (
                      <View style={styles.todayBadgeSmall}>
                        <Text style={styles.todayTextSmall}>CE SOIR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.listItemVenue}>{item.venue.name}</Text>
                  <Text style={styles.listItemDate}>
                    {formatDate(item.date)} - {item.startTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.listFavoriteButton}
                  onPress={() => handleFavoritePress(item)}
                >
                  <Text style={styles.listFavoriteIcon}>
                    {isFavorite('concert', item.id) ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>Aucun concert pour ce filtre</Text>
              </View>
            }
          />
        ) : (
          <>
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
                    onPress={() => handleMarkerPress(venueConcerts)}
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

            {/* Bouton recentrer */}
            <TouchableOpacity style={styles.centerButton} onPress={centerOnParis}>
              <Text style={styles.centerButtonText}>📍</Text>
            </TouchableOpacity>

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
          </>
        )}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {/* Single concert */}
            {selectedConcert && (
              <View style={styles.concertPreview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewArtist}>{selectedConcert.artist.name}</Text>
                  {isToday(selectedConcert.date) && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayText}>CE SOIR</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={handleVenuePress}>
                  <Text style={styles.previewVenue}>{selectedConcert.venue.name}</Text>
                  <Text style={styles.previewAddress}>{selectedConcert.venue.address}</Text>
                </TouchableOpacity>

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

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleFavoritePress(selectedConcert)}
                  >
                    <Text style={styles.favoriteButtonText}>
                      {isFavorite('concert', selectedConcert.id) ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleConcertPress(selectedConcert)}
                  >
                    <Text style={styles.viewButtonText}>Voir les details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Multiple concerts at venue */}
            {selectedVenueConcerts.length > 0 && (
              <View style={styles.multiConcertPreview}>
                <TouchableOpacity onPress={handleVenuePress}>
                  <Text style={styles.previewVenue}>{selectedVenueConcerts[0].venue.name}</Text>
                  <Text style={styles.previewAddress}>{selectedVenueConcerts[0].venue.address}</Text>
                </TouchableOpacity>

                <Text style={styles.multiConcertCount}>
                  {selectedVenueConcerts.length} concerts a venir
                </Text>

                <ScrollView style={styles.multiConcertList} showsVerticalScrollIndicator={false}>
                  {selectedVenueConcerts.map(concert => (
                    <TouchableOpacity
                      key={concert.id}
                      style={styles.multiConcertItem}
                      onPress={() => handleConcertPress(concert)}
                    >
                      <View style={styles.multiConcertInfo}>
                        <Text style={styles.multiConcertArtist}>{concert.artist.name}</Text>
                        <Text style={styles.multiConcertDate}>
                          {formatDate(concert.date)} - {concert.startTime}
                        </Text>
                      </View>
                      {isToday(concert.date) && (
                        <View style={styles.todayBadgeSmall}>
                          <Text style={styles.todayTextSmall}>CE SOIR</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
  viewToggle: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleActive: {
    backgroundColor: colors.primary,
  },
  viewToggleText: {
    fontSize: 20,
  },
  filtersContainer: {
    marginBottom: spacing.sm,
  },
  filtersContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.textPrimary,
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
  centerButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonText: {
    fontSize: 20,
  },
  // List view styles
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listItemArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  listItemVenue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listItemDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  listFavoriteButton: {
    padding: spacing.sm,
  },
  listFavoriteIcon: {
    fontSize: 20,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyListText: {
    ...typography.body,
    color: colors.textMuted,
  },
  todayBadgeSmall: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  todayTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  favoriteButton: {
    width: 50,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    fontSize: 20,
  },
  viewButton: {
    flex: 1,
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
  // Multi-concert modal
  multiConcertPreview: {
    padding: spacing.sm,
  },
  multiConcertCount: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  multiConcertList: {
    maxHeight: 250,
  },
  multiConcertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  multiConcertInfo: {
    flex: 1,
  },
  multiConcertArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  multiConcertDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
