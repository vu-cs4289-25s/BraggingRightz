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

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
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
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Avatar size={hp(3)}/>
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
