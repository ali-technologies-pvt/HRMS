'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { AttendanceRecord } from '@/types';
import {
  Clock,
  Search,
  Plus,
  Zap,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  X,
  Filter,
  ShieldAlert,
  Info,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AttendanceDesk() {
  const { currentUser, users } = useAuth();
  const {
    attendance,
    policy,
    manualRecordAttendance,
    bulkBackfillAttendance,
    deleteAttendanceRecord,
    updateCompanyPolicy
  } = useAppData();
  const { showNotification } = useNotifications();

  // Search and Filters
  const [search, setSearch] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [filterPunctuality, setFilterPunctuality] = useState<'all' | 'ontime' | 'late'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'october' | 'past5'>('all');

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Manual Entry Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formClockIn, setFormClockIn] = useState<string>('09:30');
  const [formClockOut, setFormClockOut] = useState<string>('18:00');
  const [formStatus, setFormStatus] = useState<AttendanceRecord['status']>('present');
  const [formRemarks, setFormRemarks] = useState<string>('');

  // 5-Day Quick Backfill Form State
  const [backfillUserId, setBackfillUserId] = useState<string>('all');
  const [backfillInTime, setBackfillInTime] = useState<string>('09:30');
  const [backfillOutTime, setBackfillOutTime] = useState<string>('18:00');
  // Default 5 days of current month: 2026-10-01 to 2026-10-05
  const [backfillDays, setBackfillDays] = useState<string[]>([
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05'
  ]);

  // Policy Form State
  const [policyStart, setPolicyStart] = useState(policy.officeStartTime || '09:30');
  const [policyEnd, setPolicyEnd] = useState(policy.officeEndTime || '18:00');
  const [policyGrace, setPolicyGrace] = useState(policy.gracePeriodMinutes || 15);

  // Registered employees list (exclude super admin)
  const employeeUsers = useMemo(() => {
    return users.filter(u => u.role === 'employee' || u.role === 'manager');
  }, [users]);

  // Set default user for manual entry when modal opens
  const openManualModal = (record?: AttendanceRecord) => {
    if (record) {
      setEditingId(record.id);
      setFormUserId(record.userId);
      setFormDate(record.date);
      setFormClockIn(record.clockIn);
      setFormClockOut(record.clockOut || '');
      setFormStatus(record.status);
      setFormRemarks(record.managerRemarks || '');
    } else {
      setEditingId(null);
      setFormUserId(employeeUsers[0]?.id || currentUser.id);
      setFormDate(todayStr);
      setFormClockIn('09:30');
      setFormClockOut('18:00');
      setFormStatus('present');
      setFormRemarks('Standard shift 09:30 - 18:00 (On-Time)');
    }
    setShowManualModal(true);
  };

  // Handle Manual Attendance Submit
  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId || !formDate || !formClockIn) {
      showNotification('Missing Information', 'Employee, Date, and Punch-In time are required.', 'warning');
      return;
    }

    const targetUser = users.find(u => u.id === formUserId);

    manualRecordAttendance({
      userId: formUserId,
      userName: targetUser?.name,
      department: targetUser?.department,
      date: formDate,
      clockIn: formClockIn,
      clockOut: formClockOut.trim() ? formClockOut : undefined,
      status: formStatus,
      managerRemarks: formRemarks.trim() ? formRemarks : undefined
    });

    setShowManualModal(false);
  };

  // Handle 5-Day Quick Backfill
  const handleExecuteBackfill = () => {
    if (backfillDays.length === 0) {
      showNotification('No Dates Selected', 'Please select at least one date to backfill.', 'warning');
      return;
    }

    const targetUsers = backfillUserId === 'all'
      ? employeeUsers
      : employeeUsers.filter(u => u.id === backfillUserId);

    if (targetUsers.length === 0) {
      showNotification('No Employees Found', 'No employees available to backfill.', 'warning');
      return;
    }

    const recordsToCreate: {
      userId: string;
      userName: string;
      department: string;
      date: string;
      clockIn: string;
      clockOut: string;
      status: 'present';
      managerRemarks: string;
    }[] = [];

    targetUsers.forEach(emp => {
      backfillDays.forEach(day => {
        recordsToCreate.push({
          userId: emp.id,
          userName: emp.name,
          department: emp.department || 'Operations',
          date: day,
          clockIn: backfillInTime,
          clockOut: backfillOutTime,
          status: 'present',
          managerRemarks: `Past 5-Day Shift Backfill (${backfillInTime} - ${backfillOutTime})`
        });
      });
    });

    bulkBackfillAttendance(recordsToCreate);
    setShowBackfillModal(false);
  };

  // Filter Attendance Logs
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      // User filter
      if (selectedUserFilter !== 'all' && a.userId !== selectedUserFilter) return false;

      // Punctuality filter
      if (filterPunctuality === 'ontime' && a.isLate) return false;
      if (filterPunctuality === 'late' && !a.isLate) return false;

      // Date Range filter
      if (filterDateRange === 'today' && a.date !== todayStr) return false;
      if (filterDateRange === 'october' && !a.date.startsWith('2026-10')) return false;
      if (filterDateRange === 'past5' && !['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].includes(a.date)) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.userName.toLowerCase().includes(q);
        const matchDept = a.department.toLowerCase().includes(q);
        const matchDate = a.date.includes(q);
        const matchRemarks = (a.managerRemarks || '').toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchDate && !matchRemarks) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.clockIn.localeCompare(a.clockIn));
  }, [attendance, selectedUserFilter, filterPunctuality, filterDateRange, search, todayStr]);

  // Statistics KPIs
  const totalCount = filteredAttendance.length;
  const onTimeCount = filteredAttendance.filter(a => !a.isLate && (a.status === 'present' || a.status === 'wfh')).length;
  const lateCount = filteredAttendance.filter(a => a.isLate || a.status === 'late').length;
  const punctualityRate = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 100;
  const totalOvertime = filteredAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);

  // Live Punctuality Evaluation for Form
  const formEvaluation = useMemo(() => {
    if (!formClockIn) return null;
    const [inH, inM] = formClockIn.split(':').map(Number);
    const inTotalMins = inH * 60 + inM;
    const [startH, startM] = (policy.officeStartTime || '09:30').split(':').map(Number);
    const startTotalMins = startH * 60 + startM;
    const graceLimit = startTotalMins + (policy.gracePeriodMinutes || 15);
    const isLate = inTotalMins > graceLimit;
    const diff = inTotalMins - startTotalMins;

    return {
      isLate,
      diff,
      graceLimitStr: '09:45 AM'
    };
  }, [formClockIn, policy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
              Attendance & Shift Management Studio
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-[2px]">
              LIVE TIME ENGINE
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Shift Tracking & Manual Backfill Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure shift rules, manually record past days or today's attendance, and audit employee punctuality history.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBackfillModal(true)}
            className="px-3.5 py-2 rounded-[3px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>5-Day Shift Backfill</span>
          </button>

          <button
            type="button"
            onClick={() => openManualModal()}
            className="px-3.5 py-2 rounded-[3px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Single Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="p-2 rounded-[3px] border border-slate-200 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="Configure Shift Timings & Grace Relaxation"
          >
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>{policy.officeStartTime || '09:30'} - {policy.officeEndTime || '18:00'} ({policy.gracePeriodMinutes || 15}m Grace)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <LiquidGlassCard variant="surface" className="p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Total Logs</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Active history records
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="surface" className="p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Punctuality Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {punctualityRate}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {onTimeCount} on-time within grace limit
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="surface" className="p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {lateCount}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Exceeded 09:45 AM threshold
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="surface" className="p-4 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Logged Overtime</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalOvertime.toFixed(1)}h
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Hours past 06:00 PM shift
          </div>
        </LiquidGlassCard>
      </div>

      {/* Main Table Card */}
      <LiquidGlassCard variant="elevated" className="p-5 border border-slate-200/90 dark:border-white/10">
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Filter */}
            <div className="relative">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="glass-input text-xs font-mono py-1.5 px-3 pr-8 rounded-[2px]"
              >
                <option value="all">All Employees ({employeeUsers.length})</option>
                {employeeUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department || 'Operations'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center p-0.5 bg-black/[0.03] dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-[2px] text-xs font-mono">
              {[
                { key: 'all', label: 'All Dates' },
                { key: 'today', label: 'Today' },
                { key: 'past5', label: 'Past 5 Days' },
                { key: 'october', label: 'October 2026' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterDateRange(tab.key as any)}
                  className={`px-2.5 py-1 rounded-[1px] uppercase font-semibold transition-all ${
                    filterDateRange === tab.key
                      ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Punctuality Toggle */}
            <div className="flex items-center p-0.5 bg-black/[0.03] dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-[2px] text-xs font-mono">
              {[
                { key: 'all', label: 'All Status' },
                { key: 'ontime', label: 'On-Time' },
                { key: 'late', label: 'Late' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterPunctuality(tab.key as any)}
                  className={`px-2.5 py-1 rounded-[1px] uppercase font-semibold transition-all ${
                    filterPunctuality === tab.key
                      ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, date, remark..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Punch In</th>
                <th className="py-2.5 px-3">Punch Out</th>
                <th className="py-2.5 px-3">Work Duration</th>
                <th className="py-2.5 px-3">Punctuality State</th>
                <th className="py-2.5 px-3">Overtime</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <span>No attendance records found matching filters.</span>
                      <button
                        type="button"
                        onClick={() => setShowBackfillModal(true)}
                        className="text-sky-600 dark:text-cyan-400 font-bold underline hover:no-underline text-xs mt-1"
                      >
                        Click here to quick backfill past 5 days (Mon-Fri)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(log => {
                  const hrs = Math.floor(log.totalWorkMinutes / 60);
                  const mins = log.totalWorkMinutes % 60;
                  const emp = users.find(u => u.id === log.userId);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee */}
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={log.userName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">{log.userName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{log.department || 'Operations'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{log.date}</span>
                        {log.date === todayStr && (
                          <span className="ml-1.5 px-1 py-0.2 text-[9px] font-bold bg-sky-500/10 text-sky-600 dark:text-cyan-300 rounded-[2px]">
                            TODAY
                          </span>
                        )}
                      </td>

                      {/* Punch In */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-sky-700 dark:text-cyan-300">
                          {log.clockIn}
                        </span>
                      </td>

                      {/* Punch Out */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {log.clockOut ? (
                          <span>{log.clockOut}</span>
                        ) : log.date === todayStr ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE IN SHIFT
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Punched</span>
                        )}
                      </td>

                      {/* Work Duration */}
                      <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-semibold">
                        {log.totalWorkMinutes > 0 ? `${hrs}h ${mins}m` : log.date === todayStr ? 'In Progress' : '0h'}
                      </td>

                      {/* Punctuality Status */}
                      <td className="py-2.5 px-3">
                        {log.isLate ? (
                          <SquareBadge
                            label="LATE"
                            variant="rose"
                            dot
                          />
                        ) : (
                          <SquareBadge
                            label="ON-TIME (09:30)"
                            variant="emerald"
                            dot
                          />
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-2.5 px-3">
                        {log.overtimeHours > 0 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">+{log.overtimeHours}h</span>
                        ) : (
                          <span className="text-slate-400">0h</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={log.managerRemarks || log.lateReason}>
                        {log.managerRemarks || log.lateReason || 'Standard shift'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openManualModal(log)}
                            className="p-1 rounded-[2px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAttendanceRecord(log.id)}
                            className="p-1 rounded-[2px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>

      {/* ======================================================== */}
      {/* MODAL 1: QUICK 5-DAY SHIFT BACKFILL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showBackfillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBackfillModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-400/30 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[2px]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Quick Backfill Past 5 Working Days
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Populates Oct 01 - Oct 05 with On-Time 09:30 AM to 06:00 PM
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackfillModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Target Employee */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Employee(s)
                  </label>
                  <select
                    value={backfillUserId}
                    onChange={(e) => setBackfillUserId(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    <option value="all">⚡ All Registered Employees ({employeeUsers.length})</option>
                    {employeeUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.department || 'Operations'} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Included */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Days Included in Backfill
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                    {[
                      { date: '2026-10-01', day: 'Day 1 (Thursday)' },
                      { date: '2026-10-02', day: 'Day 2 (Friday)' },
                      { date: '2026-10-03', day: 'Day 3 (Saturday)' },
                      { date: '2026-10-04', day: 'Day 4 (Sunday)' },
                      { date: '2026-10-05', day: 'Day 5 (Monday - Today)' }
                    ].map(item => {
                      const isChecked = backfillDays.includes(item.date);
                      return (
                        <label key={item.date} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBackfillDays([...backfillDays, item.date]);
                              } else {
                                setBackfillDays(backfillDays.filter(d => d !== item.date));
                              }
                            }}
                            className="rounded-[2px] text-amber-600 focus:ring-amber-500"
                          />
                          <span>{item.date} <span className="text-slate-400 text-[10px]">({item.day})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Timings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      value={backfillInTime}
                      onChange={(e) => setBackfillInTime(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                      ✓ On-Time (Grace relaxation to 09:45)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      value={backfillOutTime}
                      onChange={(e) => setBackfillOutTime(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Shift duration: 8h 30m
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[2px] text-slate-700 dark:text-slate-300 text-[11px]">
                  <strong>Summary:</strong> Will create or update {backfillDays.length} attendance records per selected employee with 8 hours 30 minutes worked and On-Time status.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBackfillModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBackfill}
                  className="px-4 py-2 rounded-[2px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute 5-Day Backfill</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: MANUAL ATTENDANCE ENTRY / EDIT RECORD           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/40 dark:border-cyan-400/30 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-cyan-400 rounded-[2px]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingId ? 'Edit Attendance Record' : 'Manual Attendance Entry'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Log or update punch-in, punch-out, and punctuality
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualAttendance} className="space-y-4 text-xs font-mono">
                {/* Employee Dropdown */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee
                  </label>
                  <select
                    required
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    {employeeUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.department || 'Operations'} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                {/* Check-In and Check-Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formClockIn}
                      onChange={(e) => setFormClockIn(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    {formEvaluation && (
                      <div className="mt-1">
                        {formEvaluation.isLate ? (
                          <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Late (Exceeds {formEvaluation.graceLimitStr})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            On-Time (Relaxation up to 09:45 AM)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-Out Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={formClockOut}
                      onChange={(e) => setFormClockOut(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Leave blank if employee is currently in shift
                    </span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recorded Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    <option value="present">Present (On-Time)</option>
                    <option value="late">Late Arrival</option>
                    <option value="half_day">Half Day</option>
                    <option value="wfh">Work From Home (WFH)</option>
                    <option value="leave">On Leave</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Manager Remarks / Justification
                  </label>
                  <input
                    type="text"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="e.g. Standard shift 09:30 - 18:00 or approved excuse"
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[2px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Update Record' : 'Save Attendance'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 3: SHIFT TIMINGS & GRACE POLICY CONFIGURATION      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPolicyModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Office Shift & Grace Policy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCompanyPolicy({
                    officeStartTime: policyStart,
                    officeEndTime: policyEnd,
                    gracePeriodMinutes: Number(policyGrace)
                  });
                  setShowPolicyModal(false);
                }}
                className="space-y-4 text-xs font-mono"
              >
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Office Shift Start Time (PST)
                  </label>
                  <input
                    type="time"
                    required
                    value={policyStart}
                    onChange={(e) => setPolicyStart(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Office Shift End Time (PST)
                  </label>
                  <input
                    type="time"
                    required
                    value={policyEnd}
                    onChange={(e) => setPolicyEnd(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Relaxation / Grace (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={policyGrace}
                    onChange={(e) => setPolicyGrace(Number(e.target.value))}
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    e.g. 15 minutes allows check-in until 09:45 AM without being marked Late.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[2px] bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs tracking-wide shadow-md"
                  >
                    Update Policy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
