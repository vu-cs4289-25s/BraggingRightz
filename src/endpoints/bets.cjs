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

import {
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
} from 'firebase/firestore';
import { db } from '../firebase/config';

class BetService {
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

  // Create new bet
  async createBet(groupId, betData) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const bet = {
        ...betData,
        groupId,
        status: 'active',
        participants: [],
        answers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const betRef = await addDoc(collection(db, 'bets'), bet);
      return {
        id: betRef.id,
        ...bet,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet details
  async getBetDetails(groupId, betId) {
    try {
      const betDoc = await getDoc(doc(db, 'bets', betId));

      if (!betDoc.exists() || betDoc.data().groupId !== groupId) {
        throw new Error('Bet not found');
      }

      return {
        id: betDoc.id,
        ...betDoc.data(),
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Edit bet
  async editBet(groupId, betId, updateData) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists() || betDoc.data().groupId !== groupId) {
        throw new Error('Bet not found');
      }

      if (betDoc.data().status !== 'active') {
        throw new Error('Cannot edit expired or resolved bet');
      }

      await updateDoc(betRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      return {
        id: betId,
        ...updateData,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete bet
  async deleteBet(groupId, betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists() || betDoc.data().groupId !== groupId) {
        throw new Error('Bet not found');
      }

      if (betDoc.data().status !== 'active') {
        throw new Error('Cannot delete expired or resolved bet');
      }

      await deleteDoc(betRef);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Join bet
  async joinBet(groupId, betId, userId, stake) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists() || betDoc.data().groupId !== groupId) {
        throw new Error('Bet not found');
      }

      if (betDoc.data().status !== 'active') {
        throw new Error('Cannot join expired or resolved bet');
      }

      // Add participant and update points
      await updateDoc(betRef, {
        participants: arrayUnion({
          userId,
          stake,
          joinedAt: serverTimestamp(),
        }),
      });

      // Deduct points from user's balance
      await updateDoc(doc(db, 'points', userId), {
        balance: increment(-stake),
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Submit answer
  async submitAnswer(groupId, betId, userId, answer) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);

      if (!betDoc.exists() || betDoc.data().groupId !== groupId) {
        throw new Error('Bet not found');
      }

      if (betDoc.data().status !== 'active') {
        throw new Error('Cannot submit answer to expired or resolved bet');
      }

      await updateDoc(betRef, {
        answers: arrayUnion({
          userId,
          answer,
          submittedAt: serverTimestamp(),
        }),
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Lock bet
  async lockBet(groupId, betId) {
    try {
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        status: 'locked',
        lockedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Resolve bet
  async resolveBet(groupId, betId, winningAnswer) {
    try {
      const betRef = doc(db, 'bets', betId);
      const betDoc = await getDoc(betRef);
      const betData = betDoc.data();

      // Calculate winnings and distribute points
      const winners = betData.answers.filter((a) => a.answer === winningAnswer);
      const totalStake = betData.participants.reduce(
        (sum, p) => sum + p.stake,
        0,
      );
      const winnerShare = totalStake / winners.length;

      // Update winners' points
      for (const winner of winners) {
        await updateDoc(doc(db, 'points', winner.userId), {
          balance: increment(winnerShare),
        });
      }

      // Mark bet as resolved
      await updateDoc(betRef, {
        status: 'resolved',
        winningAnswer,
        resolvedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get bet comments
  async getBetComments(groupId, betId) {
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

  // Add comment
  async addComment(groupId, betId, userId, content) {
    try {
      const comment = {
        betId,
        userId,
        content,
        createdAt: serverTimestamp(),
      };

      const commentRef = await addDoc(collection(db, 'betComments'), comment);
      return {
        id: commentRef.id,
        ...comment,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add reaction
  async addReaction(groupId, betId, userId, reaction) {
    try {
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        reactions: arrayUnion({
          userId,
          reaction,
          createdAt: serverTimestamp(),
        }),
      });
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    throw new Error(error.message);
  }
}

export const betService = new BetService();
