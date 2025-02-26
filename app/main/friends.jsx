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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { hp } from '../../helpers/common';
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

  // Fetch friends list when the component mounts
  useEffect(() => {
    const fetchFriends = async () => {
      const friends = await FriendService.getFriendList();
      setFriendsList(friends);
    };

    fetchFriends();
  }, []);

  const addFriend = async ({ username }) => {
    // Just an example with set username
    await FriendService.addFriend({
      user2username: username,
    });

    // Refresh friend list after adding a friend
    const updatedFriends = await FriendService.getFriendList();
    setFriendsList(updatedFriends);
  };

  const handleAddFriend = (username) => {
    console.log('Adding friend:', username);
    FriendService.addFriend({
      user2username: username,
    });
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header 
          title="Friends page" 
          showBackButton={true}
          rightComponent={
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon
                name="plus-square"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
              <Text style={styles.actionText}>Add a friend</Text>
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Print each friend's info */}
          {friendsList.length === 0 ? (
            <Text>No friends found (sad face)</Text>
          ) : (
            friendsList.map((friend, index) => (
              <Text key={index}>
                {friend.username} - Coins: {friend.coins}, Trophies:{' '}
                {friend.trophies}
              </Text>
            ))
          )}

          {/* AddFriendModal usage */}
          <AddFriendModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onAdd={handleAddFriend}
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default Friends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingVertical: 20,
  },
});
