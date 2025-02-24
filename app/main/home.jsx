'use client';

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';

const Home = () => {
  const navigation = useNavigation();

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

  return (
    <ScreenWrapper bg="white">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BraggingRightz</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <Avatar />
            </Pressable>
          </View>
        </View>
        <View style={styles.sectionDivider} />

        {/* Coins Display */}
        <View style={styles.coinsSection}>
          <Ionicons
            name="logo-bitcoin"
            size={hp(4)}
            color={theme.colors.primary}
          />
          <Text style={styles.coinsText}>785 coins</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('NewBet')}
          >
            {/*<Icon name="plus-circle" size={hp(3)} color={theme.colors.primary} />*/}
            <Icon
              name="heart"
              size={hp(3.2)}
              strokeWidth={2}
              color={theme.colors.text}
            />
            <Text style={styles.actionText}>Join Group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('FindFriends')}
          >
            <Icon
              name="thumbs-o-up"
              size={hp(3.2)}
              strokeWidth={2}
              color={theme.colors.text}
            />{' '}
            <Text style={styles.actionText}>Something</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('LeaderBoard')}
          >
            <Icon
              name="plus-square"
              size={hp(3.2)}
              strokeWidth={2}
              color={theme.colors.text}
            />{' '}
            <Text style={styles.actionText}>Get More Coins</Text>
          </TouchableOpacity>
        </View>

        {/* My Groups Preview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyGroups')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupsScroll}
          >
            {['Sports Fans', 'Movie Buffs', 'Trivia Night'].map(
              (group, index) => (
                <View style={styles.betsContainer}>
                  <View style={styles.betItem}>
                    <TouchableOpacity key={index} style={styles.groupItem}>
                      {/*<Icon name="users" size={hp(3)} color={theme.colors.primary} />*/}
                      <Text style={styles.betDescription}>{group}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ),
            )}
          </ScrollView>
        </View>

        {/* Active Bets Preview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live & Upcoming Bets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBets')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.betsContainer}>
            {userBets.map((bet, index) => (
              <View key={index} style={styles.betItem}>
                <Text style={styles.betDescription}>{bet.bet}</Text>
                <View style={styles.betDetails}>
                  <Text style={styles.betDate}>{bet.date}</Text>
                  <Text style={styles.betGroup}>{bet.group}</Text>
                  <View style={styles.betResult}>
                    {/*<Icon*/}
                    {/*  name={bet.result === 'win' ? 'trophy' : 'times-circle'}*/}
                    {/*  size={18}*/}
                    {/*  color={bet.result === 'win' ? '#FFD700' : '#FF0000'}*/}
                    {/*/>*/}
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
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gifBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    marginTop: hp(2),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(4),
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(2),
    marginHorizontal: wp(4),
    borderRadius: hp(2),
    marginBottom: hp(3),
  },
  coinsText: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: wp(2),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(3),
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: hp(1),
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  sectionContainer: {
    marginBottom: hp(3),
    paddingHorizontal: wp(4),
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
  seeAllText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  groupsScroll: {
    flexDirection: 'row',
  },
  groupItem: {
    alignItems: 'center',
    marginRight: wp(4),
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: hp(1.5),
  },
  groupName: {
    marginTop: hp(1),
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  // betItem: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   backgroundColor: theme.colors.card,
  //   padding: hp(2),
  //   borderRadius: hp(1.5),
  //   marginBottom: hp(1),
  // },
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
  betName: {
    flex: 1,
    marginLeft: wp(2),
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
});

export default Home;
