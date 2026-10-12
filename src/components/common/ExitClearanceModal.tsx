'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidButton } from './LiquidButton';
import { SquareBadge } from './SquareBadge';
import {
  ShieldAlert,
  Clock,
  LogOut,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  X,
  CalendarCheck,
  Check,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExitClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export function ExitClearanceModal({ isOpen, onClose, onConfirmLogout }: ExitClearanceModalProps) {
  const { currentUser } = useAuth();
  const {
    attendance,
    getUserTodayAttendance,
    clockIn,
    clockOut,
    reports,
    submitEODReport,
    generateEODPreview,
    requests,
    reviewRequest
  } = useAppData();
  const { showNotification } = useNotifications();

  const isEmployee = currentUser.role === 'employee';
  const isManager = currentUser.role === 'manager' || currentUser.role === 'manager_hr';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = getUserTodayAttendance(currentUser.id);

  // Employee checks
  const isStillClockedIn = !!todayRecord && !todayRecord.clockOut;
  const hasSubmittedTodayReport = reports.some(
    r => r.userId === currentUser.id && r.date === todayStr
  );

  // Manager checks
  const managerAttendanceLogged = !!todayRecord?.clockIn;
  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Quick report notes for auto-submit
  const [quickNotes, setQuickNotes] = useState('');

  // Handle Employee 1-Click Complete & Logout
  const handleEmployeeClearanceAndLogout = () => {
    // 1. Submit report if not submitted
    if (!hasSubmittedTodayReport) {
      const preview = generateEODPreview(currentUser.id);
      submitEODReport({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        department: currentUser.department || 'Engineering',
        date: todayStr,
        completedTasks: preview.completedTasks.length > 0 ? preview.completedTasks : ['Daily assigned deliverables completed.'],
        inProgressTasks: preview.inProgressTasks,
        pendingTasks: preview.pendingTasks,
        blockers: 'None reported.',
        tomorrowPlan: 'Continue assigned client deliverables and project milestones.',
        additionalNotes: quickNotes || 'Automated day-end report submitted during shift logout clearance.',
        approvalStatus: 'pending'
      });
    }

    // 2. Punch out if still active
    if (isStillClockedIn) {
      clockOut(currentUser.id);
    }

    showNotification('Exit Clearance Approved', 'Daily report submitted and shift closed. Safe travels!', 'success');
    onClose();
    onConfirmLogout();
  };

  // Handle Manager Quick Clearance (Approve all pending requests + mark attendance if missing)
  const handleManagerClearanceAndLogout = () => {
    // 1. Punch in if manager attendance is missing
    if (!managerAttendanceLogged) {
      clockIn(currentUser.id);
    }

    // 2. Approve all pending requests
    pendingRequests.forEach(req => {
      reviewRequest(req.id, 'approved', 'Approved during Manager End-of-Day clearance review.');
    });

    showNotification('Manager Clearance Complete', 'All pending requests reviewed and attendance sealed.', 'success');
    onClose();
    onConfirmLogout();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/85 backdrop-blur-xl"
        />

        {/* Clearance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-400/50 dark:border-amber-500/40 p-4 sm:p-6 rounded-[4px] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white dark:bg-white/95 rounded-[3px] border border-slate-200/80 dark:border-white/20 shadow-xs shrink-0">
                <img src="/logo-emblem.png" alt="quickslogix" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Mandatory Exit Clearance Required
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployee
                    ? 'Daily shift checkout & EOD report policy enforcement.'
                    : 'Manager attendance & pending employee request verification.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================= */}
          {/* EMPLOYEE CLEARANCE VIEW                   */}
          {/* ========================================= */}
          {isEmployee && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-[2px] text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Company Policy Alert:</strong> You cannot logout without submitting today's Day-End Report and recording your shift punch-out.
              </div>

              {/* Checklist */}
              <div className="space-y-2 p-3 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[3px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {hasSubmittedTodayReport ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={hasSubmittedTodayReport ? 'text-slate-900 dark:text-white font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                      Daily EOD Report Submitted
                    </span>
                  </span>
                  <SquareBadge
                    label={hasSubmittedTodayReport ? 'CLEARED' : 'PENDING'}
                    variant={hasSubmittedTodayReport ? 'emerald' : 'rose'}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/5">
                  <span className="flex items-center gap-2">
                    {!isStillClockedIn ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={!isStillClockedIn ? 'text-slate-900 dark:text-white font-bold' : 'text-amber-700 dark:text-amber-300 font-bold'}>
                      Shift Check-Out (Punch Out)
                    </span>
                  </span>
                  <SquareBadge
                    label={!isStillClockedIn ? 'PUNCHED OUT' : 'STILL ACTIVE'}
                    variant={!isStillClockedIn ? 'emerald' : 'amber'}
                  />
                </div>
              </div>

              {!hasSubmittedTodayReport && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Quick Notes / Progress Summary (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="Briefly state what you finished today..."
                    className="w-full glass-input p-2 text-xs"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConfirmLogout();
                  }}
                  className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Direct Sign Out
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Stay in Portal
                  </button>

                  <LiquidButton
                    variant="primary"
                    size="md"
                    icon={<Send className="w-4 h-4" />}
                    onClick={handleEmployeeClearanceAndLogout}
                    className="font-bold text-xs"
                  >
                    Submit Report, Punch Out & Logout
                  </LiquidButton>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* MANAGER CLEARANCE VIEW                    */}
          {/* ========================================= */}
          {isManager && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-[2px] text-amber-800 dark:text-amber-300">
                🔒 <strong>Executive Governance:</strong> Managers must ensure all pending employee requests are reviewed and daily manager attendance is recorded before logout.
              </div>

              {/* Checklist */}
              <div className="space-y-2 p-3 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[3px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {managerAttendanceLogged ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={managerAttendanceLogged ? 'text-slate-900 dark:text-white font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                      Manager Attendance Registered Today
                    </span>
                  </span>
                  <SquareBadge
                    label={managerAttendanceLogged ? 'LOGGED' : 'MISSING'}
                    variant={managerAttendanceLogged ? 'emerald' : 'rose'}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/5">
                  <span className="flex items-center gap-2">
                    {pendingRequests.length === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={pendingRequests.length === 0 ? 'text-slate-900 dark:text-white font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                      Pending Employee Requests ({pendingRequests.length})
                    </span>
                  </span>
                  <SquareBadge
                    label={pendingRequests.length === 0 ? 'ALL CLEARED' : `${pendingRequests.length} PENDING`}
                    variant={pendingRequests.length === 0 ? 'emerald' : 'rose'}
                  />
                </div>
              </div>

              {/* Pending Requests Preview */}
              {pendingRequests.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 dark:border-white/10 rounded p-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Awaiting Your Approval:</div>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{req.userName}</div>
                        <div className="text-[10px] text-slate-500">{req.title} ({req.type.toUpperCase()})</div>
                      </div>
                      <SquareBadge label="Pending" variant="amber" />
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConfirmLogout();
                  }}
                  className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Direct Sign Out
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Review In Dashboard
                  </button>

                  <LiquidButton
                    variant="emerald"
                    size="md"
                    icon={<Check className="w-4 h-4" />}
                    onClick={handleManagerClearanceAndLogout}
                    className="font-bold text-xs"
                  >
                    {pendingRequests.length > 0
                      ? `Approve All (${pendingRequests.length}) & Logout`
                      : 'Confirm & Complete Logout'}
                  </LiquidButton>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
