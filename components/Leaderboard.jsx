import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';

const Leaderboard = ({ data, title, currentUserId }) => {
  // Sort users by trophies in descending order
  const sortedUsers = [...data].sort((a, b) => b.trophies - a.trophies);

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return { color: '#FFD700' }; // Gold
      case 1:
        return { color: '#C0C0C0' }; // Silver
      case 2:
        return { color: '#CD7F32' }; // Bronze
      default:
        return { color: theme.colors.text };
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return '👑';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}`;
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <ScrollView style={styles.scrollView}>
        {sortedUsers.map((user, index) => (
          <TouchableOpacity
            key={user.userId}
            style={[
              styles.userRow,
              user.userId === currentUserId && styles.currentUserRow,
            ]}
          >
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, getRankStyle(index)]}>
                {getRankIcon(index)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Icon name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.statValue}>{user.trophies}</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.statValue}>{user.winRate || '0'}%</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currentUserRow: {
    backgroundColor: theme.colors.card,
  },
  rankContainer: {
    width: wp(10),
    alignItems: 'center',
  },
  rank: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  username: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: hp(0.5),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  statValue: {
    marginLeft: wp(1),
    color: theme.colors.textLight,
    fontSize: hp(1.8),
  },
});

export default Leaderboard;
