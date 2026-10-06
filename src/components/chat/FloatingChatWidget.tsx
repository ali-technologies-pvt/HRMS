'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatChatTimestamp } from '@/lib/utils';
import {
  MessageSquare,
  X,
  Send,
  Users,
  Plus,
  Minimize2,
  Maximize2,
  Search,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Hash,
  User,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  Smile,
  Paperclip
} from 'lucide-react';

export function FloatingChatWidget() {
  const { currentUser, users } = useAuth();
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    createGroup,
    openOrCreateDirectChat,
    sendMessage,
    editMessage,
    deleteMessage,
    activeGroupMessages,
    totalUnreadChatCount
  } = useChat();
  const { showNotification } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'channels' | 'direct'>('channels');
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showDirectUserModal, setShowDirectUserModal] = useState(false);
  const [directSearchQuery, setDirectSearchQuery] = useState('');

  // Create Channel Form State
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Image Upload State
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeGroupMessages, isOpen, isMinimized]);

  if (!currentUser) return null;

  // Handle Send Message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedImageBase64) return;
    const targetGroupId = activeGroupId || groups[0]?.id;
    if (!targetGroupId) return;

    sendMessage(targetGroupId, messageText.trim(), selectedImageBase64 || undefined);
    setMessageText('');
    setSelectedImageBase64(null);
  };

  // Handle Image File Select
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Invalid File', 'Please select an image file (PNG, JPG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('File Too Large', 'Please select an image under 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImageBase64(reader.result);
        showNotification('Image Attached', 'Image ready to send with your message.', 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Create Channel
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createGroup(newChannelName.trim(), newChannelDesc.trim() || 'Workstream channel', []);
    setNewChannelName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
    showNotification('Channel Created', `Channel #${newChannelName.trim()} is now active.`, 'success');
  };

  // Start Direct Chat with Employee
  const handleStartDirectChat = (targetUserId: string) => {
    const dmId = openOrCreateDirectChat(targetUserId);
    if (dmId) {
      setShowDirectUserModal(false);
      setShowChannelDropdown(false);
      setActiveTab('direct');
      const targetUser = users.find(u => u.id === targetUserId);
      showNotification('1-on-1 Chat', `Private chat with ${targetUser?.name || 'team member'} active.`, 'success');
    }
  };

  // Handle Edit Submit
  const handleSaveEdit = (messageId: string) => {
    if (!editingText.trim()) return;
    editMessage(messageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText('');
  };

  // Filter colleague list for 1-on-1 search
  const colleagues = users.filter(u =>
    u.id !== currentUser.id &&
    (u.name.toLowerCase().includes(directSearchQuery.toLowerCase()) ||
     (u.department && u.department.toLowerCase().includes(directSearchQuery.toLowerCase())))
  );

  // Separate channel groups vs direct messages
  const channelGroups = groups.filter(g => !g.isDirect);
  const directGroups = groups.filter(g => g.isDirect);

  return (
    <>
      {/* Hidden file input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* 1. FLOATING CHAT BUTTON (Fixed bottom-6 right-6) */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }}
          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-[0_10px_35px_-5px_rgba(14,165,233,0.35)] transition-all ${
            isOpen
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-700 dark:border-slate-200'
              : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border border-sky-300/40 hover:brightness-110'
          }`}
          title="Team Live Chat"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}

          <span className="text-xs font-bold font-sans tracking-wide pr-1">
            {isOpen ? 'Close Chat' : 'Team Chat'}
          </span>

          {/* Unread Message Ping Badge */}
          {totalUnreadChatCount > 0 && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full shadow-[0_0_10px_#f43f5e] animate-bounce">
              {totalUnreadChatCount}
            </span>
          )}

          {/* Subtle Live LED */}
          {!isOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          )}
        </motion.button>
      </div>

      {/* 2. FLOATING CHAT WINDOW DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 56 : 600
            }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] sm:w-[420px] bg-white/95 dark:bg-[#0f1422]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden"
          >
            {/* Window Header */}
            <div className="p-3 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
              {/* Channel / DM Selector Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors"
                >
                  {activeGroup?.isDirect ? (
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-sky-500" />
                  )}
                  <span className="truncate max-w-[140px] sm:max-w-[170px]">
                    {activeGroup?.isDirect ? `${activeGroup.name}` : `#${activeGroup?.name || 'General'}`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu (Channels + 1-on-1 DMs) */}
                <AnimatePresence>
                  {showChannelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-10 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-40 text-xs"
                    >
                      {/* Tabs: Channels vs 1-on-1 DMs */}
                      <div className="flex items-center border-b border-slate-100 dark:border-white/5 px-2 pb-1.5 mb-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('channels')}
                          className={`flex-1 py-1 rounded text-[11px] font-bold text-center transition-colors ${
                            activeTab === 'channels'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-cyan-400'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Channels ({channelGroups.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('direct')}
                          className={`flex-1 py-1 rounded text-[11px] font-bold text-center transition-colors ${
                            activeTab === 'direct'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          1-on-1 DMs ({directGroups.length})
                        </button>
                      </div>

                      {/* Channels List */}
                      {activeTab === 'channels' ? (
                        <>
                          <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                            <span>Workstream Pods</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowChannelDropdown(false);
                                setShowCreateChannelModal(true);
                              }}
                              className="text-sky-500 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> New
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto py-1">
                            {channelGroups.map((grp) => (
                              <button
                                key={grp.id}
                                type="button"
                                onClick={() => {
                                  setActiveGroupId(grp.id);
                                  setShowChannelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${
                                  activeGroupId === grp.id
                                    ? 'bg-sky-50 dark:bg-sky-950/30 font-bold text-sky-600 dark:text-cyan-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                                  {grp.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {grp.memberIds?.length || 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        /* Direct Messages List */
                        <>
                          <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                            <span>Direct Conversations</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowChannelDropdown(false);
                                setShowDirectUserModal(true);
                              }}
                              className="text-indigo-500 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> Start DM
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto py-1">
                            {directGroups.length === 0 ? (
                              <div className="px-3 py-3 text-center text-slate-400 text-[11px]">
                                No direct chats yet. Click "+ Start DM" to message any employee!
                              </div>
                            ) : (
                              directGroups.map((grp) => (
                                <button
                                  key={grp.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveGroupId(grp.id);
                                    setShowChannelDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${
                                    activeGroupId === grp.id
                                      ? 'bg-indigo-50 dark:bg-indigo-950/30 font-bold text-indigo-600 dark:text-indigo-400'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                    {grp.name}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status & Control Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowDirectUserModal(true)}
                  title="Direct Message Someone"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold pr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>

                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* If not minimized, show Messages Feed and Input */}
            {!isMinimized && (
              <>
                {/* Messages Feed */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs">
                  {activeGroupMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                        {activeGroup?.isDirect ? <User className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {activeGroup?.isDirect ? `Private Chat with ${activeGroup.name}` : `#${activeGroup?.name || 'General'}`}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Start the conversation! Realtime messages are delivered instantly without page reload.
                      </p>
                    </div>
                  ) : (
                    activeGroupMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      const isEditing = editingMessageId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`group/msg flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <img
                            src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={msg.senderName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                          />

                          <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Sender Name + Clean Formatted Timestamp */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {isMe ? 'You' : msg.senderName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {formatChatTimestamp(msg.timestamp, msg.createdAt)}
                              </span>
                              {msg.editedAt && (
                                <span className="text-[8px] font-mono text-slate-400 italic">
                                  (edited)
                                </span>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div className="relative group/bubble">
                              {msg.isDeleted ? (
                                <div className="px-3 py-1.5 rounded-2xl text-[11px] italic bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
                                  This message was deleted
                                </div>
                              ) : isEditing ? (
                                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-sky-400 rounded-xl shadow-md">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-white outline-none w-44"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(msg.id);
                                      if (e.key === 'Escape') setEditingMessageId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(msg.id)}
                                    className="p-1 text-emerald-500 hover:text-emerald-600"
                                    title="Save Edit"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMessageId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className={`rounded-2xl text-xs leading-relaxed break-words shadow-sm overflow-hidden ${
                                    isMe
                                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-tr-none'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-white/5'
                                  }`}
                                >
                                  {/* Attached Image (if present) */}
                                  {msg.imageUrl && (
                                    <div className="p-1.5 pb-1">
                                      <img
                                        src={msg.imageUrl}
                                        alt="Shared"
                                        onClick={() => setPreviewImageModal(msg.imageUrl || null)}
                                        className="max-h-48 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                      />
                                    </div>
                                  )}

                                  {/* Message Text */}
                                  {msg.text && (
                                    <div className="px-3 py-2">
                                      {msg.text}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Hover Action Buttons (Edit & Delete for author) */}
                              {isMe && !msg.isDeleted && !isEditing && (
                                <div className="absolute top-1/2 -translate-y-1/2 -left-14 hidden group-hover/bubble:flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-1 shadow-md">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessageId(msg.id);
                                      setEditingText(msg.text);
                                    }}
                                    title="Edit Message"
                                    className="p-1 text-slate-400 hover:text-sky-500 rounded"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMessage(msg.id)}
                                    title="Delete Message"
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Attachment Preview Ribbon */}
                {selectedImageBase64 && (
                  <div className="px-3 py-1.5 bg-slate-100/90 dark:bg-white/[0.04] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedImageBase64}
                        alt="Preview"
                        className="w-8 h-8 rounded-lg object-cover border border-sky-400"
                      />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        1 Image Attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImageBase64(null)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remove Attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSend}
                  className="p-3 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2"
                >
                  {/* Photo Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Image"
                    className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={
                      activeGroup?.isDirect
                        ? `Message ${activeGroup.name}...`
                        : `Message #${activeGroup?.name || 'team'}...`
                    }
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() && !selectedImageBase64}
                    className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white disabled:opacity-40 transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* Modal: Direct Message Someone */}
            <AnimatePresence>
              {showDirectUserModal && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl p-4 w-full space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Start 1-on-1 Direct Chat
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDirectUserModal(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={directSearchQuery}
                        onChange={(e) => setDirectSearchQuery(e.target.value)}
                        placeholder="Search team member..."
                        className="w-full pl-8 pr-3 py-1.5 glass-input text-xs"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                      {colleagues.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-xs">
                          No team members found.
                        </div>
                      ) : (
                        colleagues.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleStartDirectChat(u.id)}
                            className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={u.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {u.department || 'Team'} • {u.role.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-indigo-500 hover:underline">
                              Chat →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal to Create Channel */}
            <AnimatePresence>
              {showCreateChannelModal && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl p-4 w-full space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Create Workstream Channel
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowCreateChannelModal(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateChannel} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="channel-name (e.g. backend-sprint)"
                        className="w-full glass-input px-3 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={newChannelDesc}
                        onChange={(e) => setNewChannelDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full glass-input px-3 py-1.5 text-xs"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCreateChannelModal(false)}
                          className="px-3 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow"
                        >
                          Create Channel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal: Fullscreen Image Preview */}
            <AnimatePresence>
              {previewImageModal && (
                <div
                  onClick={() => setPreviewImageModal(null)}
                  className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
                >
                  <img
                    src={previewImageModal}
                    alt="Enlarged preview"
                    className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal(null)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
