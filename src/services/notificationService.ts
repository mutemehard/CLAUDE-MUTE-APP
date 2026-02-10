// Service de notifications push
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Concert, Artist, Venue } from '../types';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  newConcerts: boolean;
  favoriteArtists: boolean;
  favoriteVenues: boolean;
  priceDrops: boolean;
  weeklyDigest: boolean;
  weeklyDigestDay: 'friday' | 'saturday' | 'sunday';
  weeklyDigestTime: string; // HH:mm format
  friendActivity: boolean; // Notify when friends mark concerts
  concertReminders: boolean; // Remind before concerts you're going to
}

const DEFAULT_SETTINGS: NotificationSettings = {
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
};

export const notificationService = {
  // Demande la permission pour les notifications
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Les notifications ne fonctionnent pas sur simulateur');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission pour les notifications refusee');
      return false;
    }

    // Configuration specifique iOS
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4D4D',
      });
    }

    return true;
  },

  // Recupere le token push
  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // A configurer avec votre project ID Expo
      });
      return token.data;
    } catch (error) {
      console.error('Erreur lors de la recuperation du push token:', error);
      return null;
    }
  },

  // Planifie une notification locale
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    trigger?: Notifications.NotificationTriggerInput;
  }): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data,
        sound: true,
      },
      trigger: options.trigger || null, // null = notification immediate
    });
    return identifier;
  },

  // Annule une notification planifiee
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  },

  // Annule toutes les notifications planifiees
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Notification pour un nouveau concert
  async notifyNewConcert(concert: Concert): Promise<void> {
    await this.scheduleLocalNotification({
      title: `Nouveau concert: ${concert.artist.name}`,
      body: `${concert.venue.name} - ${formatDate(concert.date)}`,
      data: { type: 'concert', concertId: concert.id },
    });
  },

  // Notification pour un concert d'artiste favori
  async notifyFavoriteArtistConcert(artist: Artist, concert: Concert): Promise<void> {
    await this.scheduleLocalNotification({
      title: `${artist.name} en concert !`,
      body: `${concert.venue.name} le ${formatDate(concert.date)}`,
      data: { type: 'artist_concert', artistId: artist.id, concertId: concert.id },
    });
  },

  // Notification pour un concert dans une salle favorite
  async notifyFavoriteVenueConcert(venue: Venue, concert: Concert): Promise<void> {
    await this.scheduleLocalNotification({
      title: `Concert a ${venue.name}`,
      body: `${concert.artist.name} - ${formatDate(concert.date)}`,
      data: { type: 'venue_concert', venueId: venue.id, concertId: concert.id },
    });
  },

  // Notification quand un ami marque un concert
  async notifyFriendActivity(
    friendName: string,
    artistName: string,
    venueName: string,
    date: string,
    status: 'going' | 'interested',
    concertId: string
  ): Promise<void> {
    const statusText = status === 'going' ? 'va a' : 'est interesse par';
    await this.scheduleLocalNotification({
      title: `${friendName} ${statusText} un concert`,
      body: `${artistName} @ ${venueName} - ${formatDate(date)}`,
      data: { type: 'friend_activity', concertId },
    });
  },

  // Notification quand plusieurs amis vont a un concert
  async notifyFriendsGoingToConcert(
    friendNames: string[],
    artistName: string,
    venueName: string,
    date: string,
    concertId: string
  ): Promise<void> {
    const count = friendNames.length;
    const names = count <= 2
      ? friendNames.join(' et ')
      : `${friendNames[0]} et ${count - 1} autres amis`;

    await this.scheduleLocalNotification({
      title: `${names} ${count > 1 ? 'vont' : 'va'} a ${artistName}`,
      body: `${venueName} - ${formatDate(date)}. Tu veux les rejoindre ?`,
      data: { type: 'friends_concert', concertId },
    });
  },

  // Notification de rappel avant un concert
  async scheduleReminderNotification(concert: Concert, daysBefore: number = 1): Promise<string> {
    const concertDate = new Date(concert.date);
    const reminderDate = new Date(concertDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(18, 0, 0, 0); // 18h la veille

    if (reminderDate <= new Date()) {
      // La date de rappel est deja passee
      return '';
    }

    return this.scheduleLocalNotification({
      title: daysBefore === 1 ? 'Concert demain !' : `Concert dans ${daysBefore} jours`,
      body: `${concert.artist.name} @ ${concert.venue.name} - ${concert.startTime}`,
      data: { type: 'reminder', concertId: concert.id },
      trigger: { date: reminderDate },
    });
  },

  // Planifie le digest hebdomadaire du vendredi
  async scheduleWeeklyDigest(settings: NotificationSettings): Promise<void> {
    // Annule l'ancien digest
    await this.cancelAllNotifications();

    if (!settings.enabled || !settings.weeklyDigest) {
      return;
    }

    // Calcule le prochain jour du digest
    const dayMap: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
    };

    const targetDay = dayMap[settings.weeklyDigestDay];
    const [hours, minutes] = settings.weeklyDigestTime.split(':').map(Number);

    // Planifie la notification hebdomadaire
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Les concerts de la semaine',
        body: 'Decouvre les meilleurs concerts a venir a Paris !',
        data: { type: 'weekly_digest' },
        sound: true,
      },
      trigger: {
        weekday: targetDay + 1, // Expo utilise 1-7 (dimanche=1)
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  },

  // Ecouteur de notifications recues
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Ecouteur de notifications touchees
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};

// Utilitaire de formatage de date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export default notificationService;
