import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import GroupsService from '../../src/endpoints/groups.cjs';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import NewGroup from './newGroup';
import Icon from 'react-native-vector-icons/Ionicons';

const NewBet = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params || {};

  const isFromMainPage = !groupId;

  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [wagerAmount, setWagerAmount] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [endTime, setEndTime] = useState(new Date());
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [session, setSession] = useState(null);

  const handleBackPress = () => {
    if (isFromMainPage) {
      navigation.navigate('Main', {
        screen: 'Home',
        params: { refresh: Date.now() },
      });
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData);

        const userGroups = await GroupsService.getUserGroups(sessionData.uid);
        const groupOptions = userGroups.map((group) => ({
          label: group.name,
          value: group.id,
        }));
        setGroups(groupOptions);

        if (groupId) {
          setSelectedGroup(groupId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      }
    };
    loadData();
  }, [groupId]);

  const handleDateConfirm = (date) => {
    setEndTime(date);
    setShowDatePicker(false);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A bet must have at least 2 options');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const submitBet = async () => {
    try {
      if (!selectedGroup) {
        Alert.alert('Error', 'Please select a group');
        return;
      }

      if (!question.trim()) {
        Alert.alert('Error', 'Please enter a question');
        return;
      }

      const validOptions = options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please enter at least 2 valid options');
        return;
      }

      // Check for duplicate options
      const uniqueOptions = new Set(
        validOptions.map((opt) => opt.toLowerCase()),
      );
      if (uniqueOptions.size !== validOptions.length) {
        Alert.alert('Error', 'Please ensure all options are unique');
        return;
      }

      const wager = parseInt(wagerAmount);
      if (isNaN(wager) || wager <= 0) {
        Alert.alert('Error', 'Please enter a valid wager amount');
        return;
      }

      // Check if user has enough coins
      if (session.numCoins < wager) {
        Alert.alert('Error', 'You do not have enough coins for this wager');
        return;
      }

      // Check if end time is in the future
      if (endTime <= new Date()) {
        Alert.alert('Error', 'Please select a future date and time');
        return;
      }

      setLoading(true);

      const betData = {
        creatorId: session.uid,
        question: question.trim(),
        wagerAmount: wager,
        answerOptions: validOptions,
        expiresAt: endTime.toISOString(),
        groupId: selectedGroup,
      };

      const result = await BetsService.createBet(betData);

      // Navigate to BetDetails with appropriate parameters
      if (isFromMainPage) {
        navigation.replace('BetDetails', {
          betId: result.id,
          fromNewBet: true,
          fromBottomNav: true,
        });
      } else {
        // When coming from a group, navigate to BetDetails with group context
        navigation.replace('BetDetails', {
          betId: result.id,
          fromNewBet: true,
          fromGroup: true,
          groupId: selectedGroup,
        });
      }
    } catch (error) {
      console.error('Error creating bet:', error);
      if (error.code === 'insufficient-coins') {
        Alert.alert('Error', 'You do not have enough coins for this wager');
      } else if (error.code === 'invalid-group') {
        Alert.alert('Error', 'The selected group is no longer available');
      } else {
        Alert.alert('Error', 'Failed to create bet. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Prompt user to create or join group to make bets if they have no groups, else render form
  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {groups.length === 0 ? (
            <>
              <Header
                title="Create New Bet"
                showBackButton={true}
                onBackPress={handleBackPress}
              />
              <View style={styles.noGroupsContainer}>
                <Text style={styles.noGroupsText}>
                  You need to be in a group to create bets.
                </Text>
                <Button
                  title="Create a Group"
                  onPress={() => navigation.navigate('NewGroup')}
                  style={styles.createGroupButton}
                />
              </View>
            </>
          ) : (
            <>
              <Header
                title="Create New Bet"
                showBackButton={true}
                onBackPress={handleBackPress}
              />
              <View style={styles.form}>
                <Text style={styles.label}>Select Group</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={groups}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a group"
                  value={selectedGroup}
                  onChange={(item) => setSelectedGroup(item.value)}
                />

                <Text style={styles.label}>Question</Text>
                <Input
                  placeholder="What's your bet?"
                  value={question}
                  onChangeText={setQuestion}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />

                <Text style={styles.label}>Options</Text>
                {options.map((option, index) => (
                  <View key={index} style={styles.optionContainer}>
                    <Input
                      style={styles.optionInput}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChangeText={(text) => updateOption(text, index)}
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeOption(index)}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={addOption}>
                  <Text style={styles.addButtonText}>+ Add Option</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Wager Amount (coins)</Text>
                <Input
                  placeholder="Enter wager amount"
                  value={wagerAmount}
                  onChangeText={setWagerAmount}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />

                <Text style={styles.label}>Voting Ends</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {endTime.toLocaleString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="datetime"
                    onConfirm={handleDateConfirm}
                    onCancel={() => setShowDatePicker(false)}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Create Bet"
                  onPress={submitBet}
                  loading={loading}
                  style={styles.submitButton}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: wp(4),
    flex: 1,
  },
  noGroupsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noGroupsText: {
    fontSize: hp(2.4),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  createGroupButton: {
    height: hp(7),
    width: '100%',
    marginTop: hp(2),
  },
  label: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1),
    marginTop: hp(2),
  },
  dropdown: {
    height: hp(6),
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: wp(3),
  },
  optionContainer: {
    // flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  optionInput: {
    flex: 1,
  },
  removeButton: {
    marginLeft: wp(2),
    padding: wp(2),
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.sm,
  },
  removeButtonText: {
    color: theme.colors.white,
    fontSize: hp(2),
    fontWeight: 'bold',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginVertical: hp(1),
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: hp(1.5),
    backgroundColor: 'white',
  },
  dateButtonText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  buttonContainer: {
    padding: wp(4),
    paddingTop: hp(4),
    paddingBottom: Platform.OS === 'ios' ? hp(8) : hp(4),
    backgroundColor: theme.colors.background,
  },
  submitButton: {
    height: hp(7),
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
});

export default NewBet;
