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

  const fetchGroupPic = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    return group.photoUrl;
  };

  const fetchNumMembers = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    const numMembers = group.members.length;
    return numMembers;
  };

  const fetchNumBets = async (groupId) => {
    const group = await GroupsService.getGroup(groupId);
    const numBets = group.bets.length;
    return numBets;
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
          {groups.length == 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You have no groups yet.</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('NewGroup')}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>Create a New Group</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {groups.map((group, index) => (
            <Pressable
              key={index}
              onPress={() =>
                navigation.navigate('GroupBets', { groupId: group.id })
              }
              style={styles.groupContainer}
            >
              <View style={styles.groupInfo}>
                <Avatar
                  source={
                    groupPics[group.id]
                      ? { uri: groupPics[group.id] }
                      : require('../../assets/images/default-avatar.png')
                  }
                  size={hp(5)}
                />
                <View style={styles.groupTextContainer}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={styles.groupStatsContainer}>
                    <Text
                      style={styles.groupPreview}
                    >{`${groupStats[group.id]?.numMembers || 0} Members`}</Text>
                    <Text
                      style={styles.groupPreview}
                    >{`${groupStats[group.id]?.numBets || 0} Bets`}</Text>
                  </View>
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
  groupStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  groupName: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  groupPreview: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginRight: wp(8),
    fontStyle: 'italic',
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
