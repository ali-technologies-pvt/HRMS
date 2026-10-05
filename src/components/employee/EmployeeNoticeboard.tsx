'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SquareBadge } from '../common/SquareBadge';
import { Megaphone, Building2 } from 'lucide-react';

export function EmployeeNoticeboard() {
  const { currentUser } = useAuth();
  const { announcements } = useAppData();

  // Filter announcements for all or employee's department
  const relevantAnnouncements = announcements.filter(
    a => a.targetDepartment === 'all' || a.targetDepartment === currentUser.department
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
          Corporate Notices
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          Company Noticeboard & Real-Time Circulars
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Live announcements published by Super Admins and Team Managers across the organization.
        </p>
      </div>

      <div className="space-y-4">
        {relevantAnnouncements.length === 0 ? (
          <div className="py-20 text-center liquid-glass border border-slate-200/80 dark:border-white/10 rounded-[3px] p-6 space-y-2">
            <Megaphone className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No active circulars</h3>
            <p className="text-xs text-slate-500 font-mono">Company announcements and alerts will stream here in real time.</p>
          </div>
        ) : (
          relevantAnnouncements.map((anc) => {
            const getBadge = () => {
              switch (anc.type) {
                case 'urgent_alert': return { label: 'URGENT ALERT', variant: 'rose' as const };
                case 'holiday_alert': return { label: 'HOLIDAY NOTICE', variant: 'emerald' as const };
                default: return { label: 'GENERAL CIRCULAR', variant: 'cyan' as const };
              }
            };
            const badge = getBadge();

            return (
              <LiquidGlassCard key={anc.id} variant="elevated" className="p-5" glow={badge.variant}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <SquareBadge {...badge} dot pulse={anc.type === 'urgent_alert'} />
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Scope: {anc.targetDepartment === 'all' ? 'All Organization' : `${anc.targetDepartment} Pod`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(anc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-wide leading-snug">{anc.title}</h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{anc.content}</p>

                <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                  <span>Authorized by: {anc.authorName} ({anc.authorRole.toUpperCase().replace('_', ' ')})</span>
                  <span className="text-sky-600 dark:text-cyan-400 font-semibold">Verified System Broadcast</span>
                </div>
              </LiquidGlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
