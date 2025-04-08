import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import SettingsService from '../../src/endpoints/settings.cjs';
import AuthService from '../../src/endpoints/auth.cjs';

const ThemeContext = createContext();

export const lightTheme = {
  colors: {
    primary: '#0070f3',
    primaryDark: '#0050c8',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    border: '#E5E5E5',
    notification: '#FF3B30',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    overlay: 'rgba(0, 0, 0, 0.5)',
    inputBackground: '#F5F5F5',
    placeholder: '#999999',
  },
  radius: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
  },
};

export const darkTheme = {
  colors: {
    primary: '#0A84FF',
    primaryDark: '#0050c8',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textLight: '#ADADAD',
    border: '#38383A',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
    overlay: 'rgba(0, 0, 0, 0.8)',
    inputBackground: '#2C2C2E',
    placeholder: '#666666',
  },
  radius: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const session = await AuthService.getSession();
      if (session) {
        const userSettings = await SettingsService.getSettings(session.uid);
        const isDark = userSettings.theme === 'dark';
        console.log('Loading theme preference:', isDark);
        setIsDarkMode(isDark);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      console.log('ToggleTheme called, current isDarkMode:', isDarkMode);
      const session = await AuthService.getSession();
      if (session) {
        const newValue = !isDarkMode;
        console.log('Updating theme to:', newValue ? 'dark' : 'light');
        await SettingsService.updateTheme(
          session.uid,
          newValue ? 'dark' : 'light',
        );
        setIsDarkMode(newValue);
        console.log('Theme updated, new isDarkMode:', newValue);
      } else {
        console.log('No session found in toggleTheme');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
