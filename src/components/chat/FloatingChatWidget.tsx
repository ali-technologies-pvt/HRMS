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
  ChevronLeft,
  ChevronDown,
  Hash,
  User,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Check as SingleCheck
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '😊', '🚀', '✅', '🙏'];

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
  
  // Navigation view: 'list' (WhatsApp chat list) vs 'chat' (Active conversation screen)
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Emoji picker bar toggle
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Image Upload State
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // Auto-scroll to bottom smoothly on every incoming or outgoing message
  useEffect(() => {
    if (isOpen && !isMinimized && currentView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeGroupMessages, isOpen, isMinimized, currentView]);

  // Focus input automatically when entering a chat
  useEffect(() => {
    if (isOpen && !isMinimized && currentView === 'chat') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized, currentView, activeGroupId]);

  if (!currentUser) return null;

  // Ultra-fluent message dispatch
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    const imageToSend = selectedImageBase64;

    if (!textToSend && !imageToSend) return;
    const targetGroupId = activeGroupId || groups[0]?.id;
    if (!targetGroupId) return;

    // Immediately clear input for 0ms lag WhatsApp feel
    setMessageText('');
    setSelectedImageBase64(null);
    setShowEmojiBar(false);

    // Dispatch atomically
    sendMessage(targetGroupId, textToSend, imageToSend || undefined);
    inputRef.current?.focus();
  };

  // Keyboard shortcut: Enter to send immediately
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        showNotification('Image Attached', 'Ready to send.', 'info');
        inputRef.current?.focus();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start Direct Chat with Employee
  const handleStartDirectChat = (targetUserId: string) => {
    const dmId = openOrCreateDirectChat(targetUserId);
    if (dmId) {
      setActiveGroupId(dmId);
      setCurrentView('chat');
      setShowNewChatModal(false);
      setSearchQuery('');
    }
  };

  // Handle Create Group Channel
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const res = createGroup(newGroupName.trim(), newGroupDesc.trim() || 'Workstream channel', []);
    if (res.success && res.group) {
      setActiveGroupId(res.group.id);
      setCurrentView('chat');
    }
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
    showNotification('Group Created', `Channel #${newGroupName.trim()} is ready.`, 'success');
  };

  // Handle Edit Submit
  const handleSaveEdit = (messageId: string) => {
    if (!editingText.trim()) return;
    editMessage(messageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText('');
  };

  // Filter groups for WhatsApp-style list
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.lastMessage?.text && g.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'direct') return g.isDirect;
    if (activeTab === 'groups') return !g.isDirect;
    return true;
  });

  // Colleague search for New Chat modal
  const colleagues = users.filter(u =>
    u.id !== currentUser.id &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())))
  );

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

      {/* 1. FLOATING CHAT BUTTON (WhatsApp / Teams style launcher) */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
            if (!isOpen && !activeGroupId && groups.length > 0) {
              setActiveGroupId(groups[0].id);
            }
          }}
          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-[0_12px_40px_-5px_rgba(16,185,129,0.35)] transition-all ${
            isOpen
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-700 dark:border-slate-200'
              : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 text-white border border-emerald-300/40 hover:brightness-110'
          }`}
          title="quickslogx Team Chat"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}

          <span className="text-xs font-bold font-sans tracking-wide pr-1">
            {isOpen ? 'Close' : 'Chat'}
          </span>

          {/* Unread Message Ping Badge */}
          {totalUnreadChatCount > 0 && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full shadow-[0_0_10px_#f43f5e] animate-bounce">
              {totalUnreadChatCount}
            </span>
          )}

          {!isOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_8px_#6ee7b7]" />
          )}
        </motion.button>
      </div>

      {/* 2. CHAT DRAWER: Clean WhatsApp / MS Teams Architecture */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 56 : 580
            }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] sm:w-[410px] bg-white dark:bg-[#0f1422] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
          >
            {/* ======================================================== */}
            {/* VIEW A: CHAT LIST SCREEN (WhatsApp Home Style)           */}
            {/* ======================================================== */}
            {currentView === 'list' && !isMinimized && (
              <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0f1422]">
                {/* Header */}
                <div className="p-3.5 bg-emerald-600 dark:bg-[#131b2e] text-white flex items-center justify-between shadow-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-200" />
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">Chats</h3>
                      <p className="text-[10px] text-emerald-100/80 font-mono">Live quickslogx Team Network</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNewChatModal(true)}
                      title="New Chat"
                      className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      title="Minimize"
                      className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      title="Close"
                      className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="p-2.5 bg-white dark:bg-[#0f1422] border-b border-slate-200/80 dark:border-white/10 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats or messages..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-white/[0.05] border border-transparent focus:border-emerald-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>

                  {/* Tabs: All / Direct / Groups */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        activeTab === 'all'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All ({groups.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('direct')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        activeTab === 'direct'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      1-on-1 ({groups.filter(g => g.isDirect).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('groups')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        activeTab === 'groups'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Groups ({groups.filter(g => !g.isDirect).length})
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {filteredGroups.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No chats found</p>
                      <p className="text-[11px] mt-1">Tap "+" above to start a direct message or create a group.</p>
                    </div>
                  ) : (
                    filteredGroups.map((grp) => {
                      const isDirect = grp.isDirect;
                      const otherUserId = isDirect ? grp.memberIds.find(id => id !== currentUser.id) : null;
                      const otherUser = otherUserId ? users.find(u => u.id === otherUserId) : null;
                      const avatar = isDirect ? (otherUser?.avatarUrl || grp.avatar) : grp.avatar;
                      const title = isDirect ? (otherUser?.name || grp.name) : grp.name;
                      const subtitle = grp.lastMessage?.text || (isDirect ? otherUser?.designation || 'Direct Chat' : grp.description);

                      return (
                        <div
                          key={grp.id}
                          onClick={() => {
                            setActiveGroupId(grp.id);
                            setCurrentView('chat');
                          }}
                          className="p-3 hover:bg-emerald-50/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer flex items-center gap-3"
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={title}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-white/10"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                {isDirect ? <User className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                              </div>
                            )}
                            {isDirect && (
                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0f1422] ${
                                  otherUser?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {isDirect ? title : `#${title}`}
                              </h4>
                              {grp.lastMessage?.timestamp && (
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {grp.lastMessage.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {grp.lastMessage?.senderName && isDirect ? '' : grp.lastMessage?.senderName ? `${grp.lastMessage.senderName}: ` : ''}
                              {subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom WhatsApp-style Action Strip */}
                <div className="p-3 bg-white dark:bg-[#0f1422] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(true)}
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>+ New Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center gap-1.5 text-sky-600 dark:text-cyan-400 font-bold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Group</span>
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW B: CONVERSATION SCREEN (WhatsApp Chat Style)        */}
            {/* ======================================================== */}
            {currentView === 'chat' && !isMinimized && (
              <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0a0e17]">
                {/* Chat Topbar */}
                <div className="p-2.5 bg-emerald-600 dark:bg-[#131b2e] text-white flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setCurrentView('list')}
                      title="Back to Chats list"
                      className="p-1 -ml-1 rounded-full hover:bg-white/15 text-white transition-colors flex items-center gap-0.5 text-xs font-bold"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Active Chat Avatar */}
                    {(() => {
                      const isDirect = activeGroup?.isDirect;
                      const otherUserId = isDirect ? activeGroup.memberIds.find(id => id !== currentUser.id) : null;
                      const otherUser = otherUserId ? users.find(u => u.id === otherUserId) : null;
                      const avatar = isDirect ? (otherUser?.avatarUrl || activeGroup?.avatar) : activeGroup?.avatar;
                      const name = isDirect ? (otherUser?.name || activeGroup?.name) : `#${activeGroup?.name || 'General'}`;

                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate leading-tight">{name}</h4>
                            <p className="text-[10px] text-emerald-100/80 font-mono truncate">
                              {isDirect ? (otherUser?.status === 'online' ? '● Online' : 'Offline') : `${activeGroup?.memberIds?.length || 1} members`}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Header actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      title="Minimize"
                      className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      title="Close"
                      className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Feed Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]">
                  {activeGroupMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {activeGroup?.isDirect ? `Direct Message` : `#${activeGroup?.name || 'General'}`}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Messages are delivered in real-time. Type below to begin!
                      </p>
                    </div>
                  ) : (
                    activeGroupMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      const isEditing = editingMessageId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`group/msg flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {!isMe && (
                            <img
                              src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={msg.senderName}
                              className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 border border-slate-200 dark:border-white/10"
                            />
                          )}

                          <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Group Sender Name */}
                            {!isMe && !activeGroup?.isDirect && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 ml-1 mb-0.5">
                                {msg.senderName}
                              </span>
                            )}

                            {/* Bubble */}
                            <div className="relative group/bubble">
                              {msg.isDeleted ? (
                                <div className="px-3 py-1.5 rounded-xl text-[11px] italic bg-slate-200/80 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
                                  This message was deleted
                                </div>
                              ) : isEditing ? (
                                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded-xl shadow-lg">
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
                                    className="p-1 text-emerald-600 hover:text-emerald-700"
                                    title="Save"
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
                                  className={`rounded-2xl px-3 py-2 text-xs leading-relaxed break-words shadow-xs overflow-hidden ${
                                    isMe
                                      ? 'bg-emerald-600 dark:bg-emerald-600 text-white rounded-br-xs'
                                      : 'bg-white dark:bg-[#1a2133] text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-white/5'
                                  }`}
                                >
                                  {/* Image Attachment */}
                                  {msg.imageUrl && (
                                    <div className="mb-1.5 -mx-1 -mt-1">
                                      <img
                                        src={msg.imageUrl}
                                        alt="Attachment"
                                        onClick={() => setPreviewImageModal(msg.imageUrl || null)}
                                        className="max-h-48 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity w-full"
                                      />
                                    </div>
                                  )}

                                  {/* Text */}
                                  {msg.text && (
                                    <p className="select-text whitespace-pre-wrap">{msg.text}</p>
                                  )}

                                  {/* Footer: Time + WhatsApp Double Tick */}
                                  <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                                    isMe ? 'text-emerald-100/90' : 'text-slate-400'
                                  }`}>
                                    <span>{formatChatTimestamp(msg.timestamp, msg.createdAt)}</span>
                                    {msg.editedAt && <span>(edited)</span>}
                                    {isMe && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                                  </div>
                                </div>
                              )}

                              {/* Hover menu for edit/delete */}
                              {(isMe || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && !msg.isDeleted && !isEditing && (
                                <div className="absolute top-1/2 -translate-y-1/2 -left-14 hidden group-hover/bubble:flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-1 shadow-md">
                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMessageId(msg.id);
                                        setEditingText(msg.text);
                                      }}
                                      title="Edit"
                                      className="p-1 text-slate-400 hover:text-emerald-500 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteMessage(msg.id)}
                                    title="Delete"
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

                {/* Quick Emoji Bar (WhatsApp style) */}
                {showEmojiBar && (
                  <div className="px-3 py-1.5 bg-white dark:bg-[#131b2e] border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 overflow-x-auto shrink-0">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setMessageText(prev => prev + emoji);
                          inputRef.current?.focus();
                        }}
                        className="text-base hover:scale-125 transition-transform px-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Attachment Preview Ribbon */}
                {selectedImageBase64 && (
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-300 dark:border-emerald-700/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedImageBase64}
                        alt="Preview"
                        className="w-9 h-9 rounded-lg object-cover border border-emerald-500"
                      />
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        1 photo ready to send
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImageBase64(null)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Ultra-Responsive Input Bar (WhatsApp style) */}
                <form
                  onSubmit={handleSend}
                  className="p-2.5 bg-white dark:bg-[#131b2e] border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 shrink-0"
                >
                  {/* Emoji Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiBar(!showEmojiBar)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                    title="Emojis"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Photo Attachment */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Photo"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Instant Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 dark:bg-white/[0.06] border border-transparent focus:border-emerald-500 rounded-full px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!messageText.trim() && !selectedImageBase64}
                    className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all shadow-sm shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Minimized Header Bar */}
            {isMinimized && (
              <div
                onClick={() => setIsMinimized(false)}
                className="p-3 bg-emerald-600 dark:bg-[#131b2e] text-white flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-bold">
                    {currentView === 'chat' ? (activeGroup?.isDirect ? activeGroup.name : `#${activeGroup?.name}`) : 'Chats'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(false);
                    }}
                    className="p-1 hover:bg-white/15 rounded"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="p-1 hover:bg-white/15 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 1: NEW DIRECT CHAT (Start 1-on-1)                  */}
            {/* ======================================================== */}
            <AnimatePresence>
              {showNewChatModal && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/15 rounded-2xl p-4 w-full space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Start 1-on-1 Conversation
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewChatModal(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search employee by name..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-white/[0.05]">
                      {colleagues.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No employees matched.
                        </div>
                      ) : (
                        colleagues.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => handleStartDirectChat(u.id)}
                            className="pt-2 pb-2 px-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {u.department} &bull; {u.designation || u.role}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              Chat →
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* ======================================================== */}
            {/* MODAL 2: CREATE WORKSTREAM GROUP                         */}
            {/* ======================================================== */}
            <AnimatePresence>
              {showCreateGroupModal && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/15 rounded-2xl p-4 w-full space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Create Group Channel
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateGroupModal(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateGroup} className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Group Name</label>
                        <input
                          type="text"
                          required
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="e.g. Design-Sprint"
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Description</label>
                        <input
                          type="text"
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          placeholder="Project team updates..."
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateGroupModal(false)}
                          className="px-3 py-1.5 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Create Group
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
