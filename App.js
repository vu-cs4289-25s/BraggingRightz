import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './app/welcome';
import SignUp from './app/signUp';
import Login from './app/login';
import ForgotPassword from './app/forgotPassword';
import Notifications from './app/main/notifications';
import EditProfile from './app/main/editProfile';
import Settings from './app/main/settings';
import BottomTabNavigator from './components/BottomTabNavigator';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} id={'root'}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          {/* replaced Home, NewBet, Profile screens with our bottom tab navigator */}
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Settings" component={Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
