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

  const [newCompletedInput, setNewCompletedInput] = useState('');
  const [newInProgressInput, setNewInProgressInput] = useState('');
  const [newPendingInput, setNewPendingInput] = useState('');

  // Auto-fetch today's tasks when opened
  useEffect(() => {
    if (isOpen && currentUser) {
      const preview = generateEODPreview(currentUser.id);
      setCompletedTasks(preview.completedTasks);
      setInProgressTasks(preview.inProgressTasks);
      setPendingTasks(preview.pendingTasks);
      setBlockers('');
      setTomorrowPlan('Resume active tasks and advance planned project milestones.');
      setAdditionalNotes('');
      setNewCompletedInput('');
      setNewInProgressInput('');
      setNewPendingInput('');
    }
  }, [isOpen, currentUser, generateEODPreview]);

  if (!isOpen) return null;

  const addCustomTask = (type: 'completed' | 'inProgress' | 'pending') => {
    if (type === 'completed' && newCompletedInput.trim()) {
      setCompletedTasks(prev => [...prev, newCompletedInput.trim()]);
      setNewCompletedInput('');
    } else if (type === 'inProgress' && newInProgressInput.trim()) {
      setInProgressTasks(prev => [...prev, newInProgressInput.trim()]);
      setNewInProgressInput('');
    } else if (type === 'pending' && newPendingInput.trim()) {
      setPendingTasks(prev => [...prev, newPendingInput.trim()]);
      setNewPendingInput('');
    }
  };

  const removeTaskItem = (type: 'completed' | 'inProgress' | 'pending', index: number) => {
    if (type === 'completed') setCompletedTasks(prev => prev.filter((_, i) => i !== index));
    if (type === 'inProgress') setInProgressTasks(prev => prev.filter((_, i) => i !== index));
    if (type === 'pending') setPendingTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    submitEODReport({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      completedTasks: completedTasks.length > 0 ? completedTasks : ['No completed tasks logged today'],
      inProgressTasks: inProgressTasks.length > 0 ? inProgressTasks : ['No active tasks in progress'],
      pendingTasks: pendingTasks.length > 0 ? pendingTasks : ['No pending tasks remaining'],
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
                  Daily Performance Dispatch
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  End of Day (EOD) Daily Status Report
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
            Today's executed tasks have been automatically loaded below into Completed, In-Progress, and Pending categories. You can review them, add any extra work done, provide your additional notes, and submit directly to your manager.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auto-Fetched Tasks Preview with Custom Additions */}
            <div className="space-y-3.5 p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3px]">
              {/* Completed Tasks */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    1. Completed Tasks Today ({completedTasks.length})
                  </span>
                </div>
                {completedTasks.length > 0 ? (
                  <ul className="space-y-1 mb-2">
                    {completedTasks.map((t, i) => (
                      <li key={i} className="text-xs text-slate-800 dark:text-slate-200 font-sans font-medium flex items-center justify-between p-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-[2px]">
                        <span>• {t}</span>
                        <button type="button" onClick={() => removeTaskItem('completed', i)} className="text-slate-400 hover:text-rose-500 text-xs px-1">✕</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-2">No completed tasks logged for today.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCompletedInput}
                    onChange={(e) => setNewCompletedInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask('completed'); } }}
                    placeholder="+ Add custom completed task..."
                    className="flex-1 glass-input px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTask('completed')}
                    className="px-2.5 py-1 text-xs font-mono bg-emerald-600 text-white rounded-[2px] hover:bg-emerald-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* In Progress Tasks */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase text-sky-700 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    2. In-Progress Tasks / Active Sprint ({inProgressTasks.length})
                  </span>
                </div>
                {inProgressTasks.length > 0 ? (
                  <ul className="space-y-1 mb-2">
                    {inProgressTasks.map((t, i) => (
                      <li key={i} className="text-xs text-slate-800 dark:text-slate-200 font-sans font-medium flex items-center justify-between p-1.5 bg-sky-500/5 border border-sky-500/20 rounded-[2px]">
                        <span>• {t}</span>
                        <button type="button" onClick={() => removeTaskItem('inProgress', i)} className="text-slate-400 hover:text-rose-500 text-xs px-1">✕</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-2">No active in-progress tasks.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInProgressInput}
                    onChange={(e) => setNewInProgressInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask('inProgress'); } }}
                    placeholder="+ Add custom in-progress task..."
                    className="flex-1 glass-input px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTask('inProgress')}
                    className="px-2.5 py-1 text-xs font-mono bg-sky-600 text-white rounded-[2px] hover:bg-sky-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Pending Rollovers */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    3. Pending / Rollover Tasks ({pendingTasks.length})
                  </span>
                </div>
                {pendingTasks.length > 0 ? (
                  <ul className="space-y-1 mb-2">
                    {pendingTasks.map((t, i) => (
                      <li key={i} className="text-xs text-slate-800 dark:text-slate-200 font-sans font-medium flex items-center justify-between p-1.5 bg-amber-500/5 border border-amber-500/20 rounded-[2px]">
                        <span>• {t}</span>
                        <button type="button" onClick={() => removeTaskItem('pending', i)} className="text-slate-400 hover:text-rose-500 text-xs px-1">✕</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-2">No pending tasks in queue.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPendingInput}
                    onChange={(e) => setNewPendingInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask('pending'); } }}
                    placeholder="+ Add custom pending task..."
                    className="flex-1 glass-input px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTask('pending')}
                    className="px-2.5 py-1 text-xs font-mono bg-amber-600 text-white rounded-[2px] hover:bg-amber-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
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

            {/* Additional Notes & Special Status Addition */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-indigo-700 dark:text-indigo-400 mb-1 font-bold">
                Additional Notes & Custom Status Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Write any extra work notes, special status additions, or comments you would like to report to your manager..."
                className="w-full glass-input px-3 py-2 text-xs resize-none leading-relaxed"
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
