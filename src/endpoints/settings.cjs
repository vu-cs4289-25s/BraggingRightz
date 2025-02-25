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
        pushNotifications: true,
        emailNotifications: true,
        privateProfile: false,
        showOnlineStatus: true,
        darkMode: false,
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

  // Update a single setting
  async updateSetting(userId, key, value) {
    try {
      const settingsRef = doc(db, 'settings', userId);
      const timestamp = new Date().toISOString();

      await updateDoc(settingsRef, {
        [key]: value,
        updatedAt: timestamp,
      });

      return { [key]: value };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update theme
  async updateTheme(userId, theme) {
    try {
      return await this.updateSetting(userId, 'darkMode', theme === 'dark');
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
