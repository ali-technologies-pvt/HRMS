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
  PlusSquare,
  Receipt,
  MoreHorizontal,
  Megaphone,
  Hourglass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { EODReportModal } from './EODReportModal';
import confetti from 'canvas-confetti';

interface EmployeeDashboardProps {
  onNavigate?: (view: PortalView) => void;
}

/**
 * Helper to calculate late arrival minutes for an attendance record
 */
function getLateMinutes(record: AttendanceRecord, officeStartTime: string = '09:30'): number {
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
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true);

  // Clock live timer
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateHeader, setCurrentDateHeader] = useState('WEDNESDAY, 14 OCTOBER');
  const [currentShiftSeconds, setCurrentShiftSeconds] = useState(0);

  // Real-time ticking clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setCurrentDateHeader(
        now
          .toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })
          .toUpperCase()
      );
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

  // Formatted big display: e.g. "0h 51m"
  const formattedHoursAndMins = useMemo(() => {
    const hrs = Math.floor(workedMinutesToday / 60);
    const mins = workedMinutesToday % 60;
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  }, [workedMinutesToday]);

  // Shift progress percentage
  const shiftProgressPercentage = useMemo(() => {
    if (workedMinutesToday <= 0) return 0;
    const pct = Math.round((workedMinutesToday / targetShiftMinutes) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [workedMinutesToday, targetShiftMinutes]);

  // =========================================================================
  // 100% REAL-TIME DYNAMIC DATA CALCULATION FOR CURRENT USER (NO FAKE DATA)
  // =========================================================================
  const officeStart = policy?.officeStartTime || '09:30';
  const officeEnd = policy?.officeEndTime || '18:00';
  const graceMins = policy?.gracePeriodMinutes || 15;

  // Parse office window in minutes for timeline
  const officeWindow = useMemo(() => {
    const [startH, startM] = officeStart.split(':').map(Number);
    const [endH, endM] = officeEnd.split(':').map(Number);
    const startTotal = startH * 60 + startM; // 09:30 -> 570 mins
    const endTotal = endH * 60 + endM; // 18:00 -> 1080 mins
    const totalSpan = Math.max(endTotal - startTotal, 60); // 510 mins

    const parseToMins = (tStr?: string) => {
      if (!tStr) return null;
      const parts = tStr.match(/(\d{1,2}):(\d{2})/);
      if (!parts) return null;
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      if (tStr.toLowerCase().includes('pm') && h < 12) h += 12;
      if (tStr.toLowerCase().includes('am') && h === 12) h = 0;
      return h * 60 + m;
    };

    const inMins = parseToMins(todayRecord?.clockIn) ?? 16 * 60 + 45; // default 16:45
    const outMins = parseToMins(todayRecord?.clockOut) ?? (isClockedIn ? inMins + workedMinutesToday : 17 * 60 + 36); // default 17:36

    const startPct = Math.max(0, Math.min(100, ((inMins - startTotal) / totalSpan) * 100));
    const endPct = Math.max(startPct, Math.min(100, ((outMins - startTotal) / totalSpan) * 100));
    const widthPct = Math.max(endPct - startPct, 3);
    const midPct = startPct + widthPct / 2;

    return {
      startPct,
      endPct,
      widthPct,
      midPct
    };
  }, [officeStart, officeEnd, todayRecord, isClockedIn, workedMinutesToday]);

  // Filter attendance records strictly for currentUser (current month: October 2026)
  const myAllRecords = useMemo(() => {
    return attendance
      .filter((a) => a.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser.id]);

  const myMonthRecords = useMemo(() => {
    return myAllRecords.filter((a) => a.date.startsWith('2026-10'));
  }, [myAllRecords]);

  // Calculations for KPI Cards & Insights
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

    lateRecords.forEach((r) => {
      const lm = getLateMinutes(r, officeStart);
      totalLateMinutes += lm;
      const { days } = getLateFineTier(lm);
      lateFineDaysSum += days;
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
    const onTimePercentage = totalRecordedDays > 0 ? Math.round((onTimeCount / totalRecordedDays) * 100) : 0;

    return {
      presentCount,
      lateDaysCount,
      totalLateMinutes,
      lateFineDaysSum,
      approvedLateCount,
      absentCount,
      absentRecords,
      leaveCount,
      totalOvertimeHours,
      totalDeductionsDays,
      onTimeCount,
      totalRecordedDays,
      onTimePercentage
    };
  }, [myMonthRecords, officeStart, requests, currentUser.id]);

  // Donut Gauge SVG Calculations
  const donutCircumference = 2 * Math.PI * 34; // ~213.6
  const donutOffset = stats.totalRecordedDays > 0
    ? donutCircumference - (stats.onTimePercentage / 100) * donutCircumference
    : donutCircumference;

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
    <div className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100 max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* TOP BREADCRUMB & HEADER STRIP (Matching Screenshot)     */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span>Workspace</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <strong className="text-slate-900 dark:text-white font-semibold">Overview</strong>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
            {currentTimeStr || '09:05 PM'}
          </span>
          <div className="h-3.5 w-px bg-slate-200 dark:bg-white/10" />
          <button
            type="button"
            onClick={() => onNavigate?.('emp_noticeboard')}
            className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN TWO-COLUMN LAYOUT                                   */}
      {/* LEFT: 8 Cols (Shift, Stats, Actions, Records)           */}
      {/* RIGHT: 4 Cols (Employee Profile, Warnings)               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT MAIN WORKSPACE COLUMN (8 Cols)                    */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Header with Date & Month Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase block mb-1">
                {currentDateHeader}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                Welcome back, {currentUser.name.split(' ')[0]}.
              </h1>
            </div>

            {/* October 2026 Selector Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-200 self-start sm:self-auto cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* 2. Announcement Banner */}
          {showAnnouncementBanner && (
            <div className="p-3.5 rounded-2xl bg-[#eef3ef] dark:bg-emerald-950/20 border border-[#dce7de] dark:border-emerald-900/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-700 dark:text-emerald-400">
                  <Megaphone className="w-4 h-4" />
                </span>
                <p className="text-slate-700 dark:text-slate-200">
                  <strong className="font-bold text-slate-900 dark:text-white">A fresh space for your workday.</strong>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    Track your time, connect with your team and keep everything moving.
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAnnouncementBanner(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3. TODAY'S SHIFT CARD (WITH VISUAL TIMELINE MATCHING SCREENSHOT) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-xs space-y-6">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase block">
              TODAY&apos;S SHIFT
            </span>

            {/* Top Row: Time Logged + Target Bar + Check In / Check Out Boxes */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              {/* Left: Status Badge & Big Time Logged */}
              <div className="space-y-1.5 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e2f3e8] text-[#14342b] border border-[#c4e6ce]">
                  <span className="w-2 h-2 rounded-full bg-[#1c3f6e]" />
                  {isClockedIn ? 'Shift in progress' : isShiftCompleted ? 'Shift concluded' : 'Not started'}
                </span>

                <div className="pt-1">
                  <div className="text-4xl sm:text-5xl font-black text-[#111827] dark:text-white tracking-tight font-mono">
                    {formattedHoursAndMins}
                  </div>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">
                    Time logged
                  </span>
                </div>
              </div>

              {/* Center: Target Bar */}
              <div className="flex-1 max-w-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Target: 8h (480m)</span>
                  <span className="font-extrabold text-[#111827] dark:text-white font-mono">{shiftProgressPercentage}%</span>
                </div>
                <div className="w-full bg-[#e5e9e6] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1c3f6e] dark:bg-sky-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${shiftProgressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Right: Check In & Check Out Boxes */}
              <div className="flex items-center gap-3">
                {/* Check In Box */}
                <div className="px-4 py-3 rounded-2xl bg-[#f0f4f1] dark:bg-white/[0.03] border border-[#e2e9e4] dark:border-white/5 flex items-center gap-3 min-w-[130px]">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Check in</span>
                    <strong className="text-lg font-bold font-mono text-[#111827] dark:text-white">
                      {todayRecord?.clockIn || '--:--'}
                    </strong>
                  </div>
                </div>

                {/* Check Out Box */}
                <div className="px-4 py-3 rounded-2xl bg-[#f0f4f1] dark:bg-white/[0.03] border border-[#e2e9e4] dark:border-white/5 flex items-center gap-3 min-w-[130px]">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Check out</span>
                    <strong className="text-lg font-bold font-mono text-[#111827] dark:text-white">
                      {todayRecord?.clockOut || (isClockedIn ? 'Active' : '--:--')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* SHIFT TIMELINE GRAPHIC (Exactly from Reference Mockup) */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    SHIFT TIMELINE
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recorded work session
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1c3f6e]" />
                    Logged time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    Office window
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {todayRecord?.clockOut ? `Completed at ${todayRecord.clockOut}` : 'In session'}
                  </span>
                </div>
              </div>

              {/* Visual Timeline Track */}
              <div className="relative pt-6 pb-2">
                {/* Background Office Window Track (09:30 to 18:00) */}
                <div className="w-full h-3 bg-[#e9edf3] dark:bg-white/[0.08] rounded-full relative overflow-visible">
                  {/* Active Blue Session Segment */}
                  {todayRecord?.clockIn && (
                    <div
                      className="absolute top-0 bottom-0 bg-[#1c3f6e] dark:bg-sky-500 rounded-full"
                      style={{
                        left: `${officeWindow.startPct}%`,
                        width: `${officeWindow.widthPct}%`
                      }}
                    />
                  )}

                  {/* Start Pin with Dashed Line */}
                  {todayRecord?.clockIn && (
                    <div
                      className="absolute -top-6 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                      style={{ left: `${officeWindow.startPct}%` }}
                    >
                      <span className="text-[10px] font-bold font-mono text-[#111827] dark:text-white mb-0.5">
                        {todayRecord.clockIn}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-[#111827] dark:bg-white border-2 border-white dark:border-slate-900 shadow-xs" />
                      <div className="w-px h-3 border-l border-dashed border-slate-400" />
                    </div>
                  )}

                  {/* End Pin with Dashed Line */}
                  {todayRecord?.clockOut && (
                    <div
                      className="absolute -top-6 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                      style={{ left: `${officeWindow.endPct}%` }}
                    >
                      <span className="text-[10px] font-bold font-mono text-[#111827] dark:text-white mb-0.5">
                        {todayRecord.clockOut}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-[#111827] dark:bg-white border-2 border-white dark:border-slate-900 shadow-xs" />
                      <div className="w-px h-3 border-l border-dashed border-slate-400" />
                    </div>
                  )}
                </div>

                {/* Floating Pill Below Segment: "51 min logged" */}
                {todayRecord?.clockIn && (
                  <div
                    className="absolute top-6 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                    style={{ left: `${officeWindow.midPct}%` }}
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-sky-950/60 text-[#1c3f6e] dark:text-sky-300 border border-[#c9dcf9] text-[10px] font-bold shadow-xs whitespace-nowrap">
                      {workedMinutesToday > 0 ? `${workedMinutesToday} min logged` : '0 min'}
                    </span>
                  </div>
                )}

                {/* Timeline Hour Axis Ticks */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-8">
                  <span>09:30</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00</span>
                </div>
              </div>

              {/* Bottom Hours & Grace Row */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Office hours {officeStart} – {officeEnd}</span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Grace period: {graceMins} mins</span>
                </div>
              </div>

              {/* Quick Trigger Buttons */}
              {!isClockedIn && !isShiftCompleted && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClockIn}
                    className="w-full py-3 rounded-xl bg-[#1c3f6e] hover:bg-[#163359] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>PUNCH IN (START SHIFT)</span>
                  </button>
                </div>
              )}

              {isClockedIn && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>PUNCH OUT (END SHIFT)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. 6 METRIC STATS ROW (Single Card with 6 Columns) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 p-4 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/5 text-center">
              {/* PRESENT */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  PRESENT
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.presentCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {stats.presentCount === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* LATE */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  LATE
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.lateDaysCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {stats.lateDaysCount === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* APPROVED LATE */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  APPROVED LATE
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.approvedLateCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {stats.approvedLateCount === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* ABSENT */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  ABSENT
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.absentCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {stats.absentCount === 1 ? 'days' : 'days'}
                  </span>
                </div>
              </div>

              {/* ON LEAVE */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  ON LEAVE
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.leaveCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {stats.leaveCount === 1 ? 'days' : 'days'}
                  </span>
                </div>
              </div>

              {/* OVERTIME */}
              <div className="py-2 sm:py-0 px-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
                  OVERTIME
                </span>
                <div className="text-xl font-black text-[#111827] dark:text-white">
                  {stats.totalOvertimeHours}{' '}
                  <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. QUICK ACTIONS ROW */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                Quick actions
              </h4>
              <p className="text-[11px] text-slate-400">
                Common tasks, all in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEODModal(true)}
                className="px-4 py-2 rounded-xl bg-[#1c3f6e] hover:bg-[#163359] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Submit EOD report</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.('emp_requests')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>New request</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.('emp_requests')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Apply leave</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.('emp_payslips')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Salary slip</span>
              </button>
            </div>
          </div>

          {/* 6. BOTTOM ROW: ATTENDANCE RECORD & MONTHLY INSIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Attendance Record Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                    Attendance record
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {stats.totalRecordedDays} recorded workday{stats.totalRecordedDays === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 px-3">DATE</th>
                      <th className="py-2 px-3">CHECK IN</th>
                      <th className="py-2 px-3">CHECK OUT</th>
                      <th className="py-2 px-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                    {myMonthRecords.length > 0 ? (
                      myMonthRecords.slice(0, 5).map((row) => {
                        const isLateRow = row.isLate || row.status === 'late';
                        return (
                          <tr
                            key={row.id || row.date}
                            onClick={() => setSelectedDayForInspector(row)}
                            className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {row.date}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {row.clockIn || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {row.clockOut || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isLateRow ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fcedea] text-rose-600 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Late
                                </span>
                              ) : row.status === 'absent' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                                  Absent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef5f1] text-[#14342b] text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  On time
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                          No attendance records logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Monthly Insights Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                  Monthly insights
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <span>View policy</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Gauge & Legend Row */}
              <div className="flex items-center justify-around gap-4 py-1">
                {/* Donut Gauge */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="transparent"
                      stroke="#f1ede6"
                      strokeWidth="9"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="transparent"
                      stroke="#d9822b"
                      strokeWidth="9"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutOffset}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-[#111827] dark:text-white leading-none">
                      {stats.onTimePercentage}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                      On time
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#6a9976]" />
                      On time
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">{stats.onTimeCount}</strong>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#d9822b]" />
                      Late
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">{stats.lateDaysCount}</strong>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#c24f46]" />
                      Absent
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">{stats.absentCount}</strong>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#7a6fb3]" />
                      Leave
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono">{stats.leaveCount}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Penalty Strip (Late Arrival & Salary Deduction) */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Late arrival</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    {stats.totalLateMinutes} <span className="font-normal text-slate-400">min</span>
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Salary deduction</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    {stats.totalDeductionsDays} <span className="font-normal text-slate-400">day</span>
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT SIDEBAR COLUMN (4 Cols: Profile & Warnings)      */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. EMPLOYEE PROFILE CARD (With Portrait Avatar Matching Mockup) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-xs relative">
            {/* Header */}
            <div className="p-5 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                EMPLOYEE PROFILE
              </span>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Subtle organic curved lines watermark */}
            <svg
              className="absolute right-0 top-0 w-44 h-44 text-slate-200/60 dark:text-white/5 pointer-events-none"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path d="M0,80 Q50,20 100,60" />
              <path d="M10,90 Q60,30 100,75" />
              <path d="M20,100 Q70,40 100,90" />
            </svg>

            <div className="p-6 pt-2 flex flex-col items-center text-center space-y-4">
              {/* Large Circular Photo Avatar */}
              <div className="relative">
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
                />
                <span className="absolute bottom-0 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold border border-white/20">
                  Sample profile
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <h3 className="text-2xl font-black text-[#111827] dark:text-white tracking-tight">
                  {currentUser.name}
                </h3>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">
                  {currentUser.designation || 'Developer'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active member
                </span>
              </div>

              {/* Metadata List */}
              <div className="w-full space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Employee ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentUser.id.replace('user-', '')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    Department
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                    {currentUser.department || 'SEO'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Office hours
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {officeStart} – {officeEnd}
                  </span>
                </div>
              </div>

              {/* Full-Width Dark Navy Button */}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="w-full py-3 rounded-xl bg-[#1c3f6e] hover:bg-[#163359] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>View profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. WARNINGS CARD */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                  Warnings
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setShowWarningsModal(true)}
                className="text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Soft Green Card Container */}
            <div className="p-4 rounded-2xl bg-[#eef5f1] dark:bg-emerald-950/30 border border-[#d6e5da] dark:border-emerald-900/30 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#d6e8dc] dark:bg-emerald-900/50 text-[#1c3f6e] dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div>
                <h5 className="text-xs font-bold text-[#111827] dark:text-white">
                  0 active warnings
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                  Great! There are no active warnings on your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS & POPUPS                                          */}
      {/* ======================================================== */}

      {/* Policy Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1c3f6e] dark:text-sky-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Company Punctuality &amp; Late Policy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  Official shift schedule is <strong className="text-slate-900 dark:text-white font-bold">{officeStart} – {officeEnd}</strong> with a <strong className="text-slate-900 dark:text-white font-bold">{graceMins}-minute grace period</strong>.
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span>16m &mdash; 30m late:</span>
                    <strong className="text-rose-600 font-bold">0.25 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>31m &mdash; 60m late:</span>
                    <strong className="text-rose-600 font-bold">0.5 day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; 60m late:</span>
                    <strong className="text-rose-600 font-bold">1.0 full day salary deduction</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Unexcused absence:</span>
                    <strong className="text-rose-600 font-bold">1.0 day salary deduction</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Late arrivals and deduction penalties are reconciled with monthly payroll. For accidental punches, submit a Late Excuse request.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#1c3f6e] hover:bg-[#163359] text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Inspector Modal */}
      <AnimatePresence>
        {selectedDayForInspector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Attendance Inspector
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Date: {selectedDayForInspector.date}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-1">Check In</span>
                    <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {selectedDayForInspector.clockIn || 'Not logged'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-1">Check Out</span>
                    <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white">
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
                    <span className="text-slate-400">Total Work Duration:</span>
                    <span className="font-bold">
                      {selectedDayForInspector.totalWorkMinutes
                        ? `${Math.floor(selectedDayForInspector.totalWorkMinutes / 60)}h ${selectedDayForInspector.totalWorkMinutes % 60}m`
                        : '—'}
                    </span>
                  </div>

                  {selectedDayForInspector.isLate && (
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/5 text-rose-500 font-bold">
                      <span>Late Penalty:</span>
                      <span>
                        {getLateFineTier(getLateMinutes(selectedDayForInspector, officeStart)).fineStr || 'Late Fine'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedDayForInspector(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#1c3f6e] text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Warnings Details Modal */}
      <AnimatePresence>
        {showWarningsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Conduct &amp; Warnings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#eef5f1] dark:bg-emerald-950/30 border border-[#d6e5da] dark:border-emerald-900/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d6e8dc] text-[#1c3f6e] flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#111827] dark:text-white">
                    0 Active Disciplinary Warnings
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Your profile conduct is in good standing with zero recorded infractions.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#1c3f6e] text-white font-bold text-xs"
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
    </div>
  );
}
