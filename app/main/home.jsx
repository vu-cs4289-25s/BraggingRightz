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
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import AddFriendModal from '../../components/AddFriendModal';
import FriendService from '../../src/endpoints/friend.cjs';
import BetsService from '../../src/endpoints/bets';
import GroupsService from '../../src/endpoints/groups';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        // Fetch user's bets
        const userBets = await BetsService.getUserBets(sessionData.uid);

        // Fetch group names for each bet
        const betsWithGroupNames = await Promise.all(
          userBets.map(async (bet) => {
            if (bet.groupId) {
              const groupName = await GroupsService.getGroupName(bet.groupId);
              return {
                ...bet,
                groupName,
              };
            }
            return {
              ...bet,
              groupName: 'No Group',
            };
          }),
        );

        setBets(betsWithGroupNames);

        // Fetch recent notifications
        const recentNotifs = await NotificationsService.getNotifications(
          sessionData.uid,
        );
        setNotifications(recentNotifs.slice(0, 3)); // Show top 3 notifications

        // Get unread count
        const unreadCountData = await NotificationsService.getUnreadCount(
          sessionData.uid,
        );
        setUnreadCount(unreadCountData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddFriend = (username) => {
    console.log('Adding friend:', username);
    FriendService.addFriend({
      user2username: username,
    });
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  // Calculate if user has won a bet
  const calculateBetResult = (bet) => {
    if (bet.status !== 'completed') return null;

    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );

    if (!userOption) return null;

    return userOption.id === bet.winningOptionId
      ? {
          result: 'win',
          coins: bet.winningsPerPerson || 0,
        }
      : {
          result: 'loss',
          coins: -bet.wagerAmount,
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
          <Text style={styles.betDescription}>{bet.question}</Text>
          <Text style={[styles.status, { color: getStatusColor(bet.status) }]}>
            {bet.status.toUpperCase()}
          </Text>
        </View>
        <View style={styles.betDetails}>
          <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
          {/* <View style={styles.groupInfo}> */}
          {/* <Icon name="users" size={14} color={theme.colors.textLight} /> */}
          <Text style={styles.groupName}>{bet.groupName || 'No Group'}</Text>
          {/* </View> */}
          <View style={styles.betResult}>
            {betResult && (
              <Text
                style={[
                  styles.betCoins,
                  { color: betResult.result === 'win' ? '#4CAF50' : '#FF0000' },
                ]}
              >
                {betResult.result === 'win' ? '+' : ''}
                {betResult.coins}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.betStats}>
          <Text style={styles.statsText}>
            {bet.participants?.length || 0} participants
          </Text>
          <Text style={styles.statsText}>{bet.commentCount || 0} comments</Text>
          <Text style={styles.statsText}>Pool: {bet.totalPool || 0} coins</Text>
        </View>
      </TouchableOpacity>
    );
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

  return (
    <ScreenWrapper bg="white">
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.title}>BraggingRightz</Text>
        <View style={styles.icons}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationIcon}
          >
            <Icon name="bell" size={hp(3.2)} color={theme.colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>7.4K</Text>
          </View>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.notificationsContainer}>
          {notifications.map(renderNotificationItem)}
        </View>
      )}

      <View style={styles.sectionDivider} />
      <ScrollView style={styles.container}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('NewBet')}
          >
            {/*<Icon name="plus-circle" size={hp(3)} color={theme.colors.primary} />*/}
            <Icon
              name="heart"
              size={hp(3.2)}
              strokeWidth={2}
              color={theme.colors.text}
            />
            <Text style={styles.actionText}>Join Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon
              name="plus-square"
              size={hp(3.2)}
              strokeWidth={2}
              color={theme.colors.text}
            />{' '}
            <Text style={styles.actionText}>Add a friend</Text>
          </TouchableOpacity>
        </View>

        {/* AddFriendModal usage */}
        <AddFriendModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddFriend}
        />

        {/* My Groups Preview */}
        {/* See all button now wired but the preview bubbles are still static */}
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
            {groups.map((group) => (
              <TouchableOpacity key={group.id} style={styles.groupItem}>
                <View style={styles.groupAvatar}>
                  {group.icon ? (
                    <Icon name={group.icon} size={24} color="black" />
                  ) : null}
                </View>
                <Text style={styles.groupName}>{group.name}</Text>
              </TouchableOpacity>
            ))}
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
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigation.navigate('NewBet')}
                >
                  <Text style={styles.createButtonText}>Create a New Bet</Text>
                </TouchableOpacity>
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
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  pointsContainer: {
    backgroundColor: 'black',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 4,
  },
  points: {
    color: 'white',
    fontWeight: '500',
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
  // betItem: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   backgroundColor: theme.colors.card,
  //   padding: hp(2),
  //   borderRadius: hp(1.5),
  //   marginBottom: hp(1),
  // },
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    justifyContent: 'center',
  },
  betDate: {
    fontSize: 14,
    color: '#666',
  },
  betGroup: {
    fontSize: 14,
    color: '#666',
  },
  betResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betCoins: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
  betName: {
    flex: 1,
    marginLeft: wp(2),
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
  emptyState: {
    alignItems: 'center',
    padding: hp(4),
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    marginBottom: hp(2),
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  betStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  betCard: {
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
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: 'bold',
  },
  notificationsContainer: {
    padding: hp(2),
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
});

export default Home;
