// testing for all the user endpoints

/*
User Profile
GET /users/{user_id} → Retrieve user profile info
PUT /users/{user_id} → Update user profile (username, email, etc.)
DELETE /users/{user_id} → Delete user account
GET /users/{user_id}/points → Retrieve current points balance
GET /users/{user_id}/leaderboard-rank → Get user’s rank on the leaderboard
GET /users/{user_id}/history → Get user’s betting history
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
  });
  // test/user.test.js
  describe('UserService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('updateUserProfile', () => {
      // it('should update user profile successfully', async () => {
      //   const userDoc = {
      //     exists: jest.fn().mockReturnValue(true),
      //     data: jest.fn().mockReturnValue({ username: 'olduser', email: 'olduser@test.com' }),
      //   };
      //   getDoc.mockResolvedValue(userDoc);
      //   updateDoc.mockResolvedValue();
      //
      //   const result = await UserService.updateUserProfile({userId: '123', updateData: {
      //     username: 'newuser',
      //     email: 'newuser@test.com',
      //     fullName: 'New User',
      //     }});
      //
      //   expect(result).toEqual({
      //     id: '123',
      //     username: 'newuser',
      //     email: 'newuser@test.com',
      //     fullName: 'New User',
      //     updatedAt: expect.any(String),
      //   });
      // });

      it('should throw an error if user not found', async () => {
        const userDoc = {
          exists: jest.fn().mockReturnValue(false),
        };
        getDoc.mockResolvedValue(userDoc);

        await expect(
          UserService.updateUserProfile('123', {
            username: 'newuser',
            email: 'newuser@test.com',
          }),
        ).rejects.toThrow('User not found');
      });

      // it('should throw an error if username is already taken', async () => {
      //   const userDoc = {
      //     exists: jest.fn().mockReturnValue(true),
      //   };
      //   getDoc.mockResolvedValue(userDoc);
      //   getDocs.mockResolvedValue({ empty: false }); // Username already exists
      //
      //   await expect(
      //     UserService.updateUserProfile('123', {
      //       username: 'newuser',
      //       email: 'newuser@test.com',
      //     }),
      //   ).rejects.toThrow('Username is already taken');
      // });

      // it('should update user profile without changing username', async () => {
      //   const userDoc = {
      //     exists: jest.fn().mockReturnValue(true),
      //   };
      //   getDoc.mockResolvedValue(userDoc);
      //   updateDoc.mockResolvedValue();
      //
      //   const result = await UserService.updateUserProfile({userId: '123', updateData:{
      //     email: 'newuser@test.com',
      //   }});
      //
      //   expect(result).toEqual({
      //     id: '123',
      //     email: 'newuser@test.com',
      //     updatedAt: expect.any(String),
      //   });
      // });
    });
  });
});
