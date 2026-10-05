'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { AnnouncementType } from '@/types';
import { Radio, Send, Building2 } from 'lucide-react';

export function BroadcastDesk() {
  const { currentUser } = useAuth();
  const { announcements, addAnnouncement, policy } = useAppData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('urgent_alert');
  const [targetDepartment, setTargetDepartment] = useState('all');

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    addAnnouncement({
      title,
      content,
      type,
      targetDepartment,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      priority: type === 'urgent_alert'
    });

    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
          Company-Wide Dispatch
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          Announcements & Real-Time Broadcast Desk
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Push real-time alerts, operational updates, and holiday circulars across specific departments or all company terminals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <LiquidGlassCard variant="elevated" className="p-5 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
            <Radio className="w-4 h-4 text-sky-600 dark:text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Broadcast</h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Broadcast Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                className="w-full glass-input px-3 py-2 text-xs font-mono uppercase font-bold"
              >
                <option value="urgent_alert" className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-300">🚨 Urgent Alert</option>
                <option value="general_notice" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-cyan-300">📢 General Notice</option>
                <option value="holiday_alert" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300">🌴 Holiday Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Target Audience
              </label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs font-medium"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Company (Entire Organization)</option>
                {policy.departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {dept} Department
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Notice Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Network Edge Cutover"
                className="w-full glass-input px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Content & Instructions
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter detailed notice message..."
                className="w-full glass-input px-3 py-2 text-xs leading-relaxed resize-none"
              />
            </div>

            <LiquidButton
              type="submit"
              variant={type === 'urgent_alert' ? 'danger' : 'primary'}
              size="md"
              icon={<Send className="w-3.5 h-3.5" />}
              className="w-full justify-center"
            >
              Publish Real-Time Notice
            </LiquidButton>
          </form>
        </LiquidGlassCard>

        {/* Existing Announcements Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
            <span>Live Broadcast Feed ({announcements.length})</span>
            <span className="text-sky-600 dark:text-cyan-400 font-bold">Real-Time Sync Active</span>
          </div>

          <div className="space-y-3">
            {announcements.map((anc) => {
              const getBadgeProps = () => {
                switch (anc.type) {
                  case 'urgent_alert': return { label: 'URGENT ALERT', variant: 'rose' as const };
                  case 'holiday_alert': return { label: 'HOLIDAY ALERT', variant: 'emerald' as const };
                  default: return { label: 'GENERAL NOTICE', variant: 'cyan' as const };
                }
              };
              const badge = getBadgeProps();

              return (
                <LiquidGlassCard key={anc.id} className="p-4" glow={badge.variant}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <SquareBadge {...badge} dot pulse={anc.type === 'urgent_alert'} />
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        Target: {anc.targetDepartment === 'all' ? 'All Company' : anc.targetDepartment}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(anc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 tracking-wide">{anc.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{anc.content}</p>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                    <span>Dispatched by {anc.authorName} ({anc.authorRole.toUpperCase().replace('_', ' ')})</span>
                  </div>
                </LiquidGlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
