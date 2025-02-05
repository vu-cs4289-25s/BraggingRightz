/*
Points & Leaderboard
GET /groups/{group_id}/leaderboard → Retrieve the group leaderboard
GET /leaderboard/global → Retrieve the global leaderboard
GET /users/{user_id}/points-history → Retrieve point changes over time
PUT /users/{user_id}/adjust-points → Adjust user points (admin only)
GET /groups/{group_id}/bets/{bet_id}/results → Show bet results & winners

 */

const express = require('express');
const {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} = require('firebase/firestore');

const router = express.Router();
const db = getFirestore();

// Retrieve the group leaderboard
router.get('/groups/:group_id/leaderboard', async (req, res) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'users'),
      where('group_id', '==', req.params.group_id),
    );
    const leaderboardSnapshot = await getDocs(leaderboardQuery);
    const leaderboard = leaderboardSnapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => b.points - a.points);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Retrieve the global leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    const leaderboardQuery = query(collection(db, 'users'));
    const leaderboardSnapshot = await getDocs(leaderboardQuery);
    const leaderboard = leaderboardSnapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => b.points - a.points);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Retrieve point changes over time
router.get('/users/:user_id/points-history', async (req, res) => {
  try {
    const pointsHistoryQuery = query(
      collection(db, 'pointsHistory'),
      where('user_id', '==', req.params.user_id),
    );
    const pointsHistorySnapshot = await getDocs(pointsHistoryQuery);
    const pointsHistory = pointsHistorySnapshot.docs.map((doc) => doc.data());
    res.status(200).json(pointsHistory);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Adjust user points (admin only)
router.put('/users/:user_id/adjust-points', async (req, res) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', req.params.user_id));
    if (userDoc.exists()) {
      const user = userDoc.data();
      user.points = req.body.points;
      await updateDoc(doc(db, 'users', req.params.user_id), {
        points: user.points,
      });
      res.status(200).send('User points adjusted successfully');
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Show bet results & winners
router.get('/groups/:group_id/bets/:bet_id/results', async (req, res) => {
  try {
    const betDoc = await getDoc(doc(db, 'bets', req.params.bet_id));
    if (betDoc.exists()) {
      const bet = betDoc.data();
      res.status(200).json({ results: bet.results, winners: bet.winners });
    } else {
      res.status(404).send('Bet not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
