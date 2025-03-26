/*
Friends Functionality
// Add friend (pending -> active)
// Get friend list (username, coins, trophies)
*/

const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
const { auth, db } = require('../firebase/config');
const { getUid, getUserProfile, userExists } = require('./user.cjs');
import { Alert } from 'react-native';

class FriendService {
  // Add a new friend
  // TODO: handle friend requests
  async addFriend({ user2username }) {
    try {
      // Get curr user information
      const currUser = auth.currentUser;

      // Make sure user is logged in
      if (!currUser) {
        Alert.alert('Error', 'Please log in to add friends');
        throw new Error('User not authenticated');
      }

      const currUserProfile = await getUserProfile(currUser.uid);

      // Check if username exists
      const isValidUsername = await userExists({
        username: user2username.toLowerCase(),
      });

      if (!isValidUsername) {
        Alert.alert('Error', 'Username does not exist');
        return;
      } else if (
        currUserProfile.username.toLowerCase() === user2username.toLowerCase()
      ) {
        Alert.alert('Error', 'You cannot add yourself as a friend');
        return;
      }

      // Get uid of new friend
      const user2uid = await getUid({ username: user2username });

      // Check if already friends
      const user2Profile = await getUserProfile(user2uid);
      const alreadyFriends = currUserProfile.friends?.some(
        (friend) => friend.userId === user2uid && friend.status === 'active',
      );
      const pendingRequest = currUserProfile.friends?.some(
        (friend) => friend.userId === user2uid && friend.status === 'pending',
      );

      if (alreadyFriends) {
        Alert.alert('Error', 'You are already friends with this user');
        return;
      }

      if (pendingRequest) {
        Alert.alert('Error', 'Friend request already pending');
        return;
      }

      // Add friend to current user's list
      const currUserDocRef = doc(db, 'users', currUser.uid);
      await updateDoc(currUserDocRef, {
        friends: arrayUnion({ userId: user2uid, status: 'pending' }),
      });

      // Add current user to friend's list
      const user2DocRef = doc(db, 'users', user2uid);
      await updateDoc(user2DocRef, {
        friends: arrayUnion({ userId: currUser.uid, status: 'pending' }),
      });

      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    }
  }

  // Get list of friends for current user
  // Returns: [{uid, username, coins, trophies}, {...}, ...]
  async getFriendList(includeStatus = 'active') {
    try {
      const currUser = auth.currentUser;

      if (!currUser) {
        Alert.alert('Error', 'Please log in to view friends');
        throw new Error('User not authenticated.');
      }

      const currUserProfile = await getUserProfile(currUser.uid);

      // Get list of friends based on status
      const friendsList = currUserProfile.friends || [];
      let filteredFriends;
      if (includeStatus === 'all') {
        filteredFriends = friendsList;
      } else {
        filteredFriends = friendsList.filter(
          (friend) => friend.status === includeStatus,
        );
      }
      const userIds = filteredFriends.map((friend) => friend.userId);

      const friendInfo = await Promise.all(
        userIds.map(async (uid) => {
          if (!uid) {
            console.error('Skipping user with invalid UID:', uid);
            return null;
          }

          try {
            const profile = await getUserProfile(uid);
            const friendData = friendsList.find((f) => f.userId === uid);
            return {
              userId: uid,
              username: profile.username || 'Unknown',
              coins: profile.numCoins || 0,
              trophies: profile.trophies || 0,
              status: friendData.status,
            };
          } catch (error) {
            console.error(`Error fetching profile for user ${uid}:`, error);
            return null;
          }
        }),
      );

      // Filter out any null entries from failed profile fetches
      return friendInfo.filter((friend) => friend !== null);
    } catch (error) {
      console.error('Error getting friends list:', error);
      Alert.alert('Error', 'Failed to load friends list. Please try again.');
      return [];
    }
  }
}

module.exports = new FriendService();
