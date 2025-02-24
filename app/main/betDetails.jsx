import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import Button from '../../components/Button';

const BetDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { betId } = route.params;

  const [loading, setLoading] = useState(true);
  const [betData, setBetData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [session, setSession] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [commenting, setCommenting] = useState(false);

  // Reactions available
  const reactions = ['👍', '👎', '🤔', '😂', '🎉'];

  useEffect(() => {
    loadData();
  }, [betId]);

  const loadData = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      const [betDetails, betComments] = await Promise.all([
        BetsService.getBet(betId),
        BetsService.getBetComments(betId),
      ]);

      setBetData(betDetails);
      setComments(betComments);
    } catch (error) {
      console.error('Error loading bet details:', error);
      Alert.alert('Error', 'Failed to load bet details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedOption) {
      Alert.alert('Please select an option');
      return;
    }

    try {
      setLoading(true);
      await BetsService.placeBet(betId, session.uid, selectedOption);
      Alert.alert('Success', 'Your bet has been placed!');
      loadData(); // Reload data to show updated bet status
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setCommenting(true);
      await BetsService.addComment(
        betData.groupId,
        betId,
        session.uid,
        newComment.trim(),
      );
      setNewComment('');
      loadData(); // Reload comments
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleReaction = async (reaction) => {
    try {
      await BetsService.addReaction(
        betData.groupId,
        betId,
        session.uid,
        reaction,
      );
      loadData(); // Reload to show updated reactions
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add reaction');
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

  if (!betData) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text>Bet not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const isExpired = new Date(betData.expiresAt) < new Date();
  const hasPlacedBet = betData.answerOptions.some((opt) =>
    opt.participants.includes(session?.uid),
  );

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Header title="Bet Details" showBackButton={true} />

        <View style={styles.betInfo}>
          <Text style={styles.question}>{betData.question}</Text>
          <Text style={styles.wager}>Wager: {betData.wagerAmount} coins</Text>
          <Text style={styles.expires}>
            Expires: {new Date(betData.expiresAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.options}>
          {betData.answerOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selectedOption === option.id && styles.selectedOption,
                hasPlacedBet && styles.disabledOption,
              ]}
              onPress={() => !hasPlacedBet && setSelectedOption(option.id)}
              disabled={hasPlacedBet || isExpired}
            >
              <Text style={styles.optionText}>{option.text}</Text>
              <Text style={styles.participantCount}>
                {option.participants.length} bets
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!hasPlacedBet && !isExpired && (
          <Button
            title="Place Bet"
            onPress={handlePlaceBet}
            disabled={!selectedOption}
          />
        )}

        <View style={styles.reactionsContainer}>
          <Text style={styles.sectionTitle}>Reactions</Text>
          <View style={styles.reactions}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                style={styles.reactionButton}
                onPress={() => handleReaction(reaction)}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              multiline
            />
            <Button
              title="Post"
              onPress={handleAddComment}
              loading={commenting}
              disabled={!newComment.trim()}
            />
          </View>

          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentUser}>{comment.userId}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betInfo: {
    marginBottom: hp(2),
  },
  question: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  wager: {
    fontSize: hp(2),
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  expires: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  options: {
    marginVertical: hp(2),
  },
  option: {
    padding: hp(2),
    backgroundColor: '#f0f0f0',
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  disabledOption: {
    opacity: 0.7,
  },
  optionText: {
    fontSize: hp(2),
    flex: 1,
  },
  participantCount: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginVertical: hp(2),
  },
  reactionsContainer: {
    marginTop: hp(2),
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  reactionButton: {
    padding: hp(1),
    backgroundColor: '#f0f0f0',
    borderRadius: theme.radius.lg,
  },
  reactionEmoji: {
    fontSize: hp(2.5),
  },
  commentsSection: {
    marginTop: hp(2),
  },
  commentInput: {
    flexDirection: 'row',
    gap: wp(2),
    marginBottom: hp(2),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.textLight,
    borderRadius: theme.radius.lg,
    padding: hp(1),
    fontSize: hp(2),
  },
  commentsList: {
    gap: hp(2),
  },
  comment: {
    backgroundColor: '#f8f8f8',
    padding: hp(2),
    borderRadius: theme.radius.lg,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  commentText: {
    fontSize: hp(2),
  },
  commentTime: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
});

export default BetDetails;
