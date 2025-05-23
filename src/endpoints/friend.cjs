/*
Friends Functionality
// Add friend (pending -> active)
// Get friend list (username, coins, trophies)
*/

const { doc, updateDoc, arrayUnion, getDoc } = require('firebase/firestore');
const { auth, db } = require('../firebase/config');
const { getUid, getUserProfile, userExists } = require('./user.cjs');
import { Alert } from 'react-native';
const NotificationsService = require('./notifications.cjs');

class FriendService {
  // Add a new friend
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
        friends: arrayUnion({
          userId: user2uid,
          status: 'pending',
          direction: 'sent',
        }),
      });

      // Add current user to friend's list
      const user2DocRef = doc(db, 'users', user2uid);
      await updateDoc(user2DocRef, {
        friends: arrayUnion({
          userId: currUser.uid,
          status: 'pending',
          direction: 'recieved',
        }),
      });

      // Create notification for the recipient
      await NotificationsService.createFriendRequestNotification(
        user2uid,
        currUser.uid,
        currUserProfile.username,
      );

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
              direction: friendData.direction || '',
              profilePicture: profile.profilePicture || null,
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

  // Accept friend request
  async acceptFriendRequest({ user2username }) {
    try {
      // Get curr user information
      const currUser = auth.currentUser;

      // Make sure user is logged in
      if (!currUser) {
        Alert.alert('Error', 'Please log in to add friends');
        throw new Error('User not authenticated');
      }

      // Find user in friends list and change status from pending to active
      const currUserProfile = await getUserProfile(currUser.uid);
      const user2uid = await getUid({ username: user2username.toLowerCase() });

      // Check if the friend request exists
      const incomingRequest = currUserProfile.friends?.find(
        (friend) =>
          friend.userId === user2uid &&
          friend.status === 'pending' &&
          friend.direction === 'recieved',
      );

      if (!incomingRequest) {
        Alert.alert('Error', 'No friend request from this user');
        return;
      }

      // Update current user's friend entry
      const updatedCurrFriends = currUserProfile.friends.map((friend) => {
        if (friend.userId === user2uid) {
          return { ...friend, status: 'active' };
        }
        return friend;
      });

      const currUserDocRef = doc(db, 'users', currUser.uid);
      await updateDoc(currUserDocRef, {
        friends: updatedCurrFriends,
      });

      // Update user2's friend entry
      const user2Profile = await getUserProfile(user2uid);
      const updatedUser2Friends = user2Profile.friends.map((friend) => {
        if (friend.userId === currUser.uid) {
          return { ...friend, status: 'active' };
        }
        return friend;
      });

      const user2DocRef = doc(db, 'users', user2uid);
      await updateDoc(user2DocRef, {
        friends: updatedUser2Friends,
      });

      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert(
        'Error',
        'Failed to accept friend request. Please try again.',
      );
    }
  }

  // Get friendship status between two users
  async getFriendshipStatus(user1uid, user2uid) {
    try {
      const user1Profile = await getUserProfile(user1uid);
      const user2Profile = await getUserProfile(user2uid);

      const user1Friends = user1Profile.friends || [];
      const user2Friends = user2Profile.friends || [];

      const user1FriendStatus = user1Friends.find(
        (friend) => friend.userId === user2uid,
      );
      const user2FriendStatus = user2Friends.find(
        (friend) => friend.userId === user1uid,
      );

      if (user1FriendStatus && user2FriendStatus) {
        return 'active';
      } else if (user1FriendStatus) {
        return 'pending';
      } else if (user2FriendStatus) {
        return 'recieved';
      } else {
        return 'none';
      }
    } catch (error) {
      console.error('Error getting friendship status:', error);
      return 'error';
    }
  }

  // Decline friend request
  async declineFriendRequest({ user2username }) {
    try {
      const currUser = auth.currentUser;
      if (!currUser) {
        Alert.alert('Error', 'Please log in to decline friend requests');
        throw new Error('User not authenticated');
      }

      const user2uid = await getUid({ username: user2username });
      if (!user2uid) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Remove friend request from current user's list
      const currUserRef = doc(db, 'users', currUser.uid);
      const currUserDoc = await getDoc(currUserRef);
      const currUserFriends = currUserDoc.data().friends || [];

      const updatedCurrFriends = currUserFriends.filter(
        (friend) =>
          !(friend.userId === user2uid && friend.status === 'pending'),
      );

      await updateDoc(currUserRef, { friends: updatedCurrFriends });

      // Remove friend request from other user's list
      const user2Ref = doc(db, 'users', user2uid);
      const user2Doc = await getDoc(user2Ref);
      const user2Friends = user2Doc.data().friends || [];

      const updatedUser2Friends = user2Friends.filter(
        (friend) =>
          !(friend.userId === currUser.uid && friend.status === 'pending'),
      );

      await updateDoc(user2Ref, { friends: updatedUser2Friends });

      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  }

  // Cancel sent friend request
  async cancelFriendRequest({ user2username }) {
    try {
      const currUser = auth.currentUser;
      if (!currUser) {
        Alert.alert('Error', 'Please log in to cancel friend requests');
        throw new Error('User not authenticated');
      }

      const user2uid = await getUid({ username: user2username });
      if (!user2uid) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Remove friend request from current user's list
      const currUserRef = doc(db, 'users', currUser.uid);
      const currUserDoc = await getDoc(currUserRef);
      const currUserFriends = currUserDoc.data().friends || [];

      const updatedCurrFriends = currUserFriends.filter(
        (friend) =>
          !(friend.userId === user2uid && friend.status === 'pending'),
      );

      await updateDoc(currUserRef, { friends: updatedCurrFriends });

      // Remove friend request from other user's list
      const user2Ref = doc(db, 'users', user2uid);
      const user2Doc = await getDoc(user2Ref);
      const user2Friends = user2Doc.data().friends || [];

      const updatedUser2Friends = user2Friends.filter(
        (friend) =>
          !(friend.userId === currUser.uid && friend.status === 'pending'),
      );

      await updateDoc(user2Ref, { friends: updatedUser2Friends });

      Alert.alert('Success', 'Friend request canceled');
    } catch (error) {
      console.error('Error canceling friend request:', error);
      Alert.alert('Error', 'Failed to cancel friend request');
    }
  }
}
module.exports = new FriendService();
