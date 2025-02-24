/**
 * Friends page -- VERY rough draft
 * Mostly to test friends functionality
 */

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native';
import FriendService from '../../src/endpoints/friend.cjs';

const Friends = () => {
  const navigation = useNavigation();
  const [friendsList, setFriendsList] = useState([]);

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
      user2username: 'tester1',
    });

    // Refresh friend list after adding a friend
    const updatedFriends = await FriendService.getFriendList();
    setFriendsList(updatedFriends);
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Friends page" showBackButton={true} />
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

          <Button onPress={addFriend} title="Add Friend" />
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
