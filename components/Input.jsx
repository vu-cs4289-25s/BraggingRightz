import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import React, { useState } from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Icon from '../assets/icons';

const Input = ({ secureTextEntry, inputRef, containerStyle, ...rest }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {rest.icon && rest.icon}
      <TextInput
        ref={inputRef}
        style={{ flex: 1 }}
        placeholderTextColor={theme.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry && !showPassword}
        {...rest}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eyeClosed' : 'eye'}
            size={20}
            color={theme.colors.textLight}
          />
        </Pressable>
      )}
import { StyleSheet, Text, View, TextInput } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Input = (props) => {
  return (
    <View
      style={[styles.container, props.containerStyle && props.containerStyle]}
    >
      {props.icon && props.icon}
      <TextInput
        style={{ flex: 1 }}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  },
  focusedContainer: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    backgroundColor: theme.colors.lightBackground,
  },
});
