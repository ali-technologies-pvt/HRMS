'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  X,
  Clock,
  Calendar,
  FolderKanban,
  Flag,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Send,
  FileCheck2,
  Trash2,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'employee' | 'manager';
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
}

const PRIORITY_BADGES = {
  urgent: { label: 'Urgent Priority', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  high: { label: 'High Priority', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  medium: { label: 'Medium Priority', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  low: { label: 'Low Priority', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
};

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  mode = 'employee',
  onStatusChange
}: TaskDetailModalProps) {
  const { currentUser, users } = useAuth();
  const { updateTask, updateTaskStatus, deleteTask } = useAppData();
  const { showNotification } = useNotifications();

  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const assignee = users.find(u => u.id === task.assignedToId);
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;

  // Handle start/pause timer
  const handleToggleTimer = () => {
    const isRunning = task.timerActive;
    updateTask(task.id, {
      timerActive: !isRunning,
      startedAt: !isRunning ? new Date().toISOString() : undefined,
      status: 'in_progress'
    });
    showNotification(
      !isRunning ? 'Timer Started' : 'Timer Paused',
      !isRunning ? `Work session running on "${task.title}".` : `Work session paused.`,
      'info'
    );
  };

  // Handle Employee Deliverable Submission (Moves to needs_review)
  const handleSubmitForReview = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      updateTask(task.id, {
        status: 'needs_review',
        timerActive: false,
        deliverableNotes: deliverableNotes || 'Work finished, submitted for manager verification.',
        deliverableUrl: deliverableUrl || undefined
      });

      if (onStatusChange) {
        onStatusChange(task, 'needs_review');
      }

      showNotification(
        'Submitted for Review 📤',
        `"${task.title}" has been submitted to your manager. Only manager can mark it Done.`,
        'success'
      );

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}

      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  // Handle Manager Direct Approval
  const handleManagerApprove = () => {
    updateTaskStatus(task.id, 'completed');
    if (onStatusChange) {
      onStatusChange(task, 'completed');
    }
    showNotification('Task Approved', `"${task.title}" has been approved and marked Completed.`, 'success');
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {}
    onClose();
  };

  // Handle Manager Delete
  const handleManagerDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
      deleteTask(task.id);
      showNotification('Task Deleted', `"${task.title}" was removed.`, 'info');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-2xl text-slate-800 dark:text-slate-100 space-y-6"
        >
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Project Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>{task.projectName || 'General Workstream'}</span>
                </span>

                {/* Priority Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${priorityInfo.bg}`}>
                  <Flag className="w-3 h-3" />
                  <span>{priorityInfo.label}</span>
                </span>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : task.status === 'needs_review'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : task.status === 'in_progress'
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{task.status.replace('_', ' ')}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
                {task.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assignee</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                <img
                  src={assignee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={assignee?.name || 'User'}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="truncate">{task.assignedToName || assignee?.name || 'You'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Deadline</span>
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.deadline || 'Ongoing'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Category</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 block mt-0.5">
                {task.category || 'Development'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Logged Time</span>
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.loggedHours || 0} hrs</span>
              </div>
            </div>
          </div>

          {/* Task Description & Manager Directives */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400">
              Task Scope &amp; Instructions
            </h4>
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
              {task.description || 'Complete the assigned milestones per quality benchmarks and submit deliverables for review upon completion.'}
            </div>
          </div>

          {/* Live Work Session Stopwatch Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.timerActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Work Session Stopwatch
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {task.timerActive ? 'Active Working Session running' : 'Timer currently paused'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTimer}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                task.timerActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {task.timerActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Work Session</span>
                </>
              )}
            </button>
          </div>

          {/* Deliverables Submission Section for Employee */}
          {mode === 'employee' && task.status !== 'completed' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Submit Deliverables for Manager Review
                </h4>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Describe the deliverables completed or attach notes for your manager..."
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />

                <input
                  type="url"
                  placeholder="Deliverable URL (optional: GitHub PR, Google Drive, Figma link...)"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-700 dark:text-blue-300 font-mono">
                ℹ️ Strict rule: Submitting work moves this task to <strong>Needs Review</strong>. Only your manager can officially approve and mark it Completed.
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            {/* Employee Controls */}
            {mode === 'employee' ? (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  Close
                </button>

                {task.status !== 'completed' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitForReview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review 📤</span>
                  </button>
                )}
              </div>
            ) : (
              /* Manager Controls */
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleManagerDelete}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleManagerApprove}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Mark Done &check;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
