'use client';

import React, { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { CheckCircle2, AlertTriangle, MessageSquare, Clock, User } from 'lucide-react';

export function EODReportsDesk() {
  const { reports, reviewEODReport } = useAppData();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const [remarks, setRemarks] = useState('');

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const handleAction = (status: 'approved' | 'revision_requested') => {
    if (!activeReport) return;
    reviewEODReport(activeReport.id, status, remarks);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
          Daily Operations Audit
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          Day-End (EOD) Reports Desk
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review automated daily task aggregations submitted by team members, provide executive remarks, and issue approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Reports list */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 pb-1 font-semibold">
            Submitted Reports ({reports.length})
          </div>

          {reports.map((rep) => {
            const isSelected = rep.id === activeReport?.id;
            return (
              <div
                key={rep.id}
                onClick={() => {
                  setSelectedReportId(rep.id);
                  setRemarks(rep.managerRemarks || '');
                }}
                className={`p-3.5 rounded-[3px] border cursor-pointer transition-all ${
                  isSelected
                    ? 'liquid-glass-elevated border-sky-400 dark:border-cyan-400/40 shadow-md'
                    : 'liquid-glass border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={rep.userName}>{rep.userName}</span>
                  </div>
                  <SquareBadge
                    label={rep.approvalStatus.replace('_', ' ')}
                    variant={rep.approvalStatus === 'approved' ? 'emerald' : rep.approvalStatus === 'revision_requested' ? 'rose' : 'amber'}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>{rep.department}</span>
                  <span>{rep.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: Selected Report Details & Review Desk */}
        <div className="lg:col-span-2">
          {activeReport ? (
            <LiquidGlassCard variant="elevated" className="p-6 space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeReport.userName}</h3>
                    <SquareBadge
                      label={activeReport.approvalStatus.replace('_', ' ')}
                      variant={activeReport.approvalStatus === 'approved' ? 'emerald' : activeReport.approvalStatus === 'revision_requested' ? 'rose' : 'amber'}
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 font-medium">
                    {activeReport.department} • Submitted {new Date(activeReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {activeReport.date}
                  </div>
                </div>
              </div>

              {/* Tasks Summary */}
              <div className="space-y-4">
                {/* Completed Tasks */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Completed Deliverables ({activeReport.completedTasks.length})
                  </h4>
                  {activeReport.completedTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-5">No completed tasks logged today.</p>
                  ) : (
                    <ul className="space-y-1.5 pl-2">
                      {activeReport.completedTasks.map((t, idx) => (
                        <li key={idx} className="text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2 font-medium">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* In Progress Tasks */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-sky-700 dark:text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Active / In-Progress Tasks ({activeReport.inProgressTasks.length})
                  </h4>
                  {activeReport.inProgressTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-5">No active tasks carried forward.</p>
                  ) : (
                    <ul className="space-y-1.5 pl-2">
                      {activeReport.inProgressTasks.map((t, idx) => (
                        <li key={idx} className="text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2 font-medium">
                          <span className="text-sky-600 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Blockers */}
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-[2px]">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Blockers & Roadblocks
                  </h4>
                  <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                    {activeReport.blockers || 'No blockers reported.'}
                  </p>
                </div>

                {/* Tomorrow's Plan */}
                <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-800 dark:text-slate-300 font-bold mb-1">
                    Tomorrow's Scheduled Targets
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {activeReport.tomorrowPlan || 'Continuing active project tasks.'}
                  </p>
                </div>

                {/* Additional Notes */}
                {activeReport.additionalNotes && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 italic font-medium">
                    Note: "{activeReport.additionalNotes}"
                  </div>
                )}
              </div>

              {/* Manager Feedback Section */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                <label className="block text-[11px] font-mono uppercase text-sky-700 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  Manager Remarks & Review Feedback
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or approval notes..."
                  className="w-full glass-input px-3 py-2 text-xs leading-relaxed resize-none"
                />

                <div className="flex items-center justify-end gap-3 pt-1">
                  <LiquidButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction('revision_requested')}
                  >
                    Request Revision
                  </LiquidButton>
                  <LiquidButton
                    variant="emerald"
                    size="sm"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleAction('approved')}
                  >
                    Approve Daily Report
                  </LiquidButton>
                </div>
              </div>
            </LiquidGlassCard>
          ) : (
            <div className="py-20 text-center text-slate-400 font-mono text-xs">
              No report selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
