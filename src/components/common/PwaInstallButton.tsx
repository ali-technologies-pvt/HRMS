'use client';

import React, { useState, useEffect } from 'react';
import { Download, Monitor, CheckCircle, ExternalLink, X, Sparkles, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PwaInstallButton({ variant = 'topbar' }: { variant?: 'topbar' | 'sidebar' | 'banner' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalledJustNow, setIsInstalledJustNow] = useState(false);

  useEffect(() => {
    // Check if running in standalone window
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsInstalledJustNow(true);
        setShowModal(false);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstalledJustNow(true);
      }
      setDeferredPrompt(null);
    } else {
      // If native prompt not triggered yet, open the intuitive desktop install guide modal
      setShowModal(true);
    }
  };

  // If already running inside standalone desktop app
  if (isInstalled && variant === 'topbar') {
    return (
      <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-sky-500/10 border border-sky-400/20 text-sky-600 dark:text-cyan-400 text-[11px] font-mono font-bold">
        <Monitor className="w-3.5 h-3.5" />
        <span>Desktop App Active</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'topbar' && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleInstallClick}
          title="Install quickslogx HRMS as standalone Desktop Application"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[4px] bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-indigo-500/15 hover:from-sky-500/25 hover:to-indigo-500/25 border border-sky-400/35 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all shadow-xs"
        >
          <Laptop className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">Install Desktop App</span>
          <span className="sm:hidden text-[11px]">Install</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </motion.button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full p-2.5 rounded-[6px] bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 border border-sky-400/30 text-left transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-cyan-400 shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>Install Desktop App</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Zero-lag standalone window
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Interactive Desktop Install Guide Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-[#0f1422] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 relative font-sans"
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Install quickslogx Desktop App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standalone Desktop Window without Browser Tab Lag
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 my-4">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kyun Install Karein? (Why Install?)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                    <li><strong>No Chrome Tab Lag:</strong> Chrome ke dozens tabs se alag standalone process mein chalta hai.</li>
                    <li><strong>Windows Taskbar & Start Menu:</strong> Direct icon taskbar par pin hota hai.</li>
                    <li><strong>Instant Notifications:</strong> Native laptop desktop alerts aur sub-50ms sync.</li>
                  </ul>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    How to Install in 1 Click:
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#151a2b] border border-slate-200/70 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Apne browser (Chrome ya Edge) ke address bar ke right side par <strong>Install App (⊞ / ⬇)</strong> icon par click karein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Ya phir Chrome menu <strong>(⋮) {'>'} Save and share / Cast {'>'} "Install quickslogx HRMS"</strong> select karein.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Now (One Click)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Got It! (Samajh Aa Gaya)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
