import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import Header from '../../components/Header';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Logout from '../../assets/icons/logout';
import AuthService from '../../src/endpoints/auth.cjs';
import { useNavigation } from '@react-navigation/native';

const Settings = () => {
  const navigation = useNavigation(); // initialize navigation

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
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

  return (
    <ScreenWrapper bg="white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <Header
            title="Settings"
            showBackButton={true}
            rightComponent={
              <TouchableOpacity onPress={handleLogout} style={styles.headerLogout}>
                <Logout
                  style={styles.logoutButton}
                  strokeWidth={2}
                  size={hp(2.5)}
                  color={theme.colors.roseLight}
                />
              </TouchableOpacity>
            }
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Settings;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  headerLogout: {
    padding: 8,
  },
});