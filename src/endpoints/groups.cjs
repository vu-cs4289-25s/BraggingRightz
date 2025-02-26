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
  Timestamp,
} = require('firebase/firestore');
const { db } = require('../firebase/config');
const NotificationsService = require('./notifications.cjs');

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
  async removeMember(groupId, adminId, memberId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if admin is an admin or if user is removing themselves
      if (!groupData.admins.includes(adminId) && adminId !== memberId) {
        throw new Error('Not authorized to remove members');
      }

      if (!groupData.members.includes(memberId)) {
        throw new Error('User is not a member of this group');
      }

      // Allow users to remove themselves
      if (memberId === adminId) {
        // Check if they're the last admin
        if (
          groupData.admins.length === 1 &&
          groupData.admins.includes(memberId)
        ) {
          throw new Error('Cannot remove the last admin');
        }
      }

      // Get removed member's name
      const userDoc = await getDoc(doc(db, 'users', memberId));
      const userName = userDoc.data().username;

      const timestamp = new Date().toISOString();

      // Remove member from group
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
        admins: arrayRemove(memberId),
        updatedAt: timestamp,
      });

      // Notify removed member
      await NotificationsService.createNotification({
        userId: memberId,
        type: 'groups',
        title: `Removed from ${groupData.name}`,
        message: 'You have been removed from the group',
        data: { groupId },
      });

      // Notify remaining members
      for (const remainingMemberId of groupData.members) {
        if (remainingMemberId !== memberId && remainingMemberId !== adminId) {
          await NotificationsService.createNotification({
            userId: remainingMemberId,
            type: 'groups',
            title: `${userName} was removed from ${groupData.name}`,
            message: 'A member has been removed from your group',
            data: { groupId },
          });
        }
      }

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

  // Invite user to group
  async inviteToGroup(groupId, inviterId, inviteeId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if inviter is a member
      if (!groupData.members.includes(inviterId)) {
        throw new Error('Only group members can invite others');
      }

      // Check if invitee is already a member
      if (groupData.members.includes(inviteeId)) {
        throw new Error('User is already a member of this group');
      }

      // Get inviter's name
      const inviterDoc = await getDoc(doc(db, 'users', inviterId));
      const inviterName = inviterDoc.data().username;

      // Create invitation
      const invitationRef = doc(collection(db, 'groupInvitations'));
      await setDoc(invitationRef, {
        id: invitationRef.id,
        groupId,
        inviterId,
        inviteeId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Send notification to invitee
      await NotificationsService.createGroupInviteNotification(
        inviteeId,
        groupId,
        groupData.name,
        inviterName,
      );

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Accept group invitation
  async acceptInvitation(invitationId, userId) {
    try {
      const invitationRef = doc(db, 'groupInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);

      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationDoc.data();

      if (invitation.inviteeId !== userId) {
        throw new Error('Not authorized to accept this invitation');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer pending');
      }

      const groupRef = doc(db, 'groups', invitation.groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      // Add member to group
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      });

      // Update invitation status
      await updateDoc(invitationRef, {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      // Get new member's name
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.data().username;

      // Notify group members about new member
      for (const memberId of groupData.members) {
        if (memberId !== userId) {
          await NotificationsService.createNotification({
            userId: memberId,
            type: 'groups',
            title: `${userName} joined ${groupData.name}`,
            message: 'A new member has joined your group',
            data: { groupId: invitation.groupId },
          });
        }
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Leave group
  async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      if (groupData.creatorId === userId) {
        throw new Error('Group creator cannot leave the group');
      }

      if (!groupData.members.includes(userId)) {
        throw new Error('User is not a member of this group');
      }

      // Get leaving member's name
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.data().username;

      // Remove member from group
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });

      // Notify remaining members
      for (const memberId of groupData.members) {
        if (memberId !== userId) {
          await NotificationsService.createNotification({
            userId: memberId,
            type: 'groups',
            title: `${userName} left ${groupData.name}`,
            message: 'A member has left your group',
            data: { groupId },
          });
        }
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Error handler
  _handleError(error) {
    console.error('GroupsService Error:', error);
    throw new Error(error.message || 'An error occurred in GroupsService');
  }
}

module.exports = new GroupsService();
