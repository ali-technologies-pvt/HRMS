'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatGroup, ChatMessage, GroupInvitation, User } from '@/types';
import { initialChatGroups, initialChatMessages } from '@/lib/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { playGlassChime } from '@/lib/utils';
import {
  sendDesktopPushNotification,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported
} from '@/lib/pushNotifications';

interface ChatContextType {
  groups: ChatGroup[];
  messages: ChatMessage[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroup: (name: string, description: string, memberEmails: string[]) => { success: boolean; error?: string; group?: ChatGroup };
  inviteMemberByEmail: (groupId: string, email: string) => { success: boolean; error?: string };
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  sendMessage: (groupId: string, text: string) => void;
  activeGroupMessages: ChatMessage[];
  pendingInvitations: GroupInvitation[];
  desktopPushStatus: NotificationPermission;
  enableDesktopPush: () => Promise<void>;
  totalUnreadChatCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, users } = useAuth();
  const { showNotification } = useNotifications();

  const [groups, setGroups] = useState<ChatGroup[]>(initialChatGroups);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [desktopPushStatus, setDesktopPushStatus] = useState<NotificationPermission>('default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize storage
  useEffect(() => {
    const loadedGroups = loadFromStorage<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS, initialChatGroups);
    const loadedMessages = loadFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
    setGroups(loadedGroups);
    setMessages(loadedMessages);

    if (loadedGroups.length > 0 && !activeGroupId) {
      // Find first group current user is part of
      const userGroup = loadedGroups.find(g => g.memberIds.includes(currentUser?.id || ''));
      if (userGroup) {
        setActiveGroupId(userGroup.id);
      }
    }

    if (isNotificationSupported()) {
      setDesktopPushStatus(getNotificationPermission());
    }

    setIsLoaded(true);
  }, [currentUser?.id]);

  // Sync to storage
  const syncGroups = useCallback((updated: ChatGroup[]) => {
    setGroups(updated);
    saveToStorage(STORAGE_KEYS.CHAT_GROUPS, updated);
  }, []);

  const syncMessages = useCallback((updated: ChatMessage[]) => {
    setMessages(updated);
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, updated);
  }, []);

  const enableDesktopPush = async () => {
    const permission = await requestNotificationPermission();
    setDesktopPushStatus(permission);
    if (permission === 'granted') {
      showNotification('Push Notifications Active', 'Laptop desktop alerts enabled for team chat.', 'success');
      sendDesktopPushNotification('quickslogx Team Chat', {
        body: 'Desktop notifications are active. You will receive alerts when messages arrive.'
      });
    } else {
      showNotification('Permission Required', 'Notification permissions were dismissed or denied.', 'warning');
    }
  };

  // Create Group (Only Manager or Super Admin)
  const createGroup = useCallback((name: string, description: string, memberEmails: string[]) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!name.trim()) return { success: false, error: 'Group name is required' };

    const groupId = 'grp-' + Date.now().toString(36);
    const newInvitations: GroupInvitation[] = [];

    // Find and invite employees by email
    memberEmails.forEach(email => {
      const trimmed = email.trim().toLowerCase();
      const matched = users.find(u => u.email.toLowerCase() === trimmed);
      if (matched && matched.id !== currentUser.id) {
        newInvitations.push({
          id: 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
          groupId,
          groupName: name.trim(),
          invitedUserId: matched.id,
          invitedUserEmail: matched.email,
          invitedUserName: matched.name,
          invitedById: currentUser.id,
          invitedByName: currentUser.name,
          status: 'pending',
          invitedAt: new Date().toISOString()
        });
      }
    });

    const newGroup: ChatGroup = {
      id: groupId,
      name: name.trim(),
      description: description.trim(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      memberIds: [currentUser.id], // Creator manager is automatically member
      pendingInvitations: newInvitations,
      lastMessage: {
        text: `Group created by ${currentUser.name}`,
        senderName: 'System',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };

    const initialSysMsg: ChatMessage = {
      id: 'msg-' + Date.now().toString(36),
      groupId,
      senderId: 'system',
      senderName: 'System Notice',
      text: `${currentUser.name} created the group "${name.trim()}".`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isSystem: true
    };

    const updatedGroups = [newGroup, ...groups];
    const updatedMessages = [...messages, initialSysMsg];

    syncGroups(updatedGroups);
    syncMessages(updatedMessages);
    setActiveGroupId(groupId);

    showNotification('Group Created', `"${name.trim()}" created. Invitations dispatched to ${newInvitations.length} employee(s).`, 'success');
    sendDesktopPushNotification(`New Group: ${name.trim()}`, {
      body: `Group created with ${newInvitations.length} team invite(s).`
    });

    return { success: true, group: newGroup };
  }, [currentUser, users, groups, messages, syncGroups, syncMessages, showNotification]);

  // Invite member by email
  const inviteMemberByEmail = useCallback((groupId: string, email: string) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return { success: false, error: 'Group not found' };

    const cleanEmail = email.trim().toLowerCase();
    const targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      return { success: false, error: `No employee found with email: ${email}` };
    }

    if (targetGroup.memberIds.includes(targetUser.id)) {
      return { success: false, error: `${targetUser.name} is already an active member of this group.` };
    }

    const alreadyInvited = targetGroup.pendingInvitations?.some(
      inv => inv.invitedUserId === targetUser.id && inv.status === 'pending'
    );
    if (alreadyInvited) {
      return { success: false, error: `An invitation has already been sent to ${targetUser.name}.` };
    }

    const newInvite: GroupInvitation = {
      id: 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      groupId,
      groupName: targetGroup.name,
      invitedUserId: targetUser.id,
      invitedUserEmail: targetUser.email,
      invitedUserName: targetUser.name,
      invitedById: currentUser.id,
      invitedByName: currentUser.name,
      status: 'pending',
      invitedAt: new Date().toISOString()
    };

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now().toString(36),
      groupId,
      senderId: 'system',
      senderName: 'System Notice',
      text: `${currentUser.name} sent a group invitation to ${targetUser.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isSystem: true
    };

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          pendingInvitations: [...(g.pendingInvitations || []), newInvite]
        };
      }
      return g;
    });

    syncGroups(updatedGroups);
    syncMessages([...messages, sysMsg]);
    showNotification('Invitation Sent', `Invitation to join ${targetGroup.name} dispatched to ${targetUser.name}.`, 'success');

    return { success: true };
  }, [currentUser, users, groups, messages, syncGroups, syncMessages, showNotification]);

  // Accept Invitation
  const acceptInvitation = useCallback((invitationId: string) => {
    if (!currentUser) return;

    let joinedGroupName = '';
    const updatedGroups = groups.map(g => {
      const invIndex = g.pendingInvitations?.findIndex(i => i.id === invitationId);
      if (invIndex !== undefined && invIndex !== -1 && g.pendingInvitations) {
        joinedGroupName = g.name;
        const updatedInvs = g.pendingInvitations.map(inv =>
          inv.id === invitationId ? { ...inv, status: 'accepted' as const } : inv
        );
        const newMembers = g.memberIds.includes(currentUser.id) ? g.memberIds : [...g.memberIds, currentUser.id];
        return {
          ...g,
          memberIds: newMembers,
          pendingInvitations: updatedInvs
        };
      }
      return g;
    });

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now().toString(36),
      groupId: activeGroupId || (updatedGroups[0]?.id || ''),
      senderId: 'system',
      senderName: 'System Notice',
      text: `${currentUser.name} accepted the invitation and joined the chat.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isSystem: true
    };

    syncGroups(updatedGroups);
    syncMessages([...messages, sysMsg]);
    showNotification('Group Joined', `You have joined "${joinedGroupName}". Welcome!`, 'success');
    sendDesktopPushNotification(`Joined ${joinedGroupName}`, {
      body: 'You are now an active participant in this team group.'
    });
  }, [currentUser, groups, messages, activeGroupId, syncGroups, syncMessages, showNotification]);

  // Decline Invitation
  const declineInvitation = useCallback((invitationId: string) => {
    const updatedGroups = groups.map(g => {
      if (g.pendingInvitations) {
        return {
          ...g,
          pendingInvitations: g.pendingInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'declined' as const } : inv
          )
        };
      }
      return g;
    });

    syncGroups(updatedGroups);
    showNotification('Invitation Declined', 'The group invitation was declined.', 'info');
  }, [groups, syncGroups, showNotification]);

  // Send Message
  const sendMessage = useCallback((groupId: string, text: string) => {
    if (!currentUser) return;
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // STRICT: senderName must be employee NAME, NOT email!
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      groupId,
      senderId: currentUser.id,
      senderName: currentUser.name, // SHOW EMPLOYEE NAME, NOT EMAIL!
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      text: text.trim(),
      timestamp: timeStr,
      createdAt: new Date().toISOString(),
      isSystem: false
    };

    const targetGroup = groups.find(g => g.id === groupId);
    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          lastMessage: {
            text: text.trim(),
            senderName: currentUser.name,
            timestamp: timeStr
          }
        };
      }
      return g;
    });

    syncMessages([...messages, newMsg]);
    syncGroups(updatedGroups);

    // Audio chime feedback
    playGlassChime('click');

    // Desktop Push Notification
    sendDesktopPushNotification(targetGroup ? targetGroup.name : 'Team Chat', {
      body: `${currentUser.name}: ${text.trim()}`,
      tag: groupId
    });
  }, [currentUser, groups, messages, syncMessages, syncGroups]);

  // Get active group messages
  const activeGroupMessages = messages.filter(m => m.groupId === activeGroupId);

  // Pending invitations for current user
  const pendingInvitations: GroupInvitation[] = [];
  if (currentUser) {
    groups.forEach(g => {
      g.pendingInvitations?.forEach(inv => {
        if (inv.invitedUserId === currentUser.id && inv.status === 'pending') {
          pendingInvitations.push(inv);
        }
      });
    });
  }

  // Filter groups visible to current user (creator, member, or pending invitee)
  const visibleGroups = groups.filter(g =>
    currentUser ? g.memberIds.includes(currentUser.id) || g.createdBy === currentUser.id : true
  );

  return (
    <ChatContext.Provider
      value={{
        groups: visibleGroups,
        messages,
        activeGroupId,
        setActiveGroupId,
        createGroup,
        inviteMemberByEmail,
        acceptInvitation,
        declineInvitation,
        sendMessage,
        activeGroupMessages,
        pendingInvitations,
        desktopPushStatus,
        enableDesktopPush,
        totalUnreadChatCount: pendingInvitations.length
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
