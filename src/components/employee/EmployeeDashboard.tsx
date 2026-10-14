'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { Task, TaskStatus, AttendanceRecord } from '@/types';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  Award,
  Sparkles,
  TrendingUp,
  FileCheck2,
  FileText,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Edit2,
  Paperclip,
  CheckSquare,
  Zap,
  Info,
  Building2,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { EODReportModal } from './EODReportModal';
import confetti from 'canvas-confetti';

// Category color mappings matching modern clean squircle aesthetic
const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string; iconBg: string }> = {
  'UI Design': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600'
  },
  'Frontend': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600'
  },
  'Backend': {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  'Copywriting': {
    bg: 'bg-pink-500/10 dark:bg-pink-500/20',
    text: 'text-pink-600 dark:text-pink-400',
    dot: 'bg-pink-500',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600'
  },
  'Illustration': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600'
  },
  'QA / Testing': {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600'
  }
};

const DEFAULT_CATEGORY_STYLE = {
  bg: 'bg-slate-500/10 dark:bg-slate-500/20',
  text: 'text-slate-600 dark:text-slate-400',
  dot: 'bg-slate-500',
  iconBg: 'bg-gradient-to-br from-slate-500 to-slate-700'
};

// Entrance animation container variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20
    }
  }
};

export function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const {
    attendance,
    tasks,
    projects,
    clockIn,
    clockOut,
    getUserTodayAttendance,
    updateTaskStatus,
    updateTask,
    announcements
  } = useAppData();
  const { showNotification } = useNotifications();

  // Search and Filter states
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'in_progress' | 'needs_review' | 'completed'>('all');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');

  // Clock live timer
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentShiftSeconds, setCurrentShiftSeconds] = useState(0);

  // Calendar State: Year and Month
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);
  const [selectedCalendarDayStr, setSelectedCalendarDayStr] = useState<string | null>(null);

  // Real-time ticking clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's attendance state
  const todayRecord = getUserTodayAttendance(currentUser.id);
  const isClockedIn = !!todayRecord && !todayRecord.clockOut;
  const isShiftCompleted = !!todayRecord && !!todayRecord.clockOut;

  // Running work seconds counter
  useEffect(() => {
    if (!isClockedIn || !todayRecord?.clockIn) {
      setCurrentShiftSeconds(todayRecord?.totalWorkMinutes ? todayRecord.totalWorkMinutes * 60 : 0);
      return;
    }

    const interval = setInterval(() => {
      try {
        const inTime = new Date();
        const parts = todayRecord.clockIn.match(/(\d{1,2}):(\d{2})/);
        if (parts) {
          let h = parseInt(parts[1], 10);
          const m = parseInt(parts[2], 10);
          if (todayRecord.clockIn.toLowerCase().includes('pm') && h < 12) h += 12;
          if (todayRecord.clockIn.toLowerCase().includes('am') && h === 12) h = 0;
          inTime.setHours(h, m, 0, 0);
          const diff = Math.max(0, Math.floor((Date.now() - inTime.getTime()) / 1000));
          setCurrentShiftSeconds(diff);
        }
      } catch {}
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, todayRecord]);

  // Format running timer
  const formattedShiftDuration = useMemo(() => {
    const hrs = Math.floor(currentShiftSeconds / 3600);
    const mins = Math.floor((currentShiftSeconds % 3600) / 60);
    const secs = currentShiftSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [currentShiftSeconds]);

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Filter tasks assigned to current employee
  const myAssignedTasks = useMemo(() => {
    return tasks.filter(t => t.assignedToId === currentUser.id);
  }, [tasks, currentUser.id]);

  // Filter tasks by active tab and search query
  const filteredTasks = useMemo(() => {
    return myAssignedTasks.filter(t => {
      // Tab filter
      if (activeTaskTab === 'in_progress') {
        if (t.status !== 'in_progress') return false;
      } else if (activeTaskTab === 'needs_review') {
        if (t.status !== 'needs_review' && t.status !== 'blocked') return false;
      } else if (activeTaskTab === 'completed') {
        if (t.status !== 'completed') return false;
      }

      // Search query
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.projectName && t.projectName.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [myAssignedTasks, activeTaskTab, taskSearchQuery]);

  // Task KPI Counts
  const taskKpis = useMemo(() => {
    const total = myAssignedTasks.length;
    const inProgress = myAssignedTasks.filter(t => t.status === 'in_progress').length;
    const needsReview = myAssignedTasks.filter(t => t.status === 'needs_review' || t.status === 'blocked').length;
    const completed = myAssignedTasks.filter(t => t.status === 'completed').length;
    return { total, inProgress, needsReview, completed };
  }, [myAssignedTasks]);

  // Employee attendance records
  const myAttendanceRecords = useMemo(() => {
    return attendance.filter(a => a.userId === currentUser.id);
  }, [attendance, currentUser.id]);

  // Monthly Attendance Calculation (for Calendar and Punctuality Score)
  const attendanceMetrics = useMemo(() => {
    const thisMonthPrefix = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`;
    const monthRecords = myAttendanceRecords.filter(r => r.date.startsWith(thisMonthPrefix));
    const totalPresent = monthRecords.filter(r => r.status === 'present' || r.status === 'wfh').length;
    const totalLate = monthRecords.filter(r => r.isLate || r.status === 'late').length;
    const punctualityPercent = monthRecords.length > 0 ? Math.round(((monthRecords.length - totalLate) / monthRecords.length) * 100) : 100;
    return {
      monthRecords,
      totalPresent,
      totalLate,
      punctualityPercent,
      monthName: calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }, [myAttendanceRecords, calendarDate]);

  // Calculate late minutes for any attendance record
  const getRecordLateMinutes = (record: AttendanceRecord): number => {
    if (!record.clockIn || (!record.isLate && record.status !== 'late')) return 0;
    try {
      const match = record.clockIn.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        if (record.clockIn.toLowerCase().includes('pm') && h < 12) h += 12;
        if (record.clockIn.toLowerCase().includes('am') && h === 12) h = 0;
        const clockMins = h * 60 + m;
        const shiftStartMins = 9 * 60; // 09:00 AM shift start
        if (clockMins > shiftStartMins) {
          return clockMins - shiftStartMins;
        }
      }
    } catch {}
    return 18; // Default realistic fallback if parsed time is missing
  };

  // Calendar days builder
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert so Monday is 0: (day + 6) % 7
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dayNumber: null, dateStr: null, record: null, isWeekend: false });
    }

    // Actual days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sat or Sun
      const record = myAttendanceRecords.find(r => r.date === dateStr) || null;
      days.push({ dayNumber: d, dateStr, record, isWeekend });
    }

    return days;
  }, [calendarDate, myAttendanceRecords]);

  // Navigate calendar month
  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayRecord(null);
    setSelectedCalendarDayStr(null);
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDayRecord(null);
    setSelectedCalendarDayStr(null);
  };

  // Handle Punch In Action
  const handleClockIn = () => {
    if (!currentUser) return;
    clockIn(currentUser.id);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {}
  };

  // Handle Punch Out Action
  const handleClockOut = () => {
    if (!currentUser) return;
    if (window.confirm('Are you ready to clock out and conclude your shift?')) {
      clockOut(currentUser.id);
      setShowEODModal(true);
    }
  };

  // Handle Employee Task Status Transitions
  // STRICT RULE: Employee cannot directly set 'completed'. It submits to 'needs_review' for manager inspection!
  const handleStartTask = (task: Task) => {
    updateTaskStatus(task.id, 'in_progress');
    showNotification('Task Started', `You are now working on "${task.title}".`, 'info');
  };

  const openSubmitReviewModal = (task: Task) => {
    setSubmittingTask(task);
    setDeliverableNotes('');
    setDeliverableUrl('');
  };

  const handleSubmitTaskForReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;

    // Attach deliverable notes and update status to needs_review
    updateTask(submittingTask.id, {
      status: 'needs_review',
      description: deliverableNotes.trim()
        ? `${submittingTask.description}\n\n[Employee Deliverable Submission]: ${deliverableNotes.trim()}${deliverableUrl ? `\nLink: ${deliverableUrl}` : ''}`
        : submittingTask.description
    });

    showNotification(
      'Submitted for Manager Review',
      `"${submittingTask.title}" has been submitted. Your Manager will review your deliverables and mark it Done.`,
      'success'
    );

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setSubmittingTask(null);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100"
    >
      {/* ======================================================== */}
      {/* 1. TOP GREETING HERO BANNER & STATS (Reference UI Style)  */}
      {/* ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-7 text-white shadow-xl shadow-indigo-600/15"
      >
        {/* Subtle decorative glow circles */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 right-48 h-48 w-48 rounded-full bg-cyan-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>quickslogx Employee Workspace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {greeting}, {currentUser.name}! 👋
            </h1>

            <p className="text-sm text-blue-100 leading-relaxed">
              {isClockedIn ? (
                <span>
                  You are actively on duty in shift. You have <strong className="text-white font-bold">{taskKpis.inProgress + myAssignedTasks.filter(t => t.status === 'pending').length}</strong> open tasks pending your review.
                </span>
              ) : isShiftCompleted ? (
                <span>
                  Your shift is completed for today. Great job! Total logged: <strong className="text-white font-bold">{todayRecord?.totalWorkMinutes ? Math.round(todayRecord.totalWorkMinutes / 60 * 10) / 10 : 0} hrs</strong>.
                </span>
              ) : (
                <span>
                  Ready to begin today&apos;s shift? Clock in now to track attendance, start assigned workstreams, and coordinate with your manager.
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isClockedIn && !isShiftCompleted && (
                <button
                  type="button"
                  onClick={handleClockIn}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <span>Punch In for Shift</span>
                </button>
              )}

              {isClockedIn && (
                <button
                  type="button"
                  onClick={handleClockOut}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/20 transition-all hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Punch Out (End Shift)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowEODModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition-all active:scale-95"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Daily EOD Report</span>
              </button>
            </div>
          </div>

          {/* Right Live Shift Timer Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-200 font-semibold">
                {isClockedIn ? 'Live Shift Elapsed' : isShiftCompleted ? 'Shift Concluded' : 'Digital Clock'}
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-white">
                {isClockedIn ? formattedShiftDuration : currentTimeStr || '09:00:00'}
              </div>
              <div className="text-[11px] text-blue-200 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-400' : isShiftCompleted ? 'bg-blue-300' : 'bg-amber-400'}`} />
                <span>{isClockedIn ? `Started at ${todayRecord?.clockIn}` : isShiftCompleted ? 'Shift Finished' : 'Not Punched In Yet'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 2. 5 VIBRANT METRIC PILL CARDS (Matching Reference UI)   */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Assigned */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Assigned Tasks</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{taskKpis.total}</span>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">In Progress</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{taskKpis.inProgress}</span>
          </div>
        </div>

        {/* Card 3: Needs Review */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Needs Review</span>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{taskKpis.needsReview}</span>
          </div>
        </div>

        {/* Card 4: Done / Completed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Approved Done</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{taskKpis.completed}</span>
          </div>
        </div>

        {/* Card 5: Punctuality */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Punctuality Score</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{attendanceMetrics.punctualityPercent}%</span>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE: TASKS (Left) + PROFILE & CALENDAR (Right) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: ASSIGNED TASKS DESK (7 Cols)              */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 p-5 shadow-sm space-y-4">
            {/* Header with Title and Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Assigned Workstreams & Tasks</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold">
                    {filteredTasks.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manager assigned deliverables. Submit work for review upon completion.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-transparent focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              {[
                { id: 'all', label: `All (${taskKpis.total})` },
                { id: 'in_progress', label: `In Progress (${taskKpis.inProgress})` },
                { id: 'needs_review', label: `Needs Review (${taskKpis.needsReview})` },
                { id: 'completed', label: `Approved Done (${taskKpis.completed})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTaskTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTaskTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No tasks found in this section.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {activeTaskTab === 'all' ? 'All clear! Your manager will assign tasks here.' : 'Try selecting another tab or clearing search.'}
                  </p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const catStyle = CATEGORY_STYLES[task.category || ''] || DEFAULT_CATEGORY_STYLE;
                  const isUnderReview = task.status === 'needs_review' || task.status === 'blocked';
                  const isCompleted = task.status === 'completed';
                  const isInProgress = task.status === 'in_progress';

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-sm transition-all space-y-3 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Project Badge */}
                            {task.projectName && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {task.projectName}
                              </span>
                            )}

                            {/* Category Pill */}
                            {task.category && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                                {task.category}
                              </span>
                            )}

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-400/30'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Status Chip */}
                        <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-xs font-bold font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Approved Done</span>
                            </span>
                          ) : isUnderReview ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-400/30 text-xs font-bold font-mono">
                              <Send className="w-3.5 h-3.5 text-purple-500" />
                              <span>Needs Manager Review</span>
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-400/30 text-xs font-bold font-mono">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <span>In Progress</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                              <span>Ready / Assigned</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Deadline: {task.deadline || 'Flexible'}</span>
                          </span>

                          {task.estimatedHours > 0 && (
                            <span>Est: {task.estimatedHours}h</span>
                          )}
                        </div>

                        {/* Employee Actions: Start or Submit for Review */}
                        <div className="flex items-center gap-2">
                          {!isInProgress && !isUnderReview && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(task)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Start Task</span>
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => openSubmitReviewModal(task)}
                              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 animate-pulse"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit for Review 📤</span>
                            </button>
                          )}

                          {isUnderReview && (
                            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              <span>Waiting for manager to view deliverables & approve</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: PROFILE CARD + ATTENDANCE CALENDAR (5)   */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          {/* ==================================================== */}
          {/* A. EMPLOYEE PROFILE CARD (Side panel)                 */}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Employee Profile
              </span>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-sm"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#131b2e] ${
                    isClockedIn ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={isClockedIn ? 'On Duty' : 'Clocked Out'}
                />
              </div>

              <div className="space-y-0.5 overflow-hidden">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
                  {currentUser.designation || 'Specialist'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.department || 'Operations'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                <span className="text-[10px] text-slate-400 block font-mono">Official Shift</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">09:00 AM - 06:00 PM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                <span className="text-[10px] text-slate-400 block font-mono">Monthly On-Time</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{attendanceMetrics.punctualityPercent}%</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* B. COMPLETE ATTENDANCE CALENDAR WIDGET                */}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-white/10 p-5 shadow-sm space-y-4">
            {/* Calendar Header with Month Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Attendance Calendar
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mr-1">
                  {attendanceMetrics.monthName}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-slate-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((item, idx) => {
                if (!item.dayNumber) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }

                const rec = item.record;
                const isLate = rec ? (rec.isLate || rec.status === 'late') : false;
                const isPresent = rec ? (rec.status === 'present' || rec.status === 'wfh') && !isLate : false;
                const isLeave = rec ? (rec.status === 'leave' || rec.status === 'half_day') : false;
                const isSelected = selectedCalendarDayStr === item.dateStr;
                const lateMins = rec && isLate ? getRecordLateMinutes(rec) : 0;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedCalendarDayStr(item.dateStr);
                      setSelectedDayRecord(rec);
                    }}
                    className={`relative h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/40 shadow-xs'
                        : isLate
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 hover:scale-105'
                        : isPresent
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 hover:scale-105'
                        : isLeave
                        ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700/50 hover:scale-105'
                        : item.isWeekend
                        ? 'bg-slate-100/60 dark:bg-white/[0.02] text-slate-400 opacity-60'
                        : 'bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">{item.dayNumber}</span>

                    {/* Status Dot / Indicator */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {isLate && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title={`Late by ${lateMins}m`} />
                      )}
                      {isPresent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Present On-Time" />
                      )}
                      {isLeave && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Leave / WFH" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>On-Time Present</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">Late Arrival</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Leave / WFH</span>
              </span>
            </div>

            {/* Clicked Date Details Inspection Card */}
            {selectedCalendarDayStr && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {new Date(selectedCalendarDayStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCalendarDayStr(null);
                      setSelectedDayRecord(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedDayRecord ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Clock In:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedDayRecord.clockIn || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Clock Out:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedDayRecord.clockOut || 'Active'}</span>
                    </div>

                    {/* Exact Late breakdown if late */}
                    {(selectedDayRecord.isLate || selectedDayRecord.status === 'late') ? (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/40 text-amber-800 dark:text-amber-300 font-medium flex items-start gap-1.5 mt-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">
                            Late by {getRecordLateMinutes(selectedDayRecord)} minutes
                          </strong>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400">
                            Punched in after official 09:00 AM shift start (Grace period: 15m).
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Punched in punctually before shift grace cutoff!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                    No shift clock punch-in recorded for this date (Off or Weekend).
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL: SUBMIT DELIVERABLE FOR MANAGER REVIEW           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {submittingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSubmittingTask(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Submit Work for Review
                    </h3>
                    <p className="text-xs text-slate-500">
                      Task: {submittingTask.title}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitTaskForReview} className="space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/40 rounded-xl text-xs text-purple-800 dark:text-purple-300">
                  <span className="font-bold block mb-0.5">Manager Approval Required</span>
                  Once submitted, the task status becomes <strong>Needs Review</strong>. Your manager will inspect your work deliverables before officially marking it as Done.
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Work Summary / Completed Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deliverableNotes}
                    onChange={(e) => setDeliverableNotes(e.target.value)}
                    placeholder="Briefly describe what you completed for this deliverable..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Deliverable URL or File Link (Google Drive / GitHub / Figma)
                  </label>
                  <div className="relative">
                    <Paperclip className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://github.com/..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setSubmittingTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Submit to Manager</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal (Google Drive 5TB integration) */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 1-Click Daily EOD Report Modal */}
      <EODReportModal
        isOpen={showEODModal}
        onClose={() => setShowEODModal(false)}
      />
    </motion.div>
  );
}
