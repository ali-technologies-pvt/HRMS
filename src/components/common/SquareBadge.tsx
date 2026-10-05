'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SquareBadgeProps {
  label: string;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function SquareBadge({
  label,
  variant = 'slate',
  dot = false,
  pulse = false,
  className
}: SquareBadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'cyan':
        return {
          bg: 'bg-sky-500/12 border-sky-400/40 text-sky-800 dark:text-cyan-300 dark:bg-cyan-500/10 dark:border-cyan-400/30',
          dot: 'bg-sky-500 dark:bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500/12 border-emerald-400/40 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-400/30',
          dot: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981]'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/12 border-amber-400/40 text-amber-800 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-400/30',
          dot: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_#f59e0b]'
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/12 border-rose-400/40 text-rose-800 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-400/30',
          dot: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_#f43f5e]'
        };
      case 'violet':
        return {
          bg: 'bg-violet-500/12 border-violet-400/40 text-violet-800 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-400/30',
          dot: 'bg-violet-500 dark:bg-violet-400 shadow-[0_0_8px_#8b5cf6]'
        };
      default:
        return {
          bg: 'bg-slate-200/60 border-slate-300/80 text-slate-700 dark:bg-white/[0.05] dark:border-white/10 dark:text-slate-300',
          dot: 'bg-slate-500 dark:bg-slate-400'
        };
    }
  };

  const { bg, dot: dotColor } = getColors();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase border rounded-[2px] font-semibold',
        bg,
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full opacity-75', dotColor)} />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5', dotColor)} />
        </span>
      )}
      {label}
    </span>
  );
}
