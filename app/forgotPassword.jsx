import {
  Alert,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,

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

import AuthService from '../src/endpoints/auth.cjs';

const ForgotPassword = () => {
  const navigation = useNavigation();
  const usernameRef = useRef(''); //saves username as reference
  const [loading, setLoading] = useState(false); //loading state

  const handleForgotPassword = async () => {
    if (!usernameRef.current) {
      Alert.alert(
        'Forgot Password',
        'Please enter your username to reset password.',
      );
      return;
    }

    try {
      await AuthService.forgotPassword(usernameRef.current);
      Alert.alert(
        'Forgot Password',
        'A password reset link has been sent to your email.',
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Unable to Reset Password', error.message);
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

            {/*welcome text*/}
            <View>
              <Text style={styles.welcomeText}>Reset Password</Text>
            </View>

            {/*form*/}
            <View style={styles.form}>
              <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                Please enter your username to reset your password:
              </Text>
              <Input
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder="Enter your username"
                onChangeText={(value) => (usernameRef.current = value)}
              />
              {/*button*/}
              <Button
                title={'Reset Password'}
                loading={loading}
                onPress={handleForgotPassword}
              />
            </View>
            <View style={styles.footer}>
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
                              Back to Login
                            </Text>
                          </Pressable>
                        </View>

            {/*footer*/}
          </View>
        </ScreenWrapper>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

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
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
});
