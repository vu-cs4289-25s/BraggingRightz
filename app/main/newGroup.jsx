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
import { useNavigation } from '@react-navigation/native';
import Input from '../../components/Input';
import User from '../../assets/icons/User';
import * as ImagePicker from 'expo-image-picker';
import FriendService from '../../src/endpoints/friend.cjs';
import Camera from '../../assets/icons/Camera';

const NewGroup = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const groupName = useRef('');
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const description = useRef('');
  const [groupPhoto, setGroupPhoto] = useState(null);

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

    // if (selectedMembers.length === 0) {
    //   Alert.alert("Create New Group", "Please select at least one member");
    // }
    setLoading(true);

    try {
      await GroupsService.createGroup({
        creatorId: session.uid,
        name: groupName.current,
        description: description.current,
        members: selectedMembers,
        isPrivate: isPrivate,
      });

      Alert.alert('Group Successfully Created!', 'Create Some Bets!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Groups'),
        },
      ]);
      navigation.navigate('Groups');
    } catch (error) {
      Alert.alert('Group Creation Failed', error.message, [
        {
          text: 'Try Again',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        // Friends object populate, though waiting on username to not be null
        const friendsList = await FriendService.getFriendList();
        setFriends(friendsList);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Create Group" showBackButton={true} />
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
            <View style={styles.inputContainer}>
              <Dropdown
                data={friends.map((friend) => ({
                  label: friend.username,
                  value: friend.userId,
                }))}
                labelField="label"
                valueField="value"
                placeholder="Select members"
                value={selectedMembers}
                onChange={(item) => {
                  if (!selectedMembers.includes(item.value)) {
                    setSelectedMembers([...selectedMembers, item.value]);
                  }
                }}
                multiple={true}
                style={styles.dropdown}
              />
            </View>
            {/*button*/}
            <Button
              title={'Create Group'}
              loading={loading}
              onPress={onSubmit}
              marginTop={10}
            />
          </View>
        </ScrollView>
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
});
