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
  RefreshControl,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import BetsService from '../../src/endpoints/bets.cjs';
import AuthService from '../../src/endpoints/auth.cjs';
import GroupsService from '../../src/endpoints/groups.cjs';
import Button from '../../components/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import { createSharedStyles } from '../styles/shared';
import NotificationsService from '../../src/endpoints/notifications.cjs';
import Avatar from '../../components/Avatar';
import UserProfileModal from '../../components/UserProfileModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase/config';

const sharedStyles = createSharedStyles(theme);

const BetDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { betId, fromNewBet, fromBottomNav } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [reactionPopupPosition, setReactionPopupPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    loadData();
    checkExpiredBet();
  }, [betId]);

  useEffect(() => {
    if (fromNewBet) {
      navigation.setOptions({
        gestureEnabled: false,
        headerLeft: null,
      });
    }
  }, [fromNewBet, navigation]);

  useEffect(() => {
    const backHandler = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        handleBackPress();
      }
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Add refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        await loadData();
        await checkExpiredBet();
      };
      refresh();
    }, [betId]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
      await checkExpiredBet();
    } finally {
      setRefreshing(false);
    }
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

      console.log('Loaded bet details:', {
        id: betDetails.id,
        status: betDetails.status,
        winningOptionId: betDetails.winningOptionId,
        resultReleasedAt: betDetails.resultReleasedAt,
      });

      // If bet has a winning option but status is still locked, update it to completed
      if (betDetails.winningOptionId && betDetails.status === 'locked') {
        console.log('Fixing inconsistent bet status: updating to completed');
        await BetsService.updateBet(betId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
        betDetails.status = 'completed';
      }

      // Fetch usernames for all participants
      const voterNames = {};
      const userPromises = betDetails.answerOptions.flatMap((option) =>
        option.participants.map(async (participantId) => {
          const userDocRef = doc(db, 'users', participantId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            voterNames[participantId] = userData.username || 'Unknown User';
          } else {
            voterNames[participantId] = 'Unknown User';
          }
        }),
      );
      await Promise.all(userPromises);
      betDetails.voterNames = voterNames;

      // Check if bet is expired and lock it if needed
      const now = new Date();
      const expiryDate = new Date(betDetails.expiresAt);
      if (betDetails.status === 'open' && expiryDate <= now) {
        console.log('Locking expired bet');
        await BetsService.lockBet(betId);
        betDetails.status = 'locked';
      }

      // If bet has a group, fetch group name
      if (betDetails.groupId) {
        const groupName = await GroupsService.getGroupName(betDetails.groupId);
        betDetails.groupName = groupName;
      }

      // Process reactions
      const reactionCounts = {};
      const userReactionMap = {};

      if (betDetails.reactions) {
        betDetails.reactions.forEach((reaction) => {
          if (!reactionCounts[reaction.reaction]) {
            reactionCounts[reaction.reaction] = 0;
          }
          reactionCounts[reaction.reaction]++;

          if (reaction.userId === sessionData.uid) {
            userReactionMap[reaction.reaction] = true;
          }
        });
      }

      betDetails.reactionCounts = reactionCounts;
      setUserReactions(userReactionMap);

      console.log('Setting bet data with status:', betDetails.status);
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

    // Show confirmation alert
    Alert.alert(
      'Confirm Vote',
      'Are you sure? You cannot change your vote after submitting.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
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
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      setCommentError(null);
      await BetsService.addComment(
        betData.groupId,
        betId,
        session.uid,
        newComment.trim(),
      );
      setNewComment('');
      // Reload comments
      const betComments = await BetsService.getBetComments(betId);
      setComments(betComments);
    } catch (error) {
      setCommentError(error.message || 'Failed to add comment');
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
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
      Alert.alert('Success', 'Bet deleted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main'),
        },
      ]);
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

      if (winnersCount === 0) {
        throw new Error('No participants in the winning option');
      }

      const winningsPerPerson = Math.floor(totalPool / winnersCount);

      // Release result and distribute coins
      const result = await BetsService.releaseResult(
        betId,
        session.uid,
        optionId,
        winningsPerPerson,
      );

      if (!result.success) {
        throw new Error('Failed to distribute winnings');
      }

      // Send notifications to all participants
      const notificationPromises = betData.answerOptions.flatMap((option) =>
        option.participants.map(async (participantId) => {
          const isWinner = option.id === optionId;
          return NotificationsService.createNotification({
            userId: participantId,
            type: 'bet_result',
            title: `Results for "${betData.question}"`,
            message: isWinner
              ? `Congratulations! You won ${winningsPerPerson} coins!`
              : 'Better luck next time!',
            data: {
              betId,
              result: isWinner ? 'won' : 'lost',
              winnings: isWinner ? winningsPerPerson : 0,
            },
          });
        }),
      );

      await Promise.all(notificationPromises);

      // Update local state immediately
      setBetData((prevData) => ({
        ...prevData,
        status: 'completed',
        winningOptionId: optionId,
        winningsPerPerson,
      }));

      // Close modal and show success message
      setShowResultModal(false);
      Alert.alert(
        'Success',
        `Winner selected! ${winningsPerPerson} coins distributed to each winner.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Refresh data after a short delay to ensure backend update is complete
              setTimeout(async () => {
                await loadData();
              }, 500);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error selecting winner:', error);
      Alert.alert('Error', error.message || 'Failed to select winner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarPress = (userId) => {
    if (userId === session?.uid) return; // Don't show modal for current user
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleCommentLongPress = (comment, event) => {
    const { pageY, pageX } = event.nativeEvent;
    setSelectedComment(comment);
    setReactionPopupPosition({ x: pageX, y: pageY });
    setShowReactionPopup(true);
  };

  const handleCommentReaction = async (reaction) => {
    if (!selectedComment) return;

    try {
      setSubmitting(true);
      await BetsService.toggleCommentReaction(
        betData.groupId,
        betId,
        selectedComment.id,
        session.uid,
        reaction,
      );

      // Refresh comments
      const updatedComments = await BetsService.getBetComments(betId);
      setComments(updatedComments);

      // Close popup
      setShowReactionPopup(false);
      setSelectedComment(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add reaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackPress = () => {
    if (route.params?.fromGroup) {
      // If we came from a group, go back to GroupBets
      navigation.navigate('GroupBets', {
        groupId: route.params.groupId,
        refresh: Date.now(),
      });
    } else if (route.params?.fromBottomNav) {
      // If we came from bottom nav, go back to Home
      navigation.navigate('Main', {
        screen: 'Home',
        params: { refresh: Date.now() },
      });
    } else {
      // Default back behavior
      navigation.goBack();
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
            <Icon name="star" size={24} color="#FFD700" />
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
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
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

        {/* Vote Button - Only show if user hasn't voted at all */}
        {!hasPlacedBet && !isExpired && !betData.winningOptionId && (
          <View style={styles.actionButtonsContainer}>
            <Text style={styles.actionTitle}>Cast Your Vote</Text>
            {betData.answerOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.voteButton}
                onPress={() => handleVote(option.id)}
              >
                <Text style={styles.voteButtonText}>{option.text}</Text>
                <Text style={styles.voteCount}>
                  {option.participants?.length || 0} votes
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Select Winner Button - Only show for creator when bet is locked */}
        {session?.uid === betData.creatorId &&
          betData.status === 'locked' &&
          !betData.winningOptionId && (
            <View style={styles.actionButtonsContainer}>
              <Text style={styles.actionTitle}>Select Winner</Text>
              {betData.answerOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.selectWinnerButton,
                    selectedOption === option.id && styles.selectedWinnerButton,
                  ]}
                  onPress={() => {
                    setSelectedOption(option.id);
                    handleSelectWinner(option.id);
                  }}
                >
                  <Text style={styles.selectWinnerText}>{option.text}</Text>
                  <Text style={styles.voteCount}>
                    {option.participants?.length || 0} votes
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              multiline
              editable={!commentLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                commentLoading && styles.disabledButton,
              ]}
              onPress={handleAddComment}
              disabled={commentLoading || !newComment.trim()}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Icon name="send" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {commentError && <Text style={styles.errorText}>{commentError}</Text>}

          <View style={styles.commentsList}>
            {comments.length === 0 ? (
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            ) : (
              comments.map((comment) => {
                const isCurrentUser = comment.userId === session?.uid;
                return (
                  <TouchableOpacity
                    key={comment.id}
                    onLongPress={(event) =>
                      handleCommentLongPress(comment, event)
                    }
                    delayLongPress={500}
                  >
                    <View
                      style={[
                        styles.comment,
                        isCurrentUser && styles.currentUserComment,
                      ]}
                    >
                      <View style={styles.commentHeader}>
                        <View style={styles.userInfo}>
                          <TouchableOpacity
                            onPress={() => handleAvatarPress(comment.userId)}
                          >
                            <Avatar
                              uri={comment.profilePicture}
                              size={hp(3)}
                              rounded={theme.radius.xl}
                            />
                          </TouchableOpacity>
                          <Text
                            style={[
                              styles.commentUser,
                              isCurrentUser && styles.currentUserText,
                            ]}
                          >
                            {isCurrentUser
                              ? 'You'
                              : comment.username || 'Loading...'}
                          </Text>
                          {comment.username === 'Unknown User' && (
                            <ActivityIndicator
                              size="small"
                              color={theme.colors.primary}
                              style={styles.loadingIndicator}
                            />
                          )}
                        </View>
                        <Text style={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      {comment.reactions &&
                        Object.keys(comment.reactions).length > 0 && (
                          <View style={styles.commentReactions}>
                            {Object.entries(comment.reactions).map(
                              ([reaction, users]) => (
                                <View
                                  key={reaction}
                                  style={styles.commentReaction}
                                >
                                  <Text style={styles.reactionEmoji}>
                                    {reaction}
                                  </Text>
                                  <Text style={styles.reactionCount}>
                                    {users.length}
                                  </Text>
                                </View>
                              ),
                            )}
                          </View>
                        )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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

        {/* Add Reaction Popup Modal */}
        <Modal
          visible={showReactionPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReactionPopup(false)}
        >
          <TouchableOpacity
            style={styles.reactionPopupOverlay}
            activeOpacity={1}
            onPress={() => setShowReactionPopup(false)}
          >
            <View
              style={[
                styles.reactionPopup,
                {
                  top: reactionPopupPosition.y - 60,
                  left: reactionPopupPosition.x - 100,
                },
              ]}
            >
              {reactions.map((reaction) => (
                <TouchableOpacity
                  key={reaction}
                  style={styles.reactionPopupOption}
                  onPress={() => handleCommentReaction(reaction)}
                  disabled={submitting}
                >
                  <Text style={styles.reactionPopupEmoji}>{reaction}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
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
      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
      />
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
    color: theme.colors.white,
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
    color: theme.colors.white,
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
    marginBottom: 0,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: hp(1),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  selectedWinnerButton: {
    backgroundColor: '#FFD700',
  },
  selectWinnerText: {
    color: '#92400E',
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
    backgroundColor: theme.colors.dark,
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
  actionButtonsContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: 'white',
    borderRadius: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: hp(2),
    color: theme.colors.text,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: hp(1.6),
    marginTop: hp(1),
    textAlign: 'center',
  },
  noCommentsText: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: hp(2),
    fontStyle: 'italic',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  currentUserComment: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  currentUserText: {
    color: theme.colors.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  loadingIndicator: {
    marginLeft: wp(1),
  },
  commentReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  commentReaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reactionPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reactionPopup: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: hp(2),
    padding: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  reactionPopupOption: {
    padding: hp(1),
  },
  reactionPopupEmoji: {
    fontSize: hp(2.5),
  },
});

export default BetDetails;
