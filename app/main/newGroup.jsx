import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import AuthService from '../../src/endpoints/auth.cjs';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { Dropdown } from 'react-native-element-dropdown';
import GroupsService from '../../src/endpoints/groups.cjs';
import { useNavigation, useRoute } from '@react-navigation/native';
import Input from '../../components/Input';
import User from '../../assets/icons/User';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import FriendService from '../../src/endpoints/friend.cjs';
import Camera from '../../assets/icons/Camera';

const NewGroup = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialTab } = route.params || {};
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const groupName = useRef('');
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const description = useRef('');
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'create');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Group Profile Pic Starter Code
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Permission to access camera roll is required!',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
        width: 300,
        height: 300,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        const base64Size = selectedImage.base64
          ? (selectedImage.base64.length * 3) / 4
          : 0;
        if (base64Size > 900000) {
          Alert.alert(
            'Image Too Large',
            'Please choose a smaller image or try again with a different photo.',
          );
          return;
        }

        const base64Image = selectedImage.base64
          ? `data:image/jpeg;base64,${selectedImage.base64}`
          : selectedImage.uri;

        setGroupPhoto(base64Image);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const onSubmit = async () => {
    if (!groupName.current) {
      Alert.alert('Create New Group', 'Please name your group');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Create New Group', 'Please select at least one member');
      return;
    }

    setLoading(true);

    console.log(`Creating group with members: ${selectedMembers}`);

    try {
      await GroupsService.createGroup({
        creatorId: session.uid,
        name: groupName.current,
        description: description.current,
        members: selectedMembers,
        isPrivate: isPrivate,
        photoUrl: groupPhoto,
      });

      Alert.alert('Group Successfully Created!', 'Create Some Bets!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Groups'),
        },
      ]);
      navigation.navigate('Groups');
    } catch (error) {
      Alert.alert('Group Creation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Join Group', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const processedInviteCode = inviteCode.trim().toUpperCase();
      console.log('Original invite code:', inviteCode);
      console.log('Processed invite code:', processedInviteCode);
      console.log('Session user ID:', session?.uid);

      // Get all groups from the database
      const group =
        await GroupsService.findGroupByInviteCode(processedInviteCode);

      if (!group) {
        console.log('No group found for invite code:', processedInviteCode);
        throw new Error('Invalid invite code. Please check and try again.');
      }

      console.log('Found group:', {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        members: group.members,
      });

      // Check if user is already a member
      if (group.members.includes(session.uid)) {
        console.log('User is already a member of the group');
        throw new Error('You are already a member of this group.');
      }

      console.log('Attempting to add member:', {
        groupId: group.id,
        userId: session.uid,
      });

      // Join the group
      await GroupsService.addMember(group.id, session.uid);

      console.log('Successfully joined group');

      Alert.alert('Success', 'You have joined the group!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Groups'),
        },
      ]);
      navigation.navigate('Groups');
    } catch (error) {
      console.error('Join group error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        const friendsList = await FriendService.getFriendList('active');
        setFriends(friendsList);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  const toggleSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Groups" showBackButton={true} />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
            onPress={() => setActiveTab('create')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'create' && styles.activeTabText,
              ]}
            >
              Create Group
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'join' && styles.activeTab]}
            onPress={() => setActiveTab('join')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'join' && styles.activeTabText,
              ]}
            >
              Join Group
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'create' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarContainer}
              >
                <Avatar
                  uri={
                    groupPhoto ||
                    Image.resolveAssetSource(
                      require('../../assets/images/default-avatar.png'),
                    ).uri
                  }
                  size={hp(15)}
                  rounded={theme.radius.xl}
                />
                <View style={styles.editIcon}>
                  <Camera size={hp(2)} color={theme.colors.dark} />
                </View>
              </TouchableOpacity>
            </View>
            {/*form*/}
            <View style={styles.form}>
              <Text style={{ fontSize: hp(2), color: theme.colors.text }}>
                Group Name
              </Text>
              <View style={styles.inputContainer}>
                <Input
                  icon={<User name="User" size={26} strokeWidth={1.6} />}
                  placeholder="Name your new group"
                  onChangeText={(value) => (groupName.current = value)}
                />
              </View>

              <Text style={{ fontSize: hp(2), color: theme.colors.text }}>
                Description
              </Text>
              <View style={styles.inputContainer}>
                <Input
                  placeholder="Add group description"
                  onChangeText={(value) => (description.current = value)}
                />
              </View>

              <Text style={{ fontSize: hp(2), color: theme.colors.text }}>
                Visibility
              </Text>
              <View style={styles.inputContainer}>
                <Dropdown
                  data={[
                    { label: 'Private', value: true },
                    { label: 'Public', value: false },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select visibility"
                  value={isPrivate}
                  onChange={(item) => setIsPrivate(item.value)}
                  style={styles.dropdown}
                />
              </View>

              <Text style={{ fontSize: hp(2), color: theme.colors.text }}>
                Add Members
              </Text>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.inputContainer}>
                  {friends.length == 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        You have no friends yet.
                      </Text>
                    </View>
                  ) : null}
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.userId}
                      style={[
                        styles.friendItem,
                        selectedMembers.includes(friend.userId) &&
                          styles.selectedFriendItem,
                      ]}
                      onPress={() => toggleSelection(friend.userId)}
                    >
                      <Text style={styles.friendName}>{friend.username}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Button
                title={'Create Group'}
                loading={loading}
                onPress={onSubmit}
                marginTop={10}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.joinContainer}>
            <Text style={styles.joinTitle}>Join a Group</Text>
            <Text style={styles.joinDescription}>
              Enter the invite code to join a group
            </Text>
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              style={styles.inviteCodeInput}
            />
            <Button
              title="Join Group"
              onPress={handleJoinGroup}
              loading={loading}
              style={styles.joinButton}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default NewGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderRadius: theme.radius.lg,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  form: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
  },
  groupDetailsText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  dropdown: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  friendItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: 'white',
  },
  selectedFriendItem: {
    borderColor: theme.colors.primary,
  },
  friendName: {
    fontSize: 16,
  },
  joinContainer: {
    flex: 1,
    padding: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  joinDescription: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginBottom: hp(3),
    textAlign: 'center',
  },
  inviteCodeInput: {
    width: '100%',
    marginBottom: hp(3),
  },
  joinButton: {
    width: '100%',
  },
});
