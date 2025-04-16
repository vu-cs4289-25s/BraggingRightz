import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Button from '../components/Button';
import AuthService from '../src/endpoints/auth.cjs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/firebase/config';

const EmailVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, registrationData } = route.params;
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Return cleanup function
    return () => {
      mounted = false;
      // Attempt to clean up any temporary user on unmount
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        user.delete().catch((error) => {
          console.error('Error cleaning up temporary user on unmount:', error);
        });
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  const completeRegistration = async () => {
    try {
      setRegistering(true);
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No user found');
      }

      // First try to register the user if they don't exist
      try {
        await AuthService.register({
          ...registrationData,
          userId: user.uid,
          email: user.email,
          onboardingCompleted: false,
          numCoins: 1000,
          trophies: 0,
          friends: [],
        });
      } catch (error) {
        // If error is not about existing user, rethrow it
        if (!error.message.includes('already taken')) {
          throw error;
        }
        // Otherwise continue since user exists
      }

      // Now that we're sure the user document exists, update verification status
      await AuthService.updateEmailVerificationStatus();

      // Navigate to main app (onboarding will be handled by Home component)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Error completing registration:', error);
      Alert.alert('Registration Failed', error.message);
    } finally {
      setRegistering(false);
    }
  };

  const checkVerification = async () => {
    try {
      setChecking(true);
      const isVerified = await AuthService.isEmailVerified();

      if (isVerified) {
        await completeRegistration();
      } else {
        Alert.alert(
          'Not Verified',
          'Please check your email and click the verification link.',
        );
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'Failed to verify email. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);
      await AuthService.resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = async () => {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        try {
          await user.delete();
        } catch (deleteError) {
          console.error('Error deleting temporary user:', deleteError);
        }
      }
      await AuthService.logout();
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      navigation.goBack();
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-outline"
              size={80}
              color={theme.colors.primary}
            />
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification email to:
          </Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.description}>
            Please check your email and click the verification link to continue.
            Don't forget to check your spam folder!
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title={
                checking || registering
                  ? 'Verifying...'
                  : 'Check Verification Status'
              }
              onPress={checkVerification}
              loading={checking || registering}
              style={styles.button}
              buttonTextStyle={styles.buttonText}
            />
            <Button
              title={resending ? 'Sending...' : 'Resend Email'}
              onPress={handleResendEmail}
              loading={resending}
              variant="secondary"
              style={styles.button}
            />
          </View>

          <Pressable onPress={handleGoBack} style={styles.wrongEmailContainer}>
            <Text style={styles.wrongEmailText}>
              Entered the wrong email? Click here to go back
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp(10),
  },
  iconContainer: {
    marginBottom: hp(4),
  },
  title: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  email: {
    fontSize: hp(2),
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  description: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(4),
  },
  buttonContainer: {
    width: '100%',
    gap: hp(2),
  },
  button: {
    width: '100%',
  },
  buttonText: {
    fontSize: hp(1.2),
  },
  wrongEmailContainer: {
    marginTop: hp(4),
    padding: hp(3),
  },
  wrongEmailText: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    textAlign: 'center',
  },
});

export default EmailVerification;
