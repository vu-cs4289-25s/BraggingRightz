import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../app/main/home'; // adjust paths as needed
import NewBet from '../app/main/newBet';
import Profile from '../app/main/profile';
import { theme } from '../constants/theme';
import Location from '../assets/icons/Location';
import Icon from 'react-native-vector-icons/FontAwesome';
import { hp } from '../helpers/common';
import Avatar from './Avatar';
import LeaderboardScreen from '../app/main/leaderboard';
import FriendService from '../src/endpoints/friend.cjs';
import { useState, useEffect } from 'react';
import { auth } from '../src/firebase/config';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const [friends, setFriends] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchFriends = async () => {
      const friendsList = await FriendService.getFriendList();
      setFriends(friendsList);
    };
    fetchFriends();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // we use our custom header inside screens if needed
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          height: hp(7) + hp(2),
          paddingBottom: hp(1),
          marginBottom: 0,
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="NewBet"
        component={NewBet}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus" color={color} size={size} />
          ),
          tabBarLabel: 'Create',
        }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="trophy" color={color} size={size} />
          ),
          tabBarLabel: 'Leaderboard',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => <Avatar size={hp(3)} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
