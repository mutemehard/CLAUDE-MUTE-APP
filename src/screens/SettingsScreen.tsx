import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, ProfileVisibility, VisibilityLevel } from '../types';
import { notificationService, storageService, NotificationSettings } from '../services';
import { useStore } from '../hooks';
import { haptics } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Labels pour les niveaux de visibilité
const visibilityLabels: Record<VisibilityLevel, { label: string; icon: string }> = {
  public: { label: 'Public', icon: '🌐' },
  friends: { label: 'Amis', icon: '👥' },
  private: { label: 'Prive', icon: '🔒' },
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    attendedConcerts,
    favorites,
    clearRecentSearches,
    profileVisibility,
    setProfileVisibility,
    followedArtists,
    friendships,
  } = useStore();

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    enabled: true,
    newConcerts: true,
    favoriteArtists: true,
    favoriteVenues: true,
    priceDrops: false,
    weeklyDigest: true,
    weeklyDigestDay: 'friday',
    weeklyDigestTime: '18:00',
    friendActivity: true,
    concertReminders: true,
    hotConcerts: true,
    hotConcertThreshold: 3,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await storageService.getNotificationSettings();
    setNotifSettings(settings);
  };

  const updateNotifSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    await storageService.saveNotificationSettings(updated);

    // Replanifier le digest si necessaire
    if (key === 'weeklyDigest' || key === 'weeklyDigestDay' || key === 'weeklyDigestTime') {
      await notificationService.scheduleWeeklyDigest(updated);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      updateNotifSetting('enabled', true);
    } else {
      Alert.alert(
        'Notifications desactivees',
        'Activez les notifications dans les reglages de votre telephone pour recevoir des alertes.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir Reglages', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Effacer l\'historique',
      'Etes-vous sur de vouloir effacer toutes vos recherches recentes ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => clearRecentSearches(),
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Supprimer toutes les donnees',
      'Cette action est irreversible. Tous vos favoris, historique et preferences seront supprimes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAll();
            Alert.alert('Donnees supprimees', 'L\'application sera reinitialise au prochain lancement.');
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    const data = await storageService.exportData();
    Alert.alert(
      'Export des donnees',
      `Donnees exportees:\n- ${favorites.length} favoris\n- ${attendedConcerts.length} concerts vus`,
      [{ text: 'OK' }]
    );
    console.log('Exported data:', data);
  };

  // Fonction pour cycler les niveaux de visibilite
  const cycleVisibility = (key: keyof ProfileVisibility) => {
    const levels: VisibilityLevel[] = ['public', 'friends', 'private'];
    const currentIndex = levels.indexOf(profileVisibility[key]);
    const nextIndex = (currentIndex + 1) % levels.length;
    haptics.selection();
    setProfileVisibility({ [key]: levels[nextIndex] });
  };

  const stats = {
    favorites: favorites.length,
    attendedConcerts: attendedConcerts.length,
    artists: favorites.filter(f => f.type === 'artist').length,
    venues: favorites.filter(f => f.type === 'venue').length,
    followedArtists: followedArtists.length,
    friends: friendships.length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reglages</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.attendedConcerts}</Text>
            <Text style={styles.statLabel}>Concerts vus</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.artists}</Text>
            <Text style={styles.statLabel}>Artistes</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications push</Text>
              <Text style={styles.settingDescription}>
                Recevoir des alertes sur votre telephone
              </Text>
            </View>
            <Switch
              value={notifSettings.enabled}
              onValueChange={(value) => {
                if (value) {
                  handleEnableNotifications();
                } else {
                  updateNotifSetting('enabled', false);
                }
              }}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          {notifSettings.enabled && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Nouveaux concerts</Text>
                  <Text style={styles.settingDescription}>
                    Alerte quand un nouveau concert est ajoute
                  </Text>
                </View>
                <Switch
                  value={notifSettings.newConcerts}
                  onValueChange={(value) => updateNotifSetting('newConcerts', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Artistes favoris</Text>
                  <Text style={styles.settingDescription}>
                    Alerte quand un artiste suivi annonce un concert
                  </Text>
                </View>
                <Switch
                  value={notifSettings.favoriteArtists}
                  onValueChange={(value) => updateNotifSetting('favoriteArtists', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Salles favorites</Text>
                  <Text style={styles.settingDescription}>
                    Alerte quand une salle suivie programme un concert
                  </Text>
                </View>
                <Switch
                  value={notifSettings.favoriteVenues}
                  onValueChange={(value) => updateNotifSetting('favoriteVenues', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Digest hebdomadaire</Text>
                  <Text style={styles.settingDescription}>
                    Resume des concerts de la semaine le vendredi
                  </Text>
                </View>
                <Switch
                  value={notifSettings.weeklyDigest}
                  onValueChange={(value) => updateNotifSetting('weeklyDigest', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Activite des amis</Text>
                  <Text style={styles.settingDescription}>
                    Alerte quand un ami marque un concert
                  </Text>
                </View>
                <Switch
                  value={notifSettings.friendActivity}
                  onValueChange={(value) => updateNotifSetting('friendActivity', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Rappels de concerts</Text>
                  <Text style={styles.settingDescription}>
                    Rappel la veille des concerts ou tu vas
                  </Text>
                </View>
                <Switch
                  value={notifSettings.concertReminders}
                  onValueChange={(value) => updateNotifSetting('concertReminders', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>🔥 Concerts socialement chauds</Text>
                  <Text style={styles.settingDescription}>
                    Alerte quand {notifSettings.hotConcertThreshold || 3}+ amis vont au meme concert
                  </Text>
                </View>
                <Switch
                  value={notifSettings.hotConcerts}
                  onValueChange={(value) => updateNotifSetting('hotConcerts', value)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </>
          )}
        </View>

        {/* Visibilite du profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilite du profil</Text>
          <Text style={styles.sectionSubtitle}>
            Controle qui peut voir tes informations (comme BeReal)
          </Text>

          <TouchableOpacity
            style={styles.visibilityItem}
            onPress={() => cycleVisibility('score')}
          >
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityIcon}>🏆</Text>
              <View style={styles.visibilityText}>
                <Text style={styles.settingLabel}>Score total</Text>
                <Text style={styles.settingDescription}>
                  Ton nombre de concerts vus
                </Text>
              </View>
            </View>
            <View style={[
              styles.visibilityBadge,
              profileVisibility.score === 'public' && styles.visibilityBadgePublic,
              profileVisibility.score === 'friends' && styles.visibilityBadgeFriends,
              profileVisibility.score === 'private' && styles.visibilityBadgePrivate,
            ]}>
              <Text style={styles.visibilityBadgeIcon}>
                {visibilityLabels[profileVisibility.score].icon}
              </Text>
              <Text style={styles.visibilityBadgeText}>
                {visibilityLabels[profileVisibility.score].label}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.visibilityItem}
            onPress={() => cycleVisibility('history')}
          >
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityIcon}>📅</Text>
              <View style={styles.visibilityText}>
                <Text style={styles.settingLabel}>Historique des concerts</Text>
                <Text style={styles.settingDescription}>
                  La liste des concerts que tu as vus
                </Text>
              </View>
            </View>
            <View style={[
              styles.visibilityBadge,
              profileVisibility.history === 'public' && styles.visibilityBadgePublic,
              profileVisibility.history === 'friends' && styles.visibilityBadgeFriends,
              profileVisibility.history === 'private' && styles.visibilityBadgePrivate,
            ]}>
              <Text style={styles.visibilityBadgeIcon}>
                {visibilityLabels[profileVisibility.history].icon}
              </Text>
              <Text style={styles.visibilityBadgeText}>
                {visibilityLabels[profileVisibility.history].label}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.visibilityItem}
            onPress={() => cycleVisibility('activity')}
          >
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityIcon}>✓</Text>
              <View style={styles.visibilityText}>
                <Text style={styles.settingLabel}>Activite (Going/Interesse)</Text>
                <Text style={styles.settingDescription}>
                  Tes participations aux concerts a venir
                </Text>
              </View>
            </View>
            <View style={[
              styles.visibilityBadge,
              profileVisibility.activity === 'public' && styles.visibilityBadgePublic,
              profileVisibility.activity === 'friends' && styles.visibilityBadgeFriends,
              profileVisibility.activity === 'private' && styles.visibilityBadgePrivate,
            ]}>
              <Text style={styles.visibilityBadgeIcon}>
                {visibilityLabels[profileVisibility.activity].icon}
              </Text>
              <Text style={styles.visibilityBadgeText}>
                {visibilityLabels[profileVisibility.activity].label}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.visibilityItem}
            onPress={() => cycleVisibility('followedArtists')}
          >
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityIcon}>🎤</Text>
              <View style={styles.visibilityText}>
                <Text style={styles.settingLabel}>Artistes suivis</Text>
                <Text style={styles.settingDescription}>
                  Les artistes que tu suis ({stats.followedArtists})
                </Text>
              </View>
            </View>
            <View style={[
              styles.visibilityBadge,
              profileVisibility.followedArtists === 'public' && styles.visibilityBadgePublic,
              profileVisibility.followedArtists === 'friends' && styles.visibilityBadgeFriends,
              profileVisibility.followedArtists === 'private' && styles.visibilityBadgePrivate,
            ]}>
              <Text style={styles.visibilityBadgeIcon}>
                {visibilityLabels[profileVisibility.followedArtists].icon}
              </Text>
              <Text style={styles.visibilityBadgeText}>
                {visibilityLabels[profileVisibility.followedArtists].label}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Donnees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donnees</Text>

          <TouchableOpacity style={styles.actionItem} onPress={handleClearHistory}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Effacer l'historique de recherche</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
            <Text style={styles.actionIcon}>📤</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Exporter mes donnees</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, styles.dangerItem]} onPress={handleClearAllData}>
            <Text style={styles.actionIcon}>⚠️</Text>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionLabel, styles.dangerLabel]}>Supprimer toutes les donnees</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* A propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A propos</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{APP_CONFIG.version}</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Zone de couverture</Text>
            <Text style={styles.aboutValue}>Paris & Ile-de-France</Text>
          </View>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>📝</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Conditions d'utilisation</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>🔒</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Politique de confidentialite</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>📧</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Nous contacter</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MUTE</Text>
          <Text style={styles.footerSubtext}>Les concerts de Paris, enfin reunis.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
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
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  // Visibility items
  visibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  visibilityIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  visibilityText: {
    flex: 1,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    minWidth: 90,
    justifyContent: 'center',
  },
  visibilityBadgePublic: {
    backgroundColor: colors.success,
  },
  visibilityBadgeFriends: {
    backgroundColor: colors.primary,
  },
  visibilityBadgePrivate: {
    backgroundColor: colors.surfaceLight,
  },
  visibilityBadgeIcon: {
    fontSize: 12,
  },
  visibilityBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  dangerLabel: {
    color: colors.primary,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  aboutLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  aboutValue: {
    ...typography.body,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
