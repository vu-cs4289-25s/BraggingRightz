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
  Modal,
  Image,
  Platform,
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
import Header from '../../components/Header';
const DEFAULT_GROUP_IMAGE = require('../../assets/images/default-avatar.png');

const Groups = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupPics, setGroupPics] = useState({});
  const [groupStats, setGroupStats] = useState({});

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

        const pics = {};
        const stats = {};
        for (const group of sortedGroups) {
          pics[group.id] = await fetchGroupPic(group.id);
          stats[group.id] = {
            numMembers: await fetchNumMembers(group.id),
            numBets: await fetchNumBets(group.id),
          };
        }
        setGroupPics(pics);
        setGroupStats(stats);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Trigger a refresh of the home screen when navigating back
      navigation.navigate('Main', { screen: 'Home', refresh: Date.now() });
    });

    return unsubscribe;
  }, [navigation]);

  const formatDate = (date) => {
    if (!date) return 'Unknown Date';
    let dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
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

  const fetchGroupPic = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    return group.photoUrl;
  };

  const fetchNumMembers = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    return group.members.length;
  };

  const fetchNumBets = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    return group.bets.length;
  };

  return (
    <ScreenWrapper bg="white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header
          title="My Groups"
          showBackButton
          rightComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate('NewGroup')}
              style={styles.addGroupButton}
            >
              <Icon name="plus" size={hp(2.4)} color={theme.colors.text} />
            </TouchableOpacity>
          }
        />

        <View style={styles.topSpacer} />

        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You have no groups yet.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewGroup')}
              style={styles.createButton}
            >
              <Text style={styles.createButtonText}>Create a New Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupList}>
            {groups.map((group, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  navigation.navigate('GroupBets', { groupId: group.id })
                }
                style={styles.groupCard}
              >
                <Avatar
                  uri={
                    groupPics[group.id] ||
                    Image.resolveAssetSource(DEFAULT_GROUP_IMAGE).uri
                  }
                  size={hp(5.5)}
                  rounded={theme.radius.xl}
                />
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {groupStats[group.id]?.numMembers || 0}{' '}
                      {groupStats[group.id]?.numMembers === 1
                        ? 'Member'
                        : 'Members'}
                    </Text>
                    <Text style={styles.metaText}>
                      {groupStats[group.id]?.numBets || 0} Bets
                    </Text>
                  </View>
                </View>
                <View style={styles.dateChevron}>
                  <Text style={styles.groupDate}>
                    {formatDate(group.updatedAt)}{' '}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={hp(1.8)}
                    color="#bbb"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topSpacer: {
    marginTop: hp(2.5),
  },

  dateChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(1),
  },

  addGroupButton: {
    marginRight: wp(4),
    padding: hp(1),
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: hp(2),
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: '600',
  },
  groupList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(3),
  },
  groupCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    marginBottom: hp(1.5),
    borderRadius: 14,
    borderColor: '#eee',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groupDetails: {
    marginLeft: wp(3),
    flex: 1,
  },
  groupName: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: hp(0.5),
  },
  metaText: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
    marginRight: wp(4),
    fontStyle: 'italic',
  },
  groupDate: {
    fontSize: hp(1.6),
    color: '#aaa',
  },
});

export default Groups;
