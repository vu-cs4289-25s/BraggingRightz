import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import Camera from '../../assets/icons/Camera';
import { useNavigation } from '@react-navigation/native';
import Input from '../../components/Input';
import Icon from '../../assets/icons';
import AuthService from '../../src/endpoints/auth.cjs';
import UserService from '../../src/endpoints/user.cjs';

const EditProfile = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setUserId(sessionData.uid);
        setProfileImage(sessionData.profilePicture);
        setFullName(sessionData.fullName);
        setUsername(sessionData.username);
        setEmail(sessionData.email);
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

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

        setProfileImage(base64Image);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (profileImage) updateData.profilePicture = profileImage;

      await UserService.updateUserProfile({
        userId: userId,
        updateData: updateData,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.navigate('Main', { screen: 'Profile' });
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <Header title="Edit Profile" showBackButton={true} />
          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarContainer}
              >
                <Avatar
                  uri={
                    profileImage ||
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
            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
              Please fill in your profile details
            </Text>
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your new username"
              value={username}
              onChangeText={setUsername}
            />
            <Input
              icon={<Icon name="mail" />}
              placeholder="Enter your new email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              icon={<Icon name="lock" />}
              placeholder="Enter your new password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button title="Update" loading={loading} onPress={handleUpdate} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
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
});
