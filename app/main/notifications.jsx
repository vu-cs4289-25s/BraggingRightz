// import { StyleSheet, Text, View } from 'react-native';
// import React from 'react';
//
// const Notifications = () => {
//   return (
//     <View>
//       <Text>notifications</Text>
//     </View>
//   );
// };
//
// export default Notifications;
//
// const styles = StyleSheet.create({});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import NotificationsService from '../../src/endpoints/notifications.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import FriendService from '../../src/endpoints/friend.cjs';

const NotificationIcons = {
  new_bet: { name: 'plus-circle', color: theme.colors.primary },
  bet_expiring: { name: 'clock-o', color: theme.colors.warning },
  bet_result: { name: 'trophy', color: theme.colors.success },
  vote_reminder: { name: 'exclamation-circle', color: theme.colors.error },
  comments: { name: 'comment', color: theme.colors.primary },
  follows: { name: 'user-plus', color: theme.colors.success },
  groups: { name: 'users', color: theme.colors.primary },
  friend_request: { name: 'user-plus', color: theme.colors.primary },
};

const Notifications = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [session, setSession] = useState(null);

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
      const sessionData = await AuthService.getSession();
      setSession(sessionData);
      const notifs = await NotificationsService.getNotifications(
        sessionData.uid,
      );
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationsService.markAsRead(notificationId);
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
      // Refresh the unread count in the home page
      navigation.setParams({ refreshNotifications: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsService.markAllAsRead(session.uid);
      setNotifications(
        notifications.map((notif) => ({ ...notif, read: true })),
      );
      // Refresh the unread count in the home page
      navigation.setParams({ refreshNotifications: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    await handleMarkAsRead(notification.id);

    if (notification.data?.betId) {
      navigation.navigate('BetDetails', { betId: notification.data.betId });
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    try {
      await FriendService.acceptFriendRequest({
        user2username: notification.data.requesterName,
      });
      await handleMarkAsRead(notification.id);
      await loadData(); // Refresh notifications
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const renderNotificationItem = (notification) => {
    const icon = NotificationIcons[notification.type] || {
      name: 'bell',
      color: theme.colors.gray,
    };

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadItem,
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}
        >
          <Icon name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(notification.createdAt).toLocaleDateString()} •{' '}
            {new Date(notification.createdAt).toLocaleTimeString()}
          </Text>
          {notification.type === 'friend_request' && !notification.read && (
            <View style={styles.friendRequestActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptFriendRequest(notification)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header
          title="Notifications"
          showBackButton={true}
          rightComponent={
            notifications.some((n) => !n.read) && (
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <Text style={styles.markAllRead}>Mark all as read</Text>
              </TouchableOpacity>
            )
          }
        />

        <ScrollView
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="bell-slash" size={50} color={theme.colors.gray} />
              <Text style={styles.emptyStateText}>No notifications</Text>
            </View>
          ) : (
            notifications.map(renderNotificationItem)
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllRead: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  notificationsList: {
    padding: wp(4),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: wp(4),
    borderRadius: hp(1.5),
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadItem: {
    backgroundColor: theme.colors.primary + '08',
  },
  iconContainer: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  notificationMessage: {
    fontSize: hp(1.6),
    color: theme.colors.gray,
    marginBottom: hp(0.5),
  },
  timestamp: {
    fontSize: hp(1.4),
    color: theme.colors.gray,
  },
  unreadDot: {
    width: hp(1.2),
    height: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: theme.colors.primary,
    marginLeft: wp(2),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(10),
  },
  emptyStateText: {
    fontSize: hp(2),
    color: theme.colors.gray,
    marginTop: hp(2),
  },
  friendRequestActions: {
    flexDirection: 'row',
    marginTop: hp(1),
    gap: wp(2),
  },
  actionButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    minWidth: wp(20),
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: theme.colors.success + '20',
  },
  declineButton: {
    backgroundColor: theme.colors.error + '20',
  },
  actionButtonText: {
    fontSize: hp(1.4),
    fontWeight: '500',
  },
});

export default Notifications;
