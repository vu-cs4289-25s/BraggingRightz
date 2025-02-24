import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import AuthService from '../../src/endpoints/auth.cjs';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Dropdown } from 'react-native-element-dropdown';
import BetsService from '../../src/endpoints/bets.cjs';
import { useNavigation } from '@react-navigation/native';
import GroupsService from '../../src/endpoints/groups';

const NewBet = () => {
  const navigation = useNavigation();
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // two default empty options
  const [endTime, setEndTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  //const editorRef = useRef("");
  //const bodyRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        if (sessionData.groups && sessionData.groups.length > 0) {
          const tempGroups = await GroupsService.getUserGroups(sessionData.uid);
          setGroups(tempGroups);
        } else {
          // Redirect user to create group page if no groups
          Alert.alert(
            'No groups found for this user.',
            'Join or create a group to start betting!',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('NewGroup'),
              },
            ],
          );
          navigation.navigate('Home');
        }
      } catch (error) {
        console.log('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (text, index) => {
    let newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    // ensure at least two options remain
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setEndTime(date);
    hideDatePicker();
  };

  const formattedEndTime = endTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const submitBet = async () => {
    // validate inputs
    if (!selectedGroup) {
      Alert.alert('Please select a group.');
      return;
    }
    if (!question.trim()) {
      Alert.alert('Please enter your bet question.');
      return;
    }
    if (options.some((opt) => !opt.trim())) {
      Alert.alert('Please fill in all vote options.');
      return;
    }
    if (endTime.getTime() < Date.now()) {
      Alert.alert('Please specify when the voting ends.');
      return;
    }
    if (!coinAmount || !/^\d+$/.test(coinAmount)) {
      Alert.alert('Please enter a valid integer coin amount.');
      return;
    }

    setLoading(true);
    try {
      // Filter out any empty options and trim whitespace
      const validOptions = options
        .filter((opt) => opt.trim())
        .map((opt) => opt.trim());

      const betData = {
        creatorId: session.uid, // Make sure to use uid from session
        question: question.trim(),
        wagerAmount: parseInt(coinAmount, 10),
        answerOptions: validOptions,
        expiresAt: endTime.toISOString(),
        groupId: selectedGroup,
      };

      const result = await BetsService.createBet(betData);

      Alert.alert('Success', 'Bet created successfully!', [
        {
          text: 'View Bet',
          onPress: () =>
            navigation.navigate('BetDetails', { betId: result.id }),
        },
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error) {
      console.error('Error creating bet:', error);
      Alert.alert('Error', error.message || 'Failed to create bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Header title="Create Bet" showBackButton={true} />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Bet Question */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What are you betting on?</Text>
              <TextInput
                style={[styles.textInput, { height: hp(8) }]}
                placeholder="Type your bet question here..."
                placeholderTextColor={theme.colors.textLight} // darker placeholder
                value={question}
                onChangeText={setQuestion}
                multiline
              />
            </View>

            {/* Vote Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vote Options</Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={theme.colors.textLight}
                    value={option}
                    onChangeText={(text) => updateOption(text, index)}
                  />
                  {options.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removeOption(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={addOption}
                style={styles.addOptionButton}
              >
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
            </View>

            {/* Voting End Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voting Ends At</Text>
              <TouchableOpacity
                onPress={showDatePicker}
                style={styles.dateInput}
              >
                <Text style={styles.dateText}>{formattedEndTime}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
              />
            </View>

            {/* Group Selection */}
            <View style={[styles.section, { zIndex: 10 }]}>
              <Text style={styles.sectionTitle}>Select Group</Text>
              <Dropdown
                style={[pickerDropdownStyle.dropdown, { zIndex: 10 }]}
                placeholderStyle={pickerDropdownStyle.placeholderStyle}
                selectedTextStyle={pickerDropdownStyle.selectedTextStyle}
                iconStyle={pickerDropdownStyle.iconStyle}
                data={groups}
                maxHeight={300}
                labelField="name"
                valueField="id"
                placeholder="Select a group"
                value={selectedGroup}
                onChange={(item) => {
                  console.log('Selected Group:', item);
                  setSelectedGroup(item.id);
                }}
                dropDownStyle={[pickerDropdownStyle.dropdown, { zIndex: 20 }]}
              />
            </View>

            {/* Wager Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wager Amount (coins)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter coin amount"
                placeholderTextColor={theme.colors.textLight}
                value={coinAmount}
                onChangeText={setCoinAmount}
                keyboardType="numeric"
              />
            </View>
            <Button
              buttionStyle={{ height: hp(6.2) }}
              title="Create Bet"
              loading={loading}
              hasShadow={true}
              onPress={submitBet}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default NewBet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 0,
    paddingHorizontal: wp(4),
    gap: 15,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(3),
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    gap: 2,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.textLight, // darker border
    borderRadius: theme.radius.xl,
    padding: 12,
    fontSize: hp(2),
    color: theme.colors.text, // ensure input text is dark for readability
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 8,
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addOptionButton: {
    paddingVertical: 10,
  },
  addOptionText: {
    color: theme.colors.primary,
    fontSize: hp(2),
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.textDark,
    borderRadius: theme.radius.xl,
    padding: 12,
  },
  dateText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  placeholder: {
    color: theme.colors.textLight,
  },
});

const pickerDropdownStyle = {
  dropdown: {
    height: hp(6),
    borderColor: theme.colors.gray,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  selectedTextStyle: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
};
