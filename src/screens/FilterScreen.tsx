import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../hooks';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  APP_CONFIG,
  MUSIC_GENRES,
  PARIS_ARRONDISSEMENTS,
  DATE_PRESETS,
  SORT_OPTIONS,
  PRICE_RANGES,
} from '../constants';
import { RootStackParamList, ConcertFilters } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FilterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { filters, setFilters, resetFilters } = useStore();

  // Local state for filters (apply on confirm)
  const [localFilters, setLocalFilters] = useState<ConcertFilters>({
    ...filters,
  });

  // Date preset selection
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('week');

  // Helper to get date range from preset
  const getDateRangeFromPreset = (preset: string): { start: string; end: string } | undefined => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        return { start: formatDate(today), end: formatDate(today) };
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return { start: formatDate(tomorrow), end: formatDate(tomorrow) };
      case 'weekend':
        const dayOfWeek = today.getDay();
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 0;
        const friday = new Date(today);
        friday.setDate(today.getDate() + daysUntilFriday);
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);
        return { start: formatDate(friday), end: formatDate(sunday) };
      case 'week':
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return { start: formatDate(today), end: formatDate(weekEnd) };
      case 'month':
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);
        return { start: formatDate(today), end: formatDate(monthEnd) };
      default:
        return undefined;
    }
  };

  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    const currentGenres = localFilters.genres || [];
    const updatedGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    setLocalFilters(prev => ({
      ...prev,
      genres: updatedGenres.length > 0 ? updatedGenres : undefined,
    }));
  };

  // Toggle arrondissement selection
  const toggleArrondissement = (arr: string) => {
    const current = localFilters.arrondissements || [];
    const updated = current.includes(arr)
      ? current.filter(a => a !== arr)
      : [...current, arr];
    setLocalFilters(prev => ({
      ...prev,
      arrondissements: updated.length > 0 ? updated : undefined,
    }));
  };

  // Set price range
  const setPriceRange = (min: number, max: number) => {
    if (min === 0 && max === 999) {
      setLocalFilters(prev => ({ ...prev, priceRange: undefined }));
    } else {
      setLocalFilters(prev => ({ ...prev, priceRange: { min, max } }));
    }
  };

  // Set sort option
  const setSortBy = (sortBy: 'date' | 'popularity' | 'price' | 'distance') => {
    setLocalFilters(prev => ({ ...prev, sortBy }));
  };

  // Apply filters
  const handleApply = () => {
    const dateRange = getDateRangeFromPreset(selectedDatePreset);
    setFilters({ ...localFilters, dateRange });
    navigation.goBack();
  };

  // Reset all filters
  const handleReset = () => {
    setLocalFilters({});
    setSelectedDatePreset('week');
    resetFilters();
  };

  // Count active filters
  const countActiveFilters = (): number => {
    let count = 0;
    if (localFilters.genres && localFilters.genres.length > 0) count++;
    if (localFilters.arrondissements && localFilters.arrondissements.length > 0) count++;
    if (localFilters.priceRange) count++;
    if (selectedDatePreset !== 'week') count++;
    if (localFilters.showSoldOut === false) count++;
    return count;
  };

  const activeCount = countActiveFilters();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Filtres</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quand ?</Text>
          <View style={styles.chipsContainer}>
            {DATE_PRESETS.filter(p => p.value !== 'custom').map(preset => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.chip,
                  selectedDatePreset === preset.value && styles.chipActive,
                ]}
                onPress={() => setSelectedDatePreset(preset.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDatePreset === preset.value && styles.chipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Genre Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genre musical</Text>
          <View style={styles.chipsContainer}>
            {MUSIC_GENRES.map(genre => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.chip,
                  localFilters.genres?.includes(genre) && styles.chipActive,
                ]}
                onPress={() => toggleGenre(genre)}
              >
                <Text
                  style={[
                    styles.chipText,
                    localFilters.genres?.includes(genre) && styles.chipTextActive,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[
                styles.chip,
                !localFilters.priceRange && styles.chipActive,
              ]}
              onPress={() => setPriceRange(0, 999)}
            >
              <Text
                style={[
                  styles.chipText,
                  !localFilters.priceRange && styles.chipTextActive,
                ]}
              >
                Tous les prix
              </Text>
            </TouchableOpacity>
            {PRICE_RANGES.map(range => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.chip,
                  localFilters.priceRange?.min === range.min &&
                    localFilters.priceRange?.max === range.max &&
                    styles.chipActive,
                ]}
                onPress={() => setPriceRange(range.min, range.max)}
              >
                <Text
                  style={[
                    styles.chipText,
                    localFilters.priceRange?.min === range.min &&
                      localFilters.priceRange?.max === range.max &&
                      styles.chipTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Arrondissement Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ou a Paris ?</Text>
          <Text style={styles.sectionSubtitle}>
            {localFilters.arrondissements?.length
              ? `${localFilters.arrondissements.length} arrondissement(s) selectionne(s)`
              : 'Tous les arrondissements'}
          </Text>
          <View style={styles.chipsContainerSmall}>
            {PARIS_ARRONDISSEMENTS.map(arr => (
              <TouchableOpacity
                key={arr}
                style={[
                  styles.chipSmall,
                  localFilters.arrondissements?.includes(arr) && styles.chipActive,
                ]}
                onPress={() => toggleArrondissement(arr)}
              >
                <Text
                  style={[
                    styles.chipTextSmall,
                    localFilters.arrondissements?.includes(arr) && styles.chipTextActive,
                  ]}
                >
                  {arr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sort Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trier par</Text>
          <View style={styles.sortOptions}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  localFilters.sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => setSortBy(option.value as any)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    localFilters.sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Show Sold Out Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Afficher les complets</Text>
              <Text style={styles.toggleDescription}>
                Inclure les evenements sold out
              </Text>
            </View>
            <Switch
              value={localFilters.showSoldOut !== false}
              onValueChange={(value) =>
                setLocalFilters(prev => ({ ...prev, showSoldOut: value }))
              }
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>
            Appliquer{activeCount > 0 ? ` (${activeCount})` : ''}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  resetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resetButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipsContainerSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSmall: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSmall: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  sortOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sortOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
});
