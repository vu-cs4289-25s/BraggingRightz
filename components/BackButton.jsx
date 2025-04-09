import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from '../assets/icons';
import { useTheme } from '../app/context/ThemeContext';

const BackButton = ({ size = 26, navigation, doubleBack = false }) => {
  const { theme } = useTheme();

  return doubleBack ? (
    <Pressable
      onPress={() => {
        navigation.goBack();
        setTimeout(() => navigation.goBack(), 5);
      }}
    >
      <Icon
        name="arrowLeft"
        strokeWidth={2.5}
        size={size}
        color={theme.colors.text}
      />
    </Pressable>
  ) : (
    <Pressable onPress={() => navigation.goBack()} style={styles.button}>
      <Icon
        name="arrowLeft"
        strokeWidth={2.5}
        size={size}
        color={theme.colors.text}
      />
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    padding: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
});
