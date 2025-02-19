import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Icon from 'react-native-vector-icons/FontAwesome';
import AuthService from '../../src/endpoints/auth.cjs';
import BetsService from '../../src/endpoints/bets.cjs';

const Profile = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');

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
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Icon name="heart" size={hp(3.2)} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('newBet')}>
              <Icon name="plus" size={hp(3.2)} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')}>
              <Icon name="gear" size={hp(3.2)} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>
        <View style={styles.sectionDivider} />

        <View style={styles.profileContainer}>
          <Avatar
            uri={profileImage || require('../../assets/images/icon.png')}
            size={hp(15)}
            rounded={theme.radius.xl}
          />
          {session && (
            <View style={styles.userInfo}>
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.editButton}
              >
                <Icon name="edit" size={hp(3.2)} color={theme.colors.text} />
              </Pressable>
              <Text style={styles.userName}>{username}</Text>
              <Text style={styles.userEmail}>{fullName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
              <Text style={styles.userBirthdate}>{birthdate}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await AuthService.logout();
                    navigation.navigate('Login');
                  } catch (error) {
                    console.log('Error logging out:', error);
                  }
                },
              },
            ]);
          }}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={styles.sectionDivider} />

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
              <Icon name="coins" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{session.numCoins || 0}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          )}
          {session && (
            <View style={styles.statItem}>
              <Icon name="chart-line" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{session.betsWon || 0}</Text>
              <Text style={styles.statLabel}>Bets Won</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>My Bet History</Text>
        {/*TODO replace the following with the comment below once bets are made (wired code)*/}
        {userBets.map((bet, index) => (
          <View key={index} style={styles.betItem}>
            <Text style={styles.betDescription}>{bet.bet}</Text>
            <View style={styles.betDetails}>
              <Text style={styles.betDate}>{bet.date}</Text>
              <Text style={styles.betGroup}>{bet.group}</Text>
              <View style={styles.betResult}>
                <Icon
                  name={bet.result === 'win' ? 'trophy' : 'times-circle'}
                  size={18}
                  color={bet.result === 'win' ? '#FFD700' : '#FF0000'}
                />
                <Text
                  style={[
                    styles.betCoins,
                    { color: bet.result === 'win' ? '#4CAF50' : '#FF0000' },
                  ]}
                >
                  {bet.result === 'win' ? '+' : ''}
                  {bet.coins}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 10,
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 20,
    marginBottom: 15,
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
