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
                };
              }
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

        setMembers(memberProfiles.filter((profile) => profile !== null));
      } catch (error) {
        console.error('Error fetching session:', error);
        Alert.alert('Error', 'Failed to load group information');
      }
    };
    fetchSession();
  }, [groupId]);

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
      console.log(newMemberUsername);
      // Fetch user profile by username

      const userId = await UserService.getUid({ username: newMemberUsername });
      const userProfile = await UserService.getUserProfile(userId);

      if (userProfile) {
        // Add the user to the members list
        await GroupsService.addMember(groupId.id, userId, groupId.inviteCode);
        setMembers([...members, userProfile]);
        Alert.alert('Success!', 'User successfully added!');
        setModalVisible(false);
        setNewMemberUsername('');
      } else {
        Alert.alert('User Not Found', 'No user found with that username.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member. Please try again.');
      setModalVisible(false);
      setNewMemberUsername('');
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
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.username}</Text>
                    {member.isAdmin && (
                      <Text style={styles.adminBadge}>Admin</Text>
                    )}
                  </View>
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
            <Text style={styles.modalText}>Enter Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={newMemberUsername}
              onChangeText={setNewMemberUsername}
              autoCapitalize={'none'}
            />
            <Button
              title="Add"
              onPress={handleAddMember}
              style={styles.button}
            />
            <Button
              title="Cancel"
              onPress={() => setModalVisible(false)}
              style={styles.button}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};
export default EditGroup;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    flex: 1,
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
    gap: 18,
    marginTop: 20,
  },
  label: {
    fontSize: hp(2),
    marginBottom: 5,
    color: theme.colors.textDark,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    padding: 17,
    paddingHorizontal: 20,
    gap: 15,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: 'white',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  adminBadge: {
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  removeButton: {
    padding: 5,
  },
  dangerZone: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  dangerZoneTitle: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  deleteButtonText: {
    color: 'white',
  },
  inviteCodeContainer: {
    marginVertical: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: wp(4),
    borderRadius: theme.radius.lg,
    marginVertical: hp(1),
  },
  inviteCodeText: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    padding: wp(2),
  },
  inviteCodeDescription: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
  },
  saveButton: {
    marginTop: hp(2),
    marginBottom: hp(4),
    width: '100%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: 150,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
