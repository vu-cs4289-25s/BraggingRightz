import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import Button from '../../components/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import Input from '../../components/Input';

const EditBet = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { betId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [betData, setBetData] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [betId]);

  const loadData = async () => {
    try {
      setError(null);
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      const bet = await BetsService.getBet(betId);
      if (!bet) {
        throw new Error('Bet not found');
      }

      // Check if user is creator
      if (bet.creatorId !== sessionData.uid) {
        throw new Error('Only the creator can edit this bet');
      }

      // Check if bet is editable (not expired or locked)
      if (bet.status !== 'open' || new Date(bet.expiresAt) <= new Date()) {
        throw new Error('This bet can no longer be edited');
      }

      setBetData(bet);
      setQuestion(bet.question);
      setOptions(bet.answerOptions.map((opt) => opt.text));
    } catch (error) {
      console.error('Error loading bet:', error);
      setError(error.message || 'Failed to load bet details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (options.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 options allowed');
      return;
    }
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A bet must have at least 2 options');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const validateForm = () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Question is required');
      return false;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'At least 2 valid options are required');
      return false;
    }

    if (validOptions.length !== new Set(validOptions).size) {
      Alert.alert('Error', 'All options must be unique');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Only update allowed fields (question and option text)
      const updatedOptions = options.map((text, index) => ({
        ...(betData.answerOptions[index] || {}),
        id: betData.answerOptions[index]?.id || `option_${index + 1}`,
        text: text.trim(),
        participants: betData.answerOptions[index]?.participants || [],
        totalWager: betData.answerOptions[index]?.totalWager || 0,
      }));

      await BetsService.updateBet(betId, {
        question: question.trim(),
        answerOptions: updatedOptions,
      });

      Alert.alert('Success', 'Bet updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setError(error.message || 'Failed to update bet');
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

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Icon
            name="exclamation-circle"
            size={50}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Header title="Edit Bet" showBackButton={true} />

        <View style={styles.form}>
          <Text style={styles.label}>Question</Text>
          <Input
            value={question}
            onChangeText={setQuestion}
            placeholder="Enter your question"
            multiline
            maxLength={200}
          />

          <Text style={styles.label}>Options</Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <Input
                style={styles.optionInput}
                value={option}
                onChangeText={(text) => {
                  const newOptions = [...options];
                  newOptions[index] = text;
                  setOptions(newOptions);
                }}
                placeholder={`Option ${index + 1}`}
                maxLength={100}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeOption(index)}
                >
                  <Icon name="times" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {options.length < 5 && (
            <TouchableOpacity style={styles.addButton} onPress={addOption}>
              <Icon name="plus" size={16} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>Add Option</Text>
            </TouchableOpacity>
          )}

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={submitting}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  errorText: {
    fontSize: hp(2),
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: hp(2),
  },
  form: {
    padding: wp(4),
    gap: hp(2),
  },
  label: {
    fontSize: hp(2),
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  optionContainer: {
    alignItems: 'center',
    marginBottom: hp(1),
  },
  optionInput: {
    flex: 1,
  },
  removeButton: {
    padding: wp(2),
    marginLeft: wp(2),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: wp(2),
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    marginLeft: wp(2),
  },
  submitButton: {
    marginTop: hp(2),
  },
});

export default EditBet;
