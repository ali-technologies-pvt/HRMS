'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidButton } from './LiquidButton';
import { Clock, LogIn, Sparkles, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DailyAttendancePopup() {
  const { currentUser } = useAuth();
  const { getUserTodayAttendance, clockIn, policy } = useAppData();
  const { showNotification } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const todayRecord = getUserTodayAttendance(currentUser.id);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger automatically on first login of the day if not clocked in
  useEffect(() => {
    // Only prompt for employees, managers, and HR (Super admin is master root)
    if (currentUser && currentUser.role !== 'super_admin') {
      const hasClockedIn = !!todayRecord?.clockIn;
      if (!hasClockedIn) {
        // Small delay for smooth mount
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [currentUser, todayRecord]);

  const handlePunchIn = () => {
    clockIn(currentUser.id);
    setIsOpen(false);
    showNotification('Shift Commenced', `Attendance punched in at ${currentTime}. Have a great workday!`, 'success');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Apple-grade glass backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 border border-sky-400/50 dark:border-cyan-400/40 p-6 rounded-[4px] shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-[2px] shadow-md shadow-sky-500/20">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  First-Login Verification
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Good Day, {currentUser.name}!
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title="Dismiss for now"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Your shift attendance has not been registered yet today. Please record your daily Check-In to commence work tracking and maintain punctuality scores.
          </p>

          {/* Digital Clock Display */}
          <div className="p-4 bg-gradient-to-b from-sky-500/10 via-sky-500/5 to-transparent border border-sky-300/40 dark:border-cyan-400/20 rounded-[3px] text-center">
            <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
              {currentTime || '09:00:00 AM'}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="inline-block mt-2 px-2.5 py-0.5 bg-sky-500/15 text-sky-800 dark:text-cyan-300 text-[10px] font-mono font-bold rounded-[2px]">
              Shift Timings: {policy.officeStartTime} - {policy.officeEndTime} (Grace: {policy.gracePeriodMinutes}m)
            </div>
          </div>

          {/* Security & Presence Rule */}
          <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-[2px] text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Punched timestamps are securely tied to your daily shift and monthly payroll statements.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Remind Me Later
            </button>

            <LiquidButton
              variant="emerald"
              size="md"
              icon={<LogIn className="w-4 h-4" />}
              onClick={handlePunchIn}
              className="shadow-[0_4px_16px_rgba(16,185,129,0.35)] font-bold text-xs"
            >
              Check-In Now (Start Shift)
            </LiquidButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
