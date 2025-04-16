const AuthService = require('../src/endpoints/auth'); // Adjust path as needed
const { auth, db } = require('../src/firebase/config'); // Mock Firebase config
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
} = require('firebase/auth');
const {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
} = require('firebase/firestore');

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updatePassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  reauthenticateWithCredential: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      sendEmailVerification.mockResolvedValue();
      getDocs.mockResolvedValue({ empty: true }); // Username is available
      setDoc.mockResolvedValue();

      const result = await AuthService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User',
        birthdate: '2000-01-01',
      });

      expect(result).toEqual({
        uid: '123',
        email: 'test@example.com',
        username: 'testuser',
        profilePicture: null,
        emailVerified: false,
        hasOnboarded: false,
      });
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123',
      );
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw an error if username is already taken', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/username-already-in-use',
      });

      await expect(
        AuthService.register({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User',
          birthdate: '2000-01-01',
        }),
      ).rejects.toThrow('Username is already taken');
    });

    it('should throw an error if email is already taken', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      await expect(
        AuthService.register({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User',
          birthdate: '2000-01-01',
        }),
      ).rejects.toThrow('Email is already taken');
    });

    it('should throw an error if registration fails', async () => {
      getDocs.mockResolvedValue({ empty: true }); // Username is available
      createUserWithEmailAndPassword.mockRejectedValue(
        new Error('Registration Failed'),
      );

      await expect(
        AuthService.register({
          email: 'test@example.com',
          username: 'testuser123',
          password: 'password123',
          fullName: 'Test User',
          birthdate: '2000-01-01',
        }),
      ).rejects.toThrow('Registration Failed');
    });

    it('should throw an error if invalid email', async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-email',
      });

      await expect(
        AuthService.register({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
          fullName: 'Test User',
          birthdate: '2000-01-01',
        }),
      ).rejects.toThrow('Invalid email address.');
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        profilePicture: null,
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => mockUserData,
            exists: () => true,
          },
        ],
      });

      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: '123', email: 'test@example.com' },
      });

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual({
        uid: '123',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        profilePicture: null,
      });
    });

    it('should throw an error if user not found', async () => {
      getDocs.mockResolvedValue({ empty: true });

      await expect(
        AuthService.login({ username: 'unknownuser', password: 'password123' }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should log out successfully', async () => {
      signOut.mockResolvedValue();

      const result = await AuthService.logout();

      expect(result).toBe(true);
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('getSession', () => {
    it('should return the current user session', async () => {
      const mockUserData = {
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        profilePicture: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });

      auth.currentUser = { uid: '123', email: 'test@example.com' };

      const result = await AuthService.getSession();

      expect(result).toEqual({
        uid: '123',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        profilePicture: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should return null if no user is logged in', async () => {
      auth.currentUser = null;
      const result = await AuthService.getSession();
      expect(result).toBeNull();
    });

    it('should return null if user document does not exist', async () => {
      auth.currentUser = { uid: '123', email: 'test@example.com' };
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await AuthService.getSession();
      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      auth.currentUser = { email: 'test@example.com' };
      const mockCredential = { credential: 'mock' };
      EmailAuthProvider.credential.mockReturnValue(mockCredential);
      reauthenticateWithCredential.mockResolvedValue();
      updatePassword.mockResolvedValue();

      const result = await AuthService.updatePassword({
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      });

      expect(result).toBe(true);
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(
        auth.currentUser,
        mockCredential,
      );
      expect(updatePassword).toHaveBeenCalledWith(auth.currentUser, 'newPass');
    });

    it('should throw an error if no user is logged in', async () => {
      auth.currentUser = null;

      await expect(
        AuthService.updatePassword({
          currentPassword: 'oldPass',
          newPassword: 'newPass',
        }),
      ).rejects.toThrow('No user logged in');
    });
  });

  describe('forgotPassword', () => {
    it('should send a password reset email', async () => {
      sendPasswordResetEmail.mockResolvedValue();

      // make a user with username testuser
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ email: 'test@example.com' }) }],
      });

      const result = await AuthService.forgotPassword('testuser');

      expect(result).toBe(true);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth,
        'test@example.com',
      );
    });
  });

  describe('checkUsername', () => {
    it('should return true if username is available', async () => {
      getDocs.mockResolvedValue({ empty: true });

      const result = await AuthService.checkUsername('newuser');

      expect(result).toBe(true);
    });

    it('should return false if username is taken', async () => {
      getDocs.mockResolvedValue({ empty: false });

      const result = await AuthService.checkUsername('existinguser');

      expect(result).toBe(false);
    });
  });

  describe('email verification', () => {
    it('should send verification email successfully', async () => {
      auth.currentUser = { email: 'test@example.com' };
      sendEmailVerification.mockResolvedValue();

      const result = await AuthService.resendVerificationEmail();
      expect(result).toBe(true);
      expect(sendEmailVerification).toHaveBeenCalledWith(auth.currentUser);
    });

    it('should throw error when no user is logged in for resend', async () => {
      auth.currentUser = null;
      await expect(AuthService.resendVerificationEmail()).rejects.toThrow(
        'No user logged in',
      );
    });

    it('should update email verification status successfully', async () => {
      // Mock the current user with reload method
      auth.currentUser = {
        uid: '123',
        email: 'test@example.com',
        emailVerified: true,
        reload: jest.fn().mockResolvedValue(),
      };

      // Mock Firestore document reference and update
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);
      updateDoc.mockResolvedValue();

      const result = await AuthService.updateEmailVerificationStatus();

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        emailVerified: true,
        updatedAt: expect.any(String),
      });
    });

    it('should return false when updating verification status with no user', async () => {
      auth.currentUser = null;
      const result = await AuthService.updateEmailVerificationStatus();
      expect(result).toBe(false);
    });

    it('should return false when user email is not verified', async () => {
      auth.currentUser = {
        uid: '123',
        email: 'test@example.com',
        emailVerified: false,
        reload: jest.fn().mockResolvedValue(),
      };

      const result = await AuthService.updateEmailVerificationStatus();
      expect(result).toBe(false);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});
