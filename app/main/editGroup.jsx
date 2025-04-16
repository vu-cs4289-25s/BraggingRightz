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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
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
import Icon from 'react-native-vector-icons/FontAwesome';
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
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  useEffect(() => {
    // Clean up search timeout on unmount
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, []);

  const handleUserSearch = async (text) => {
    setNewMemberUsername(text);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout to search after user stops typing
    const timeout = setTimeout(async () => {
      if (text.length >= 2) {
        setLoading(true);
        try {
          const results = await UserService.searchUsers(text);
          // Filter out current user and existing members
          const filtered = results.filter(
            (user) =>
              user.userId !== session.uid &&
              !members.some((member) => member.userId === user.userId),
          );
          setSuggestions(filtered);
        } catch (error) {
          console.error('Error searching users:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 200);

    setSearchTimeout(timeout);
  };

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

      await GroupsService.updateGroup(groupId, updateData);
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

  const handleAddMember = async (userId) => {
    try {
      if (activeTab === 'friends') {
        if (selectedFriends.length === 0) {
          Alert.alert('Error', 'Please select at least one friend');
          return;
        }

        const actualGroupId =
          typeof groupId === 'object' ? groupId.id : groupId;

        // Add all selected friends
        const results = await Promise.all(
          selectedFriends.map(async (friend) => {
            try {
              await GroupsService.addMember(
                actualGroupId,
                friend.userId,
                inviteCode,
              );
              return { success: true, user: friend };
            } catch (error) {
              console.error(`Error adding member ${friend.username}:`, error);
              return { success: false, user: friend };
            }
          }),
        );

        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        if (successful.length > 0) {
          setMembers([...members, ...successful.map((r) => r.user)]);
        }

        if (failed.length === 0) {
          Alert.alert(
            'Success!',
            `Added ${successful.length} member${successful.length > 1 ? 's' : ''} to the group`,
          );
        } else {
          Alert.alert(
            'Partial Success',
            `Added ${successful.length} member${successful.length > 1 ? 's' : ''}, but failed to add ${failed.length} member${failed.length > 1 ? 's' : ''}`,
          );
        }

        setModalVisible(false);
        setSelectedFriends([]);
      } else {
        // Validate user exists and get their profile
        try {
          const userProfile = await UserService.getUserProfile(userId);
          if (!userProfile) {
            Alert.alert('Error', 'User not found');
            return;
          }

          // Check if user is already a member
          if (members.some((member) => member.userId === userId)) {
            Alert.alert('Error', 'User is already a member of this group');
            return;
          }

          // Add member to group
          const actualGroupId =
            typeof groupId === 'object' ? groupId.id : groupId;
          await GroupsService.addMember(actualGroupId, userId, inviteCode);

          // Add member to local state with their actual profile data
          setMembers([
            ...members,
            {
              userId: userId,
              username: userProfile.username,
              profilePicture: userProfile.profilePicture || DEFAULT_USER_IMAGE,
              isAdmin: false,
              coins: userProfile.numCoins || 0,
              trophies: userProfile.trophies || 0,
            },
          ]);

          Alert.alert('Success', 'Member added successfully');
          setModalVisible(false);
          setNewMemberUsername('');
          setSuggestions([]);
        } catch (error) {
          console.error('Error adding member:', error);
          Alert.alert('Error', 'Failed to add member. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
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
              const actualGroupId =
                typeof groupId === 'object' ? groupId.id : groupId;

              if (!actualGroupId) {
                throw new Error('Invalid group ID');
              }

              await GroupsService.deleteGroup(actualGroupId, session.uid);
              Alert.alert('Success', 'Group deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Main'),
                },
              ]);
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete group. Please try again.',
              );
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
              await GroupsService.removeMember(groupId, session.uid, memberId);
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

  const toggleSelection = (userId) => {
    if (selectedFriends.includes(userId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== userId));
    } else {
      setSelectedFriends([...selectedFriends, userId]);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await GroupsService.leaveGroup(groupId, session.uid);
            Alert.alert('Success', 'You have successfully left the group', [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  });
                },
              },
            ]);
          } catch (error) {
            console.error('Error leaving group:', error);
            Alert.alert('Error', 'Failed to leave group. Please try again.');
          }
        },
      },
    ]);
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
              <Button
                title="Delete Group"
                onPress={handleDeleteGroup}
                buttonStyle={styles.deleteButton}
                textStyle={styles.deleteButtonText}
              />
            )}
            {!isAdmin && (
              <Button
                title="Leave Group"
                onPress={handleLeaveGroup}
                buttonStyle={styles.leaveButton}
                textStyle={styles.leaveButtonText}
              />
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centeredView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
          >
            <View
              style={[
                styles.modalView,
                keyboardVisible && styles.modalViewWithKeyboard,
              ]}
            >
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
                <ScrollView
                  style={styles.friendsList}
                  keyboardShouldPersistTaps="handled"
                >
                  {friends.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No friends yet</Text>
                    </View>
                  ) : (
                    friends.map((friend) => {
                      const isAlreadyMember = members.some(
                        (member) => member.userId === friend.userId,
                      );
                      const isSelected = selectedFriends.some(
                        (f) => f.userId === friend.userId,
                      );

                      return (
                        <TouchableOpacity
                          key={friend.userId}
                          style={[
                            styles.friendItem,
                            isSelected && styles.selectedFriendItem,
                            isAlreadyMember && styles.disabledFriendItem,
                          ]}
                          onPress={() => {
                            if (isAlreadyMember) return;
                            if (isSelected) {
                              setSelectedFriends(
                                selectedFriends.filter(
                                  (f) => f.userId !== friend.userId,
                                ),
                              );
                            } else {
                              setSelectedFriends([...selectedFriends, friend]);
                            }
                          }}
                          disabled={isAlreadyMember}
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
                            <View style={styles.friendTextContainer}>
                              <Text
                                style={[
                                  styles.friendName,
                                  isAlreadyMember && styles.disabledText,
                                ]}
                              >
                                {friend.username}
                              </Text>
                              {isAlreadyMember && (
                                <Text style={styles.alreadyMemberText}>
                                  Already in group
                                </Text>
                              )}
                            </View>
                          </View>
                          {!isAlreadyMember && isSelected && (
                            <Icon
                              name="check-circle"
                              size={20}
                              color={theme.colors.primary}
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              ) : (
                <View style={styles.usernameContainer}>
                  <Input
                    placeholder="Search by username"
                    value={newMemberUsername}
                    onChangeText={handleUserSearch}
                    autoCapitalize="none"
                  />
                  {loading ? (
                    <ActivityIndicator
                      style={styles.loading}
                      color={theme.colors.primary}
                      size="large"
                    />
                  ) : (
                    <ScrollView
                      style={styles.suggestionsContainer}
                      keyboardShouldPersistTaps="handled"
                    >
                      {suggestions.map((user) => (
                        <View key={user.userId} style={styles.suggestionItem}>
                          <View style={styles.userInfo}>
                            <Avatar
                              uri={user.profilePicture || DEFAULT_USER_IMAGE}
                              size={hp(6)}
                              rounded={theme.radius.xl}
                            />
                            <View style={styles.userDetails}>
                              <Text style={styles.username}>
                                {user.username}
                              </Text>
                              <View style={styles.stats}>
                                <Icon name="trophy" size={16} color="#FFD700" />
                                <Text style={styles.statsText}>
                                  {user.trophies || 0}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.addUserButton}
                            onPress={() => handleAddMember(user.userId)}
                          >
                            <Icon
                              name="plus"
                              size={20}
                              color={theme.colors.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {newMemberUsername.length >= 2 &&
                        suggestions.length === 0 &&
                        !loading && (
                          <Text style={styles.noResults}>No users found</Text>
                        )}
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setModalVisible(false);
                    setNewMemberUsername('');
                    setSelectedFriends([]);
                    setActiveTab('friends');
                  }}
                  buttonStyle={styles.modalCancelButton}
                  buttonTextStyle={styles.modalCancelButtonText}
                />
                {selectedFriends.length > 0 && (
                  <Button
                    title={
                      selectedFriends.length > 0
                        ? `Add (${selectedFriends.length})`
                        : 'Add'
                    }
                    onPress={() => handleAddMember()}
                    buttonStyle={styles.modalAddButton}
                    buttonTextStyle={styles.modalAddButtonText}
                  />
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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
    paddingHorizontal: wp(4),
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
    maxHeight: '80%',
  },
  modalViewWithKeyboard: {
    maxHeight: '60%',
    marginBottom: hp(10),
  },
  modalText: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
    gap: wp(2),
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
  modalCancelButton: {
    flex: 1,
    height: hp(6),
  },
  modalAddButton: {
    flex: 1,
    height: hp(6),
    backgroundColor: theme.colors.primary,
  },
  modalCancelButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  modalAddButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
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
    marginTop: hp(-1),
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
    color: theme.colors.primary,
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: hp(40),
    width: '100%',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    marginBottom: hp(1),
    width: '100%',
  },
  selectedFriendItem: {
    backgroundColor: `${theme.colors.primary}10`,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  friendTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: hp(2),
    color: theme.colors.text,
    marginBottom: hp(0.5),
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
  deleteButton: {
    backgroundColor: 'red',
    marginTop: hp(0.5),
    marginBottom: hp(4),
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledFriendItem: {
    backgroundColor: theme.colors.background,
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.textLight,
  },
  alreadyMemberText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: hp(-1),
  },
  checkIcon: {
    marginLeft: wp(2),
  },
  suggestionsContainer: {
    marginTop: hp(2),
    maxHeight: hp(40),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: wp(3),
    flex: 1,
  },
  username: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginLeft: wp(1),
  },
  noResults: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: hp(2),
    fontStyle: 'italic',
  },
  loading: {
    marginTop: hp(3),
  },
  addUserButton: {
    padding: wp(2),
  },
  leaveButton: {
    backgroundColor: theme.colors.red,
    marginTop: hp(0.5),
    marginBottom: hp(4),
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
