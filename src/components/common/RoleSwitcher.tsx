'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ChevronDown, Shield, Users, Briefcase, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RoleSwitcher() {
  const { currentUser, users, loginAsUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roleIcons: Record<UserRole, React.ReactNode> = {
    super_admin: <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />,
    manager: <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />,
    hr: <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    manager_hr: <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    employee: <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'manager': return 'Team Manager';
      case 'hr': return 'HR Lead';
      case 'manager_hr': return 'Unified Manager & HR';
      case 'employee': return 'Employee';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-glass px-3 py-1.5 rounded-[3px] flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 hover:border-sky-400 dark:hover:border-cyan-400/40 transition-all select-none border border-slate-200/80 dark:border-white/10 shadow-sm"
      >
        <span className="p-1 rounded-[2px] bg-black/[0.04] dark:bg-white/[0.05]">
          {roleIcons[currentUser.role]}
        </span>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 leading-tight font-bold">ACTIVE PERSPECTIVE</div>
          <div className="font-bold text-slate-900 dark:text-white tracking-wide text-xs">{getRoleLabel(currentUser.role)}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-72 liquid-glass-dropdown border border-slate-200 dark:border-white/15 p-2 rounded-[3px] shadow-2xl z-50"
            >
              <div className="px-2.5 py-1.5 mb-1.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Switch Portal Account</span>
                <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-mono font-semibold">Active Accounts</span>
              </div>

              <div className="space-y-1">
                {users.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        loginAsUser(u.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-[2px] transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-cyan-500/15 border border-sky-400/50 dark:border-cyan-400/30 text-sky-950 dark:text-white font-semibold'
                          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-[2px] object-cover border border-slate-300 dark:border-white/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate text-slate-900 dark:text-white">{u.name}</span>
                          {u.mustChangePassword && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-[1px] flex items-center gap-1 font-bold">
                              <ShieldAlert className="w-2.5 h-2.5" /> Temp
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium">
                          {roleIcons[u.role]}
                          <span>{getRoleLabel(u.role)}</span>
                          <span className="text-slate-400">•</span>
                          <span className="truncate">{u.department}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
