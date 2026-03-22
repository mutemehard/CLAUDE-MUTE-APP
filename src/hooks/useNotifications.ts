// Hook pour gerer les notifications avec cleanup automatique
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services';

interface UseNotificationListenersOptions {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

/**
 * Hook qui gere automatiquement le cleanup des listeners de notifications
 */
export const useNotificationListeners = (
  options: UseNotificationListenersOptions
) => {
  const { onNotificationReceived, onNotificationResponse } = options;

  // Refs pour stocker les subscriptions
  const receivedSubscription = useRef<Notifications.Subscription | null>(null);
  const responseSubscription = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Setup listeners
    if (onNotificationReceived) {
      receivedSubscription.current = notificationService.addNotificationReceivedListener(
        onNotificationReceived
      );
    }

    if (onNotificationResponse) {
      responseSubscription.current = notificationService.addNotificationResponseReceivedListener(
        onNotificationResponse
      );
    }

    // Cleanup on unmount
    return () => {
      if (receivedSubscription.current) {
        receivedSubscription.current.remove();
        receivedSubscription.current = null;
      }
      if (responseSubscription.current) {
        responseSubscription.current.remove();
        responseSubscription.current = null;
      }
    };
  }, [onNotificationReceived, onNotificationResponse]);
};

/**
 * Hook simplifie pour gerer la reponse aux notifications (tap)
 */
export const useNotificationTap = (
  onTap: (data: Record<string, unknown>) => void
) => {
  useNotificationListeners({
    onNotificationResponse: (response) => {
      const data = response.notification.request.content.data;
      onTap(data as Record<string, unknown>);
    },
  });
};
