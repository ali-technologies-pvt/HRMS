'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import {
  MessageSquare,
  Users,
  Plus,
  Send,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Search,
  UserPlus,
  X,
  Mail,
  Sparkles,
  ShieldCheck,
  Smile,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatChatTimestamp } from '@/lib/utils';
import {
  ImageIcon,
  Edit2,
  Trash2,
  User
} from 'lucide-react';

export function ChatDesk() {
  const { currentUser, users } = useAuth();
  const {
    groups,
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
    enableDesktopPush
  } = useChat();
  const { showNotification } = useNotifications();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  // Add Member Form State
  const [memberEmailToAdd, setMemberEmailToAdd] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isManagerOrAdmin =
    currentUser?.role === 'manager' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'manager_hr';

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeGroupMessages]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !messageText.trim()) return;
    sendMessage(activeGroupId, messageText.trim());
    setMessageText('');
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showNotification('Missing Title', 'Please enter a group name.', 'warning');
      return;
    }

    const res = createGroup(newGroupName, newGroupDesc, selectedEmails);
    if (res.success) {
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedEmails([]);
      setEmailInput('');
      setShowCreateGroupModal(false);
    } else {
      showNotification('Error', res.error || 'Failed to create group', 'warning');
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !memberEmailToAdd.trim()) return;

    const res = inviteMemberByEmail(activeGroupId, memberEmailToAdd.trim());
    if (res.success) {
      setMemberEmailToAdd('');
      setShowAddMemberModal(false);
    } else {
      showNotification('Invite Failed', res.error || 'Could not send invitation', 'warning');
    }
  };

  const toggleSelectEmail = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  // Filter groups
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available employees for manager to invite
  const availableEmployees = users.filter(u => u.id !== currentUser.id);

  // Member names in active group (Names only, NOT emails!)
  const activeGroupMemberNames = activeGroup
    ? activeGroup.memberIds
        .map(id => users.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="space-y-4">
      {/* Top Banner with Push Notification status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 liquid-glass-elevated border border-slate-200/80 dark:border-white/10 rounded-[4px] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Team Live Chat
              </h2>
              <span className="px-1.5 py-0.2 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 rounded-[2px] font-bold">
                WhatsApp Pods
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time collaboration pods with native laptop desktop push notifications.
            </p>
          </div>
        </div>

        {/* Laptop Desktop Push Notification Button */}
        <div className="flex items-center gap-2">
          {desktopPushStatus === 'granted' ? (
            <div className="px-3 py-1.5 rounded-[2px] bg-emerald-500/10 border border-emerald-400/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-emerald-500" />
              <span>Laptop Push Active</span>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={enableDesktopPush}
              className="px-3 py-1.5 rounded-[2px] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>Enable Laptop Push Alerts</span>
            </motion.button>
          )}

          {isManagerOrAdmin && (
            <LiquidButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setNewGroupName('');
                setNewGroupDesc('');
                setSelectedEmails([]);
                setShowCreateGroupModal(true);
              }}
            >
              + New Group
            </LiquidButton>
          )}
        </div>
      </div>

      {/* Main WhatsApp-Style Dual Pane Window */}
      <div className="h-[750px] max-h-[80vh] flex flex-col md:flex-row border border-slate-200/90 dark:border-white/10 rounded-[4px] overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
        {/* ======================================================== */}
        {/* LEFT PANE: GROUPS LIST & PENDING INVITATIONS             */}
        {/* ======================================================== */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-white/10 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full glass-input pl-8 pr-3 py-1.5 text-xs font-sans"
              />
            </div>
          </div>

          {/* Pending Invitations Banner for Current User */}
          {pendingInvitations.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <Mail className="w-3.5 h-3.5" />
                <span>Pending Group Invitations ({pendingInvitations.length})</span>
              </div>
              <div className="space-y-1.5">
                {pendingInvitations.map(inv => (
                  <div
                    key={inv.id}
                    className="p-2 rounded-[2px] bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700/40 space-y-1 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {inv.groupName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Invited by: <strong>{inv.invitedByName}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => acceptInvitation(inv.id)}
                        className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1px] font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept & Join</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => declineInvitation(inv.id)}
                        className="py-1 px-2 border border-slate-300 dark:border-white/20 text-slate-500 hover:text-rose-600 rounded-[1px] font-bold text-[10px]"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/5">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No active groups</p>
                <p className="text-[11px]">
                  {isManagerOrAdmin
                    ? 'Click "+ New Group" above to start a team chat pod.'
                    : 'Your manager will add you to team groups.'}
                </p>
              </div>
            ) : (
              filteredGroups.map(grp => {
                const isSelected = grp.id === activeGroupId;
                const initials = grp.name
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setActiveGroupId(grp.id)}
                    className={`w-full p-3 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-sky-500/10 dark:bg-sky-500/15 border-l-4 border-sky-500 text-slate-900 dark:text-white'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Gradient Avatar */}
                    <div className="w-10 h-10 rounded-[3px] bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate text-slate-900 dark:text-white">
                          {grp.name}
                        </span>
                        {grp.lastMessage && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {grp.lastMessage.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {grp.lastMessage ? (
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">{grp.lastMessage.senderName}:</strong> {grp.lastMessage.text}
                          </span>
                        ) : (
                          <span className="italic">{grp.description || 'No messages yet'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {grp.memberIds.length} member{grp.memberIds.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: ACTIVE CHAT CONVERSATION                     */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
          {activeGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[3px] bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                    {activeGroup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {activeGroup.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={activeGroupMemberNames}>
                      {activeGroupMemberNames ? `Participants: ${activeGroupMemberNames}` : activeGroup.description}
                    </p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Manager Add Member Button */}
                  {isManagerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberEmailToAdd('');
                        setShowAddMemberModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-[2px] bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-700 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Member</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafbfe] dark:bg-[#080b12]">
                {/* Date Header */}
                <div className="text-center my-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-mono uppercase font-bold">
                    Group Discussion Active
                  </span>
                </div>

                {activeGroupMessages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-mono space-y-1">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-slate-700 dark:text-slate-300 font-semibold">No messages in this pod yet.</p>
                    <p className="text-[11px]">Send a greeting to start the conversation!</p>
                  </div>
                ) : (
                  activeGroupMessages.map((msg) => {
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="px-3 py-1 rounded-[2px] bg-slate-200/50 dark:bg-slate-800/80 border border-slate-300/40 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-mono inline-flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-sky-500" />
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    const isMe = msg.senderId === currentUser?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar for incoming */}
                        {!isMe && (
                          <img
                            src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={msg.senderName}
                            className="w-7 h-7 rounded-[2px] object-cover border border-slate-200 dark:border-white/10 shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-[75%] sm:max-w-md rounded-[3px] p-3 shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {/* STRICT: Display employee NAME, NOT email! */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1 pb-0.5 border-b border-slate-100 dark:border-white/5">
                              <span className="font-bold text-[11px] text-sky-600 dark:text-cyan-400">
                                {msg.senderName}
                              </span>
                              {msg.senderRole && (
                                <span className="text-[9px] font-mono px-1 rounded-[1px] bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 uppercase">
                                  {msg.senderRole.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Attached Image (if present) */}
                          {msg.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={msg.imageUrl}
                                alt="Shared image"
                                className="max-h-60 rounded-[2px] object-cover border border-white/20"
                              />
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.isDeleted ? (
                            <p className="text-xs italic text-slate-400">
                              This message was deleted
                            </p>
                          ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap select-text font-sans">
                              {msg.text}
                            </p>
                          )}

                          {/* Timestamp, Edit Tag & Read Checkmark */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                              isMe ? 'text-sky-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatChatTimestamp(msg.timestamp, msg.createdAt)}</span>
                            {msg.editedAt && <span className="text-[9px] italic">(edited)</span>}
                            {isMe && <CheckCheck className="w-3 h-3 text-sky-200" />}
                            {(isMe || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && !msg.isDeleted && (
                              <button
                                type="button"
                                onClick={() => deleteMessage(msg.id)}
                                className="ml-1 text-slate-400 hover:text-rose-400"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${activeGroup.name}... (Press Enter)`}
                    className="flex-1 glass-input px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  />

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="submit"
                    disabled={!messageText.trim()}
                    className="py-2.5 px-4 rounded-[2px] bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            /* Empty State when no group selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-[4px] bg-sky-500/10 dark:bg-cyan-500/15 border border-sky-400/30 flex items-center justify-center text-sky-600 dark:text-cyan-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Welcome to quickslogx Team Live Chat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Managers can create WhatsApp-style pod groups and invite team members by corporate email. Select a conversation or start a new group.
              </p>
              {isManagerOrAdmin && (
                <LiquidButton
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  Create Pod Group
                </LiquidButton>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE NEW POD GROUP (Manager Only)              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateGroupModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/50 dark:border-cyan-500/40 p-6 rounded-[4px] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/40 text-sky-600 dark:text-cyan-400 rounded-[3px]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create WhatsApp-Style Group
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add team members by their corporate emails. In-app invitations will be dispatched automatically.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Core Engineering Sprint"
                    className="w-full glass-input px-3 py-2 text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Group Purpose / Topic
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g. Daily agile coordination & architecture review"
                    className="w-full glass-input px-3 py-2 text-xs font-sans"
                  />
                </div>

                {/* Add employees by email */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Invite Employees by Email
                  </label>
                  <div className="p-3 border border-slate-200 dark:border-white/10 rounded-[3px] space-y-2 max-h-48 overflow-y-auto bg-black/[0.02] dark:bg-white/[0.02]">
                    {availableEmployees.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-2">
                        No other employees registered yet. You can still create the group and invite members later.
                      </p>
                    ) : (
                      availableEmployees.map(emp => {
                        const isChecked = selectedEmails.includes(emp.email);
                        return (
                          <label
                            key={emp.id}
                            className={`flex items-center justify-between p-2 rounded-[2px] cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-400/40 text-slate-900 dark:text-white'
                                : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectEmail(emp.email)}
                                className="w-3.5 h-3.5 rounded-[2px] text-sky-600 focus:ring-sky-500"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs font-sans truncate">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{emp.email}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[1px] bg-black/[0.04] dark:bg-white/[0.06] text-slate-500">
                              {emp.role.replace('_', ' ')}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <LiquidButton variant="primary" size="md" type="submit">
                    Create Group & Dispatch Invites
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: INVITE MEMBER BY EMAIL TO ACTIVE GROUP           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showAddMemberModal && activeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemberModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-sky-400/50 dark:border-cyan-500/40 p-6 rounded-[4px] shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/40 text-sky-600 dark:text-cyan-400 rounded-[3px]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Add Member to "{activeGroup.name}"
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter the employee's email. An invitation card will be sent to their app.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Employee Corporate Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={memberEmailToAdd}
                      onChange={(e) => setMemberEmailToAdd(e.target.value)}
                      placeholder="employee@quickslogix.com"
                      className="w-full glass-input pl-9 pr-3 py-2 text-xs font-sans"
                    />
                  </div>
                </div>

                {/* Show employee name if matched */}
                {memberEmailToAdd && (
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 rounded-[2px] text-xs">
                    {(() => {
                      const matched = users.find(u => u.email.toLowerCase() === memberEmailToAdd.trim().toLowerCase());
                      if (matched) {
                        return (
                          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>Matched: <strong>{matched.name}</strong> ({matched.designation})</span>
                          </div>
                        );
                      }
                      return (
                        <span className="text-slate-500 font-mono">Searching employee directory...</span>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <LiquidButton variant="primary" size="md" type="submit">
                    Send Invitation
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
