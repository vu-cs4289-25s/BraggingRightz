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
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  serverTimestamp,
} = require('firebase/firestore');
const { db } = require('../firebase/config');
const NotificationsService = require('./notifications.cjs');
const GroupsService = require('./groups.cjs');
const UserService = require('./user.cjs');

class BetsService {
  constructor() {
    // Initialize any necessary properties
  }

  async getGroupBets(groupId) {
    try {
      const q = query(
        collection(db, 'bets'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc'),
      );
      const querySnapshot = await getDocs(q);
      const bets = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        bets.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        });
      }

      return bets;
    } catch (error) {
      console.error('Error getting group bets:', error);
      throw error;
    }
  }

  async getBet(betId) {
    try {
      const betDoc = await getDoc(doc(db, 'bets', betId));
      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const data = betDoc.data();
      return {
        id: betDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      };
    } catch (error) {
      console.error('Error getting bet:', error);
      throw error;
    }
  }

  async createBet({
    creatorId,
    question,
    wagerAmount,
    answerOptions,
    expiresAt,
    groupId = null,
  }) {
    try {
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
        totalWager: 0,
      }));

      const betRef = doc(collection(db, 'bets'));
      const betData = {
        id: betRef.id,
        creatorId,
        question,
        wagerAmount,
        answerOptions: formattedOptions,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt,
        resultReleasedAt: null,
        participants: [],
        groupId,
        totalWager: 0,
      };

      await setDoc(betRef, betData);
      return betData;
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  }

  async updateBet(betId, updateData) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const updates = {
        ...updateData,
        updatedAt: new Date(),
      };

      await updateDoc(betRef, updates);

      // Get updated bet data
      const updatedDoc = await getDoc(betRef);
      return {
        id: betId,
        ...updatedDoc.data(),
      };
    } catch (error) {
      console.error('Error updating bet:', error);
      throw error;
    }
  }

  async lockBet(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const bet = betDoc.data();
      const timestamp = serverTimestamp();

      await updateDoc(betRef, {
        status: 'locked',
        updatedAt: timestamp,
      });

      // Auto-complete bet if no participants voted
      const noParticipants = bet.answerOptions.every(
        (opt) => !opt.participants || opt.participants.length === 0
      );

      if (noParticipants) {
        await updateDoc(betRef, {
          status: 'completed',
          updatedAt: timestamp,
        });
      }

      // Notify all participants that the bet is locked
      const usersToNotify = new Set();
      usersToNotify.add(bet.creatorId);

      // Add all participants from each option
      bet.answerOptions.forEach((option) => {
        option.participants.forEach((id) => usersToNotify.add(id));
      });

      // TODO: change bet status to completed if no participants have placed a bet

      // Send notifications
      for (const userId of usersToNotify) {
        await NotificationsService.createNotification({
          userId,
          type: 'bet_locked',
          title: 'Bet Locked',
          message: `The bet "${bet.question}" has been locked. Waiting for results.`,
          data: { betId },
        });
      }

      return true;
    } catch (error) {
      console.error('Error locking bet:', error);
      throw error;
    }
  }

  async deleteBet(betId) {
    try {
      await deleteDoc(doc(db, 'bets', betId));
    } catch (error) {
      console.error('Error deleting bet:', error);
      throw error;
    }
  }

  // Check and update bet status
  async checkAndUpdateBetStatus(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const bet = betDoc.data();
      const now = new Date();
      const expiresAt = new Date(bet.expiresAt);

      if (bet.status === 'open' && now > expiresAt) {
        await this.lockBet(betId);
        return 'locked';
      }

      return bet.status;
    } catch (error) {
      console.error('Error checking bet status:', error);
      throw error;
    }
  }

  // Release result and distribute coins
  async releaseResult(betId, userId, winningOptionId, winningsPerPerson) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const bet = betDoc.data();

      // Verify user is creator
      if (bet.creatorId !== userId) {
        throw new Error('Only the bet creator can release results');
      }

      // Verify bet is locked
      if (bet.status !== 'locked') {
        throw new Error('Bet must be locked before releasing results');
      }

      // Find winning option
      const winningOption = bet.answerOptions.find(
        (opt) => opt.id === winningOptionId,
      );
      if (!winningOption) {
        throw new Error('Invalid winning option');
      }

      const winners = winningOption.participants;

      // If no one won, refund everyone's wager
      if (winners.length === 0) {
        const allParticipants = bet.answerOptions.flatMap(
          (opt) => opt.participants,
        );
        const refundPromises = allParticipants.map(async (participantId) => {
          const userRef = doc(db, 'users', participantId);
          await updateDoc(userRef, {
            numCoins: increment(bet.wagerAmount),
          });

          // Notify about refund
          await NotificationsService.createNotification({
            userId: participantId,
            type: 'bets',
            title: 'Bet Refunded',
            message: `No winners in "${bet.question}". Your ${bet.wagerAmount} coins have been refunded.`,
            data: { betId },
          });
        });

        await Promise.all(refundPromises);
      } else {
        // Update winners' coins and award trophies
        const updatePromises = winners.map(async (winnerId) => {
          const userRef = doc(db, 'users', winnerId);
          await updateDoc(userRef, {
            numCoins: increment(winningsPerPerson),
            trophies: increment(1),
            braggingRights: increment(1),
          });

          // Notify winners
          await NotificationsService.createNotification({
            userId: winnerId,
            type: 'bets',
            title: 'You won the bet! 🏆',
            message: `Congratulations! You won ${winningsPerPerson} coins and a trophy in "${bet.question}"`,
            data: { betId, winnings: winningsPerPerson },
          });
        });

        await Promise.all(updatePromises);
      }

      // Update bet status
      await updateDoc(betRef, {
        status: 'completed',
        winningOptionId,
        winningsPerPerson,
        resultReleasedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message:
          winners.length > 0
            ? 'Results released and coins distributed'
            : 'No winners, wagers refunded',
        winningsPerPerson,
        winners,
      };
    } catch (error) {
      console.error('Error releasing result:', error);
      throw error;
    }
  }

  // Get user's bets
  async getUserBets(userId) {
    try {
      // Query for bets where user is creator or participant
      const createdBetsQuery = query(
        collection(db, 'bets'),
        where('creatorId', '==', userId),
        orderBy('createdAt', 'desc'),
      );

      const participatedBetsQuery = query(
        collection(db, 'bets'),
        where('participants', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
      );

      // Get both sets of bets
      const [createdSnapshot, participatedSnapshot] = await Promise.all([
        getDocs(createdBetsQuery),
        getDocs(participatedBetsQuery),
      ]);

      // Combine and deduplicate bets
      const betsMap = new Map();

      // Add created bets
      createdSnapshot.docs.forEach((doc) => {
        betsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Add participated bets
      participatedSnapshot.docs.forEach((doc) => {
        if (!betsMap.has(doc.id)) {
          betsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      // Convert bets to array and process each one
      const bets = Array.from(betsMap.values());

      // Process each bet to include creator info
      return await Promise.all(
        bets.map(async (bet) => {
          try {
            if (bet.creatorId) {
              const creatorDoc = await getDoc(doc(db, 'users', bet.creatorId));
              if (creatorDoc.exists()) {
                const creatorData = creatorDoc.data();
                bet.creatorUsername = creatorData.username || 'Unknown User';
                bet.creatorProfilePicture = creatorData.profilePicture || null;
              }
            }

            return {
              ...bet,
              createdAt: bet.createdAt?.toDate?.() || new Date(bet.createdAt),
              expiresAt: bet.expiresAt?.toDate?.() || new Date(bet.expiresAt),
              updatedAt: bet.updatedAt?.toDate?.() || new Date(bet.updatedAt),
            };
          } catch (error) {
            console.error('Error processing bet:', error);
            return {
              ...bet,
              creatorUsername: 'Unknown User',
              creatorProfilePicture: null,
              createdAt: bet.createdAt?.toDate?.() || new Date(bet.createdAt),
              expiresAt: bet.expiresAt?.toDate?.() || new Date(bet.expiresAt),
              updatedAt: bet.updatedAt?.toDate?.() || new Date(bet.updatedAt),
            };
          }
        }),
      );
    } catch (error) {
      console.error('Error getting user bets:', error);
      throw error;
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

      const bet = betDoc.data();

      // Validate bet is still open
      if (bet.status !== 'open') {
        throw new Error('Bet is no longer open');
      }

      // Find the selected option
      const option = bet.answerOptions.find((opt) => opt.id === optionId);
      if (!option) {
        throw new Error('Invalid option selected');
      }

      // Get user doc to subtract wager from coins
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
  
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
  
      const userData = userDoc.data();
  
      if (userData.numCoins < bet.wagerAmount) {
        throw new Error('Insufficient coins to place this bet');
      }
  
      await updateDoc(userRef, {
        numCoins: increment(-bet.wagerAmount),
      });

      // Update bet with new participant
      const updatedOptions = bet.answerOptions.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            participants: [...opt.participants, userId],
            totalWager: opt.totalWager + bet.wagerAmount,
          };
        }
        return opt;
      });

      await updateDoc(betRef, {
        answerOptions: updatedOptions,
        totalWager: increment(bet.wagerAmount),
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: 'Bet placed successfully',
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  // Get bet results
  async getBetResults(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const bet = betDoc.data();

      if (bet.status !== 'completed') {
        throw new Error('Bet results not available yet');
      }

      return {
        winningOptionId: bet.winningOptionId,
        totalPool: bet.totalPool,
        answerOptions: bet.answerOptions,
      };
    } catch (error) {
      console.error('Error getting bet results:', error);
      throw error;
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

  // Get bet comments
  async getBetComments(betId) {
    try {
      const commentsQuery = query(
        collection(db, 'betComments'),
        where('betId', '==', betId),
        orderBy('createdAt', 'desc'),
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      return commentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
      });
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add comment with user details
  async addComment(groupId, betId, userId, content) {
    try {
      // Get user data
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Get bet data to verify it exists
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const userData = userDoc.data();
      const timestamp = serverTimestamp();

      // Create comment data
      const commentData = {
        betId,
        userId,
        username: userData.username,
        profilePicture: userData.profilePicture || null,
        content,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Add comment to betComments collection
      const commentRef = await addDoc(
        collection(db, 'betComments'),
        commentData,
      );

      // Update bet's comment count and timestamp
      await updateDoc(betRef, {
        commentCount: increment(1),
        updatedAt: timestamp,
      });

      // If this is a group bet, notify the bet creator
      const betData = betDoc.data();
      if (betData.creatorId && betData.creatorId !== userId) {
        await NotificationsService.createNewCommentNotification(
          betData.creatorId,
          betId,
          userData.username,
          betData.question,
        );
      }

      // Return comment data with the generated ID
      return {
        id: commentRef.id,
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const timestamp = serverTimestamp();

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

  // Remove reaction
  async removeReaction(betId, userId, reaction) {
    try {
      const betRef = doc(db, 'bets', betId);
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      await updateDoc(betRef, {
        reactions: arrayRemove({
          userId,
          username: userData.username,
          reaction,
        }),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Toggle reaction
  async toggleReaction(groupId, betId, userId, reaction) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betDoc.data();
      const existingReaction = betData.reactions?.find(
        (r) => r.userId === userId && r.reaction === reaction,
      );

      if (existingReaction) {
        await this.removeReaction(betId, userId, reaction);
      } else {
        await this.addReaction(groupId, betId, userId, reaction);
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Check for expiring bets and notify users
  async checkExpiringBets() {
    try {
      const now = serverTimestamp();
      const oneDayFromNow = new Timestamp(now.seconds + 86400, now.nanoseconds);
      const threeHoursFromNow = new Timestamp(
        now.seconds + 10800,
        now.nanoseconds,
      );

      // Get both expiring and expired bets that are still open
      const betsQuery = query(
        collection(db, 'bets'),
        where('status', '==', 'open'),
        where('expiresAt', '<=', oneDayFromNow),
      );

      const snapshot = await getDocs(betsQuery);

      for (const doc of snapshot.docs) {
        const bet = doc.data();
        const expiresAt = new Date(bet.expiresAt.seconds * 1000);
        const currentTime = new Date();

        // If bet is expired, lock it
        if (expiresAt <= currentTime) {
          await this.lockBet(doc.id);
          continue;
        }

        // For non-expired bets, send notifications at appropriate times
        const hoursLeft = Math.ceil(
          (expiresAt - currentTime) / (1000 * 60 * 60),
        );

        if (
          (hoursLeft <= 24 && hoursLeft > 23) ||
          (hoursLeft <= 3 && hoursLeft > 2)
        ) {
          const expiresIn = hoursLeft <= 3 ? '3 hours' : '24 hours';

          // Get all users to notify
          const usersToNotify = new Set();
          usersToNotify.add(bet.creatorId);

          // Add participants
          bet.answerOptions.forEach((option) => {
            option.participants.forEach((id) => usersToNotify.add(id));
          });

          // Add group members if it's a group bet
          if (bet.groupId) {
            const groupDoc = await getDoc(doc(db, 'groups', bet.groupId));
            if (groupDoc.exists()) {
              const groupData = groupDoc.data();
              if (groupData.members) {
                groupData.members.forEach((id) => usersToNotify.add(id));
              }
            }
          }

          // Send notifications
          for (const userId of usersToNotify) {
            await NotificationsService.createBetExpirationNotification(
              userId,
              doc.id,
              bet.question,
              expiresIn,
            );
          }
        }
      }
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update bet result
  async updateBetResult(betId, result) {
    try {
      const betRef = doc(db, 'bets', betId);
      const bet = await getDoc(betRef);

      if (!bet.exists()) {
        throw new Error('Bet not found');
      }

      const betData = bet.data();

      await updateDoc(betRef, {
        result,
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Notify participants about the result
      if (betData.participants) {
        betData.participants.forEach(async (participantId) => {
          await NotificationsService.createBetResultNotification(
            participantId,
            betId,
            betData.title,
            result,
          );
        });
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Toggle comment reaction
  async toggleCommentReaction(groupId, betId, commentId, userId, reaction) {
    try {
      const commentRef = doc(db, 'betComments', commentId);
      const commentDoc = await getDoc(commentRef);

      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data();
      const reactions = commentData.reactions || {};
      const reactionUsers = reactions[reaction] || [];

      // Check if user already reacted with this emoji
      const hasReacted = reactionUsers.includes(userId);

      // Update the reaction
      const updates = {};
      if (hasReacted) {
        // Remove reaction
        updates[`reactions.${reaction}`] = arrayRemove(userId);
      } else {
        // Add reaction
        updates[`reactions.${reaction}`] = arrayUnion(userId);
      }

      await updateDoc(commentRef, updates);

      // If this is a new reaction and not from the comment author, send notification
      if (!hasReacted && commentData.userId !== userId) {
        await NotificationsService.createNewCommentNotification(
          commentData.userId,
          betId,
          commentData.username,
          commentData.content,
        );
      }

      return { success: true };
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  // Error handler
  _handleError(error) {
    console.error('BetsService Error:', error);
    throw new Error(error.message || 'An error occurred in BetsService');
  }
}

module.exports = new BetsService();
