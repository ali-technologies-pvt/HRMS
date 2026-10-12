'use client';

import React from 'react';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#f6f8fc] dark:bg-[#07090e]">
      {/* Precision micro-dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Pure static CSS ambient radial gradients (Zero GPU/CPU rasterization load) */}
      {/* Top Left: Subtle Cyan / Sky ambient glow */}
      <div 
        className="absolute -top-[10%] -left-[5%] w-[55vw] h-[55vh] rounded-full opacity-40 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.04) 50%, transparent 75%)',
          willChange: 'auto'
        }}
      />

      {/* Top Right: Subtle Indigo / Violet ambient accent */}
      <div 
        className="absolute top-[5%] -right-[5%] w-[50vw] h-[50vh] rounded-full opacity-35 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.03) 50%, transparent 75%)',
          willChange: 'auto'
        }}
      />

      {/* Bottom Center: Gentle Emerald / Mint hue */}
      <div 
        className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[45vh] rounded-full opacity-30 dark:opacity-12"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.02) 50%, transparent 75%)',
          willChange: 'auto'
        }}
      />

      {/* Specular hairline top divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 dark:via-cyan-400/20 to-transparent" />
    </div>
  );
}
