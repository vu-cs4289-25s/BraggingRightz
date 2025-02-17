const PointsService = require('../src/endpoints/points');
const { db } = require('../src/firebase/config');
const {
  doc,
  setDoc,
  getDoc,
  collection,
  updateDoc,
  increment,
} = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((x) => x),
}));

jest.mock('../src/firebase/config', () => ({
  db: {},
}));

describe('PointsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePoints', () => {
    it('should initialize points for new user', async () => {
      const mockPointsRef = { id: 'points123' };
      doc.mockReturnValue(mockPointsRef);
      setDoc.mockResolvedValue();

      const result = await PointsService.initializePoints('user123');

      expect(result).toMatchObject({
        userId: 'user123',
        balance: 1000,
        totalEarned: 0,
        totalSpent: 0,
      });
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('getPoints', () => {
    it('should get existing points', async () => {
      const mockPointsData = {
        userId: 'user123',
        balance: 500,
        totalEarned: 1000,
        totalSpent: 500,
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockPointsData,
      });

      const result = await PointsService.getPoints('user123');

      expect(result).toEqual(mockPointsData);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should initialize points if not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const mockPointsRef = { id: 'points123' };
      doc.mockReturnValue(mockPointsRef);
      setDoc.mockResolvedValue();

      const result = await PointsService.getPoints('user123');

      expect(result.balance).toBe(1000);
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      const mockPointsData = {
        userId: 'user123',
        balance: 1500,
        totalEarned: 1500,
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockPointsData,
      });

      const result = await PointsService.addPoints('user123', 500, 'Bet win');

      expect(result).toEqual(mockPointsData);
      expect(updateDoc).toHaveBeenCalled();
      expect(increment).toHaveBeenCalledWith(500);
    });

    it('should throw error if amount is not positive', async () => {
      await expect(PointsService.addPoints('user123', 0)).rejects.toThrow(
        'Amount must be positive',
      );
      await expect(PointsService.addPoints('user123', -100)).rejects.toThrow(
        'Amount must be positive',
      );
    });
  });

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      const mockPointsData = {
        userId: 'user123',
        balance: 500,
        totalSpent: 500,
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ balance: 1000 }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPointsData,
        });

      const result = await PointsService.deductPoints(
        'user123',
        500,
        'Bet stake',
      );

      expect(result).toEqual(mockPointsData);
      expect(updateDoc).toHaveBeenCalled();
      expect(increment).toHaveBeenCalledWith(-500);
    });

    it('should throw error if insufficient points', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ balance: 100 }),
      });

      await expect(PointsService.deductPoints('user123', 500)).rejects.toThrow(
        'Insufficient points',
      );
    });

    it('should throw error if amount is not positive', async () => {
      await expect(PointsService.deductPoints('user123', 0)).rejects.toThrow(
        'Amount must be positive',
      );
      await expect(PointsService.deductPoints('user123', -100)).rejects.toThrow(
        'Amount must be positive',
      );
    });

    it('should throw error if points record not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(PointsService.deductPoints('user123', 500)).rejects.toThrow(
        'Points record not found',
      );
    });
  });

  describe('transferPoints', () => {
    it('should transfer points successfully', async () => {
      // Mock sender's points
      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ balance: 1000 }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ balance: 500 }),
        });

      // Mock receiver's points
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ balance: 1500 }),
      });

      const result = await PointsService.transferPoints(
        'sender123',
        'receiver123',
        500,
        'Bet payment',
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should throw error if transferring to self', async () => {
      await expect(
        PointsService.transferPoints('user123', 'user123', 500),
      ).rejects.toThrow('Cannot transfer points to self');
    });

    it('should throw error if amount is not positive', async () => {
      await expect(
        PointsService.transferPoints('sender123', 'receiver123', 0),
      ).rejects.toThrow('Amount must be positive');
      await expect(
        PointsService.transferPoints('sender123', 'receiver123', -100),
      ).rejects.toThrow('Amount must be positive');
    });
  });

  describe('_logTransaction', () => {
    it('should log transaction successfully', async () => {
      const mockTransactionRef = { id: 'transaction123' };
      doc.mockReturnValue(mockTransactionRef);
      setDoc.mockResolvedValue();

      const result = await PointsService._logTransaction(
        'user123',
        'credit',
        500,
        'Test transaction',
      );

      expect(result).toMatchObject({
        id: 'transaction123',
        userId: 'user123',
        type: 'credit',
        amount: 500,
        reason: 'Test transaction',
      });
      expect(setDoc).toHaveBeenCalled();
    });
  });
});
