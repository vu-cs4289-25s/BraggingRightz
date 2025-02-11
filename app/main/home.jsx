import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Button,
  Alert,
  Pressable,
  ImageBackground,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import AuthService from '../../src/endpoints/auth';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { Ionicons } from '@expo/vector-icons';

const Home = () => {
  const navigation = useNavigation();
  const [showGif, setShowGif] = useState(true);

  useEffect(() => {
    // Automatically hide the GIF after 3 seconds
    const timer = setTimeout(() => setShowGif(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const onLogout = async () => {
    try {
      await AuthService.logout();
      navigation.navigate('Welcome');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <ScreenWrapper>
      {/* Show the GIF animation when the page first loads */}
      {showGif && (
        <ImageBackground
          source={require('../../assets/animations/trophy-background.gif')}
          style={styles.gifBackground}
          resizeMode="cover"
        />
      )}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BraggingRightz</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('newBet')}>
              <Icon
                name="plus"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <Avatar />
            </Pressable>
          </View>
        </View>

        {/* Profile and Coins Bar (Static Section) */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.coinsBar}>
            <Ionicons name="logo-bitcoin" size={20} color="#FACC15" />
            <Text style={styles.coinText}>785 coins</Text>
          </View>
        </View>

        {/* Scrollable Menu Options */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuOption}>
              <View style={styles.menuContent}>
                <Ionicons name={item.icon} size={24} color="#1E293B" />
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout Button */}
        <Button title="Logout" onPress={onLogout} />
      </View>
    </ScreenWrapper>
  );
};

const menuItems = [
  { label: 'My Groups', icon: 'people-outline' },
  { label: 'Achievements', icon: 'trophy-outline' },
  { label: 'Active Bets', icon: 'stats-chart-outline' },
  { label: 'My Bets', icon: 'document-text-outline' },
];

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gifBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 999, // Ensure the GIF is above all other content initially
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  coinsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderColor: '#E5E5EA',
    borderWidth: 1,
  },
  coinText: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuOption: {
    backgroundColor: '#F9F9F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    marginVertical: 8,
    borderRadius: 14,
    borderColor: '#E5E5EA',
    borderWidth: 1,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default Home;

// import {
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   TouchableOpacity,
//   ScrollView,
//   Dimensions,
//   Button,
//   Alert,
//   Pressable,
//   ImageBackground,
// } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import ScreenWrapper from '../../components/ScreenWrapper';
// import AuthService from '../../src/endpoints/auth';
// import { useNavigation } from '@react-navigation/native';
// import { theme } from '../../constants/theme';
// import { hp, wp } from '../../helpers/common';
// import Icon from '../../assets/icons';
// import Avatar from '../../components/Avatar';
// import { Ionicons } from '@expo/vector-icons';
//
// const Home = () => {
//   const navigation = useNavigation();
//   const [showGif, setShowGif] = useState(true);
//
//   useEffect(() => {
//     // Automatically hide the GIF after 3 seconds
//     const timer = setTimeout(() => setShowGif(false), 3000);
//
//     return () => clearTimeout(timer); // Clean up the timer
//   }, []);
//
//   const onLogout = async () => {
//     try {
//       await AuthService.logout();
//       navigation.navigate('Welcome');
//     } catch (error) {
//       Alert.alert('Logout Failed', error.message);
//     }
//   };
//
//   return (
//     <ScreenWrapper>
//       {/* Show the GIF animation when the page first loads */}
//       {showGif && (
//         <ImageBackground
//           source={require('../../assets/animations/trophy-background.gif')}
//           style={styles.gifBackground}
//           resizeMode="cover"
//         />
//       )}
//
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.title}>BraggingRightz</Text>
//           <View style={styles.icons}>
//             <Pressable onPress={() => navigation.navigate('Notifications')}>
//               <Icon
//                 name="heart"
//                 size={hp(3.2)}
//                 strokeWidth={2}
//                 color={theme.colors.text}
//               />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('newBet')}>
//               <Icon
//                 name="plus"
//                 size={hp(3.2)}
//                 strokeWidth={2}
//                 color={theme.colors.text}
//               />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('Profile')}>
//               <Avatar />
//             </Pressable>
//           </View>
//         </View>
//
//         {/* Scrollable Main Content */}
//         <ScrollView contentContainerStyle={styles.mainContent}>
//           {/* Profile Section */}
//           <View style={styles.profileSection}>
//             <View style={styles.avatarContainer}>
//               <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
//             </View>
//
//             {/* Coins Bar */}
//             <View style={styles.coinsBar}>
//               <Ionicons name="logo-bitcoin" size={20} color="#FACC15" />
//               <Text style={styles.coinText}>785 coins</Text>
//             </View>
//           </View>
//
//
//           {/* Menu Options */}
//           {menuItems.map((item, index) => (
//             <TouchableOpacity key={index} style={styles.menuOption}>
//               <View style={styles.menuContent}>
//                 <Ionicons name={item.icon} size={24} color="#1E293B" />
//                 <Text style={styles.menuText}>{item.label}</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//
//         {/* Logout Button */}
//         <Button title="Logout" onPress={onLogout} />
//       </View>
//     </ScreenWrapper>
//   );
// };
//
// const menuItems = [
//   { label: 'My Groups', icon: 'people-outline' },
//   { label: 'Achievements', icon: 'trophy-outline' },
//   { label: 'Active Bets', icon: 'stats-chart-outline' },
//   { label: 'My Bets', icon: 'document-text-outline' },
// ];
//
// const screenHeight = Dimensions.get('window').height;
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   gifBackground: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     zIndex: 999,  // Ensure the GIF is above all other content initially
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//     marginHorizontal: wp(4),
//   },
//   title: {
//     color: theme.colors.text,
//     fontSize: hp(3.2),
//     fontWeight: theme.fonts.bold,
//   },
//   icons: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 20,
//   },
//   mainContent: {
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: screenHeight * 0.15,
//   },
//   profileSection: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   avatarContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#ebeced',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//   },
//   coinsBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 14,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     borderColor: '#E5E5EA',
//     borderWidth: 1,
//   },
//   coinText: {
//     fontSize: 18,
//     color: '#1E293B',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   menuOption: {
//     backgroundColor: '#F9F9F9',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 18,
//     marginVertical: 8,
//     borderRadius: 14,
//     borderColor: '#E5E5EA',
//     borderWidth: 1,
//   },
//   menuContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   menuText: {
//     fontSize: 18,
//     color: '#1E293B',
//     fontWeight: '500',
//     marginLeft: 12,
//   },
// });
//
// export default Home;

//code before gif grafic
// import {
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   TouchableOpacity,
//   ScrollView,
//   Dimensions,
//   Button,
//   Alert,
//   Pressable,
// } from 'react-native';
// import React from 'react';
// import ScreenWrapper from '../../components/ScreenWrapper';
// import AuthService from '../../src/endpoints/auth';
// import { useNavigation } from '@react-navigation/native';
// import { theme } from '../../constants/theme';
// import { hp, wp } from '../../helpers/common';
// import Icon from '../../assets/icons';
// import Avatar from '../../components/Avatar';
// import { Ionicons } from '@expo/vector-icons';
//
// const Home = () => {
//   const navigation = useNavigation();
//
//   const onLogout = async () => {
//     try {
//       await AuthService.logout();
//       navigation.navigate('Welcome');
//     } catch (error) {
//       Alert.alert('Logout Failed', error.message);
//     }
//   };
//
//   return (
//     <ScreenWrapper>
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.title}>BraggingRightz</Text>
//           <View style={styles.icons}>
//             <Pressable onPress={() => navigation.navigate('Notifications')}>
//               <Icon
//                 name="heart"
//                 size={hp(3.2)}
//                 strokeWidth={2}
//                 color={theme.colors.text}
//               />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('newBet')}>
//               <Icon
//                 name="plus"
//                 size={hp(3.2)}
//                 strokeWidth={2}
//                 color={theme.colors.text}
//               />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('Profile')}>
//               <Avatar />
//             </Pressable>
//           </View>
//         </View>
//
//         {/* Scrollable Main Content */}
//         <ScrollView contentContainerStyle={styles.mainContent}>
//           {/* Profile Section */}
//           <View style={styles.profileSection}>
//             <View style={styles.avatarContainer}>
//               <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
//             </View>
//
//             {/* Sleek Coins Bar */}
//             <View style={styles.coinsBar}>
//               <Ionicons name="logo-bitcoin" size={20} color="#FACC15" />
//               <Text style={styles.coinText}>785 coins</Text>
//             </View>
//           </View>
//
//           {/* Notification Bubble */}
//           <TouchableOpacity style={styles.notificationBubble}>
//             <Text style={styles.notificationText}>15</Text>
//           </TouchableOpacity>
//
//           {/* Menu Options */}
//           {menuItems.map((item, index) => (
//             <TouchableOpacity key={index} style={styles.menuOption}>
//               <View style={styles.menuContent}>
//                 <Ionicons name={item.icon} size={24} color="#1E293B" />
//                 <Text style={styles.menuText}>{item.label}</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//
//         {/* Logout Button */}
//         <Button title="Logout" onPress={onLogout} />
//       </View>
//     </ScreenWrapper>
//   );
// };
//
// const menuItems = [
//   { label: 'My Groups', icon: 'people-outline' },
//   { label: 'Achievements', icon: 'trophy-outline' },
//   { label: 'Active Bets', icon: 'stats-chart-outline' },
//   { label: 'My Bets', icon: 'document-text-outline' },
// ];
//
// const screenHeight = Dimensions.get('window').height;
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//     marginHorizontal: wp(4),
//   },
//   title: {
//     color: theme.colors.text,
//     fontSize: hp(3.2),
//     fontWeight: theme.fonts.bold,
//   },
//   icons: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 20,
//   },
//   mainContent: {
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: screenHeight * 0.15,
//   },
//   profileSection: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   avatarContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#ebeced',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//   },
//   coinsBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 14,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     borderColor: '#E5E5EA',
//     borderWidth: 1,
//   },
//   coinText: {
//     fontSize: 18,
//     color: '#1E293B',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   notificationBubble: {
//     position: 'absolute',
//     top: 70,
//     right: 30,
//     backgroundColor: '#FF3B30',
//     borderRadius: 12,
//     paddingVertical: 2,
//     paddingHorizontal: 8,
//     elevation: 2,
//   },
//   notificationText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 12,
//   },
//   menuOption: {
//     backgroundColor: '#F9F9F9',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 18,
//     marginVertical: 8,
//     borderRadius: 14,
//     borderColor: '#E5E5EA',
//     borderWidth: 1,
//   },
//   menuContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   menuText: {
//     fontSize: 18,
//     color: '#1E293B',
//     fontWeight: '500',
//     marginLeft: 12,
//   },
// });
//
// export default Home;
//
//
//
//
