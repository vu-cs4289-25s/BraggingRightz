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
      const timestamp = serverTimestamp();

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

      const betData = {
        id: betRef.id,
        creatorId,
        question,
        title: question, // Add title field to match test expectations
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

      // If this is a group bet, update the group's bets array and notify members
      if (groupId) {
        const groupRef = doc(db, 'groups', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        await updateDoc(groupRef, {
          bets: arrayUnion(betRef.id),
          updatedAt: timestamp,
        });

        // Get creator's name
        const creatorDoc = await getDoc(doc(db, 'users', creatorId));
        const creatorName = creatorDoc.data().username;

        // Notify all group members
        if (groupData.members) {
          for (const memberId of groupData.members) {
            if (memberId !== creatorId) {
              await NotificationsService.createNewBetNotification(
                memberId,
                betRef.id,
                creatorName,
                question,
              );
            }
          }
        }
      }

      // Convert timestamps for response
      const response = {
        ...betData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet by ID
  async getBet(betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }

      const bet = {
        id: betId,
        ...betDoc.data(),
        createdAt:
          betDoc.data().createdAt?.toDate?.() ||
          new Date(betDoc.data().createdAt),
        updatedAt:
          betDoc.data().updatedAt?.toDate?.() ||
          new Date(betDoc.data().updatedAt),
      };

      // Check if bet should be locked
      if (bet.status === 'open' && new Date(bet.expiresAt) <= new Date()) {
        await updateDoc(betRef, {
          status: 'locked',
          updatedAt: new Date().toISOString(),
        });
        bet.status = 'locked';

        // Notify creator
        await NotificationsService.createNotification({
          userId: bet.creatorId,
          type: 'bets',
          title: `Bet "${bet.question}" has expired`,
          message: 'Please select the winning option to distribute coins.',
          data: { betId },
        });
      }

      // Fetch participant names
      const voterNames = {};
      const participantPromises = bet.answerOptions.flatMap((option) =>
        option.participants.map(async (participantId) => {
          if (!voterNames[participantId]) {
            try {
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                voterNames[participantId] = userDoc.data().username;
              }
            } catch (error) {
              console.error(`Error fetching user ${participantId}:`, error);
              voterNames[participantId] = 'Unknown User';
            }
          }
        }),
      );

      await Promise.all(participantPromises);
      bet.voterNames = voterNames;

      // If bet has a group, fetch group name
      if (bet.groupId) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', bet.groupId));
          if (groupDoc.exists()) {
            bet.groupName = groupDoc.data().name;
          }
        } catch (error) {
          console.error('Error fetching group name:', error);
          bet.groupName = 'Unknown Group';
        }
      }

      return bet;
    } catch (error) {
      console.error('Error getting bet:', error);
      throw error;
    }
  }

  // Check and update bet status
  async checkAndUpdateExpiredBets() {
    try {
      const now = new Date();
      const betsQuery = query(
        collection(db, 'bets'),
        where('status', '==', 'open'),
        where('expiresAt', '<=', now.toISOString()),
      );

      const snapshot = await getDocs(betsQuery);
      const updatePromises = [];

      for (const betDoc of snapshot.docs) {
        const bet = { id: betDoc.id, ...betDoc.data() };
        updatePromises.push(
          updateDoc(doc(db, 'bets', bet.id), {
            status: 'locked',
            updatedAt: new Date().toISOString(),
          }),
        );

        // Notify creator that bet needs resolution
        await NotificationsService.createNotification({
          userId: bet.creatorId,
          type: 'bets',
          title: `Bet "${bet.question}" has expired`,
          message: 'Please select the winning option to distribute coins.',
          data: { betId: bet.id },
        });
      }

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error checking expired bets:', error);
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
  async getUserBets(userId, status = null) {
    try {
      // First get bets where user is a participant
      const participantQuery = query(
        collection(db, 'bets'),
        where('participants', 'array-contains', userId),
      );
      const participantSnapshot = await getDocs(participantQuery);

      // Then get bets where user is the creator
      const creatorQuery = query(
        collection(db, 'bets'),
        where('creatorId', '==', userId),
      );
      const creatorSnapshot = await getDocs(creatorQuery);

      // Combine results using a Map to remove duplicates
      const betsMap = new Map();

      // Process and update status for each bet
      const processSnapshot = async (snapshot) => {
        for (const doc of snapshot.docs) {
          const data = { id: doc.id, ...doc.data() };

          // Ensure dates are properly formatted
          if (data.createdAt) {
            data.createdAt = data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString();
          }

          if (data.updatedAt) {
            data.updatedAt = data.updatedAt.toDate
              ? data.updatedAt.toDate().toISOString()
              : new Date(data.updatedAt).toISOString();
          }

          if (data.expiresAt) {
            data.expiresAt = data.expiresAt.toDate
              ? data.expiresAt.toDate().toISOString()
              : new Date(data.expiresAt).toISOString();
          }

          // Check if bet should be locked
          if (
            data.status === 'open' &&
            new Date(data.expiresAt) <= new Date()
          ) {
            const betRef = doc(db, 'bets', doc.id);
            await updateDoc(betRef, {
              status: 'locked',
              updatedAt: new Date().toISOString(),
            });
            data.status = 'locked';

            // Notify creator
            await NotificationsService.createNotification({
              userId: data.creatorId,
              type: 'bets',
              title: `Bet "${data.question}" has expired`,
              message: 'Please select the winning option to distribute coins.',
              data: { betId: doc.id },
            });
          }

          // Get group name if groupId exists
          if (data.groupId) {
            try {
              const groupDoc = await getDoc(doc(db, 'groups', data.groupId));
              if (groupDoc.exists()) {
                data.groupName = groupDoc.data().name;
              }
            } catch (error) {
              console.error('Error fetching group name:', error);
            }
          }

          betsMap.set(doc.id, data);
        }
      };

      await Promise.all([
        processSnapshot(participantSnapshot),
        processSnapshot(creatorSnapshot),
      ]);

      let results = Array.from(betsMap.values());

      // Filter by status if provided
      if (status) {
        results = results.filter((bet) => bet.status === status);
      }

      // Sort by createdAt in descending order (most recent first)
      results.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return results;
    } catch (error) {
      console.error('Error getting user bets:', error);
      throw error;
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

      const updates = {
        ...updateData,
        updatedAt: serverTimestamp(),
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

      // Get user's points balance which is num coins in the user
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const currentBalance = userData.numCoins;

      console.log('Current balance:', currentBalance);
      console.log('Wager amount:', betData.wagerAmount);

      // Check if user has enough points
      if (currentBalance < betData.wagerAmount) {
        throw new Error(
          `Insufficient points balance. You need ${betData.wagerAmount} points but have ${currentBalance}`,
        );
      }

      const timestamp = serverTimestamp();

      // Deduct points from user first
      await updateDoc(doc(db, 'users', userId), {
        numCoins: increment(-betData.wagerAmount),
      });

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
      await updateDoc(doc(db, 'users', userId), {
        numCoins: increment(-betData.wagerAmount),
        totalSpent: increment(betData.wagerAmount),
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

      await updateDoc(betRef, {
        status: 'locked',
        updatedAt: serverTimestamp(),
      });

      return true;
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
      const now = new Date();
      const expiresAt = new Date(betData.expiresAt);

      // Check if bet has expired
      if (now > expiresAt) {
        throw new Error('Cannot delete an expired bet');
      }

      // Process refunds for all participants
      const refundPromises = [];
      betData.answerOptions.forEach((option) => {
        option.participants.forEach((userId) => {
          const userPointsRef = doc(db, 'users', userId);
          refundPromises.push(
            updateDoc(userPointsRef, {
              numCoins: increment(betData.wagerAmount),
            }),
          );
        });
      });

      // Wait for all refunds to process
      await Promise.all(refundPromises);

      // Delete the bet
      await deleteDoc(betRef);

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet comments
  async getBetComments(betId) {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('betId', '==', betId),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(commentsQuery);
      return await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            const username = userDoc.exists()
              ? userDoc.data().username
              : 'Unknown User';
            return {
              id: doc.id,
              ...data,
              username,
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            };
          } catch (error) {
            console.error(`Error fetching user for comment ${doc.id}:`, error);
            return {
              id: doc.id,
              ...data,
              username: 'Unknown User',
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            };
          }
        }),
      );
    } catch (error) {
      console.error('Error getting bet comments:', error);
      throw error;
    }
  }

  // Add comment with user details
  async addComment(groupId, betId, userId, content) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      const betDoc = await getDoc(doc(db, 'bets', betId));
      if (!betDoc.exists()) {
        throw new Error('Bet not found');
      }
      const betData = betDoc.data();

      const comment = {
        betId,
        userId,
        username: userData.username,
        profilePicture: userData.profilePicture,
        content,
        createdAt: serverTimestamp(),
      };

      const commentRef = await addDoc(collection(db, 'betComments'), comment);

      // Update bet with comment count
      await updateDoc(doc(db, 'bets', betId), {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Get all users to notify
      const usersToNotify = new Set();

      // Add bet creator
      if (userId !== betData.creatorId) {
        usersToNotify.add(betData.creatorId);
      }

      // Add participants
      if (betData.participants) {
        betData.participants.forEach((participantId) => {
          if (participantId !== userId) {
            usersToNotify.add(participantId);
          }
        });
      }

      // Add group members if it's a group bet
      if (groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        const groupData = groupDoc.data();
        if (groupData.members) {
          groupData.members.forEach((memberId) => {
            if (memberId !== userId) {
              usersToNotify.add(memberId);
            }
          });
        }
      }

      // Send notifications
      for (const recipientId of usersToNotify) {
        await NotificationsService.createNewCommentNotification(
          recipientId,
          betId,
          userData.username,
          betData.title,
        );
      }

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

      // Get bets expiring in the next 24 hours or 3 hours
      const expiringBetsQuery = query(
        collection(db, 'bets'),
        where('status', '==', 'open'),
        where('expiresAt', '<=', oneDayFromNow),
        where('expiresAt', '>', now),
      );

      const snapshot = await getDocs(expiringBetsQuery);

      for (const doc of snapshot.docs) {
        const bet = doc.data();
        const expiresAt = new Date(bet.expiresAt.seconds * 1000);
        const hoursLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60));

        // Only notify at 24 hours and 3 hours before expiry
        if (
          (hoursLeft <= 24 && hoursLeft > 23) ||
          (hoursLeft <= 3 && hoursLeft > 2)
        ) {
          const expiresIn = hoursLeft <= 3 ? '3 hours' : '24 hours';

          // Get all users to notify
          const usersToNotify = new Set();

          // Add creator
          usersToNotify.add(bet.creatorId);

          // Add participants
          if (bet.participants) {
            bet.participants.forEach((id) => usersToNotify.add(id));
          }

          // Add group members if it's a group bet
          if (bet.groupId) {
            const groupDoc = await getDoc(doc(db, 'groups', bet.groupId));
            const groupData = groupDoc.data();
            if (groupData.members) {
              groupData.members.forEach((id) => usersToNotify.add(id));
            }
          }

          // Send notifications
          for (const userId of usersToNotify) {
            await NotificationsService.createBetExpirationNotification(
              userId,
              doc.id,
              bet.title,
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

  // Error handler
  _handleError(error) {
    console.error('BetsService Error:', error);
    throw new Error(error.message || 'An error occurred in BetsService');
  }
}

module.exports = new BetsService();
