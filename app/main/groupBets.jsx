import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
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
import { db } from '../../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_GROUP_IMAGE = require('../../assets/images/default-avatar.png');
const DEFAULT_USER_IMAGE = require('../../assets/images/default-avatar.png');

const GroupBets = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const route = useRoute();
  const { groupId } = route.params;
  const [bets, setBets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBets = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      // Get the actual group ID string if groupId is an object
      const actualGroupId = typeof groupId === 'object' ? groupId.id : groupId;

      const tempName = await GroupsService.getGroupName(actualGroupId);
      setGroupName(tempName);

      const tempGroup = await GroupsService.getGroup(actualGroupId);
      setGroup(tempGroup);

      const groupBets = await BetsService.getGroupBets(actualGroupId);

      // Fetch creator info for each bet
      const betsWithCreatorInfo = await Promise.all(
        groupBets.map(async (bet) => {
          try {
            if (!bet.creatorId) {
              return {
                ...bet,
                creatorUsername: 'Unknown User',
                creatorProfilePicture:
                  Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri,
              };
            }

            const userDocRef = doc(db, 'users', bet.creatorId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              return {
                ...bet,
                creatorUsername: userData.username || 'Unknown User',
                creatorProfilePicture:
                  userData.profilePicture ||
                  Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri,
              };
            } else {
              return {
                ...bet,
                creatorUsername: 'Unknown User',
                creatorProfilePicture:
                  Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri,
              };
            }
          } catch (error) {
            console.error('Error fetching creator info:', error);
            return {
              ...bet,
              creatorUsername: 'Unknown User',
              creatorProfilePicture:
                Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri,
            };
          }
        }),
      );

      // Display bets with the newly created at the bottom
      const sortedBets = betsWithCreatorInfo.sort((a, b) => {
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
      console.error('Error fetching bets:', error);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [groupId]);

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
    const hasUserJoined = bet.answerOptions.some((opt) =>
      opt.participants.includes(session?.uid),
    );
    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );

    return (
      <TouchableOpacity
        key={bet.id}
        style={[styles.betCard, hasUserJoined && styles.joinedBetCard]}
        onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
      >
        <View style={styles.betHeader}>
          <Text style={styles.betQuestion} numberOfLines={2}>
            {bet.question}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColorBackground(bet.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColorText(bet.status) },
              ]}
            >
              {bet.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.betDetails}>
          <View style={styles.betInfoRow}>
            <View style={styles.creatorInfo}>
              <Icon
                name="user"
                size={14}
                color={theme.colors.textLight}
                style={styles.infoIcon}
              />
              <Text style={styles.creatorName}>
                {bet.creatorUsername || 'Unknown User'}
              </Text>
            </View>
            <View style={styles.dateInfo}>
              <Icon
                name="calendar"
                size={14}
                color={theme.colors.textLight}
                style={styles.infoIcon}
              />
              <Text style={styles.betDate}>
                {formatTimeLeft(bet.expiresAt)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.betStats}>
          <View style={styles.statBadge}>
            <Icon
              name="users"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>
              {bet.answerOptions.reduce(
                (sum, opt) => sum + opt.participants.length,
                0,
              )}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Icon
              name="money"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>{bet.wagerAmount || 0}</Text>
          </View>
          {hasUserJoined ? (
            <View style={[styles.statBadge, styles.joinedBadge]}>
              <Icon
                name="check"
                size={12}
                color="#4CAF50"
                style={styles.statIcon}
              />
              <Text style={[styles.statsText, { color: '#4CAF50' }]}>
                Joined
              </Text>
            </View>
          ) : bet.status === 'open' ? (
            <View style={[styles.statBadge, styles.notJoinedBadge]}>
              <Icon
                name="circle-o"
                size={12}
                color={theme.colors.textLight}
                style={styles.statIcon}
              />
              <Text
                style={[styles.statsText, { color: theme.colors.textLight }]}
              >
                Not Joined
              </Text>
            </View>
          ) : null}
        </View>

        {userOption && (
          <View style={styles.betFooter}>
            <Text style={styles.yourVote}>Your vote: {userOption.text}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColorBackground = (status) => {
    switch (status) {
      case 'open':
        return 'rgba(33, 150, 243, 0.1)'; // Light blue background
      case 'locked':
        return 'rgba(255, 165, 0, 0.1)'; // Light orange background
      case 'completed':
        return 'rgba(76, 175, 80, 0.1)'; // Light green background
      default:
        return 'rgba(158, 158, 158, 0.1)'; // Light gray background
    }
  };

  const getStatusColorText = (status) => {
    switch (status) {
      case 'open':
        return '#2196F3'; // Blue text
      case 'locked':
        return '#FFA500'; // Orange text
      case 'completed':
        return '#4CAF50'; // Green text
      default:
        return theme.colors.textLight; // Default text color
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchBets();
    setRefreshing(false);
  }, [groupId]);

  return (
    <ScreenWrapper bg="white">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.contentContainer}>
          <Header
            title={groupName}
            showBackButton={true}
            rightComponent={
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditGroup', {
                    groupId: typeof group === 'object' ? group.id : group,
                  })
                }
                style={styles.header}
                paddingRight={wp(4)}
              >
                <Avatar
                  uri={
                    group?.photoUrl ||
                    Image.resolveAssetSource(DEFAULT_GROUP_IMAGE).uri
                  }
                  size={hp(4)}
                  rounded={theme.radius.xl}
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
            onPress={() =>
              navigation.navigate('NewBet', {
                groupId: typeof groupId === 'object' ? groupId.id : groupId,
              })
            }
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  creatorName: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    marginLeft: wp(2),
  },
  betTime: {
    flexDirection: 'column',
  },
  groupIcon: {
    marginRight: hp(3),
  },

  timeLeft: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
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
    backgroundColor: '#FEF3C7',
    padding: hp(1),
    borderRadius: hp(1),
    marginBottom: hp(1),
  },
  winnerLabel: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#92400E',
  },
  winnerOption: {
    fontSize: hp(1.6),
    color: '#92400E',
    flex: 1,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    alignSelf: 'flex-end',
    marginBottom: hp(1),
  },
  resultIcon: {
    marginRight: wp(1),
  },
  betCoins: {
    fontWeight: '700',
    fontSize: hp(1.4),
  },
  betStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(1),
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  statIcon: {
    marginRight: wp(1),
  },
  statsText: {
    fontSize: hp(1.2),
    color: theme.colors.text,
    fontWeight: '500',
  },
  betFooter: {
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  yourVote: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  betCard: {
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: wp(3),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    // make sides have more margin
    marginLeft: hp(2),
    marginRight: hp(2),
    borderColor: '#f0f0f0',
  },
  betCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  creatorName: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    marginLeft: wp(2),
    fontWeight: '500',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  betQuestion: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: wp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: hp(1.2),
    fontWeight: '700',
  },
  betInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroupContainer: {
    flexDirection: 'column',
    gap: hp(0.5),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: wp(1),
  },
  wagerContainer: {
    alignItems: 'flex-end',
  },
  wagerText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  joinedBetCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  joinedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  notJoinedBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  header: {
    paddingRight: wp(4),
  },
});
export default GroupBets;
