/*
Notifications & Settings
GET /notifications → Retrieve all user notifications
PUT /notifications/{notification_id}/read → Mark a notification as read
DELETE /notifications/{notification_id} → Remove a notification
PUT /users/{user_id}/settings → Update user settings (privacy, notifications, etc.)

 */

const { doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');
const { db } = require('../firebase/config');

class SettingsService {
  // Initialize user settings
  async initializeSettings(userId) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const timestamp = new Date().toISOString();

      const settingsData = {
        userId,
        notifications: {
          betInvites: true,
          groupInvites: true,
          betResults: true,
          pointsUpdates: true,
        },
        privacy: {
          profileVisibility: 'public', // public, friends, private
          showPoints: true,
          showGroups: true,
          showBets: true,
        },
        theme: 'light', // light, dark, system
        language: 'en', // en, es, fr, etc.
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(settingsRef, settingsData);
      return settingsData;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user settings
  async getSettings(userId) {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', userId));
      if (!settingsDoc.exists()) {
        return await this.initializeSettings(userId);
      }
      return settingsDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId, notificationSettings) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        notifications: {
          ...settingsDoc.data().notifications,
          ...notificationSettings,
        },
        updatedAt: timestamp,
      };

      await updateDoc(settingsRef, updates);

      const updatedDoc = await getDoc(settingsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId, privacySettings) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        privacy: {
          ...settingsDoc.data().privacy,
          ...privacySettings,
        },
        updatedAt: timestamp,
      };

      await updateDoc(settingsRef, updates);

      const updatedDoc = await getDoc(settingsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update theme
  async updateTheme(userId, theme) {
    try {
      if (!['light', 'dark', 'system'].includes(theme)) {
        throw new Error('Invalid theme');
      }

      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        theme,
        updatedAt: timestamp,
      };

      await updateDoc(settingsRef, updates);

      const updatedDoc = await getDoc(settingsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update language
  async updateLanguage(userId, language) {
    try {
      const supportedLanguages = ['en', 'es', 'fr']; // Add more as needed
      if (!supportedLanguages.includes(language)) {
        throw new Error('Unsupported language');
      }

      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        language,
        updatedAt: timestamp,
      };

      await updateDoc(settingsRef, updates);

      const updatedDoc = await getDoc(settingsRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Reset settings to default
  async resetSettings(userId) {
    try {
      await this.initializeSettings(userId);
      return await this.getSettings(userId);
    } catch (error) {
      this._handleError(error);
    }
  }

  // Error handler
  _handleError(error) {
    console.error('SettingsService Error:', error);
    throw new Error(error.message || 'An error occurred in SettingsService');
  }
}

module.exports = new SettingsService();
