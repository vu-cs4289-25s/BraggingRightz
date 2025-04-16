import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './app/welcome';
import SignUp from './app/signUp';
import Login from './app/login';
import ForgotPassword from './app/forgotPassword';
import EmailVerification from './app/emailVerification';
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
import EditGroup from './app/main/editGroup';
import EditBet from './app/main/editBet';
import { ThemeProvider } from './app/context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} id={'root'}>
              <Stack.Group>
                <Stack.Screen name="Welcome" component={Welcome} />
                <Stack.Screen
                  name="SignUp"
                  component={SignUp}
                  options={{
                    presentation: 'card',
                  }}
                />
                <Stack.Screen
                  name="Login"
                  component={Login}
                  options={{
                    presentation: 'card',
                  }}
                />
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPassword}
                />
              </Stack.Group>

              <Stack.Group>
                <Stack.Screen
                  name="Main"
                  component={BottomTabNavigator}
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="Notifications" component={Notifications} />
                <Stack.Screen
                  name="NewGroup"
                  component={NewGroup}
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="EditProfile" component={EditProfile} />
                <Stack.Screen name="Settings" component={Settings} />
                <Stack.Screen name="Friends" component={Friends} />
                <Stack.Screen name="BetDetails" component={BetDetails} />
                <Stack.Screen name="MyBets" component={MyBets} />
                <Stack.Screen
                  name="NewBet"
                  component={NewBet}
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="Groups" component={Groups} />
                <Stack.Screen name="Leaderboard" component={Leaderboard} />
                <Stack.Screen
                  name="GroupBets"
                  component={GroupBets}
                  options={{
                    gestureEnabled: false,
                    presentation: 'card',
                  }}
                />
                <Stack.Screen name="EditGroup" component={EditGroup} />
                <Stack.Screen name="EditBet" component={EditBet} />
              </Stack.Group>
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </>
  );
}
