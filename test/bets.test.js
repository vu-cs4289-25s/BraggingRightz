const BetsService = require('../src/endpoints/bets');
const { db } = require('../src/firebase/config');
const {
  doc,
  addDoc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  increment: jest.fn((x) => x),
  arrayUnion: jest.fn((x) => x),
  arrayRemove: jest.fn((x) => x),
  serverTimestamp: jest.fn(() => new Date('2024-01-01').toISOString()),
}));

jest.mock('../src/firebase/config', () => ({
  db: {},
}));

describe('BetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() to return a fixed timestamp
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date('2024-01-01').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createBet', () => {
    it('should create a bet successfully', async () => {
      const mockBetData = {
        creatorId: 'user123',
        question: 'Test Bet Question',
        wagerAmount: 100,
        answerOptions: ['Option 1', 'Option 2'],
        expiresAt: new Date('3000-12-31').toISOString(),
      };

      const mockBetRef = { id: 'bet123' };
      doc.mockReturnValue(mockBetRef);
      setDoc.mockResolvedValue();

      const result = await BetsService.createBet(mockBetData);

      expect(result).toMatchObject({
        id: 'bet123',
        question: 'Test Bet Question',
        creatorId: 'user123',
        wagerAmount: 100,
        status: 'open',
        answerOptions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            text: 'Option 1',
            participants: [],
            totalWager: 0,
          }),
          expect.objectContaining({
            id: expect.any(String),
            text: 'Option 2',
            participants: [],
            totalWager: 0,
          }),
        ]),
      });

      expect(setDoc).toHaveBeenCalledWith(
        mockBetRef,
        expect.objectContaining({
          id: 'bet123',
          question: 'Test Bet Question',
          creatorId: 'user123',
          wagerAmount: 100,
          status: 'open',
          answerOptions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              text: 'Option 1',
              participants: [],
              totalWager: 0,
            }),
            expect.objectContaining({
              id: expect.any(String),
              text: 'Option 2',
              participants: [],
              totalWager: 0,
            }),
          ]),
        }),
      );
    });

    it('should throw error if wager amount is invalid', async () => {
      const mockBetData = {
        creatorId: 'user123',
        question: 'Test Bet',
        wagerAmount: -100,
        answerOptions: ['Option 1', 'Option 2'],
        expiresAt: new Date('3000-12-31').toISOString(),
      };

      await expect(BetsService.createBet(mockBetData)).rejects.toThrow(
        'Wager amount must be a positive number',
      );
    });

    it('should throw error if expiry date is in the past', async () => {
      const mockBetData = {
        creatorId: 'user123',
        question: 'Test Bet',
        wagerAmount: 100,
        answerOptions: ['Option 1', 'Option 2'],
        expiresAt: new Date('2023-01-01').toISOString(),
      };

      await expect(BetsService.createBet(mockBetData)).rejects.toThrow(
        'Expires at must be a future date',
      );
    });

    it('should throw error if less than 2 answer options', async () => {
      const mockBetData = {
        creatorId: 'user123',
        question: 'Test Bet',
        wagerAmount: 100,
        answerOptions: ['Single Option'],
        expiresAt: new Date('2024-12-31').toISOString(),
      };

      await expect(BetsService.createBet(mockBetData)).rejects.toThrow(
        'Bet must have at least 2 answer options',
      );
    });
  });

  describe('getBet', () => {
    // it('should get a bet by ID', async () => {
    //   const mockBetData = {
    //     id: 'bet123',
    //     question: 'Test Bet Question',
    //     status: 'pending',
    //   };

    //   getDoc.mockResolvedValue({
    //     exists: () => true,
    //     data: () => mockBetData,
    //   });

    //   const result = await BetsService.getBet('bet123');

    //   expect(result).toEqual(mockBetData);
    //   expect(getDoc).toHaveBeenCalled();
    // });

    it('should throw error if bet not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(BetsService.getBet('nonexistent')).rejects.toThrow(
        'Bet not found',
      );
    });
  });

  // describe('getUserBets', () => {
  //   it('should get all user bets', async () => {
  //     const mockBets = [
  //       { id: 'bet1', title: 'Bet 1' },
  //       { id: 'bet2', title: 'Bet 2' },
  //     ];

  //     getDocs.mockResolvedValue({
  //       docs: mockBets.map((bet) => ({
  //         data: () => bet,
  //       })),
  //     });

  //     const result = await BetsService.getUserBets('user123');

  //     expect(result).toHaveLength(2);
  //     expect(result[0].title).toBe('Bet 1');
  //     expect(getDocs).toHaveBeenCalled();
  //   });

  //   it('should get user bets filtered by status', async () => {
  //     const mockBets = [{ id: 'bet1', title: 'Bet 1', status: 'pending' }];

  //     getDocs.mockResolvedValue({
  //       docs: mockBets.map((bet) => ({
  //         data: () => bet,
  //       })),
  //     });

  //     const result = await BetsService.getUserBets('user123', 'pending');

  //     expect(result).toHaveLength(1);
  //     expect(result[0].status).toBe('pending');
  //     expect(where).toHaveBeenCalledWith('status', '==', 'pending');
  //   });
  // });

  describe('updateBet', () => {
    it('should update a bet successfully', async () => {
      const mockBetData = {
        id: 'bet123',
        question: 'Updated Bet Question',
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
        question: 'Updated Bet Question',
      });

      expect(result.question).toBe('Updated Bet Question');
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
      const mockBetRef = doc(db, 'bets', 'bet123');

      // Mock the bet document with proper status and data
      const mockBetDoc = {
        exists: () => true,
        data: () => ({
          status: 'open',
          wagerAmount: 100,
          expiresAt: new Date('3000-12-31T23:59:59.999Z').toISOString(),
          answerOptions: [
            { id: 'option_1', participants: [] },
            { id: 'option_2', participants: [] },
          ],
          participants: [],
        }),
      };

      getDoc.mockImplementation((ref) => {
        if (ref === mockBetRef) return Promise.resolve(mockBetDoc);
        return Promise.resolve({ exists: () => false });
      });

      updateDoc.mockResolvedValue();

      const result = await BetsService.placeBet(
        'bet123',
        'user123',
        'option_1',
      );

      expect(result).toEqual({
        success: true,
        message: 'Bet placed successfully',
      });
    });

    //   it('should throw error if user has insufficient points', async () => {
    //     const mockBetRef = doc(db, 'bets', 'bet123');
    //     const mockPointsRef = doc(db, 'points', 'user123');

    //     // Mock the bet document with proper status
    //     const mockBetDoc = {
    //       exists: () => true,
    //       data: () => ({
    //         status: 'open',
    //         wagerAmount: 1000,
    //         expiresAt: new Date('3000-12-31T23:59:59.999Z').toISOString(),
    //         answerOptions: [
    //           { id: 'option_1', participants: [] },
    //           { id: 'option_2', participants: [] }
    //         ],
    //         participants: []
    //       })
    //     };

    //     // Mock points document with insufficient balance (0 points)
    //     const mockPointsDoc = {
    //       exists: () => true,
    //       data: () => ({ balance: 0 })
    //     };

    //     // Update mock implementation to properly handle both documents
    //     getDoc.mockImplementation((ref) => {
    //       if (ref === mockBetRef) return Promise.resolve(mockBetDoc);
    //       if (ref === mockPointsRef) return Promise.resolve(mockPointsDoc);
    //       return Promise.resolve({ exists: () => false });
    //     });

    //     await expect(
    //       BetsService.placeBet('bet123', 'user123', 'option_1')
    //     ).rejects.toThrow('Insufficient points balance');

    //     // Verify that updateDoc was not called since we don't have enough points
    //     expect(updateDoc).not.toHaveBeenCalled();
    //   });
  });

  // describe('releaseResult', () => {
  //   it('should release result and distribute winnings correctly', async () => {
  //     const mockBetData = {
  //       id: 'bet123',
  //       creatorId: 'creator123',
  //       status: 'locked',
  //       question: 'Test Bet',
  //       totalPool: 300,
  //       answerOptions: [
  //         {
  //           id: 'option_1',
  //           text: 'Option 1',
  //           participants: ['user1', 'user2', 'user3'],
  //         },
  //         { id: 'option_2', text: 'Option 2', participants: [] },
  //       ],
  //     };

  //     getDoc.mockResolvedValue({
  //       exists: () => true,
  //       data: () => mockBetData,
  //     });

  //     const result = await BetsService.releaseResult(
  //       'bet123',
  //       'creator123',
  //       'option_1',
  //     );

  //     expect(result).toMatchObject({
  //       success: true,
  //       message: 'Results released and points distributed',
  //     });

  //     // Verify points distribution
  //     expect(updateDoc).toHaveBeenCalledWith(
  //       expect.anything(),
  //       expect.objectContaining({
  //         status: 'completed',
  //         winningOptionId: 'option_1',
  //         resultReleasedAt: expect.any(String),
  //         winningsPerPerson: 100, // 300 total / 3 winners
  //       }),
  //     );
  //   });
  // });

  // describe('getBetResults', () => {
  //   it('should get bet results successfully', async () => {
  //     const mockBetData = {
  //       id: 'bet123',
  //       question: 'Test Bet Question',
  //       status: 'completed',
  //       totalPool: 300,
  //       winningOptionId: 'option_1',
  //       resultReleasedAt: '2024-01-01T00:00:00.000Z',
  //       answerOptions: [
  //         {
  //           id: 'option_1',
  //           text: 'Option 1',
  //           participants: ['user1', 'user2', 'user3'],
  //         },
  //         { id: 'option_2', text: 'Option 2', participants: [] },
  //       ],
  //     };

  //     getDoc.mockResolvedValue({
  //       exists: () => true,
  //       data: () => mockBetData,
  //     });

  //     const result = await BetsService.getBetResults('bet123');

  //     expect(result).toMatchObject({
  //       betId: 'bet123',
  //       question: 'Test Bet Question',
  //       totalPool: 300,
  //       winningOption: {
  //         id: 'option_1',
  //         text: 'Option 1',
  //         winners: ['user1', 'user2', 'user3'],
  //         winningsPerPerson: 100,
  //       },
  //     });
  //   });

  //   it('should throw error if results not available', async () => {
  //     const mockBetData = {
  //       status: 'locked',
  //     };

  //     getDoc.mockResolvedValue({
  //       exists: () => true,
  //       data: () => mockBetData,
  //     });

  //     await expect(BetsService.getBetResults('bet123')).rejects.toThrow(
  //       'Results not yet available',
  //     );
  //   });
  // });

  // describe('getBetStats', () => {
  //   it('should get bet statistics successfully', async () => {
  //     const mockBetData = {
  //       id: 'bet123',
  //       question: 'Test Bet',
  //       totalPool: 500,
  //       answerOptions: [
  //         {
  //           id: 'option_1',
  //           text: 'Option 1',
  //           participants: ['user1', 'user2'],
  //         },
  //         {
  //           id: 'option_2',
  //           text: 'Option 2',
  //           participants: ['user3', 'user4', 'user5'],
  //         },
  //       ],
  //     };

  //     getDoc.mockResolvedValue({
  //       exists: () => true,
  //       data: () => mockBetData,
  //     });

  //     const result = await BetsService.getBetStats('bet123');

  //     expect(result).toMatchObject({
  //       betId: 'bet123',
  //       question: 'Test Bet',
  //       totalPool: 500,
  //       totalParticipants: 5,
  //       optionStats: expect.arrayContaining([
  //         expect.objectContaining({
  //           id: 'option_1',
  //           participantCount: 2,
  //           percentage: 40,
  //         }),
  //         expect.objectContaining({
  //           id: 'option_2',
  //           participantCount: 3,
  //           percentage: 60,
  //         }),
  //       ]),
  //     });
  //   });
  // });

  describe('getBetComments', () => {
    // it('should get bet comments successfully', async () => {
    //   const mockComments = [
    //     {
    //       id: 'comment1',
    //       betId: 'bet123',
    //       userId: 'user1',
    //       content: 'Great bet!',
    //       createdAt: new Date('2024-01-01').toISOString(),
    //     },
    //   ];
    //   // Mock Firestore query chain
    //   collection.mockReturnValue({});
    //   query.mockReturnValue({});
    //   where.mockReturnValue({});
    //   orderBy.mockReturnValue({});
    //   getDocs.mockResolvedValue({
    //     docs: mockComments.map((comment) => ({
    //       id: comment.id,
    //       data: () => comment,
    //     })),
    //   });
    //   const result = await BetsService.getBetComments('bet123');
    //   expect(result).toHaveLength(1);
    //   expect(result[0]).toMatchObject(mockComments[0]);
    //   expect(collection).toHaveBeenCalled();
    //   expect(query).toHaveBeenCalled();
    //   expect(where).toHaveBeenCalledWith('betId', '==', 'bet123');
    //   expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    // });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      const mockUserData = {
        username: 'testuser',
        profilePicture: 'profile.jpg',
      };

      const mockBetData = {
        creatorId: 'creator123',
        question: 'Test bet',
      };

      const mockCommentRef = { id: 'comment1' };
      const mockTimestamp = new Date('2024-01-01').toISOString();

      // Mock document references and collections
      const mockUserRef = { toString: () => 'users/user123' };
      const mockBetRef = { toString: () => 'bets/bet123' };

      doc.mockImplementation((db, collection, id) => {
        if (collection === 'users') return mockUserRef;
        if (collection === 'bets') return mockBetRef;
        return {};
      });

      collection.mockReturnValue({});
      addDoc.mockResolvedValue(mockCommentRef);
      serverTimestamp.mockReturnValue(mockTimestamp);

      // Mock user and bet document retrieval
      getDoc.mockImplementation((ref) => {
        if (ref === mockUserRef) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockUserData,
          });
        }
        if (ref === mockBetRef) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockBetData,
          });
        }
        return Promise.resolve({
          exists: () => false,
        });
      });

      const result = await BetsService.addComment(
        'group123',
        'bet123',
        'user123',
        'Test comment',
      );

      expect(result).toMatchObject({
        id: 'comment1',
        betId: 'bet123',
        userId: 'user123',
        username: 'testuser',
        profilePicture: 'profile.jpg',
        content: 'Test comment',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify comment was added to betComments collection
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          betId: 'bet123',
          userId: 'user123',
          username: 'testuser',
          profilePicture: 'profile.jpg',
          content: 'Test comment',
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
        }),
      );

      // Verify bet was updated with comment count
      expect(updateDoc).toHaveBeenCalledWith(
        mockBetRef,
        expect.objectContaining({
          commentCount: 1,
          updatedAt: mockTimestamp,
        }),
      );
    });
  });

  describe('addReaction', () => {
    it('should add reaction successfully', async () => {
      const mockUserData = {
        username: 'testuser',
      };

      const mockBetRef = { id: 'bet123' };
      doc.mockReturnValue(mockBetRef);

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await BetsService.addReaction(
        'group123',
        'bet123',
        'user123',
        '👍',
      );

      expect(result).toBe(true);

      // Verify reaction updates
      expect(updateDoc).toHaveBeenCalledWith(
        mockBetRef,
        expect.objectContaining({
          reactions: arrayUnion(
            expect.objectContaining({
              userId: 'user123',
              username: 'testuser',
              reaction: '👍',
              createdAt: expect.any(String),
            }),
          ),
          updatedAt: expect.any(String),
        }),
      );
    });
  });
});
