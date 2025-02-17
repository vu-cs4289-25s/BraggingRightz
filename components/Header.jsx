import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import BackButton from './BackButton';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Header = ({ title, showBackButton = false, mb = 10 }) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton navigation={navigation} />
        </View>
      )}
      <Text style={styles.title}>{title || ''}</Text>
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
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
});
