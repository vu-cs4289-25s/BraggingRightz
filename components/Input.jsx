import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Icon from '../assets/icons';

const Input = ({
  icon,
  secureTextEntry,
  inputRef,
  containerStyle,
  onPress,
  placeholder,
  value,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (onPress) {
    // Render a touchable input that triggers onPress when tapped
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, containerStyle]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.inputText,
            { color: value ? theme.colors.text : '#999' },
          ]}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        ref={inputRef}
        style={{ flex: 1 }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry && !showPassword}
        value={value}
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
  iconContainer: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
});
