'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
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
  Hash
} from 'lucide-react';

export function FloatingChatWidget() {
  const { currentUser, users } = useAuth();
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    createGroup,
    sendMessage,
    activeGroupMessages,
    totalUnreadChatCount
  } = useChat();
  const { showNotification } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeGroupMessages, isOpen, isMinimized]);

  if (!currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const targetGroupId = activeGroupId || groups[0]?.id;
    if (!targetGroupId) return;

    sendMessage(targetGroupId, messageText.trim());
    setMessageText('');
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createGroup(newChannelName.trim(), newChannelDesc.trim() || 'Workstream channel', []);
    setNewChannelName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
    showNotification('Channel Created', `Channel #${newChannelName.trim()} is now active.`, 'success');
  };

  return (
    <>
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
              height: isMinimized ? 56 : 580
            }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] sm:w-[410px] bg-white/95 dark:bg-[#0f1422]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden"
          >
            {/* Window Header */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              {/* Channel Selector Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors"
                >
                  <Hash className="w-3.5 h-3.5 text-sky-500" />
                  <span className="truncate max-w-[150px]">{activeGroup?.name || 'General Pod'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Channels List */}
                <AnimatePresence>
                  {showChannelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-9 left-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-30 text-xs"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <span>Workstream Channels</span>
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

                      <div className="max-h-44 overflow-y-auto py-1">
                        {groups.map((grp) => (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => {
                              setActiveGroupId(grp.id);
                              setShowChannelDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status & Control Buttons */}
              <div className="flex items-center gap-1.5">
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
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        Channel #{activeGroup?.name || 'General'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Start the conversation! Realtime messages are delivered instantly to all team members without reloading.
                      </p>
                    </div>
                  ) : (
                    activeGroupMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <img
                            src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={msg.senderName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                          />

                          <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {isMe ? 'You' : msg.senderName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                              </span>
                            </div>

                            <div
                              className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                                isMe
                                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-tr-none shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-white/5'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSend}
                  className="p-3 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message #${activeGroup?.name || 'team'}...`}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white disabled:opacity-40 transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* Modal to Create Channel */}
            <AnimatePresence>
              {showCreateChannelModal && (
                <div className="absolute inset-0 z-40 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
