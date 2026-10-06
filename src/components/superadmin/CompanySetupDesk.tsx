'use client';

import React, { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { FolderKanban, Plus, Clock, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CompanySetupDesk() {
  const { projects, addProject, policy, updateCompanyPolicy } = useAppData();

  const [activeTab, setActiveTab] = useState<'projects' | 'policies'>('projects');

  // New project modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projDept, setProjDept] = useState('Engineering');
  const [projBudget, setProjBudget] = useState(50000);
  const [projDeadline, setProjDeadline] = useState('2026-12-31');
  const [projDesc, setProjDesc] = useState('');

  // Policy form states
  const [startTime, setStartTime] = useState(policy.officeStartTime);
  const [endTime, setEndTime] = useState(policy.officeEndTime);
  const [gracePeriod, setGracePeriod] = useState(policy.gracePeriodMinutes);

  // New holiday modal states
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyPolicy({
      officeStartTime: startTime,
      officeEndTime: endTime,
      gracePeriodMinutes: Number(gracePeriod)
    });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({
      name: projName,
      client: projClient,
      department: projDept,
      budget: Number(projBudget),
      deadline: projDeadline,
      status: 'active',
      description: projDesc
    });
    setShowProjectModal(false);
    setProjName('');
    setProjClient('');
    setProjDesc('');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const newHoliday = {
      id: 'hol-' + Date.now().toString(36),
      title: holidayTitle,
      date: holidayDate,
      description: holidayDesc
    };
    updateCompanyPolicy({
      holidays: [...policy.holidays, newHoliday]
    });
    setShowHolidayModal(false);
    setHolidayTitle('');
    setHolidayDate('');
    setHolidayDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            Enterprise Architecture
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Company & Project Governance Setup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define corporate project pipelines, office grace periods, shift windows, and official holidays.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-sky-500/20 text-sky-950 dark:text-cyan-300 border border-sky-400/50 dark:border-cyan-400/40 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-1.5 ${
              activeTab === 'policies'
                ? 'bg-sky-500/20 text-sky-950 dark:text-cyan-300 border border-sky-400/50 dark:border-cyan-400/40 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timings & Policies
          </button>
        </div>
      </div>

      {/* Projects Desk Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <LiquidButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowProjectModal(true)}
            >
              Add New Project
            </LiquidButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <LiquidGlassCard key={proj.id} interactive glow="cyan" className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 uppercase tracking-widest font-bold">
                      {proj.department}
                    </span>
                    <SquareBadge
                      label={proj.status.replace('_', ' ')}
                      variant={proj.status === 'active' ? 'emerald' : 'slate'}
                      dot
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-wide">{proj.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed font-medium">{proj.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{proj.client}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500">Allocated Budget:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {proj.budget ? 'PKR ' + proj.budget.toLocaleString() : 'Deliverable-based'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500">Deadline:</span>
                    <span className="text-sky-700 dark:text-cyan-300 font-bold">{proj.deadline}</span>
                  </div>
                </div>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Timings & Policies Tab */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shift timings & grace period */}
          <LiquidGlassCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
              <Clock className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Office Timings & Grace Period</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Used for automated late-punch detection across company attendance logs.</p>
              </div>
            </div>

            <form onSubmit={handleSavePolicies} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Grace Period (Minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    required
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="w-32 glass-input px-3 py-2 text-sm font-mono"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Employees clocking in after <span className="text-sky-700 dark:text-cyan-300 font-mono font-bold">09:15</span> are flagged as Late.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <LiquidButton type="submit" variant="primary">
                  Save Shift Settings
                </LiquidButton>
              </div>
            </form>
          </LiquidGlassCard>

          {/* Holiday Policies */}
          <LiquidGlassCard variant="elevated" className="p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Holidays & Breaks</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official scheduled non-working calendar days.</p>
                </div>
              </div>
              <LiquidButton
                variant="glass"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowHolidayModal(true)}
              >
                Add Holiday
              </LiquidButton>
            </div>

            <div className="space-y-2.5">
              {policy.holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3px] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">{h.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{h.description}</div>
                  </div>
                  <SquareBadge label={h.date} variant="emerald" />
                </div>
              ))}
            </div>
          </LiquidGlassCard>
        </div>
      )}

      {/* Add Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProjectModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative z-10 w-full max-w-md liquid-glass-elevated border border-sky-400/50 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Initialize Project Pipeline</h3>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="e.g. NextGen Web Portal"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Client Name</label>
                  <input
                    type="text"
                    required
                    value={projClient}
                    onChange={(e) => setProjClient(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Budget (PKR)</label>
                    <input
                      type="number"
                      required
                      value={projBudget}
                      onChange={(e) => setProjBudget(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Target Deadline</label>
                    <input
                      type="date"
                      required
                      value={projDeadline}
                      onChange={(e) => setProjDeadline(e.target.value)}
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Description</label>
                  <textarea
                    rows={2}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Scope of work..."
                    className="w-full glass-input px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <LiquidButton type="button" variant="ghost" onClick={() => setShowProjectModal(false)}>Cancel</LiquidButton>
                  <LiquidButton type="submit" variant="primary">Launch Project</LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Holiday Modal */}
      <AnimatePresence>
        {showHolidayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHolidayModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative z-10 w-full max-w-md liquid-glass-elevated border border-emerald-500/40 p-6 rounded-[4px] shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Add Official Company Holiday</h3>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Holiday Title</label>
                  <input
                    type="text"
                    required
                    value={holidayTitle}
                    onChange={(e) => setHolidayTitle(e.target.value)}
                    placeholder="e.g. Independence Day Gala"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">Details</label>
                  <input
                    type="text"
                    value={holidayDesc}
                    onChange={(e) => setHolidayDesc(e.target.value)}
                    placeholder="e.g. Official closed office holiday"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <LiquidButton type="button" variant="ghost" onClick={() => setShowHolidayModal(false)}>Cancel</LiquidButton>
                  <LiquidButton type="submit" variant="emerald">Confirm Holiday</LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
