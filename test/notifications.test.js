const NotificationsService = require('../src/endpoints/notifications.cjs');
const { db } = require('../src/firebase/config');
const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} = require('firebase/firestore');

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../src/firebase/config', () => ({
  db: {},
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serverTimestamp.mockReturnValue(new Date('2024-01-01'));
  });

  describe('getNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user123',
          type: 'bet_expiring',
          title: 'Bet expires soon',
          message: 'Your bet will expire in 1 hour',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockQuerySnapshot = {
        docs: mockNotifications.map((notif) => ({
          id: notif.id,
          data: () => notif,
        })),
      };

      collection.mockReturnValue({});
      query.mockReturnValue({});
      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await NotificationsService.getNotifications('user123');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'notif1',
        type: 'bet_expiring',
        title: 'Bet expires soon',
      });
    });

    it('should filter notifications by type', async () => {
      collection.mockReturnValue({});
      query.mockReturnValue({});
      getDocs.mockResolvedValue({ docs: [] });

      await NotificationsService.getNotifications('user123', 'bet_expiring');
      expect(where).toHaveBeenCalledWith('type', '==', 'bet_expiring');
    });
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotificationData = {
        userId: 'user123',
        type: 'bet_expiring',
        title: 'Bet expires soon',
        message: 'Your bet will expire in 1 hour',
      };

      addDoc.mockResolvedValue({ id: 'notif1' });

      const result =
        await NotificationsService.createNotification(mockNotificationData);
      expect(result).toMatchObject({
        id: 'notif1',
        ...mockNotificationData,
        read: false,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      doc.mockReturnValue({});
      updateDoc.mockResolvedValue();

      const result = await NotificationsService.markAsRead('notif1');
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const mockNotifications = [
        { id: 'notif1', read: false },
        { id: 'notif2', read: false },
      ];

      collection.mockReturnValue({});
      query.mockReturnValue({});
      getDocs.mockResolvedValue({
        docs: mockNotifications.map((notif) => ({
          ref: { id: notif.id },
          data: () => notif,
        })),
      });
      updateDoc.mockResolvedValue();

      const result = await NotificationsService.markAllAsRead('user123');
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notifications count', async () => {
      collection.mockReturnValue({});
      query.mockReturnValue({});
      getDocs.mockResolvedValue({ size: 5 });

      const result = await NotificationsService.getUnreadCount('user123');
      expect(result).toBe(5);
      expect(where).toHaveBeenCalledWith('read', '==', false);
    });
  });

  describe('createBetExpirationNotification', () => {
    it('should create bet expiration notification', async () => {
      const mockNotificationData = {
        userId: 'user123',
        betId: 'bet123',
        betTitle: 'Test Bet',
        expiresIn: '1 hour',
      };

      addDoc.mockResolvedValue({ id: 'notif1' });

      const result = await NotificationsService.createBetExpirationNotification(
        mockNotificationData.userId,
        mockNotificationData.betId,
        mockNotificationData.betTitle,
        mockNotificationData.expiresIn,
      );

      expect(result).toMatchObject({
        type: 'bet_expiring',
        title: expect.stringContaining(mockNotificationData.betTitle),
      });
    });
  });

  describe('createNewBetNotification', () => {
    it('should create new bet notification', async () => {
      addDoc.mockResolvedValue({ id: 'notif1' });

      const result = await NotificationsService.createNewBetNotification(
        'user123',
        'bet123',
        'Creator',
        'Test Bet',
        'Test Group',
      );

      expect(result).toMatchObject({
        type: 'new_bet',
        title: expect.stringContaining('Test Bet'),
      });
    });
  });

  describe('createBetResultNotification', () => {
    it('should create bet result notification with winnings', async () => {
      addDoc.mockResolvedValue({ id: 'notif1' });

      const result = await NotificationsService.createBetResultNotification(
        'user123',
        'bet123',
        'Test Bet',
        'win',
        100,
      );

      expect(result).toMatchObject({
        type: 'bet_result',
        title: expect.stringContaining('Test Bet'),
        message: expect.stringContaining('100 coins'),
      });
    });

    it('should create bet result notification without winnings', async () => {
      addDoc.mockResolvedValue({ id: 'notif1' });

      const result = await NotificationsService.createBetResultNotification(
        'user123',
        'bet123',
        'Test Bet',
        'lose',
      );

      expect(result).toMatchObject({
        type: 'bet_result',
        title: expect.stringContaining('Test Bet'),
        message: 'The results are in!',
      });
    });
  });
});
