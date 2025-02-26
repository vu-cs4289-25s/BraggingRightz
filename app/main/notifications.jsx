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
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import NotificationsService from '../../src/endpoints/notifications.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

const NotificationTypes = {
  BETS: 'bets',
  COMMENTS: 'comments',
  FOLLOWS: 'follows',
  ALL: 'all',
};

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState(NotificationTypes.ALL);
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);
      const notifs = await NotificationsService.getNotifications(
        sessionData.uid,
        activeFilter,
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
      // Update local state
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsService.markAllAsRead(session.uid);
      // Update local state
      setNotifications(
        notifications.map((notif) => ({ ...notif, read: true })),
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderNotificationItem = (notification) => (
    <TouchableOpacity
      key={notification.id}
      style={styles.notificationItem}
      onPress={() => handleMarkAsRead(notification.id)}
    >
      <Image
        source={
          notification.data.avatar || { uri: 'https://i.pravatar.cc/300' }
        }
        style={styles.avatar}
      />
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationSubtitle}>
          {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
      <FontAwesome5 name="chevron-right" size={14} color="#AAAAAA" />
    </TouchableOpacity>
  );

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
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllRead}>Mark all as read</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filter,
              activeFilter === NotificationTypes.ALL && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter(NotificationTypes.ALL)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === NotificationTypes.ALL &&
                  styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filter,
              activeFilter === NotificationTypes.BETS && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter(NotificationTypes.BETS)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === NotificationTypes.BETS &&
                  styles.filterTextActive,
              ]}
            >
              Your Bets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filter,
              activeFilter === NotificationTypes.COMMENTS &&
                styles.activeFilter,
            ]}
            onPress={() => setActiveFilter(NotificationTypes.COMMENTS)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === NotificationTypes.COMMENTS &&
                  styles.filterTextActive,
              ]}
            >
              Comments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filter,
              activeFilter === NotificationTypes.FOLLOWS && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter(NotificationTypes.FOLLOWS)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === NotificationTypes.FOLLOWS &&
                  styles.filterTextActive,
              ]}
            >
              New Follows
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5
                name="bell-slash"
                size={50}
                color={theme.colors.textLight}
              />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
            </View>
          ) : (
            notifications.map((notification) =>
              renderNotificationItem(notification),
            )
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllRead: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  filter: {
    backgroundColor: '#eaeaea',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: hp(2),
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: '#0c0c0c',
    fontSize: hp(1.6),
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  notificationsList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: hp(1.5),
    marginBottom: hp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    marginRight: wp(3),
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: '#070707',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  notificationSubtitle: {
    color: '#303030',
    fontSize: hp(1.6),
  },
  unreadDot: {
    width: hp(1.2),
    height: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: theme.colors.primary,
    marginRight: wp(2),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(10),
  },
  emptyStateText: {
    color: theme.colors.textLight,
    fontSize: hp(2),
    marginTop: hp(2),
  },
});

export default Notifications;
