import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[MUTE] ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>😵</Text>
            <Text style={styles.title}>Oups, quelque chose s'est mal passe</Text>
            <Text style={styles.message}>
              L'application a rencontre une erreur inattendue.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>Reessayer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Composant pour afficher les erreurs de chargement (non-crash)
export const ErrorView: React.FC<{
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}> = ({ message = 'Une erreur est survenue', onRetry, compact = false }) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactIcon}>⚠️</Text>
        <Text style={styles.compactMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetry}>
            <Text style={styles.compactRetryText}>Reessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>😕</Text>
      <Text style={styles.errorTitle}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Reessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Composant pour l'etat vide
export const EmptyView: React.FC<{
  icon?: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}> = ({ icon = '📭', title, subtitle, action }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Composant pour le chargement
export const LoadingView: React.FC<{
  message?: string;
}> = ({ message = 'Chargement...' }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingSpinner}>🎵</Text>
      <Text style={styles.loadingMessage}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    maxWidth: '100%',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },

  // Error view styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Compact error styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    margin: spacing.md,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  compactMessage: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  compactRetry: {
    paddingHorizontal: spacing.md,
  },
  compactRetryText: {
    ...typography.button,
    color: colors.primary,
  },

  // Empty view styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },

  // Loading view styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingSpinner: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingMessage: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

// Declaration globale pour __DEV__
declare const __DEV__: boolean;
