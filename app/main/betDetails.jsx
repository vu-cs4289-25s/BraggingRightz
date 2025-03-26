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
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import GroupsService from '../../src/endpoints/groups.cjs';
import Button from '../../components/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sharedStyles } from '../styles/shared';
import NotificationsService from '../../src/endpoints/notifications.cjs';

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
  const [submitting, setSubmitting] = useState(false);
  const [reactions, setReactions] = useState(['👍', '👎', '🤔', '😂', '🎉']);
  const [userReactions, setUserReactions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    loadData();
    checkExpiredBet();
  }, [betId]);

  const loadData = async () => {
    try {
      const sessionData = await AuthService.getSession();
      setSession(sessionData);

      // Get bet details
      const betDetails = await BetsService.getBet(betId);
      if (!betDetails) {
        Alert.alert('Error', 'Bet not found');
        navigation.goBack();
        return;
      }

      // If bet has a group, fetch group name
      if (betDetails.groupId) {
        const groupName = await GroupsService.getGroupName(betDetails.groupId);
        betDetails.groupName = groupName;
      }

      // Process reactions - only mark as selected if user has actually reacted
      const reactionCounts = {};
      const userReactionMap = {};

      if (betDetails.reactions) {
        betDetails.reactions.forEach((reaction) => {
          if (!reactionCounts[reaction.reaction]) {
            reactionCounts[reaction.reaction] = 0;
          }
          reactionCounts[reaction.reaction]++;

          // Only mark as selected if this user made the reaction
          if (reaction.userId === sessionData.uid) {
            userReactionMap[reaction.reaction] = true;
          }
        });
      }

      betDetails.reactionCounts = reactionCounts;
      setUserReactions(userReactionMap);
      setBetData(betDetails);

      // Get comments
      const betComments = await BetsService.getBetComments(betId);
      setComments(betComments);
    } catch (error) {
      console.error('Error loading bet details:', error);
      Alert.alert('Error', 'Failed to load bet details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredBet = async () => {
    if (!betData || !session) return;

    const isCreator = betData.creatorId === session.uid;
    const isExpired = new Date(betData.expiresAt) < new Date();

    // Lock bet if expired but not yet locked
    if (isExpired && betData.status !== 'locked') {
      try {
        await BetsService.lockBet(betId);
        // Refresh bet data after locking
        const updatedBet = await BetsService.getBet(betId);
        setBetData(updatedBet);
      } catch (error) {
        console.error('Error locking bet:', error);
      }
    }

    const needsResult = betData.status === 'locked' && !betData.winningOptionId;

    if (isCreator && isExpired && needsResult) {
      setShowResultModal(true);
    }
  };

  const handleVote = async (optionId) => {
    if (!session) {
      Alert.alert('Error', 'Please log in to vote');
      return;
    }

    try {
      setSubmitting(true);
      await BetsService.placeBet(betId, session.uid, optionId);

      // Refresh bet data
      const updatedBet = await BetsService.getBet(betId);
      setBetData(updatedBet);

      Alert.alert('Success', 'Your vote has been placed!');
    } catch (error) {
      console.error('Error placing vote:', error);
      Alert.alert('Error', error.message || 'Failed to place vote');
    } finally {
      setSubmitting(false);
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
    if (!session) {
      Alert.alert('Error', 'Please log in to react');
      return;
    }

    try {
      setSubmitting(true);
      await BetsService.toggleReaction(
        betData.groupId,
        betId,
        session.uid,
        reaction,
      );

      // Update local state
      setUserReactions((prev) => ({
        ...prev,
        [reaction]: !prev[reaction],
      }));

      // Refresh bet data
      const updatedBet = await BetsService.getBet(betId);
      setBetData(updatedBet);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add reaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await BetsService.deleteBet(betId);
      Alert.alert('Success', 'Bet deleted successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete bet');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSelectWinner = async (optionId) => {
    try {
      setSubmitting(true);

      // Get the winning option details
      const winningOption = betData.answerOptions.find(
        (opt) => opt.id === optionId,
      );
      if (!winningOption) {
        throw new Error('Invalid option selected');
      }

      // Calculate winnings per person
      const totalParticipants = betData.answerOptions.reduce(
        (sum, opt) => sum + opt.participants.length,
        0,
      );
      const totalPool = betData.wagerAmount * totalParticipants;
      const winnersCount = winningOption.participants.length;
      const winningsPerPerson = Math.floor(totalPool / winnersCount);

      // Release result and distribute coins
      await BetsService.releaseResult(
        betId,
        session.uid,
        optionId,
        winningsPerPerson,
      );

      // Send notifications to all participants
      const notificationPromises = betData.answerOptions.flatMap((option) =>
        option.participants.map(async (participantId) => {
          const isWinner = option.id === optionId;
          const notificationData = {
            userId: participantId,
            type: 'bets',
            title: `Results are in for "${betData.question}"`,
            message: isWinner
              ? `Congratulations! You won ${winningsPerPerson} coins!`
              : 'Better luck next time!',
            data: {
              betId,
              result: isWinner ? 'won' : 'lost',
              winningsPerPerson: isWinner ? winningsPerPerson : 0,
            },
          };
          return NotificationsService.createNotification(notificationData);
        }),
      );

      await Promise.all(notificationPromises);

      Alert.alert(
        'Success',
        `Winner selected and ${winningsPerPerson} coins distributed to each winner!`,
      );

      // Refresh bet data to show updated state
      loadData();
    } catch (error) {
      console.error('Error selecting winner:', error);
      Alert.alert('Error', error.message || 'Failed to select winner');
    } finally {
      setSubmitting(false);
      setShowResultModal(false);
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

  const userVotedOption = betData.answerOptions.find((option) =>
    option.participants.includes(session?.uid),
  );

  const totalParticipants = betData.answerOptions.reduce(
    (sum, opt) => sum + opt.participants.length,
    0,
  );

  const renderVotingOption = (option) => {
    const voteCount = option.participants?.length || 0;
    const percentage =
      totalParticipants > 0
        ? Math.round((voteCount / totalParticipants) * 100)
        : 0;
    const hasVoted = betData.answerOptions.some((opt) =>
      opt.participants?.includes(session?.uid),
    );
    const isWinner = betData.winningOptionId === option.id;
    const isCreator = betData.creatorId === session?.uid;
    const isExpired = new Date(betData.expiresAt) <= new Date();
    const userVotedThisOption = option.participants?.includes(session?.uid);
    const userWon = isWinner && userVotedThisOption;

    return (
      <View
        key={option.id}
        style={[
          styles.optionContainer,
          userVotedThisOption && styles.votedOption,
          isWinner && styles.winnerOption,
        ]}
      >
        {/* Winner Crown for winning option */}
        {isWinner && (
          <View style={styles.crownContainer}>
            <Icon name="crown" size={24} color="#FFD700" />
          </View>
        )}

        {/* Option Header */}
        <View style={styles.optionHeader}>
          <Text style={[styles.optionText, isWinner && styles.winnerText]}>
            {option.text}
            {userWon && ' 🏆'}
          </Text>
          <View style={[styles.voteCount, isWinner && styles.winnerVoteCount]}>
            <Text
              style={[
                styles.voteCountText,
                isWinner && styles.winnerVoteCountText,
              ]}
            >
              {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percentage}%)
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor: isWinner
                  ? '#FFD700'
                  : percentage >= 50
                    ? theme.colors.primary
                    : theme.colors.secondary,
              },
            ]}
          />
        </View>

        {/* Winner Badge */}
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Icon name="trophy" size={24} color="#FFD700" />
            <Text style={styles.winnerText}>Winner!</Text>
            {betData.winningsPerPerson && (
              <Text style={styles.winningsText}>
                {betData.winningsPerPerson} coins per winner
              </Text>
            )}
          </View>
        )}

        {/* Your Win Badge */}
        {userWon && (
          <View style={styles.yourWinBadge}>
            <Icon name="star" size={20} color="#FFD700" />
            <Text style={styles.yourWinText}>
              You won {betData.winningsPerPerson} coins!
            </Text>
          </View>
        )}

        {/* Participants List */}
        {(hasVoted || isExpired || isCreator) &&
          option.participants?.length > 0 && (
            <View style={styles.participantsContainer}>
              <Text style={styles.participantsLabel}>Voted by:</Text>
              <View style={styles.participantsList}>
                {option.participants.map((participantId, index) => {
                  const isCurrentUser = participantId === session?.uid;
                  return (
                    <Text
                      key={participantId}
                      style={[
                        styles.participantName,
                        isCurrentUser && styles.currentUserVote,
                        isWinner && styles.winnerParticipant,
                      ]}
                    >
                      {isCurrentUser
                        ? 'You'
                        : betData.voterNames?.[participantId]}
                      {index < option.participants.length - 1 ? ', ' : ''}
                      {isWinner && '🏆'}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}

        {/* Vote Button - Only show if user hasn't voted at all */}
        {!hasVoted && !isExpired && !betData.winningOptionId && (
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => handleVote(option.id)}
          >
            <Text style={styles.voteButtonText}>Vote</Text>
          </TouchableOpacity>
        )}

        {/* Select Winner Button - Only show for creator when bet is locked */}
        {isCreator &&
          betData.status === 'locked' &&
          !betData.winningOptionId && (
            <TouchableOpacity
              style={styles.selectWinnerButton}
              onPress={() => setShowResultModal(true)}
            >
              <Icon name="trophy" size={20} color="#FFD700" />
              <Text style={styles.selectWinnerText}>Select Winner</Text>
            </TouchableOpacity>
          )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView style={sharedStyles.container}>
        <Header title="Bet Details" showBackButton={true} />

        <View style={styles.betInfo}>
          <View style={sharedStyles.groupHeader}>
            <Icon name="users" size={20} color={theme.colors.textLight} />
            <Text style={sharedStyles.groupName}>
              {betData.groupName || 'No Group'}
            </Text>
          </View>
          <Text style={styles.question}>{betData.question}</Text>
          <View style={styles.betMetaInfo}>
            <View
              style={[
                styles.statusBadge,
                betData.status === 'open' && styles.openBadge,
                betData.status === 'locked' && styles.lockedBadge,
                betData.status === 'completed' && styles.completedBadge,
              ]}
            >
              <Icon
                name={
                  betData.status === 'open'
                    ? 'unlock'
                    : betData.status === 'locked'
                      ? 'lock'
                      : 'check-circle'
                }
                size={16}
                color="white"
              />
              <Text style={styles.statusText}>
                {betData.status.charAt(0).toUpperCase() +
                  betData.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.wager}>Wager: {betData.wagerAmount} coins</Text>
            <Text style={styles.expires}>
              Expires: {new Date(betData.expiresAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.options}>
          {betData.answerOptions.map((option) => renderVotingOption(option))}
        </View>

        <View style={styles.reactionsContainer}>
          <Text style={styles.sectionTitle}>Reactions</Text>
          <View style={styles.reactions}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                style={[
                  styles.reactionButton,
                  userReactions[reaction] && styles.selectedReaction,
                ]}
                onPress={() => handleReaction(reaction)}
                disabled={submitting}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
                {betData.reactionCounts?.[reaction] > 0 && (
                  <Text style={styles.reactionCount}>
                    {betData.reactionCounts[reaction]}
                  </Text>
                )}
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
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              <Icon name="send" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentUser}>{comment.username}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal visible={showDeleteConfirm} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Bet?</Text>
              <Text style={styles.modalText}>
                This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={[styles.buttonText, { color: '#FF0000' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Select Winner Modal */}
        <Modal visible={showResultModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Winner</Text>
              <Text style={styles.modalText}>Choose the winning option:</Text>
              <ScrollView style={styles.modalScroll}>
                {betData?.answerOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modalOption,
                      selectedOption === option.id &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => setSelectedOption(option.id)}
                  >
                    <Text style={styles.modalOptionText}>{option.text}</Text>
                    <Text style={styles.modalVoteCount}>
                      {option.participants.length} votes
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowResultModal(false);
                    setSelectedOption(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    !selectedOption && styles.modalButtonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedOption) {
                      handleSelectWinner(selectedOption);
                    }
                  }}
                  disabled={!selectedOption}
                >
                  <Text style={styles.modalButtonText}>Confirm Winner</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {/* Creator Controls */}
      {session?.uid === betData.creatorId && (
        <View style={styles.creatorControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('EditBet', { betId: betId })}
            disabled={isExpired}
          >
            <Icon
              name="edit"
              size={20}
              color={isExpired ? theme.colors.textLight : theme.colors.primary}
            />
            <Text
              style={[styles.controlText, isExpired && styles.disabledText]}
            >
              Edit Bet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.deleteButton]}
            onPress={() => setShowDeleteConfirm(true)}
            disabled={isExpired}
          >
            <Icon
              name="trash"
              size={20}
              color={isExpired ? theme.colors.textLight : '#FF0000'}
            />
            <Text
              style={[
                styles.controlText,
                { color: isExpired ? theme.colors.textLight : '#FF0000' },
              ]}
            >
              Delete Bet
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  optionContainer: {
    backgroundColor: 'white',
    borderRadius: hp(1.5),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  votedOption: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  winnerOption: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: '#FFFDF7',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  optionText: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  voteCount: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  voteCountText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: hp(1.5),
    backgroundColor: '#E5E7EB',
    borderRadius: hp(0.75),
    overflow: 'hidden',
    marginBottom: hp(1.5),
  },
  progressBar: {
    height: '100%',
    borderRadius: hp(0.75),
  },
  participantsContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participantsLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantName: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginRight: wp(1),
  },
  currentUserVote: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  voteButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
    alignItems: 'center',
    marginTop: hp(1.5),
  },
  voteButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: hp(1.5),
    borderRadius: hp(1),
    marginTop: hp(1.5),
  },
  winnerText: {
    color: '#92400E',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  winningsText: {
    color: '#92400E',
    fontSize: hp(1.6),
    marginLeft: 'auto',
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
  sendButton: {
    padding: hp(1.5),
  },
  selectedReaction: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  reactionCount: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  creatorControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(2),
    backgroundColor: '#f8f8f8',
    padding: hp(1),
    borderRadius: theme.radius.lg,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1),
    borderRadius: theme.radius.lg,
    gap: wp(2),
  },
  controlText: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: hp(3),
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  modalText: {
    fontSize: hp(2),
    marginBottom: hp(2),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp(2),
  },
  modalButton: {
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    width: '40%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  winnerParticipant: {
    color: '#92400E',
    fontWeight: '600',
  },
  selectWinnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
    alignSelf: 'center',
    marginTop: hp(2),
    gap: wp(2),
  },
  selectWinnerText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  disabledText: {
    color: theme.colors.textLight,
  },
  crownContainer: {
    position: 'absolute',
    top: -12,
    right: wp(4),
    zIndex: 1,
  },
  winnerVoteCount: {
    backgroundColor: '#FFD700',
  },
  winnerVoteCountText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  yourWinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F6FF',
    padding: hp(1.5),
    borderRadius: hp(1),
    marginTop: hp(1),
  },
  yourWinText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
  betMetaInfo: {
    flexDirection: 'column',
    gap: hp(1),
    marginTop: hp(1),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    alignSelf: 'flex-start',
    gap: wp(2),
  },
  openBadge: {
    backgroundColor: theme.colors.primary,
  },
  lockedBadge: {
    backgroundColor: theme.colors.warning,
  },
  completedBadge: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: hp(40),
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: hp(1),
    marginBottom: hp(1),
  },
  modalOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  modalOptionText: {
    fontSize: hp(2),
    color: theme.colors.text,
    flex: 1,
  },
  modalVoteCount: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  modalCancelButton: {
    backgroundColor: theme.colors.gray,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
});

export default BetDetails;
