import { View, Text, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Loading from '../components/Loading';

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {},
  loading = false,
  hasShadow = true,
}) => {
  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  };

  if (loading) {
    return (
      <View style={[styles.button, buttonStyle, { backgroundColor: 'white' }]}>
        <Loading />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, buttonStyle, hasShadow && shadowStyle]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    height: hp(6.6),
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'continuous',
    borderRadius: theme.radius.xl,
  },
  text: {
    fontSize: hp(2.5),
    color: 'white',
    fontWeight: theme.fonts.bold,
  },
});
