import { View, Text } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../app/context/ThemeContext';

const ScreenWrapper = ({ children, style }) => {
  const { top } = useSafeAreaInsets();
  const { theme } = useTheme();
  const paddingTop = top > 0 ? top + 5 : 30;

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default ScreenWrapper;
