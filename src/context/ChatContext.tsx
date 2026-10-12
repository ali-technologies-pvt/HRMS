'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { ChatGroup, ChatMessage, GroupInvitation, User } from '@/types';
import { initialChatGroups, initialChatMessages } from '@/lib/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { playGlassChime, playIncomingChatSound } from '@/lib/utils';
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
  markGroupAsRead: (groupId: string) => void;
  getGroupUnreadCount: (groupId: string) => number;
  totalUnreadChatCount: number;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, users } = useAuth();
  const { showNotification } = useNotifications();

  const [groups, setGroups] = useState<ChatGroup[]>(initialChatGroups);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [desktopPushStatus, setDesktopPushStatus] = useState<NotificationPermission>('default');
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const isChatPollingRef = useRef(false);
  const lastChatSyncRef = useRef(Date.now());
  const isChatOpenRef = useRef(false);
  const activeGroupIdRef = useRef<string | null>(null);
  const groupsRef = useRef<ChatGroup[]>(initialChatGroups);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  // Load user read receipts on auth change
  useEffect(() => {
    if (currentUser?.id) {
      const receipts = loadFromStorage<Record<string, string>>(
        `${STORAGE_KEYS.CHAT_READ_RECEIPTS}_${currentUser.id}`,
        {}
      );
      setReadReceipts(receipts);
    }
  }, [currentUser?.id]);

  // Initialize storage & cloud sync
  useEffect(() => {
    // 1. Load persistent deleted message IDs tombstone
    const initialDeleted = loadFromStorage<string[]>(STORAGE_KEYS.CHAT_DELETED_IDS, []);
    initialDeleted.forEach(id => { if (id) deletedIdsRef.current.add(id); });

    const loadedGroups = loadFromStorage<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS, initialChatGroups);
    const rawLoadedMessages = loadFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);

    // Clean loaded messages: eliminate deleted messages and capture any with isDeleted
    const loadedMessages = rawLoadedMessages.filter(m => {
      if (!m?.id) return false;
      if (m.isDeleted) {
        deletedIdsRef.current.add(m.id);
        return false;
      }
      return !deletedIdsRef.current.has(m.id);
    });

    saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, loadedMessages);

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
        const [cloudGroups, cloudMessages, cloudDeleted] = await Promise.all([
          fetchCollectionFromSupabase<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS),
          fetchCollectionFromSupabase<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES),
          fetchCollectionFromSupabase<string[]>(STORAGE_KEYS.CHAT_DELETED_IDS)
        ]);

        if (cloudDeleted && Array.isArray(cloudDeleted)) {
          cloudDeleted.forEach(id => { if (id) deletedIdsRef.current.add(id); });
          saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));
        } else if (deletedIdsRef.current.size > 0) {
          pushCollectionToSupabase(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current)).catch(console.warn);
        }

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
          setMessages(prev => {
            const map = new Map<string, ChatMessage>();
            cloudMessages.forEach(m => {
              if (m?.id) {
                if (m.isDeleted || deletedIdsRef.current.has(m.id)) {
                  deletedIdsRef.current.add(m.id);
                } else {
                  map.set(m.id, m);
                }
              }
            });
            prev.forEach(m => {
              if (m?.id && !m.isDeleted && !deletedIdsRef.current.has(m.id) && !map.has(m.id)) {
                map.set(m.id, m);
              }
            });
            const merged = Array.from(map.values());
            saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, merged);
            saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));
            return merged;
          });
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

      // Handle message edit event
      if (payload.action === 'edit' && payload.messageId) {
        setMessages(prev => {
          const next = prev.map(m => m.id === payload.messageId ? { ...m, text: payload.text, editedAt: payload.editedAt } : m);
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
          return next;
        });
        return;
      }

      // Handle message delete event
      if (payload.action === 'delete' && payload.messageId) {
        deletedIdsRef.current.add(payload.messageId);
        saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));

        setMessages(prev => {
          const next = prev.filter(m => m.id !== payload.messageId);
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
          return next;
        });

        if (payload.groupId) {
          setGroups(prevGroups => {
            return prevGroups.map(g => {
              if (g.id === payload.groupId) {
                const remaining = messages.filter(m => m.groupId === payload.groupId && m.id !== payload.messageId);
                const lastMsg = remaining[remaining.length - 1];
                return {
                  ...g,
                  lastMessage: lastMsg ? {
                    text: lastMsg.imageUrl ? '📷 [Image shared]' : lastMsg.text,
                    senderName: lastMsg.senderName,
                    timestamp: lastMsg.timestamp
                  } : undefined
                };
              }
              return g;
            });
          });
        }
        return;
      }

      const incomingMsg = payload as ChatMessage;
      if (!incomingMsg.id) return;
      if (incomingMsg.isDeleted || deletedIdsRef.current.has(incomingMsg.id)) return;
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

      // If active conversation is currently open and in focus, mark as read immediately
      if (
        isChatOpenRef.current &&
        activeGroupIdRef.current === incomingMsg.groupId &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        if (currentUser?.id) {
          const nowIso = new Date().toISOString();
          setReadReceipts(prev => {
            const next = { ...prev, [incomingMsg.groupId]: nowIso };
            saveToStorage(`${STORAGE_KEYS.CHAT_READ_RECEIPTS}_${currentUser.id}`, next);
            return next;
          });
        }
      }

      // 1. Play crystal-clear glass chime alert
      playIncomingChatSound();

      // 2. Resolve clean group or sender title for push notification
      const targetGroup = groupsRef.current.find(g => g.id === incomingMsg.groupId);
      const notifTitle = targetGroup?.isDirect
        ? (incomingMsg.senderName || 'Direct Message')
        : (targetGroup ? `#${targetGroup.name}` : (incomingMsg.senderName || 'Team Chat'));

      // 3. Desktop Native Push Notification
      sendDesktopPushNotification(notifTitle, {
        body: `${incomingMsg.senderName}: ${incomingMsg.imageUrl ? '📷 [Image shared]' : incomingMsg.text}`,
        tag: incomingMsg.groupId,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { groupId: incomingMsg.groupId }
      });
    });

    // 2. Realtime collections listener for chat groups & bulk messages
    const unsubscribeCollections = subscribeToCollectionChange((key, data) => {
      if (key === STORAGE_KEYS.CHAT_DELETED_IDS && Array.isArray(data)) {
        data.forEach((id: string) => { if (id) deletedIdsRef.current.add(id); });
        saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));
        setMessages(prev => {
          const next = prev.filter(m => !deletedIdsRef.current.has(m.id));
          if (next.length !== prev.length) {
            saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, next);
            return next;
          }
          return prev;
        });
      }

      if (key === STORAGE_KEYS.CHAT_GROUPS && Array.isArray(data)) {
        setGroups(prevGroups => {
          const map = new Map<string, ChatGroup>();
          data.forEach((g: ChatGroup) => map.set(g.id, g));
          prevGroups.forEach(g => { if (!map.has(g.id)) map.set(g.id, g); });
          const merged = Array.from(map.values());
          saveToStorage(STORAGE_KEYS.CHAT_GROUPS, merged);
          return merged;
        });
      }

      if (key === STORAGE_KEYS.CHAT_MESSAGES && Array.isArray(data)) {
        setMessages(prev => {
          const map = new Map<string, ChatMessage>();
          data.forEach((m: ChatMessage) => {
            if (m?.id) {
              if (m.isDeleted || deletedIdsRef.current.has(m.id)) {
                deletedIdsRef.current.add(m.id);
              } else {
                map.set(m.id, m);
              }
            }
          });
          // Preserve any local optimistic messages not yet reflected in incoming data
          prev.forEach(m => {
            if (m?.id && !m.isDeleted && !deletedIdsRef.current.has(m.id) && !map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          const merged = Array.from(map.values());
          saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, merged);
          return merged;
        });
      }
    });

    // 3. Gentle background sync polling (runs every 20s when visible, guarded to avoid blocking Chrome)
    const performChatSync = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (isChatPollingRef.current) return;
      isChatPollingRef.current = true;
      try {
        const [cloudMessages, cloudGroups, cloudDeleted] = await Promise.all([
          fetchCollectionFromSupabase<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES),
          fetchCollectionFromSupabase<ChatGroup[]>(STORAGE_KEYS.CHAT_GROUPS),
          fetchCollectionFromSupabase<string[]>(STORAGE_KEYS.CHAT_DELETED_IDS)
        ]);

        if (cloudDeleted && Array.isArray(cloudDeleted)) {
          let hasNew = false;
          cloudDeleted.forEach(id => {
            if (id && !deletedIdsRef.current.has(id)) {
              deletedIdsRef.current.add(id);
              hasNew = true;
            }
          });
          if (hasNew) {
            saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, Array.from(deletedIdsRef.current));
            setMessages(prev => prev.filter(m => !deletedIdsRef.current.has(m.id)));
          }
        }

        if (cloudMessages && Array.isArray(cloudMessages)) {
          setMessages(prev => {
            const map = new Map<string, ChatMessage>();
            cloudMessages.forEach(m => {
              if (m?.id) {
                if (m.isDeleted || deletedIdsRef.current.has(m.id)) {
                  deletedIdsRef.current.add(m.id);
                } else {
                  map.set(m.id, m);
                }
              }
            });
            // ALWAYS keep optimistic/locally sent messages
            prev.forEach(m => {
              if (m?.id && !m.isDeleted && !deletedIdsRef.current.has(m.id) && !map.has(m.id)) {
                map.set(m.id, m);
              }
            });
            const merged = Array.from(map.values());
            if (merged.length !== prev.length) {
              saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, merged);
              return merged;
            }
            return prev;
          });
        }

        if (cloudGroups && Array.isArray(cloudGroups)) {
          setGroups(prev => {
            const map = new Map<string, ChatGroup>();
            cloudGroups.forEach(g => { if (g?.id) map.set(g.id, g); });
            prev.forEach(g => { if (g?.id && !map.has(g.id)) map.set(g.id, g); });
            const merged = Array.from(map.values());
            if (merged.length !== prev.length) {
              saveToStorage(STORAGE_KEYS.CHAT_GROUPS, merged);
              return merged;
            }
            return prev;
          });
        }
        lastChatSyncRef.current = Date.now();
      } catch {} finally {
        isChatPollingRef.current = false;
      }
    };

    const pollInterval = setInterval(performChatSync, 20000);

    const handleChatFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (Date.now() - lastChatSyncRef.current > 15000) {
          performChatSync();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleChatFocus);
      document.addEventListener('visibilitychange', handleChatFocus);
    }

    return () => {
      unsubscribeChatMsg();
      unsubscribeCollections();
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleChatFocus);
        document.removeEventListener('visibilitychange', handleChatFocus);
      }
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

  // Delete Message permanently
  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser) return;

    // 1. Add to persistent tombstone set
    deletedIdsRef.current.add(messageId);
    const updatedDeleted = Array.from(deletedIdsRef.current);
    saveToStorage(STORAGE_KEYS.CHAT_DELETED_IDS, updatedDeleted);
    pushCollectionToSupabase(STORAGE_KEYS.CHAT_DELETED_IDS, updatedDeleted).catch(console.warn);

    // 2. Identify target group for lastMessage calculation
    let targetGroupId = '';

    // 3. Remove message completely from state, localStorage & Supabase
    syncMessages(prev => {
      const target = prev.find(m => m.id === messageId);
      if (target) {
        targetGroupId = target.groupId;
      }
      return prev.filter(m => m.id !== messageId);
    });

    // 4. Instant WebSocket broadcast to other active users/devices
    broadcastRealtimeEvent('chat_msg', {
      action: 'delete',
      messageId,
      groupId: targetGroupId
    });

    // 5. Update group's last message if the deleted message was the last one
    if (targetGroupId) {
      syncGroups(prevGroups => {
        const remaining = messages.filter(m => m.groupId === targetGroupId && m.id !== messageId);
        const lastMsg = remaining[remaining.length - 1];

        return prevGroups.map(g => {
          if (g.id === targetGroupId) {
            return {
              ...g,
              lastMessage: lastMsg ? {
                text: lastMsg.imageUrl ? '📷 [Image shared]' : lastMsg.text,
                senderName: lastMsg.senderName,
                timestamp: lastMsg.timestamp
              } : undefined
            };
          }
          return g;
        });
      });
    }

    showNotification('Message Deleted', 'Message deleted permanently.', 'info');
  }, [currentUser, syncMessages, syncGroups, messages, showNotification]);

  // Get active group messages (strictly excluding any deleted messages)
  const activeGroupMessages = messages.filter(
    m => m.groupId === activeGroupId && !m.isDeleted && !deletedIdsRef.current.has(m.id)
  );

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

  const markGroupAsRead = useCallback((groupId: string) => {
    if (!currentUser?.id || !groupId) return;
    const nowIso = new Date().toISOString();
    setReadReceipts(prev => {
      const next = { ...prev, [groupId]: nowIso };
      saveToStorage(`${STORAGE_KEYS.CHAT_READ_RECEIPTS}_${currentUser.id}`, next);
      return next;
    });
  }, [currentUser?.id]);

  const getGroupUnreadCount = useCallback((groupId: string): number => {
    if (!currentUser?.id || !groupId) return 0;
    const lastReadIso = readReceipts[groupId];
    const lastReadTime = lastReadIso ? new Date(lastReadIso).getTime() : 0;

    return messages.filter(m => {
      if (m.groupId !== groupId) return false;
      if (m.isDeleted || deletedIdsRef.current.has(m.id)) return false;
      if (m.senderId === currentUser.id) return false;
      if (m.isSystem) return false;
      const msgTime = new Date(m.createdAt || m.timestamp).getTime();
      if (isNaN(msgTime)) return false;
      return msgTime > lastReadTime;
    }).length;
  }, [currentUser?.id, readReceipts, messages]);

  const totalUnreadChatCount = useMemo(() => {
    if (!currentUser) return 0;
    let unreadCount = 0;
    visibleGroups.forEach(g => {
      unreadCount += getGroupUnreadCount(g.id);
    });
    return unreadCount + pendingInvitations.length;
  }, [currentUser, visibleGroups, getGroupUnreadCount, pendingInvitations]);

  const handleSetActiveGroupId = useCallback((id: string | null) => {
    setActiveGroupId(id);
    activeGroupIdRef.current = id;
    if (id) {
      markGroupAsRead(id);
    }
  }, [markGroupAsRead]);

  const handleSetIsChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    isChatOpenRef.current = open;
    if (open && activeGroupIdRef.current) {
      markGroupAsRead(activeGroupIdRef.current);
    }
  }, [markGroupAsRead]);

  return (
    <ChatContext.Provider
      value={{
        groups: visibleGroups,
        messages,
        activeGroupId,
        setActiveGroupId: handleSetActiveGroupId,
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
        markGroupAsRead,
        getGroupUnreadCount,
        totalUnreadChatCount,
        isChatOpen,
        setIsChatOpen: handleSetIsChatOpen
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
