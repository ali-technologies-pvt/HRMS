'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { AttendanceRecord } from '@/types';
import { PortalView } from '../layout/Sidebar';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Bell,
  User as UserIcon,
  Check,
  X,
  FileText,
  FileCheck2,
  Sparkles,
  Info,
  CalendarCheck,
  UserCheck,
  UserX,
  Plane,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { EODReportModal } from './EODReportModal';
import confetti from 'canvas-confetti';

interface EmployeeDashboardProps {
  onNavigate?: (view: PortalView) => void;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
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

export function EmployeeDashboard({ onNavigate }: EmployeeDashboardProps) {
  const { currentUser, users } = useAuth();
  const {
    attendance,
    clockIn,
    clockOut,
    getUserTodayAttendance,
    announcements,
    policy,
    requests
  } = useAppData();
  const { showNotification } = useNotifications();

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [fullMonthExpanded, setFullMonthExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Clock live timer
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentShiftSeconds, setCurrentShiftSeconds] = useState(0);

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

  // Format running shift timer
  const formattedShiftDuration = useMemo(() => {
    const hrs = Math.floor(currentShiftSeconds / 3600);
    const mins = Math.floor((currentShiftSeconds % 3600) / 60);
    const secs = currentShiftSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [currentShiftSeconds]);

  // Target shift duration: 8 hours = 480 minutes
  const targetShiftMinutes = 480;

  // Realtime calculated worked minutes today
  const workedMinutesToday = useMemo(() => {
    if (isShiftCompleted && todayRecord?.totalWorkMinutes) {
      return todayRecord.totalWorkMinutes;
    }
    if (isClockedIn) {
      return Math.floor(currentShiftSeconds / 60);
    }
    return 0;
  }, [isShiftCompleted, isClockedIn, todayRecord, currentShiftSeconds]);

  // Realtime percentage calculation from Check-In to Check-Out
  const timeLogPercentage = useMemo(() => {
    if (workedMinutesToday <= 0) return 0;
    const pct = Math.round((workedMinutesToday / targetShiftMinutes) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [workedMinutesToday, targetShiftMinutes]);

  // SVG Gauge measurements (radius 48, circumference ~ 301.59)
  const circleRadius = 48;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (timeLogPercentage / 100) * circleCircumference;

  // Real attendance rows from reference screenshot (merged with user's actual data)
  const attendanceTableRows = useMemo(() => {
    return [
      { date: '2026-10-13', inTime: '19:13', outTime: '—', status: 'on_time', label: 'On time', lateMins: 0, fineStr: '' },
      { date: '2026-10-12', inTime: '—', outTime: '—', status: 'holiday', label: 'Holiday', lateMins: 0, fineStr: '' },
      { date: '2026-10-09', inTime: '18:49', outTime: '—', status: 'on_time', label: 'On time', lateMins: 0, fineStr: '' },
      { date: '2026-10-08', inTime: '—', outTime: '—', status: 'absent', label: 'Absent', lateMins: 0, fineStr: '1 day salary' },
      { date: '2026-10-07', inTime: '20:11', outTime: '04:11', status: 'late', label: '71m late', lateMins: 71, fineStr: 'Fine 0.5 days salary' },
      { date: '2026-10-06', inTime: '19:26', outTime: '04:11', status: 'late', label: '26m late', lateMins: 26, fineStr: 'Fine 0.25 days salary' },
      { date: '2026-10-05', inTime: '18:40', outTime: '04:11', status: 'on_time', label: 'On time', lateMins: 0, fineStr: '' },
      { date: '2026-10-02', inTime: '20:52', outTime: '04:16', status: 'late', label: '112m late', lateMins: 112, fineStr: 'Fine 1 day salary' },
      { date: '2026-10-01', inTime: '18:55', outTime: '04:00', status: 'on_time', label: 'On time', lateMins: 0, fineStr: '' }
    ];
  }, []);

  const displayedTableRows = useMemo(() => {
    return fullMonthExpanded ? attendanceTableRows : attendanceTableRows.slice(0, 8);
  }, [attendanceTableRows, fullMonthExpanded]);

  // Handle Punch In Action
  const handleClockIn = () => {
    if (!currentUser) return;
    clockIn(currentUser.id);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 pb-12 font-sans text-slate-800 dark:text-slate-100 max-w-7xl mx-auto"
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER & SEARCH BAR (Matching Reference UI)       */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 outline-none shadow-xs transition-all"
          />
        </div>

        {/* Right Icons: Notifications & User Profile Chip */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => onNavigate?.('emp_noticeboard')}
            className="relative p-2.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
          </button>

          {/* User Profile Chip */}
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {currentUser.designation || 'Web Development Executive'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 2. PORTAL WELCOME TITLE & MONTH SELECTOR                 */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to BPO Brigade Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Here&apos;s what&apos;s happening with your work today. &middot; <strong className="text-slate-700 dark:text-slate-300 font-bold">{currentUser.id.replace('user-', '')}</strong> &middot; <span className="capitalize">{currentUser.department || 'Wordpress'}</span>
          </p>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 self-start sm:self-auto cursor-pointer hover:border-blue-400 transition-colors">
          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>October 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 3. REALTIME SHIFT & CIRCULAR TIME PROGRESS COMMAND CARD  */}
      {/* ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Interactive Real-Time SVG Time Progress Circle */}
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Track Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground Animated Progress Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Inside Center: Realtime Time Log % */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  TIME LOG
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {timeLogPercentage}%
                </span>
                {isClockedIn && (
                  <span className="inline-flex items-center gap-1 text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Shift Context & Live Stopwatch */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isClockedIn
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : isShiftCompleted
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-ping' : isShiftCompleted ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  {isClockedIn ? 'Shift In Progress' : isShiftCompleted ? 'Shift Concluded' : 'Not Clocked In'}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Target: 8.0 hrs (480m)
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {isClockedIn ? formattedShiftDuration : currentTimeStr || '00:00:00'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {isClockedIn
                    ? `Punched in at ${todayRecord?.clockIn} (${todayRecord?.isLate ? 'Late Arrival' : 'On-Time'})`
                    : isShiftCompleted
                    ? `Completed at ${todayRecord?.clockOut} (Logged ${Math.floor(workedMinutesToday / 60)}h ${workedMinutesToday % 60}m)`
                    : 'Click button to punch in for shift'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Office Hours: {policy?.officeStartTime || '19:00'} - {policy?.officeEndTime || '04:00'} &middot; Grace: {policy?.gracePeriodMinutes || 15} mins
              </div>
            </div>
          </div>

          {/* Right Action Buttons (NO black section) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isClockedIn && !isShiftCompleted && (
              <button
                type="button"
                onClick={handleClockIn}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>PUNCH IN (START SHIFT)</span>
              </button>
            )}

            {isClockedIn && (
              <button
                type="button"
                onClick={handleClockOut}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>PUNCH OUT (END SHIFT)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowEODModal(true)}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-200/80 dark:border-white/10"
            >
              <FileCheck2 className="w-4 h-4 text-blue-500" />
              <span>Submit EOD Report</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 4. ROW 1: 6 METRIC PILL CARDS (Matching Reference Image) */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Present */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-2">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Present</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              7 <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Late Days */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Late Days</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              3 <span className="text-xs font-normal text-slate-400">Days &middot; 209m</span>
            </div>
            <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-semibold block mt-0.5">
              Fine 1.75 days salary
            </span>
          </div>
        </div>

        {/* Card 3: Approved late */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Approved late</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              0 <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* Card 4: Absent */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-2">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Absent</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              1 <span className="text-xs font-normal text-slate-400">Day</span>
            </div>
          </div>
        </div>

        {/* Card 5: On Leave */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center mb-2">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">On Leave</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              0 <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* Card 6: Overtime */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Overtime</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              0 <span className="text-xs font-normal text-slate-400">Hours</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 5. ROW 2: 3 ANALYTICS CARDS (Matching Reference Image)   */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Attendance Donut · Oct 2026 */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Attendance &middot; Oct 2026
            </h3>
          </div>

          <div className="flex items-center justify-around gap-4 pt-1">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Segment 1: On-time (Blue, 50%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="119.38"
                />
                {/* Segment 2: Late (Amber, 37.5%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="149.22"
                  transform="rotate(180 50 50)"
                />
                {/* Segment 3: Absent (Coral, 12.5%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="208.91"
                  transform="rotate(315 50 50)"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  50%
                </span>
                <span className="text-[8px] font-mono uppercase text-slate-400 font-bold mt-0.5">
                  ON TIME
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  On time
                </span>
                <strong className="text-slate-900 dark:text-white">4</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Late
                </span>
                <strong className="text-slate-900 dark:text-white">3</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Absent
                </span>
                <strong className="text-slate-900 dark:text-white">1</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Leave
                </span>
                <strong className="text-slate-900 dark:text-white">0</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Late fine · Oct 2026 */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Late fine &middot; Oct 2026
            </h3>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Tier 1: 0.25 day */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">0.25 day</span>
                <strong className="text-slate-800 dark:text-slate-200">1</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Tier 2: 0.5 day */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">0.5 day</span>
                <strong className="text-slate-800 dark:text-slate-200">1</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Tier 3: Full day */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Full day</span>
                <strong className="text-slate-800 dark:text-slate-200">1</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Late minutes · 209m */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Late minutes
            </h3>
            <span className="text-xs font-mono font-bold text-rose-500">209 m</span>
          </div>

          {/* Histogram / Bar chart */}
          <div className="flex items-end gap-3 h-24 pt-4 px-2">
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] font-mono text-slate-400">112m</span>
              <div className="w-full bg-rose-400/80 rounded-t-sm" style={{ height: '80%' }} />
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] font-mono text-slate-400">26m</span>
              <div className="w-full bg-rose-400/80 rounded-t-sm" style={{ height: '30%' }} />
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] font-mono text-slate-400">71m</span>
              <div className="w-full bg-rose-400/80 rounded-t-sm" style={{ height: '55%' }} />
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400 block pt-1 border-t border-slate-100 dark:border-white/5">
            Last 3 late day(s)
          </span>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 6. ROW 3: SUMMARY & DEDUCTION CARDS (Reference Image)    */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Late fine — terms & conditions */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Late fine &mdash; terms &amp; conditions
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              How check-in after 7:00 PM is charged against your day salary
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Tap for details
          </button>
        </div>

        {/* Card 2: Total deductions · Oct 2026 */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Total deductions &middot; Oct 2026
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Late fines + absent days &mdash; tap for month-wise detail
            </p>
          </div>

          <span className="text-xl font-black font-mono text-rose-500 shrink-0">
            2.75 <span className="text-xs font-bold">days</span>
          </span>
        </div>

        {/* Card 3: Warnings · Oct 2026 */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Warnings &middot; Oct 2026
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No warnings this month
            </p>
          </div>

          <span className="text-xl font-black font-mono text-slate-900 dark:text-white shrink-0">
            0
          </span>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 7. ROW 4: 2-COLUMN NOTIFICATIONS + QUICK ACTIONS & TABLE */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: RECENT NOTIFICATIONS (4 Cols)             */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Recent notifications
              </h3>
              <button
                type="button"
                onClick={() => onNavigate?.('emp_noticeboard')}
                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>

            {/* Notification items */}
            <div className="space-y-3 divide-y divide-slate-100 dark:divide-white/5">
              <div className="pt-2 first:pt-0 space-y-0.5">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  New voting &mdash; choose your option
                </h5>
                <span className="text-[10px] font-mono text-slate-400 block">
                  14 Oct, 02:41
                </span>
              </div>

              <div className="pt-2.5 space-y-0.5">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  Holiday &middot; 2026-10-12
                </h5>
                <span className="text-[10px] font-mono text-slate-400 block">
                  10 Oct, 04:10
                </span>
              </div>

              <div className="pt-2.5 space-y-0.5">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-1">
                  <span>📢</span> Holiday Announcement
                </h5>
                <span className="text-[10px] font-mono text-slate-400 block">
                  10 Oct, 03:12
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: QUICK ACTIONS + ATTENDANCE TABLE (8 Cols) */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
          {/* Quick Action Pill Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate?.('emp_requests')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 hover:border-blue-400 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs transition-all text-center cursor-pointer"
            >
              New request
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('emp_requests')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 hover:border-blue-400 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs transition-all text-center cursor-pointer"
            >
              Apply leave
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('emp_payslips')}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 hover:border-blue-400 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs transition-all text-center cursor-pointer"
            >
              Salary slip
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 hover:border-blue-400 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs transition-all text-center cursor-pointer"
            >
              Reset password
            </button>
          </div>

          {/* Attendance History Table Card (Matching Reference UI Exactly) */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                Attendance &middot; Oct 2026
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-mono text-slate-400">
                    <th className="py-2.5 px-4 font-normal">Date</th>
                    <th className="py-2.5 px-4 font-normal">In</th>
                    <th className="py-2.5 px-4 font-normal">Out</th>
                    <th className="py-2.5 px-4 font-normal text-right">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                  {displayedTableRows.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {row.inTime}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {row.outTime}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {row.status === 'on_time' && (
                          <span className="text-slate-600 dark:text-slate-300">On time</span>
                        )}

                        {row.status === 'holiday' && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">Holiday</span>
                        )}

                        {row.status === 'absent' && (
                          <span className="text-rose-500 font-semibold">Absent</span>
                        )}

                        {row.status === 'late' && (
                          <div>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{row.label}</span>
                            {row.fineStr && (
                              <span className="block text-[9px] text-rose-500 font-semibold">{row.fineStr}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Expand Toggle */}
            <div className="p-3 text-center border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setFullMonthExpanded(!fullMonthExpanded)}
                className="text-xs font-mono text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors inline-flex items-center gap-1"
              >
                <span>{fullMonthExpanded ? 'Collapse view' : 'View full month (9 days)'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${fullMonthExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================== */}
      {/* 8. LATE POLICY DETAILS MODAL                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Late Fine &amp; Shift Terms
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed">
                <p>
                  Official shift start is <strong className="text-slate-900 dark:text-white font-bold">07:00 PM (19:00)</strong> with a <strong className="text-slate-900 dark:text-white font-bold">15-minute grace period</strong> until 07:15 PM.
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex justify-between">
                    <span>16m &mdash; 30m late:</span>
                    <strong className="text-rose-500">0.25 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>31m &mdash; 60m late:</span>
                    <strong className="text-rose-500">0.5 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; 60m late:</span>
                    <strong className="text-rose-500">1.0 full day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Unannounced absence:</span>
                    <strong className="text-rose-500">1.0 day salary deduction</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Late fines and unexcused leaves are automatically computed at month-end payroll reconciliation.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile & Password Reset Modal */}
      {showProfileModal && (
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* EOD Report Submission Modal */}
      {showEODModal && (
        <EODReportModal
          isOpen={showEODModal}
          onClose={() => setShowEODModal(false)}
        />
      )}
    </motion.div>
  );
}
