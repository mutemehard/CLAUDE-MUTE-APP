import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, APP_CONFIG } from '../constants';
import { RootStackParamList, Friend, FriendActivity, ConcertParticipation } from '../types';
import { useStore } from '../hooks';
import { haptics, shareApp } from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SocialTab = 'activity' | 'friends' | 'discover';

// Mock suggested friends pour demo
const mockSuggestedFriends: Friend[] = [
  { id: 'sug1', displayName: 'Marie L.', avatarUrl: undefined, addedAt: '' },
  { id: 'sug2', displayName: 'Thomas D.', avatarUrl: undefined, addedAt: '' },
  { id: 'sug3', displayName: 'Julie M.', avatarUrl: undefined, addedAt: '' },
  { id: 'sug4', displayName: 'Alex B.', avatarUrl: undefined, addedAt: '' },
  { id: 'sug5', displayName: 'Emma R.', avatarUrl: undefined, addedAt: '' },
];

// Mock activites d'amis pour demo
const mockFriendActivities: FriendActivity[] = [
  {
    friendId: 'f1',
    friendName: 'Lucas P.',
    concertId: 'c1',
    artistName: 'Charlotte de Witte',
    venueName: 'Concrete',
    date: '2025-02-15',
    status: 'going',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
  },
  {
    friendId: 'f2',
    friendName: 'Sophie M.',
    concertId: 'c2',
    artistName: 'Amelie Lens',
    venueName: 'Rex Club',
    date: '2025-02-18',
    status: 'interested',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2h ago
  },
  {
    friendId: 'f3',
    friendName: 'Pierre D.',
    concertId: 'c3',
    artistName: 'Justice',
    venueName: 'Accor Arena',
    date: '2025-03-22',
    status: 'going',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    friendId: 'f1',
    friendName: 'Lucas P.',
    concertId: 'c4',
    artistName: 'Phoenix',
    venueName: 'Olympia',
    date: '2025-04-10',
    status: 'interested',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];

export const SocialScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    friends,
    friendsActivity,
    addFriend,
    removeFriend,
    getUpcomingParticipations,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SocialTab>('activity');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine mock et vraies activites
  const allActivities = useMemo(() => {
    const combined = [...friendsActivity, ...mockFriendActivities];
    // Trier par date plus recente
    return combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [friendsActivity]);

  // Concerts ou des amis vont
  const upcomingWithFriends = useMemo(() => {
    const concertMap: Record<string, { concert: any; friends: FriendActivity[] }> = {};

    allActivities
      .filter(a => a.status === 'going' && new Date(a.date) >= new Date())
      .forEach(activity => {
        if (!concertMap[activity.concertId]) {
          concertMap[activity.concertId] = {
            concert: {
              id: activity.concertId,
              artistName: activity.artistName,
              venueName: activity.venueName,
              date: activity.date,
            },
            friends: [],
          };
        }
        concertMap[activity.concertId].friends.push(activity);
      });

    return Object.values(concertMap);
  }, [allActivities]);

  const handleAddFriend = () => {
    if (!newFriendName.trim()) {
      haptics.error();
      return;
    }

    const friend: Friend = {
      id: Date.now().toString(),
      displayName: newFriendName.trim(),
      addedAt: new Date().toISOString(),
    };

    haptics.success();
    addFriend(friend);
    setNewFriendName('');
    setShowAddModal(false);
  };

  const handleRemoveFriend = (friend: Friend) => {
    haptics.warning();
    Alert.alert(
      'Retirer cet ami ?',
      `${friend.displayName} ne verra plus tes concerts`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            removeFriend(friend.id);
          },
        },
      ]
    );
  };

  const handleConcertPress = (concertId: string) => {
    haptics.light();
    navigation.navigate('ConcertDetail', { concertId });
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Filter friends by search
  const filteredFriends = friends.filter(f =>
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = mockSuggestedFriends.filter(
    f => !friends.some(friend => friend.id === f.id)
  );

  const renderActivityItem = (activity: FriendActivity) => (
    <TouchableOpacity
      key={`${activity.friendId}-${activity.concertId}-${activity.timestamp}`}
      style={styles.activityItem}
      onPress={() => handleConcertPress(activity.concertId)}
      activeOpacity={0.7}
    >
      <View style={styles.activityAvatar}>
        {activity.friendAvatar ? (
          <Image source={{ uri: activity.friendAvatar }} style={styles.activityAvatarImage} />
        ) : (
          <Text style={styles.activityAvatarText}>
            {activity.friendName.charAt(0)}
          </Text>
        )}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityName}>{activity.friendName}</Text>
          {' '}
          {activity.status === 'going' ? 'va a' : 'est interesse par'}
          {' '}
          <Text style={styles.activityArtist}>{activity.artistName}</Text>
        </Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityVenue}>{activity.venueName}</Text>
          <Text style={styles.activityDot}>·</Text>
          <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
        </View>
        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
      </View>
      <View style={[
        styles.activityStatus,
        activity.status === 'going' ? styles.activityStatusGoing : styles.activityStatusInterested,
      ]}>
        <Text style={styles.activityStatusIcon}>
          {activity.status === 'going' ? '✓' : '★'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFriendItem = (friend: Friend, isSuggestion = false) => (
    <View key={friend.id} style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        {friend.avatarUrl ? (
          <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatarImage} />
        ) : (
          <Text style={styles.friendAvatarText}>
            {friend.displayName.charAt(0)}
          </Text>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.displayName}</Text>
        {!isSuggestion && (
          <Text style={styles.friendSince}>
            Ami depuis {new Date(friend.addedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
      {isSuggestion ? (
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => {
            haptics.success();
            addFriend({ ...friend, addedAt: new Date().toISOString() });
          }}
        >
          <Text style={styles.addFriendButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.removeFriendButton}
          onPress={() => handleRemoveFriend(friend)}
        >
          <Text style={styles.removeFriendIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderConcertWithFriends = (item: { concert: any; friends: FriendActivity[] }) => (
    <TouchableOpacity
      key={item.concert.id}
      style={styles.concertWithFriends}
      onPress={() => handleConcertPress(item.concert.id)}
      activeOpacity={0.7}
    >
      <View style={styles.concertWithFriendsDate}>
        <Text style={styles.concertWithFriendsDay}>
          {new Date(item.concert.date).getDate()}
        </Text>
        <Text style={styles.concertWithFriendsMonth}>
          {new Date(item.concert.date).toLocaleDateString('fr-FR', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.concertWithFriendsInfo}>
        <Text style={styles.concertWithFriendsArtist}>{item.concert.artistName}</Text>
        <Text style={styles.concertWithFriendsVenue}>{item.concert.venueName}</Text>
        <View style={styles.concertWithFriendsList}>
          {item.friends.slice(0, 3).map((f, i) => (
            <View
              key={f.friendId}
              style={[styles.concertFriendAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
            >
              <Text style={styles.concertFriendAvatarText}>{f.friendName.charAt(0)}</Text>
            </View>
          ))}
          <Text style={styles.concertFriendsCount}>
            {item.friends.length} ami{item.friends.length > 1 ? 's' : ''} y {item.friends.length > 1 ? 'vont' : 'va'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logo}>{APP_CONFIG.name}</Text>
              <Text style={styles.subtitle}>Social</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Ami</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { id: 'activity', label: 'Activite', icon: '📣' },
            { id: 'friends', label: 'Amis', icon: '👥', count: friends.length },
            { id: 'discover', label: 'Decouvrir', icon: '🔍' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => {
                haptics.selection();
                setActiveTab(tab.id as SocialTab);
              }}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            {/* Concerts avec amis */}
            {upcomingWithFriends.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concerts avec tes amis</Text>
                {upcomingWithFriends.slice(0, 3).map(renderConcertWithFriends)}
              </View>
            )}

            {/* Feed d'activite */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activite recente</Text>
              {allActivities.length > 0 ? (
                allActivities.slice(0, 10).map(renderActivityItem)
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>Pas encore d'activite</Text>
                  <Text style={styles.emptySubtext}>
                    Ajoute des amis pour voir leurs concerts
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <View style={styles.tabContent}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un ami..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Friends list */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Mes amis ({friends.length})
              </Text>
              {filteredFriends.length > 0 ? (
                filteredFriends.map(f => renderFriendItem(f))
              ) : friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyText}>Pas encore d'amis</Text>
                  <Text style={styles.emptySubtext}>
                    Ajoute des amis pour partager tes concerts
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Text style={styles.emptyButtonText}>Ajouter un ami</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noResults}>Aucun resultat pour "{searchQuery}"</Text>
              )}
            </View>
          </View>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              <Text style={styles.sectionSubtitle}>
                Personnes qui aiment les memes concerts
              </Text>
              {filteredSuggested.map(f => renderFriendItem(f, true))}
            </View>

            <View style={styles.inviteSection}>
              <Text style={styles.inviteIcon}>📲</Text>
              <Text style={styles.inviteTitle}>Invite tes amis</Text>
              <Text style={styles.inviteText}>
                Partage MUTE avec tes amis pour voir leurs concerts
              </Text>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={async () => {
                  haptics.light();
                  await shareApp();
                }}
              >
                <Text style={styles.inviteButtonText}>Partager l'app</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un ami</Text>
            <Text style={styles.modalSubtitle}>
              Entre le nom de ton ami
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nom de l'ami"
              placeholderTextColor={colors.textMuted}
              value={newFriendName}
              onChangeText={setNewFriendName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewFriendName('');
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddFriend}
              >
                <Text style={styles.modalConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  // Activity items
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  activityAvatarText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  activityName: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  activityArtist: {
    color: colors.primary,
    fontWeight: '600',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  activityVenue: {
    ...typography.caption,
    color: colors.textMuted,
  },
  activityDot: {
    color: colors.textMuted,
  },
  activityDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  activityStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStatusGoing: {
    backgroundColor: colors.success,
  },
  activityStatusInterested: {
    backgroundColor: colors.warning,
  },
  activityStatusIcon: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  // Friend items
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  friendAvatarText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  friendSince: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addFriendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  addFriendButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  removeFriendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFriendIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  // Concerts with friends
  concertWithFriends: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  concertWithFriendsDate: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 48,
  },
  concertWithFriendsDay: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  concertWithFriendsMonth: {
    ...typography.caption,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  concertWithFriendsInfo: {
    flex: 1,
  },
  concertWithFriendsArtist: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  concertWithFriendsVenue: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  concertWithFriendsList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  concertFriendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  concertFriendAvatarText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  concertFriendsCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    ...typography.body,
  },
  noResults: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  emptyButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Invite section
  inviteSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  inviteIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  inviteTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inviteText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  inviteButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
