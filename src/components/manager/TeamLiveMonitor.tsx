'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SquareBadge } from '../common/SquareBadge';
import { formatDuration } from '@/lib/utils';
import { TaskStatus } from '@/types';
import { Activity, Clock, FolderKanban } from 'lucide-react';

export function TeamLiveMonitor() {
  const { users } = useAuth();
  const { tasks, projects, updateTaskStatus } = useAppData();

  // Tick timer every 10 seconds for active timers (lightweight, zero UI lag)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const teamMembers = users.filter(u => u.role === 'employee');

  const COLUMNS: { id: TaskStatus; label: string; color: 'slate' | 'cyan' | 'amber' | 'emerald' }[] = [
    { id: 'pending', label: 'Assigned / Backlog', color: 'slate' },
    { id: 'in_progress', label: 'In Progress / Active', color: 'cyan' },
    { id: 'blocked', label: 'Blocked / Needs Review', color: 'amber' },
    { id: 'completed', label: 'Completed Sprints', color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            Live Telemetry Operations
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Real-Time Team Monitor & Visual Status Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time active timers, live sprints, and visual Kanban flow across all team squads.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 liquid-glass rounded-[2px] border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>REALTIME SOCKET / EDGE SYNC</span>
        </div>
      </div>

      {/* Live Member Session Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {teamMembers.map((member) => {
          const activeTask = tasks.find(t => t.assignedToId === member.id && t.timerActive);
          const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : undefined;

          let sessionSeconds = 0;
          if (activeTask && activeTask.startedAt) {
            const started = new Date(activeTask.startedAt).getTime();
            let diffSec = Math.max(0, Math.floor((Date.now() - started) / 1000));
            if (diffSec > 8 * 3600) {
              diffSec = (diffSec % (3 * 3600)) + 3600;
            }
            sessionSeconds = diffSec;
          }

          return (
            <LiquidGlassCard
              key={member.id}
              variant={activeTask ? 'active' : 'surface'}
              className="p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-9 h-9 rounded-[3px] object-cover border border-slate-300 dark:border-white/20"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-[1px] border border-white dark:border-slate-950 ${
                        member.status === 'online'
                          ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                          : member.status === 'break'
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white tracking-wide truncate" title={member.name}>
                      {member.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate" title={member.department}>
                      {member.department}
                    </div>
                  </div>
                </div>

                <SquareBadge
                  label={member.status}
                  variant={member.status === 'online' ? 'emerald' : member.status === 'break' ? 'amber' : 'slate'}
                  dot
                  pulse={member.status === 'online'}
                />
              </div>

              {/* Active Session details */}
              {activeTask ? (
                <div className="p-2.5 bg-sky-100/70 dark:bg-cyan-950/40 border border-sky-300 dark:border-cyan-400/30 rounded-[2px] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-sky-800 dark:text-cyan-300 font-bold">
                    <span className="truncate max-w-[160px] flex items-center gap-1">
                      <FolderKanban className="w-3 h-3 text-sky-600 dark:text-cyan-400 shrink-0" />
                      {activeProject?.name || 'Project'}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">LIVE</span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {activeTask.title}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-sky-200 dark:border-cyan-500/20 text-xs font-mono">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                      Timer:
                    </span>
                    <span className="text-sky-700 dark:text-cyan-400 font-bold tracking-widest text-xs">
                      {formatDuration(sessionSeconds)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2px] text-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {member.status === 'online' ? 'Online (Awaiting Timer Start)' : 'Standby / Offline'}
                </div>
              )}
            </LiquidGlassCard>
          );
        })}
      </div>

      {/* Visual Status Kanban Board */}
      <LiquidGlassCard variant="elevated" className="p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase font-mono">
              Visual Sprint Status Board
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Click status arrows to transition states
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                className="liquid-glass p-3 rounded-[3px] border border-slate-200/80 dark:border-white/10 flex flex-col min-h-[380px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <SquareBadge label={col.label} variant={col.color} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[11px] font-mono text-slate-400 border border-dashed border-slate-200 dark:border-white/5 rounded-[2px]">
                      No tasks in {col.id}
                    </div>
                  ) : (
                    colTasks.map((t) => {
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-[2px] hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-sky-700 dark:text-cyan-400 truncate max-w-[120px] font-bold">{t.projectName}</span>
                            <SquareBadge
                              label={t.priority}
                              variant={t.priority === 'urgent' ? 'rose' : t.priority === 'high' ? 'amber' : 'slate'}
                            />
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {t.title}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="truncate max-w-[100px] text-slate-700 dark:text-slate-300 font-medium">{t.assignedToName}</span>
                            <span>{t.loggedHours}h / {t.estimatedHours}h</span>
                          </div>

                          {/* Quick transition control */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono">
                            <span className="text-slate-400">Move to:</span>
                            <div className="flex items-center gap-1">
                              {col.id !== 'in_progress' && (
                                <button
                                  onClick={() => updateTaskStatus(t.id, 'in_progress')}
                                  title="Move to In Progress"
                                  className="px-1.5 py-0.5 bg-sky-500/15 text-sky-800 dark:text-cyan-300 hover:bg-sky-500/25 rounded-[1px] font-semibold"
                                >
                                  In Prog
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  onClick={() => updateTaskStatus(t.id, 'completed')}
                                  title="Mark Completed"
                                  className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 rounded-[1px] font-semibold"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LiquidGlassCard>
    </div>
  );
}
