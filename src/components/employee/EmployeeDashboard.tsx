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
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ExternalLink
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

/**
 * Helper to calculate late arrival minutes for an attendance record
 */
function getLateMinutes(record: AttendanceRecord, officeStartTime: string = '19:00'): number {
  if (!record.isLate && record.status !== 'late') return 0;
  if (record.lateReason) {
    const match = record.lateReason.match(/(\d+)\s*m/i) || record.lateReason.match(/Late by (\d+)/i);
    if (match) return parseInt(match[1], 10);
  }
  if (record.clockIn) {
    const parts = record.clockIn.match(/(\d{1,2}):(\d{2})/);
    const officeParts = officeStartTime.match(/(\d{1,2}):(\d{2})/);
    if (parts && officeParts) {
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      if (record.clockIn.toLowerCase().includes('pm') && h < 12) h += 12;
      if (record.clockIn.toLowerCase().includes('am') && h === 12) h = 0;
      const offH = parseInt(officeParts[1], 10);
      const offM = parseInt(officeParts[2], 10);
      const inMins = h * 60 + m;
      const offMins = offH * 60 + offM;
      if (inMins > offMins) return inMins - offMins;
    }
  }
  return 0;
}

/**
 * Helper to calculate salary deduction penalty based on late minutes
 */
function getLateFineTier(lateMins: number): { days: number; tierLabel: string; fineStr: string } {
  if (lateMins <= 15) return { days: 0, tierLabel: 'Grace Period', fineStr: '' };
  if (lateMins <= 30) return { days: 0.25, tierLabel: '0.25 day', fineStr: 'Fine 0.25 days salary' };
  if (lateMins <= 60) return { days: 0.5, tierLabel: '0.5 day', fineStr: 'Fine 0.5 days salary' };
  return { days: 1.0, tierLabel: 'Full day', fineStr: 'Fine 1 day salary' };
}

export function EmployeeDashboard({ onNavigate }: EmployeeDashboardProps) {
  const { currentUser } = useAuth();
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
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [selectedDayForInspector, setSelectedDayForInspector] = useState<AttendanceRecord | null>(null);

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

  // =========================================================================
  // 100% REAL-TIME DYNAMIC DATA CALCULATION FOR CURRENT USER (NO FAKE DATA)
  // =========================================================================
  const officeStart = policy?.officeStartTime || '19:00';

  // Filter attendance records strictly for currentUser (current month: October 2026 or all user's historical)
  const myAllRecords = useMemo(() => {
    return attendance
      .filter((a) => a.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser.id]);

  // Current Month Records (starts with '2026-10')
  const myMonthRecords = useMemo(() => {
    return myAllRecords.filter((a) => a.date.startsWith('2026-10'));
  }, [myAllRecords]);

  // Calculations for KPI Cards
  const stats = useMemo(() => {
    const presentRecords = myMonthRecords.filter(
      (r) => r.status === 'present' || (r.clockIn && r.status !== 'absent' && r.status !== 'leave')
    );
    const presentCount = presentRecords.length;

    const lateRecords = myMonthRecords.filter((r) => r.isLate || r.status === 'late');
    const lateDaysCount = lateRecords.length;

    // Calculate total late minutes and late fines
    let totalLateMinutes = 0;
    let lateFineDaysSum = 0;
    let tier025Count = 0;
    let tier050Count = 0;
    let tier100Count = 0;

    const lateBreakdownList: Array<{
      date: string;
      lateMins: number;
      fineDays: number;
      fineStr: string;
    }> = [];

    lateRecords.forEach((r) => {
      const lm = getLateMinutes(r, officeStart);
      totalLateMinutes += lm;
      const { days, fineStr } = getLateFineTier(lm);
      lateFineDaysSum += days;

      if (lm > 15 && lm <= 30) tier025Count++;
      else if (lm > 30 && lm <= 60) tier050Count++;
      else if (lm > 60) tier100Count++;

      lateBreakdownList.push({
        date: r.date,
        lateMins: lm,
        fineDays: days,
        fineStr
      });
    });

    // Approved late requests
    const approvedLateCount = requests.filter(
      (req) =>
        req.userId === currentUser.id &&
        req.status === 'approved' &&
        (req.type === 'late_excuse' || req.type === 'overtime') &&
        req.startDate?.startsWith('2026-10')
    ).length;

    // Absent records
    const absentRecords = myMonthRecords.filter((r) => r.status === 'absent');
    const absentCount = absentRecords.length;

    // Leave records
    const leaveRecords = myMonthRecords.filter(
      (r) => r.status === 'leave' || r.status === 'half_day'
    );
    const leaveCount = leaveRecords.length;

    // Overtime
    const totalOvertimeHours = myMonthRecords.reduce(
      (acc, r) => acc + (r.overtimeHours || 0),
      0
    );

    // Total deductions = late fines (in days) + absent days (1.0 day each)
    const totalDeductionsDays = lateFineDaysSum + absentCount;

    // On-time days (recorded present and NOT late)
    const onTimeCount = myMonthRecords.filter(
      (r) => !r.isLate && r.status !== 'late' && r.status !== 'absent' && r.status !== 'leave' && !!r.clockIn
    ).length;

    // Total active recorded days
    const totalRecordedDays = onTimeCount + lateDaysCount + absentCount + leaveCount;
    const onTimePercentage = totalRecordedDays > 0 ? Math.round((onTimeCount / totalRecordedDays) * 100) : 100;

    return {
      presentCount,
      lateDaysCount,
      totalLateMinutes,
      lateFineDaysSum,
      tier025Count,
      tier050Count,
      tier100Count,
      approvedLateCount,
      absentCount,
      absentRecords,
      leaveCount,
      totalOvertimeHours,
      totalDeductionsDays,
      onTimeCount,
      totalRecordedDays,
      onTimePercentage,
      lateBreakdownList
    };
  }, [myMonthRecords, officeStart, requests, currentUser.id]);

  // Dynamic Donut Chart Slice Calculations
  const donutSlices = useMemo(() => {
    const total = stats.totalRecordedDays;
    const circumference = 2 * Math.PI * 38; // ~238.76

    if (total === 0) {
      return {
        onTimePct: 0,
        latePct: 0,
        absentPct: 0,
        leavePct: 0,
        circumference,
        onTimeDash: circumference,
        lateDash: circumference,
        absentDash: circumference
      };
    }

    const onTimeShare = stats.onTimeCount / total;
    const lateShare = stats.lateDaysCount / total;
    const absentShare = stats.absentCount / total;
    const leaveShare = stats.leaveCount / total;

    return {
      onTimePct: Math.round(onTimeShare * 100),
      latePct: Math.round(lateShare * 100),
      absentPct: Math.round(absentShare * 100),
      leavePct: Math.round(leaveShare * 100),
      circumference,
      onTimeOffset: circumference * (1 - onTimeShare),
      lateOffset: circumference * (1 - lateShare),
      absentOffset: circumference * (1 - absentShare)
    };
  }, [stats]);

  // Max Late Tier Count for progress bars
  const maxLateTierCount = Math.max(stats.tier025Count, stats.tier050Count, stats.tier100Count, 1);

  // Filtered Table Rows based on Search
  const searchFilteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return myMonthRecords;
    const q = searchQuery.toLowerCase();
    return myMonthRecords.filter(
      (r) =>
        r.date.includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.lateReason && r.lateReason.toLowerCase().includes(q))
    );
  }, [myMonthRecords, searchQuery]);

  const displayedRecords = useMemo(() => {
    return fullMonthExpanded ? searchFilteredRecords : searchFilteredRecords.slice(0, 8);
  }, [searchFilteredRecords, fullMonthExpanded]);

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
            placeholder="Search attendance, dates, notes..."
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
            className="relative p-2.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors shadow-xs cursor-pointer"
            title="Noticeboard & Announcements"
          >
            <Bell className="w-4 h-4" />
            {announcements.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          {/* User Profile Chip */}
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10"
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
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 self-start sm:self-auto">
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
                Office Hours: {officeStart} - {policy?.officeEndTime || '04:00'} &middot; Grace: {policy?.gracePeriodMinutes || 15} mins
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
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
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-200/80 dark:border-white/10 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-blue-500" />
              <span>Submit EOD Report</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 4. ROW 1: 6 REALTIME METRIC PILL CARDS (NO MOCK DATA)   */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Present */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-2">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Present</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.presentCount} <span className="text-xs font-normal text-slate-400">{stats.presentCount === 1 ? 'Day' : 'Days'}</span>
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
              {stats.lateDaysCount} <span className="text-xs font-normal text-slate-400">{stats.lateDaysCount === 1 ? 'Day' : 'Days'} &middot; {stats.totalLateMinutes}m</span>
            </div>
            {stats.lateFineDaysSum > 0 ? (
              <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-semibold block mt-0.5">
                Fine {stats.lateFineDaysSum} days salary
              </span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-500 font-semibold block mt-0.5">
                No fines
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Approved late */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Approved late</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.approvedLateCount} <span className="text-xs font-normal text-slate-400">{stats.approvedLateCount === 1 ? 'Day' : 'Days'}</span>
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
              {stats.absentCount} <span className="text-xs font-normal text-slate-400">{stats.absentCount === 1 ? 'Day' : 'Days'}</span>
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
              {stats.leaveCount} <span className="text-xs font-normal text-slate-400">{stats.leaveCount === 1 ? 'Day' : 'Days'}</span>
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
              {stats.totalOvertimeHours} <span className="text-xs font-normal text-slate-400">{stats.totalOvertimeHours === 1 ? 'Hour' : 'Hours'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 5. ROW 2: 3 REALTIME ANALYTICS CARDS (DYNAMIC SVG GRAPHS) */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Attendance Donut · Oct 2026 */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Attendance &middot; Oct 2026
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {stats.totalRecordedDays} logged days
            </span>
          </div>

          <div className="flex items-center justify-around gap-4 pt-1">
            {/* Dynamic Donut Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="12"
                />

                {stats.totalRecordedDays > 0 ? (
                  <>
                    {/* On-Time Slice (Blue) */}
                    {donutSlices.onTimePct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#2563eb"
                        strokeWidth="12"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.onTimeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Late Slice (Amber) */}
                    {donutSlices.latePct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.lateOffset}
                        strokeLinecap="round"
                        transform={`rotate(${donutSlices.onTimePct * 3.6} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Absent Slice (Rose) */}
                    {donutSlices.absentPct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.absentOffset}
                        strokeLinecap="round"
                        transform={`rotate(${(donutSlices.onTimePct + donutSlices.latePct) * 3.6} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </>
                ) : (
                  /* Zero State Ring */
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray={donutSlices.circumference}
                    strokeDashoffset={0}
                    className="opacity-20"
                  />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {stats.totalRecordedDays > 0 ? `${stats.onTimePercentage}%` : '0%'}
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
                <strong className="text-slate-900 dark:text-white">{stats.onTimeCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Late
                </span>
                <strong className="text-slate-900 dark:text-white">{stats.lateDaysCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Absent
                </span>
                <strong className="text-slate-900 dark:text-white">{stats.absentCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Leave
                </span>
                <strong className="text-slate-900 dark:text-white">{stats.leaveCount}</strong>
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
            <span className="text-[10px] font-mono text-slate-400">
              {stats.lateDaysCount} late incident(s)
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Tier 1: 0.25 day (16-30m) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">0.25 day (16-30m)</span>
                <strong className="text-slate-800 dark:text-slate-200">{stats.tier025Count}</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.tier025Count > 0 ? (stats.tier025Count / maxLateTierCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Tier 2: 0.5 day (31-60m) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">0.5 day (31-60m)</span>
                <strong className="text-slate-800 dark:text-slate-200">{stats.tier050Count}</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.tier050Count > 0 ? (stats.tier050Count / maxLateTierCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Tier 3: Full day (>60m) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">Full day (&gt;60m)</span>
                <strong className="text-slate-800 dark:text-slate-200">{stats.tier100Count}</strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.tier100Count > 0 ? (stats.tier100Count / maxLateTierCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Late minutes · Realtime Histogram */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Late minutes
            </h3>
            <span className="text-xs font-mono font-bold text-rose-500">
              {stats.totalLateMinutes} m
            </span>
          </div>

          {/* Realtime Histogram / Bar chart */}
          {stats.lateBreakdownList.length > 0 ? (
            <div className="flex items-end gap-3 h-24 pt-4 px-2">
              {stats.lateBreakdownList.slice(0, 4).map((item, idx) => {
                const maxLate = Math.max(...stats.lateBreakdownList.map((l) => l.lateMins), 60);
                const barHeight = Math.min(100, Math.max(25, Math.round((item.lateMins / maxLate) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{item.lateMins}m</span>
                    <div
                      className="w-full bg-rose-400/80 hover:bg-rose-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${barHeight}%` }}
                      title={`${item.date}: ${item.lateMins}m late`}
                    />
                    <span className="text-[8px] font-mono text-slate-400">
                      {item.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center text-center px-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Punctual Record
              </span>
              <span className="text-[10px] text-slate-400">
                No late arrivals this month!
              </span>
            </div>
          )}

          <span className="text-[10px] font-mono text-slate-400 block pt-1 border-t border-slate-100 dark:border-white/5">
            {stats.lateDaysCount > 0 ? `Last ${Math.min(4, stats.lateDaysCount)} late incident(s)` : 'Zero penalties recorded'}
          </span>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 6. ROW 3: SUMMARY & DEDUCTION CARDS (WITH DETAIL POPUPS) */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Late fine — terms & conditions */}
        <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Late fine &mdash; terms &amp; conditions
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              How check-in after {officeStart} is charged against your salary
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
          >
            Tap for details
          </button>
        </div>

        {/* Card 2: Total deductions · Oct 2026 */}
        <div
          onClick={() => setShowDeductionsModal(true)}
          className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Total deductions &middot; Oct 2026
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Late fines + absent days &mdash; tap for breakdown
            </p>
          </div>

          <span className="text-xl font-black font-mono text-rose-500 shrink-0">
            {stats.totalDeductionsDays} <span className="text-xs font-bold">days</span>
          </span>
        </div>

        {/* Card 3: Warnings · Oct 2026 */}
        <div
          onClick={() => setShowWarningsModal(true)}
          className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Warnings &middot; Oct 2026
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.lateDaysCount >= 3 ? 'High late arrival frequency' : 'No active warnings'}
            </p>
          </div>

          <span className="text-xl font-black font-mono text-slate-900 dark:text-white shrink-0">
            {stats.lateDaysCount >= 3 ? '1' : '0'}
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
                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Notification items from real announcements */}
            <div className="space-y-3 divide-y divide-slate-100 dark:divide-white/5">
              {announcements.length > 0 ? (
                announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="pt-2.5 first:pt-0 space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-1.5">
                      <span>📢</span>
                      <span className="truncate">{ann.title}</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ann.content}
                    </p>
                    <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No company notices at this moment.
                </div>
              )}
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

          {/* Realtime Attendance History Table Card */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                Attendance &middot; Oct 2026 ({myMonthRecords.length} records)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Click any row for full inspector
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-mono text-slate-400">
                    <th className="py-2.5 px-4 font-normal">Date</th>
                    <th className="py-2.5 px-4 font-normal">In</th>
                    <th className="py-2.5 px-4 font-normal">Out</th>
                    <th className="py-2.5 px-4 font-normal text-right">Status / Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                  {displayedRecords.length > 0 ? (
                    displayedRecords.map((row) => {
                      const lateM = getLateMinutes(row, officeStart);
                      const isLateRow = row.isLate || row.status === 'late';
                      const { fineStr } = getLateFineTier(lateM);

                      return (
                        <tr
                          key={row.id || row.date}
                          onClick={() => setSelectedDayForInspector(row)}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                            {row.date}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {row.clockIn || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {row.clockOut || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {row.status === 'absent' && (
                              <div>
                                <span className="text-rose-500 font-semibold">Absent</span>
                                <span className="block text-[9px] text-rose-500 font-semibold">1 day salary</span>
                              </div>
                            )}

                            {row.status === 'leave' && (
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">On Leave</span>
                            )}

                            {row.status === 'half_day' && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">Half Day</span>
                            )}

                            {isLateRow && (
                              <div>
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  {lateM > 0 ? `${lateM}m late` : 'Late'}
                                </span>
                                {fineStr && (
                                  <span className="block text-[9px] text-rose-500 font-semibold">{fineStr}</span>
                                )}
                              </div>
                            )}

                            {!isLateRow && row.status !== 'absent' && row.status !== 'leave' && row.status !== 'half_day' && (
                              <span className="text-slate-600 dark:text-slate-300">On time</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            No attendance logs recorded yet for October 2026
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-sm">
                            Your shifts, punch-ins, and automated punctuality metrics will calculate right here from your first check-in!
                          </p>
                          {!isClockedIn && (
                            <button
                              type="button"
                              onClick={handleClockIn}
                              className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                            >
                              Punch In Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Expand Toggle */}
            {myMonthRecords.length > 8 && (
              <div className="p-3 text-center border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setFullMonthExpanded(!fullMonthExpanded)}
                  className="text-xs font-mono text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{fullMonthExpanded ? 'Collapse view' : `View full month (${myMonthRecords.length} records)`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${fullMonthExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
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
                  Official shift start is <strong className="text-slate-900 dark:text-white font-bold">{officeStart}</strong> with a <strong className="text-slate-900 dark:text-white font-bold">{policy?.gracePeriodMinutes || 15}-minute grace period</strong> until {officeStart === '19:00' ? '07:15 PM' : '09:45 AM'}.
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
                  Late fines and unexcused leaves are automatically computed at month-end payroll reconciliation. To dispute an accidental late clock-in, submit a Time Adjustment request from the Requests Desk.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 9. TOTAL DEDUCTIONS BREAKDOWN MODAL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showDeductionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Monthly Deductions Breakdown
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">October 2026 Audit</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeductionsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">Total Deductions Applied</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400">Includes late fines and absent days</span>
                  </div>
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {stats.totalDeductionsDays} days
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
                  {stats.lateBreakdownList.length === 0 && stats.absentCount === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      No salary deductions logged this month! Keep up the great punctuality.
                    </div>
                  ) : (
                    <>
                      {stats.lateBreakdownList.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.date}</span>
                            <span className="block text-[10px] text-slate-400">Late Arrival ({item.lateMins} minutes late)</span>
                          </div>
                          <span className="font-bold text-rose-500">{item.fineDays} day deduction</span>
                        </div>
                      ))}

                      {stats.absentRecords.map((item, i) => (
                        <div key={'abs-' + i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.date}</span>
                            <span className="block text-[10px] text-slate-400">Unexcused Absence</span>
                          </div>
                          <span className="font-bold text-rose-500">1.0 day deduction</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeductionsModal(false);
                    onNavigate?.('emp_requests');
                  }}
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Submit Late Waiver Request</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeductionsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 10. DISCIPLINARY WARNINGS MODAL                          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showWarningsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Disciplinary Warnings Notice
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {stats.lateDaysCount >= 3 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Attendance Advisory: High Late Frequency</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed font-mono">
                    You have accumulated {stats.lateDaysCount} late arrivals this month exceeding the allowed 2-incident threshold. Please adhere to the {officeStart} schedule to avoid escalated HR review.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pristine Conduct Record</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    No active warnings or disciplinary notices on your profile.
                  </p>
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 11. ATTENDANCE DAY INSPECTOR MODAL                       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedDayForInspector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Attendance Inspector
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Date: {selectedDayForInspector.date}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block">Check-In Time</span>
                    <strong className="text-sm text-slate-900 dark:text-white">
                      {selectedDayForInspector.clockIn || 'Not recorded'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block">Check-Out Time</span>
                    <strong className="text-sm text-slate-900 dark:text-white">
                      {selectedDayForInspector.clockOut || 'Not logged'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold capitalize">{selectedDayForInspector.status}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Work Duration:</span>
                    <span className="font-bold">
                      {selectedDayForInspector.totalWorkMinutes
                        ? `${Math.floor(selectedDayForInspector.totalWorkMinutes / 60)}h ${selectedDayForInspector.totalWorkMinutes % 60}m`
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Overtime Logged:</span>
                    <span className="font-bold text-emerald-500">
                      {selectedDayForInspector.overtimeHours ? `${selectedDayForInspector.overtimeHours} hours` : '0h'}
                    </span>
                  </div>

                  {selectedDayForInspector.isLate && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-white/5 text-rose-500">
                      <span>Late Penalty:</span>
                      <span className="font-bold">
                        {getLateFineTier(getLateMinutes(selectedDayForInspector, officeStart)).fineStr || 'Flagged Late'}
                      </span>
                    </div>
                  )}
                </div>

                {selectedDayForInspector.managerRemarks && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block mb-1">
                      Manager Remarks
                    </span>
                    <p className="text-[11px] text-blue-900 dark:text-blue-200">
                      {selectedDayForInspector.managerRemarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  Close
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
