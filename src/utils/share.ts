// Utilitaires de partage pour les concerts
import { Share, Platform } from 'react-native';
import { Concert } from '../types';
import { generateConcertLink } from '../config';

// Formate la date en francais
const formatDateFr = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString('fr-FR', options);
};

// Formate le prix
const formatPrice = (concert: Concert): string => {
  if (!concert.price) return 'Prix non communique';
  if (concert.price.min === 0 && concert.price.max === 0) return 'Gratuit';
  if (concert.price.min === concert.price.max) {
    return `${concert.price.min}${concert.price.currency}`;
  }
  return `${concert.price.min} - ${concert.price.max}${concert.price.currency}`;
};

// Interface pour le resultat du partage
export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed';
  error?: string;
}

// Genere le texte de partage pour un concert
export const generateConcertShareText = (concert: Concert): string => {
  const lines = [
    `${concert.artist.name}`,
    ``,
    `${concert.venue.name}`,
    `${formatDateFr(concert.date)} a ${concert.startTime}`,
    ``,
    formatPrice(concert),
  ];

  // Ajoute l'adresse si disponible
  if (concert.venue.address) {
    lines.push(`${concert.venue.address}, ${concert.venue.city}`);
  }

  // Ajoute le lien de billetterie
  if (concert.ticketUrl) {
    lines.push(``);
    lines.push(`Billets: ${concert.ticketUrl}`);
  }

  lines.push(``);
  lines.push(`Partage via MUTE - L'app des concerts a Paris`);

  return lines.join('\n');
};

// Genere le texte court pour SMS/Twitter
export const generateConcertShareTextShort = (concert: Concert): string => {
  const dateFormatted = formatDateFr(concert.date).split(' ').slice(1, 4).join(' ');
  return `${concert.artist.name} @ ${concert.venue.name} - ${dateFormatted} ${concert.startTime} | MUTE`;
};

// Partage un concert
export const shareConcert = async (concert: Concert): Promise<ShareResult> => {
  try {
    const message = generateConcertShareText(concert);
    const title = `${concert.artist.name} - ${concert.venue.name}`;

    const result = await Share.share(
      {
        message,
        title,
        ...(Platform.OS === 'ios' && concert.ticketUrl ? { url: concert.ticketUrl } : {}),
      },
      {
        subject: title, // Email subject
        dialogTitle: `Partager ce concert`, // Android dialog title
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Share error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};

// Partage multiple concerts (pour partager ses favoris par exemple)
export const shareConcerts = async (concerts: Concert[]): Promise<ShareResult> => {
  if (concerts.length === 0) {
    return { success: false, error: 'Aucun concert a partager' };
  }

  if (concerts.length === 1) {
    return shareConcert(concerts[0]);
  }

  try {
    const lines = [
      `Mes concerts a venir (${concerts.length})`,
      ``,
    ];

    concerts.forEach((concert, index) => {
      const dateFormatted = formatDateFr(concert.date).split(' ').slice(1, 4).join(' ');
      lines.push(`${index + 1}. ${concert.artist.name}`);
      lines.push(`   ${concert.venue.name} - ${dateFormatted}`);
      lines.push(``);
    });

    lines.push(`Partage via MUTE - L'app des concerts a Paris`);

    const message = lines.join('\n');

    const result = await Share.share(
      {
        message,
        title: `Mes ${concerts.length} concerts a venir`,
      },
      {
        subject: `Mes concerts a venir`,
        dialogTitle: 'Partager mes concerts',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Share multiple error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};

// Copie un lien dans le presse-papier (pour les tickets)
export const copyTicketLink = async (concert: Concert): Promise<boolean> => {
  if (!concert.ticketUrl) return false;

  try {
    // Note: Pour une implementation complete, utiliser @react-native-clipboard/clipboard
    // Pour l'instant on utilise le partage natif
    await Share.share({
      message: concert.ticketUrl,
      title: 'Lien billetterie',
    });
    return true;
  } catch {
    return false;
  }
};

// Genere un deeplink vers le concert (pour partage in-app)
export const generateConcertDeepLink = (concertId: string): string => {
  return generateConcertLink(concertId);
};
