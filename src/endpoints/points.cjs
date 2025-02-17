/*
Points & Leaderboard
GET /groups/{group_id}/leaderboard → Retrieve the group leaderboard
GET /leaderboard/global → Retrieve the global leaderboard
GET /users/{user_id}/points-history → Retrieve point changes over time
PUT /users/{user_id}/adjust-points → Adjust user points (admin only)
GET /groups/{group_id}/bets/{bet_id}/results → Show bet results & winners

 */

const {
  doc,
  setDoc,
  getDoc,
  collection,
  updateDoc,
  increment,
} = require('firebase/firestore');
const { db } = require('../firebase/config');

class PointsService {
  // Initialize points for new user
  async initializePoints(userId) {
    try {
      const pointsRef = doc(db, 'points', userId);
      const timestamp = new Date().toISOString();

      const pointsData = {
        userId,
        balance: 1000, // Starting balance
        totalEarned: 0,
        totalSpent: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(pointsRef, pointsData);
      return pointsData;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's points
  async getPoints(userId) {
    try {
      const pointsDoc = await getDoc(doc(db, 'points', userId));
      if (!pointsDoc.exists()) {
        return await this.initializePoints(userId);
      }
      return pointsDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add points to user's balance
  async addPoints(userId, amount, reason = '') {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const pointsRef = doc(db, 'points', userId);
      const timestamp = new Date().toISOString();

      await updateDoc(pointsRef, {
        balance: increment(amount),
        totalEarned: increment(amount),
        updatedAt: timestamp,
      });

      // Log transaction
      await this._logTransaction(userId, 'credit', amount, reason);

      const updatedDoc = await getDoc(pointsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Deduct points from user's balance
  async deductPoints(userId, amount, reason = '') {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const pointsRef = doc(db, 'points', userId);
      const pointsDoc = await getDoc(pointsRef);

      if (!pointsDoc.exists()) {
        throw new Error('Points record not found');
      }

      const currentBalance = pointsDoc.data().balance;
      if (currentBalance < amount) {
        throw new Error('Insufficient points');
      }

      const timestamp = new Date().toISOString();

      await updateDoc(pointsRef, {
        balance: increment(-amount),
        totalSpent: increment(amount),
        updatedAt: timestamp,
      });

      // Log transaction
      await this._logTransaction(userId, 'debit', amount, reason);

      const updatedDoc = await getDoc(pointsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Transfer points between users
  async transferPoints(fromUserId, toUserId, amount, reason = '') {
    try {
      if (fromUserId === toUserId) {
        throw new Error('Cannot transfer points to self');
      }

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Deduct from sender
      await this.deductPoints(
        fromUserId,
        amount,
        `Transfer to ${toUserId}: ${reason}`,
      );

      // Add to receiver
      await this.addPoints(
        toUserId,
        amount,
        `Transfer from ${fromUserId}: ${reason}`,
      );

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Log points transaction
  async _logTransaction(userId, type, amount, reason = '') {
    try {
      const transactionRef = doc(collection(db, 'pointsTransactions'));
      const timestamp = new Date().toISOString();

      const transactionData = {
        id: transactionRef.id,
        userId,
        type,
        amount,
        reason,
        timestamp,
      };

      await setDoc(transactionRef, transactionData);
      return transactionData;
    } catch (error) {
      console.error('Error logging transaction:', error);
      // Don't throw error here as this is a secondary operation
    }
  }

  // Error handler
  _handleError(error) {
    console.error('PointsService Error:', error);
    throw new Error(error.message || 'An error occurred in PointsService');
  }
}

module.exports = new PointsService();
