const SettingsService = require('../src/endpoints/settings');
const { db } = require('../src/firebase/config');
const { doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({
  db: {},
}));

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSettings', () => {
    it('should initialize settings for new user', async () => {
      const mockSettingsRef = { id: 'settings123' };
      doc.mockReturnValue(mockSettingsRef);
      setDoc.mockResolvedValue();

      const result = await SettingsService.initializeSettings('user123');

      expect(result).toMatchObject({
        userId: 'user123',
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
      });
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should get existing settings', async () => {
      const mockSettingsData = {
        userId: 'user123',
        notifications: {
          betInvites: true,
          groupInvites: false,
        },
        privacy: {
          profileVisibility: 'friends',
        },
        theme: 'dark',
        language: 'es',
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettingsData,
      });

      const result = await SettingsService.getSettings('user123');

      expect(result).toEqual(mockSettingsData);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should initialize settings if not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const mockSettingsRef = { id: 'settings123' };
      doc.mockReturnValue(mockSettingsRef);
      setDoc.mockResolvedValue();

      const result = await SettingsService.getSettings('user123');

      expect(result.theme).toBe('light');
      expect(result.language).toBe('en');
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const mockSettingsData = {
        userId: 'user123',
        notifications: {
          betInvites: false,
          groupInvites: true,
          betResults: true,
          pointsUpdates: false,
        },
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            notifications: {
              betInvites: true,
              groupInvites: true,
              betResults: true,
              pointsUpdates: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockSettingsData,
        });

      const result = await SettingsService.updateNotificationSettings(
        'user123',
        {
          betInvites: false,
          pointsUpdates: false,
        },
      );

      expect(result.notifications.betInvites).toBe(false);
      expect(result.notifications.pointsUpdates).toBe(false);
      expect(result.notifications.groupInvites).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if settings not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        SettingsService.updateNotificationSettings('user123', {}),
      ).rejects.toThrow('Settings not found');
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings successfully', async () => {
      const mockSettingsData = {
        userId: 'user123',
        privacy: {
          profileVisibility: 'private',
          showPoints: false,
          showGroups: true,
          showBets: true,
        },
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            privacy: {
              profileVisibility: 'public',
              showPoints: true,
              showGroups: true,
              showBets: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockSettingsData,
        });

      const result = await SettingsService.updatePrivacySettings('user123', {
        profileVisibility: 'private',
        showPoints: false,
      });

      expect(result.privacy.profileVisibility).toBe('private');
      expect(result.privacy.showPoints).toBe(false);
      expect(result.privacy.showGroups).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if settings not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        SettingsService.updatePrivacySettings('user123', {}),
      ).rejects.toThrow('Settings not found');
    });
  });

  describe('updateTheme', () => {
    it('should update theme successfully', async () => {
      const mockSettingsData = {
        userId: 'user123',
        theme: 'dark',
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockSettingsData,
        });

      const result = await SettingsService.updateTheme('user123', 'dark');

      expect(result.theme).toBe('dark');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for invalid theme', async () => {
      await expect(
        SettingsService.updateTheme('user123', 'invalid'),
      ).rejects.toThrow('Invalid theme');
    });

    it('should throw error if settings not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        SettingsService.updateTheme('user123', 'dark'),
      ).rejects.toThrow('Settings not found');
    });
  });

  describe('updateLanguage', () => {
    it('should update language successfully', async () => {
      const mockSettingsData = {
        userId: 'user123',
        language: 'es',
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockSettingsData,
        });

      const result = await SettingsService.updateLanguage('user123', 'es');

      expect(result.language).toBe('es');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for unsupported language', async () => {
      await expect(
        SettingsService.updateLanguage('user123', 'invalid'),
      ).rejects.toThrow('Unsupported language');
    });

    it('should throw error if settings not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        SettingsService.updateLanguage('user123', 'es'),
      ).rejects.toThrow('Settings not found');
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to default successfully', async () => {
      const mockSettingsRef = { id: 'settings123' };
      doc.mockReturnValue(mockSettingsRef);
      setDoc.mockResolvedValue();

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          theme: 'light',
          language: 'en',
        }),
      });

      const result = await SettingsService.resetSettings('user123');

      expect(result.theme).toBe('light');
      expect(result.language).toBe('en');
      expect(setDoc).toHaveBeenCalled();
    });
  });
});
