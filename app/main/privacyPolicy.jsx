import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';

const PrivacyPolicyScreen = () => {
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: April 18, 2025</Text>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.sectionContent}>Personal Information</Text>
        <Text style={styles.text}>
          - Email address (for account creation and verification)
        </Text>
        <Text style={styles.text}>- Username and profile information</Text>
        <Text style={styles.text}>- Date of birth (for age verification)</Text>
        <Text style={styles.text}>- Profile pictures (when uploaded)</Text>
        <Text style={styles.text}>- Device information</Text>
        <Text style={styles.sectionContent}>Usage Data</Text>
        <Text style={styles.text}>- Betting history</Text>
        <Text style={styles.text}>- Friend connections</Text>
        <Text style={styles.text}>- App usage statistics</Text>
        <Text style={styles.text}>- Performance data</Text>
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.text}>- Account creation and management</Text>
        <Text style={styles.text}>- Age verification</Text>
        <Text style={styles.text}>- Social features</Text>
        <Text style={styles.text}>- Game functionality</Text>
        <Text style={styles.text}>- App improvement</Text>
        <Text style={styles.text}>- Customer support</Text>
        <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
        <Text style={styles.text}>- Firebase secure storage</Text>
        <Text style={styles.text}>- Encryption in transit</Text>
        <Text style={styles.text}>- Regular security audits</Text>
        <Text style={styles.text}>- Data backup procedures</Text>
        <Text style={styles.sectionTitle}>4. Age Restrictions</Text>
        <Text style={styles.text}>- Users must be 17 years or older</Text>
        <Text style={styles.text}>- Age verification required</Text>
        <Text style={styles.text}>- Parental guidance recommended</Text>
        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.text}>- Firebase (Google)</Text>
        <Text style={styles.text}>- Analytics services</Text>
        <Text style={styles.text}>- Cloud storage</Text>
        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.text}>- Access your data</Text>
        <Text style={styles.text}>- Delete your account</Text>
        <Text style={styles.text}>- Modify information</Text>
        <Text style={styles.text}>- Export data</Text>
        <Text style={styles.sectionTitle}>7. Contact Information</Text>
        <Text style={styles.text}>braggingrightzapp@gmail.com</Text>
        <Text style={styles.sectionTitle}>8. Changes to Policy</Text>
        <Text style={styles.text}>
          We reserve the right to update this policy. Users will be notified of
          significant changes.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
});

export default PrivacyPolicyScreen;
