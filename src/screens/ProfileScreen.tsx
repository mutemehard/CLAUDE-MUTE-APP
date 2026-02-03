import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, APP_CONFIG, MUSIC_GENRES } from '../constants';
import { AttendedConcert, RootStackParamList } from '../types';
import { useStore } from '../hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock data pour les concerts vus
const mockAttendedConcerts: AttendedConcert[] = [
  {
    concertId: '1',
    artistName: 'Daft Punk',
    venueName: 'Bercy',
    date: '2007-06-14',
    addedAt: '2024-01-15',
    rating: 5,
  },
  {
    concertId: '2',
    artistName: 'Justice',
    venueName: 'Zenith Paris',
    date: '2023-11-20',
    addedAt: '2023-11-21',
    rating: 5,
  },
  {
    concertId: '3',
    artistName: 'Phoenix',
    venueName: 'Olympia',
    date: '2022-05-10',
    addedAt: '2022-05-11',
    rating: 4,
  },
  {
    concertId: '4',
    artistName: 'Orelsan',
    venueName: 'Accor Arena',
    date: '2023-03-15',
    addedAt: '2023-03-16',
    rating: 5,
  },
  {
    concertId: '5',
    artistName: 'Justice',
    venueName: 'Olympia',
    date: '2018-04-22',
    addedAt: '2024-01-10',
    rating: 5,
  },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    attendedConcerts: storeAttendedConcerts,
    addAttendedConcert,
    removeAttendedConcert,
    updateAttendedConcert,
  } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Techno', 'Electronic', 'Rock']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConcert, setNewConcert] = useState({ artist: '', venue: '', date: '', rating: 0 });

  // Utilise le store ou les mocks si vide
  const attendedConcerts = storeAttendedConcerts.length > 0 ? storeAttendedConcerts : mockAttendedConcerts;

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Calcul des stats
  const getStats = () => {
    const totalConcerts = attendedConcerts.length;

    // Artiste le plus vu
    const artistCounts: Record<string, number> = {};
    attendedConcerts.forEach(c => {
      artistCounts[c.artistName] = (artistCounts[c.artistName] || 0) + 1;
    });
    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

    // Salle la plus visitee
    const venueCounts: Record<string, number> = {};
    attendedConcerts.forEach(c => {
      venueCounts[c.venueName] = (venueCounts[c.venueName] || 0) + 1;
    });
    const topVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0];

    // Premier concert
    const sortedByDate = [...attendedConcerts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstConcert = sortedByDate[0];

    // Annees d'experience
    const yearsActive = firstConcert
      ? new Date().getFullYear() - new Date(firstConcert.date).getFullYear()
      : 0;

    return {
      totalConcerts,
      topArtist: topArtist ? { name: topArtist[0], count: topArtist[1] } : null,
      topVenue: topVenue ? { name: topVenue[0], count: topVenue[1] } : null,
      yearsActive,
      uniqueArtists: Object.keys(artistCounts).length,
    };
  };

  const stats = getStats();

  const handleAddConcert = () => {
    if (!newConcert.artist || !newConcert.venue || !newConcert.date) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }

    const concert: AttendedConcert = {
      concertId: Date.now().toString(),
      artistName: newConcert.artist,
      venueName: newConcert.venue,
      date: newConcert.date,
      addedAt: new Date().toISOString(),
      rating: newConcert.rating > 0 ? newConcert.rating : undefined,
    };

    addAttendedConcert(concert);
    setNewConcert({ artist: '', venue: '', date: '', rating: 0 });
    setShowAddModal(false);
  };

  const handleDeleteConcert = (concertId: string, artistName: string) => {
    Alert.alert(
      'Supprimer',
      `Retirer ${artistName} de ton historique ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeAttendedConcert(concertId),
        },
      ]
    );
  };

  const handleRateConcert = (concertId: string, rating: number) => {
    updateAttendedConcert(concertId, { rating });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Grouper les concerts par annee
  const getConcertsByYear = () => {
    const byYear: Record<string, AttendedConcert[]> = {};
    attendedConcerts.forEach(c => {
      const year = new Date(c.date).getFullYear().toString();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(c);
    });
    return Object.entries(byYear).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logo}>{APP_CONFIG.name}</Text>
              <Text style={styles.subtitle}>Mon profil</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats principales */}
        <View style={styles.statsSection}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatNumber}>{stats.totalConcerts}</Text>
            <Text style={styles.mainStatLabel}>concerts</Text>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatNumber}>{stats.uniqueArtists}</Text>
              <Text style={styles.secondaryStatLabel}>artistes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatNumber}>{stats.yearsActive}</Text>
              <Text style={styles.secondaryStatLabel}>ans</Text>
            </View>
          </View>
        </View>

        {/* Highlights */}
        {stats.topArtist && (
          <View style={styles.highlightsSection}>
            <View style={styles.highlight}>
              <Text style={styles.highlightIcon}>🏆</Text>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Artiste prefere</Text>
                <Text style={styles.highlightValue}>
                  {stats.topArtist.name} ({stats.topArtist.count}x)
                </Text>
              </View>
            </View>

            {stats.topVenue && (
              <View style={styles.highlight}>
                <Text style={styles.highlightIcon}>📍</Text>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightLabel}>Salle favorite</Text>
                  <Text style={styles.highlightValue}>
                    {stats.topVenue.name} ({stats.topVenue.count}x)
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Historique des concerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mon historique</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          {getConcertsByYear().map(([year, concerts]) => (
            <View key={year} style={styles.yearGroup}>
              <Text style={styles.yearLabel}>{year}</Text>
              {concerts.map(concert => (
                <TouchableOpacity
                  key={concert.concertId}
                  style={styles.concertItem}
                  onLongPress={() => handleDeleteConcert(concert.concertId, concert.artistName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.concertInfo}>
                    <Text style={styles.concertArtist}>{concert.artistName}</Text>
                    <Text style={styles.concertDetails}>
                      {concert.venueName} · {formatDate(concert.date)}
                    </Text>
                  </View>
                  <View style={styles.concertRatingContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRateConcert(concert.concertId, star)}
                        hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
                      >
                        <Text style={[
                          styles.concertRatingStar,
                          (concert.rating || 0) >= star && styles.concertRatingStarFilled,
                        ]}>
                          ★
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {attendedConcerts.length === 0 && (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>🎤</Text>
              <Text style={styles.emptyText}>
                Ajoute tes premiers concerts !
              </Text>
            </View>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres preferes</Text>
          <View style={styles.genresContainer}>
            {MUSIC_GENRES.slice(0, 12).map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreChip,
                  selectedGenres.includes(genre) && styles.genreChipSelected,
                ]}
                onPress={() => toggleGenre(genre)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selectedGenres.includes(genre) && styles.genreTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Recevoir des notifications</Text>
              <Text style={styles.settingDescription}>
                Digest hebdomadaire le vendredi
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{APP_CONFIG.name}</Text>
          <Text style={styles.footerSubtext}>{APP_CONFIG.tagline}</Text>
          <Text style={styles.version}>v1.0.0 (MVP)</Text>
        </View>
      </ScrollView>

      {/* Modal pour ajouter un concert */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un concert</Text>
            <Text style={styles.modalSubtitle}>
              Ajoute un concert auquel tu as assiste
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de l'artiste"
              placeholderTextColor={colors.textMuted}
              value={newConcert.artist}
              onChangeText={text => setNewConcert(prev => ({ ...prev, artist: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Nom de la salle"
              placeholderTextColor={colors.textMuted}
              value={newConcert.venue}
              onChangeText={text => setNewConcert(prev => ({ ...prev, venue: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Date (AAAA-MM-JJ)"
              placeholderTextColor={colors.textMuted}
              value={newConcert.date}
              onChangeText={text => setNewConcert(prev => ({ ...prev, date: text }))}
            />

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Note (optionnel)</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewConcert(prev => ({
                      ...prev,
                      rating: prev.rating === star ? 0 : star,
                    }))}
                  >
                    <Text style={[
                      styles.ratingStar,
                      newConcert.rating >= star && styles.ratingStarSelected,
                    ]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddConcert}
              >
                <Text style={styles.modalConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingsButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mainStatNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.primary,
  },
  mainStatLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  secondaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryStatNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  secondaryStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  highlightsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  highlightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  highlightValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  yearGroup: {
    marginBottom: spacing.md,
  },
  yearLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  concertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  concertInfo: {
    flex: 1,
  },
  concertArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  concertDetails: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  concertRatingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  concertRatingStar: {
    fontSize: 14,
    color: colors.surfaceLight,
  },
  concertRatingStarFilled: {
    color: colors.warning,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  genreTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  ratingSection: {
    marginBottom: spacing.md,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingStar: {
    fontSize: 32,
    color: colors.surfaceLight,
  },
  ratingStarSelected: {
    color: colors.warning,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
