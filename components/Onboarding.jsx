import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import Swiper from 'react-native-swiper';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

const OnboardingSwiper = ({ onFinish }) => {
  return (
    <Swiper loop={false}>
      <View style={styles.container}>
        <View style={styles.topContent}>
          <Image
            style={styles.welcomeImage}
            resizeMode="contain"
            source={require('../assets/images/trophy.png')}
          />
          <Text style={styles.title}>Welcome to Bragging Rightz!</Text>
        </View>
        <View style={styles.bottomContent}>
          <Text style={styles.subtitle}>Swipe to learn more.</Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.pageContent}>
          <Image
            style={styles.pageImage}
            resizeMode="contain"
            source={require('../assets/images/people.jpg')}
          />
          <Text style={styles.pageTitle}>Add Friends</Text>
          <Text style={styles.pageText}>
            To add a friend, enter their username and send a friend request.
          </Text>
          <Text style={styles.pageText}>
            Friend requests will remain pending until approved.
          </Text>
          <Text style={styles.pageText}>
            Check notifications to approve or deny pending friend requests.
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.pageContent}>
          <Image
            style={styles.pageImage}
            resizeMode="contain"
            source={require('../assets/images/groupChat.jpg')}
          />
          <Text style={styles.pageTitle}>Join Groups</Text>
          <Text style={styles.pageText}>
            Bets must be created within a group.
          </Text>
          <Text style={styles.pageText}>
            Create a group and add friends, or join an existing group with the
            join code.
          </Text>
          <Text style={styles.pageText}>
            The creator of a group can add and remove people as admin.
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.pageContent}>
          <Image
            style={styles.pageImage}
            resizeMode="contain"
            source={require('../assets/images/bet.png')}
          />
          <Text style={styles.pageTitle}>Place Bets</Text>
          <Text style={styles.pageText}>
            At least two users in a group must participate in a bet.
          </Text>
          <Text style={styles.pageText}>
            Once you join a bet, you can comment, react, and interact with other
            users in the bet.
          </Text>
          <Text style={styles.pageText}>
            After a bet expires, the creator of the bet must select the winning
            answer for a bet to be completed.
          </Text>
          <Text style={styles.pageText}>
            When a bet is completed, the winner gains a Bragging Right trophy
            and the coins from the wager pool.
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.pageContent}>
          <Image
            style={styles.pageImage}
            resizeMode="contain"
            source={require('../assets/images/illustration.png')}
          />
          <Text style={styles.pageTitle}>
            You are now ready to bet big and brag even bigger!
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Get Started" onPress={onFinish} />
          </View>
        </View>
      </View>
    </Swiper>
  );
};

export default OnboardingSwiper;

const styles = StyleSheet.create({
  topContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    marginBottom: hp(5),
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(4),
  },
  welcomeImage: {
    width: wp(125),
    height: hp(40),
    alignSelf: 'center',
  },
  pageImage: {
    width: wp(65),
    height: hp(35),
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: hp(3),
    color: theme.colors.textDark,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pageText: {
    paddingTop: hp(2),
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.textDark,
  },
  pageContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    paddingTop: hp(5),
    width: wp(80),
  },
  title: {
    paddingTop: wp(3),
    fontSize: hp(3.5),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(2),
    color: theme.colors.textDark,
    paddingTop: hp(15),
  },
});
