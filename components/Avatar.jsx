import { StyleSheet, Image, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { theme } from '../constants';
import { hp } from '../helpers/common';
import { auth, db } from '../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const Avatar = ({ uri, size = hp(4.5), style = {} }) => {
  const [profileImage, setProfileImage] = useState(uri);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (uri) {
      setProfileImage(uri);
    } else if (auth.currentUser) {
      loadProfileImage();
    }
  }, [uri, auth.currentUser]);

  const loadProfileImage = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profilePicture) {
          setProfileImage(userData.profilePicture);
        }
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {loading ? (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <ActivityIndicator color={theme?.colors?.primary || '#000'} />
        </View>
      ) : profileImage ? (
        <Image
          source={{ uri: profileImage }}
          style={[styles.image, { width: size, height: size }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Ionicons
            name="person"
            size={size * 0.6}
            color={theme?.colors?.text || '#000'}
          />
        </View>
      )}
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  container: {
    borderRadius: 1000,
    overflow: 'hidden',
    backgroundColor: '#ebeced',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  placeholder: {
    backgroundColor: '#ebeced',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1000,
  },
});
