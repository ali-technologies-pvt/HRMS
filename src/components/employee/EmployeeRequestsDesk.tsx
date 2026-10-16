'use client';

import React, { useEffect, useRef, useState } from 'react';
import { officeDate } from '@/lib/attendance-payroll';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { RequestType, LeaveSubType } from '@/types';
import { FileText, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmployeeRequestsDesk({initialDate,initialType}:{initialDate?:string;initialType?:RequestType} = {}) {
  const { currentUser } = useAuth();
  const { requests, submitRequest } = useAppData();

  const modal=useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<RequestType>(initialType||'leave');
  const [subType, setSubType] = useState<LeaveSubType>('casual');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(initialDate||officeDate());
  const [endDate, setEndDate] = useState(initialDate||officeDate());
  const [hours, setHours] = useState(2);
  const [projectDetails, setProjectDetails] = useState('');

  useEffect(()=>{if(!showModal)return;const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';const items=()=>Array.from(modal.current?.querySelectorAll<HTMLElement>('button,input,select,textarea')||[]).filter(element=>!element.hasAttribute('disabled')&&element.getClientRects().length);items()[0]?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape')setShowModal(false);if(event.key!=='Tab')return;const all=items(),first=all[0],last=all[all.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};},[showModal]);

  const myRequests = requests.filter(r => r.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reason.trim() || ((type==='leave'||type==='wfh'||type==='absence_excuse')&&endDate<startDate)) return;

    submitRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      type,
      subType: type === 'leave' ? subType : undefined,
      title,
      reason,
      startDate,
      endDate: type === 'leave' || type === 'wfh' || type === 'absence_excuse' ? endDate : undefined,
      hours: type === 'overtime' || type === 'late_excuse' ? Number(hours) : undefined,
      projectDetails: type === 'overtime' ? projectDetails : undefined
    });

    setShowModal(false);
    setTitle('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            YOUR REQUESTS
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Requests & leave
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Request leave, explain an absence or late arrival, and track your manager’s decision.
          </p>
        </div>

        <LiquidButton
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowModal(true)}
        >
          Submit Request
        </LiquidButton>
      </div>

      {/* Grid of Past Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myRequests.length === 0 ? (
          <div className="col-span-2 py-16 text-center liquid-glass border border-slate-200/80 dark:border-white/10 rounded-[3px] p-6 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No requests filed yet</h3>
            <p className="text-xs text-slate-500 font-mono">Submit a request to your manager when you need one.</p>
          </div>
        ) : (
          myRequests.map((req) => {
            const getTypeLabel = () => {
              switch (req.type) {
                case 'leave': return `LEAVE: ${req.subType?.toUpperCase() || 'CASUAL'}`;
                case 'wfh': return 'WORK FROM HOME';
                case 'overtime': return `OVERTIME CLAIM (${req.hours}h)`;
                case 'late_excuse': return 'LATE EXCUSE';
                case 'absence_excuse': return 'ABSENCE EXCUSE';
              }
            };

            return (
              <LiquidGlassCard key={req.id} variant="elevated" className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 uppercase tracking-wider font-bold">
                      {getTypeLabel()}
                    </span>
                    <SquareBadge
                      label={req.status}
                      variant={req.status === 'approved' ? 'emerald' : req.status === 'rejected' ? 'rose' : 'amber'}
                      dot
                    />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-wide">{req.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 font-medium">{req.reason}</p>

                  <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px] space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Effective Date:</span>
                      <span className="text-sky-700 dark:text-cyan-300 font-bold">{req.startDate} {req.endDate && req.endDate !== req.startDate ? `to ${req.endDate}` : ''}</span>
                    </div>
                    {req.hours && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500">Logged Hours:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{req.hours} Hours</span>
                      </div>
                    )}
                    {req.projectDetails && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500">Project:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{req.projectDetails}</span>
                      </div>
                    )}
                  </div>
                </div>

                {req.managerRemarks && (
                  <div className="mt-3 p-2.5 bg-sky-50 dark:bg-cyan-950/30 border border-sky-300 dark:border-cyan-400/20 rounded-[2px] text-xs">
                    <div className="text-[10px] font-mono text-sky-800 dark:text-cyan-400 uppercase font-bold">Manager Feedback</div>
                    <div className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">"{req.managerRemarks}"</div>
                  </div>
                )}
              </LiquidGlassCard>
            );
          })
        )}
      </div>

      {/* Submit Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              ref={modal} role="dialog" aria-modal="true" aria-labelledby="employee-request-title" className="relative z-10 w-full max-w-lg liquid-glass-elevated border border-sky-400/50 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl"
            >
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
                <FileText className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
                <h3 id="employee-request-title" className="text-base font-bold text-slate-900 dark:text-white">New request</h3><button type="button" aria-label="Close request" onClick={()=>setShowModal(false)} className="ml-auto p-2 rounded-lg text-slate-500 hover:bg-slate-100"><X size={18}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Request Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as RequestType)}
                      className="w-full glass-input px-3 py-2 text-xs"
                    >
                      <option value="leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Leave Application</option>
                      <option value="wfh" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Work From Home (WFH)</option>
                      <option value="absence_excuse">Absence / Off Excuse</option><option value="late_excuse" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Late Arrival Excuse</option>
                      <option value="overtime" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Overtime Compensation Claim</option>
                    </select>
                  </div>

                  {type === 'leave' && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        Leave Classification
                      </label>
                      <select
                        value={subType}
                        onChange={(e) => setSubType(e.target.value as LeaveSubType)}
                        className="w-full glass-input px-3 py-2 text-xs"
                      >
                        <option value="casual" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Casual Leave</option>
                        <option value="medical" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Medical / Sick Leave</option>
                        <option value="annual" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Annual Privilege</option>
                      </select>
                    </div>
                  )}

                  {(type === 'overtime' || type === 'late_excuse') && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        Duration (Hours)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        required
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="w-full glass-input px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="A short title for your request"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full glass-input px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  {(type === 'leave' || type === 'wfh' || type === 'absence_excuse') && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {type === 'overtime' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Associated Project
                    </label>
                    <input
                      type="text"
                      required
                      value={projectDetails}
                      onChange={(e) => setProjectDetails(e.target.value)}
                      placeholder="Project name"
                      className="w-full glass-input px-3 py-2 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain the details for your manager to review..."
                    className="w-full glass-input px-3 py-2 text-xs resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <LiquidButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </LiquidButton>
                  <LiquidButton type="submit" variant="primary">
                    Send request
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
