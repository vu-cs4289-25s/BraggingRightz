import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './app/welcome';
import SignUp from './app/signUp';
import Login from './app/login';
import Home from './app/main/home';
import NewBet from './app/main/newBet';
import Profile from './app/main/profile';
import Notifications from './app/main/notifications';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="NewBet" component={NewBet} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Notifications" component={Notifications} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
