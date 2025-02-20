import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import Camera from '../../assets/icons/Camera';
import { useNavigation } from '@react-navigation/native';
import Input from '../../components/Input';
import Icon from '../../assets/icons';

const EditProfile = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    //fetch the user's current profile data.
    setProfileImage('https://via.placeholder.com/150');
    setFullName('John Doe');
    setUsername('johndoe');
    setEmail('john.doe@gmail.com');
    //setBirthdate('January 1, 1990');
  }, []);

  const pickImage = async () => {
    // request permission and launch image picker
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.cancelled) {
      setProfileImage(result.uri);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    // perform your update logic here.
    console.log('Profile updated:', {
      fullName,
      username,
      email,
      birthdate,
      profileImage,
    });
    setLoading(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <Header title="Edit Profile" showBackButton={true} />
          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarContainer}
              >
                <Avatar
                  uri={profileImage || require('../../assets/images/icon.png')}
                  size={hp(15)}
                  rounded={theme.radius.xl}
                />
                <View style={styles.editIcon}>
                  <Camera size={hp(2)} color={theme.colors.dark} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
              Please fill in your profile details
            </Text>
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your name"
              value={null}
              onChangeText={(value) => {}}
            />
            <Input
              icon={<Icon name="user" />}
              placeholder="Enter your new username"
              value={null}
              onChangeText={(value) => {}}
            />
            <Input
              icon={<Icon name="mail" />}
              placeholder="Enter your new email"
              value={null}
              onChangeText={(value) => {}}
            />
            <Input
              icon={<Icon name="lock" />}
              placeholder="Enter your new password"
              value={null}
              onChangeText={(value) => {}}
            />
            <Button title="Update" loading={loading} onPress={handleUpdate} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    flex: 1,
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  form: {
    gap: 18,
    marginTop: 20,
  },
  label: {
    fontSize: hp(2),
    marginBottom: 5,
    color: theme.colors.textDark,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    padding: 17,
    paddingHorizontal: 20,
    gap: 15,
  },
});
