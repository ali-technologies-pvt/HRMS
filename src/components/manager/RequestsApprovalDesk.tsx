'use client';

import React, { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { RequestStatus } from '@/types';
import { CheckCircle2, XCircle, User } from 'lucide-react';

export function RequestsApprovalDesk() {
  const { requests, reviewRequest } = useAppData();
  const [filterType, setFilterType] = useState<string>('all');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const handleReview = (id: string, status: RequestStatus) => {
    const remark = remarksMap[id] || '';
    reviewRequest(id, status, remark);
  };

  const filtered = requests.filter(r => filterType === 'all' || r.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            Workforce Compliance
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Employee Requests Approval Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Adjudicate Leave applications, WFH authorizations, Overtime claims, and Late excuse petitions.
          </p>
        </div>

        {/* Filter tags */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 shadow-sm">
          {['all', 'leave', 'wfh', 'overtime', 'late_excuse', 'absence_excuse'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all font-semibold ${
                filterType === t
                  ? 'bg-sky-500/20 text-sky-950 dark:text-cyan-300 border border-sky-400/50 dark:border-cyan-400/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((req) => {
          const getTypeBadge = () => {
            switch (req.type) {
              case 'leave': return { label: `LEAVE (${req.subType?.toUpperCase() || 'CASUAL'})`, variant: 'violet' as const };
              case 'wfh': return { label: 'WORK FROM HOME', variant: 'cyan' as const };
              case 'overtime': return { label: `OVERTIME (${req.hours}h)`, variant: 'emerald' as const };
              case 'absence_excuse': return { label: 'ABSENCE EXCUSE', variant: 'amber' as const };
              case 'late_excuse': return { label: 'LATE EXCUSE', variant: 'amber' as const };
            }
          };

          const typeBadge = getTypeBadge();
          const isPending = req.status === 'pending';

          return (
            <LiquidGlassCard key={req.id} variant="elevated" className="p-5 flex flex-col justify-between" glow={typeBadge.variant}>
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[3px] bg-black/[0.04] dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">{req.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{req.department}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SquareBadge {...typeBadge} />
                    <SquareBadge
                      label={req.status}
                      variant={req.status === 'approved' ? 'emerald' : req.status === 'rejected' ? 'rose' : 'amber'}
                      dot
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-wide">{req.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 font-medium">{req.reason}</p>

                <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500">Effective Date:</span>
                    <span className="text-sky-700 dark:text-cyan-300 font-bold">
                      {req.startDate} {req.endDate && req.endDate !== req.startDate ? `to ${req.endDate}` : ''}
                    </span>
                  </div>
                  {req.projectDetails && (
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Project Logged:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{req.projectDetails}</span>
                    </div>
                  )}
                  {req.hours && (
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Claimed Hours:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{req.hours} Hours</span>
                    </div>
                  )}
                </div>

                {req.managerRemarks && (
                  <div className="mt-3 p-2 bg-sky-50 dark:bg-cyan-950/20 border border-sky-300 dark:border-cyan-500/20 rounded-[2px] text-xs text-sky-900 dark:text-cyan-300">
                    <span className="font-mono font-bold text-[10px] block uppercase text-sky-700 dark:text-cyan-400">Manager Remarks</span>
                    "{req.managerRemarks}"
                  </div>
                )}
              </div>

              {/* Action buttons (only if pending) */}
              {isPending ? (
                <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                  <input
                    type="text"
                    placeholder="Add approval / rejection note..."
                    value={remarksMap[req.id] || ''}
                    onChange={(e) => setRemarksMap({ ...remarksMap, [req.id]: e.target.value })}
                    className="w-full glass-input px-3 py-1.5 text-xs"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <LiquidButton
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleReview(req.id, 'rejected')}
                    >
                      Reject
                    </LiquidButton>
                    <LiquidButton
                      variant="emerald"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleReview(req.id, 'approved')}
                    >
                      Approve Request
                    </LiquidButton>
                  </div>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Reviewed by {req.reviewedBy || 'Manager'}</span>
                  <span>{req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : ''}</span>
                </div>
              )}
            </LiquidGlassCard>
          );
        })}
      </div>
    </div>
  );
}
