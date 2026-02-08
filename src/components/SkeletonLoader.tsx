import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Composant skeleton simple avec animation
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton pour une carte de concert
export const ConcertCardSkeleton: React.FC = () => (
  <View style={styles.concertCard}>
    <Skeleton width={80} height={80} borderRadius={borderRadius.lg} />
    <View style={styles.concertCardContent}>
      <Skeleton width="70%" height={18} />
      <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.concertCardFooter}>
        <Skeleton width={60} height={12} />
        <Skeleton width={40} height={12} />
      </View>
    </View>
  </View>
);

// Skeleton pour une liste de concerts
export const ConcertListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }).map((_, index) => (
      <ConcertCardSkeleton key={index} />
    ))}
  </View>
);

// Skeleton pour un artiste horizontal
export const ArtistSkeleton: React.FC = () => (
  <View style={styles.artistCard}>
    <Skeleton width={80} height={80} borderRadius={40} />
    <Skeleton width={70} height={14} style={{ marginTop: 8 }} />
    <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
  </View>
);

// Skeleton pour la liste horizontale d'artistes
export const ArtistListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={styles.horizontalList}>
    {Array.from({ length: count }).map((_, index) => (
      <ArtistSkeleton key={index} />
    ))}
  </View>
);

// Skeleton pour une salle
export const VenueSkeleton: React.FC = () => (
  <View style={styles.venueCard}>
    <Skeleton width={48} height={48} borderRadius={borderRadius.md} />
    <Skeleton width={90} height={14} style={{ marginTop: 8 }} />
    <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
  </View>
);

// Skeleton pour le featured concert
export const FeaturedConcertSkeleton: React.FC = () => (
  <View style={styles.featuredCard}>
    <View style={styles.featuredBadge}>
      <Skeleton width={60} height={16} borderRadius={borderRadius.sm} />
    </View>
    <View style={styles.featuredContent}>
      <Skeleton width="60%" height={28} />
      <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
      <View style={styles.featuredFooter}>
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  </View>
);

// Skeleton pour le detail d'un artiste
export const ArtistDetailSkeleton: React.FC = () => (
  <View style={styles.detailContainer}>
    <Skeleton width="100%" height={300} borderRadius={0} />
    <View style={styles.detailContent}>
      <Skeleton width="70%" height={32} />
      <View style={styles.genresRow}>
        <Skeleton width={60} height={24} borderRadius={borderRadius.full} />
        <Skeleton width={80} height={24} borderRadius={borderRadius.full} />
        <Skeleton width={50} height={24} borderRadius={borderRadius.full} />
      </View>
      <Skeleton width="100%" height={80} style={{ marginTop: spacing.md }} />
      <Skeleton width="100%" height={120} style={{ marginTop: spacing.md }} />
    </View>
  </View>
);

// Skeleton pour le detail d'une salle
export const VenueDetailSkeleton: React.FC = () => (
  <View style={styles.detailContainer}>
    <Skeleton width="100%" height={220} borderRadius={0} />
    <View style={styles.detailContent}>
      <Skeleton width="80%" height={32} />
      <Skeleton width={60} height={24} borderRadius={borderRadius.full} style={{ marginTop: spacing.sm }} />
      <Skeleton width="100%" height={60} style={{ marginTop: spacing.lg }} />
      <Skeleton width="100%" height={60} style={{ marginTop: spacing.sm }} />
      <Skeleton width="100%" height={80} style={{ marginTop: spacing.lg }} />
    </View>
  </View>
);

// Skeleton pour le HomeScreen complet
export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.homeContainer}>
    <FeaturedConcertSkeleton />
    <View style={styles.section}>
      <Skeleton width={150} height={20} style={{ marginBottom: spacing.sm }} />
      <ArtistListSkeleton count={4} />
    </View>
    <View style={styles.section}>
      <Skeleton width={120} height={20} style={{ marginBottom: spacing.sm }} />
      <ConcertListSkeleton count={3} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceLight,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  concertCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  concertCardContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  concertCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  artistCard: {
    width: 100,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  venueCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  featuredCard: {
    marginHorizontal: spacing.md,
    height: 180,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
  },
  featuredContent: {
    marginTop: 'auto',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.md,
  },
  genresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  homeContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
