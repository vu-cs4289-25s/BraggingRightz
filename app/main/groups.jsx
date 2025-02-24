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
import GroupsService from '../../src/endpoints/groups.cjs';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import FriendService from '../../src/endpoints/friend';
import Header from '../../components/Header';

const Groups = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        const groups = await GroupsService.getUserGroups(sessionData.uid);
        const sortedGroups = groups.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
        setGroups(sortedGroups);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dateObj = new Date(date);

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

  return (
    <ScreenWrapper bg="white">
      <ScrollView>
        <View>
          <Header
            title="My Groups"
            showBackButton={true}
            rightComponent={
              <TouchableOpacity
                onPress={() => navigation.navigate('NewGroup')}
                style={styles.header}
                paddingRight={wp(4)}
              >
                <Icon
                  name="plus"
                  style={styles.addButton}
                  strokeWidth={2}
                  size={hp(2.5)}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            }
          />
          <View style={styles.sectionDivider} />
          {groups.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You have no groups yet.</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('NewGroup')}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>Create a New Group</Text>
              </TouchableOpacity>
            </View>
          )}
          :
          {groups.map((group, index) => (
            <Pressable
              key={index}
              // onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
              style={styles.groupContainer}
            >
              <View style={styles.groupInfo}>
                <Avatar source={{ uri: group.avatar }} size={hp(5)} />
                <View style={styles.groupTextContainer}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupPreview}>{group.latestMessage}</Text>
                </View>
                <Text style={styles.groupLastMessage}>
                  {formatDate(group.updatedAt)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    marginRight: wp(4),
  },
  addButton: {
    padding: hp(1),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
    marginHorizontal: 10,
  },

  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  groupTextContainer: {
    marginLeft: wp(3),
    flex: 1,
  },
  groupName: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  groupPreview: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  groupLastMessage: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'right',
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
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(2),
  },
});

export default Groups;
