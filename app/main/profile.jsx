import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Touchable,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Icon from 'react-native-vector-icons/FontAwesome';
import Edit from '../../assets/icons/Edit';
import AuthService from '../../src/endpoints/auth.cjs';
import BetsService from '../../src/endpoints/bets.cjs';
import Header from '../../components/Header';
import GroupsService from '../../src/endpoints/groups';
import NotificationsService from '../../src/endpoints/notifications';
import loading from '../../components/Loading';

const Profile = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        // Fetch user's bets
        const userBets = await BetsService.getUserBets(sessionData.uid);

        // Fetch group names for each bet
        const betsWithGroupNames = await Promise.all(
          userBets.map(async (bet) => {
            if (bet.groupId) {
              const groupName = await GroupsService.getGroupName(bet.groupId);
              return {
                ...bet,
                groupName,
              };
            }
            return {
              ...bet,
              groupName: 'No Group',
            };
          }),
        );

        setBets(betsWithGroupNames);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate if user has won a bet
  const calculateBetResult = (bet) => {
    if (bet.status !== 'completed') return null;

    const userOption = bet.answerOptions.find((opt) =>
      opt.participants.includes(session?.uid),
    );

    if (!userOption) return null;

    return userOption.id === bet.winningOptionId
      ? {
          result: 'win',
          coins: bet.winningsPerPerson || 0,
        }
      : {
          result: 'loss',
          coins: -bet.wagerAmount,
        };
  };

  // Define the getStatusColor function
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return theme.colors.primary;
      case 'locked':
        return '#FFA500'; // Orange color for locked status
      case 'completed':
        return '#4CAF50'; // Green color for completed status
      default:
        return theme.colors.textLight; // Default color for unknown status
    }
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

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const dayOptions = { weekday: 'long' };
    const fullDateOptions = { month: 'short', day: 'numeric', year: 'numeric' };

    if (dateObj.toDateString() === today.toDateString()) {
      return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (dateObj > new Date(today.setDate(today.getDate() - 7))) {
      return new Intl.DateTimeFormat('en-US', dayOptions).format(dateObj);
    } else {
      return new Intl.DateTimeFormat('en-US', fullDateOptions).format(dateObj);
    }
  };

  // Update the group name display in the bet card
  // const renderBetCard = (bet) => {
  //   const betResult = calculateBetResult(bet);
  //   return (
  //     <TouchableOpacity
  //       key={bet.id}
  //       style={styles.betCard}
  //       onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
  //     >
  //       <View style={styles.betHeader}>
  //         <Text style={styles.betDescription}>{bet.question}</Text>
  //         <Text style={[styles.status, { color: getStatusColor(bet.status) }]}>
  //           {bet.status.toUpperCase()}
  //         </Text>
  //       </View>
  //       <View style={styles.betDetails}>
  //         <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
  //         {/* <View style={styles.groupInfo}> */}
  //         {/* <Icon name="users" size={14} color={theme.colors.textLight} /> */}
  //         <Text style={styles.groupName}>{bet.groupName || 'No Group'}</Text>
  //         {/* </View> */}
  //         <View style={styles.betResult}>
  //           {betResult && (
  //             <Text
  //               style={[
  //                 styles.betCoins,
  //                 { color: betResult.result === 'win' ? '#4CAF50' : '#FF0000' },
  //               ]}
  //             >
  //               {betResult.result === 'win' ? '+' : ''}
  //               {betResult.coins}
  //             </Text>
  //           )}
  //         </View>
  //       </View>
  //       <View style={styles.betStats}>
  //         <Text style={styles.statsText}>
  //           {bet.participants?.length || 0} participants
  //         </Text>
  //         <Text style={styles.statsText}>{bet.commentCount || 0} comments</Text>
  //         <Text style={styles.statsText}>Pool: {bet.totalPool || 0} coins</Text>
  //       </View>
  //     </TouchableOpacity>
  //   );
  // };

  const renderBetCard = (bet) => {
    const betResult = calculateBetResult(bet);
    return (
      <TouchableOpacity
        key={bet.id}
        style={styles.betCard}
        onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
      >
        <View style={styles.betHeader}>
          <Text
            style={styles.betQuestion}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
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
            <View style={styles.dateGroupContainer}>
              <View style={styles.dateContainer}>
                <Icon
                  name="calendar"
                  size={14}
                  color={theme.colors.textLight}
                  style={styles.infoIcon}
                />
                <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
              </View>
              <View style={styles.groupContainer}>
                <Icon
                  name="users"
                  size={14}
                  color={theme.colors.textLight}
                  style={styles.infoIcon}
                />
                <Text
                  style={styles.groupName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {bet.groupName || 'No Group'}
                </Text>
              </View>
            </View>

            {betResult && (
              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      betResult.result === 'win'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(255, 0, 0, 0.1)',
                  },
                ]}
              >
                <Icon
                  name={betResult.result === 'win' ? 'trophy' : 'times-circle'}
                  size={14}
                  color={betResult.result === 'win' ? '#4CAF50' : '#FF0000'}
                  style={styles.resultIcon}
                />
                <Text
                  style={[
                    styles.betCoins,
                    {
                      color: betResult.result === 'win' ? '#4CAF50' : '#FF0000',
                    },
                  ]}
                >
                  {betResult.result === 'win' ? '+' : ''}
                  {betResult.coins}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.betStats}>
          <View style={styles.statBadge}>
            <Icon
              name="user"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>
              {bet.participants?.length || 0}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Icon
              name="comment"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>{bet.commentCount || 0}</Text>
          </View>
          <View style={styles.statBadge}>
            <Icon
              name="money"
              size={12}
              color={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statsText}>{bet.totalPool || 0}</Text>
          </View>
        </View>
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


  const userBets = [
    {
      bet: 'Who will eat the most apples?',
      date: '2/12',
      group: 'Skibidi Toilets',
      result: 'win',
      coins: 30,
    },
    {
      bet: 'What will Lolita wear tonight?',
      date: '2/11',
      group: 'Skibidi Toilets',
      result: 'loss',
      coins: -30,
    },
    {
      bet: 'How many pies will Libby buy?',
      date: '2/9',
      group: 'Skibidi Toilets',
      result: 'win',
      coins: 30,
    },
  ];

  const fetchSession = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);
      setUsername(sessionData.username);
      setFullName(sessionData.fullName);
      setEmail(sessionData.email);
      setBirthdate(new Date(sessionData.birthdate).toLocaleDateString());
      setProfileImage(sessionData.profilePicture);
      setFriendCount(sessionData.friends.length);
    } catch (error) {
      console.log('Error fetching session:', error);
    }
  };

  // Use `useFocusEffect` to update friend count dynamically when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSession(); // Fetch updated data when navigating to Profile screen
    }, []),
  );

  return (
    <ScreenWrapper bg="white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <Header
            title="Profile"
            showBackButton={false}
            rightComponent={
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.headerLogout}
              >
                <Icon
                  name="gear"
                  style={styles.logoutButton}
                  strokeWidth={2}
                  size={hp(2.5)}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            }
          />
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={
                profileImage ||
                Image.resolveAssetSource(
                  require('../../assets/images/default-avatar.png'),
                ).uri
              }
              size={hp(15)}
              rounded={theme.radius.xl}
            />
            {session && (
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.editIcon}
              >
                <Edit size={hp(2)} color={theme.colors.dark} />
              </Pressable>
            )}
          </View>
          {session && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{username}</Text>
              <Text style={styles.userEmail}>{fullName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
              <Text style={styles.userBirthdate}>{birthdate}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />


        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Stats</Text>
          <View style={styles.statsContainer}>
            {session && (
              <View style={styles.statItem}>
                <Icon name="trophy" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{session.trophies}</Text>
                <Text style={styles.statLabel}>Trophies</Text>
              </View>
            )}
            {session && (
              <View style={styles.statItem}>
                <Icon name="star-o" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{session.numCoins || 0}</Text>
                <Text style={styles.statLabel}>Coins</Text>
              </View>
            )}
            {session && (
              // TODO: live updates
              <Pressable
                onPress={() => navigation.navigate('Friends')}
                style={styles.statItem}
              >
                <Icon name="group" size={24} color="#FFD700" />
                <Text style={styles.statValue}>
                  {session.friends.length || 0}
                </Text>
                <Text style={styles.statLabel}>Friends</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/*TODO replace the following with the comment below once bets are made (wired code)*/}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Bet History</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBets')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.betsContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : bets.length > 0 ? (
              bets.map((bet) => renderBetCard(bet))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bets found</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigation.navigate('NewBet')}
                >
                  <Text style={styles.createButtonText}>Create a New Bet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {/*<View style={styles.betsContainer}>*/}
        {/*  {session?.bets?.length > 0 ? (*/}
        {/*    session.bets.map((bet, index) => (*/}
        {/*      <View key={index} style={styles.betItem}>*/}
        {/*        <Text style={styles.betDescription}>{bet.bet}</Text>*/}
        {/*        <View style={styles.betDetails}>*/}
        {/*          <Text style={styles.betDate}>{bet.date}</Text>*/}
        {/*          <Text style={styles.betGroup}>{bet.group}</Text>*/}
        {/*          <View style={styles.betResult}>*/}
        {/*            <Icon*/}
        {/*              name={bet.result === 'win' ? 'trophy' : 'times-circle'}*/}
        {/*              size={18}*/}
        {/*              color={bet.result === 'win' ? '#FFD700' : '#FF0000'}*/}
        {/*            />*/}
        {/*            <Text*/}
        {/*              style={[*/}
        {/*                styles.betCoins,*/}
        {/*                { color: bet.result === 'win' ? '#4CAF50' : '#FF0000' },*/}
        {/*              ]}*/}
        {/*            >*/}
        {/*              {bet.result === 'win' ? '+' : ''}*/}
        {/*              {bet.coins}*/}
        {/*            </Text>*/}
        {/*          </View>*/}
        {/*        </View>*/}
        {/*      </View>*/}
        {/*    ))*/}
        {/*  ) : (*/}
        {/*    <Text>No bets found.</Text>*/}
        {/*  )}*/}
        {/*</View>*/}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  headerLogout: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    paddingTop: hp(2),
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userInfo: {
    alignItems: 'left',
    marginTop: 15,
    marginHorizontal: 15,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  userBirthdate: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  logoutButton: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sectionContainer: {
    marginBottom: hp(3),
    paddingHorizontal: wp(4),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  emptyState: {
    alignItems: 'center',
    padding: hp(4),
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    marginBottom: hp(2),
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  betsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  betCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  betQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  betDetails: {
    marginBottom: 12,
  },
  betInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroupContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  infoIcon: {
    marginRight: 4,
  },
  betDate: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  groupName: {
    fontSize: 12,
    color: theme.colors.textLight,
    maxWidth: '90%',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultIcon: {
    marginRight: 4,
  },
  betCoins: {
    fontWeight: '700',
    fontSize: 14,
  },
  betStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  betGroup: {
    fontSize: 14,
    color: '#666',
  },
  betResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  statsText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
});

export default Profile;
