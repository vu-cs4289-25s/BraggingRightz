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

import {
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
} from 'firebase/firestore';
import { db } from '../firebase/config';

class GroupService {
  // Get user's groups
  async getUserGroups(userId) {
    try {
      const groupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userId),
      );

      const groupsSnapshot = await getDocs(groupsQuery);
      return groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create group
  async createGroup(groupData) {
    try {
      const group = {
        ...groupData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const groupRef = await addDoc(collection(db, 'groups'), group);
      return {
        id: groupRef.id,
        ...group,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update group
  async updateGroup(groupId, updateData) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      return {
        id: groupId,
        ...updateData,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // Delete group
  async deleteGroup(groupId) {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Get group members
  async getGroupMembers(groupId) {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const memberIds = groupDoc.data().members;
      const membersPromises = memberIds.map((id) =>
        getDoc(doc(db, 'users', id)),
      );

      const memberDocs = await Promise.all(membersPromises);
      return memberDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  // Update group members
  async updateGroupMembers(groupId, { addMembers = [], removeMembers = [] }) {
    try {
      const groupRef = doc(db, 'groups', groupId);

      await updateDoc(groupRef, {
        members: arrayUnion(...addMembers),
        updatedAt: serverTimestamp(),
      });

      if (removeMembers.length > 0) {
        await updateDoc(groupRef, {
          members: arrayRemove(...removeMembers),
        });
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Invite to group
  async inviteToGroup(groupId, inviteeEmails) {
    try {
      const invites = inviteeEmails.map((email) => ({
        groupId,
        email,
        status: 'pending',
        createdAt: serverTimestamp(),
      }));

      const inviteRefs = await Promise.all(
        invites.map((invite) => addDoc(collection(db, 'groupInvites'), invite)),
      );

      return inviteRefs.map((ref, index) => ({
        id: ref.id,
        ...invites[index],
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    throw new Error(error.message);
  }
}

export const groupService = new GroupService();
