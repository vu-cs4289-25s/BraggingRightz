import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { theme } from '../constants';
import { hp, wp } from '../helpers/common';

const Avatar = ({
  uri,
  size=hp(4.5),
  //rounded=theme.radius.md,
  style={}
}) => {
  
  return (
    <View>
      <Text>Avatar</Text>
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({});
