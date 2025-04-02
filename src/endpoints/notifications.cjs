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
  serverTimestamp,
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
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        };
      });
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create a new notification
  async createNotification({ userId, type, title, message, data = {} }) {
    try {
      const timestamp = serverTimestamp();
      const notification = {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await addDoc(
        collection(db, 'notifications'),
        notification,
      );

      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create a bet expiration notification
  async createBetExpirationNotification(userId, betId, betTitle, expiresIn) {
    return this.createNotification({
      userId,
      type: 'bet_expiring',
      title: `Bet "${betTitle}" expires in ${expiresIn}`,
      message: 'Make sure to place your vote before it expires!',
      data: { betId, expiresIn },
    });
  }

  // Create a new bet notification
  async createNewBetNotification(
    userId,
    betId,
    creatorName,
    betTitle,
    groupName,
  ) {
    return this.createNotification({
      userId,
      type: 'new_bet',
      title: `New bet in ${groupName}: "${betTitle}"`,
      message: `${creatorName} created a new bet. Check it out!`,
      data: { betId, creatorName, groupName },
    });
  }

  // Create a bet result notification
  async createBetResultNotification(
    userId,
    betId,
    betTitle,
    result,
    winnings = null,
  ) {
    const message = winnings
      ? `Congratulations! You won ${winnings} coins!`
      : 'The results are in!';

    return this.createNotification({
      userId,
      type: 'bet_result',
      title: `Results for "${betTitle}"`,
      message,
      data: { betId, result, winnings },
    });
  }

  // Create a bet vote reminder notification
  async createBetVoteReminderNotification(userId, betId, betTitle, timeLeft) {
    return this.createNotification({
      userId,
      type: 'vote_reminder',
      title: `Don't forget to vote on "${betTitle}"`,
      message: `Only ${timeLeft} left to place your vote!`,
      data: { betId, timeLeft },
    });
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

  // Create a friend request notification
  async createFriendRequestNotification(userId, requesterId, requesterName) {
    return this.createNotification({
      userId,
      type: 'friend_request',
      title: `${requesterName} sent you a friend request`,
      message: 'Tap to accept or decline the request',
      data: { requesterId, requesterName },
    });
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
