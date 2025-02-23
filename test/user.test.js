// testing for all the user endpoints

/*
User Profile
GET /users/{user_id} → Retrieve user profile info
PUT /users/{user_id} → Update user profile (username, email, etc.)
DELETE /users/{user_id} → Delete user account
GET /users/{user_id}/points → Retrieve current points balance
GET /users/{user_id}/leaderboard-rank → Get user's rank on the leaderboard
GET /users/{user_id}/history → Get user's betting history
GET /users/{user_id}/notifications → Retrieve unread notifications
 */

const UserService = require('../src/endpoints/user');
const {
  doc,
  query,
  collection,
  where,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
} = require('firebase/firestore');
const { auth, db } = require('../src/firebase/config'); // Mock Firebase config

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock doc to return a reference with a path property
    doc.mockImplementation((db, collection, id) => ({
      path: `${collection}/${id}`,
    }));
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
        data: jest
          .fn()
          .mockReturnValue({ username: 'olduser', email: 'olduser@test.com' }),
      };
      getDoc.mockResolvedValue(userDoc);
      updateDoc.mockResolvedValue();

      // Mock the username and email availability checks
      query.mockReturnValue({});
      getDocs.mockResolvedValue({ empty: true }); // Username is available

      const result = await UserService.updateUserProfile({
        userId: '123',
        updateData: {
          username: 'newuser',
          email: 'newuser@test.com',
          fullName: 'New User',
        },
      });

      expect(result).toEqual({
        id: '123',
        username: 'newuser',
        email: 'newuser@test.com',
        fullName: 'New User',
      });
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw an error if user not found', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(false),
      };
      getDoc.mockResolvedValue(userDoc);

      await expect(
        UserService.updateUserProfile({
          userId: '123',
          updateData: {
            username: 'newuser',
            email: 'newuser@test.com',
          },
        }),
      ).rejects.toThrow('User not found');
    });

    it('should throw an error if username is already taken', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
        data: jest
          .fn()
          .mockReturnValue({ username: 'olduser', email: 'olduser@test.com' }),
      };
      getDoc.mockResolvedValue(userDoc);

      // Mock the username check query
      query.mockReturnValue({});
      getDocs.mockResolvedValue({ empty: false }); // Username already exists

      await expect(
        UserService.updateUserProfile({
          userId: '123',
          updateData: {
            username: 'newuser',
            email: 'newuser@test.com',
          },
        }),
      ).rejects.toThrow('Username is already taken');
    });

    it('should update user profile without changing username', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
        data: jest
          .fn()
          .mockReturnValue({ username: 'olduser', email: 'olduser@test.com' }),
      };
      getDoc.mockResolvedValue(userDoc);
      updateDoc.mockResolvedValue();

      // Mock the email availability check
      query.mockReturnValue({});
      getDocs.mockResolvedValue({ empty: true }); // Email is available

      const result = await UserService.updateUserProfile({
        userId: '123',
        updateData: {
          email: 'newuser@test.com',
        },
      });

      expect(result).toEqual({
        id: '123',
        email: 'newuser@test.com',
      });
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUserData = {
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue(mockUserData),
      };
      getDoc.mockResolvedValue(userDoc);

      const result = await UserService.getUserProfile('123');

      expect(result).toEqual(mockUserData);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should throw an error if user not found', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(false),
      };
      getDoc.mockResolvedValue(userDoc);

      await expect(UserService.getUserProfile('123')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getUserPoints', () => {
    it('should get user points successfully', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
      };
      const pointsDoc = {
        exists: jest.fn().mockReturnValue(true),
        data: jest
          .fn()
          .mockReturnValue({ balance: 1000, lastUpdated: '2024-01-01' }),
      };

      getDoc.mockImplementation((ref) => {
        if (ref.path.includes('points')) {
          return Promise.resolve(pointsDoc);
        }
        return Promise.resolve(userDoc);
      });

      const result = await UserService.getUserPoints('123');

      expect(result).toEqual({
        currentBalance: 1000,
        lastUpdated: '2024-01-01',
      });
    });

    it('should return 0 balance if points record not found', async () => {
      const userDoc = {
        exists: jest.fn().mockReturnValue(true),
      };
      const pointsDoc = {
        exists: jest.fn().mockReturnValue(false),
      };

      getDoc.mockImplementation((ref) => {
        if (ref.path.includes('points')) {
          return Promise.resolve(pointsDoc);
        }
        return Promise.resolve(userDoc);
      });

      const result = await UserService.getUserPoints('123');

      expect(result).toEqual({
        currentBalance: 0,
        lastUpdated: null,
      });
    });
  });
});
