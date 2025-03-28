import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import BetsService from '../../src/endpoints/bets.cjs';
import GroupsService from '../../src/endpoints/groups.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import UserService from '../../src/endpoints/user.cjs';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Icon from 'react-native-vector-icons/FontAwesome';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';

const GroupBets = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const route = useRoute();
  const { groupId } = route.params;
  const [bets, setBets] = useState([]);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        const tempName = await GroupsService.getGroupName(groupId);
        setGroupName(tempName);

        const tempGroup = await GroupsService.getGroup(groupId);
        setGroup(tempGroup);

        const groupBets = await BetsService.getGroupBets(groupId);

        // Display bets with the newly created at the bottom
        const sortedBets = groupBets.sort((a, b) => {
          const dateA = a.createdAt?.seconds
            ? new Date(a.createdAt.seconds * 1000)
            : new Date(a.createdAt);
          const dateB = b.createdAt?.seconds
            ? new Date(b.createdAt.seconds * 1000)
            : new Date(b.createdAt);
          return dateB - dateA;
        });

        setBets(sortedBets);
      } catch (error) {
        console.log('Error fetching bets:', error);
      }
    };
    fetchBets();
  }, [groupId]);

  const fetchCreatorUsername = async (userId) => {
    const user = await UserService.getUserProfile(userId);
    return user.username;
  };

  const fetchCreatorProfilePic = async (userId) => {
    const user = await UserService.getUserProfile(userId);
    return user.profilePicture;
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
  const formatDate = (date) => {
    if (!date) return 'Unknown Date';

    let dateObj;

    if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj)) return 'Invalid Date';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

  const calculateBetResult = (bet) => {
    if (bet.status !== 'completed' || !bet.winningOptionId || !session?.uid) {
      return null;
    }

    const winningOption = bet.answerOptions.find(
      (opt) => opt.id === bet.winningOptionId,
    );
    if (!winningOption) {
      return null;
    }

    const userWon = winningOption.participants.includes(session.uid);
    if (!userWon) {
      return { result: 'lose', coins: 0 };
    }

    return {
      result: 'win',
      coins: bet.winningsPerPerson || 0,
    };
  };

  const renderBetCard = (bet) => {
    const betResult = calculateBetResult(bet);
    const winningOption =
      bet.status === 'completed' &&
      bet.answerOptions.find((opt) => opt.id === bet.winningOptionId);
    const isLocked = bet.status === 'locked';
    const isCompleted = bet.status === 'completed';
    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );

    const isSentByUser = bet.creatorId === session?.uid;

    return (
      <ScrollView>
        <View key={bet.id} style={styles.betContainer}>
          <View style={[styles.betSender, isSentByUser ? styles.betSenderRight : styles.betSenderLeft,]}>
            <Avatar
              source={{
                uri:
                  fetchCreatorProfilePic(bet.creatorId) ||
                  require('../../assets/images/default-avatar.png'),
              }}
              size={hp(3)}
            />
            <Text style={styles.creatorName}>
              {fetchCreatorUsername(bet.creatorId)}
            </Text>
          </View>
          <TouchableOpacity
            key={bet.id}
            style={[
              styles.betCard,
              isLocked && styles.lockedBetCard,
              isCompleted && styles.completedBetCard,
            ]}
            onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
          >
            <View style={styles.betHeader}>
              <Text style={styles.betDescription} numberOfLines={2}>
                {bet.question}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(bet.status) + '20' },
                ]}
              >
                <Icon
                  name={isCompleted ? 'trophy' : isLocked ? 'lock' : 'unlock'}
                  size={16}
                  color={getStatusColor(bet.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(bet.status) },
                  ]}
                >
                  {bet.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.betInfo}>
              <View style={styles.betTime}>
                <Text style={styles.creationDate}>
                  Created: {formatDate(bet.createdAt)}
                </Text>
                <View style={styles.timeContainer}>
                  <Icon
                    name="clock-o"
                    size={16}
                    color={theme.colors.textLight}
                    paddingRight={wp(1)}
                  />
                  <Text style={styles.timeLeft}>
                    {formatTimeLeft(bet.expiresAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.wager}>
                <Text style={styles.wagerAmount}>
                  Wager: {bet.wagerAmount} 🪙
                </Text>
                <Text style={styles.wagerAmount} paddingTop={hp(0.5)}>
                  Total Pool: {bet.totalWager ?? 0} 🪙
                </Text>
              </View>
            </View>

            {isCompleted && winningOption && (
              <View style={styles.winnerContainer}>
                <Text style={styles.winnerLabel}>Winner: </Text>
                <Text style={styles.winnerOption}>{winningOption.text}</Text>
                {betResult && (
                  <View
                    style={[
                      styles.resultBadge,
                      betResult.result === 'win'
                        ? styles.winBadge
                        : styles.loseBadge,
                    ]}
                  >
                    <Text style={styles.resultText}>
                      {betResult.result === 'win'
                        ? `Won ${betResult.coins} 🪙`
                        : 'Lost'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {isLocked &&
              bet.creatorId === session?.uid &&
              !bet.winningOptionId && (
                <View style={styles.actionNeeded}>
                  <Icon
                    name="exclamation-circle"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Text style={styles.actionText}>Select Winner</Text>
                </View>
              )}

            <View style={styles.betFooter}>
              <Text style={styles.participants}>
                {bet.answerOptions.reduce(
                  (sum, opt) => sum + opt.participants.length,
                  0,
                )}{' '}
                participants
              </Text>
              {userOption && (
                <Text style={styles.yourVote}>
                  Your vote: {userOption.text}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <ScrollView>
        <View style={styles.contentContainer}>
          <Header
            title={groupName}
            showBackButton={true}
            rightComponent={
              <TouchableOpacity
                /* Click to edit group */
                onPress={() =>
                  navigation.navigate('EditGroup', { groupId: group })
                }
                style={styles.header}
                paddingRight={wp(4)}
              >
                <Avatar
                  source={{
                    uri:
                      group?.avatar ||
                      require('../../assets/images/default-avatar.png'),
                  }}
                  size={hp(4)}
                  style={styles.groupIcon}
                />
              </TouchableOpacity>
            }
          />
          <View style={styles.sectionDivider} />
          {bets.length > 0 ? (
            bets.map((bet) => <View key={bet.id}>{renderBetCard(bet)}</View>)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bets have been made yet.</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('NewBet', { groupId: groupId })} //  add param here
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>Create a New Bet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  betContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  contentContainer: {
    flexGrow: 1,
  },
  creationDate: {
    paddingVertical: hp(0.5),
    borderRadius: hp(2),
    color: theme.colors.textDark,
    alignSelf: 'center',
    textAlign: 'center',
  },
  betSender: {
    padding: wp(4),
    alignContent: 'center',
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: hp(1.25),
    color: theme.colors.text,
  },
  betTime: {
    flexDirection: 'column',
  },
  groupIcon: {
    marginRight: hp(3),
  },

  timeLeft: {
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wager: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 5,
    alignSelf: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(2),
  },
  betsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  betItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  betDescription: {
    flex: 1,
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: wp(3),
  },
  betDetails: {
    marginBottom: hp(2),
  },
  betSenderRight: {
    alignSelf: 'flex-end',
  },
  betSenderLeft: {
    alignSelf: 'flex-start',
  },
  betInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  betDate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    backgroundColor: '#FEF3C7',
    padding: hp(1),
    borderRadius: hp(1),
  },
  winnerLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#92400E',
  },
  winnerOption: {
    fontSize: hp(1.8),
    color: '#92400E',
    flex: 1,
  },
  resultBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  winBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  loseBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  resultText: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  actionNeeded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: hp(1),
    borderRadius: hp(1),
    marginTop: hp(1),
    gap: wp(2),
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participants: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  yourVote: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  betCard: {
    backgroundColor: 'rgba(97,174,95,0.35)',
    borderRadius: hp(2),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    flex: 1,
  },
  lockedBetCard: {
    backgroundColor: 'rgba(248,242,146,0.6)',
    borderColor: theme.colors.warning,
    borderWidth: 2,
    flex: 1,
  },
  completedBetCard: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: theme.colors.success,
    borderWidth: 2,
    flex: 1,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  statusBadge: {
    status: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  },
});
export default GroupBets;
