import React, { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';
import AuthService from '../../endpoints/auth';
import LoadingModal from '../../utils/LoadingModal';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onFooterLinkPress = () => {
    navigation.navigate('Registration');
  };

  const onLoginPress = async () => {
    setIsLoading(true);
    try {
      const userData = await AuthService.login({ username, password });
      navigation.navigate('Home', { user: userData });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={{ flex: 1, width: '100%' }}
        keyboardShouldPersistTaps="always"
      >
        {/* App logo */}
        <Image
          style={styles.logo}
          source={require('../../../assets/icon.png')}
        />
        {/* Username input field */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaaaaa"
          onChangeText={(text) => setUsername(text)}
          value={username}
          underlineColorAndroid="transparent"
          autoCapitalize="none"
        />
        {/* Password input field */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#aaaaaa"
          secureTextEntry
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          value={password}
          underlineColorAndroid="transparent"
          autoCapitalize="none"
        />
        {/* Login button */}
        <TouchableOpacity style={styles.button} onPress={onLoginPress}>
          <Text style={styles.buttonTitle}>Log in</Text>
        </TouchableOpacity>
        {/* Footer link to navigate to the registration screen */}
        <View style={styles.footerView}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text onPress={onFooterLinkPress} style={styles.footerLink}>
              Sign up
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
      <LoadingModal isVisible={isLoading} />
    </View>
  );
}
