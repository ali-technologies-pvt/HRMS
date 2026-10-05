'use client';

import React, { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SquareBadge } from '../common/SquareBadge';
import { Search } from 'lucide-react';

export function AttendanceDesk() {
  const { attendance, policy } = useAppData();

  const [search, setSearch] = useState('');
  const [filterLate, setFilterLate] = useState<'all' | 'late' | 'ontime'>('all');

  const filtered = attendance.filter(a => {
    const matchesSearch = a.userName.toLowerCase().includes(search.toLowerCase()) ||
                          a.department.toLowerCase().includes(search.toLowerCase());
    const matchesLate = filterLate === 'all'
      ? true
      : filterLate === 'late'
      ? a.isLate
      : !a.isLate;

    return matchesSearch && matchesLate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-600 dark:text-violet-400 font-extrabold">
            People & Operations
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Attendance & Time Tracking Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidated daily presence, punch-in/out timestamps, grace compliance, and overtime hours.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 liquid-glass rounded-[2px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium">
          Shift: <span className="text-sky-700 dark:text-cyan-300 font-bold">{policy.officeStartTime} - {policy.officeEndTime}</span> (Grace: {policy.gracePeriodMinutes}m)
        </div>
      </div>

      <LiquidGlassCard variant="elevated" className="p-5">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            {['all', 'ontime', 'late'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterLate(f as any)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all font-semibold ${
                  filterLate === f
                    ? 'bg-indigo-500/20 text-indigo-950 dark:text-violet-300 border border-indigo-400/50 dark:border-violet-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, department..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="pb-3 pl-2">Employee</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Punch In</th>
                <th className="pb-3">Punch Out</th>
                <th className="pb-3">Total Duration</th>
                <th className="pb-3">Punctuality State</th>
                <th className="pb-3 text-right pr-2">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
              {filtered.map((log) => {
                const hrs = Math.floor(log.totalWorkMinutes / 60);
                const mins = log.totalWorkMinutes % 60;

                return (
                  <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-semibold text-slate-900 dark:text-white tracking-wide">{log.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{log.department}</div>
                    </td>

                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">{log.date}</td>

                    <td className="py-3 font-mono text-sky-700 dark:text-cyan-300 font-bold">
                      {log.clockIn}
                    </td>

                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                      {log.clockOut || (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          IN SESSION
                        </span>
                      )}
                    </td>

                    <td className="py-3 font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {hrs > 0 || mins > 0 ? `${hrs}h ${mins}m` : 'In Progress'}
                    </td>

                    <td className="py-3">
                      {log.isLate ? (
                        <SquareBadge
                          label="LATE (GRACE EXCEEDED)"
                          variant="rose"
                          dot
                        />
                      ) : (
                        <SquareBadge
                          label="ON-TIME / PUNCTUAL"
                          variant="emerald"
                          dot
                        />
                      )}
                      {log.lateReason && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 max-w-xs truncate">
                          "{log.lateReason}"
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-right pr-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {log.overtimeHours > 0 ? `+${log.overtimeHours}h` : '0h'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
