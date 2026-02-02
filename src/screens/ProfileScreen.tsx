import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { colors, spacing, typography, borderRadius, APP_CONFIG, MUSIC_GENRES } from '../constants';

export const ProfileScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>(['Rock', 'Electronic', 'Pop']);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Avatar / User info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🎵</Text>
          </View>
          <Text style={styles.userName}>Utilisateur</Text>
          <Text style={styles.userLocation}>{APP_CONFIG.defaultCity}, France</Text>
        </View>

        {/* Preferences musicales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres preferes</Text>
          <Text style={styles.sectionSubtitle}>
            Selectionne tes genres pour des recommandations personnalisees
          </Text>
          <View style={styles.genresContainer}>
            {MUSIC_GENRES.map((genre) => (
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
              <Text style={styles.settingLabel}>Activer les notifications</Text>
              <Text style={styles.settingDescription}>
                Recois des alertes pour les nouveaux concerts
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Concerts a proximite</Text>
              <Text style={styles.settingDescription}>
                Alerte quand un concert est proche de toi
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Artistes suivis</Text>
              <Text style={styles.settingDescription}>
                Alerte pour les nouvelles dates de tes artistes
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* A propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A propos</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={styles.menuLabel}>Version</Text>
            <Text style={styles.menuValue}>1.0.0 (MVP)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔗</Text>
            <Text style={styles.menuLabel}>Sources de donnees</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuLabel}>Conditions d'utilisation</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuLabel}>Politique de confidentialite</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuLabel}>Nous contacter</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ParisGigs</Text>
          <Text style={styles.footerSubtext}>
            Le Shazam du concert live
          </Text>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  userLocation: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surface,
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
    marginBottom: spacing.sm,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  menuValue: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  menuArrow: {
    ...typography.body,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    ...typography.h3,
    color: colors.primary,
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
