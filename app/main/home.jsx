// import { StyleSheet, Text, View } from 'react-native';
// import React from 'react';
//
// const home = () => {
//   return (
//     <View>
//       <Text>Hello</Text>
//     </View>
//   );
// };
//
// export default home;
//
// const styles = StyleSheet.create({});


import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons'; // Use expo install @expo/vector-icons

const Home = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
        </View>

        {/* Sleek Coins Bar */}
        <View style={styles.coinsBar}>
          <Ionicons name="logo-bitcoin" size={20} color="#FACC15" />
          <Text style={styles.coinText}>785 coins</Text>
        </View>
      </View>

      {/* Notification Bubble */}
      <TouchableOpacity style={styles.notificationBubble}>
        <Text style={styles.notificationText}>15</Text>
      </TouchableOpacity>

      {/* Menu Options */}
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
  );
};

const menuItems = [
  { label: 'My Groups', icon: 'people-outline' },
  { label: 'Achievements', icon: 'trophy-outline' },
  { label: 'Active Bets', icon: 'stats-chart-outline' },
  { label: 'My Bets', icon: 'document-text-outline' },
];

export default Home;

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: screenHeight * 0.15,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    elevation: 2, // Adds a subtle shadow on Android
    shadowColor: '#000', // iOS shadow
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
  notificationBubble: {
    position: 'absolute',
    top: 70,
    right: 30,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    elevation: 2,
  },
  notificationText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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





