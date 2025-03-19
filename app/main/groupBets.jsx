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

  const renderBetCard = (bet) => {
    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );
    const hasWon =
      bet.status === 'completed' && userOption?.id === bet.winningOptionId;

    return (
      <ScrollView>
        <Text style={styles.creationDate}>{formatDate(bet.createdAt)}</Text>
        <View key={bet.id} style={styles.betContainer}>
          <View style={styles.betSender}>
            <Avatar
              source={{
                uri:
                  fetchCreatorProfilePic(bet.creatorId) ||
                  require('../../assets/images/default-avatar.png'),
              }}
              size={hp(5)}
            />
            <Text style={styles.creatorName}>
              {fetchCreatorUsername(bet.creatorId)}
            </Text>
          </View>
          <TouchableOpacity
            key={bet.id}
            style={styles.betCard}
            onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
          >
            <View style={styles.betContent}>
              <View style={styles.betHeader}>
                <Text style={styles.question}>{bet.question}</Text>
              </View>
              <View style={styles.betDetails}>
                <View style={styles.detailRow}>
                  <Icon
                    name="clock-o"
                    size={16}
                    color={theme.colors.textLight}
                  />
                  <Text style={styles.timeLeft}>
                    {formatTimeLeft(bet.expiresAt)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="money" size={16} color={theme.colors.textLight} />
                  <Text style={styles.wager}>{bet.wagerAmount} coins</Text>
                  <Text
                    style={[
                      styles.status,
                      { color: getStatusColor(bet.status) },
                    ]}
                  >
                    {bet.status.toUpperCase()}
                  </Text>
                </View>
                {userOption && (
                  <View style={styles.detailRow}>
                    <Icon
                      name="check-circle"
                      size={16}
                      color={theme.colors.textLight}
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
                      size={20}
                      color={hasWon ? '#FFD700' : '#FF0000'}
                    />
                    <Text
                      style={[
                        styles.result,
                        { color: hasWon ? '#4CAF50' : '#FF0000' },
                      ]}
                    >
                      {hasWon
                        ? `Won ${bet.winningsPerPerson} coins!`
                        : 'Better luck next time!'}
                    </Text>
                  </View>
                )}
              </View>
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
                onPress={() => navigation.navigate('EditGroup',{ groupId: group })}
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
                />
              </TouchableOpacity>
            }
          />
          <View style={styles.sectionDivider} />
          {bets.map(renderBetCard)}:
          {bets.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bets have been made yet.</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('NewBet')}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  contentContainer: {
    flexGrow: 1,
  },
  creationDate: {
    backgroundColor: theme.colors.darkLight,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: hp(2),
    fontWeight: 'bold',
    fontSize: hp(1.8),
    color: theme.colors.textDark,
    alignSelf: 'center',
    textAlign: 'center',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  betCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray,
    padding: 10,
    borderRadius: 15,
    borderColor: theme.colors.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginRight: 15,
    flex: 1,
  },
  betContent: {
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  betSender: {
    padding: wp(4),
    alignContent: 'center',
  },
  creatorName: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  question: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
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
    fontStyle: 'italic',
  },
  wager: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  selectedOption: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  status: {
    fontSize: hp(1.6),
    fontWeight: 'bold',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  result: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
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
});
export default GroupBets;
