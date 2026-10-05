'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  Users,
  Briefcase,
  CheckCircle2,
  Info
} from 'lucide-react';

export function LoginPage() {
  const { loginWithCredentials, users } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autofillFlashed, setAutofillFlashed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both corporate email and password.');
      return;
    }

    setIsLoading(true);
    // Simulate natural authentication handshake
    setTimeout(() => {
      const res = loginWithCredentials(email.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 450);
  };

  const handleQuickAutofillAdmin = () => {
    setEmail('ali.raza@quickslogix.com');
    setPassword('#Imthepassword@123#');
    setError('');
    setAutofillFlashed(true);
    showNotification('Autofill Applied', 'Super Admin credentials loaded into form.', 'info');
    setTimeout(() => setAutofillFlashed(false), 1500);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center p-4 sm:p-6 bg-[#f4f6fb] dark:bg-[#080a11] text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-sky-500/20">
      {/* Background Liquid Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[35%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-cyan-400/10 dark:bg-cyan-400/10 blur-[100px]" />
      </div>

      {/* Top Bar with Branding & Theme Switcher */}
      <header className="w-full max-w-5xl flex items-center justify-between relative z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 p-[1px] shadow-[0_0_15px_rgba(14,165,233,0.35)]">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[2px] flex items-center justify-center">
              <span className="text-sky-600 dark:text-cyan-400 font-mono font-black text-sm tracking-tighter">QX</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                quickslogx
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono uppercase bg-sky-500/10 text-sky-700 dark:text-cyan-300 border border-sky-400/30 rounded-[2px] font-semibold">
                OS 2.6
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
              Enterprise Human Resource Suite
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-indigo-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </motion.button>
      </header>

      {/* Main Liquid Glassmorphic Auth Card */}
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-[440px] my-auto relative z-10"
      >
        <div
          className={`liquid-glass-elevated border rounded-[4px] p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            autofillFlashed
              ? 'border-emerald-400 dark:border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
              : 'border-slate-200/90 dark:border-white/15'
          }`}
        >
          {/* Top Edge Specular Highlight Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/60 dark:via-cyan-400/60 to-transparent" />

          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-sky-500/10 dark:bg-cyan-500/10 border border-sky-400/25 dark:border-cyan-400/25 text-sky-700 dark:text-cyan-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-3">
              <Shield className="w-3.5 h-3.5" />
              Secure Identity Gateway
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Access your role-specific dashboard and workspace.
            </p>
          </div>

          {/* Quick 1-Tap Autofill Chip for Super Admin */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleQuickAutofillAdmin}
              className="w-full p-2.5 rounded-[3px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-sky-500/10 dark:hover:bg-cyan-500/10 border border-dashed border-sky-400/40 dark:border-cyan-400/30 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[2px] bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors">
                    1-Tap Autofill: Super Admin
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    ali.raza@quickslogix.com
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[1px] bg-sky-500/15 text-sky-700 dark:text-cyan-300 font-semibold group-hover:scale-105 transition-transform">
                Load Fill
              </span>
            </button>
          </div>

          {/* Error Message Toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/40 rounded-[2px] flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-bold">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali.raza@quickslogix.com"
                  className="w-full glass-input pl-9 pr-3 py-2.5 text-sm transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">
                  Corporate Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input pl-9 pr-10 py-2.5 text-sm font-mono transition-all text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Keep session authenticated
                </span>
              </label>

              <span className="text-[11px] text-slate-400 font-mono">
                AES-256 Auth
              </span>
            </div>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-[3px] bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Access Flow Architecture Info Card */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <Info className="w-3 h-3 text-sky-500" />
              Onboarding & Role Hierarchy
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="p-2 rounded-[2px] bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span><strong className="text-slate-900 dark:text-white">Super Admin:</strong> Creates Department Managers.</span>
              </div>
              <div className="p-2 rounded-[2px] bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span><strong className="text-slate-900 dark:text-white">Managers:</strong> Onboard Employees with temp password.</span>
              </div>
              <div className="p-2 rounded-[2px] bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span><strong className="text-slate-900 dark:text-white">Employees:</strong> 1st login requires new password & customization.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-4 text-center relative z-10">
        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} quickslogx Technologies. Liquid Glass Interface Engine.
        </p>
      </footer>
    </div>
  );
}
