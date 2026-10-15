'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NotificationItem } from '@/types';
import { playGlassChime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-welcome',
      title: 'Welcome to quickslogx HRMS',
      message: 'Your workspace is ready. Find important updates and actions in your notification inbox.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);
  const [activeToasts, setActiveToasts] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [preferencesLoaded,setPreferencesLoaded]=useState(false);
  useEffect(()=>{
    try{
      const sound=localStorage.getItem('quickslogx_notification_sound');if(sound!==null)setSoundEnabled(sound==='true');
    }catch{ /* Keep the current inbox when saved preferences are unavailable. */ }
    setPreferencesLoaded(true);
  },[]);
  useEffect(()=>{if(!preferencesLoaded)return;try{localStorage.setItem('quickslogx_notification_sound',String(soundEnabled));}catch{ /* Updates remain available for the current session. */ }},[soundEnabled,preferencesLoaded]);

  const showNotification = useCallback((title: string, message: string, type: NotificationItem['type'] = 'info') => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (soundEnabled) {
      if (type === 'urgent' || type === 'warning') {
        playGlassChime('alert');
      } else if (type === 'success') {
        playGlassChime('success');
      } else {
        playGlassChime('click');
      }
    }

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [newNotif, ...prev.slice(0, 3)]); // Keep max 4 toasts at once

    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5500);
  }, [soundEnabled]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActiveToasts(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setActiveToasts([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        markAsRead,
        clearNotification,
        clearAll,
        soundEnabled,
        setSoundEnabled
      }}
    >
      {children}

      {/* Floating Apple-style Dynamic Liquid Toast Stack */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => {
            const getIcon = () => {
              switch (toast.type) {
                case 'success':
                  return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
                case 'warning':
                  return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
                case 'urgent':
                  return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
                default:
                  return <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
              }
            };

            const getBorderAccent = () => {
              switch (toast.type) {
                case 'success':
                  return 'border-l-emerald-400';
                case 'warning':
                  return 'border-l-amber-400';
                case 'urgent':
                  return 'border-l-rose-500';
                default:
                  return 'border-l-cyan-400';
              }
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className={`brand-toast pointer-events-auto p-3.5 liquid-glass-elevated border-l-4 ${getBorderAccent()} shadow-2xl relative overflow-hidden group`}
                style={{ borderRadius: '4px' }}
              >
                <div className="flex items-start gap-3">
                  {getIcon()}
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider mb-0.5">{toast.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">{toast.message}</p>
                  </div>
                  <button
                    aria-label="Dismiss notification"
                    onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Progress highlight bar */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5.5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-[2px] bg-white/20"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
