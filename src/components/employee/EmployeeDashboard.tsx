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
  Calendar,
  ChevronDown,
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
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ExternalLink,
  KeyRound,
  Receipt,
  FilePlus2
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { EODReportModal } from './EODReportModal';
import confetti from 'canvas-confetti';

interface EmployeeDashboardProps {
  onNavigate?: (view: PortalView) => void;
}

// Fluid spring animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
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

  // Clock live timer
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateLong, setCurrentDateLong] = useState('');
  const [currentShiftSeconds, setCurrentShiftSeconds] = useState(0);

  // Real-time ticking clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateLong(now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
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

  // SVG Gauge measurements
  const circleRadius = 46;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (timeLogPercentage / 100) * circleCircumference;

  // =========================================================================
  // 100% REAL-TIME DYNAMIC DATA CALCULATION FOR CURRENT USER (NO FAKE DATA)
  // =========================================================================
  const officeStart = policy?.officeStartTime || '19:00';

  // Filter attendance records strictly for currentUser (current month: October 2026)
  const myAllRecords = useMemo(() => {
    return attendance
      .filter((a) => a.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser.id]);

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
        onTimeOffset: circumference,
        lateOffset: circumference,
        absentOffset: circumference
      };
    }

    const onTimeShare = stats.onTimeCount / total;
    const lateShare = stats.lateDaysCount / total;
    const absentShare = stats.absentCount / total;

    return {
      onTimePct: Math.round(onTimeShare * 100),
      latePct: Math.round(lateShare * 100),
      absentPct: Math.round(absentShare * 100),
      leavePct: Math.round((stats.leaveCount / total) * 100),
      circumference,
      onTimeOffset: circumference * (1 - onTimeShare),
      lateOffset: circumference * (1 - lateShare),
      absentOffset: circumference * (1 - absentShare)
    };
  }, [stats]);

  // Max Late Tier Count for progress bars
  const maxLateTierCount = Math.max(stats.tier025Count, stats.tier050Count, stats.tier100Count, 1);

  const displayedRecords = useMemo(() => {
    return fullMonthExpanded ? myMonthRecords : myMonthRecords.slice(0, 8);
  }, [myMonthRecords, fullMonthExpanded]);

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
      className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100 max-w-7xl mx-auto"
    >
      {/* ======================================================== */}
      {/* 1. LUXURY EXECUTIVE HERO BANNER                          */}
      {/* ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 border-b border-slate-200/70 dark:border-white/[0.07]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Workspace Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              &bull; ID: #{currentUser.id.replace('user-', '').toUpperCase()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              {currentUser.name}
            </span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <span>{currentUser.designation || 'Web Development Executive'}</span>
            <span>&bull;</span>
            <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold">{currentUser.department || 'Operations'}</span>
          </p>
        </div>

        {/* Right Info: Month & Live Date Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>October 2026</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDateLong || 'October 2026'}</span>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 2. EXECUTIVE SHIFT COMMAND CENTER (HERO GLASS CARD)      */}
      {/* ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-blue-50/40 dark:from-[#0d1322] dark:via-[#0e1629] dark:to-[#141b33] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-xl"
      >
        {/* Subtle Ambient Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
          {/* Left: Luxury Circular Progress Ring & Live Telemetry */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Circular Gauge Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 filter drop-shadow-sm" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="ringProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>

                {/* Background Ring Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  className="stroke-slate-200/70 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />

                {/* Animated Luminous Gauge */}
                <circle
                  cx="60"
                  cy="60"
                  r={circleRadius}
                  stroke="url(#ringProgressGradient)"
                  strokeWidth="8"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Inside Gauge Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SHIFT LOG
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {timeLogPercentage}%
                </span>
                <span className="text-[9px] font-medium text-slate-400">
                  Target: 8.0h
                </span>
              </div>
            </div>

            {/* Shift Details & Live Clock */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs ${
                    isClockedIn
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : isShiftCompleted
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-ping' : isShiftCompleted ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  {isClockedIn ? 'Shift In Progress' : isShiftCompleted ? 'Shift Completed' : 'Not Clocked In'}
                </span>

                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {policy?.officeStartTime || '19:00'} &mdash; {policy?.officeEndTime || '04:00'} (Grace: {policy?.gracePeriodMinutes || 15}m)
                </span>
              </div>

              {/* Big Digital Clock Display */}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {isClockedIn ? formattedShiftDuration : currentTimeStr || '00:00:00'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isClockedIn
                    ? `Punched in at ${todayRecord?.clockIn} (${todayRecord?.isLate ? 'Late Arrival' : 'On-Time'})`
                    : isShiftCompleted
                    ? `Completed at ${todayRecord?.clockOut} (Logged ${Math.floor(workedMinutesToday / 60)}h ${workedMinutesToday % 60}m)`
                    : 'Ready to begin work session'}
                </span>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Punctuality and active shift telemetry are synchronized live with enterprise payroll reconciliation.
              </p>
            </div>
          </div>

          {/* Right: Executive Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!isClockedIn && !isShiftCompleted && (
              <button
                type="button"
                onClick={handleClockIn}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>PUNCH IN (START SHIFT)</span>
              </button>
            )}

            {isClockedIn && (
              <button
                type="button"
                onClick={handleClockOut}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>PUNCH OUT (END SHIFT)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowEODModal(true)}
              className="px-5 py-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.07] hover:bg-white dark:hover:bg-white/[0.12] border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Submit EOD Report</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 3. ROW 1: 6 BENTO-GRID KPI CARDS (CLEAN & REFINED)       */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Present */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-emerald-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Present</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.presentCount}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.presentCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
              Logged Attendance
            </span>
          </div>
        </div>

        {/* Card 2: Late Days */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-amber-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Late Days</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.lateDaysCount}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.lateDaysCount === 1 ? 'Day' : 'Days'} &bull; {stats.totalLateMinutes}m
              </span>
            </div>
            {stats.lateFineDaysSum > 0 ? (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/30 text-[10px] font-bold">
                Fine {stats.lateFineDaysSum}d salary
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                Zero fines
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Approved Late */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-sky-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Approved Late</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.approvedLateCount}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.approvedLateCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium block mt-0.5">
              Excuses granted
            </span>
          </div>
        </div>

        {/* Card 4: Absent */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-rose-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.absentCount}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.absentCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Unexcused days
            </span>
          </div>
        </div>

        {/* Card 5: On Leave */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-purple-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.leaveCount}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.leaveCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium block mt-0.5">
              Authorized leaves
            </span>
          </div>
        </div>

        {/* Card 6: Overtime */}
        <div className="group rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] p-4 shadow-xs hover:shadow-md hover:border-indigo-400/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Overtime</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.totalOvertimeHours}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {stats.totalOvertimeHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5">
              Extra hours logged
            </span>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 4. ROW 2: 3 REALTIME ANALYTICS CARDS (CLEAN & SLEEK)     */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card A: Attendance Donut · Oct 2026 */}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Attendance &middot; Oct 2026
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.totalRecordedDays} logged shifts this month
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
              {stats.totalRecordedDays > 0 ? `${stats.onTimePercentage}%` : '0%'}
            </span>
          </div>

          <div className="flex items-center justify-around gap-4 py-2">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="11"
                />

                {stats.totalRecordedDays > 0 ? (
                  <>
                    {/* On-Time (Blue) */}
                    {donutSlices.onTimePct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#2563eb"
                        strokeWidth="11"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.onTimeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Late (Amber) */}
                    {donutSlices.latePct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="11"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.lateOffset}
                        strokeLinecap="round"
                        transform={`rotate(${donutSlices.onTimePct * 3.6} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Absent (Rose) */}
                    {donutSlices.absentPct > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="11"
                        strokeDasharray={donutSlices.circumference}
                        strokeDashoffset={donutSlices.absentOffset}
                        strokeLinecap="round"
                        transform={`rotate(${(donutSlices.onTimePct + donutSlices.latePct) * 3.6} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </>
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="11"
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
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  ON TIME
                </span>
              </div>
            </div>

            {/* Clean Legend */}
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  On time
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{stats.onTimeCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Late
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{stats.lateDaysCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Absent
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{stats.absentCount}</strong>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Leave
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{stats.leaveCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Late Fine Breakdown */}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Late Fine &middot; Oct 2026
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.lateDaysCount} incident(s) under deduction policy
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Policy
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Tier 1: 0.25 day (16-30m) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">0.25 day (16-30m)</span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.tier025Count}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.tier025Count > 0 ? (stats.tier025Count / maxLateTierCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Tier 2: 0.5 day (31-60m) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">0.5 day (31-60m)</span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.tier050Count}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.tier050Count > 0 ? (stats.tier050Count / maxLateTierCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Tier 3: Full day (>60m) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Full day (&gt;60m)</span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.tier100Count}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-2 rounded-full overflow-hidden">
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

        {/* Card C: Late Minutes Histogram (Refined Column Chart, NO Giant Ugly Block) */}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Late Minutes
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total penalty duration
              </p>
            </div>
            <span className="text-base font-extrabold text-rose-500 font-mono">
              {stats.totalLateMinutes}m
            </span>
          </div>

          {/* Refined Histogram Column Chart */}
          {stats.lateBreakdownList.length > 0 ? (
            <div className="pt-2">
              <div className="h-28 flex items-end justify-center gap-6 px-3 border-b border-slate-100 dark:border-white/5 pb-2">
                {stats.lateBreakdownList.slice(0, 4).map((item, idx) => {
                  const maxM = Math.max(...stats.lateBreakdownList.map((l) => l.lateMins), 60);
                  const barH = Math.min(100, Math.max(30, Math.round((item.lateMins / maxM) * 100)));

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-rose-500 font-mono">
                        {item.lateMins}m
                      </span>
                      <div
                        className="w-10 rounded-t-xl bg-gradient-to-t from-rose-500 to-amber-400 shadow-xs hover:opacity-90 transition-all cursor-pointer"
                        style={{ height: `${barH}%` }}
                        title={`${item.date}: ${item.lateMins} minutes late`}
                      />
                      <span className="text-[10px] font-medium text-slate-400">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-400 text-center block pt-2">
                Recent late arrival logs &middot; Click row in table for details
              </span>
            </div>
          ) : (
            <div className="h-28 flex flex-col items-center justify-center text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pristine Attendance Record
              </span>
              <span className="text-[11px] text-slate-400">
                Zero late arrival minutes logged this month!
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 5. ROW 3: POLICY, DEDUCTIONS & WARNINGS SUMMARY TILES     */}
      {/* ======================================================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Late fine terms */}
        <div
          onClick={() => setShowPolicyModal(true)}
          className="group rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 shadow-xs hover:shadow-md hover:border-blue-400/50 transition-all cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Late Fine Terms &amp; Policy
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Check-in after {officeStart} rules &amp; deduction tiers
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </div>

        {/* Card 2: Total Deductions */}
        <div
          onClick={() => setShowDeductionsModal(true)}
          className="group rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 shadow-xs hover:shadow-md hover:border-rose-400/50 transition-all cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Total Deductions &middot; Oct 2026
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Late fines + absent days itemized breakdown
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {stats.totalDeductionsDays}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1">days</span>
          </div>
        </div>

        {/* Card 3: Warnings */}
        <div
          onClick={() => setShowWarningsModal(true)}
          className="group rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 shadow-xs hover:shadow-md hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Warnings &middot; Oct 2026
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.lateDaysCount >= 3 ? '1 active late arrival advisory' : 'No disciplinary notices active'}
              </p>
            </div>
          </div>

          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {stats.lateDaysCount >= 3 ? '1' : '0'}
          </span>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 6. ROW 4: 2-COLUMN NOTIFICATIONS & ATTENDANCE TABLE       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: RECENT NOTIFICATIONS (4 Cols)             */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Notices
              </h3>
              <button
                type="button"
                onClick={() => onNavigate?.('emp_noticeboard')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 dark:divide-white/5">
              {announcements.length > 0 ? (
                announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="pt-3 first:pt-0 space-y-1">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-1.5">
                      <span className="text-sm">📢</span>
                      <span className="truncate">{ann.title}</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
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
          {/* 4 Luxury Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('emp_requests')}
              className="py-3 px-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-blue-500/60 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FilePlus2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>New Request</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('emp_requests')}
              className="py-3 px-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-blue-500/60 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plane className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Apply Leave</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('emp_payslips')}
              className="py-3 px-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-blue-500/60 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Salary Slip</span>
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="py-3 px-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-blue-500/60 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Reset Password</span>
            </button>
          </div>

          {/* Luxury Realtime Attendance Table Card */}
          <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Attendance &middot; Oct 2026 ({myMonthRecords.length} records)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Tap any record to inspect complete audit timeline
                </span>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10px] font-semibold text-slate-500">
                Live Data
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-white/[0.01]">
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">In</th>
                    <th className="py-3 px-5">Out</th>
                    <th className="py-3 px-5 text-right">Status / Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {displayedRecords.length > 0 ? (
                    displayedRecords.map((row) => {
                      const lateM = getLateMinutes(row, officeStart);
                      const isLateRow = row.isLate || row.status === 'late';
                      const { fineStr } = getLateFineTier(lateM);

                      return (
                        <tr
                          key={row.id || row.date}
                          onClick={() => setSelectedDayForInspector(row)}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{row.date}</span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {row.clockIn || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {row.clockOut || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {row.status === 'absent' && (
                              <div className="inline-flex flex-col items-end">
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                                  Absent
                                </span>
                                <span className="text-[10px] text-rose-500 font-semibold mt-0.5">
                                  1 day salary
                                </span>
                              </div>
                            )}

                            {row.status === 'leave' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                                On Leave
                              </span>
                            )}

                            {row.status === 'half_day' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                Half Day
                              </span>
                            )}

                            {isLateRow && (
                              <div className="inline-flex flex-col items-end">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                                  {lateM > 0 ? `${lateM}m late` : 'Late'}
                                </span>
                                {fineStr && (
                                  <span className="text-[10px] text-rose-500 font-semibold mt-0.5">
                                    {fineStr}
                                  </span>
                                )}
                              </div>
                            )}

                            {!isLateRow && row.status !== 'absent' && row.status !== 'leave' && row.status !== 'half_day' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                On time
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            No attendance logs recorded yet for October 2026
                          </p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Your shifts, punch-ins, and automated punctuality metrics will calculate right here from your first check-in!
                          </p>
                          {!isClockedIn && (
                            <button
                              type="button"
                              onClick={handleClockIn}
                              className="mt-3 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
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
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
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
      {/* 7. LATE POLICY DETAILS MODAL                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Late Fine &amp; Shift Terms
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  Official shift starts at <strong className="text-slate-900 dark:text-white font-bold">{officeStart}</strong> with a <strong className="text-slate-900 dark:text-white font-bold">{policy?.gracePeriodMinutes || 15}-minute grace period</strong>.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>16m &mdash; 30m late:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">0.25 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>31m &mdash; 60m late:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">0.5 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>&gt; 60m late:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">1.0 full day salary deduction</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unannounced absence:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">1.0 day salary deduction</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Late fines and unexcused leaves are automatically computed at month-end payroll reconciliation. To dispute an accidental late clock-in, submit a Late Excuse request from the Requests Desk.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 8. TOTAL DEDUCTIONS BREAKDOWN MODAL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showDeductionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Monthly Deductions Breakdown
                    </h3>
                    <span className="text-[11px] text-slate-400">October 2026 Audit</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeductionsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">Total Deductions Applied</span>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">Late arrivals + absent days combined</span>
                  </div>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    {stats.totalDeductionsDays} days
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
                  {stats.lateBreakdownList.length === 0 && stats.absentCount === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No salary deductions logged this month! Keep up the great punctuality.
                    </div>
                  ) : (
                    <>
                      {stats.lateBreakdownList.map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.date}</span>
                            <span className="block text-[11px] text-slate-400">Late Arrival ({item.lateMins} minutes late)</span>
                          </div>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{item.fineDays} day deduction</span>
                        </div>
                      ))}

                      {stats.absentRecords.map((item, i) => (
                        <div key={'abs-' + i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.date}</span>
                            <span className="block text-[11px] text-slate-400">Unexcused Absence</span>
                          </div>
                          <span className="font-bold text-rose-600 dark:text-rose-400">1.0 day deduction</span>
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
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Submit Late Waiver Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeductionsModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 9. DISCIPLINARY WARNINGS MODAL                           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showWarningsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Disciplinary Warnings Notice
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {stats.lateDaysCount >= 3 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Attendance Advisory: High Late Frequency</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    You have accumulated {stats.lateDaysCount} late arrivals this month exceeding the allowed 2-incident threshold. Please adhere to the {officeStart} schedule to avoid escalated HR review.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pristine Conduct Record</h4>
                  <p className="text-xs text-slate-400">
                    No active warnings or disciplinary notices on your profile.
                  </p>
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 10. ATTENDANCE DAY INSPECTOR MODAL                       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedDayForInspector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Attendance Inspector
                    </h3>
                    <span className="text-[11px] text-slate-400">Date: {selectedDayForInspector.date}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Check-In Time</span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {selectedDayForInspector.clockIn || 'Not recorded'}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Check-Out Time</span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {selectedDayForInspector.clockOut || 'Not logged'}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2">
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
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/5 text-rose-500">
                      <span>Late Penalty:</span>
                      <span className="font-bold">
                        {getLateFineTier(getLateMinutes(selectedDayForInspector, officeStart)).fineStr || 'Flagged Late'}
                      </span>
                    </div>
                  )}
                </div>

                {selectedDayForInspector.managerRemarks && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block mb-1">
                      Manager Remarks
                    </span>
                    <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                      {selectedDayForInspector.managerRemarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
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
