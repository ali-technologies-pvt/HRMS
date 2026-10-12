'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LiquidButton } from './LiquidButton';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ForcePasswordModal() {
  const { currentUser, completeMandatoryPasswordChange } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user does not require mandatory change, do not render
  if (!currentUser || !currentUser.mustChangePassword) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);
    const res = completeMandatoryPasswordChange(newPassword);
    setIsSubmitting(false);

    if (res.success) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#10b981', '#6366f1', '#ffffff']
        });
      } catch {}
    } else {
      setError(res.error || 'Failed to update credentials.');
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Deep frosted glass lock backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-2xl"
        />

        {/* Square Glass Security Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative z-10 w-full max-w-md liquid-glass-elevated border border-sky-400/50 dark:border-cyan-500/40 p-7 rounded-[4px] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-white dark:bg-white/95 rounded-[3px] border border-slate-200/80 dark:border-white/20 shadow-xs shrink-0">
              <img src="/logo-emblem.png" alt="quickslogix" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-600 dark:text-amber-400 font-extrabold">First-Login Protocol</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">Compulsory Password Update</h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed font-medium">
            Welcome, <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span>. 
            You have logged in using temporary credentials assigned during onboarding. 
            Company security compliance requires you to define a new private password before accessing the system.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 rounded-[2px] flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5 font-bold">
                <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                New Secure Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new private password..."
                className="w-full glass-input px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password..."
                className="w-full glass-input px-3 py-2.5 text-sm"
              />
            </div>

            {/* Password strength indicator */}
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2px] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 font-mono font-semibold">Password Strength</span>
                <span className={`font-mono font-bold ${
                  strengthScore === 3 ? 'text-emerald-600 dark:text-emerald-400' : strengthScore === 2 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                }`}>
                  {strengthScore === 3 ? 'STRONG' : strengthScore === 2 ? 'MEDIUM' : 'BASIC'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className={`h-1 rounded-none transition-colors ${strengthScore >= 1 ? 'bg-sky-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                <div className={`h-1 rounded-none transition-colors ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                <div className={`h-1 rounded-none transition-colors ${strengthScore === 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3 h-3 ${hasMinLength ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>8+ characters recommended</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3 h-3 ${hasNumber ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>Contains at least one number</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting || newPassword.length < 6}
                className="w-full justify-center"
              >
                {isSubmitting ? 'Encrypting & Activating...' : 'Activate Account & Proceed'}
              </LiquidButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
