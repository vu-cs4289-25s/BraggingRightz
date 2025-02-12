/*
User Authentication
POST /auth/register → Register a new user with email, username, password, and birthday
POST /auth/login → Log in a user with username and password
POST /auth/logout → Log out the current user
GET /auth/session → Get the current user session
PUT /auth/update-password → Update user’s password
POST /auth/forgot-password → Request a password reset link
POST /auth/reset-password → Reset password using token
GET /auth/check-username/{username} → Check if a username is available

 */
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} = require('firebase/auth');
const {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} = require('firebase/firestore');
const { auth, db } = require('../firebase/config');

class AuthService {
  // Register new user
  async register({ email, username, password, fullName }) {
    try {
      // make everything lowercase
      username = username.toLowerCase();
      email = email.toLowerCase();
      // Check if username is available
      const isAvailable = await this.checkUsername(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        username,
        fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trophies: 0,
        groups: [],
      });

      return {
        uid: user.uid,
        email: user.email,
        username,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Login user
  async login({ username, password }) {
    try {
      // First get email from username
      const userQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      const email = userDoc.data().email;

      // Login with email
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      return {
        uid: user.uid,
        email: user.email,
        username,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get current session
  async getSession() {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      return {
        uid: user.uid,
        email: user.email,
        username: userData.username,
        fullName: userData.fullName,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update password
  async updatePassword({ currentPassword, newPassword }) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Reauthenticate user before password change
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Request password reset
  async forgotPassword(username) {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      const email = userDoc.data().email;
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Check username availability
  async checkUsername(username) {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
      );
      const querySnapshot = await getDocs(userQuery);
      return querySnapshot.empty;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Error handler
  _handleError(error) {
    let message = 'An error occurred.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/user-not-found':
        message = 'User not found.';
        break;
      case 'auth/wrong-password':
        message = 'Invalid password.';
        break;
      default:
        message = error.message;
    }

    throw new Error(message);
  }
}

module.exports = new AuthService();
