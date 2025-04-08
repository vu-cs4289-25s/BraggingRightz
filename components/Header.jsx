import { StyleSheet, Text, View, Pressable } from 'react-native';
import React from 'react';
import BackButton from './BackButton';
import { useNavigation } from '@react-navigation/native';
import { hp, wp } from '../helpers/common';
import { useTheme } from '../app/context/ThemeContext';

const Header = ({ title, showBackButton = false, rightComponent, mb = 10 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton navigation={navigation} />
        </View>
      )}
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title || ''}
      </Text>
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
    fontWeight: '600',
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
