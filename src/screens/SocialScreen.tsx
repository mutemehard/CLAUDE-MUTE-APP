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
import { RootStackParamList, Friend, FriendActivity, ConcertParticipation, IncomingFollowRequest, Friendship } from '../types';
import { useStore } from '../hooks';
import {
  haptics,
  shareApp,
  getContacts,
  shareInviteLink,
  generateFriendQRData,
  generateUserQRId,
  ImportedContact,
} from '../utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SocialTab = 'activity' | 'friends' | 'requests' | 'discover';

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
    // Mutual follow system
    friendships,
    incomingFollowRequests,
    outgoingFollowRequests,
    sendFollowRequest,
    cancelFollowRequest,
    acceptFollowRequest,
    declineFollowRequest,
    removeFriendship,
    getPendingRequestsCount,
    isFriendWith,
    hasSentRequestTo,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SocialTab>('activity');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Count pending requests
  const pendingRequestsCount = incomingFollowRequests.length;

  // User QR ID (would be stored in user profile in production)
  const userQRId = 'USER_' + Date.now().toString(36);

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

    // Envoyer une demande de suivi au lieu d'ajouter directement
    const userId = `user_${Date.now()}`;
    haptics.success();
    sendFollowRequest(userId, newFriendName.trim());
    Alert.alert(
      'Demande envoyee',
      `Une demande a ete envoyee a ${newFriendName.trim()}`,
      [{ text: 'OK' }]
    );
    setNewFriendName('');
    setShowAddModal(false);
  };

  const handleAcceptRequest = (request: IncomingFollowRequest) => {
    haptics.success();
    acceptFollowRequest(request.id);
    Alert.alert(
      'Ami ajoute',
      `${request.fromUserName} est maintenant ton ami !`,
      [{ text: 'Super !' }]
    );
  };

  const handleDeclineRequest = (request: IncomingFollowRequest) => {
    haptics.light();
    declineFollowRequest(request.id);
  };

  const handleRemoveFriendship = (friendship: Friendship) => {
    haptics.warning();
    Alert.alert(
      'Retirer cet ami ?',
      `${friendship.friendName} ne verra plus tes concerts`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            removeFriendship(friendship.id);
          },
        },
      ]
    );
  };

  const handleImportContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const contacts = await getContacts();
      setImportedContacts(contacts);
      if (contacts.length > 0) {
        setShowContactsModal(true);
      } else {
        Alert.alert('Aucun contact', 'Impossible de recuperer les contacts.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'acceder aux contacts.');
    }
    setIsLoadingContacts(false);
  };

  const handleInviteContact = (contact: ImportedContact) => {
    haptics.light();
    // Envoyer une demande de suivi
    sendFollowRequest(contact.id, contact.name);
    Alert.alert(
      'Demande envoyee',
      `Une demande a ete envoyee a ${contact.name}`,
      [{ text: 'OK' }]
    );
  };

  const handleShareQR = async () => {
    haptics.light();
    await shareInviteLink('MonPseudo');
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
            { id: 'friends', label: 'Amis', icon: '👥', count: friendships.length || friends.length },
            { id: 'requests', label: 'Demandes', icon: '🔔', count: pendingRequestsCount, highlight: pendingRequestsCount > 0 },
            { id: 'discover', label: 'Decouvrir', icon: '🔍' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
                (tab as any).highlight && styles.tabHighlight,
              ]}
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
                <View style={[
                  styles.tabBadge,
                  (tab as any).highlight && styles.tabBadgeHighlight,
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    (tab as any).highlight && styles.tabBadgeTextHighlight,
                  ]}>{tab.count}</Text>
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

            {/* Friendships (mutual follow) */}
            {friendships.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Amis mutuels ({friendships.length})
                </Text>
                {friendships
                  .filter(f => f.friendName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(friendship => (
                    <View key={friendship.id} style={styles.friendItem}>
                      <View style={styles.friendAvatar}>
                        {friendship.friendAvatar ? (
                          <Image source={{ uri: friendship.friendAvatar }} style={styles.friendAvatarImage} />
                        ) : (
                          <Text style={styles.friendAvatarText}>
                            {friendship.friendName.charAt(0)}
                          </Text>
                        )}
                        <View style={styles.mutualBadge}>
                          <Text style={styles.mutualBadgeIcon}>🤝</Text>
                        </View>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friendship.friendName}</Text>
                        <Text style={styles.friendSince}>
                          Amis mutuels depuis {new Date(friendship.mutualSince).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeFriendButton}
                        onPress={() => handleRemoveFriendship(friendship)}
                      >
                        <Text style={styles.removeFriendIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}

            {/* Legacy friends list (for backward compatibility) */}
            {friends.length > 0 && friendships.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Mes amis ({friends.length})
                </Text>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map(f => renderFriendItem(f))
                ) : (
                  <Text style={styles.noResults}>Aucun resultat pour "{searchQuery}"</Text>
                )}
              </View>
            )}

            {/* Empty state */}
            {friends.length === 0 && friendships.length === 0 && (
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
            )}

            {/* Pending outgoing requests */}
            {outgoingFollowRequests.filter(r => r.status === 'pending').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Demandes envoyees</Text>
                {outgoingFollowRequests
                  .filter(r => r.status === 'pending')
                  .map(request => (
                    <View key={request.id} style={styles.friendItem}>
                      <View style={styles.friendAvatar}>
                        {request.toUserAvatar ? (
                          <Image source={{ uri: request.toUserAvatar }} style={styles.friendAvatarImage} />
                        ) : (
                          <Text style={styles.friendAvatarText}>
                            {request.toUserName.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{request.toUserName}</Text>
                        <Text style={styles.friendSince}>En attente de reponse...</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cancelRequestButton}
                        onPress={() => {
                          haptics.light();
                          cancelFollowRequest(request.id);
                        }}
                      >
                        <Text style={styles.cancelRequestText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Demandes recues ({incomingFollowRequests.length})
              </Text>
              {incomingFollowRequests.length > 0 ? (
                incomingFollowRequests.map(request => (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.friendAvatar}>
                      {request.fromUserAvatar ? (
                        <Image source={{ uri: request.fromUserAvatar }} style={styles.friendAvatarImage} />
                      ) : (
                        <Text style={styles.friendAvatarText}>
                          {request.fromUserName.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{request.fromUserName}</Text>
                      <Text style={styles.requestTime}>
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptRequest(request)}
                      >
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleDeclineRequest(request)}
                      >
                        <Text style={styles.declineButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>Aucune demande</Text>
                  <Text style={styles.emptySubtext}>
                    Les demandes d'amis apparaitront ici
                  </Text>
                </View>
              )}
            </View>

            {/* Explanation */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Follow mutuel</Text>
                <Text style={styles.infoText}>
                  Comme sur BeReal, tu dois accepter les demandes pour devenir amis.
                  Tes amis pourront voir tes concerts.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <View style={styles.tabContent}>
            {/* Import contacts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ajouter des amis</Text>

              <View style={styles.addMethodsGrid}>
                <TouchableOpacity
                  style={styles.addMethodCard}
                  onPress={handleImportContacts}
                  disabled={isLoadingContacts}
                >
                  <Text style={styles.addMethodIcon}>📱</Text>
                  <Text style={styles.addMethodTitle}>Contacts</Text>
                  <Text style={styles.addMethodDesc}>
                    Importer depuis ton telephone
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addMethodCard}
                  onPress={() => setShowQRModal(true)}
                >
                  <Text style={styles.addMethodIcon}>📷</Text>
                  <Text style={styles.addMethodTitle}>QR Code</Text>
                  <Text style={styles.addMethodDesc}>
                    Scanner ou partager
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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

      {/* Contacts Modal */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.contactsModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tes contacts ({importedContacts.length})</Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={importedContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.contactItem}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.phoneNumber && (
                      <Text style={styles.contactDetail}>{item.phoneNumber}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.inviteContactButton}
                    onPress={() => handleInviteContact(item)}
                  >
                    <Text style={styles.inviteContactText}>Inviter</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderIcon}>📱</Text>
                <Text style={styles.qrPlaceholderText}>
                  Scanner le QR code d'un ami pour l'ajouter
                </Text>
              </View>

              <View style={styles.qrDivider}>
                <View style={styles.qrDividerLine} />
                <Text style={styles.qrDividerText}>ou</Text>
                <View style={styles.qrDividerLine} />
              </View>

              <View style={styles.myQrSection}>
                <View style={styles.myQrCode}>
                  <Text style={styles.myQrIcon}>📲</Text>
                  <Text style={styles.myQrText}>Mon QR Code</Text>
                </View>
                <Text style={styles.myQrHint}>
                  Un ami peut scanner ce code pour t'ajouter
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shareQrButton}
              onPress={handleShareQR}
            >
              <Text style={styles.shareQrButtonText}>Partager mon lien</Text>
            </TouchableOpacity>
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
  mutualBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  mutualBadgeIcon: {
    fontSize: 8,
  },
  cancelRequestButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cancelRequestText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // Request items
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  requestTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  acceptButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  // Tab highlight
  tabHighlight: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabBadgeHighlight: {
    backgroundColor: colors.primary,
  },
  tabBadgeTextHighlight: {
    color: colors.textPrimary,
  },
  // Info card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    lineHeight: 18,
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
  // Add methods grid
  addMethodsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addMethodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  addMethodIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  addMethodTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  addMethodDesc: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Contacts modal
  contactsModalContent: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalCloseIcon: {
    fontSize: 24,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  contactsList: {
    maxHeight: 400,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    gap: spacing.md,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  contactDetail: {
    ...typography.caption,
    color: colors.textMuted,
  },
  inviteContactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  inviteContactText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // QR Code modal
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  qrPlaceholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  qrPlaceholderText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  qrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.lg,
  },
  qrDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceLight,
  },
  qrDividerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
  },
  myQrSection: {
    alignItems: 'center',
  },
  myQrCode: {
    width: 150,
    height: 150,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  myQrIcon: {
    fontSize: 48,
  },
  myQrText: {
    ...typography.caption,
    color: colors.background,
    marginTop: spacing.xs,
  },
  myQrHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  shareQrButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  shareQrButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
