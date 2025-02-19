const BetsService = require('../src/endpoints/bets');
const { db } = require('../src/firebase/config');
const {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
} = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  increment: jest.fn((x) => x),
  arrayUnion: jest.fn((x) => x),
  arrayRemove: jest.fn((x) => x),
}));

jest.mock('../src/firebase/config', () => ({
  db: {},
}));

// Mock PointsService
jest.mock('../src/endpoints/points', () => ({
  deductPoints: jest.fn(),
  addPoints: jest.fn(),
}));

describe('BetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBet', () => {
    it('should create a new bet successfully', async () => {
      const mockBetData = {
        creatorId: 'user123',
        question: 'Test Bet',
        wagerAmount: 100,
        answerOptions: ['Option 1', 'Option 2'],
        expiresAt: '2024-12-31T23:59:59.999Z',
      };

      const mockBetRef = { id: 'bet123' };
      doc.mockReturnValue(mockBetRef);
      setDoc.mockResolvedValue();

      const result = await BetsService.createBet(mockBetData);

      expect(result).toMatchObject({
        id: 'bet123',
        creatorId: 'user123',
        question: 'Test Bet',
        wagerAmount: 100,
        status: 'open',
        totalPool: 0,
        winningOptionId: null,
      });
      expect(result.answerOptions).toHaveLength(2);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw error if less than 2 answer options', async () => {
      const mockBetData = {
        creatorId: 'user123',
        title: 'Test Bet',
        description: 'Test Description',
        stake: 100,
        answerOptions: ['Single Option'],
        expiresAt: '2024-12-31T23:59:59.999Z',
      };

      await expect(BetsService.createBet(mockBetData)).rejects.toThrow(
        'Bet must have at least 2 answer options',
      );
    });
  });

  describe('getBet', () => {
    it('should get a bet by ID', async () => {
      const mockBetData = {
        id: 'bet123',
        title: 'Test Bet',
        status: 'pending',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      const result = await BetsService.getBet('bet123');

      expect(result).toEqual(mockBetData);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should throw error if bet not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(BetsService.getBet('nonexistent')).rejects.toThrow(
        'Bet not found',
      );
    });
  });

  describe('getUserBets', () => {
    it('should get all user bets', async () => {
      const mockBets = [
        { id: 'bet1', title: 'Bet 1' },
        { id: 'bet2', title: 'Bet 2' },
      ];

      getDocs.mockResolvedValue({
        docs: mockBets.map((bet) => ({
          data: () => bet,
        })),
      });

      const result = await BetsService.getUserBets('user123');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Bet 1');
      expect(getDocs).toHaveBeenCalled();
    });

    it('should get user bets filtered by status', async () => {
      const mockBets = [{ id: 'bet1', title: 'Bet 1', status: 'pending' }];

      getDocs.mockResolvedValue({
        docs: mockBets.map((bet) => ({
          data: () => bet,
        })),
      });

      const result = await BetsService.getUserBets('user123', 'pending');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
    });
  });

  describe('updateBet', () => {
    it('should update a bet successfully', async () => {
      const mockBetData = {
        id: 'bet123',
        title: 'Updated Bet',
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockBetData,
        });

      const result = await BetsService.updateBet('bet123', {
        title: 'Updated Bet',
      });

      expect(result.title).toBe('Updated Bet');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if bet not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(BetsService.updateBet('nonexistent', {})).rejects.toThrow(
        'Bet not found',
      );
    });
  });

  describe('placeBet', () => {
    it('should place a bet successfully', async () => {
      const mockBetData = {
        id: 'bet123',
        status: 'open',
        stake: 100,
        answerOptions: [
          { id: 'option_1', text: 'Option 1', participants: [] },
          { id: 'option_2', text: 'Option 2', participants: [] },
        ],
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockBetData,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ...mockBetData,
            answerOptions: [
              { id: 'option_1', text: 'Option 1', participants: ['user123'] },
              { id: 'option_2', text: 'Option 2', participants: [] },
            ],
            totalPool: 100,
          }),
        });

      const pointsService = require('../src/endpoints/points');
      pointsService.deductPoints.mockResolvedValue();

      const result = await BetsService.placeBet(
        'bet123',
        'user123',
        'option_1',
      );

      expect(updateDoc).toHaveBeenCalled();
      expect(pointsService.deductPoints).toHaveBeenCalledWith(
        'user123',
        100,
        expect.any(String),
      );
      expect(result.totalPool).toBe(100);
      expect(result.answerOptions[0].participants).toContain('user123');
    });

    it('should throw error if bet is expired', async () => {
      const mockBetData = {
        status: 'open',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      await expect(
        BetsService.placeBet('bet123', 'user123', 'option_1'),
      ).rejects.toThrow('Bet has expired');
    });

    it('should throw error if user already placed a bet', async () => {
      const mockBetData = {
        status: 'open',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        answerOptions: [
          { id: 'option_1', text: 'Option 1', participants: ['user123'] },
          { id: 'option_2', text: 'Option 2', participants: [] },
        ],
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      await expect(
        BetsService.placeBet('bet123', 'user123', 'option_2'),
      ).rejects.toThrow('User has already placed a bet');
    });
  });

  describe('releaseResult', () => {
    it('should release result and distribute winnings', async () => {
      const mockBetData = {
        id: 'bet123',
        creatorId: 'creator123',
        status: 'locked',
        title: 'Test Bet',
        totalPool: 300,
        answerOptions: [
          {
            id: 'option_1',
            text: 'Option 1',
            participants: ['user1', 'user2', 'user3'],
          },
          { id: 'option_2', text: 'Option 2', participants: [] },
        ],
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockBetData,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ...mockBetData,
            status: 'completed',
            winningOptionId: 'option_1',
            resultReleasedAt: expect.any(String),
          }),
        });

      const pointsService = require('../src/endpoints/points');
      pointsService.addPoints.mockResolvedValue();

      const result = await BetsService.releaseResult(
        'bet123',
        'creator123',
        'option_1',
      );

      expect(updateDoc).toHaveBeenCalled();
      expect(pointsService.addPoints).toHaveBeenCalledTimes(3); // One call for each winner
      expect(result.status).toBe('completed');
      expect(result.winningOptionId).toBe('option_1');
    });

    it('should throw error if not bet creator', async () => {
      const mockBetData = {
        creatorId: 'creator123',
        status: 'locked',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      await expect(
        BetsService.releaseResult('bet123', 'other123', 'option_1'),
      ).rejects.toThrow('Only the bet creator can release results');
    });

    it('should throw error if bet not locked', async () => {
      const mockBetData = {
        creatorId: 'creator123',
        status: 'open',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      await expect(
        BetsService.releaseResult('bet123', 'creator123', 'option_1'),
      ).rejects.toThrow('Bet must be locked before releasing results');
    });
  });

  describe('getBetResults', () => {
    it('should get bet results successfully', async () => {
      const mockBetData = {
        id: 'bet123',
        title: 'Test Bet',
        status: 'completed',
        totalPool: 300,
        winningOptionId: 'option_1',
        resultReleasedAt: '2024-01-01T00:00:00.000Z',
        answerOptions: [
          {
            id: 'option_1',
            text: 'Option 1',
            participants: ['user1', 'user2', 'user3'],
          },
          { id: 'option_2', text: 'Option 2', participants: [] },
        ],
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      const result = await BetsService.getBetResults('bet123');

      expect(result).toMatchObject({
        betId: 'bet123',
        title: 'Test Bet',
        totalPool: 300,
        winningOption: {
          id: 'option_1',
          text: 'Option 1',
          winners: ['user1', 'user2', 'user3'],
          winningsPerPerson: 100,
        },
      });
    });

    it('should throw error if results not available', async () => {
      const mockBetData = {
        status: 'locked',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      await expect(BetsService.getBetResults('bet123')).rejects.toThrow(
        'Results not yet available',
      );
    });
  });

  describe('getBetStats', () => {
    it('should get bet statistics successfully', async () => {
      const mockBetData = {
        id: 'bet123',
        title: 'Test Bet',
        totalPool: 500,
        answerOptions: [
          {
            id: 'option_1',
            text: 'Option 1',
            participants: ['user1', 'user2'],
          },
          {
            id: 'option_2',
            text: 'Option 2',
            participants: ['user3', 'user4', 'user5'],
          },
        ],
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBetData,
      });

      const result = await BetsService.getBetStats('bet123');

      expect(result).toMatchObject({
        betId: 'bet123',
        title: 'Test Bet',
        totalPool: 500,
        totalParticipants: 5,
        optionStats: expect.arrayContaining([
          expect.objectContaining({
            id: 'option_1',
            participantCount: 2,
            percentage: 40,
          }),
          expect.objectContaining({
            id: 'option_2',
            participantCount: 3,
            percentage: 60,
          }),
        ]),
      });
    });
  });
});
