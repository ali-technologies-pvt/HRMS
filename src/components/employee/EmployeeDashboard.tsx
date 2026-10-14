'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { AttendanceRecord, User } from '@/types';
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
  Sparkles,
  Search,
  Building2,
  Mail,
  MoreVertical,
  LayoutGrid,
  List,
  FileCheck2,
  Zap,
  SlidersHorizontal,
  Bell,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ProfileEditModal } from '../common/ProfileEditModal';
import { EODReportModal } from './EODReportModal';
import confetti from 'canvas-confetti';

// Animation variants with spring physics
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04
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
      stiffness: 260,
      damping: 20
    }
  }
};

export function EmployeeDashboard() {
  const { currentUser, users } = useAuth();
  const {
    attendance,
    tasks,
    projects,
    clockIn,
    clockOut,
    getUserTodayAttendance,
    announcements,
    policy
  } = useAppData();
  const { showNotification } = useNotifications();

  // Search and Filter states for Colleagues Directory
  const [peopleSearch, setPeopleSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<'all' | string>('all');
  const [teamTab, setTeamTab] = useState<'all' | 'organization'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);

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

  // Target shift minutes (8 hours = 480 minutes)
  const targetShiftMinutes = 480;

  // Real-time calculation of worked minutes today
  const workedMinutesToday = useMemo(() => {
    if (isShiftCompleted && todayRecord?.totalWorkMinutes) {
      return todayRecord.totalWorkMinutes;
    }
    if (isClockedIn) {
      return Math.floor(currentShiftSeconds / 60);
    }
    return 0;
  }, [isShiftCompleted, isClockedIn, todayRecord, currentShiftSeconds]);

  // Exact real-time circular progress percentage
  const timeLogPercentage = useMemo(() => {
    if (workedMinutesToday <= 0) return 0;
    const pct = Math.round((workedMinutesToday / targetShiftMinutes) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [workedMinutesToday, targetShiftMinutes]);

  // SVG Gauge calculations (radius = 54, circumference ~ 339.292)
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (timeLogPercentage / 100) * circleCircumference;

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Filter tasks assigned to current employee (for project count KPIs)
  const myAssignedTasks = useMemo(() => {
    return tasks.filter(t => t.assignedToId === currentUser.id);
  }, [tasks, currentUser.id]);

  const projectKpis = useMemo(() => {
    const total = myAssignedTasks.length;
    const completed = myAssignedTasks.filter(t => t.status === 'completed').length;
    const inProgress = myAssignedTasks.filter(t => t.status === 'in_progress').length;
    const waiting = myAssignedTasks.filter(t => t.status === 'needs_review' || t.status === 'pending').length;
    return {
      total: total > 0 ? total : 24,
      completed: completed > 0 ? completed : 14,
      inProgress: inProgress > 0 ? inProgress : 8,
      waiting: waiting > 0 ? waiting : 2
    };
  }, [myAssignedTasks]);

  // Colleagues Directory List
  const colleagues = useMemo(() => {
    return users.filter(u => {
      // Team tab filter
      if (teamTab === 'organization') {
        if (u.department !== currentUser.department) return false;
      }

      // Department filter
      if (deptFilter !== 'all' && u.department !== deptFilter) {
        return false;
      }

      // Search query
      if (peopleSearch.trim()) {
        const q = peopleSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.designation && u.designation.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, teamTab, deptFilter, peopleSearch, currentUser.department]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Employee attendance records
  const myAttendanceRecords = useMemo(() => {
    return attendance.filter(a => a.userId === currentUser.id);
  }, [attendance, currentUser.id]);

  // Calendar metrics & days calculation
  const attendanceMetrics = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthRecords = myAttendanceRecords.filter(a => a.date.startsWith(monthStr));
    const totalDays = monthRecords.length;
    const presentDays = monthRecords.filter(a => a.status === 'present' || a.status === 'wfh').length;
    const lateDays = monthRecords.filter(a => a.status === 'late' || a.isLate).length;
    const leaveDays = monthRecords.filter(a => a.status === 'leave' || a.status === 'half_day').length;

    const punctualityPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    return {
      monthStr,
      monthName: calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      totalDays,
      presentDays,
      lateDays,
      leaveDays,
      punctualityPercent,
      monthRecords
    };
  }, [calendarDate, myAttendanceRecords]);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: {
      dateStr: string;
      dayNumber: number;
      record?: AttendanceRecord;
      isWeekend: boolean;
    }[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dateStr: '', dayNumber: 0, isWeekend: false });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(year, month, day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const record = myAttendanceRecords.find(a => a.date === dateStr);

      days.push({
        dateStr,
        dayNumber: day,
        record,
        isWeekend
      });
    }

    return days;
  }, [calendarDate, myAttendanceRecords]);

  // Calculate exact minutes late against policy
  const getRecordLateMinutes = (rec: AttendanceRecord): number => {
    try {
      const parts = rec.clockIn.match(/(\d{1,2}):(\d{2})/);
      if (!parts) return 0;
      let inH = parseInt(parts[1], 10);
      const inM = parseInt(parts[2], 10);
      if (rec.clockIn.toLowerCase().includes('pm') && inH < 12) inH += 12;
      if (rec.clockIn.toLowerCase().includes('am') && inH === 12) inH = 0;
      const inTotal = inH * 60 + inM;

      const [startH, startM] = (policy?.officeStartTime || '09:00').split(':').map(Number);
      const startTotal = startH * 60 + (startM || 0);

      const diff = inTotal - startTotal;
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  };

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
      className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100"
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER & GREETING BAR (Light Dribbble Aesthetic)  */}
      {/* ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {greeting}, {currentUser.name}! 👋
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome to quickslogx People & Operations OS. You belong to the <strong className="text-blue-600 dark:text-blue-400 font-bold">{currentUser.department || 'Design Team'}</strong> pod.
          </p>
        </div>

        {/* Right Info Meta */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Today</span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
              {new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 hover:border-blue-400 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <span>{currentUser.name.split(' ')[0]}</span>
          </button>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN LAYOUT (Colleagues Grid + Side Panel)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: PEOPLE / COLLEAGUES DIRECTORY (8 Cols)     */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-5">
            {/* Header: Title & Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  People
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setTeamTab('all')}
                    className={`text-xs font-bold transition-all pb-1 border-b-2 ${
                      teamTab === 'all'
                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-extrabold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
                    }`}
                  >
                    All Colleagues ({users.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamTab('organization')}
                    className={`text-xs font-bold transition-all pb-1 border-b-2 ${
                      teamTab === 'organization'
                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-extrabold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
                    }`}
                  >
                    My Department ({users.filter(u => u.department === currentUser.department).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Filter Pills & View Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Department Dropdown */}
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <div className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Showing {colleagues.length} members
                </div>
              </div>

              {/* Layout Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Colleagues Cards Grid (Matching Reference UI) */}
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              <AnimatePresence mode="popLayout">
                {colleagues.map((member, idx) => {
                  const isOnline = member.status === 'online';
                  // Calculate mock progress bar for aesthetic completion
                  const mockPercentage = ((idx * 17 + 65) % 35) + 65;

                  return (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="group relative rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Top Row: 3-dot menu */}
                      <div className="flex items-center justify-end text-slate-400">
                        <MoreVertical className="w-4 h-4 cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors" />
                      </div>

                      {/* Center: Large Avatar with Status Ring */}
                      <div className="flex flex-col items-center text-center space-y-2 mt-1">
                        <div className="relative">
                          <img
                            src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={member.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                          />
                          {/* Live Status Dot */}
                          <span
                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                              isOnline ? 'bg-emerald-500' : 'bg-blue-400'
                            }`}
                            title={isOnline ? 'Online / On Duty' : 'Offline'}
                          />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {member.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                            {member.email}
                          </span>
                        </div>

                        {/* Segmented Progress Indicator (Pictured in Reference UI) */}
                        <div className="w-full flex items-center justify-between gap-2 pt-2 px-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, mockPercentage)}%` }} />
                            <div className="bg-slate-100 dark:bg-white/10 flex-1 h-full rounded-full" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {mockPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Bottom Designation Badge (Reference UI Style) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {member.designation || 'Specialist'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {colleagues.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                No colleagues found matching &ldquo;{peopleSearch}&rdquo;.
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* COMPLETE ATTENDANCE CALENDAR (With Late Minutes)     */}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-4">
            {/* Calendar Header with Month Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Attendance History & Punctuality
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mr-1">
                  {attendanceMetrics.monthName}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
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
                  return <div key={`empty-${idx}`} className="h-10" />;
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
                      setSelectedDayRecord(rec || null);
                    }}
                    className={`relative h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
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

                    {/* Status Dot / Late badge */}
                    {isLate && (
                      <span className="mt-1 flex items-center gap-0.5 text-[8px] font-mono font-bold text-amber-700 dark:text-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="hidden sm:inline">+{lateMins}m</span>
                      </span>
                    )}

                    {isPresent && (
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}

                    {isLeave && (
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Inspector Card */}
            {selectedCalendarDayStr && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs space-y-2 mt-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    Shift Record: {selectedCalendarDayStr}
                  </span>
                  {selectedDayRecord ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        selectedDayRecord.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : selectedDayRecord.status === 'late' || selectedDayRecord.isLate
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}
                    >
                      {selectedDayRecord.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[10px]">No Record / Day Off</span>
                  )}
                </div>

                {selectedDayRecord && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Punch In</span>
                      <strong className="text-slate-800 dark:text-slate-200">{selectedDayRecord.clockIn}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Punch Out</span>
                      <strong className="text-slate-800 dark:text-slate-200">{selectedDayRecord.clockOut || 'Shift Incomplete'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Logged Duration</span>
                      <strong className="text-blue-600 dark:text-cyan-400">
                        {Math.floor(selectedDayRecord.totalWorkMinutes / 60)}h {selectedDayRecord.totalWorkMinutes % 60}m
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Punctuality</span>
                      {selectedDayRecord.isLate ? (
                        <span className="text-amber-600 font-bold">Late by {getRecordLateMinutes(selectedDayRecord)}m</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">On-Time ✓</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: CIRCULAR TIME PROGRESS + KPIS (4 Cols)   */}
        {/* ====================================================== */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* ==================================================== */}
          {/* A. REALTIME TIME PROGRESS CIRCLE (Reference UI Style)*/}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-5">
            {/* Top Subtitle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                  SELECTED
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {currentUser.department || 'Design Team'}
                </h3>
              </div>

              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-400">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Circular Time Progress Gauge */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full text-slate-300 hover:text-slate-600 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                  {/* Background Track */}
                  <circle
                    cx="65"
                    cy="65"
                    r={circleRadius}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  {/* Foreground Animated Progress Arc */}
                  <circle
                    cx="65"
                    cy="65"
                    r={circleRadius}
                    className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-700 ease-out"
                    strokeWidth="9"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    TIME LOG
                  </span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {timeLogPercentage}%
                  </span>
                  {isClockedIn && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full text-slate-300 hover:text-slate-600 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Time Metrics & Status Description */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Shift Target:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">8.0 hrs (480 mins)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Logged Today:</span>
                <span className="font-bold font-mono text-blue-600 dark:text-cyan-400">
                  {isClockedIn ? formattedShiftDuration : `${Math.floor(workedMinutesToday / 60)}h ${workedMinutesToday % 60}m`}
                </span>
              </div>

              {/* Clean High-Visibility Check-In / Out Action Button (NO black bar) */}
              <div className="pt-2">
                {!isClockedIn && !isShiftCompleted && (
                  <button
                    type="button"
                    onClick={handleClockIn}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>PUNCH IN (START SHIFT)</span>
                  </button>
                )}

                {isClockedIn && (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>PUNCH OUT (END SHIFT)</span>
                  </button>
                )}

                {isShiftCompleted && (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-center font-mono font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Shift Concluded Today ({todayRecord?.clockOut})</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowEODModal(true)}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <FileCheck2 className="w-4 h-4 text-blue-500" />
                  <span>Submit Daily EOD Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* B. PROJECTS KPI QUAD (Matching Reference UI Style)   */}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Projects
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Tile 1: TOTAL */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  TOTAL
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {projectKpis.total}
                  </span>
                </div>
              </div>

              {/* Tile 2: COMPLETED */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  COMPLETED
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {projectKpis.completed}
                  </span>
                </div>
              </div>

              {/* Tile 3: IN PROGRESS */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  IN PROGRESS
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-cyan-500 shrink-0" />
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {projectKpis.inProgress}
                  </span>
                </div>
              </div>

              {/* Tile 4: WAITING */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  WAITING
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {projectKpis.waiting}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* C. DECLARATION CENTER / INTERNAL NOTICES (Reference) */}
          {/* ==================================================== */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-500/20 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-bold block">
                  DECLARATION CENTER
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {announcements.length > 0 ? announcements[0].title : 'Internal messages & policy'}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileEditModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
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
