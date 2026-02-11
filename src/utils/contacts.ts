// Utilitaires pour l'import de contacts et QR code
import { Alert, Share, Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import { Friend } from '../types';

// Interface pour un contact importe
export interface ImportedContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
}

// Demande la permission d'acces aux contacts
export const requestContactsPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erreur permission contacts:', error);
    return false;
  }
};

// Recupere les contacts du telephone
export const getContacts = async (): Promise<ImportedContact[]> => {
  try {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission requise',
        'Pour importer tes contacts, autorise MUTE a acceder a ton repertoire.'
      );
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
    });

    // Filtrer et formater les contacts
    return data
      .filter((contact: Contacts.Contact) => contact.name)
      .map((contact: Contacts.Contact) => ({
        id: contact.id || `contact_${Date.now()}_${Math.random()}`,
        name: contact.name || 'Sans nom',
        phoneNumber: contact.phoneNumbers?.[0]?.number,
        email: contact.emails?.[0]?.email,
      }))
      .sort((a: ImportedContact, b: ImportedContact) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Erreur recuperation contacts:', error);
    return [];
  }
};

// Recherche dans les contacts
export const searchContacts = async (query: string): Promise<ImportedContact[]> => {
  const contacts = await getContacts();
  const lowerQuery = query.toLowerCase();
  return contacts.filter(
    c => c.name.toLowerCase().includes(lowerQuery) ||
      c.phoneNumber?.includes(query) ||
      c.email?.toLowerCase().includes(lowerQuery)
  );
};

// Genere un ID unique pour l'utilisateur (pour le QR code)
export const generateUserQRId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `MUTE_${timestamp}_${random}`.toUpperCase();
};

// Genere les donnees du QR code pour ajouter un ami
export interface QRCodeData {
  type: 'mute_friend';
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

export const generateFriendQRData = (userName: string, userId: string, userAvatar?: string): string => {
  const data: QRCodeData = {
    type: 'mute_friend',
    userId,
    userName,
    userAvatar,
    timestamp: Date.now(),
  };
  return JSON.stringify(data);
};

// Parse les donnees d'un QR code scanne
export const parseFriendQRData = (rawData: string): QRCodeData | null => {
  try {
    const data = JSON.parse(rawData);
    if (data.type === 'mute_friend' && data.userId && data.userName) {
      return data as QRCodeData;
    }
    return null;
  } catch {
    return null;
  }
};

// Valide si les donnees QR sont encore valides (24h)
export const isQRDataValid = (data: QRCodeData, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
  const age = Date.now() - data.timestamp;
  return age < maxAgeMs;
};

// Partage le lien d'invitation
export const shareInviteLink = async (userName: string): Promise<boolean> => {
  try {
    const message = [
      `Hey ! Rejoins-moi sur MUTE !`,
      ``,
      `L'app pour decouvrir les concerts a Paris et voir ou vont tes amis.`,
      ``,
      `Ajoute-moi: ${userName}`,
      ``,
      `Telecharge MUTE: https://mute.app`,
    ].join('\n');

    const result = await Share.share({
      message,
      title: 'Rejoins-moi sur MUTE',
    });

    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
};

// Convertit un contact importe en Friend
export const contactToFriend = (contact: ImportedContact): Friend => ({
  id: contact.id,
  displayName: contact.name,
  avatarUrl: undefined,
  addedAt: new Date().toISOString(),
});

// Verifie si un contact est deja ami
export const isContactAlreadyFriend = (contactId: string, friends: Friend[]): boolean => {
  return friends.some(f => f.id === contactId);
};
