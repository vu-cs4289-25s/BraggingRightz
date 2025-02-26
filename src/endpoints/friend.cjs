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

      // Makure sure user is logged in
      if (!currUser) {
        console.log('');
        throw new Error('User not authenticated');
      }

      const currUserProfile = await getUserProfile(currUser.uid);

      // TODO: delete
      console.log(
        'User: ',
        currUserProfile.username,
        ' adding ',
        user2username,
        '...',
      );

      // Check if username exists
      const isValidUsername = await userExists({
        username: user2username.toLowerCase(),
      });

      // TODO: add alert
      // TODO: try again logic
      if (!isValidUsername) {
        // Invalid friend request
        console.log('Username does not exist');
        Alert.alert('Error', 'Username does not exist');
        return;
      } else if (currUser.username == user2username) {
        console.log('Can not add yourself as a friend');
        Alert.alert('Error', 'Can not add yourself as a friend');
        return;
      } else {
        // Valid friend request
        // Add friend to current user's list

        // Get user2 information
        const user2uid = await getUid({
          username: user2username.toLowerCase(),
        });

        const currUserDocRef = doc(db, 'users', currUser.uid);
        await updateDoc(currUserDocRef, {
          friends: arrayUnion({ userId: user2uid, status: 'pending' }),
        });

        // Add current user to friend's list
        const user2DocRef = doc(db, 'users', user2uid);
        await updateDoc(user2DocRef, {
          friends: arrayUnion({ userId: currUser.uid, status: 'pending' }),
        });
      }
    } catch (error) {
      // TODO: handle error
      console.log('ERROR ADDING FRIEND: ', error);
    }
  }

  // Get list of friends fro current user
  // Returns: [{uid, username, coins, trophies}, {...}, ...]
  async getFriendList() {
    try {
      // Get curr user information
      const currUser = auth.currentUser;

      // Check current user is logged in
      if (!currUser) {
        console.log('User must be logged in');
        throw new Error('User not authenticated.');
      }

      // Get user profile
      const currUserProfile = await getUserProfile(currUser.uid);

      // Get list of uid's of friends
      const friendsList = currUserProfile.friends;
      const userIds = await friendsList.map((friend) => friend.userId);

      // TODO: DELETE
      console.log('Friends List:', friendsList);

      const friendInfo = await Promise.all(
        userIds.map(async (uid) => {
          // Make sure valid uid
          if (!uid) {
            console.error('Skipping user with invalid UID:', uid);
            return null;
          }

          const profile = await getUserProfile(uid); // Fetch friend's profile

          if (!profile) {
            console.error(`No profile found for UID: ${uid}`);
            return null;
          }

          return {
            userId: uid,
            username: profile.username || 'Unknown', // Ensure a default value
            coins: profile.numCoins || 0, // Default to 0 if missing
            trophies: profile.trophies || 0, // Default to 0 if missing
          };
        }),
      );

      return friendInfo.filter((friend) => friend !== null);
    } catch (error) {
      console.log('ERROR GETTING FRIENDS LIST: ', error);
    }
  }
}

module.exports = new FriendService();
