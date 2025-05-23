const GroupsService = require('../src/endpoints/groups');
const { db } = require('../src/firebase/config');
const {
  doc,
  addDoc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  arrayUnion: jest.fn((x) => x),
  arrayRemove: jest.fn((x) => x),
  serverTimestamp: jest.fn(() => new Date('2024-01-01').toISOString()),
}));

jest.mock('../src/firebase/config', () => ({
  db: {},
}));

describe('GroupsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a new group successfully', async () => {
      const mockGroupData = {
        name: 'Test Group',
        description: 'Test Description',
        creatorId: 'user123',
        members: ['member1', 'member2'],
      };

      const mockGroupRef = { id: 'group123' };
      doc.mockReturnValue(mockGroupRef);
      setDoc.mockResolvedValue();
      updateDoc.mockResolvedValue();

      const result = await GroupsService.createGroup(mockGroupData);

      expect(result).toMatchObject({
        id: 'group123',
        name: 'Test Group',
        description: 'Test Description',
        creatorId: 'user123',
        members: expect.arrayContaining(['user123', 'member1', 'member2']),
        admins: ['user123'],
      });
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled(); // Updates user's groups
    });
  });

  describe('getGroup', () => {
    it('should get a group by ID', async () => {
      const mockGroupData = {
        id: 'group123',
        name: 'Test Group',
        members: ['user123'],
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockGroupData,
      });

      const result = await GroupsService.getGroup('group123');

      expect(result).toEqual(mockGroupData);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(GroupsService.getGroup('nonexistent')).rejects.toThrow(
        'Group not found',
      );
    });
  });

  describe('getUserGroups', () => {
    it('should get all user groups', async () => {
      const mockGroups = [
        { id: 'group1', name: 'Group 1' },
        { id: 'group2', name: 'Group 2' },
      ];

      getDocs.mockResolvedValue({
        docs: mockGroups.map((group) => ({
          data: () => group,
        })),
      });

      const result = await GroupsService.getUserGroups('user123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Group 1');
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    it('should update a group successfully', async () => {
      const mockGroupData = {
        id: 'group123',
        name: 'Updated Group',
      };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockGroupData,
        });

      const result = await GroupsService.updateGroup('group123', {
        name: 'Updated Group',
      });

      expect(result.name).toBe('Updated Group');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        GroupsService.updateGroup('nonexistent', {}),
      ).rejects.toThrow('Group not found');
    });
  });

  describe('addMember', () => {
    it('should add member to public group successfully', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123'],
        }),
      });

      const result = await GroupsService.addMember('group123', 'user456');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2); // Updates both group and user
    });

    it('should add member to private group with correct invite code', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          inviteCode: 'ABC123',
          members: ['user123'],
        }),
      });

      const result = await GroupsService.addMember(
        'group123',
        'user456',
        'ABC123',
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should throw error if user is already a member', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123', 'user456'],
        }),
      });

      await expect(
        GroupsService.addMember('group123', 'user456'),
      ).rejects.toThrow('User is already a member');
    });
  });

  // describe('removeMember', () => {
  //   it('should remove member successfully when admin removes', async () => {
  //     const mockGroupData = {
  //       id: 'group123',
  //       name: 'Test Group',
  //       members: ['admin123', 'user123'],
  //       admins: ['admin123'],
  //     };

  //     getDoc.mockImplementation((ref) => {
  //       if (ref.id === 'group123') {
  //         return Promise.resolve({
  //           exists: () => true,
  //           data: () => mockGroupData,
  //         });
  //       }
  //       return Promise.resolve({
  //         exists: () => true,
  //         data: () => ({ username: 'testuser' }),
  //       });
  //     });

  //     const result = await GroupsService.removeMember('group123', 'admin123', 'user123');

  //     expect(result).toBe(true);
  //     expect(updateDoc).toHaveBeenCalledWith(
  //       expect.anything(),
  //       expect.objectContaining({
  //         members: arrayRemove('user123'),
  //         updatedAt: expect.any(String),
  //       }),
  //     );
  //   });

  //   it('should allow user to remove themselves', async () => {
  //     const mockGroupData = {
  //       id: 'group123',
  //       name: 'Test Group',
  //       members: ['admin123', 'user123'],
  //       admins: ['admin123', 'user123'],
  //     };

  //     getDoc.mockImplementation((ref) => {
  //       if (ref.id === 'group123') {
  //         return Promise.resolve({
  //           exists: () => true,
  //           data: () => mockGroupData,
  //         });
  //       }
  //       return Promise.resolve({
  //         exists: () => true,
  //         data: () => ({ username: 'testuser' }),
  //       });
  //     });

  //     const result = await GroupsService.removeMember('group123', 'user123', 'user123');

  //     expect(result).toBe(true);
  //     expect(updateDoc).toHaveBeenCalledWith(
  //       expect.anything(),
  //       expect.objectContaining({
  //         members: arrayRemove('user123'),
  //         admins: arrayRemove('user123'),
  //         updatedAt: expect.any(String),
  //       }),
  //     );
  //   });

  //   it('should throw error if removing last admin', async () => {
  //     const mockGroupData = {
  //       id: 'group123',
  //       name: 'Test Group',
  //       members: ['admin123'],
  //       admins: ['admin123'],
  //     };

  //     getDoc.mockImplementation((ref) => {
  //       if (ref.id === 'group123') {
  //         return Promise.resolve({
  //           exists: () => true,
  //           data: () => mockGroupData,
  //         });
  //       }
  //       return Promise.resolve({
  //         exists: () => true,
  //         data: () => ({ username: 'testuser' }),
  //       });
  //     });

  //     await expect(
  //       GroupsService.removeMember('group123', 'admin123', 'admin123'),
  //     ).rejects.toThrow('Cannot remove the last admin');
  //   });
  // });

  describe('deleteGroup', () => {
    it('should delete group successfully when creator deletes', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          creatorId: 'user123',
          members: ['user123', 'user456'],
        }),
      });

      const result = await GroupsService.deleteGroup('group123', 'user123');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should throw error if not group creator', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          creatorId: 'user123',
          members: ['user123', 'user456'],
        }),
      });

      await expect(
        GroupsService.deleteGroup('group123', 'user456'),
      ).rejects.toThrow('Only the group creator can delete the group');
    });
  });
});
