import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import BackButton from './BackButton';
import { useNavigation } from '@react-navigation/native';
import { hp, wp } from '../helpers/common';
import { useTheme } from '../app/context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const Header = ({
  title,
  showBackButton = false,
  rightComponent,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', {
        screen: 'Home',
        params: { refresh: Date.now() },
      });
    }
  };

  return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
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
    paddingVertical: hp(1),
  },
  rightComponent: {
    position: 'absolute',
    right: 0,
  },
});
