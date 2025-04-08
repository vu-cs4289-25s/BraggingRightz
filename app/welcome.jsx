import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './context/ThemeContext';

const Welcome = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: wp(4),
    },
    welcomeImage: {
      width: wp(125),
      height: hp(40),
      alignSelf: 'center',
    },
    title: {
      fontSize: hp(4),
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
    },
    punchline: {
      textAlign: 'center',
      paddingHorizontal: wp(10),
      fontSize: hp(1.7),
      color: theme.colors.text,
    },
    footer: {
      gap: 30,
      width: '100%',
    },
    bottomTextContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },
    loginText: {
      textAlign: 'center',
      color: theme.colors.text,
      fontSize: hp(1.6),
    },
  });

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={styles.container}>
        {/*welcome image*/}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/illustration.png')}
        />

        {/*title*/}
        <View style={{ gap: 10 }}>
          <Text style={styles.title}>Bragging Rightz!</Text>
          <Text style={styles.punchline}>Bet Big, Brag Bigger</Text>
        </View>
        {/*footer*/}
        <View style={styles.footer}>
          <Button
            title="Getting Started"
            buttonStyle={{ marginHorizontal: wp(3) }}
            onPress={() => navigation.navigate('SignUp')}
          />
          <View style={styles.bottomTextContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text
                style={[
                  styles.loginText,
                  {
                    color: theme.colors.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;
