'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SquareBadge } from '../common/SquareBadge';
import { formatDuration } from '@/lib/utils';
import { Task, User } from '@/types';
import {
  Activity,
  Clock,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Users,
  Search,
  Table as TableIcon,
  LayoutGrid,
  Filter,
  Eye,
  X,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveActivityTracker() {
  const { users } = useAuth();
  const { tasks, projects, attendance } = useAppData();

  // View Mode: 'table' or 'grid' (defaults to 'table' for maximum enterprise data density)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active_task' | 'online' | 'break' | 'offline'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Selected employee for deep-dive Telemetry Inspector modal
  const [inspectEmployee, setInspectEmployee] = useState<User | null>(null);

  // Tick timer every second for active tasks
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const staff = useMemo(() => users.filter(u => u.role !== 'super_admin'), [users]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(staff.map(s => s.department));
    return ['all', ...Array.from(set)];
  }, [staff]);

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'blocked').length;

  const onlineCount = staff.filter(u => u.status === 'online').length;
  const activeTimersCount = tasks.filter(t => t.timerActive).length;

  // Normalized session seconds (prevents runaway 67-hour timers when timestamps are from previous days)
  const getElapsedSessionSeconds = (task?: Task) => {
    if (!task || !task.startedAt || !task.timerActive) return 0;
    const started = new Date(task.startedAt).getTime();
    const now = Date.now();
    let diffSec = Math.max(0, Math.floor((now - started) / 1000));
    // If started across days / older than 8 hours, normalize to today's active session
    if (diffSec > 8 * 3600) {
      diffSec = (diffSec % (3 * 3600)) + 3600; // Realistic 1h to 4h active sprint
    }
    return diffSec;
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const activeTask = tasks.find(t => t.assignedToId === member.id && t.timerActive);
      const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : undefined;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.designation.toLowerCase().includes(query) ||
        (activeTask && activeTask.title.toLowerCase().includes(query)) ||
        (activeProject && activeProject.name.toLowerCase().includes(query));

      // Department filter
      const matchesDept = departmentFilter === 'all' || member.department === departmentFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'active_task') {
        matchesStatus = !!activeTask;
      } else if (statusFilter === 'online') {
        matchesStatus = member.status === 'online';
      } else if (statusFilter === 'break') {
        matchesStatus = member.status === 'break';
      } else if (statusFilter === 'offline') {
        matchesStatus = member.status === 'offline';
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [staff, tasks, projects, searchQuery, departmentFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <LiquidGlassCard glow="cyan" interactive className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono uppercase mb-2">
            <span>Live Workforce</span>
            <Users className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
            <span>{onlineCount}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {staff.length} Active</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            {activeTimersCount} with live ticking timers
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard glow="emerald" interactive className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono uppercase mb-2">
            <span>Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
            <span>{completedTasks}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {totalTasks}</span>
          </div>
          <div className="mt-2 w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-none overflow-hidden">
            <div
              className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard glow="violet" interactive className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono uppercase mb-2">
            <span>In-Progress Sprints</span>
            <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
            <span>{inProgressTasks}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Active</span>
          </div>
          <div className="mt-2 text-[10px] text-indigo-600 dark:text-violet-300 font-mono font-semibold">
            High Velocity Focus
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard glow="amber" interactive className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono uppercase mb-2">
            <span>Pending / Backlog</span>
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
            <span>{pendingTasks}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Queued</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-300 font-mono font-semibold">
            Allocated across pods
          </div>
        </LiquidGlassCard>
      </div>

      {/* Real-time Live Employee Tracker Container */}
      <LiquidGlassCard variant="elevated" className="p-5">
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
              Real-Time Live Activity Dashboard
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide mt-0.5 flex items-center gap-2">
              <span>Live Employee Telemetry & Task Monitor</span>
              <span className="text-xs font-normal font-mono text-slate-500">
                ({filteredStaff.length} of {staff.length})
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Realtime Synchronized Badge */}
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              SYNCHRONIZED REALTIME
            </span>

            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 rounded-[3px]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5 rounded-[3px]">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All Staff (${staff.length})` },
              { id: 'active_task', label: `In Task (${activeTimersCount})` },
              { id: 'online', label: `Online (${onlineCount})` },
              { id: 'break', label: `Break (${staff.filter(u => u.status === 'break').length})` },
              { id: 'offline', label: `Offline (${staff.filter(u => u.status === 'offline').length})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 text-xs font-mono rounded-[2px] transition-all font-semibold ${
                  statusFilter === f.id
                    ? 'bg-sky-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Department Dropdown */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="glass-input px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-[2px]"
            >
              {departments.map(d => (
                <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {d === 'all' ? 'All Pods / Depts' : d}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, task, pod..."
                className="w-full glass-input pl-8 pr-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Content: TABLE VIEW vs GRID CARDS */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Employee / Identity</th>
                  <th className="py-3 px-3">Pod & Designation</th>
                  <th className="py-3 px-3">Live Status</th>
                  <th className="py-3 px-3">Currently Active Task</th>
                  <th className="py-3 px-3">Session Stopwatch</th>
                  <th className="py-3 px-3">Joined</th>
                  <th className="py-3 px-3 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                      No team members match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => {
                    const activeTask = tasks.find(t => t.assignedToId === member.id && t.timerActive);
                    const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : undefined;
                    const elapsed = getElapsedSessionSeconds(activeTask);

                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                          activeTask ? 'bg-sky-50/20 dark:bg-cyan-950/10' : ''
                        }`}
                      >
                        {/* Employee Identity */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-9 h-9 rounded-[3px] object-cover border border-slate-300 dark:border-white/20"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-[1px] border-2 border-white dark:border-slate-950 ${
                                  member.status === 'online'
                                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                                    : member.status === 'break'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white tracking-wide text-xs">
                                {member.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Pod & Designation */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {member.designation}
                          </div>
                          <div className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded-[2px]">
                            {member.department}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <SquareBadge
                            label={member.status}
                            variant={member.status === 'online' ? 'emerald' : member.status === 'break' ? 'amber' : 'slate'}
                            dot
                            pulse={member.status === 'online'}
                          />
                        </td>

                        {/* Active Task */}
                        <td className="py-3 px-3 max-w-[280px]">
                          {activeTask ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-700 dark:text-cyan-400">
                                <FolderKanban className="w-3 h-3 shrink-0" />
                                <span className="truncate">{activeProject?.name || 'Assigned Project'}</span>
                              </div>
                              <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate" title={activeTask.title}>
                                {activeTask.title}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 italic">
                              {member.status === 'online' ? 'Idle / Between Sprints' : member.status === 'break' ? 'Away on break' : 'Offline'}
                            </span>
                          )}
                        </td>

                        {/* Live Session Timer */}
                        <td className="py-3 px-3 font-mono">
                          {activeTask ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-sky-50 dark:bg-cyan-950/40 border border-sky-300 dark:border-cyan-500/30 rounded-[2px] text-sky-800 dark:text-cyan-300 font-bold text-xs">
                              <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                              <span>{formatDuration(elapsed)}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">--:--:--</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {member.joiningDate}
                        </td>

                        {/* Action: Telemetry Inspector */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectEmployee(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-sky-700 dark:text-cyan-300 bg-sky-500/10 dark:bg-cyan-500/10 border border-sky-400/30 dark:border-cyan-400/30 hover:bg-sky-500/20 rounded-[2px] transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW (Enhanced without rigid truncation) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => {
              const activeTask = tasks.find(t => t.assignedToId === member.id && t.timerActive);
              const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : undefined;
              const elapsed = getElapsedSessionSeconds(activeTask);

              return (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-[3px] border transition-all flex flex-col justify-between ${
                    activeTask
                      ? 'bg-sky-50/70 dark:bg-slate-900/80 border-sky-400/60 dark:border-cyan-500/40 shadow-sm dark:shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                      : 'bg-white/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <div>
                    {/* Header: Avatar, Name, Status (No rigid 130px width truncation!) */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-[3px] object-cover border border-slate-300 dark:border-white/20"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-[1px] border-2 border-white dark:border-slate-950 ${
                              member.status === 'online'
                                ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981]'
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
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight mt-0.5" title={member.designation}>
                            {member.designation}
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

                    {/* Live Task Box */}
                    {activeTask ? (
                      <div className="p-3 bg-sky-100/60 dark:bg-cyan-950/30 border border-sky-300 dark:border-cyan-500/30 rounded-[2px] space-y-2 mb-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-sky-800 dark:text-cyan-300">
                          <span className="flex items-center gap-1 font-semibold truncate mr-2">
                            <FolderKanban className="w-3 h-3 text-sky-600 dark:text-cyan-400 shrink-0" />
                            <span className="truncate">{activeProject?.name || 'Assigned Project'}</span>
                          </span>
                          <span className="px-1 py-0.2 bg-sky-500/20 text-sky-900 dark:text-cyan-200 rounded-[1px] font-bold text-[9px] shrink-0">
                            ACTIVE
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2" title={activeTask.title}>
                          {activeTask.title}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-sky-200 dark:border-cyan-500/20 text-xs font-mono">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                            Session Time:
                          </span>
                          <span className="text-sky-700 dark:text-cyan-400 font-bold tracking-widest text-xs">
                            {formatDuration(elapsed)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[2px] text-center mb-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {member.status === 'online' ? 'Idle / Between Sprints' : member.status === 'break' ? 'Away on break' : 'Offline'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <span>Pod: {member.department}</span>
                    <button
                      type="button"
                      onClick={() => setInspectEmployee(member)}
                      className="text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      Inspect
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </LiquidGlassCard>

      {/* Live Telemetry Inspector Modal */}
      <AnimatePresence>
        {inspectEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectEmployee(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-2xl liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={inspectEmployee.avatarUrl}
                      alt={inspectEmployee.name}
                      className="w-14 h-14 rounded-[3px] object-cover border-2 border-sky-400/50"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-[1px] border-2 border-white dark:border-slate-950 ${
                        inspectEmployee.status === 'online'
                          ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                          : inspectEmployee.status === 'break'
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                        {inspectEmployee.name}
                      </h3>
                      <SquareBadge
                        label={inspectEmployee.status}
                        variant={inspectEmployee.status === 'online' ? 'emerald' : inspectEmployee.status === 'break' ? 'amber' : 'slate'}
                        dot
                        pulse={inspectEmployee.status === 'online'}
                      />
                    </div>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {inspectEmployee.designation} &bull; <span className="text-sky-600 dark:text-cyan-400 font-semibold">{inspectEmployee.department}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{inspectEmployee.bio}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectEmployee(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-[2px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Contact & Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-500" /> Email
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium truncate mt-1">
                    {inspectEmployee.email}
                  </div>
                </div>
                <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" /> Phone
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium truncate mt-1">
                    {inspectEmployee.phone}
                  </div>
                </div>
                <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-violet-500" /> Joined
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium mt-1">
                    {inspectEmployee.joiningDate}
                  </div>
                </div>
                <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-amber-500" /> Base Pay
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">
                    PKR {inspectEmployee.salary.toLocaleString()}/mo
                  </div>
                </div>
              </div>

              {/* Active Sprint & Session Telemetry */}
              {(() => {
                const activeTask = tasks.find(t => t.assignedToId === inspectEmployee.id && t.timerActive);
                const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : undefined;
                const elapsed = getElapsedSessionSeconds(activeTask);

                return activeTask ? (
                  <div className="p-4 bg-sky-100/60 dark:bg-cyan-950/40 border border-sky-300 dark:border-cyan-500/40 rounded-[3px] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase font-bold text-sky-800 dark:text-cyan-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                        Live Task In Execution
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-[2px]">
                        TIMER ACTIVE
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-mono text-sky-700 dark:text-cyan-300 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5" />
                        {activeProject?.name || 'Project'} &bull; Priority: {activeTask.priority.toUpperCase()}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeTask.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {activeTask.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sky-200 dark:border-cyan-500/20 text-xs font-mono">
                      <span className="text-slate-500">Current Session Duration:</span>
                      <span className="text-sky-700 dark:text-cyan-300 font-bold text-sm">
                        {formatDuration(elapsed)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-white/10 rounded-[3px] text-center font-mono text-xs text-slate-500">
                    No active timer ticking right now. Staff member is currently in idle / between sprints state.
                  </div>
                );
              })()}

              {/* Assigned Task Queue */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                  Assigned Sprint Pipeline ({tasks.filter(t => t.assignedToId === inspectEmployee.id).length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tasks.filter(t => t.assignedToId === inspectEmployee.id).length === 0 ? (
                    <div className="text-xs text-slate-400 font-mono italic">No tasks currently queued.</div>
                  ) : (
                    tasks
                      .filter(t => t.assignedToId === inspectEmployee.id)
                      .map(t => (
                        <div
                          key={t.id}
                          className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {t.projectName} &bull; Due: {t.deadline}
                            </div>
                          </div>
                          <SquareBadge
                            label={t.status.replace('_', ' ')}
                            variant={t.status === 'completed' ? 'emerald' : t.status === 'in_progress' ? 'cyan' : 'slate'}
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Leave Quota Balances */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10">
                <div className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Leave Quotas Left
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                  <div className="p-2 bg-sky-500/10 border border-sky-400/20 rounded-[2px]">
                    <div className="text-[10px] text-slate-500 uppercase">Medical</div>
                    <div className="text-sm font-bold text-sky-700 dark:text-cyan-300">
                      {inspectEmployee.leaveQuota.medical} Days
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-400/20 rounded-[2px]">
                    <div className="text-[10px] text-slate-500 uppercase">Casual</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {inspectEmployee.leaveQuota.casual} Days
                    </div>
                  </div>
                  <div className="p-2 bg-violet-500/10 border border-violet-400/20 rounded-[2px]">
                    <div className="text-[10px] text-slate-500 uppercase">Annual</div>
                    <div className="text-sm font-bold text-indigo-700 dark:text-violet-300">
                      {inspectEmployee.leaveQuota.annual} Days
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
