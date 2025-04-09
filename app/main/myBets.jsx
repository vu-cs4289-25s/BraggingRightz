import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import Icon from 'react-native-vector-icons/FontAwesome';
import GroupsService from '../../src/endpoints/groups.cjs';

const MyBets = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      const userBets = await BetsService.getUserBets(sessionData.uid);

      // Fetch additional info for each bet
      const betsWithInfo = await Promise.all(
        userBets.map(async (bet) => {
          try {
            // Get group name
            let groupName = 'No Group';
            if (bet.groupId) {
              groupName = await GroupsService.getGroupName(bet.groupId);
            }

            return {
              ...bet,
              groupName,
              // Ensure wagerAmount is properly set
              wagerAmount: bet.wagerAmount || 0,
              // Calculate total pool
              totalPool: bet.answerOptions.reduce(
                (sum, option) =>
                  sum + option.participants.length * bet.wagerAmount,
                0,
              ),
            };
          } catch (error) {
            console.error('Error fetching bet info:', error);
            return {
              ...bet,
              groupName: 'No Group',
              wagerAmount: bet.wagerAmount || 0,
              totalPool: 0,
            };
          }
        }),
      );

      setBets(betsWithInfo);
    } catch (error) {
      console.error('Error loading bets:', error);
      Alert.alert('Error', 'Failed to load your bets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return theme.colors.primary;
      case 'locked':
        return '#FFA500';
      case 'completed':
        return '#4CAF50';
      default:
        return theme.colors.textLight;
    }
  };

  const formatTimeLeft = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff < 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const filteredBets = bets.filter((bet) => {
    if (filter === 'all') return true;
    if (filter === 'active') return bet.status === 'open';
    if (filter === 'completed') return bet.status === 'completed';
    return true;
  });

  const renderBetCard = (bet) => {
    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );
    const hasWon =
      bet.status === 'completed' && userOption?.id === bet.winningOptionId;
    const isExpired = new Date(bet.expiresAt) < new Date();
    const totalParticipants = bet.answerOptions.reduce(
      (sum, opt) => sum + opt.participants.length,
      0,
    );

    return (
      <TouchableOpacity
        key={bet.id}
        style={styles.betCard}
        onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
      >
        <View style={styles.betHeader}>
          <View style={styles.groupInfo}>
            <Icon name="users" size={hp(2)} color={theme.colors.primary} />
            <Text style={styles.groupName}>{bet.groupName || 'No Group'}</Text>
          </View>
          <Text style={[styles.status, { color: getStatusColor(bet.status) }]}>
            {bet.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.question}>{bet.question}</Text>

        <View style={styles.betDetails}>
          <View style={styles.detailRow}>
            <Icon name="clock-o" size={hp(2)} color={theme.colors.textLight} />
            {isExpired ? (
              <Text style={styles.timeLeft}>
                Expired on {new Date(bet.expiresAt).toLocaleDateString()}
              </Text>
            ) : (
              <Text style={styles.timeLeft}>
                {formatTimeLeft(bet.expiresAt)}
              </Text>
            )}
          </View>

          <View style={styles.detailRow}>
            <Icon name="money" size={hp(2)} color={theme.colors.textLight} />
            <Text style={styles.wager}>{bet.wagerAmount} coins per bet</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="users" size={hp(2)} color={theme.colors.textLight} />
            <Text style={styles.participants}>
              {totalParticipants} participant
              {totalParticipants !== 1 ? 's' : ''}
            </Text>
          </View>

          {userOption && (
            <View style={styles.detailRow}>
              <Icon
                name="check-circle"
                size={hp(2)}
                color={theme.colors.success}
              />
              <Text style={styles.selectedOption}>
                Your pick: {userOption.text}
              </Text>
            </View>
          )}

          {bet.status === 'completed' && (
            <View style={styles.resultRow}>
              <Icon
                name={hasWon ? 'trophy' : 'times-circle'}
                size={hp(2.5)}
                color={hasWon ? theme.colors.warning : theme.colors.error}
              />
              <Text
                style={[
                  styles.result,
                  { color: hasWon ? theme.colors.success : theme.colors.error },
                ]}
              >
                {hasWon
                  ? `Won ${bet.winningsPerPerson} coins!`
                  : 'Better luck next time!'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>Pool: {bet.totalPool} coins</Text>
          {bet.status === 'completed' && bet.winningOptionId && (
            <Text style={styles.statsText}>
              Winning option:{' '}
              {
                bet.answerOptions.find((opt) => opt.id === bet.winningOptionId)
                  ?.text
              }
            </Text>
          )}
        </View>
      </TouchableOpacity>
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header
          title="My Bets"
          showBackButton={true}
          rightComponent={
            <View style={styles.pointsContainer}>
              <Text style={styles.points}>🪙 {session?.numCoins || 0}</Text>
            </View>
          }
        />

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'active' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('active')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'active' && styles.filterTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'completed' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('completed')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'completed' && styles.filterTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.betsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredBets.length > 0 ? (
            filteredBets.map(renderBetCard)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="ticket" size={hp(5)} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No bets found</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('NewBet')}
              >
                <Text style={styles.createButtonText}>Create a New Bet</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    backgroundColor: '#f0f0f0',
    borderRadius: theme.radius.lg,
    padding: hp(0.5),
  },
  filterButton: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: theme.radius.lg,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  betsList: {
    flex: 1,
  },
  betCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  groupName: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  status: {
    fontSize: hp(1.6),
    fontWeight: 'bold',
  },
  question: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  betDetails: {
    gap: hp(1),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  timeLeft: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  wager: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  participants: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  selectedOption: {
    fontSize: hp(1.8),
    color: theme.colors.success,
    fontWeight: '500',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(1),
    backgroundColor: theme.colors.background,
    padding: hp(1),
    borderRadius: theme.radius.sm,
  },
  result: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(10),
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  pointsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
  },
  points: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
});

export default MyBets;
