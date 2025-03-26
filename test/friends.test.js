const FriendService = require('../src/endpoints/friend.cjs');
const { auth, db } = require('../src/firebase/config');
const UserService = require('../src/endpoints/user.cjs');
const { doc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../src/firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'user123',
    },
  },
}));

jest.mock('../src/endpoints/user.cjs', () => ({
  getUid: jest.fn(),
  getUserProfile: jest.fn(),
  userExists: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('FriendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addFriend', () => {
    it('should add friend successfully', async () => {
      const mockCurrentUserProfile = {
        username: 'currentuser',
        friends: [],
      };

      const mockFriendProfile = {
        username: 'frienduser',
        friends: [],
      };

      UserService.userExists.mockResolvedValue(true);
      UserService.getUid.mockResolvedValue('friend123');
      UserService.getUserProfile
        .mockResolvedValueOnce(mockCurrentUserProfile)
        .mockResolvedValueOnce(mockFriendProfile);

      doc.mockReturnValue({});
      updateDoc.mockResolvedValue();

      await FriendService.addFriend({ user2username: 'frienduser' });

      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(arrayUnion).toHaveBeenCalledWith({
        userId: expect.any(String),
        status: 'pending',
      });
    });

    it('should throw error if username does not exist', async () => {
      UserService.userExists.mockResolvedValue(false);

      await FriendService.addFriend({ user2username: 'nonexistent' });

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw error if trying to add self as friend', async () => {
      const mockCurrentUserProfile = {
        username: 'currentuser',
        friends: [],
      };

      UserService.userExists.mockResolvedValue(true);
      UserService.getUserProfile.mockResolvedValue(mockCurrentUserProfile);

      await FriendService.addFriend({ user2username: 'currentuser' });

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw error if already friends', async () => {
      const mockCurrentUserProfile = {
        username: 'currentuser',
        friends: [{ userId: 'friend123', status: 'active' }],
      };

      UserService.userExists.mockResolvedValue(true);
      UserService.getUid.mockResolvedValue('friend123');
      UserService.getUserProfile.mockResolvedValue(mockCurrentUserProfile);

      await FriendService.addFriend({ user2username: 'frienduser' });

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('getFriendList', () => {
    it('should get friend list successfully', async () => {
      const mockCurrentUserProfile = {
        friends: [
          { userId: 'friend1', status: 'active' },
          { userId: 'friend2', status: 'pending' },
        ],
      };

      const mockFriendProfiles = [
        {
          username: 'friend1',
          numCoins: 100,
          trophies: 5,
        },
        {
          username: 'friend2',
          numCoins: 200,
          trophies: 10,
        },
      ];

      UserService.getUserProfile
        .mockResolvedValueOnce(mockCurrentUserProfile)
        .mockResolvedValueOnce(mockFriendProfiles[0])
        .mockResolvedValueOnce(mockFriendProfiles[1]);

      const result = await FriendService.getFriendList('active');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'friend1',
        username: 'friend1',
        coins: 100,
        trophies: 5,
        status: 'active',
      });
    });

    it('should get all friends when status is "all"', async () => {
      const mockCurrentUserProfile = {
        friends: [
          { userId: 'friend1', status: 'active' },
          { userId: 'friend2', status: 'pending' },
        ],
      };

      const mockFriendProfiles = [
        {
          username: 'friend1',
          numCoins: 100,
          trophies: 5,
        },
        {
          username: 'friend2',
          numCoins: 200,
          trophies: 10,
        },
      ];

      UserService.getUserProfile
        .mockResolvedValueOnce(mockCurrentUserProfile)
        .mockResolvedValueOnce(mockFriendProfiles[0])
        .mockResolvedValueOnce(mockFriendProfiles[1]);

      const result = await FriendService.getFriendList('all');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'friend1',
            status: 'active',
          }),
          expect.objectContaining({
            userId: 'friend2',
            status: 'pending',
          }),
        ]),
      );
    });

    it('should handle missing friend profiles gracefully', async () => {
      const mockCurrentUserProfile = {
        friends: [{ userId: 'friend1', status: 'active' }],
      };

      UserService.getUserProfile
        .mockResolvedValueOnce(mockCurrentUserProfile)
        .mockRejectedValueOnce(new Error('Profile not found'));

      const result = await FriendService.getFriendList();

      expect(result).toHaveLength(0);
    });
  });
});
