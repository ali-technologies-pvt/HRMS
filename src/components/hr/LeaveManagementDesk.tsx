'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SquareBadge } from '../common/SquareBadge';
import { ShieldAlert } from 'lucide-react';

export function LeaveManagementDesk() {
  const { users } = useAuth();
  const { requests } = useAppData();

  const staff = users.filter(u => u.role !== 'super_admin');
  const approvedLeaves = requests.filter(r => r.type === 'leave' && r.status === 'approved');

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-600 dark:text-violet-400 font-extrabold">
          Policy Enforcement
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          Company-Wide Leave & Balance Management Desk
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track individual leave balances (Medical, Casual, Annual) and enforce automatic Loss of Pay deductions for quota overdrafts.
        </p>
      </div>

      {/* Staff Leave Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => {
          const userLeaves = approvedLeaves.filter(l => l.userId === member.id);
          const usedMedical = userLeaves.filter(l => l.subType === 'medical').length;
          const usedCasual = userLeaves.filter(l => l.subType === 'casual').length;
          const usedAnnual = userLeaves.filter(l => l.subType === 'annual').length;

          const remainingMedical = Math.max(0, member.leaveQuota.medical - usedMedical);
          const remainingCasual = Math.max(0, member.leaveQuota.casual - usedCasual);
          const remainingAnnual = Math.max(0, member.leaveQuota.annual - usedAnnual);

          return (
            <LiquidGlassCard key={member.id} variant="elevated" className="p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-white/10">
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-8 h-8 rounded-[3px] object-cover border border-slate-300 dark:border-white/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">{member.department}</div>
                </div>
              </div>

              {/* Leave Quota Metrics */}
              <div className="space-y-2 text-xs font-mono">
                {/* Medical */}
                <div className="p-2 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Medical Leave:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-700 dark:text-cyan-300 font-bold">{remainingMedical}</span>
                    <span className="text-[10px] text-slate-500">/ {member.leaveQuota.medical} Left</span>
                  </div>
                </div>

                {/* Casual */}
                <div className="p-2 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Casual Leave:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">{remainingCasual}</span>
                    <span className="text-[10px] text-slate-500">/ {member.leaveQuota.casual} Left</span>
                  </div>
                </div>

                {/* Annual */}
                <div className="p-2 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Annual Privilege:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-700 dark:text-violet-300 font-bold">{remainingAnnual}</span>
                    <span className="text-[10px] text-slate-500">/ {member.leaveQuota.annual} Left</span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
                <span>Total Utilized: {usedMedical + usedCasual + usedAnnual} Days</span>
                {remainingCasual === 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> LOP Warning
                  </span>
                )}
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>

      {/* Approved Leaves History */}
      <LiquidGlassCard variant="surface" className="p-5">
        <div className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-bold pb-3 mb-3 border-b border-slate-200/80 dark:border-white/10">
          Historical Approved Leaves Audit Log
        </div>

        {approvedLeaves.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-400">
            No approved leaves recorded.
          </div>
        ) : (
          <div className="space-y-2">
            {approvedLeaves.map((l) => (
              <div
                key={l.id}
                className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white tracking-wide">{l.userName}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {l.title} • Reason: "{l.reason}"
                  </div>
                </div>
                <div className="text-right font-mono">
                  <SquareBadge label={l.subType || 'leave'} variant="violet" />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{l.startDate} to {l.endDate || l.startDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
}
