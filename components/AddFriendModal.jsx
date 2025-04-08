import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import Input from './Input';
import Avatar from './Avatar';
import UserService from '../src/endpoints/user.cjs';
import AuthService from '../src/endpoints/auth.cjs';
import FriendService from '../src/endpoints/friend.cjs';

const DEFAULT_USER_IMAGE = require('../assets/images/default-avatar.png');

const AddFriendModal = ({ visible, onClose, onAdd }) => {
  const [username, setUsername] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (visible) {
        const session = await AuthService.getSession();
        setCurrentUserId(session.uid);
        const friends = await FriendService.getFriendList('all');
        setFriendsList(friends);
      }
    };
    fetchData();
  }, [visible]);

  const getFriendshipStatus = (userId) => {
    const friend = friendsList.find((f) => f.userId === userId);
    if (!friend) return null;
    return {
      status: friend.status,
      direction: friend.direction,
    };
  };

  const handleSearch = async (text) => {
    setUsername(text);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout to search after user stops typing
    const timeout = setTimeout(async () => {
      if (text.length >= 2) {
        setLoading(true);
        try {
          const results = await UserService.searchUsers(text);
          // Filter out the current user from suggestions
          const filtered = results.filter(
            (user) => user.userId !== currentUserId,
          );
          setSuggestions(filtered);
        } catch (error) {
          console.error('Error searching users:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300); // Reduced timeout for better responsiveness

    setSearchTimeout(timeout);
  };

  const renderFriendshipStatus = (userId) => {
    const friendship = getFriendshipStatus(userId);
    if (!friendship) return null;

    switch (friendship.status) {
      case 'active':
        return (
          <View style={styles.friendBadge}>
            <Icon name="check" size={12} color={theme.colors.success} />
            <Text style={styles.friendBadgeText}>Friends</Text>
          </View>
        );
      case 'pending':
        if (friendship.direction === 'sent') {
          return (
            <View style={[styles.friendBadge, styles.pendingBadge]}>
              <Icon name="clock-o" size={12} color={theme.colors.warning} />
              <Text
                style={[
                  styles.friendBadgeText,
                  { color: theme.colors.warning },
                ]}
              >
                Request Sent
              </Text>
            </View>
          );
        } else {
          return (
            <View style={[styles.friendBadge, styles.pendingBadge]}>
              <Icon name="clock-o" size={12} color={theme.colors.warning} />
              <Text
                style={[
                  styles.friendBadgeText,
                  { color: theme.colors.warning },
                ]}
              >
                Pending Approval
              </Text>
            </View>
          );
        }
      default:
        return null;
    }
  };

  const canAddFriend = (userId) => {
    const friendship = getFriendshipStatus(userId);
    return (
      !friendship ||
      (friendship.status !== 'active' && friendship.status !== 'pending')
    );
  };

  const handleSelectUser = (selectedUsername) => {
    onAdd(selectedUsername);
    setUsername('');
    setSuggestions([]);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Friend</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="times" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Input
            icon={
              <Icon name="search" size={20} color={theme.colors.textLight} />
            }
            placeholder="Search by username"
            value={username}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              color={theme.colors.primary}
              size="large"
            />
          ) : (
            <ScrollView style={styles.suggestionsContainer}>
              {suggestions.map((user) => (
                <TouchableOpacity
                  key={user.userId}
                  style={[
                    styles.suggestionItem,
                    !canAddFriend(user.userId) && styles.disabledItem,
                  ]}
                  onPress={() =>
                    canAddFriend(user.userId) && handleSelectUser(user.username)
                  }
                  disabled={!canAddFriend(user.userId)}
                >
                  <View style={styles.userInfo}>
                    <Avatar
                      uri={
                        user.profilePicture ||
                        Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri
                      }
                      size={hp(6)}
                      rounded={theme.radius.xl}
                    />
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>{user.username}</Text>
                      <View style={styles.stats}>
                        <Icon name="trophy" size={16} color="#FFD700" />
                        <Text style={styles.statsText}>
                          {user.trophies || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {renderFriendshipStatus(user.userId) || (
                    <Icon name="plus" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {username.length >= 2 && suggestions.length === 0 && !loading && (
                <Text style={styles.noResults}>No users found</Text>
              )}
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: wp(2),
  },
  loading: {
    marginTop: hp(3),
  },
  suggestionsContainer: {
    marginTop: hp(2),
    maxHeight: hp(40),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
  },
  disabledItem: {
    opacity: 0.8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: wp(3),
    flex: 1,
  },
  username: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginLeft: wp(1),
  },
  noResults: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: hp(2),
    fontStyle: 'italic',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}20`,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.xl,
    gap: wp(1),
  },
  pendingBadge: {
    backgroundColor: `${theme.colors.warning}20`,
  },
  friendBadgeText: {
    fontSize: hp(1.4),
    color: theme.colors.success,
    fontWeight: '600',
  },
});

export default AddFriendModal;
