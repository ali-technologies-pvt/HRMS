'use client';

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidGlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate' | 'none';
  variant?: 'surface' | 'elevated' | 'active';
  interactive?: boolean;
}

export function LiquidGlassCard({
  children,
  className,
  glow = 'none',
  variant = 'surface',
  interactive = false,
  ...props
}: LiquidGlassCardProps) {
  const getGlowStyles = () => {
    switch (glow) {
      case 'cyan':
        return 'hover:border-sky-400/60 dark:hover:border-cyan-400/40 hover:shadow-[0_12px_32px_rgba(2,132,199,0.12)] dark:hover:shadow-[0_8px_32px_rgba(0,240,255,0.14)]';
      case 'violet':
        return 'hover:border-violet-400/60 dark:hover:border-violet-400/40 hover:shadow-[0_12px_32px_rgba(139,92,246,0.12)] dark:hover:shadow-[0_8px_32px_rgba(139,92,246,0.14)]';
      case 'emerald':
        return 'hover:border-emerald-400/60 dark:hover:border-emerald-400/40 hover:shadow-[0_12px_32px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_8px_32px_rgba(16,185,129,0.14)]';
      case 'amber':
        return 'hover:border-amber-400/60 dark:hover:border-amber-400/40 hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)] dark:hover:shadow-[0_8px_32px_rgba(245,158,11,0.14)]';
      case 'rose':
        return 'hover:border-rose-400/60 dark:hover:border-rose-400/40 hover:shadow-[0_12px_32px_rgba(244,63,94,0.12)] dark:hover:shadow-[0_8px_32px_rgba(244,63,94,0.14)]';
      default:
        return 'hover:border-slate-300 dark:hover:border-white/20';
    }
  };

  const getVariantClass = () => {
    if (variant === 'elevated') return 'liquid-glass-elevated';
    if (variant === 'active') return 'liquid-glass-active-card';
    return 'liquid-glass';
  };

  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { type: 'spring', stiffness: 450, damping: 25 } } : undefined}
      className={cn(
        getVariantClass(),
        'rounded-[3px] p-5 transition-all text-slate-800 dark:text-slate-100 relative overflow-hidden',
        interactive && getGlowStyles(),
        interactive && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {/* Specular sheen corner highlight */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-white/40 dark:bg-white/[0.04] rotate-45 pointer-events-none" />
      {children}
    </motion.div>
  );
}
