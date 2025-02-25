import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import Button from '../../components/Button';
import { sharedStyles } from '../styles/shared';

const EditBet = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { betId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [betData, setBetData] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    loadBet();
  }, [betId]);

  const loadBet = async () => {
    try {
      const bet = await BetsService.getBet(betId);
      if (!bet) {
        Alert.alert('Error', 'Bet not found');
        navigation.goBack();
        return;
      }

      setBetData(bet);
      setQuestion(bet.question);
      setOptions(bet.answerOptions.map((opt) => opt.text));
    } catch (error) {
      console.error('Error loading bet:', error);
      Alert.alert('Error', 'Failed to load bet details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Question is required');
      return;
    }

    if (options.length < 2) {
      Alert.alert('Error', 'At least 2 options are required');
      return;
    }

    try {
      setSubmitting(true);

      // Only update allowed fields (question and option text)
      const updatedOptions = betData.answerOptions.map((opt, index) => ({
        ...opt,
        text: options[index] || opt.text,
      }));

      await BetsService.updateBet(betId, {
        question: question.trim(),
        answerOptions: updatedOptions,
      });

      Alert.alert('Success', 'Bet updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update bet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={sharedStyles.container}>
        <Header title="Edit Bet" showBackButton={true} />

        <View style={styles.form}>
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Enter your question"
            multiline
          />

          <Text style={styles.label}>Options</Text>
          {options.map((option, index) => (
            <TextInput
              key={index}
              style={styles.input}
              value={option}
              onChangeText={(text) => {
                const newOptions = [...options];
                newOptions[index] = text;
                setOptions(newOptions);
              }}
              placeholder={`Option ${index + 1}`}
            />
          ))}

          <Button
            title="Save Changes"
            onPress={handleSave}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: hp(2),
  },
  label: {
    fontSize: hp(2),
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.textLight,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    fontSize: hp(2),
    backgroundColor: 'white',
  },
});

export default EditBet;
