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

// Invite un ami a un concert
export const inviteFriendToConcert = async (
  concert: Concert,
  friendName?: string
): Promise<ShareResult> => {
  try {
    const dateFormatted = formatDateFr(concert.date);
    const greeting = friendName ? `Hey ${friendName} !` : 'Hey !';

    const message = [
      greeting,
      ``,
      `Ca te dit d'aller voir ${concert.artist.name} ?`,
      ``,
      `${concert.venue.name}`,
      `${dateFormatted} a ${concert.startTime}`,
      ``,
      formatPrice(concert),
      ``,
      concert.ticketUrl ? `Billets: ${concert.ticketUrl}` : '',
      ``,
      `Dis-moi si tu es chaud(e) !`,
      ``,
      `Envoye via MUTE - L'app des concerts a Paris`,
    ].filter(Boolean).join('\n');

    const result = await Share.share(
      {
        message,
        title: `Invitation concert: ${concert.artist.name}`,
        ...(Platform.OS === 'ios' && concert.ticketUrl ? { url: concert.ticketUrl } : {}),
      },
      {
        subject: `On va voir ${concert.artist.name} ?`,
        dialogTitle: 'Inviter un ami',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Invite friend error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur d\'invitation',
    };
  }
};

// Partage ses concerts a venir avec ses amis
export const shareUpcomingConcerts = async (
  concerts: { artistName: string; venueName: string; date: string }[]
): Promise<ShareResult> => {
  if (concerts.length === 0) {
    return { success: false, error: 'Aucun concert prevu' };
  }

  try {
    const lines = [
      `Mes prochains concerts (${concerts.length})`,
      ``,
    ];

    concerts.forEach((concert, index) => {
      const date = new Date(concert.date);
      const dateFormatted = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
      lines.push(`${dateFormatted} - ${concert.artistName} @ ${concert.venueName}`);
    });

    lines.push(``);
    lines.push(`Tu viens avec moi a un de ces concerts ?`);
    lines.push(``);
    lines.push(`Partage via MUTE`);

    const message = lines.join('\n');

    const result = await Share.share(
      {
        message,
        title: 'Mes prochains concerts',
      },
      {
        subject: 'Mes prochains concerts',
        dialogTitle: 'Partager mes concerts',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};

// Genere un message pour inviter a telecharger l'app
export const shareApp = async (): Promise<ShareResult> => {
  try {
    const message = [
      `Decouvre MUTE !`,
      ``,
      `L'app pour trouver tous les concerts a Paris et en Ile-de-France.`,
      ``,
      `- Concerts ce soir, ce week-end, ce mois`,
      `- Artistes et salles a suivre`,
      `- Vois ou vont tes amis`,
      ``,
      `Rejoins-moi sur MUTE !`,
      ``,
      // TODO: Add actual app store links
      `Telecharge l'app: https://mute.app`,
    ].join('\n');

    const result = await Share.share(
      {
        message,
        title: 'MUTE - Concerts a Paris',
      },
      {
        subject: 'Decouvre MUTE !',
        dialogTitle: 'Partager MUTE',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};
