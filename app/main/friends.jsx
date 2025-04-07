/**
 * Friends page -- VERY rough draft
 * Mostly to test friends functionality
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

import { useNavigation } from '@react-navigation/native';
import AddFriendModal from '../../components/AddFriendModal';
import FriendService from '../../src/endpoints/friend.cjs';
import Avatar from '../../components/Avatar';
import UserProfileModal from '../../components/UserProfileModal';

const DEFAULT_USER_IMAGE = require('../../assets/images/default-avatar.png');

const Friends = () => {
  const navigation = useNavigation();
  const [friendsList, setFriendsList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const friends = await FriendService.getFriendList('all');
      setFriendsList(friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch friends list when the component mounts
  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (username) => {
    try {
      await FriendService.addFriend({
        user2username: username,
      });
      setModalVisible(false);
      // Refresh friend list after adding a friend
      await fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleAcceptRequest = async (username) => {
    try {
      await FriendService.acceptFriendRequest({ user2username: username });
      await fetchFriends(); // refresh list after accepting
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (username) => {
    try {
      await FriendService.declineFriendRequest({ user2username: username });
      await fetchFriends(); // refresh list after declining
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleDeleteRequest = async (username) => {
    try {
      await FriendService.cancelFriendRequest({ user2username: username });
      await fetchFriends(); // refresh list after canceling
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleAvatarPress = (userId) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  }, []);

  const FriendCard = ({ friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <TouchableOpacity
          onPress={() => handleAvatarPress(friend.userId)}
          style={styles.avatarContainer}
        >
          <Avatar
            uri={
              friend.profilePicture ||
              Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri
            }
            size={hp(6)}
            rounded={theme.radius.xl}
          />
        </TouchableOpacity>
        <View style={styles.friendDetails}>
          <Text style={styles.username}>{friend.username}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="star-o" size={hp(2)} color={theme.colors.warning} />
              <Text style={styles.statText}>{friend.coins}</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="trophy" size={hp(2)} color={theme.colors.warning} />
              <Text style={styles.statText}>{friend.trophies}</Text>
            </View>
          </View>
        </View>
        {friend.status === 'pending' && (
          <View style={styles.requestContainer}>
            {friend.direction === 'sent' ? (
              <TouchableOpacity
                onPress={() => handleDeleteRequest(friend.username)}
                style={[styles.requestButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  onPress={() => handleAcceptRequest(friend.username)}
                  style={[styles.requestButton, styles.acceptButton]}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeclineRequest(friend.username)}
                  style={[styles.requestButton, styles.declineButton]}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        {friend.status === 'active' && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Friend</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header
          title="Friends"
          showBackButton={true}
          rightComponent={
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon
                name="user-plus"
                size={hp(3)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          }
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {friendsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="users" size={hp(8)} color={theme.colors.grey} />
                <Text style={styles.emptyText}>No friends yet</Text>
                <TouchableOpacity
                  style={styles.addFirstFriendButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.addFirstFriendText}>
                    Add your first friend
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {friendsList.filter(
                  (f) =>
                    f.status === 'pending' &&
                    (f.direction === 'recieved' || f.direction === 'received'),
                ).length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Friend Requests</Text>
                    {friendsList
                      .filter(
                        (friend) =>
                          friend.status === 'pending' &&
                          (friend.direction === 'recieved' ||
                            friend.direction === 'received'),
                      )
                      .map((friend) => (
                        <FriendCard key={friend.userId} friend={friend} />
                      ))}
                  </View>
                )}

                {friendsList.filter(
                  (f) => f.status === 'pending' && f.direction === 'sent',
                ).length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Sent Requests</Text>
                    {friendsList
                      .filter(
                        (friend) =>
                          friend.status === 'pending' &&
                          friend.direction === 'sent',
                      )
                      .map((friend) => (
                        <FriendCard key={friend.userId} friend={friend} />
                      ))}
                  </View>
                )}

                {friendsList.filter((f) => f.status === 'active').length >
                  0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Friends</Text>
                    {friendsList
                      .filter((friend) => friend.status === 'active')
                      .map((friend) => (
                        <FriendCard key={friend.userId} friend={friend} />
                      ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        <AddFriendModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddFriend}
        />

        <UserProfileModal
          visible={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Friends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    padding: wp(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(20),
  },
  emptyText: {
    fontSize: hp(2.2),
    color: theme.colors.grey,
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  addFirstFriendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addFirstFriendText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  friendCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  friendDetails: {
    flex: 1,
  },
  username: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: wp(4),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  actionButton: {
    padding: wp(2),
  },
  requestContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: wp(25),
  },
  requestButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  requestButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(25),
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    minWidth: wp(15),
  },
  declineButton: {
    backgroundColor: theme.colors.red,
    minWidth: wp(15),
  },
  cancelButton: {
    backgroundColor: theme.colors.red,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  declineButtonText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: `${theme.colors.success}20`,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.xl,
    marginLeft: 'auto',
  },
  activeBadgeText: {
    color: theme.colors.success,
    fontSize: hp(1.4),
    fontWeight: '500',
  },
});
