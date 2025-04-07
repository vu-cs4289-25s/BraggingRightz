import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Camera from '../../assets/icons/Camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import Input from '../../components/Input';
import AuthService from '../../src/endpoints/auth.cjs';
import UserService from '../../src/endpoints/user.cjs';
import GroupsService from '../../src/endpoints/groups.cjs';
import Icon from 'react-native-vector-icons/Ionicons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import UserProfileModal from '../../components/UserProfileModal';
import FriendService from '../../src/endpoints/friend.cjs';

const DEFAULT_GROUP_IMAGE = require('../../assets/images/default-avatar.png');
const DEFAULT_USER_IMAGE = require('../../assets/images/default-avatar.png');

const EditGroup = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [session, setSession] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const route = useRoute();
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        // Get the actual group ID string if groupId is an object
        const actualGroupId =
          typeof groupId === 'object' ? groupId.id : groupId;

        // Fetch group data
        const groupData = await GroupsService.getGroup(actualGroupId);
        if (!groupData) {
          throw new Error('Group not found');
        }

        setGroup(groupData);
        setGroupName(groupData.name);
        setInviteCode(groupData.inviteCode || '');
        setGroupImage(groupData.photoUrl || null);

        // Check if user is an admin
        setIsAdmin(groupData.admins?.includes(sessionData.uid));

        // Fetch member profiles
        const memberProfiles = await Promise.all(
          groupData.members.map(async (memberId) => {
            try {
              if (!memberId) {
                console.warn('Invalid member ID found:', memberId);
                return null;
              }

              const userDocRef = doc(db, 'users', memberId);
              const userDocSnap = await getDoc(userDocRef);

              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                return {
                  userId: memberId,
                  username: userData.username || 'Unknown User',
                  profilePicture:
                    userData.profilePicture ||
                    Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri,
                  isAdmin: groupData.admins?.includes(memberId),
                  coins: userData.numCoins || 0,
                  trophies: userData.trophies || 0,
                };
              }
              console.warn('User document not found for ID:', memberId);
              return null;
            } catch (error) {
              console.error(
                `Error fetching profile for UID: ${memberId}`,
                error,
              );
              return null;
            }
          }),
        );

        // Filter out null entries and set members
        const validMembers = memberProfiles.filter(
          (profile) => profile !== null && profile.userId,
        );
        setMembers(validMembers);
      } catch (error) {
        console.error('Error fetching session:', error);
        Alert.alert('Error', 'Failed to load group information');
      }
    };
    fetchSession();
  }, [groupId]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsList = await FriendService.getFriendList('active');
        setFriends(friendsList);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    if (modalVisible) {
      fetchFriends();
    }
  }, [modalVisible]);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!groupName?.trim()) {
        Alert.alert('Error', 'Group name is required');
        return;
      }

      const updateData = {
        name: groupName.trim(),
        photoUrl: groupImage,
      };

      await GroupsService.updateGroup(groupId.id, updateData);
      Alert.alert('Success', 'Group updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Groups'),
        },
      ]);
    } catch (error) {
      console.error('Error saving group:', error);
      Alert.alert('Error', error.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

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

        setGroupImage(base64Image);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleAddMember = async () => {
    try {
      let userIdToAdd;
      let username;

      if (activeTab === 'friends' && selectedFriend) {
        userIdToAdd = selectedFriend.userId;
        username = selectedFriend.username;
      } else if (activeTab === 'username' && newMemberUsername) {
        userIdToAdd = await UserService.getUid({ username: newMemberUsername });
        username = newMemberUsername;
      } else {
        Alert.alert('Error', 'Please select a friend or enter a username');
        return;
      }

      if (!userIdToAdd) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Check if user is already a member
      if (members.some((member) => member.userId === userIdToAdd)) {
        Alert.alert('Error', 'User is already a member of this group');
        return;
      }

      const userProfile = await UserService.getUserProfile(userIdToAdd);

      if (userProfile) {
        // Get the actual group ID string if groupId is an object
        const actualGroupId =
          typeof groupId === 'object' ? groupId.id : groupId;
        await GroupsService.addMember(actualGroupId, userIdToAdd, inviteCode);
        setMembers([...members, userProfile]);
        Alert.alert('Success!', 'User successfully added!');
        setModalVisible(false);
        setNewMemberUsername('');
        setSelectedFriend(null);
        setActiveTab('friends');
      } else {
        Alert.alert('Error', 'Failed to add member. Please try again.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member. Please try again.');
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await GroupsService.deleteGroup(groupId.id, session.uid);
              Alert.alert('Success', 'Group deleted successfully');
              navigation.navigate('Groups');
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', error.message || 'Failed to delete group');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRemoveMember = (memberId, username) => {
    if (memberId === session.uid) {
      Alert.alert('Error', 'You cannot remove yourself from the group');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from the group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await GroupsService.removeMember(
                groupId.id,
                session.uid,
                memberId,
              );
              setMembers(
                members.filter((member) => member.userId !== memberId),
              );
              Alert.alert('Success', 'Member removed successfully');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.message || 'Failed to remove member');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleMemberPress = (memberId) => {
    if (memberId === session?.uid) return; // Don't show modal for current user
    setSelectedUserId(memberId);
    setShowUserProfile(true);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <Header title={`${groupName}`} showBackButton={true} />
          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarContainer}
              >
                <Avatar
                  uri={
                    groupImage ||
                    Image.resolveAssetSource(DEFAULT_GROUP_IMAGE).uri
                  }
                  size={hp(15)}
                  rounded={theme.radius.xl}
                />
                <View style={styles.editIcon}>
                  <Camera size={hp(2)} color={theme.colors.dark} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Invite Code Section */}
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.sectionTitle}>Invite Code</Text>
              <View style={styles.inviteCodeBox}>
                <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    if (inviteCode) {
                      await Clipboard.setStringAsync(inviteCode);
                      Alert.alert('Copied!', 'Invite code copied to clipboard');
                    }
                  }}
                  style={styles.copyButton}
                >
                  <Icon
                    name="copy"
                    size={hp(2.5)}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.inviteCodeDescription}>
                Share this code with friends to let them join the group
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Edit Group Name</Text>
            <Input
              placeholder="Edit Group Name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
            <Text style={styles.sectionTitle}>Group Members</Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {members.map((member) => (
                <View key={member.userId} style={styles.memberItem}>
                  <TouchableOpacity
                    style={styles.memberInfo}
                    onPress={() => handleMemberPress(member.userId)}
                    disabled={member.userId === session?.uid}
                  >
                    <Avatar
                      uri={
                        member.profilePicture ||
                        Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri
                      }
                      size={hp(4)}
                      rounded={theme.radius.xl}
                    />
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      {member.isAdmin && (
                        <Text style={styles.adminBadge}>Admin</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {isAdmin && member.userId !== session.uid && (
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveMember(member.userId, member.username)
                      }
                      style={styles.removeButton}
                    >
                      <Icon name="close" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <Button
                title="Add Member"
                onPress={() => setModalVisible(true)}
              />
            </ScrollView>

            {isAdmin && (
              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                <Button
                  title="Delete Group"
                  onPress={handleDeleteGroup}
                  style={styles.deleteButton}
                  textStyle={styles.deleteButtonText}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalText}>Add New Member</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'friends' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('friends')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'friends' && styles.activeTabText,
                  ]}
                >
                  Friends
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'username' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('username')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'username' && styles.activeTabText,
                  ]}
                >
                  Username
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'friends' ? (
              <ScrollView style={styles.friendsList}>
                {friends.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No friends yet</Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.userId}
                      style={[
                        styles.friendItem,
                        selectedFriend?.userId === friend.userId &&
                          styles.selectedFriendItem,
                      ]}
                      onPress={() => setSelectedFriend(friend)}
                    >
                      <View style={styles.friendInfo}>
                        <Avatar
                          uri={
                            friend.profilePicture ||
                            Image.resolveAssetSource(DEFAULT_USER_IMAGE).uri
                          }
                          size={hp(4)}
                          rounded={theme.radius.xl}
                        />
                        <Text style={styles.friendName}>{friend.username}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            ) : (
              <View style={styles.usernameContainer}>
                <Text style={styles.modalDescription}>
                  Enter the username of the person you want to add
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter username"
                  placeholderTextColor={theme.colors.textLight}
                  value={newMemberUsername}
                  onChangeText={setNewMemberUsername}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setNewMemberUsername('');
                  setSelectedFriend(null);
                  setActiveTab('friends');
                }}
                style={[styles.modalButton, styles.cancelButton]}
                textStyle={styles.cancelButtonText}
              />
              <Button
                title="Add Member"
                onPress={handleAddMember}
                style={[styles.modalButton, styles.addButton]}
              />
            </View>
          </View>
        </View>
      </Modal>

      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
      />
    </ScreenWrapper>
  );
};
export default EditGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  form: {
    padding: wp(4),
    gap: hp(2),
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  editIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: hp(2),
  },
  inviteCodeContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginVertical: hp(1),
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: wp(4),
    borderRadius: theme.radius.lg,
    marginVertical: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inviteCodeText: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  inviteCodeDescription: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: wp(4),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp(3),
  },
  memberDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    flex: 1,
  },
  adminBadge: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  removeButton: {
    padding: wp(2),
  },
  dangerZone: {
    marginTop: hp(4),
    padding: wp(4),
    backgroundColor: '#fff5f5',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerZoneTitle: {
    color: theme.colors.error,
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  deleteButtonText: {
    color: 'white',
  },
  copyButton: {
    padding: wp(2),
  },
  saveButton: {
    marginTop: hp(2),
    marginBottom: hp(4),
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    padding: wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(3),
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(3),
    fontSize: hp(1.8),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(3),
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  closeButton: {
    padding: wp(2),
  },
  modalDescription: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginBottom: hp(3),
    textAlign: 'center',
  },
  modalButton: {
    flex: 1,
    height: hp(6),
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    padding: wp(1),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: theme.radius.lg,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: hp(40),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
  },
  selectedFriendItem: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  friendName: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  usernameContainer: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: wp(4),
  },
  emptyText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
});
