/*
User Authentication
POST /auth/register → Register a new user with email, username, password, and birthday
POST /auth/login → Log in a user with username and password
POST /auth/logout → Log out the current user
GET /auth/session → Get the current user session
PUT /auth/update-password → Update user's password
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
  updateDoc,
} = require('firebase/firestore');
const { auth, db } = require('../firebase/config');

class AuthService {
  // Register new user
  async register({
    email,
    username,
    password,
    fullName,
    profilePicture = null,
  }) {
    try {
      // make everything lowercase
      username = username.toLowerCase();
      email = email.toLowerCase();
      // Check if username is available
      const isAvailable = await this.checkUsername(username);
      if (!isAvailable) {
        this._handleError({ code: 'auth/username-already-in-use' });
      }

      // Check if email is available
      const emailAvail = await this.checkEmail(email);
      if (!emailAvail) {
        this._handleError({ code: 'auth/email-already-in-use' });
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
        profilePicture,
      });

      // save session info
      auth.currentUser = user;

      return {
        uid: user.uid,
        email: user.email,
        username,
        profilePicture,
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
      const userData = userDoc.data();

      // Login with email
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        password,
      );
      const user = userCredential.user;

      return {
        uid: user.uid,
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        profilePicture: userData.profilePicture || null,
      };
    } catch (error) {
      console.log('Login error:', error);
      this._handleError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      auth.currentUser = null;
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

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        profilePicture: userData.profilePicture || null,
        updatedAt: userData.updatedAt,
      };
    } catch (error) {
      console.log('Get session error:', error);
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

  // Check email availability
  async checkEmail(email) {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
      );
      const querySnapshot = await getDocs(userQuery);
      return querySnapshot.empty;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        ...updateData,
        updatedAt: timestamp,
      };

      await updateDoc(userRef, updates);

      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      const userData = updatedDoc.data();

      return {
        uid: userId,
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        profilePicture: userData.profilePicture || null,
        updatedAt: timestamp,
      };
    } catch (error) {
      console.log('Update profile error:', error);
      this._handleError(error);
    }
  }

  // Error handler
  _handleError(error) {
    let message = 'An error occurred.';

    switch (error.code) {
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
      case 'auth/username-already-in-use':
        message = 'Username is already taken.';
        break;
      case 'auth/email-already-in-use':
        message = 'Email is already taken.';
        break;
      default:
        message = error.message;
    }

    throw new Error(message);
  }
}

module.exports = new AuthService();
