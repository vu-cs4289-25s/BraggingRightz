import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import Avatar from './Avatar';
import UserService from '../src/endpoints/user.cjs';
import GroupsService from '../src/endpoints/groups.cjs';
import FriendService from '../src/endpoints/friend.cjs';
import AuthService from '../src/endpoints/auth.cjs';

const DEFAULT_USER_IMAGE = require('../assets/images/default-avatar.png');

const UserProfileModal = ({ visible, onClose, userId }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [commonGroups, setCommonGroups] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (visible && userId) {
      loadUserProfile();
    }
  }, [visible, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Get current user session
      const sessionData = await AuthService.getSession();
      setCurrentUser(sessionData);

      // Get user profile
      const profile = await UserService.getUserProfile(userId);
      setUserProfile(profile);

      // Get common groups
      const userGroups = await GroupsService.getUserGroups(userId);
      const currentUserGroups = await GroupsService.getUserGroups(
        sessionData.uid,
      );

      const common = userGroups.filter((group1) =>
        currentUserGroups.some((group2) => group2.id === group1.id),
      );
      setCommonGroups(common);

      // Check friendship status
      const friends = await FriendService.getFriendList('all');
      const friendData = friends.find((friend) => friend.userId === userId);
      if (friendData) {
        const direction =
          friendData.direction === 'recieved'
            ? 'received'
            : friendData.direction;
        setFriendStatus(friendData.status + '_' + (direction || ''));
        setIsFriend(friendData.status === 'active');
      } else {
        setFriendStatus('none');
        setIsFriend(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await FriendService.acceptFriendRequest({
        user2username: userProfile.username,
      });
      setFriendStatus('active');
      setIsFriend(true);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async () => {
    try {
      await FriendService.declineFriendRequest({
        user2username: userProfile.username,
      });
      setFriendStatus('none');
      setIsFriend(false);
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleCancelRequest = async () => {
    try {
      await FriendService.cancelFriendRequest({
        user2username: userProfile.username,
      });
      setFriendStatus('none');
      setIsFriend(false);
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleAddFriend = async () => {
    try {
      await FriendService.addFriend({
        user2username: userProfile.username,
      });
      setIsFriend(true);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="times" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : userProfile ? (
            <>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <Avatar
                  uri={
                    userProfile.profilePicture ||
                    Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri
                  }
                  size={hp(15)}
                  rounded={theme.radius.xl}
                />
                <Text style={styles.username}>{userProfile.username}</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Icon name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.statValue}>
                    {userProfile.trophies || 0}
                  </Text>
                  <Text style={styles.statLabel}>Trophies</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="star" size={24} color="#FFD700" />
                  <Text style={styles.statValue}>
                    {userProfile.numCoins || 0}
                  </Text>
                  <Text style={styles.statLabel}>Coins</Text>
                </View>
              </View>

              {/* Common Groups */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Groups</Text>
                {commonGroups.length > 0 ? (
                  commonGroups.map((group) => (
                    <View key={group.id} style={styles.groupItem}>
                      <Icon
                        name="users"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.groupName}>{group.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No common groups</Text>
                )}
              </View>

              {/* Friend Status */}
              {userId !== currentUser?.uid && (
                <View style={styles.friendSection}>
                  {friendStatus === 'active' ? (
                    <View style={styles.friendStatus}>
                      <Icon
                        name="check-circle"
                        size={20}
                        color={theme.colors.success}
                      />
                      <Text style={styles.friendStatusText}>Friends</Text>
                    </View>
                  ) : friendStatus === 'pending_sent' ? (
                    <View style={styles.friendRequestSent}>
                      <TouchableOpacity
                        style={styles.cancelRequestButton}
                        onPress={handleCancelRequest}
                      >
                        <Icon
                          name="clock-o"
                          size={20}
                          color={theme.colors.warning}
                        />
                        <Text style={styles.pendingRequestText}>
                          Friend Request Sent
                        </Text>
                        <Text
                          style={styles.cancelText}
                          onPress={handleCancelRequest}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : friendStatus === 'pending_recieved' ||
                    friendStatus === 'pending_received' ? (
                    <View style={styles.requestButtons}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={handleAcceptRequest}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={handleDeclineRequest}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addFriendButton}
                      onPress={handleAddFriend}
                    >
                      <Icon name="user-plus" size={20} color="white" />
                      <Text style={styles.addFriendText}>Add Friend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>Failed to load profile</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    padding: wp(6),
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: wp(4),
    top: wp(4),
    zIndex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  username: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginTop: hp(2),
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(3),
    paddingHorizontal: wp(4),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: hp(1),
  },
  statLabel: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(1.5),
    color: theme.colors.text,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
  },
  groupName: {
    marginLeft: wp(2),
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  friendSection: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}20`,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
  },
  friendStatusText: {
    marginLeft: wp(2),
    color: theme.colors.success,
    fontWeight: '600',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
  },
  addFriendText: {
    marginLeft: wp(2),
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  friendRequestSent: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  cancelRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.blue}20`,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
  },
  pendingRequestText: {
    color: theme.colors.blue,
    marginLeft: wp(2),
    fontWeight: '600',
  },
  cancelText: {
    color: theme.colors.red,
    marginLeft: wp(4.5),
    fontWeight: '600',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(1),
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
  },
  declineButton: {
    backgroundColor: theme.colors.red,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xl,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  declineButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default UserProfileModal;
