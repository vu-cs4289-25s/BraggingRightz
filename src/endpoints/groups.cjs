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
} = require('firebase/firestore');
const { db } = require('../firebase/config');

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
  async createGroup(name, members, creatorId) {
    try {
      const group = {
        name,
        members: [...members, creatorId],
        creatorId,
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

  // Update group name
  async updateGroupName(groupId, newName) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        name: newName,
        updatedAt: serverTimestamp(),
      });

      return {
        id: groupId,
        name: newName,
      };
    } catch (error) {
      this._handleError(error);
    }
  }

  // add member to group
  async addMember(groupId, memberId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      // check if member already exists in this group
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.data().members.includes(memberId)) {
        this._handleError({ code: 'group/member-already-exists' });
      }
      await updateDoc(groupRef, {
        // update members to include new member
        members: arrayUnion(memberId),
        updatedAt: serverTimestamp(),
      });

      return {
        id: groupId,
        members: arrayUnion(memberId),
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

  _handleError(error) {
    let message = 'An error occurred.';

    switch (error.code) {
      case 'group/member-already-exists':
        message = 'Member is already in this group';
        break;
      default:
        message = error.message;
    }
    throw new Error(message);
  }
}

module.exports = new GroupService();
