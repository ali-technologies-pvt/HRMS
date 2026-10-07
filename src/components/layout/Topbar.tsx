'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { ExitClearanceModal } from '../common/ExitClearanceModal';
import { Bell, Clock, Volume2, VolumeX, CheckCheck, Trash2, Sun, Moon, Sparkles, LogOut, MessageSquare, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/context/ChatContext';
import { PwaInstallButton } from '../common/PwaInstallButton';

interface TopbarProps {
  onOpenChat?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Topbar({ onOpenChat, onToggleMobileMenu, isMobileMenuOpen }: TopbarProps) {
  const { currentUser, updateUserStatus, logout } = useAuth();
  const { totalUnreadChatCount } = useChat();
  const { getUserTodayAttendance, reports, requests } = useAppData();
  const { notifications, markAsRead, clearAll, soundEnabled, setSoundEnabled } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showExitClearanceModal, setShowExitClearanceModal] = useState(false);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogoutClick = () => {
    setShowStatusMenu(false);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = getUserTodayAttendance(currentUser.id);

    // If Employee: check if still clocked in OR hasn't submitted today's report
    if (currentUser.role === 'employee') {
      const isStillClockedIn = !!todayRecord && !todayRecord.clockOut;
      const hasSubmittedTodayReport = reports.some(
        r => r.userId === currentUser.id && r.date === todayStr
      );
      if (isStillClockedIn || !hasSubmittedTodayReport) {
        setShowExitClearanceModal(true);
        return;
      }
    } else if (currentUser.role === 'manager' || currentUser.role === 'manager_hr') {
      const managerAttendanceLogged = !!todayRecord?.clockIn;
      const pendingRequests = requests.filter(r => r.status === 'pending');
      if (!managerAttendanceLogged || pendingRequests.length > 0) {
        setShowExitClearanceModal(true);
        return;
      }
    }

    // Direct logout if cleared
    performSignOut();
  };

  const performSignOut = () => {
    updateUserStatus('offline');
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full liquid-glass border-b border-slate-200/80 dark:border-white/10 px-4 lg:px-6 py-2.5 transition-colors duration-300">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo, Branding & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-[3px] liquid-glass border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors shadow-sm"
                title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
              >
                {isMobileMenuOpen ? <CloseIcon className="w-4 h-4 text-rose-500" /> : <Menu className="w-4 h-4" />}
              </button>
            )}

            <div className="w-8 h-8 rounded-[3px] bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 p-[1px] shadow-[0_0_15px_rgba(14,165,233,0.35)] shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[2px] flex items-center justify-center">
                <span className="text-sky-600 dark:text-cyan-400 font-mono font-black text-sm tracking-tighter">QX</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-wider text-xs sm:text-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  quickslogx
                </span>
                <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono uppercase bg-sky-500/10 text-sky-700 dark:text-cyan-300 border border-sky-400/30 rounded-[2px] font-semibold">
                  OS 2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight hidden md:block">
                Liquid Glass Enterprise HRMS
              </p>
            </div>
          </div>

          {/* Center Digital Clock & Environment indicator */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1 bg-black/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-[2px]">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
            <span className="text-xs font-mono text-slate-800 dark:text-slate-200 tracking-wider font-semibold">{currentTime || '00:00:00'}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE
            </span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop App Install Button */}
            <PwaInstallButton variant="topbar" />

            {/* Light / Dark Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-2 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </motion.button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Interface Chimes' : 'Enable Glass UI Sound'}
              className="p-2 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Team Live Chat Shortcut */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                title="Open Team Live Chat"
                className="relative p-2 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                {totalUnreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-mono font-bold rounded-[2px] flex items-center justify-center shadow-[0_0_8px_#10b981]">
                    {totalUnreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-mono font-bold rounded-[2px] flex items-center justify-center shadow-[0_0_8px_#f43f5e]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Liquid Glass Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 liquid-glass-dropdown border border-slate-200 dark:border-white/15 p-3 rounded-[3px] shadow-2xl z-50 max-h-[460px] flex flex-col"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-widest text-sky-600 dark:text-cyan-400 font-bold">Activity Feed</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-[1px] font-mono font-semibold">
                            {notifications.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => notifications.forEach(n => markAsRead(n.id))}
                            title="Mark all read"
                            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-cyan-400 rounded-[2px]"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={clearAll}
                            title="Clear all"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-[2px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400 font-mono">
                            No notifications in feed
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`p-2.5 rounded-[2px] transition-all cursor-pointer border ${
                                n.read
                                  ? 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 opacity-60'
                                  : 'bg-white dark:bg-white/[0.06] border-sky-300 dark:border-cyan-500/30 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{n.title}</span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Current User Profile Pill with Status */}
            <div className="relative">
              <div
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="liquid-glass px-2 py-1.5 rounded-[3px] border border-slate-200/80 dark:border-white/10 flex items-center gap-2 cursor-pointer hover:border-sky-400 dark:hover:border-cyan-400/40 transition-all select-none shadow-sm"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-[2px] object-cover border border-slate-300 dark:border-white/20"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-[1px] border border-white dark:border-slate-950 ${
                      currentUser.status === 'online'
                        ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                        : currentUser.status === 'break'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="text-left hidden lg:block pr-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[110px]">
                    {currentUser.designation}
                  </div>
                </div>
              </div>

              {/* Status and Profile quick menu */}
              <AnimatePresence>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute right-0 top-full mt-2 w-56 liquid-glass-dropdown border border-slate-200 dark:border-white/15 p-2 rounded-[3px] shadow-2xl z-50"
                    >
                      <div className="p-2 border-b border-slate-200/80 dark:border-white/10 mb-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                        <div className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 truncate">{currentUser.email}</div>
                      </div>

                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Set Live Presence
                      </div>
                      <div className="space-y-1 mb-2">
                        <button
                          onClick={() => {
                            updateUserStatus('online');
                            setShowStatusMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[2px] text-xs flex items-center gap-2 ${
                            currentUser.status === 'online' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-[1px] bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                          Online & Active
                        </button>
                        <button
                          onClick={() => {
                            updateUserStatus('break');
                            setShowStatusMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[2px] text-xs flex items-center gap-2 ${
                            currentUser.status === 'break' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-[1px] bg-amber-400" />
                          On Short Break
                        </button>
                        <button
                          onClick={() => {
                            updateUserStatus('offline');
                            setShowStatusMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[2px] text-xs flex items-center gap-2 ${
                            currentUser.status === 'offline' ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-[1px] bg-slate-400" />
                          Appear Offline
                        </button>
                      </div>

                      <div className="border-t border-slate-200/80 dark:border-white/10 pt-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowStatusMenu(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-[2px] text-xs text-sky-700 dark:text-cyan-300 hover:bg-sky-50 dark:hover:bg-cyan-500/15 flex items-center gap-2 font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                          Customize Profile & Password
                        </button>

                        <button
                          onClick={handleLogoutClick}
                          className="w-full text-left px-2 py-1.5 rounded-[2px] text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          End Shift / Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Profile & Password Customization Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Mandatory Exit Clearance Modal */}
      <ExitClearanceModal
        isOpen={showExitClearanceModal}
        onClose={() => setShowExitClearanceModal(false)}
        onConfirmLogout={performSignOut}
      />
    </>
  );
}
