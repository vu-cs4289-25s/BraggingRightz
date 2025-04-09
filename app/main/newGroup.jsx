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

    setLoading(true);

    try {
      await GroupsService.createGroup({
        creatorId: session.uid,
        name: groupName.current,
        description: description.current,
        members: selectedMembers,
        photoUrl: groupPhoto,
      });

      Alert.alert('Group Successfully Created!', 'Create Some Bets!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Main', { screen: 'Groups' }),
        },
      ]);
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
          onPress: () => navigation.replace('Main', { screen: 'Groups' }),
        },
      ]);
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
              <TouchableOpacity onPress={pickImage}>
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
                  <Camera
                    size={hp(2)}
                    color={theme.colors.dark}
                    rounded={theme.radius.xl}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Group Name</Text>
                <Input
                  placeholder="Name your new group"
                  onChangeText={(value) => (groupName.current = value)}
                  style={{ width: '100%' }}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Group Description</Text>
                <Input
                  placeholder="Add your group description"
                  onChangeText={(value) => (description.current = value)}
                  multiline
                  style={{ width: '100%' }}
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Add Members (Optional)</Text>
                <View style={styles.membersContainer}>
                  {friends.length === 0 ? (
                    <Text style={styles.emptyText}>
                      You have no friends yet.
                    </Text>
                  ) : (
                    friends.map((friend) => (
                      <TouchableOpacity
                        key={friend.userId}
                        style={[
                          styles.friendItem,
                          selectedMembers.includes(friend.userId) &&
                            styles.selectedFriendItem,
                        ]}
                        onPress={() => toggleSelection(friend.userId)}
                      >
                        <View style={styles.friendInfo}>
                          <Avatar
                            uri={friend.profilePicture}
                            size={hp(4)}
                            rounded={theme.radius.full}
                          />
                          <Text style={styles.friendName}>
                            {friend.username}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <Text style={styles.helperText}>
                  You can add or remove members later
                </Text>
              </View>

              <Button
                title="Create Group"
                loading={loading}
                onPress={onSubmit}
                style={{ height: hp(7) }}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.joinContainer}>
            <View style={styles.joinContent}>
              <Text style={styles.joinTitle}>Join a Group</Text>
              <Text style={styles.joinDescription}>
                Enter the invite code to join a group
              </Text>
              <View style={styles.codeInputContainer}>
                <Input
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  containerStyle={styles.inviteCodeInput}
                />
                <TouchableOpacity
                  style={styles.pasteButton}
                  onPress={async () => {
                    const text = await Clipboard.getStringAsync();
                    setInviteCode(text);
                  }}
                >
                  <Text>Paste</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    padding: wp(4),
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    padding: wp(1),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderRadius: theme.radius.xxl,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: theme.colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.blue,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: hp(4),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: hp(3),
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
  form: {
    width: '100%',
    gap: hp(2.5),
    paddingHorizontal: wp(2),
  },
  formSection: {
    width: '100%',
    gap: hp(1),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  inputContainer: {
    width: '100%',
    gap: hp(1),
  },
  textArea: {
    height: hp(10),
    textAlignVertical: 'top',
    paddingTop: hp(1),
    width: '100%',
  },
  dropdown: {
    height: hp(6),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    width: '100%',
  },
  dropdownPlaceholder: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
  },
  dropdownSelected: {
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
  membersContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    minHeight: hp(20),
    marginBottom: hp(2),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(1),
  },
  selectedFriendItem: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  friendName: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: '500',
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: wp(4),
  },
  joinContent: {
    alignItems: 'center',
    paddingTop: hp(4),
    gap: hp(2),
    width: '100%',
    paddingHorizontal: wp(4),
  },
  joinTitle: {
    fontSize: hp(2.4),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.2),
  },
  joinDescription: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  codeInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2),
  },
  inviteCodeInput: {
    flex: 1,
    height: hp(8),
  },
  pasteButton: {
    height: hp(8),
    width: hp(8),
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.blue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    width: '90%',
    height: hp(8),
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.xxl,
  },
  helperText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: hp(1),
  },
});
