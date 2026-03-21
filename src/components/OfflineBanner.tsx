// Banniere affichee quand l'app est hors-ligne
// Utilise le hook useNetworkStatus pour detecter la connexion

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useNetworkStatus } from '../hooks';
import { cacheService } from '../services';
import { colors, spacing, typography } from '../constants';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      // Recupere la derniere sync
      cacheService.getTimeSinceLastSync().then(setLastSync);
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [isOffline, slideAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode hors-ligne</Text>
          {lastSync && (
            <Text style={styles.subtitle}>Derniere sync: {lastSync}</Text>
          )}
        </View>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Version compacte pour les listes
export const OfflineIndicator: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View style={styles.indicator}>
      <Text style={styles.indicatorIcon}>📡</Text>
      <Text style={styles.indicatorText}>Hors-ligne</Text>
    </View>
  );
};

// Badge simple pour le header
export const OfflineBadge: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>Offline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning || '#FFA500',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    color: colors.background,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  retryText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  // Indicator styles
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning || '#FFA500'}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  indicatorIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  indicatorText: {
    ...typography.caption,
    color: colors.warning || '#FFA500',
  },
  // Badge styles
  badge: {
    backgroundColor: colors.warning || '#FFA500',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    fontSize: 10,
  },
});

export default OfflineBanner;
