// Utilitaires de partage pour les salles
import { Share, Platform } from 'react-native';
import { Venue } from '../types';
import { generateVenueLink } from '../config';

export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed';
  error?: string;
}

// Genere le texte de partage pour une salle
export const generateVenueShareText = (venue: Venue): string => {
  const lines = [
    `${venue.name}`,
    ``,
    `${venue.address}`,
    `${venue.postalCode} ${venue.city}`,
  ];

  if (venue.arrondissement) {
    lines.push(`${venue.arrondissement} arrondissement`);
  }

  if (venue.capacity) {
    lines.push(`Capacite: ${venue.capacity.toLocaleString('fr-FR')} places`);
  }

  if (venue.website) {
    lines.push(``);
    lines.push(`Site: ${venue.website}`);
  }

  lines.push(``);
  lines.push(`Decouvre cette salle sur MUTE - L'app des concerts a Paris`);

  return lines.join('\n');
};

// Partage une salle
export const shareVenue = async (venue: Venue): Promise<ShareResult> => {
  try {
    const message = generateVenueShareText(venue);
    const title = venue.name;

    // Lien Google Maps
    const mapsUrl = `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`;

    const result = await Share.share(
      {
        message: message + `\n\nLocalisation: ${mapsUrl}`,
        title,
        ...(Platform.OS === 'ios' ? { url: mapsUrl } : {}),
      },
      {
        subject: `Salle: ${venue.name}`,
        dialogTitle: `Partager cette salle`,
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Share venue error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};

// Genere un deeplink vers la salle
export const generateVenueDeepLink = (venueId: string): string => {
  return generateVenueLink(venueId);
};
