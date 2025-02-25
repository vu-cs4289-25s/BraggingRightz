// import { StyleSheet, Text, View } from 'react-native';
// import React from 'react';
//
// const Notifications = () => {
//   return (
//     <View>
//       <Text>notifications</Text>
//     </View>
//   );
// };
//
// export default Notifications;
//
// const styles = StyleSheet.create({});


import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const Notifications = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>Notifications</Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.activeFilter}>
          <Text style={styles.filterTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filter}>
          <Text style={styles.filterText}>Your Bets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filter}>
          <Text style={styles.filterText}>Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filter}>
          <Text style={styles.filterText}>New Follows</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Notifications List */}
      <ScrollView contentContainerStyle={styles.notificationsList}>

        {/* Follow Request Notification */}
        <TouchableOpacity style={styles.notificationItem}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/300' }} // Example Avatar
            style={styles.avatar}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>New Follows</Text>
            <Text style={styles.notificationSubtitle}>penCard + 8 others</Text>
          </View>
          <View style={styles.unreadDot} />
          <FontAwesome5 name="chevron-right" size={14} color="#AAAAAA" />
        </TouchableOpacity>

        {/* Section: New */}
        <Text style={styles.sectionTitle}>New</Text>
        <TouchableOpacity style={styles.notificationItem}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/301' }} // Example Avatar
            style={styles.avatar}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>User123 added you as a friend </Text>
            <Text style={styles.notificationSubtitle}>Just now</Text>
          </View>
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        {/* Section: Today */}
        <Text style={styles.sectionTitle}>Today</Text>
        <TouchableOpacity style={styles.notificationItem}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/302' }} // Example Avatar
            style={styles.avatar}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Sean created a new bet</Text>
            <Text style={styles.notificationSubtitle}>2 hours ago</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f5', // Dark background
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filter: {
    backgroundColor: '#eaeaea',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  activeFilter: {
    backgroundColor: '#ededed',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterText: {
    color: '#0c0c0c',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationsList: {
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#0e0e0e',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: '#070707',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationSubtitle: {
    color: '#303030',
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2', // Blue for unread notifications
    marginRight: 10,
  },
});

