/*
Groups & Chat
GET /groups → Retrieve all groups the user is part of
POST /groups → Create a new group
PUT /groups/{group_id} → Update group settings (name, description, etc.)
DELETE /groups/{group_id} → Delete a group
GET /groups/{group_id}/members → Get list of group members
PUT /groups/{group_id}/members → Add/remove members from a group
POST /groups/{group_id}/invite → Invite users (in-app or external)

 */

const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
} = require('firebase/firestore');
const { db } = require('../firebase/config');

class GroupsService {
  // Create a new group
  async createGroup({ name, description, creatorId, isPrivate = false }) {
    try {
      const groupRef = doc(collection(db, 'groups'));
      const timestamp = new Date().toISOString();

      const groupData = {
        id: groupRef.id,
        name,
        description,
        creatorId,
        members: [creatorId],
        admins: [creatorId],
        isPrivate,
        bets: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        inviteCode: this._generateInviteCode(),
      };

      await setDoc(groupRef, groupData);

      // Update user's groups
      const userRef = doc(db, 'users', creatorId);
      await updateDoc(userRef, {
        groups: arrayUnion(groupRef.id),
        updatedAt: timestamp,
      });

      return groupData;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get group by ID
  async getGroup(groupId) {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      return groupDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get user's groups
  async getUserGroups(userId) {
    try {
      const groupQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userId),
      );
      const querySnapshot = await getDocs(groupQuery);
      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update group
  async updateGroup(groupId, updateData) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const timestamp = new Date().toISOString();
      const updates = {
        ...updateData,
        updatedAt: timestamp,
      };

      await updateDoc(groupRef, updates);

      // Get updated group data
      const updatedDoc = await getDoc(groupRef);
      return updatedDoc.data();
    } catch (error) {
      this._handleError(error);
    }
  }

  // Add member to group
  async addMember(groupId, userId, inviteCode) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check invite code for private groups
      if (groupData.isPrivate && groupData.inviteCode !== inviteCode) {
        throw new Error('Invalid invite code');
      }

      if (groupData.members.includes(userId)) {
        throw new Error('User is already a member of this group');
      }

      const timestamp = new Date().toISOString();

      // Add user to group
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: timestamp,
      });

      // Add group to user's groups
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        groups: arrayUnion(groupId),
        updatedAt: timestamp,
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Remove member from group
  async removeMember(groupId, userId, removerId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if remover is admin or the user themselves
      if (!groupData.admins.includes(removerId) && removerId !== userId) {
        throw new Error('Not authorized to remove members');
      }

      // Cannot remove the last admin
      if (groupData.admins.includes(userId) && groupData.admins.length === 1) {
        throw new Error('Cannot remove the last admin');
      }

      const timestamp = new Date().toISOString();

      // Remove user from group
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        admins: arrayRemove(userId),
        updatedAt: timestamp,
      });

      // Remove group from user's groups
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        groups: arrayRemove(groupId),
        updatedAt: timestamp,
      });

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete group
  async deleteGroup(groupId, userId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is creator
      if (groupData.creatorId !== userId) {
        throw new Error('Only the group creator can delete the group');
      }

      // Remove group from all members' groups arrays
      const promises = groupData.members.map((memberId) => {
        const userRef = doc(db, 'users', memberId);
        return updateDoc(userRef, {
          groups: arrayRemove(groupId),
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(promises);
      await deleteDoc(groupRef);
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Generate invite code
  _generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get group name by ID
  async getGroupName(groupId) {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        return 'No Group';
      }
      return groupDoc.data().name;
    } catch (error) {
      this._handleError(error);
      return 'No Group';
    }
  }

  // Error handler
  _handleError(error) {
    console.error('GroupsService Error:', error);
    throw new Error(error.message || 'An error occurred in GroupsService');
  }
}

module.exports = new GroupsService();
