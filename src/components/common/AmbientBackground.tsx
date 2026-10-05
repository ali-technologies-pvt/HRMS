'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-500 bg-[#f4f6fb] dark:bg-[#080a11]">
      {/* Precision micro-dot grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.9) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Light Mode: Apple Iridescent Liquid Azure Sphere */}
      <motion.div
        animate={{
          x: [0, 70, -50, 0],
          y: [0, -60, 50, 0],
          scale: [1, 1.25, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[12%] -left-[8%] w-[650px] h-[650px] bg-sky-400/25 dark:bg-cyan-500/12 rounded-full blur-[140px]"
      />

      {/* Light Mode: Apple Warm Coral / Rose Accent Sphere */}
      <motion.div
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 70, -60, 0],
          scale: [1, 1.2, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        className="absolute top-[20%] -right-[10%] w-[680px] h-[680px] bg-indigo-400/20 dark:bg-violet-600/14 rounded-full blur-[160px]"
      />

      {/* Light Mode: Gentle Emerald / Mint Bottom Sphere */}
      <motion.div
        animate={{
          x: [0, 50, -60, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
        className="absolute -bottom-[15%] left-[20%] w-[720px] h-[720px] bg-emerald-400/18 dark:bg-emerald-500/10 rounded-full blur-[170px]"
      />

      {/* Light Mode: Warm Amber / Sunbeam Glow */}
      <motion.div
        animate={{
          x: [0, 40, -40, 0],
          y: [0, 30, -30, 0],
          scale: [1, 1.1, 1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute top-[45%] left-[40%] w-[500px] h-[500px] bg-amber-300/15 dark:bg-amber-500/5 rounded-full blur-[150px]"
      />

      {/* Specular Top Shimmer Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 dark:via-cyan-400/30 to-transparent" />
    </div>
  );
}
