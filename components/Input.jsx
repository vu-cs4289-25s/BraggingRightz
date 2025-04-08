import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import { hp } from '../helpers/common';
import Icon from '../assets/icons';
import { useTheme } from '../app/context/ThemeContext';

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
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: hp(7.2),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.4,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xxl,
      borderCurve: 'continuous',
      paddingHorizontal: 18,
      gap: 12,
      backgroundColor: theme.colors.inputBackground,
    },
    focusedContainer: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    iconContainer: {
      marginRight: 12,
    },
    inputText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
    },
  });

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
            { color: value ? theme.colors.text : theme.colors.placeholder },
          ]}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        isFocused && styles.focusedContainer,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
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
