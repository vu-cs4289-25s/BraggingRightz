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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

import { useNavigation } from '@react-navigation/native';
import AddFriendModal from '../../components/AddFriendModal';
import FriendService from '../../src/endpoints/friend.cjs';

const Friends = () => {
  const navigation = useNavigation();
  const [friendsList, setFriendsList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleAddFriend = async ({ username }) => {
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

  const FriendCard = ({ friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Icon name="user-circle" size={hp(6)} color={theme.colors.primary} />
        </View>
        <View style={styles.friendDetails}>
          <View style={styles.nameAndStatus}>
            <Text style={styles.username}>{friend.username}</Text>
            <View
              style={[
                styles.statusBadge,
                friend.status === 'pending'
                  ? styles.pendingBadge
                  : styles.activeBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {friend.status === 'pending' ? 'Pending' : 'Friend'}
              </Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="coins" size={hp(2)} color={theme.colors.warning} />
              <Text style={styles.statText}>{friend.coins}</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="trophy" size={hp(2)} color={theme.colors.warning} />
              <Text style={styles.statText}>{friend.trophies}</Text>
            </View>
          </View>
        </View>
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
                {friendsList.filter((f) => f.status === 'pending').length >
                  0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Pending Requests</Text>
                    {friendsList
                      .filter((friend) => friend.status === 'pending')
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
      </View>
    </ScreenWrapper>
  );
};

export default Friends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: hp(3),
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
    borderRadius: hp(1.5),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: wp(4),
  },
  friendDetails: {
    flex: 1,
  },
  nameAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.5),
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  activeBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  statusText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  statText: {
    marginLeft: wp(1),
    fontSize: hp(1.8),
    color: theme.colors.grey,
  },
  actionButton: {
    padding: wp(2),
  },
});
