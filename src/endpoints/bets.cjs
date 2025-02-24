/*
Bets
GET /groups/{group_id}/bets → Get all bets within a group
POST /groups/{group_id}/bets → Create a new bet
GET /groups/{group_id}/bets/{bet_id} → Retrieve details of a bet
PUT /groups/{group_id}/bets/{bet_id} → Edit bet details (before expiry)
DELETE /groups/{group_id}/bets/{bet_id} → Delete a bet (before expiry)
POST /groups/{group_id}/bets/{bet_id}/join → Join a bet
POST /groups/{group_id}/bets/{bet_id}/answer → Submit an answer (if allowed)
PUT /groups/{group_id}/bets/{bet_id}/lock → Lock betting once expiry is reached
PUT /groups/{group_id}/bets/{bet_id}/resolve → Resolve the bet and distribute points
GET /groups/{group_id}/bets/{bet_id}/comments → Retrieve comments on a bet
POST /groups/{group_id}/bets/{bet_id}/comments → Comment on a bet
POST /groups/{group_id}/bets/{bet_id}/reactions → React to a bet


 */

const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  Timestamp,
} = require('firebase/firestore');
const { db } = require('../firebase/config');

class BetsService {
  // Get all bets in a group
  async getGroupBets(groupId) {
    try {
      const betsQuery = query(
        collection(db, 'bets'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc'),
      );

      const betsSnapshot = await getDocs(betsQuery);
      return betsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create a new bet
  async createBet({
    creatorId,
    question,
    wagerAmount,
    answerOptions,
    expiresAt,
    groupId = null,
  }) {
    try {
      const betRef = doc(collection(db, 'bets'));
      const timestamp = new Date().toISOString();

      // Validate answer options
      if (!Array.isArray(answerOptions) || answerOptions.length < 2) {
        throw new Error('Bet must have at least 2 answer options');
      }

      // validate wager amount is a number
      if (typeof wagerAmount !== 'number' || wagerAmount <= 0) {
        throw new Error('Wager amount must be a positive number');
      }

      // validate expiresAt is a date and in the future
      if (typeof expiresAt !== 'string' || new Date(expiresAt) < new Date()) {
        throw new Error('Expires at must be a future date');
      }

      // Format answer options with IDs
      const formattedOptions = answerOptions.map((option, index) => ({
        id: `option_${index + 1}`,
        text: option,
        participants: [],
      }));

      const betData = {
        id: betRef.id,
        creatorId,
        question,
        wagerAmount,
        answerOptions: formattedOptions,
        status: 'open', // open -> locked -> completed
        createdAt: timestamp,
        updatedAt: timestamp,
        expiresAt, // When betting closes
        resultReleasedAt: null, // When result was released
        participants: [],
        groupId,
        winningOptionId: null,
        totalPool: 0, // Total points wagered
      };

      await setDoc(betRef, betData);

      // If this is a group bet, update the group's bets array
      if (groupId) {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          bets: arrayUnion(betRef.id),
          updatedAt: timestamp,
        });
      }

      return betData;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet by ID
  async getBet(betId) {
    try {
      const betDoc = await getDoc(doc(db, 'bets', betId));
      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }
      return betDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's bets
  async getUserBets(userId, status = null) {
    try {
      let betQuery = query(
        collection(db, 'bets'),
        where('participants', 'array-contains', userId),
      );

      if (status) {
        betQuery = query(betQuery, where('status', '==', status));
      }

      const querySnapshot = await getDocs(betQuery);
      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update bet
  async updateBet(betId, updateData) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        ...updateData,
        updatedAt: timestamp,
      };

      await updateDoc(betRef, updates);

      // Get updated bet data
      const updatedDoc = await getDoc(betRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Place a bet
  async placeBet(betId, userId, optionId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();

      // Validate bet status
      if (betData.status !== 'open') {
        throw new Error('Bet is no longer accepting wagers');
      }

      // Check if bet has expired
      if (new Date(betData.expiresAt) < new Date()) {
        // Auto-lock the bet if it has expired
        await this.lockBet(betId);
        throw new Error('Bet has expired');
      }

      // Validate option exists
      const selectedOption = betData.answerOptions.find(
        (opt) => opt.id === optionId,
      );
      if (!selectedOption) {
        throw new Error('Invalid answer option');
      }

      // Check if user has already placed a bet
      const hasExistingBet = betData.answerOptions.some((opt) =>
        opt.participants.includes(userId),
      );
      if (hasExistingBet) {
        throw new Error('You have already placed a bet');
      }

      // Get user's points balance
      const pointsDoc = await getDoc(doc(db, 'points', userId));
      const currentBalance = pointsDoc.exists() ? pointsDoc.data().balance : 0;

      // Check if user has enough points
      if (currentBalance < betData.wagerAmount) {
        throw new Error('Insufficient points balance');
      }

      const timestamp = new Date().toISOString();

      // Update bet with new participant
      const updatedOptions = betData.answerOptions.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              participants: [...opt.participants, userId],
              totalWager: (opt.totalWager || 0) + betData.wagerAmount,
            }
          : opt,
      );

      // Deduct points from user
      await updateDoc(doc(db, 'points', userId), {
        balance: increment(-betData.wagerAmount),
        lastUpdated: timestamp,
      });

      // Update bet document
      await updateDoc(betRef, {
        answerOptions: updatedOptions,
        totalPool: increment(betData.wagerAmount),
        participants: arrayUnion(userId),
        updatedAt: timestamp,
      });

      return {
        success: true,
        message: 'Bet placed successfully',
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Lock bet (called automatically when bet expires)
  async lockBet(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();
      if (betData.status !== 'open') {
        throw new Error('Bet is not in open status');
      }

      const timestamp = new Date().toISOString();
      await updateDoc(betRef, {
        status: 'locked',
        updatedAt: timestamp,
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Release result and distribute points
  async releaseResult(betId, creatorId, winningOptionId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();

      // Validate creator
      if (betData.creatorId !== creatorId) {
        throw new Error('Only the bet creator can release results');
      }

      // Validate bet status
      if (betData.status !== 'locked') {
        throw new Error('Bet must be locked before releasing results');
      }

      // Validate winning option
      const winningOption = betData.answerOptions.find(
        (opt) => opt.id === winningOptionId,
      );
      if (!winningOption) {
        throw new Error('Invalid winning option');
      }

      const timestamp = new Date().toISOString();

      // Calculate winnings
      const winners = winningOption.participants;
      const totalWinners = winners.length;
      const totalPool = betData.totalPool;

      if (totalWinners > 0) {
        const winningsPerPerson = Math.floor(totalPool / totalWinners);

        // Distribute winnings to winners
        const distributionPromises = winners.map(async (winnerId) => {
          const userRef = doc(db, 'points', winnerId);
          await updateDoc(userRef, {
            balance: increment(winningsPerPerson),
            lastUpdated: timestamp,
          });

          // Add to user's history
          const historyRef = doc(collection(db, 'pointHistory'));
          await setDoc(historyRef, {
            userId: winnerId,
            amount: winningsPerPerson,
            type: 'bet_win',
            betId: betId,
            description: `Won bet: ${betData.question}`,
            createdAt: timestamp,
          });
        });

        await Promise.all(distributionPromises);
      }

      // Update bet status
      await updateDoc(betRef, {
        status: 'completed',
        winningOptionId,
        resultReleasedAt: timestamp,
        updatedAt: timestamp,
        winningsPerPerson:
          totalWinners > 0 ? Math.floor(totalPool / totalWinners) : 0,
      });

      return {
        success: true,
        message: 'Results released and points distributed',
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet results
  async getBetResults(betId) {
    try {
      const betDoc = await getDoc(doc(db, 'bets', betId));
      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();
      if (betData.status !== 'completed') {
        throw new Error('Results not yet available');
      }

      const winningOption = betData.answerOptions.find(
        (opt) => opt.id === betData.winningOptionId,
      );

      return {
        betId,
        title: betData.title,
        totalPool: betData.totalPool,
        winningOption: {
          id: winningOption.id,
          text: winningOption.text,
          winners: winningOption.participants,
          winningsPerPerson: Math.floor(
            betData.totalPool / winningOption.participants.length,
          ),
        },
        resultReleasedAt: betData.resultReleasedAt,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet statistics
  async getBetStats(betId) {
    try {
      const betDoc = await getDoc(doc(db, 'bets', betId));
      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();
      const totalParticipants = betData.answerOptions.reduce(
        (sum, opt) => sum + opt.participants.length,
        0,
      );

      return {
        betId,
        title: betData.title,
        totalPool: betData.totalPool,
        totalParticipants,
        optionStats: betData.answerOptions.map((opt) => ({
          id: opt.id,
          text: opt.text,
          participantCount: opt.participants.length,
          percentage:
            totalParticipants > 0
              ? (opt.participants.length / totalParticipants) * 100
              : 0,
        })),
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete bet
  async deleteBet(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();

      // If this is a group bet, update the group's bets array
      if (betData.groupId) {
        const groupRef = doc(db, 'groups', betData.groupId);
        await updateDoc(groupRef, {
          bets: arrayRemove(betId),
          updatedAt: new Date().toISOString(),
        });
      }

      await deleteDoc(betRef);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet comments with user details
  async getBetComments(betId) {
    try {
      const commentsQuery = query(
        collection(db, 'betComments'),
        where('betId', '==', betId),
        orderBy('createdAt', 'desc'),
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      return commentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add comment with user details
  async addComment(groupId, betId, userId, content) {
    try {
      // Get user details
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      const comment = {
        betId,
        userId,
        username: userData.username,
        profilePicture: userData.profilePicture,
        content,
        createdAt: new Date().toISOString(),
      };

      const commentRef = await addDoc(collection(db, 'betComments'), comment);

      // Update bet with comment count
      await updateDoc(doc(db, 'bets', betId), {
        commentCount: increment(1),
        updatedAt: new Date().toISOString(),
      });

      return {
        id: commentRef.id,
        ...comment,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add reaction with user details
  async addReaction(groupId, betId, userId, reaction) {
    try {
      const betRef = doc(db, 'bets', betId);
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const timestamp = new Date().toISOString();

      // Remove any existing reaction from this user
      await updateDoc(betRef, {
        reactions: arrayRemove({
          userId,
          username: userData.username,
        }),
      });

      // Add new reaction
      await updateDoc(betRef, {
        reactions: arrayUnion({
          userId,
          username: userData.username,
          reaction,
          createdAt: timestamp,
        }),
        updatedAt: timestamp,
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Error handler
  _handleError(error) {
    console.error('BetsService Error:', error);
    throw new Error(error.message || 'An error occurred in BetsService');
  }
}

module.exports = new BetsService();
