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

const EditGroup = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [session, setSession] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const route = useRoute();
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        setGroupName(groupId.name);
        setInviteCode(groupId.inviteCode || '');

        const tempMembers = await Promise.all(
          groupId.members.map(async (memberId) => {
            try {
              const memberProfile = await UserService.getUserProfile(memberId);
              return memberProfile;
            } catch (error) {
              console.error(
                `Error fetching profile for UID: ${memberId}`,
                error,
              );
              return null;
            }
          }),
        );

        setMembers(tempMembers.filter((profile) => profile !== null));
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, [members]);

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

  const handleRemoveMember = (memberId) => {
    setMembers(members.filter((id) => id !== memberId));
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
            <Text style={styles.sectionTitle}>Group Members</Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {members.map((member) => (
                <TouchableOpacity key={member.userId} style={styles.memberItem}>
                  <Text style={styles.memberName}>{member.username}</Text>
                </TouchableOpacity>
              ))}
              <Button
                title="Add Member"
                onPress={() => setModalVisible(true)}
              />
            </ScrollView>
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
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: 'white',
  },
  selectedMemberItem: {
    borderColor: theme.colors.primary,
  },
  memberName: {
    fontSize: 16,
    color: theme.colors.text,
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
});
