'use client';

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn, playGlassChime } from '@/lib/utils';

interface LiquidButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'glass' | 'emerald' | 'amber' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  soundEffect?: 'click' | 'success' | 'alert' | 'timer';
  className?: string;
}

export function LiquidButton({
  children,
  variant = 'glass',
  size = 'md',
  icon,
  soundEffect = 'click',
  className,
  onClick,
  disabled,
  ...props
}: LiquidButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playGlassChime(soundEffect);
      if (onClick) onClick(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white font-semibold border border-sky-300/50 shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)]';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold border border-emerald-300/50 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)]';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold border border-amber-300/50 shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)]';
      case 'danger':
        return 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold border border-rose-300/50 shadow-[0_4px_16px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_22px_rgba(244,63,94,0.45)]';
      case 'ghost':
        return 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent';
      default: // glass
        return 'bg-white/80 dark:bg-white/[0.08] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/15 hover:bg-white dark:hover:bg-white/[0.14] hover:border-slate-300 shadow-sm';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs gap-1.5';
      case 'lg':
        return 'px-6 py-3 text-sm gap-2.5';
      default:
        return 'px-4 py-2 text-xs uppercase tracking-wider font-semibold gap-2';
    }
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-[3px] transition-all select-none relative overflow-hidden',
        getVariantStyles(),
        getSizeStyles(),
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}
