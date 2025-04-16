import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/firebase/config';

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
      // Navigate back to refresh the home page's notification count
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    await handleMarkAsRead(notification.id);

    // Handle navigation based on notification type
    if (
      notification.type === 'friend_request' ||
      (notification.status === 'accepted' && notification.data?.requesterId)
    ) {
      navigation.navigate('Friends');
    } else if (notification.data?.betId) {
      navigation.navigate('BetDetails', { betId: notification.data.betId });
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    try {
      await FriendService.acceptFriendRequest({
        user2username: notification.data.requesterName,
      });

      // Update notification to show friendship is confirmed
      const updatedContent = {
        title: `You and ${notification.data.requesterName} are now friends`,
        message: 'Tap to view your friends list',
        read: true,
        status: 'accepted',
      };

      await NotificationsService.updateNotificationContent(
        notification.id,
        updatedContent,
      );

      // Update local state with new notification content
      setNotifications(
        notifications.map((notif) =>
          notif.id === notification.id
            ? {
                ...notif,
                ...updatedContent,
                updatedAt: new Date(),
              }
            : notif,
        ),
      );

      // Show success message
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert(
        'Error',
        'Failed to accept friend request. Please try again.',
      );
    }
  };

  const handleDeclineFriendRequest = async (notification) => {
    try {
      await handleMarkAsRead(notification.id);

      // Update local state
      setNotifications(
        notifications.map((notif) =>
          notif.id === notification.id
            ? { ...notif, read: true, status: 'declined' }
            : notif,
        ),
      );
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert(
        'Error',
        'Failed to decline friend request. Please try again.',
      );
    }
  };

  const renderNotificationItem = (notification) => {
    const icon = NotificationIcons[notification.type] || {
      name: 'bell',
      color: theme.colors.text,
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
                onPress={() => handleDeclineFriendRequest(notification)}
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

  // Add function to group notifications
  const groupNotifications = (notifs) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    return notifs.reduce(
      (groups, notification) => {
        const notifDate = new Date(notification.createdAt);
        const timeDiff = now - notifDate;

        if (timeDiff < oneDay) {
          groups.new.push(notification);
        } else if (timeDiff < oneWeek) {
          groups.thisWeek.push(notification);
        } else {
          groups.earlier.push(notification);
        }

        return groups;
      },
      { new: [], thisWeek: [], earlier: [] },
    );
  };

  const renderNotificationSection = (sectionTitle, sectionNotifications) => {
    if (sectionNotifications.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        {sectionNotifications.map(renderNotificationItem)}
      </View>
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

  const groupedNotifications = groupNotifications(notifications);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon
                name="chevron-left"
                size={hp(2.5)}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={handleMarkAllAsRead}
            >
              <Icon
                name="check-circle"
                size={hp(2)}
                color={theme.colors.primary}
                style={styles.markAllReadIcon}
              />
              <Text style={styles.markAllRead}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="bell-slash" size={50} color={theme.colors.black} />
              <Text style={styles.emptyStateText}>No notifications</Text>
            </View>
          ) : (
            <>
              {renderNotificationSection('New', groupedNotifications.new)}
              {renderNotificationSection(
                'This week',
                groupedNotifications.thisWeek,
              )}
              {renderNotificationSection(
                'Earlier',
                groupedNotifications.earlier,
              )}
            </>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: wp(3),
    padding: wp(2),
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  markAllReadIcon: {
    marginRight: wp(1),
  },
  markAllRead: {
    color: theme.colors.primary,
    fontSize: hp(1.2),
    fontWeight: '600',
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
    backgroundColor: theme.colors.primary + '30',
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
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  timestamp: {
    fontSize: hp(1.4),
    color: theme.colors.dark,
  },
  unreadDot: {
    width: hp(1.2),
    height: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: theme.colors.red,
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
    color: theme.colors.black,
    marginTop: hp(2),
  },
  friendRequestActions: {
    flexDirection: 'row',
    marginTop: hp(1),
    gap: wp(2),
  },
  actionButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    minWidth: wp(20),
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: theme.colors.text,
  },
  declineButton: {
    backgroundColor: theme.colors.red,
  },
  actionButtonText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: 'white',
  },
  notificationStatus: {
    fontSize: hp(1.4),
    fontStyle: 'italic',
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(2),
    paddingHorizontal: wp(2),
  },
});

export default Notifications;
