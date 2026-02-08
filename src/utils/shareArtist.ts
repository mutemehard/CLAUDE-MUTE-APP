// Utilitaires de partage pour les artistes
import { Share, Platform } from 'react-native';
import { Artist } from '../types';

export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed';
  error?: string;
}

// Genere le texte de partage pour un artiste
export const generateArtistShareText = (artist: Artist): string => {
  const lines = [
    `${artist.name}`,
    ``,
    artist.genres.slice(0, 3).join(' · '),
    ``,
  ];

  if (artist.description) {
    lines.push(artist.description.slice(0, 150) + (artist.description.length > 150 ? '...' : ''));
    lines.push(``);
  }

  if (artist.spotifyUrl) {
    lines.push(`Spotify: ${artist.spotifyUrl}`);
  }

  if (artist.appleMusicUrl) {
    lines.push(`Apple Music: ${artist.appleMusicUrl}`);
  }

  lines.push(``);
  lines.push(`Decouvre cet artiste sur MUTE - L'app des concerts a Paris`);

  return lines.join('\n');
};

// Partage un artiste
export const shareArtist = async (artist: Artist): Promise<ShareResult> => {
  try {
    const message = generateArtistShareText(artist);
    const title = artist.name;

    const result = await Share.share(
      {
        message,
        title,
        ...(Platform.OS === 'ios' && artist.spotifyUrl ? { url: artist.spotifyUrl } : {}),
      },
      {
        subject: `Artiste: ${artist.name}`,
        dialogTitle: `Partager cet artiste`,
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: true, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Share artist error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de partage',
    };
  }
};
