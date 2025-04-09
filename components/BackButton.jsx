import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useRef } from 'react';
import Icon from '../assets/icons';
import { useTheme } from '../app/context/ThemeContext';

const BackButton = ({ size = 26, navigation, doubleBack = false }) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (doubleBack) {
      navigation.goBack();
      // TODO: DELETE
      console.log("BACK ONCE");
      setTimeout(() => {
        navigation.goBack();
        // TODO: DELETE
        console.log("BACK TWICE");
      }, 10);
    } else {
      navigation.goBack();
      // TODO: DELETE
      console.log("BACK ONCE AND ONLY ONCE");
    }
  }

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <Icon
        name="arrowLeft"
        strokeWidth={2.5}
        size={size}
        color={theme.colors.text}
      />
    </Pressable>
  )
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
