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
import { RootStackParamList } from '../types';
import { notificationService, storageService, NotificationSettings } from '../services';
import { useStore } from '../hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { attendedConcerts, favorites, clearRecentSearches } = useStore();

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    enabled: true,
    newConcerts: true,
    favoriteArtists: true,
    favoriteVenues: true,
    priceDrops: false,
    weeklyDigest: true,
    weeklyDigestDay: 'friday',
    weeklyDigestTime: '18:00',
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

  const stats = {
    favorites: favorites.length,
    attendedConcerts: attendedConcerts.length,
    artists: favorites.filter(f => f.type === 'artist').length,
    venues: favorites.filter(f => f.type === 'venue').length,
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
            </>
          )}
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
