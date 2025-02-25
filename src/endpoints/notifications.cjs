const {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
} = require('firebase/firestore');
const { db } = require('../firebase/config');

class NotificationsService {
  // Get user's notifications
  async getNotifications(userId, filter = 'all') {
    try {
      let notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50),
      );

      if (filter !== 'all') {
        notificationsQuery = query(
          notificationsQuery,
          where('type', '==', filter),
        );
      }

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
      );

      const snapshot = await getDocs(notificationsQuery);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          read: true,
          updatedAt: Timestamp.now(),
        }),
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create a new notification
  async createNotification({ userId, type, title, message, data = {} }) {
    try {
      const notification = {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, 'notifications'),
        notification,
      );
      return {
        id: docRef.id,
        ...notification,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
      );

      const snapshot = await getDocs(unreadQuery);
      return snapshot.size;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create a bet expiration notification
  async createBetExpirationNotification(userId, betId, betTitle, expiresIn) {
    return this.createNotification({
      userId,
      type: 'expiring',
      title: `Bet "${betTitle}" expires in ${expiresIn}`,
      message: 'Make sure to complete your bet before it expires!',
      data: { betId, expiresIn },
    });
  }

  // Create a new bet notification
  async createNewBetNotification(userId, betId, creatorName, betTitle) {
    return this.createNotification({
      userId,
      type: 'bets',
      title: `${creatorName} created a new bet: "${betTitle}"`,
      message: 'Check out the new bet and join in!',
      data: { betId, creatorName },
    });
  }

  // Create a new comment notification
  async createNewCommentNotification(userId, betId, commenterName, betTitle) {
    return this.createNotification({
      userId,
      type: 'comments',
      title: `${commenterName} commented on "${betTitle}"`,
      message: 'See what they said about your bet',
      data: { betId, commenterName },
    });
  }

  // Create a friend request notification
  async createFriendRequestNotification(userId, requesterId, requesterName) {
    return this.createNotification({
      userId,
      type: 'follows',
      title: `${requesterName} sent you a friend request`,
      message: 'Tap to accept or decline the request',
      data: { requesterId, requesterName },
    });
  }

  // Create a bet result notification
  async createBetResultNotification(userId, betId, betTitle, result) {
    return this.createNotification({
      userId,
      type: 'bets',
      title: `Results are in for "${betTitle}"`,
      message: `The bet has been ${result}`,
      data: { betId, result },
    });
  }

  // Create a group invitation notification
  async createGroupInviteNotification(userId, groupId, groupName, inviterName) {
    return this.createNotification({
      userId,
      type: 'groups',
      title: `${inviterName} invited you to join ${groupName}`,
      message: 'Tap to view the group invitation',
      data: { groupId, inviterName },
    });
  }

  // Get notifications by type
  async getNotificationsByType(userId, type) {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(20),
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get recent notifications
  async getRecentNotifications(userId, limit = 5) {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit),
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    console.error('NotificationsService Error:', error);
    throw new Error(
      error.message || 'An error occurred in NotificationsService',
    );
  }
}

module.exports = new NotificationsService();
