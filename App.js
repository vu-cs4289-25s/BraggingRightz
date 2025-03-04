import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './app/welcome';
import SignUp from './app/signUp';
import Login from './app/login';
import ForgotPassword from './app/forgotPassword';
import Notifications from './app/main/notifications';
import NewGroup from './app/main/newGroup';
import EditProfile from './app/main/editProfile';
import Settings from './app/main/settings';
import BottomTabNavigator from './components/BottomTabNavigator';
import Profile from './app/main/profile';
import Friends from './app/main/friends';
import MyBets from './app/main/myBets';
import BetDetails from './app/main/betDetails';
import NewBet from './app/main/newBet';
import Groups from './app/main/groups';
import Leaderboard from './app/main/leaderboard';
import GroupBets from './app/main/groupBets';

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
          {/* replaced Home, NewBet screens with our bottom tab navigator */}
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="NewGroup" component={NewGroup} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="Friends" component={Friends} />
          <Stack.Screen name="BetDetails" component={BetDetails} />
          <Stack.Screen name="MyBets" component={MyBets} />
          <Stack.Screen name="NewBet" component={NewBet} />
          <Stack.Screen name="Groups" component={Groups} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
          <Stack.Screen name="GroupBets" component={GroupBets} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
