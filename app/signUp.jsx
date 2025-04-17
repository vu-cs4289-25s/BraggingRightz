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
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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
  const [verificationSent, setVerificationSent] = useState(false);

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
    // Trim the values to check for empty strings
    const email = emailRef.current?.trim() || '';
    const username = usernameRef.current?.trim() || '';
    const password = passwordRef.current?.trim() || '';
    const name = nameRef.current?.trim() || '';

    if (!email || !username || !password || !name) {
      Alert.alert('Sign Up', 'Please fill all fields!');
      return;
    }

    if (username.length < 4) {
      Alert.alert('Error', 'Username must be at least 4 characters long!');
      return;
    }

    if (!isAtLeast13(birthdate)) {
      Alert.alert(
        'Age Restriction',
        'You must be at least 13 years old to sign up.',
      );
      return;
    }

    setLoading(true);
    try {
      // Check if username is available
      const usernameAvailable = await AuthService.checkUsername(username);
      if (!usernameAvailable) {
        Alert.alert('Error', 'This username is already taken.');
        return;
      }

      // Check if email is available
      const emailAvailable = await AuthService.checkEmail(email);
      if (!emailAvailable) {
        Alert.alert('Error', 'This email is already in use.');
        return;
      }

      // Create the registration data
      const registrationData = {
        email,
        username,
        password,
        fullName: name,
        birthdate: birthdate.toISOString(),
        profileImage: profileImage,
      };

      // Create the account first
      const userCredential = await AuthService.register(registrationData);

      if (!userCredential?.uid) {
        throw new Error('Failed to create account');
      }

      // Navigate to email verification screen
      navigation.navigate('EmailVerification', {
        email,
        registrationData,
        userId: userCredential.uid,
      });
    } catch (error) {
      console.error('Error during signup:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async (registrationData, userId) => {
    try {
      setLoading(true);

      // Check if email is verified
      const isVerified = await AuthService.isEmailVerified();

      if (isVerified) {
        // Upload profile image if one was selected
        let profileImageUrl = null;
        if (registrationData.profileImage) {
          setUploadingImage(true);
          profileImageUrl = await uploadImage(userId);
          setUploadingImage(false);
        }

        // Update profile with the uploaded image and mark email as verified
        await AuthService.updateProfile(userId, {
          profilePicture: profileImageUrl,
          emailVerified: true,
        });

        // Update email verification status in Firestore
        await AuthService.updateEmailVerificationStatus();

        Alert.alert(
          'Registration Successful',
          `Welcome, ${registrationData.username}! Ready to Bet?`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email to continue. Check your inbox and spam folder.',
          [
            {
              text: 'Check Again',
              onPress: () => checkEmailVerification(registrationData, userId),
            },
            {
              text: 'Resend Email',
              onPress: () => resendVerificationEmail(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Clean up the unverified account
                AuthService.logout();
                navigation.navigate('SignUp');
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error during verification:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to verify email. Please try again.',
      );
      // Clean up and return to signup
      await AuthService.logout();
      navigation.navigate('SignUp');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      await AuthService.resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'Verification email has been resent. Please check your inbox.',
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to resend verification email. Please try again.',
      );
    }
  };

  const isAtLeast13 = (birthDate) => {
    const today = new Date();

    // Check if birthDate is today
    const isToday = birthDate.toDateString() === today.toDateString();
    if (isToday) {
      return false;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 13;
  };

  const handleDateConfirm = (date) => {
    if (!isAtLeast13(date)) {
      Alert.alert(
        'Age Requirement',
        'You must be at least 13 years old to create an account.',
      );
    } else {
      setBirthdate(date);
    }
    setShowDatePicker(false);
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
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder="Enter your username"
                onChangeText={(value) => (usernameRef.current = value)}
              />
              <Input
                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                placeholder="Enter your email"
                onChangeText={(value) => (emailRef.current = value)}
              />
              <Input
                onPress={() => setShowDatePicker(true)}
                icon={<Icon name="birthday" size={26} strokeWidth={1.6} />}
                placeholder="Enter your birthdate"
                value={birthdate.toLocaleDateString()}
              />
              {showDatePicker && (
                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  onConfirm={handleDateConfirm}
                  onCancel={() => setShowDatePicker(false)}
                  maximumDate={new Date()}
                  textColor={theme.colors.text}
                />
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
    marginBottom: hp(-5),
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
