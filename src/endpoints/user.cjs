/*
User Profile
GET /users/{user_id} → Retrieve user profile info
PUT /users/{user_id} → Update user profile (username, email, etc.)
DELETE /users/{user_id} → Delete user account
GET /users/{user_id}/points → Retrieve current points balance
GET /users/{user_id}/leaderboard-rank → Get user’s rank on the leaderboard
GET /users/{user_id}/history → Get user’s betting history
GET /users/{user_id}/notifications → Retrieve unread notifications
GET /users/{username} -> Retrieve uid from username
we are using firebase for the db
 */

// services/userService.js
const {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} = require('firebase/firestore');
const { deleteUser } = require('firebase/auth');
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require('firebase/storage');
const { db, auth } = require('../firebase/config');

class UserService {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      return {
        ...userData,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update user profile
  async updateUserProfile({ userId, updateData }) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      // If username is being updated, check availability
      if (
        updateData.username &&
        updateData.username !== userDoc.data().username
      ) {
        const isUsernameAvailable = await this._checkUsernameAvailability(
          updateData.username,
          userId,
        );
        if (!isUsernameAvailable) {
          throw new Error('Username is already taken');
        }
      }

      // same for email
      if (updateData.email && updateData.email !== userDoc.data().email) {
        const isEmailAvailable = await this._checkEmailAvailability(
          updateData.email,
          userId,
        );
        if (!isEmailAvailable) {
          throw new Error('Email is already taken');
        }
      }

      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      return {
        id: userId,
        ...updateData,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete user account
  async deleteUserAccount(userId) {
    try {
      // Delete from Authentication
      const user = auth.currentUser;
      if (user && user.uid === userId) {
        await deleteUser(user);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));

      // Clean up related data
      await this._cleanupUserData(userId);

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user points balance
  async getUserPoints(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const pointsDoc = await getDoc(doc(db, 'points', userId));
      return {
        currentBalance: pointsDoc.exists() ? pointsDoc.data().balance : 0,
        lastUpdated: pointsDoc.exists() ? pointsDoc.data().lastUpdated : null,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's leaderboard rank
  async getUserLeaderboardRank(userId) {
    try {
      // Get user's points
      const pointsDoc = await getDoc(doc(db, 'points', userId));
      const userPoints = pointsDoc.exists() ? pointsDoc.data().balance : 0;

      // Count users with more points
      const higherRankedQuery = query(
        collection(db, 'points'),
        where('balance', '>', userPoints),
        orderBy('balance', 'desc'),
      );
      const higherRankedSnapshot = await getDocs(higherRankedQuery);

      return {
        rank: higherRankedSnapshot.size + 1,
        points: userPoints,
        totalUsers: await this._getTotalUsersCount(),
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's betting history
  async getUserBettingHistory(userId, options = { limit: 10, offset: 0 }) {
    try {
      const historyQuery = query(
        collection(db, 'bets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(options.limit),
      );

      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return history;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's notifications
  async getUserNotifications(userId, onlyUnread = true) {
    try {
      let notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      );

      if (onlyUnread) {
        notificationsQuery = query(
          notificationsQuery,
          where('read', '==', false),
        );
      }

      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return notifications;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get UID from username
  async getUid({ username }) {
    try {
      const usersRef = collection(db, 'users'); // Reference to users collection
      const q = query(usersRef, where('username', '==', username)); // Query where username matches

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('No user found with username:', username);
        return null;
      }

      const userDoc = querySnapshot.docs[0]; // Assuming username is unique
      console.log('User found:', userDoc.id, userDoc.data());

      return userDoc.id;
    } catch (error) {
      console.error('Error fetching UID:', error);
      return null;
    }
  }

  // Check user exists based on username
  async userExists({ username }) {
    const userQuery = query(
      collection(db, 'users'),
      where('username', '==', username),
    );
    const querySnapshot = await getDocs(userQuery);
    return !userQuery.empty;
  }

  // Helper method to check username availability
  async _checkUsernameAvailability(username, currentUserId) {
    const userQuery = query(
      collection(db, 'users'),
      where('username', '==', username),
    );
    const querySnapshot = await getDocs(userQuery);

    // Username is available if no documents exist or if the only document is the current user
    return (
      querySnapshot.empty ||
      (querySnapshot.size === 1 && querySnapshot.docs[0].id === currentUserId)
    );
  }

  // Helper method to clean up user data
  async _cleanupUserData(userId) {
    // Delete user's points
    await deleteDoc(doc(db, 'points', userId));

    // Delete user's notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const deletePromises = notificationsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref),
    );
    await Promise.all(deletePromises);

    // Note: You might want to handle bets differently (archive instead of delete)
  }

  // Helper method to get total users count
  async _getTotalUsersCount() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.size;
  }

  // Error handler
  _handleError(error) {
    let message = error;

    if (error.code === 'permission-denied') {
      message = 'You do not have permission to perform this action.';
    } else if (error.code === 'not-found') {
      message = 'Requested resource was not found.';
    }

    throw new Error(message);
  }

  async _checkEmailAvailability(email, userId) {
    const userQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
    );
    const querySnapshot = await getDocs(userQuery);

    // Email is available if no documents exist or if the only document is the current user
    return (
      querySnapshot.empty ||
      (querySnapshot.size === 1 && querySnapshot.docs[0].id === userId)
    );
  }
}

module.exports = new UserService();
