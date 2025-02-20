import { StyleSheet, Text, View, Pressable } from 'react-native';
import React from 'react';
import BackButton from './BackButton';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const Header = ({ title, showBackButton = false, rightComponent, mb = 10 }) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton navigation={navigation} />
        </View>
      )}
      <Text style={styles.title}>{title || ''}</Text>
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 10,
    position: 'relative',
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: wp(4),
  },
  rightComponent: {
    position: 'absolute',
    right: 0,
  },
});
