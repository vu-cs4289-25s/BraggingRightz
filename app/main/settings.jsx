import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Switch,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Header from '../../components/Header';
import LogoutIcon from '../../assets/icons/logout';
import AuthService from '../../src/endpoints/auth.cjs';
import SettingsService from '../../src/endpoints/settings.cjs';
import UserService from '../../src/endpoints/user.cjs';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Settings = () => {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    privateProfile: false,
    showOnlineStatus: true,
    darkMode: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const session = await AuthService.getSession();
      if (!session) {
        navigation.navigate('Login');
        return;
      }
      const userSettings = await SettingsService.getSettings(session.uid);
      setSettings(userSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const session = await AuthService.getSession();
              if (!session) {
                navigation.navigate('Login');
                return;
              }
              await UserService.deleteAccount(session.uid);
              await AuthService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const toggleSetting = async (key) => {
    try {
      const session = await AuthService.getSession();
      if (!session) return;

      const newValue = !settings[key];
      await SettingsService.updateSetting(session.uid, key, newValue);
      setSettings((prev) => ({ ...prev, [key]: newValue }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const SettingOption = ({
    title,
    value,
    onToggle,
    type = 'toggle',
    onPress,
    icon,
    color,
  }) => (
    <TouchableOpacity
      style={styles.settingOption}
      onPress={type === 'toggle' ? onToggle : onPress}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={color || theme.colors.primary} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
        />
      ) : (
        <Icon name="chevron-right" size={24} color={theme.colors.gray} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Header
          title="Settings"
          showBackButton={true}
          rightComponent={
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.headerLogout}
            >
              <LogoutIcon
                strokeWidth={2}
                size={hp(2.5)}
                color={theme.colors.rose}
              />
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.section}>
              <SettingOption
                title="Push Notifications"
                value={settings.pushNotifications}
                onToggle={() => toggleSetting('pushNotifications')}
                icon="notifications"
              />
              <SettingOption
                title="Email Notifications"
                value={settings.emailNotifications}
                onToggle={() => toggleSetting('emailNotifications')}
                icon="email"
              />
            </View>

            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.section}>
              <SettingOption
                title="Private Profile"
                value={settings.privateProfile}
                onToggle={() => toggleSetting('privateProfile')}
                icon="lock"
              />
              <SettingOption
                title="Show Online Status"
                value={settings.showOnlineStatus}
                onToggle={() => toggleSetting('showOnlineStatus')}
                icon="visibility"
              />
            </View>

            <Text style={styles.sectionTitle}>Theme</Text>
            <View style={styles.section}>
              <SettingOption
                title="Dark Mode"
                value={settings.darkMode}
                onToggle={() => toggleSetting('darkMode')}
                icon="brightness-4"
              />
            </View>

            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.section}>
              <SettingOption
                title="Logout"
                type="button"
                onPress={handleLogout}
                icon="logout"
                color={theme.colors.warning}
              />
              <SettingOption
                title="Delete Account"
                type="button"
                onPress={handleDeleteAccount}
                icon="delete-forever"
                color={theme.colors.error}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: hp(2),
    padding: hp(2),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: hp(2),
    marginLeft: wp(3),
    color: theme.colors.text,
  },
  headerLogout: {
    padding: wp(2),
  },
});

export default Settings;
