import { StyleSheet, Text, View, Button, Alert, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';

const Home = () => {
  const navigation = useNavigation();

  const onLogout = async () => {
    try {
      await AuthService.logout();
      navigation.navigate('Welcome');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BraggingRightz</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('newBet')}>
              <Icon
                name="plus"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <Avatar />
            </Pressable>
          </View>
        </View>
      </View>
      <Button title="Logout" onPress={onLogout} />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
  },
  avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.fonts.radius,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  listStyle: {
    paddingTop: 20,
    paddinorizontal: wp(4),
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  pillText: {
    color: theme.colors.rose,
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
});
