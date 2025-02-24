import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { hp } from '../../helpers/common';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import LogoutIcon from '../../assets/icons/logout';
import AuthService from '../../src/endpoints/auth.cjs';
import { FontAwesome5 } from '@expo/vector-icons'; // you need to install @expo/vector-icons

const Settings = () => {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            navigation.navigate('Welcome');
          } catch (error) {
            console.log('Error logging out:', error);
          }
        },
      },
    ]);
  };

  const SettingOption = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <FontAwesome5 name={icon} size={18} color="#1E293B" />
      </View>
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper bg="white">
      <Animated.View style={[styles.fadeIn, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Header
            title="Settings"
            showBackButton={true}
            rightComponent={
              <TouchableOpacity onPress={handleLogout} style={styles.headerLogout}>
                <LogoutIcon strokeWidth={2} size={hp(2.5)} color={theme.colors.roseLight} />
              </TouchableOpacity>
            }
          />

          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.section}>
              <SettingOption icon="user" label="Edit profile" />
              <SettingOption icon="shield-alt" label="Security" />
              <SettingOption icon="bell" label="Notifications" />
              <SettingOption icon="lock" label="Privacy" />
            </View>

            <Text style={styles.sectionTitle}>Support & About</Text>
            <View style={styles.section}>
              <SettingOption icon="question-circle" label="Help & Support" />
              <SettingOption icon="info-circle" label="Terms and Policies" />
            </View>

            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.section}>
              <SettingOption icon="flag" label="Report a problem" />
              <SettingOption icon="user-plus" label="Add account" />
              <SettingOption icon="sign-out-alt" label="Log out" onPress={handleLogout} />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </ScreenWrapper>
  );
};

export default Settings;

const styles = StyleSheet.create({
  fadeIn: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  container: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#90989f',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
    letterSpacing: 0.8,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(92,88,88,0.2)',
  },
  optionText: {
    color: '#9ca4ae',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogout: {
    padding: 8,
  },
});

