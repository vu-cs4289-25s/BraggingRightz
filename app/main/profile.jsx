import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useEffect } from 'react';

const Profile = () => {
  const navigation = useNavigation();

  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error('uriToBlob failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await AuthService.getSession();
        if (userDoc && userDoc.profilePicture) {
          setProfileImage(userDoc.profilePicture);
        }
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant permission to access your photos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        maxWidth: 500,
        maxHeight: 500,
        base64: true,
      });

      console.log('Image picker result:', {
        cancelled: result.canceled,
        type: result.assets?.[0]?.type,
        uri: result.assets?.[0]?.uri?.substring(0, 50) + '...',
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in to upload a profile picture.');
      return;
    }

    setUploading(true);
    try {
      // Convert uri to blob using the new method
      const blob = await uriToBlob(uri);

      // Log file details
      console.log('File details:', {
        size: blob.size,
        type: blob.type,
        user: auth.currentUser.uid,
      });

      // Create file reference
      const filename = `profile_${auth.currentUser.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profileImages/${filename}`);

      // Log storage reference
      console.log('Storage reference:', storageRef.fullPath);

      // Upload file with metadata
      const metadata = {
        contentType: 'image/jpeg',
      };

      await uploadBytes(storageRef, blob, metadata);
      console.log('Uploaded blob successfully');

      // Get URL
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Got download URL:', downloadUrl);

      // Update profile
      setProfileImage(downloadUrl);
      await AuthService.updateProfile(auth.currentUser.uid, {
        profilePicture: downloadUrl,
      });

      // Force reload profile image in Avatar component
      await loadProfileImage();

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.log('Upload error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        user: auth.currentUser?.uid,
        serverResponse: error.serverResponse, // Log the server response
      });

      // More specific error messages
      let errorMessage = 'Failed to upload image. Please try again later.';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload files.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };
  const userStats = [
    { icon: 'trophy', label: 'Bragging Rightz', value: '13' },
    { icon: 'coins', label: 'Coins Won', value: '13,000' },
    { icon: 'chart-line', label: 'Bets Won', value: '30/56' },
  ];

  const userBets = [
    {
      bet: 'Who will eat the most apples?',
      date: '2/12',
      group: 'Skibidi Toilets',
      result: 'win',
      coins: 30,
    },
    {
      bet: 'What will Lolita wear tonight?',
      date: '2/11',
      group: 'Skibidi Toilets',
      result: 'loss',
      coins: -30,
    },
    {
      bet: 'How many pies will Libby buy?',
      date: '2/9',
      group: 'Skibidi Toilets',
      result: 'win',
      coins: 30,
    },
  ];

  return (
    <ScreenWrapper bg="white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            source={{
              uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ixuuet5HEVHDLgwCoBxpKtLUmSrx0u.png',
            }}
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
                  <Text
                    style={[
                      styles.betCoins,
                      { color: bet.result === 'win' ? '#4CAF50' : '#FF0000' },
                    ]}
                  >
                    {bet.result === 'win' ? '+' : ''}
                    {bet.coins}
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
    marginHorizontal: 15,
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
    shadowColor: '#000',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
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
