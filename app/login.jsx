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

const Login = () => {
  const navigation = useNavigation();
  const usernameRef = useRef(''); //saves username as reference
  const passwordRef = useRef(''); //saves password as reference
  const [loading, setLoading] = useState(false); //loading state

  const onSubmit = async () => {
    if (!usernameRef.current || !passwordRef.current) {
      Alert.alert('Login', 'Please fill all fields!');
      return;
    }

    // Log in user
    setLoading(true);
    try {
      const user = await AuthService.login({
        username: usernameRef.current,
        password: passwordRef.current,
      });
      Alert.alert(
        'Login Successful',
        `Welcome, ${user.username}! Ready to Bet?`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Login Failed: ', error.message);
      navigation.navigate('Login');
    } finally {
      setLoading(false);
      // Do we have a profile page using props?
      //navigation.navigate(`Profile/${user.uid}`);
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
              <Text style={styles.welcomeText}>Hey!</Text>
              <Text style={styles.welcomeText}>Welcome Back.</Text>
            </View>

            {/*form*/}
            <View style={styles.form}>
              <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                Please login to continue
              </Text>
              <Input
                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                placeholder="Enter your username"
                onChangeText={(value) => (usernameRef.current = value)}
              />
              <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder="Enter your password"
                secureTextEntry
                onChangeText={(value) => (passwordRef.current = value)}
              />
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
              {/*button*/}
              <Button title={'Login'} loading={loading} onPress={onSubmit} />
            </View>

            {/*footer*/}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text
                  style={[
                    styles.footerText,
                    {
                      color: theme.colors.primaryDark,
                      fontWeight: theme.fonts.semibold,
                    },
                  ]}
                >
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScreenWrapper>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

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
