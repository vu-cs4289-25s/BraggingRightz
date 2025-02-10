import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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

import AuthService from '../src/endpoints/auth';

const SignUp = () => {
  const navigation = useNavigation();
  const emailRef = useRef(''); //saves email as reference
  const nameRef = useRef(''); //saves name as reference
  const usernameRef = useRef(''); //saves username as reference
  const passwordRef = useRef(''); //saves password as reference
  const [loading, setLoading] = useState(false); //loading state

  const onSubmit = async () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !nameRef.current ||
      !usernameRef.current
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
      const user = await AuthService.register({
        username: usernameRef.current,
        password: passwordRef.current,
        email: emailRef.current,
        fullName: nameRef.current,
      });
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
      setLoading(false);
      Alert.alert('Registration Failed: ', error.message);
    } finally {
      // Do we have a profile page using props?
      setLoading(false);
      //navigation.navigate(`Profile/${user.uid}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ScreenWrapper bg="white">
          <StatusBar style="dark" />
          <View style={styles.container}>
            <BackButton navigation={navigation} />

            {/*welcome text*/}
            <View>
              <Text style={styles.welcomeText}>Let's</Text>
              <Text style={styles.welcomeText}>Get Started!</Text>
            </View>

            {/*form*/}
            <View style={styles.form}>
              <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                Please fill in the details to create an account
              </Text>
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
              <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder="Enter your password"
                secureTextEntry
                onChangeText={(value) => (passwordRef.current = value)}
              />
              {/*button*/}
              <Button title={'Sign up'} loading={loading} onPress={onSubmit} />
            </View>

            {/*footer*/}
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
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton navigation={navigation} />

        {/*welcome text*/}
        <View>
          <Text style={styles.welcomeText}>Let's</Text>
          <Text style={styles.welcomeText}>Get Started!</Text>
        </View>

        {/*form*/}
        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Please fill in the details to create an account
          </Text>
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
          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
          />
          {/*button*/}
          <Button title={'Sign up'} loading={loading} onPress={onSubmit} />
        </View>

        {/*footer*/}
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
