'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { NotificationItem } from '@/types';
import { playGlassChime } from '@/lib/utils';
import { createPortal } from 'react-dom';
import './notifications.css';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const reduced=useReducedMotion();
  const timers=useRef(new Map<string,ReturnType<typeof setTimeout>>());
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true);const activeTimers=timers.current;return()=>{activeTimers.forEach(timer=>clearTimeout(timer));activeTimers.clear();};},[]);
  const dismissToast=useCallback((id:string)=>{const timer=timers.current.get(id);if(timer)clearTimeout(timer);timers.current.delete(id);setActiveToasts(prev=>prev.filter(item=>item.id!==id));},[]);
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

    timers.current.set(newNotif.id,setTimeout(()=>dismissToast(newNotif.id),6000));
  }, [soundEnabled,dismissToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    dismissToast(id);
  }, [dismissToast]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    timers.current.forEach(timer=>clearTimeout(timer));timers.current.clear();
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

      {mounted&&createPortal(<div className="workspace-toast-stack" aria-label="Workspace notifications"><AnimatePresence initial={false}>{activeToasts.map(toast=>{const Icon=toast.type==='success'?CheckCircle2:toast.type==='warning'?AlertTriangle:toast.type==='urgent'?AlertCircle:Info;return <motion.div layout key={toast.id} className="workspace-toast" data-kind={toast.type} role={toast.type==='urgent'?'alert':'status'} initial={{opacity:0,y:reduced?0:-12,scale:reduced?1:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,x:reduced?0:24,scale:reduced?1:.98}} transition={{duration:reduced?0:.2,ease:[.22,1,.36,1]}}><span className="workspace-toast-icon"><Icon size={20}/></span><div className="workspace-toast-copy"><strong>{toast.title}</strong><p>{toast.message}</p></div><button type="button" className="workspace-toast-close" aria-label={'Dismiss notification: '+toast.title} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();dismissToast(toast.id);}} onClick={event=>{event.preventDefault();event.stopPropagation();dismissToast(toast.id);}}><X size={17}/></button><motion.span className="workspace-toast-progress" initial={{scaleX:1}} animate={{scaleX:0}} transition={{duration:reduced?0:6,ease:'linear'}}/></motion.div>;})}</AnimatePresence></div>,document.body)}
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
