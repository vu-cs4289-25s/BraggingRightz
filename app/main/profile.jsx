// import { Pressable, StyleSheet, Text, ScrollView, TouchableOpacity, View, Image } from "react-native"
// import { useNavigation } from "@react-navigation/native"
// import ScreenWrapper from "../../components/ScreenWrapper"
// import Icon from "../../assets/icons"
// import { hp, wp } from "../../helpers/common"
// import { theme } from "../../constants/theme"
// import Avatar from "../../components/Avatar"
// import { Ionicons } from "@expo/vector-icons"
//
// const Profile = () => {
//   const navigation = useNavigation()
//   return (
//     <ScreenWrapper bg="white">
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
//         {/* Top Navigation Bar */}
//         <View style={styles.header}>
//           <Text style={styles.title}>BraggingRightz</Text>
//           <View style={styles.icons}>
//             <Pressable onPress={() => navigation.navigate("Notifications")}>
//               <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate("newBet")}>
//               <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate("Profile")}>
//               <Avatar />
//             </Pressable>
//           </View>
//         </View>
//
//         {/* Profile Header */}
//         <View style={styles.profileHeader}>
//           <Text style={styles.profileTitle}>My Profile</Text>
//           <TouchableOpacity style={styles.settingsButton}>
//             <Ionicons name="settings-outline" size={hp(3.2)} color={theme.colors.text} />
//           </TouchableOpacity>
//         </View>
//
//         {/* Profile Section */}
//         <View style={styles.profileSection}>
//           <View style={styles.avatarContainer}>
//             <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.avatar} />
//           </View>
//           <Text style={styles.name}>John Doe</Text>
//           <View style={styles.locationContainer}>
//             <Ionicons name="location-outline" size={16} color={theme.colors.text} />
//             <Text style={styles.location}>New York, USA</Text>
//           </View>
//           <View style={styles.birthdayContainer}>
//             <Ionicons name="gift-outline" size={16} color={theme.colors.text} />
//             <Text style={styles.birthday}>January 1, 1990</Text>
//           </View>
//         </View>
//
//         {/* Profile Stats Section */}
//         <View style={styles.statsSection}>
//           <View style={styles.statItem}>
//             <Ionicons name="trophy-outline" size={24} color={theme.colors.primary} />
//             <Text style={styles.statValue}>50</Text>
//             <Text style={styles.statLabel}>Bets Placed</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
//             <Text style={styles.statValue}>120</Text>
//             <Text style={styles.statLabel}>Friends</Text>
//           </View>
//         </View>
//
//         {/* Action Buttons */}
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.button}>
//             <Text style={styles.buttonText}>Edit Profile</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.button, styles.outlineButton]}>
//             <Text style={[styles.buttonText, styles.outlineButtonText]}>Add Friend</Text>
//           </TouchableOpacity>
//         </View>
//
//         {/* Bets Won Section */}
//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>Bets Won</Text>
//           <View style={styles.sectionContent}>
//             <Ionicons name="trophy" size={hp(4)} color={theme.colors.primary} />
//             <Text style={styles.sectionValue}>25</Text>
//           </View>
//         </View>
//
//         {/* My Groups Section */}
//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>My Groups</Text>
//           <View style={styles.groupsList}>
//             {["Sports Fanatics", "Movie Buffs", "Trivia Masters"].map((group, index) => (
//               <TouchableOpacity key={index} style={styles.groupItem}>
//                 <Ionicons name="people" size={hp(3)} color={theme.colors.primary} />
//                 <Text style={styles.groupName}>{group}</Text>
//                 <Ionicons name="chevron-forward" size={hp(2.5)} color={theme.colors.text} />
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       </ScrollView>
//     </ScreenWrapper>
//   )
// }
//
// const styles = StyleSheet.create({
//   scrollContent: {
//     flexGrow: 1,
//     paddingBottom: hp(4),
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: hp(2),
//     marginHorizontal: wp(4),
//     paddingTop: hp(2),
//   },
//   title: {
//     fontSize: hp(3.2),
//     fontWeight: "bold",
//     color: theme.colors.text,
//   },
//   icons: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: wp(4),
//   },
//   profileHeader: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginHorizontal: wp(4),
//     marginBottom: hp(2),
//     position: "relative",
//   },
//   profileTitle: {
//     fontSize: hp(2.4),
//     fontWeight: "500",
//     color: theme.colors.text,
//   },
//   settingsButton: {
//     position: "absolute",
//     right: 0,
//   },
//   profileSection: {
//     alignItems: "center",
//     marginTop: hp(2),
//   },
//   avatarContainer: {
//     width: hp(15),
//     height: hp(15),
//     borderRadius: hp(7.5),
//     backgroundColor: "#ebeced",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: hp(2),
//   },
//   avatar: {
//     width: hp(14),
//     height: hp(14),
//     borderRadius: hp(7),
//   },
//   name: {
//     fontSize: hp(2.8),
//     fontWeight: "bold",
//     color: theme.colors.text,
//     marginBottom: hp(1),
//   },
//   locationContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: hp(1),
//   },
//   location: {
//     fontSize: hp(1.8),
//     color: theme.colors.text,
//     marginLeft: wp(1),
//   },
//   birthdayContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   birthday: {
//     fontSize: hp(1.8),
//     color: theme.colors.text,
//     marginLeft: wp(1),
//   },
//   statsSection: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: hp(4),
//     marginBottom: hp(4),
//   },
//   statItem: {
//     alignItems: "center",
//   },
//   statValue: {
//     fontSize: hp(2.4),
//     fontWeight: "bold",
//     color: theme.colors.text,
//     marginTop: hp(1),
//   },
//   statLabel: {
//     fontSize: hp(1.6),
//     color: theme.colors.textSecondary,
//   },
//   actionButtons: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     paddingHorizontal: wp(4),
//     marginBottom: hp(4),
//   },
//   button: {
//     backgroundColor: theme.colors.primary,
//     paddingVertical: hp(1.5),
//     paddingHorizontal: wp(6),
//     borderRadius: hp(1),
//     minWidth: wp(40),
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonText: {
//     color: "#FFFFFF",
//     fontSize: hp(1.8),
//     fontWeight: "600",
//   },
//   outlineButton: {
//     backgroundColor: "transparent",
//     borderWidth: 1,
//     borderColor: theme.colors.primary,
//   },
//   outlineButtonText: {
//     color: theme.colors.primary,
//   },
//   sectionContainer: {
//     alignItems: "center",
//     marginTop: hp(2),
//     marginBottom: hp(2),
//     paddingHorizontal: wp(4),
//   },
//   sectionTitle: {
//     fontSize: hp(2),
//     fontWeight: "600",
//     color: theme.colors.text,
//     marginBottom: hp(1),
//     alignSelf: "flex-start",
//   },
//   sectionContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   sectionValue: {
//     fontSize: hp(3.2),
//     fontWeight: "bold",
//     color: theme.colors.primary,
//     marginLeft: wp(2),
//   },
//   groupsList: {
//     width: "100%",
//   },
//   groupItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: hp(1.5),
//     borderBottomWidth: 1,
//     borderBottomColor: theme.colors.border,
//   },
//   groupName: {
//     flex: 1,
//     fontSize: hp(2),
//     color: theme.colors.text,
//     marginLeft: wp(2),
//   },
// })
//
// export default Profile

// import React from 'react';
// import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/FontAwesome';
//
// const Profile = () => {
//   const userStats = [
//     { icon: 'trophy', label: 'Bragging Rightz', value: '13' },
//     { icon: 'coins', label: 'Coins Won', value: '13,000' },
//     { icon: 'chart-line', label: 'Bets Won', value: '30/56' },
//   ];
//
//   const userBets = [
//     { bet: 'Who will eat the most apples?', date: '2/12', group: 'Skibidi Toilets', result: 'win', coins: 30 },
//     { bet: 'What will Lolita wear tonight?', date: '2/11', group: 'Skibidi Toilets', result: 'loss', coins: -30 },
//     { bet: 'How many pies will Libby buy?', date: '2/9', group: 'Skibidi Toilets', result: 'win', coins: 30 },
//   ];
//
//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         <View style={styles.header}>
//           <Image
//             source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ixuuet5HEVHDLgwCoBxpKtLUmSrx0u.png' }}
//             style={styles.profileImage}
//           />
//           <View style={styles.userInfo}>
//             <Text style={styles.userName}>John Doe</Text>
//             <Text style={styles.userEmail}>john.doe@gmail.com</Text>
//             <Text style={styles.userBirthdate}>April 14, 2003</Text>
//           </View>
//         </View>
//
//         <View style={styles.coinContainer}>
//           <Icon name="crown" size={24} color="#FFD700" />
//           <Text style={styles.coinCount}>130</Text>
//           <Icon name="plus-circle" size={24} color="#4CAF50" />
//         </View>
//
//         <Text style={styles.sectionTitle}>My Stats</Text>
//         <View style={styles.statsContainer}>
//           {userStats.map((stat, index) => (
//             <View key={index} style={styles.statItem}>
//               <Icon name={stat.icon} size={24} color="#FFD700" />
//               <Text style={styles.statValue}>{stat.value}</Text>
//               <Text style={styles.statLabel}>{stat.label}</Text>
//             </View>
//           ))}
//         </View>
//
//         <Text style={styles.sectionTitle}>My Bets</Text>
//         <View style={styles.betsContainer}>
//           {userBets.map((bet, index) => (
//             <View key={index} style={styles.betItem}>
//               <Text style={styles.betDescription}>{bet.bet}</Text>
//               <View style={styles.betDetails}>
//                 <Text style={styles.betDate}>{bet.date}</Text>
//                 <Text style={styles.betGroup}>{bet.group}</Text>
//                 <View style={styles.betResult}>
//                   <Icon
//                     name={bet.result === 'win' ? 'trophy' : 'times-circle'}
//                     size={18}
//                     color={bet.result === 'win' ? '#FFD700' : '#FF0000'}
//                   />
//                   <Text style={[
//                     styles.betCoins,
//                     { color: bet.result === 'win' ? '#4CAF50' : '#FF0000' }
//                   ]}>
//                     {bet.result === 'win' ? '+' : ''}{bet.coins}
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   header: {
//     flexDirection: 'row',
//     padding: 20,
//     alignItems: 'center',
//   },
//   profileImage: {
//     marginLeft: 60,
//     width: 100,
//     height: 100,
//     borderRadius: 40,
//   },
//   userInfo: {
//     marginLeft: 20,
//   },
//   userName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   userEmail: {
//     fontSize: 14,
//     color: '#666',
//   },
//   userBirthdate: {
//     fontSize: 14,
//     color: '#666',
//   },
//   coinContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 10,
//   },
//   coinCount: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginHorizontal: 10,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginTop: 20,
//     marginLeft: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 10,
//   },
//   statItem: {
//     alignItems: 'center',
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginTop: 5,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   betsContainer: {
//     marginTop: 10,
//     paddingHorizontal: 20,
//   },
//   betItem: {
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//   },
//   betDescription: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   betDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   betDate: {
//     fontSize: 12,
//     color: '#666',
//   },
//   betGroup: {
//     fontSize: 12,
//     color: '#666',
//   },
//   betResult: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   betCoins: {
//     marginLeft: 5,
//     fontWeight: 'bold',
//   },
// });
//
// export default Profile;


import React from 'react';
import { Pressable, StyleSheet, Text, ScrollView, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { theme } from "../../constants/theme";
import Avatar from '../../components/Avatar';
import Icon from 'react-native-vector-icons/FontAwesome';

const Profile = () => {
  const navigation = useNavigation();

  const userStats = [
    { icon: 'trophy', label: 'Bragging Rightz', value: '13' },
    { icon: 'coins', label: 'Coins Won', value: '13,000' },
    { icon: 'chart-line', label: 'Bets Won', value: '30/56' },
  ];

  const userBets = [
    { bet: 'Who will eat the most apples?', date: '2/12', group: 'Skibidi Toilets', result: 'win', coins: 30 },
    { bet: 'What will Lolita wear tonight?', date: '2/11', group: 'Skibidi Toilets', result: 'loss', coins: -30 },
    { bet: 'How many pies will Libby buy?', date: '2/9', group: 'Skibidi Toilets', result: 'win', coins: 30 },
  ];

  return (
    <ScreenWrapper bg="white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
        <View style={styles.sectionDivider} />


        <Text style={styles.sectionTitle}>My Profile</Text>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ixuuet5HEVHDLgwCoBxpKtLUmSrx0u.png' }}
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>johnnydoe47</Text>
            <Text style={styles.userEmail}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@gmail.com</Text>
            <Text style={styles.userBirthdate}>April 14, 2003</Text>
          </View>
          <View style={styles.coinContainer}>
            <Icon name="crown" size={24} color="#FFD700" />
            <Text style={styles.coinCount}>130</Text>
            <Icon name="plus-circle" size={24} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>My Stats</Text>
        <View style={styles.statsContainer}>
          {userStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Icon name={stat.icon} size={24} color="#FFD700" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>My Bets</Text>
        <View style={styles.betsContainer}>
          {userBets.map((bet, index) => (
            <View key={index} style={styles.betItem}>
              <Text style={styles.betDescription}>{bet.bet}</Text>
              <View style={styles.betDetails}>
                <Text style={styles.betDate}>{bet.date}</Text>
                <Text style={styles.betGroup}>{bet.group}</Text>
                <View style={styles.betResult}>
                  <Icon
                    name={bet.result === 'win' ? 'trophy' : 'times-circle'}
                    size={18}
                    color={bet.result === 'win' ? '#FFD700' : '#FF0000'}
                  />
                  <Text style={[
                    styles.betCoins,
                    { color: bet.result === 'win' ? '#4CAF50' : '#FF0000' }
                  ]}>
                    {bet.result === 'win' ? '+' : ''}{bet.coins}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    paddingTop: hp(2),
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    //borderWidth: 1,
    //borderColor: '#ccc6c6',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userInfo: {
    alignItems: 'left',
    marginTop: 15,
    marginHorizontal: 15
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  userBirthdate: {
    fontSize: 16,
    color: '#666',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 110,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  coinCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 20,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  betsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  betItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  betDescription: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betDate: {
    fontSize: 14,
    color: '#666',
  },
  betGroup: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  betResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betCoins: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Profile;
