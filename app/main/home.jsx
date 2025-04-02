'use client';

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth.cjs';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import AddFriendModal from '../../components/AddFriendModal';
import FriendService from '../../src/endpoints/friend.cjs';
import BetsService from '../../src/endpoints/bets';
import GroupsService from '../../src/endpoints/groups.cjs';
import NotificationsService from '../../src/endpoints/notifications.cjs';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { sharedStyles } from '../styles/shared';

const Home = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      // Load user's groups
      const userGroups = await GroupsService.getUserGroups(sessionData.uid);
      setUserGroups(userGroups);

      // Load user's bets
      const userBets = await BetsService.getUserBets(sessionData.uid);

      // Filter active bets (not expired and not completed)
      const now = new Date();
      const activeBets = userBets.filter((bet) => {
        const expiryDate = new Date(bet.expiresAt);
        return expiryDate > now && bet.status !== 'completed';
      });

      // Filter completed bets
      const completedBets = userBets.filter(
        (bet) => bet.status === 'completed',
      );

      setBets(activeBets);
      setBets(completedBets);

      // Load notifications
      const notifications = await NotificationsService.getNotifications(
        sessionData.uid,
      );
      setNotifications(notifications);

      // Load unread notifications count
      const unreadCount = await NotificationsService.getUnreadCount(
        sessionData.uid,
      );
      setUnreadNotifications(unreadCount);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddFriend = async (username) => {
    try {
      await FriendService.addFriend({
        user2username: username,
      });
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Define the getStatusColor function
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return theme.colors.primary;
      case 'locked':
        return '#FFA500'; // Orange color for locked status
      case 'completed':
        return '#4CAF50'; // Green color for completed status
      default:
        return theme.colors.textLight; // Default color for unknown status
    }
  };

  // Format the date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Calculate if user has won a bet
  const calculateBetResult = (bet) => {
    if (bet.status !== 'completed' || !bet.winningOptionId || !session?.uid) {
      return null;
    }

    const winningOption = bet.answerOptions.find(
      (opt) => opt.id === bet.winningOptionId,
    );
    if (!winningOption) {
      return null;
    }

    const userWon = winningOption.participants.includes(session.uid);
    if (!userWon) {
      return { result: 'lose', coins: 0 };
    }

    return {
      result: 'win',
      coins: bet.winningsPerPerson || 0,
    };
  };

  const groups = [
    { id: 'new', name: 'Create New', icon: 'plus' },
    { id: '1', name: 'Family' },
    { id: '2', name: 'Besties' },
    { id: '3', name: 'College' },
    { id: '4', name: 'Highschool' },
  ];

  // Update the group name display in the bet card
  const renderBetCard = (bet) => {
    const betResult = calculateBetResult(bet);
    return (
      <TouchableOpacity
        key={bet.id}
        style={styles.betCard}
        onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
      >
        <View style={styles.betHeader}>
          <Text
            style={styles.betQuestion}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {bet.question}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColorBackground(bet.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColorText(bet.status) },
              ]}
            >
              {bet.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.betDetails}>
          <View style={styles.betInfoRow}>
            <View style={styles.dateGroupContainer}>
              <View style={styles.dateContainer}>
                <Icon
                  name="calendar"
                  size={14}
                  color={theme.colors.textLight}
                  style={styles.infoIcon}
                />
                <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
              </View>
              <View style={styles.groupContainer}>
                <Icon
                  name="users"
                  size={14}
                  color={theme.colors.textLight}
                  style={styles.infoIcon}
                />
                <Text
                  style={styles.groupName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {bet.groupName || 'No Group'}
                </Text>
              </View>
            </View>

            {betResult && (
              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      betResult.result === 'win'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(255, 0, 0, 0.1)',
                  },
                ]}
              >
                <Icon
                  name={betResult.result === 'win' ? 'trophy' : 'times-circle'}
                  size={14}
                  color={betResult.result === 'win' ? '#4CAF50' : '#FF0000'}
                  style={styles.resultIcon}
                />
                <Text
                  style={[
                    styles.betCoins,
                    {
                      color: betResult.result === 'win' ? '#4CAF50' : '#FF0000',
                    },
                  ]}
                >
                  {betResult.result === 'win' ? '+' : ''}
                  {betResult.coins}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.betStats}>
          <View style={styles.statBadge}>
            <Icon
              name="user"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>
              {bet.participants?.length || 0}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Icon
              name="comment"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>{bet.commentCount || 0}</Text>
          </View>
          <View style={styles.statBadge}>
            <Icon
              name="money"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>{bet.wagerAmount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColorBackground = (status) => {
    switch (status) {
      case 'open':
        return 'rgba(33, 150, 243, 0.1)'; // Light blue background
      case 'locked':
        return 'rgba(255, 165, 0, 0.1)'; // Light orange background
      case 'completed':
        return 'rgba(76, 175, 80, 0.1)'; // Light green background
      default:
        return 'rgba(158, 158, 158, 0.1)'; // Light gray background
    }
  };

  const getStatusColorText = (status) => {
    switch (status) {
      case 'open':
        return '#2196F3'; // Blue text
      case 'locked':
        return '#FFA500'; // Orange text
      case 'completed':
        return '#4CAF50'; // Green text
      default:
        return theme.colors.textLight; // Default text color
    }
  };

  const renderNotificationItem = (notification) => {
    let icon = 'bell';
    let color = theme.colors.primary;

    switch (notification.type) {
      case 'bets':
        icon = 'trophy';
        color = '#FFD700';
        break;
      case 'comments':
        icon = 'comment';
        color = '#4CAF50';
        break;
      case 'follows':
        icon = 'user-plus';
        color = '#2196F3';
        break;
      case 'expiring':
        icon = 'clock-o';
        color = '#FF5722';
        break;
    }

    return (
      <TouchableOpacity
        key={notification.id}
        style={styles.notificationItem}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Icon name={icon} size={hp(2.5)} color={color} />
        <Text style={styles.notificationText} numberOfLines={1}>
          {notification.title}
        </Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.title}>BraggingRightz</Text>
        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationIcon}
          >
            <Icon name="bell" size={hp(3.2)} color={theme.colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>🪙 {session?.numCoins || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* My Groups Preview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupsScroll}
          >
            {userGroups.length > 0 ? (
              <>
                {userGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupItem}
                    onPress={() =>
                      navigation.navigate('GroupBets', { groupId: group.id })
                    }
                  >
                    <Avatar size={hp(6)} source={{ uri: group.avatar }} />
                    <Text style={styles.groupName} numberOfLines={1}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.groupItem}
                  onPress={() => navigation.navigate('Groups')}
                >
                  <View style={styles.plusIconContainer}>
                    <Icon
                      name="plus"
                      size={hp(4)}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.createGroupText}>Join/Create</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.createGroupButton}
                onPress={() => navigation.navigate('Groups')}
              >
                <View style={styles.plusIconContainer}>
                  <Icon name="plus" size={hp(4)} color={theme.colors.primary} />
                </View>
                <Text style={styles.createGroupText}>Join/Create Group</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Active Bets Preview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live & Upcoming Bets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBets')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.betsContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : bets.length > 0 ? (
              bets.map((bet) => renderBetCard(bet))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bets found</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gifBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    marginTop: hp(2),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000', // Bright red color
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: 'bold',
  },
  pointsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
  },
  points: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(4),
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(2),
    marginHorizontal: wp(4),
    borderRadius: hp(2),
    marginBottom: hp(3),
  },
  coinsText: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: wp(2),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(3),
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: hp(1),
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  sectionContainer: {
    marginBottom: hp(3),
    paddingHorizontal: wp(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  groupsScroll: {
    flexDirection: 'row',
  },
  groupItem: {
    alignItems: 'center',
    marginRight: wp(4),
    width: hp(10),
  },
  groupAvatar: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  groupName: {
    fontSize: hp(1.6),
  },
  betsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  betItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  betDescription: {
    flex: 1,
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: wp(3),
  },
  betDetails: {
    marginBottom: hp(2),
  },
  betInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  betDate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    backgroundColor: '#FEF3C7',
    padding: hp(1),
    borderRadius: hp(1),
  },
  winnerLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#92400E',
  },
  winnerOption: {
    fontSize: hp(1.8),
    color: '#92400E',
    flex: 1,
  },
  resultBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  winBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  loseBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  resultText: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  actionNeeded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: hp(1),
    borderRadius: hp(1),
    marginTop: hp(1),
    gap: wp(2),
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participants: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  yourVote: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  betCard: {
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  lockedBetCard: {
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  completedBetCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  betQuestion: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: wp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: hp(1.4),
    fontWeight: '700',
  },
  betDetails: {
    marginBottom: hp(1.5),
  },
  betInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroupContainer: {
    flexDirection: 'column',
    gap: hp(0.5),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  infoIcon: {
    marginRight: wp(1),
  },
  betDate: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  groupName: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    maxWidth: '90%',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
  },
  resultIcon: {
    marginRight: wp(1),
  },
  betCoins: {
    fontWeight: '700',
    fontSize: hp(1.8),
  },
  betStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(1),
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
  },
  statIcon: {
    marginRight: wp(1),
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1),
  },
  notificationText: {
    marginLeft: hp(1),
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
  },
  plusIconContainer: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  createGroupText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Home;
