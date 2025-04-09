import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import AuthService from '../../src/endpoints/auth.cjs';
import FriendService from '../../src/endpoints/friend.cjs';
import UserService from '../../src/endpoints/user.cjs';

const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');
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

      const globalUsers = await UserService.getGlobalLeaderboard();

      //  Normalize global leaderboard data to ensure coins are included
      const normalizedGlobalUsers = globalUsers.map((user) => ({
        userId: user.userId,
        username: user.username,
        trophies: user.trophies,
        coins: user.coins ?? user.numCoins ?? 0, // fallback for safety
      }));
      setGlobalRankings(normalizedGlobalUsers);

      const friends = await FriendService.getFriendList();
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

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const renderUserCard = ({ item, index }) => {
    const isTopThree = index < 3;
    const isCurrentUser = item.userId === session?.uid;

    return (
      <View
        style={[
          styles.card,
          isTopThree && { borderColor: medalColors[index] },
          isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.leftSection}>
          {isTopThree ? (
            <Ionicons
              name="medal-outline"
              size={24}
              color={medalColors[index]}
            />
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.centerSection}>
          <Text style={[styles.usernameText, isCurrentUser && styles.bold]}>
            {item.username}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.trophyText}>🏆 {item.trophies}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.coinsText}>🪙 {item.coins}</Text>
            </View>
          </View>
        </View>
      </View>
    );
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

  const dataToDisplay =
    activeTab === 'global' ? globalRankings : friendRankings;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Leaderboard" showBackButton={true} />

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            {['global', 'friends'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.activeTab,
                  activeTab === tab && styles.shadow,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={dataToDisplay.sort((a, b) => b.trophies - a.trophies)}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'light gray',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    alignSelf: 'center',
    marginVertical: hp(2),
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: hp(3),
    padding: hp(0.5),
    width: wp(90),
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1.4),
    borderRadius: hp(3),
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: hp(2),
    color: '#334155',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1.5),
    marginBottom: hp(1.5),
    padding: hp(1.5),
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  currentUserCard: {
    backgroundColor: '#E0F2FE',
    borderColor: '#3B82F6',
  },
  leftSection: {
    width: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    paddingLeft: wp(3),
  },
  rankText: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: '#64748B',
  },
  usernameText: {
    fontSize: hp(2),
    color: '#0F172A',
    marginBottom: hp(0.5),
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBlock: {
    marginRight: wp(4),
  },
  trophyText: {
    fontSize: hp(1.8),
    color: '#FBBF24',
    fontWeight: '600',
  },
  coinsText: {
    fontSize: hp(1.7),
    color: '#FBBF24',
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;
