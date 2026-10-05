'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { AnnouncementType, Announcement } from '@/types';
import { Radio, Send, Building2, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';

export function BroadcastDesk() {
  const { currentUser } = useAuth();
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, policy } = useAppData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('urgent_alert');
  const [targetDepartment, setTargetDepartment] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'manager' || currentUser.role === 'manager_hr';

  const startEdit = (anc: Announcement) => {
    setEditingId(anc.id);
    setTitle(anc.title);
    setContent(anc.content);
    setType(anc.type);
    setTargetDepartment(anc.targetDepartment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setType('urgent_alert');
    setTargetDepartment('all');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      updateAnnouncement(editingId, {
        title: title.trim(),
        content: content.trim(),
        type,
        targetDepartment
      });
      cancelEdit();
    } else {
      addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        type,
        targetDepartment,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        priority: type === 'urgent_alert'
      });
      setTitle('');
      setContent('');
      setType('urgent_alert');
      setTargetDepartment('all');
    }
  };

  const confirmDelete = (id: string) => {
    deleteAnnouncement(id);
    if (editingId === id) cancelEdit();
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            Company-Wide Dispatch & Real-Time Broadcasts
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Announcements & Operational Circulars
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Push instant notices, holiday alerts, and departmental directives across all employee workstations in real time.
          </p>
        </div>

        {canManage && (
          <span className="px-2.5 py-1 rounded-[2px] bg-sky-500/10 dark:bg-cyan-500/10 border border-sky-400/30 text-[11px] font-mono font-bold text-sky-700 dark:text-cyan-300 w-fit">
            Manager & Admin Dispatch Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form (Only for Manager & Super Admin) */}
        {canManage ? (
          <LiquidGlassCard variant="elevated" className="p-5 lg:col-span-1 h-fit relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${editingId ? 'text-amber-500' : 'text-sky-600 dark:text-cyan-400'} animate-pulse`} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Announcement' : 'Create New Broadcast'}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex gap-2">
                <LiquidButton
                  type="submit"
                  variant={editingId ? 'amber' : type === 'urgent_alert' ? 'danger' : 'primary'}
                  size="md"
                  icon={editingId ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  className="flex-1 justify-center"
                >
                  {editingId ? 'Save Changes' : 'Publish Real-Time Notice'}
                </LiquidButton>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 rounded-[3px] text-xs font-mono border border-slate-300 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </LiquidGlassCard>
        ) : null}

        {/* Existing Announcements Feed */}
        <div className={`${canManage ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
            <span>Live Broadcast Feed ({announcements.length})</span>
            <span className="text-sky-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time WebSocket Sync Active
            </span>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[4px]">
                <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No broadcasts active</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">Create an announcement above to notify the team in real time.</p>
              </div>
            ) : (
              announcements.map((anc) => {
                const getBadgeProps = () => {
                  switch (anc.type) {
                    case 'urgent_alert': return { label: 'URGENT ALERT', variant: 'rose' as const };
                    case 'holiday_alert': return { label: 'HOLIDAY ALERT', variant: 'emerald' as const };
                    default: return { label: 'GENERAL NOTICE', variant: 'cyan' as const };
                  }
                };
                const badge = getBadgeProps();
                const isDeleting = deletingId === anc.id;

                return (
                  <LiquidGlassCard key={anc.id} className="p-4 relative" glow={badge.variant}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SquareBadge {...badge} dot pulse={anc.type === 'urgent_alert'} />
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          Target: {anc.targetDepartment === 'all' ? 'All Company' : anc.targetDepartment}
                        </span>
                        {anc.updatedAt && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10">
                            Edited
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(anc.createdAt).toLocaleDateString()}
                        </span>

                        {canManage && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => startEdit(anc)}
                              title="Edit Announcement"
                              className="p-1.5 rounded-[2px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingId(anc.id)}
                              title="Delete Announcement"
                              className="p-1.5 rounded-[2px] hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 tracking-wide">{anc.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{anc.content}</p>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                      <span>Dispatched by {anc.authorName} ({anc.authorRole.toUpperCase().replace('_', ' ')})</span>
                      {anc.updatedAt && (
                        <span>Last updated: {new Date(anc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>

                    {/* Inline Delete Confirmation */}
                    {isDeleting && (
                      <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-[3px] flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>Are you sure you want to permanently delete this announcement?</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => confirmDelete(anc.id)}
                            className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-[2px] hover:bg-rose-700 text-xs transition-colors"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 border border-slate-300 dark:border-white/20 rounded-[2px] hover:bg-black/[0.04] text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </LiquidGlassCard>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
