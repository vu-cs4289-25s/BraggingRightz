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

      const defaultSettings = {
        userId,
        notifications: {
          betInvites: true,
          groupInvites: true,
          betResults: true,
          pointsUpdates: true,
        },
        privacy: {
          profileVisibility: 'public',
          showPoints: true,
          showGroups: true,
          showBets: true,
        },
        theme: 'light',
        language: 'en',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(settingsRef, defaultSettings);
      return defaultSettings;
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
  async updateNotificationSettings(userId, updates) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const currentSettings = settingsDoc.data();
      const updatedNotifications = {
        ...currentSettings.notifications,
        ...updates,
      };

      await updateDoc(settingsRef, {
        notifications: updatedNotifications,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...currentSettings,
        notifications: updatedNotifications,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId, updates) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      const currentSettings = settingsDoc.data();
      const updatedPrivacy = {
        ...currentSettings.privacy,
        ...updates,
      };

      await updateDoc(settingsRef, {
        privacy: updatedPrivacy,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...currentSettings,
        privacy: updatedPrivacy,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update theme
  async updateTheme(userId, theme) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      if (theme !== 'light' && theme !== 'dark') {
        throw new Error('Invalid theme');
      }

      const currentSettings = settingsDoc.data();
      await updateDoc(settingsRef, {
        theme,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...currentSettings,
        theme,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update language
  async updateLanguage(userId, language) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error('Settings not found');
      }

      if (language !== 'en' && language !== 'es') {
        throw new Error('Unsupported language');
      }

      const currentSettings = settingsDoc.data();
      await updateDoc(settingsRef, {
        language,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...currentSettings,
        language,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Reset settings
  async resetSettings(userId) {
    try {
      return await this.initializeSettings(userId);
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
