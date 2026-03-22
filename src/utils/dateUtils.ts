/**
 * Utilitaires de manipulation de dates pour les concerts
 */

/**
 * Verifie si une date est aujourd'hui
 */
export const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

/**
 * Verifie si une date est ce weekend (samedi ou dimanche prochains)
 */
export const isThisWeekend = (dateStr: string): boolean => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  const targetDate = new Date(dateStr);
  return targetDate >= saturday && targetDate <= sunday;
};

/**
 * Verifie si une date est dans les 7 prochains jours
 */
export const isThisWeek = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  return date >= today && date <= weekEnd;
};

/**
 * Verifie si une date est ce mois-ci
 */
export const isThisMonth = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Formate une date en francais (ex: "sam. 15 mars")
 */
export const formatDateFr = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Formate une date complete en francais (ex: "Samedi 15 mars 2024")
 */
export const formatDateFullFr = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Retourne le nombre de jours jusqu'a une date
 */
export const daysUntil = (dateStr: string): number => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Retourne un label relatif pour une date (ex: "Ce soir", "Demain", "Dans 3 jours")
 */
export const getRelativeDateLabel = (dateStr: string): string => {
  const days = daysUntil(dateStr);
  if (days === 0) return 'Ce soir';
  if (days === 1) return 'Demain';
  if (days < 7) return `Dans ${days} jours`;
  if (days < 14) return 'La semaine prochaine';
  return formatDateFr(dateStr);
};

/**
 * Groupe des concerts par date
 */
export const groupByDate = <T extends { date: string }>(
  items: T[]
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const key = item.date;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Filtre et trie des items par date future
 */
export const filterFutureDates = <T extends { date: string }>(
  items: T[]
): T[] => {
  const today = new Date().toISOString().split('T')[0];
  return items
    .filter(item => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
};
