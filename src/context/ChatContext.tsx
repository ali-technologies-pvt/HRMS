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
import {
  pushCollectionToSupabase,
  fetchCollectionFromSupabase,
  subscribeToCollectionChange,
  subscribeToLiveChatMessage,
  broadcastRealtimeEvent
} from '@/lib/supabaseSync';

interface ChatContextType {
  groups: ChatGroup[];
  messages: ChatMessage[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroup: (name: string, description: string, memberEmails: string[]) => { success: boolean; error?: string; group?: ChatGroup };
  openOrCreateDirectChat: (targetUserId: string) => string;
  inviteMemberByEmail: (groupId: string, email: string) => { success: boolean; error?: string };
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  sendMessage: (groupId: string, text: string, imageUrl?: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
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

  // Initialize storage & cloud sync
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

    // Sync from Supabase cloud
    (async () => {
      try {
        const [cloudGroups, cloudMessages] = await Promise.all([
          fetchCollectionFromSupabase<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS),
          fetchCollectionFromSupabase<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES)
        ]);

        if (cloudGroups && cloudGroups.length > 0) {
          setGroups(cloudGroups);
          saveToStorage(STORAGE_KEYS.CHAT_GROUPS, cloudGroups);
          if (!activeGroupId) {
            const userGroup = cloudGroups.find(g => g.memberIds.includes(currentUser?.id || ''));
            if (userGroup) setActiveGroupId(userGroup.id);
          }
        } else if (loadedGroups.length > 0) {
          pushCollectionToSupabase(STORAGE_KEYS.CHAT_GROUPS, loadedGroups).catch(console.warn);
        }

        if (cloudMessages && cloudMessages.length > 0) {
          setMessages(cloudMessages);
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, cloudMessages);
        } else if (loadedMessages.length > 0) {
          pushCollectionToSupabase(STORAGE_KEYS.CHAT_MESSAGES, loadedMessages).catch(console.warn);
        }
      } catch (err) {
        console.warn('[ChatContext] Cloud sync error:', err);
      }
    })();

    // 1. Instant WebSocket push for incoming live chat messages, edits & deletes (sub-50ms)
    const unsubscribeChatMsg = subscribeToLiveChatMessage((payload: any) => {
      if (!payload) return;

      // Handle message edit/delete event
      if (payload.action === 'edit' && payload.messageId) {
        setMessages(prev => {
          const next = prev.map(m => m.id === payload.messageId ? { ...m, text: payload.text, editedAt: payload.editedAt } : m);
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
          return next;
        });
        return;
      }

      if (payload.action === 'delete' && payload.messageId) {
        setMessages(prev => {
          const next = prev.map(m => m.id === payload.messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m);
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
          return next;
        });
        return;
      }

      const incomingMsg = payload as ChatMessage;
      if (!incomingMsg.id) return;
      if (incomingMsg.senderId === currentUser?.id) return; // already added locally

      setMessages(prev => {
        if (prev.some(m => m.id === incomingMsg.id)) return prev;
        const next = [...prev, incomingMsg];
        saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
        return next;
      });

      // Update last message in group
      setGroups(prevGroups => {
        const next = prevGroups.map(g => g.id === incomingMsg.groupId ? {
          ...g,
          lastMessage: {
            text: incomingMsg.imageUrl ? '📷 [Image shared]' : incomingMsg.text,
            senderName: incomingMsg.senderName,
            timestamp: incomingMsg.timestamp
          }
        } : g);
        saveToStorage(STORAGE_KEYS.CHAT_GROUPS, next);
        return next;
      });

      // Sound chime and push notification on other device
      playGlassChime('alert');
      sendDesktopPushNotification(incomingMsg.senderName || 'Team Chat', {
        body: `${incomingMsg.senderName}: ${incomingMsg.imageUrl ? '📷 Image shared' : incomingMsg.text}`,
        tag: incomingMsg.groupId
      });
    });

    // 2. Realtime collections listener for chat groups & bulk messages
    const unsubscribeCollections = subscribeToCollectionChange((key, data) => {
      if (key === STORAGE_KEYS.CHAT_GROUPS && Array.isArray(data)) {
        setGroups(data);
        saveToStorage(STORAGE_KEYS.CHAT_GROUPS, data);
      }
      if (key === STORAGE_KEYS.CHAT_MESSAGES && Array.isArray(data)) {
        setMessages(prev => {
          if (data.length !== prev.length || (data.length > 0 && data[data.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, data);
            return data;
          }
          return prev;
        });
      }
    });

    // 3. High-frequency background sync polling (every 2.5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const [cloudMessages, cloudGroups] = await Promise.all([
          fetchCollectionFromSupabase<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES),
          fetchCollectionFromSupabase<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS)
        ]);

        if (cloudMessages && Array.isArray(cloudMessages)) {
          setMessages(prev => {
            if (cloudMessages.length > prev.length || (cloudMessages.length > 0 && cloudMessages[cloudMessages.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, cloudMessages);
              return cloudMessages;
            }
            return prev;
          });
        }

        if (cloudGroups && Array.isArray(cloudGroups)) {
          setGroups(prev => cloudGroups.length !== prev.length ? (saveToStorage(STORAGE_KEYS.CHAT_GROUPS, cloudGroups), cloudGroups) : prev);
        }
      } catch {}
    }, 2500);

    return () => {
      unsubscribeChatMsg();
      unsubscribeCollections();
      clearInterval(pollInterval);
    };
  }, [currentUser?.id]);

  // Sync to storage and Supabase
  const syncGroups = useCallback((updatedOrFn: ChatGroup[] | ((prev: ChatGroup[]) => ChatGroup[])) => {
    setGroups(prev => {
      const next = typeof updatedOrFn === 'function' ? updatedOrFn(prev) : updatedOrFn;
      saveToStorage(STORAGE_KEYS.CHAT_GROUPS, next);
      pushCollectionToSupabase(STORAGE_KEYS.CHAT_GROUPS, next).catch(console.warn);
      return next;
    });
  }, []);

  const syncMessages = useCallback((updatedOrFn: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages(prev => {
      const next = typeof updatedOrFn === 'function' ? updatedOrFn(prev) : updatedOrFn;
      saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
      pushCollectionToSupabase(STORAGE_KEYS.CHAT_MESSAGES, next).catch(console.warn);
      return next;
    });
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

  // Open or Create 1-on-1 Direct Chat (DM) between currentUser and targetUser
  const openOrCreateDirectChat = useCallback((targetUserId: string): string => {
    if (!currentUser) return '';
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return '';

    // Check if a direct group already exists between these 2 users
    const existingDm = groups.find(g =>
      g.isDirect &&
      g.memberIds.length === 2 &&
      g.memberIds.includes(currentUser.id) &&
      g.memberIds.includes(targetUserId)
    );

    if (existingDm) {
      setActiveGroupId(existingDm.id);
      return existingDm.id;
    }

    // Otherwise create a new direct conversation pod
    const dmId = 'dm-' + [currentUser.id, targetUserId].sort().join('-');
    const newDmGroup: ChatGroup = {
      id: dmId,
      name: `${targetUser.name}`,
      description: `Direct private conversation with ${targetUser.name} (${targetUser.department || 'Team'})`,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      memberIds: [currentUser.id, targetUserId],
      isDirect: true,
      directUserIds: [currentUser.id, targetUserId],
      avatar: targetUser.avatarUrl,
      lastMessage: {
        text: 'Started direct conversation',
        senderName: 'System',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };

    const updatedGroups = [newDmGroup, ...groups];
    syncGroups(updatedGroups);
    setActiveGroupId(dmId);
    return dmId;
  }, [currentUser, users, groups, syncGroups]);

  // Send Message (supports text and/or image)
  const sendMessage = useCallback((groupId: string, text: string, imageUrl?: string) => {
    if (!currentUser) return;
    if (!text.trim() && !imageUrl) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();

    // STRICT: senderName must be employee NAME, NOT email!
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      groupId,
      senderId: currentUser.id,
      senderName: currentUser.name, // SHOW EMPLOYEE NAME, NOT EMAIL!
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      text: text.trim(),
      imageUrl: imageUrl || undefined,
      timestamp: timeStr,
      createdAt: nowIso,
      isSystem: false
    };

    // 1. Optimistic append to messages array immediately
    syncMessages(prev => [...prev, newMsg]);

    // 2. Optimistic update to group lastMessage
    syncGroups(prevGroups => {
      const targetGroup = prevGroups.find(g => g.id === groupId);
      if (targetGroup) {
        sendDesktopPushNotification(targetGroup.name, {
          body: `${currentUser.name}: ${imageUrl ? '📷 Image shared' : text.trim()}`,
          tag: groupId
        });
      }
      return prevGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            lastMessage: {
              text: imageUrl ? '📷 [Image shared]' : text.trim(),
              senderName: currentUser.name,
              timestamp: timeStr
            }
          };
        }
        return g;
      });
    });

    // 3. Instant WebSocket broadcast to other active terminals
    broadcastRealtimeEvent('chat_msg', newMsg);

    // 4. Audio chime feedback
    playGlassChime('click');
  }, [currentUser, syncMessages, syncGroups]);

  // Edit Message
  const editMessage = useCallback((messageId: string, newText: string) => {
    if (!currentUser || !newText.trim()) return;

    const editedAt = new Date().toISOString();
    syncMessages(prev => prev.map(m => {
      if (m.id === messageId && m.senderId === currentUser.id) {
        return { ...m, text: newText.trim(), editedAt };
      }
      return m;
    }));

    // Broadcast edit event
    broadcastRealtimeEvent('chat_msg', {
      action: 'edit',
      messageId,
      text: newText.trim(),
      editedAt
    });

    showNotification('Message Updated', 'Your message was successfully edited.', 'success');
  }, [currentUser, syncMessages, showNotification]);

  // Delete Message
  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser) return;

    syncMessages(prev => prev.map(m => {
      if (m.id === messageId && m.senderId === currentUser.id) {
        return {
          ...m,
          isDeleted: true,
          text: 'This message was deleted'
        };
      }
      return m;
    }));

    // Broadcast delete event
    broadcastRealtimeEvent('chat_msg', {
      action: 'delete',
      messageId
    });

    showNotification('Message Deleted', 'Your message was removed.', 'info');
  }, [currentUser, syncMessages, showNotification]);

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

  // Filter groups visible to current user (creator, member, direct chat, or pending invitee)
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
        openOrCreateDirectChat,
        inviteMemberByEmail,
        acceptInvitation,
        declineInvitation,
        sendMessage,
        editMessage,
        deleteMessage,
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
