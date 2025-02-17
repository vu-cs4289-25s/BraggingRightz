const GroupsService = require('../src/endpoints/groups');
const { db } = require('../src/firebase/config');
const {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
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
        isPrivate: false,
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
        members: ['user123'],
        admins: ['user123'],
        isPrivate: false,
      });
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled(); // Updates user's groups
    });

    it('should create a private group with invite code', async () => {
      const mockGroupData = {
        name: 'Private Group',
        description: 'Test Description',
        creatorId: 'user123',
        isPrivate: true,
      };

      const mockGroupRef = { id: 'group123' };
      doc.mockReturnValue(mockGroupRef);
      setDoc.mockResolvedValue();
      updateDoc.mockResolvedValue();

      const result = await GroupsService.createGroup(mockGroupData);

      expect(result.isPrivate).toBe(true);
      expect(result.inviteCode).toBeDefined();
      expect(result.inviteCode).toHaveLength(6);
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
          isPrivate: false,
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
          isPrivate: true,
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

    it('should throw error if invite code is invalid', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPrivate: true,
          inviteCode: 'ABC123',
          members: ['user123'],
        }),
      });

      await expect(
        GroupsService.addMember('group123', 'user456', 'WRONG'),
      ).rejects.toThrow('Invalid invite code');
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

  describe('removeMember', () => {
    it('should remove member successfully when admin removes', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123', 'user456'],
          admins: ['user123'],
        }),
      });

      const result = await GroupsService.removeMember(
        'group123',
        'user456',
        'user123',
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should allow user to remove themselves', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123', 'user456'],
          admins: ['user789'],
        }),
      });

      const result = await GroupsService.removeMember(
        'group123',
        'user456',
        'user456',
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('should throw error if not authorized to remove', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123', 'user456'],
          admins: ['user789'],
        }),
      });

      await expect(
        GroupsService.removeMember('group123', 'user456', 'user123'),
      ).rejects.toThrow('Not authorized to remove members');
    });

    it('should throw error when removing last admin', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          members: ['user123'],
          admins: ['user123'],
        }),
      });

      await expect(
        GroupsService.removeMember('group123', 'user123', 'user123'),
      ).rejects.toThrow('Cannot remove the last admin');
    });
  });

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
