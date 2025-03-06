import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Touchable,
  TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

  // Update the group name display in the bet card
  const renderBetCard = (bet) => {
    const betResult = calculateBetResult(bet);
    return (
      <TouchableOpacity
        key={bet.id}
        style={styles.betCard}
        onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
      >
        <View style={styles.betHeader}>
          <Text style={styles.betDescription}>{bet.question}</Text>
          <Text style={[styles.status, { color: getStatusColor(bet.status) }]}>
            {bet.status.toUpperCase()}
          </Text>
        </View>
        <View style={styles.betDetails}>
          <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
          {/* <View style={styles.groupInfo}> */}
          {/* <Icon name="users" size={14} color={theme.colors.textLight} /> */}
          <Text style={styles.groupName}>{bet.groupName || 'No Group'}</Text>
          {/* </View> */}
          <View style={styles.betResult}>
            {betResult && (
              <Text
                style={[
                  styles.betCoins,
                  { color: betResult.result === 'win' ? '#4CAF50' : '#FF0000' },
                ]}
              >
                {betResult.result === 'win' ? '+' : ''}
                {betResult.coins}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.betStats}>
          <Text style={styles.statsText}>
            {bet.participants?.length || 0} participants
          </Text>
          <Text style={styles.statsText}>{bet.commentCount || 0} comments</Text>
          <Text style={styles.statsText}>Pool: {bet.totalPool || 0} coins</Text>
        </View>
      </TouchableOpacity>
    );
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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);
        setUsername(sessionData.username);
        setFullName(sessionData.fullName);
        setEmail(sessionData.email);
        setBirthdate(new Date(sessionData.birthdate).toLocaleDateString());
        setProfileImage(sessionData.profilePicture);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

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
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betDate: {
    fontSize: 14,
    color: '#666',
  },
  betGroup: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  betResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betCoins: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Profile;
