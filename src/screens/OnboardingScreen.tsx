import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../constants/theme';
import { MUSIC_GENRES, APP_CONFIG } from '../constants';
import { RootStackParamList } from '../types';
import { useStore } from '../hooks/useStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
  backgroundColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bienvenue sur MUTE',
    description: 'Decouvre les meilleurs concerts et soirees a Paris et en Ile-de-France.',
    emoji: '🎵',
    backgroundColor: colors.background,
  },
  {
    id: '2',
    title: 'Ne rate plus rien',
    description: 'Explore les events de ce soir, du week-end ou du mois. Techno, jazz, rock... tout y est.',
    emoji: '🎸',
    backgroundColor: colors.background,
  },
  {
    id: '3',
    title: 'Tes favoris',
    description: 'Suis tes artistes et salles preferees pour etre notifie de leurs prochains concerts.',
    emoji: '❤️',
    backgroundColor: colors.background,
  },
  {
    id: '4',
    title: 'Ton historique',
    description: 'Garde une trace de tous les concerts que tu as vus. Construis ton "highscore" musical.',
    emoji: '🏆',
    backgroundColor: colors.background,
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showGenreSelection, setShowGenreSelection] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const { setOnboardingCompleted, setFilters } = useStore();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowGenreSelection(true);
    }
  };

  const handleSkip = () => {
    setShowGenreSelection(true);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleComplete = () => {
    // Sauvegarder les genres selectionnes dans les filtres
    if (selectedGenres.length > 0) {
      setFilters({ genres: selectedGenres });
    }
    setOnboardingCompleted(true);
    navigation.replace('Main');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { width: dotWidth, opacity },
            ]}
          />
        );
      })}
    </View>
  );

  if (showGenreSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.genreHeader}>
          <Text style={styles.genreTitle}>Tes genres preferes</Text>
          <Text style={styles.genreSubtitle}>
            Selectionne tes genres pour personnaliser tes recommandations
          </Text>
        </View>

        <View style={styles.genreGrid}>
          {MUSIC_GENRES.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreChip,
                selectedGenres.includes(genre) && styles.genreChipSelected,
              ]}
              onPress={() => toggleGenre(genre)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenres.includes(genre) && styles.genreChipTextSelected,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomActions}>
          <Text style={styles.selectedCount}>
            {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selectionne{selectedGenres.length !== 1 ? 's' : ''}
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {selectedGenres.length > 0 ? 'Commencer' : 'Passer'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>{APP_CONFIG.name}</Text>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {renderPagination()}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Continuer' : 'Suivant'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  // Genre selection styles
  genreHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  genreTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  genreSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  genreGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  genreChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  genreChipTextSelected: {
    color: colors.white,
  },
  bottomActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
