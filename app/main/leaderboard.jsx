import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Leaderboard from '../../components/Leaderboard';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import AuthService from '../../src/endpoints/auth.cjs';
import FriendService from '../../src/endpoints/friend.cjs';
import UserService from '../../src/endpoints/user.cjs';

const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'friends'
  const [globalRankings, setGlobalRankings] = useState([]);
  const [friendRankings, setFriendRankings] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      // Load global rankings
      const globalUsers = await UserService.getGlobalLeaderboard();
      setGlobalRankings(globalUsers);

      // Load friends rankings
      const friends = await FriendService.getFriendList();
      // Add current user to friends list for comparison
      const friendsWithUser = [
        {
          userId: sessionData.uid,
          username: sessionData.username,
          trophies: sessionData.trophies,
          coins: sessionData.numCoins,
        },
        ...friends,
      ];
      setFriendRankings(friendsWithUser);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Leaderboard" showBackButton={true} />

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
            onPress={() => setActiveTab('global')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'global' && styles.activeTabText,
              ]}
            >
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'friends' && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'global' ? (
          <Leaderboard
            data={globalRankings}
            title="Global Rankings"
            currentUserId={session?.uid}
          />
        ) : (
          <Leaderboard
            data={friendRankings}
            title="Friends Rankings"
            currentUserId={session?.uid}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LeaderboardScreen;
