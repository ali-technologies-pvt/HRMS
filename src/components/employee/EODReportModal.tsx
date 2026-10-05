'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidButton } from '../common/LiquidButton';
import { FileCheck2, Send, CheckCircle2, Clock, AlertTriangle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface EODReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EODReportModal({ isOpen, onClose }: EODReportModalProps) {
  const { currentUser } = useAuth();
  const { generateEODPreview, submitEODReport } = useAppData();

  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [blockers, setBlockers] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch today's tasks when opened
  useEffect(() => {
    if (isOpen && currentUser) {
      const preview = generateEODPreview(currentUser.id);
      setCompletedTasks(preview.completedTasks.length > 0 ? preview.completedTasks : ['No completed tasks logged today']);
      setInProgressTasks(preview.inProgressTasks.length > 0 ? preview.inProgressTasks : ['No active tasks carried forward']);
      setPendingTasks(preview.pendingTasks.length > 0 ? preview.pendingTasks : ['No pending tasks queued']);
      setBlockers('');
      setTomorrowPlan('Resume active tasks and advance planned project milestones.');
      setAdditionalNotes('');
    }
  }, [isOpen, currentUser, generateEODPreview]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    submitEODReport({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      completedTasks,
      inProgressTasks,
      pendingTasks,
      blockers: blockers || 'None reported.',
      tomorrowPlan,
      additionalNotes,
      approvalStatus: 'pending'
    });

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#10b981', '#ffffff']
      });
    } catch {}

    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative z-10 w-full max-w-2xl liquid-glass-elevated border border-sky-400/50 dark:border-cyan-500/40 p-6 rounded-[4px] shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/15 dark:bg-cyan-500/20 border border-sky-400/40 dark:border-cyan-400/40 rounded-[2px] text-sky-600 dark:text-cyan-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                  Automated 1-Click Generation
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Day-End (EOD) Daily Status Report
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-[2px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
            The system has automatically gathered all your completed, in-progress, and pending tasks for today.
            Review the bulleted draft below, customize your blockers and tomorrow’s objectives, then dispatch directly to your manager.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auto-Fetched Tasks Preview */}
            <div className="space-y-3 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3px]">
              {/* Completed Tasks */}
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-Fetched Completed Tasks:
                </span>
                <ul className="pl-4 space-y-1">
                  {completedTasks.map((t, i) => (
                    <li key={i} className="text-xs text-slate-800 dark:text-slate-200 list-disc font-sans font-medium">{t}</li>
                  ))}
                </ul>
              </div>

              {/* In Progress Tasks */}
              <div>
                <span className="text-[11px] font-mono uppercase text-sky-700 dark:text-cyan-400 font-bold flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Auto-Fetched Working / In-Progress Tasks:
                </span>
                <ul className="pl-4 space-y-1">
                  {inProgressTasks.map((t, i) => (
                    <li key={i} className="text-xs text-slate-800 dark:text-slate-200 list-disc font-sans font-medium">{t}</li>
                  ))}
                </ul>
              </div>

              {/* Pending Rollovers */}
              <div>
                <span className="text-[11px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Auto-Fetched Pending / Backlog Rollovers:
                </span>
                <ul className="pl-4 space-y-1">
                  {pendingTasks.map((t, i) => (
                    <li key={i} className="text-xs text-slate-800 dark:text-slate-200 list-disc font-sans font-medium">{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Editable Blockers */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-rose-700 dark:text-rose-400 font-bold mb-1">
                Roadblocks / Blockers (Optional)
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. Awaiting client API token, blocked on review, etc."
                className="w-full glass-input px-3 py-2 text-xs"
              />
            </div>

            {/* Tomorrow's Plan */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-sky-800 dark:text-cyan-400 font-bold mb-1">
                Tomorrow's Scheduled Objectives
              </label>
              <textarea
                rows={2}
                required
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="What deliverables will you tackle tomorrow?"
                className="w-full glass-input px-3 py-2 text-xs resize-none leading-relaxed"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Additional Notes or Remarks for Manager
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Requesting 10m morning standup sync..."
                className="w-full glass-input px-3 py-2 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <LiquidButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </LiquidButton>
              <LiquidButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? 'Dispatching...' : 'Direct Submit to Manager'}
              </LiquidButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
