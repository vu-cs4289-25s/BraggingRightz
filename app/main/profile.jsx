import { Pressable, StyleSheet, Text, ScrollView, TouchableOpacity, View, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import ScreenWrapper from "../../components/ScreenWrapper"
import Icon from "../../assets/icons"
import { hp, wp } from "../../helpers/common"
import { theme } from "../../constants/theme"
import Avatar from "../../components/Avatar"
import { Ionicons } from "@expo/vector-icons"

const Profile = () => {
  const navigation = useNavigation()
  return (
    <ScreenWrapper bg="white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Navigation Bar */}
        <View style={styles.header}>
          <Text style={styles.title}>BraggingRightz</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => navigation.navigate("Notifications")}>
              <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate("newBet")}>
              <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate("Profile")}>
              <Avatar />
            </Pressable>
          </View>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={hp(3.2)} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>John Doe</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={theme.colors.text} />
            <Text style={styles.location}>New York, USA</Text>
          </View>
          <View style={styles.birthdayContainer}>
            <Ionicons name="gift-outline" size={16} color={theme.colors.text} />
            <Text style={styles.birthday}>January 1, 1990</Text>
          </View>
        </View>

        {/* Profile Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Ionicons name="trophy-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>50</Text>
            <Text style={styles.statLabel}>Bets Placed</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>120</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.outlineButton]}>
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Add Friend</Text>
          </TouchableOpacity>
        </View>

        {/* Bets Won Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Bets Won</Text>
          <View style={styles.sectionContent}>
            <Ionicons name="trophy" size={hp(4)} color={theme.colors.primary} />
            <Text style={styles.sectionValue}>25</Text>
          </View>
        </View>

        {/* My Groups Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <View style={styles.groupsList}>
            {["Sports Fanatics", "Movie Buffs", "Trivia Masters"].map((group, index) => (
              <TouchableOpacity key={index} style={styles.groupItem}>
                <Ionicons name="people" size={hp(3)} color={theme.colors.primary} />
                <Text style={styles.groupName}>{group}</Text>
                <Ionicons name="chevron-forward" size={hp(2.5)} color={theme.colors.text} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    paddingTop: hp(2),
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: "bold",
    color: theme.colors.text,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(4),
  },
  profileHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    position: "relative",
  },
  profileTitle: {
    fontSize: hp(2.4),
    fontWeight: "500",
    color: theme.colors.text,
  },
  settingsButton: {
    position: "absolute",
    right: 0,
  },
  profileSection: {
    alignItems: "center",
    marginTop: hp(2),
  },
  avatarContainer: {
    width: hp(15),
    height: hp(15),
    borderRadius: hp(7.5),
    backgroundColor: "#ebeced",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(2),
  },
  avatar: {
    width: hp(14),
    height: hp(14),
    borderRadius: hp(7),
  },
  name: {
    fontSize: hp(2.8),
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  location: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    marginLeft: wp(1),
  },
  birthdayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  birthday: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    marginLeft: wp(1),
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: hp(4),
    marginBottom: hp(4),
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: hp(2.4),
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: hp(1),
  },
  statLabel: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: wp(4),
    marginBottom: hp(4),
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: hp(1),
    minWidth: wp(40),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: hp(1.8),
    fontWeight: "600",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineButtonText: {
    color: theme.colors.primary,
  },
  sectionContainer: {
    alignItems: "center",
    marginTop: hp(2),
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: hp(1),
    alignSelf: "flex-start",
  },
  sectionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionValue: {
    fontSize: hp(3.2),
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: wp(2),
  },
  groupsList: {
    width: "100%",
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupName: {
    flex: 1,
    fontSize: hp(2),
    color: theme.colors.text,
    marginLeft: wp(2),
  },
})

export default Profile
