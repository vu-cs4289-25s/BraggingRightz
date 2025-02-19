import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { useRef, useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../src/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import AuthService from '../src/endpoints/auth';

const SignUp = () => {
  const navigation = useNavigation();
  const emailRef = useRef('');
  const nameRef = useRef('');
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // Reduced quality for smaller file size
        maxWidth: 500, // Smaller max dimensions
        maxHeight: 500,
        base64: true, // Get base64 data
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('uriToBlob failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const uploadImage = async (userId) => {
    if (!profileImage) return null;

    try {
      // Convert URI to blob using XMLHttpRequest
      const blob = await uriToBlob(profileImage);

      // Create file reference
      const filename = `profile_${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profileImages/${filename}`);

      // Optional: define metadata for the image
      const metadata = { contentType: 'image/jpeg' };

      // Upload file with metadata
      await uploadBytes(storageRef, blob, metadata);
      console.log('Uploaded blob successfully');

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Got download URL:', downloadUrl);

      return downloadUrl;
    } catch (error) {
      console.log('Upload error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        userId: userId,
      });
      throw new Error(
        'Failed to upload profile picture. Please try again later.',
      );
    }
  };

  const onSubmit = async () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !nameRef.current ||
      !usernameRef.current ||
      !birthdate
    ) {
      Alert.alert('Error', 'Please fill out all fields!');
      return;
    }

    if (usernameRef.current.length < 4) {
      Alert.alert('Error', 'Username must be at least 4 characters long!');
      return;
    }

    setLoading(true);
    try {
      // First register the user to get their UID
      const user = await AuthService.register({
        username: usernameRef.current,
        password: passwordRef.current,
        email: emailRef.current,
        fullName: nameRef.current,
        birthdate: birthdate.toISOString(),
      });

      let profilePictureUrl = null;

      // Upload profile picture using the user's UID if image is selected
      if (profileImage) {
        setUploadingImage(true);
        try {
          profilePictureUrl = await uploadImage(user.uid);

          // Update the user's profile with the image URL
          await AuthService.updateProfile(user.uid, {
            profilePicture: profilePictureUrl,
          });
        } catch (error) {
          console.log('Error uploading profile picture:', error);
          Alert.alert(
            'Warning',
            'Failed to upload profile picture, but registration was successful.',
          );
        }
      }

      Alert.alert(
        'Registration Successful',
        `Welcome, ${user.username}! Ready to Bet?`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Registration Failed: ', error.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ScreenWrapper bg="white">
          <StatusBar style="dark" />
          <View style={styles.container}>
            <BackButton navigation={navigation} />

            <View>
              <Text style={styles.welcomeText}>Let's get started!</Text>
            </View>

            <View style={styles.form}>
              <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                Please fill in the details to create an account
              </Text>

              {/* Profile Picture Selection */}
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={pickImage}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="person-outline"
                      size={40}
                      color={theme.colors.text}
                    />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </TouchableOpacity>

              <Input
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder="Enter your full name"
                onChangeText={(value) => (nameRef.current = value)}
              />
              <Input
                icon={<Icon name="video" size={26} strokeWidth={1.6} />}
                placeholder="Enter your username"
                onChangeText={(value) => (usernameRef.current = value)}
              />
              <Input
                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                placeholder="Enter your email"
                onChangeText={(value) => (emailRef.current = value)}
              />
              <Pressable onPress={() => setShowDatePicker(true)}>
                <Input
                  icon={<Icon name="birthday" size={26} strokeWidth={1.6} />}
                  placeholder="Enter your birthdate"
                  value={birthdate.toLocaleDateString()}
                />
              </Pressable>
              <Input
                onPress={() => setShowDatePicker(true)}
                icon={<Icon name="birthday" size={26} strokeWidth={1.6} />}
                placeholder="Enter your birthdate"
                value={birthdate.toLocaleDateString()}
              />
              {showDatePicker && (
                <Modal
                  transparent={true}
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                      <DateTimePicker
                        value={birthdate}
                        mode="date"
                        display="spinner" // or "default" depending on your platform/UX preference
                        onChange={(event, selectedDate) => {
                          // On Android, the picker fires onChange on cancel too.
                          if (event.type === 'set' && selectedDate) {
                            setBirthdate(selectedDate);
                          }
                          setShowDatePicker(false);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalCloseButton}
                      >
                        <Text style={styles.modalCloseText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}
              <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder="Enter your password"
                secureTextEntry
                onChangeText={(value) => (passwordRef.current = value)}
              />
              <Button
                title={
                  loading || uploadingImage ? 'Creating Account...' : 'Sign up'
                }
                loading={loading || uploadingImage}
                onPress={onSubmit}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text
                  style={[
                    styles.footerText,
                    {
                      color: theme.colors.primaryDark,
                      fontWeight: theme.fonts.semibold,
                    },
                  ]}
                >
                  Log in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScreenWrapper>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(4),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: hp(-2),
    marginBottom: hp(-8),
  },
  form: {
    gap: 25,
  },
  forgotPassword: {
    textAlign: 'right',
    color: theme.colors.text,
    fontWeight: theme.fonts.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginBottom: hp(5),
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  avatarContainer: {
    width: hp(15),
    height: hp(15),
    borderRadius: hp(7.5),
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: hp(2),
    position: 'relative',
  },
  avatar: {
    width: hp(14),
    height: hp(14),
    borderRadius: hp(7),
  },
  avatarPlaceholder: {
    width: hp(14),
    height: hp(14),
    borderRadius: hp(7),
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: wp(80),
    alignItems: 'center',
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 10,
  },
  modalCloseText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
