'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Thermometer,
  Droplets,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Building2,
  FileText,
  MessageSquare,
  Bell,
  Sparkles,
  CheckCircle2,
  Activity,
  FolderKanban,
  Zap,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { User, Project, Task, CompanyPolicy, RequestItem } from '@/types';

interface ExecutiveDribbbleDashboardProps {
  currentUser: User;
  policy: CompanyPolicy;
  projects: Project[];
  tasks: Task[];
  teamUsers: User[];
  onlineCount: number;
  pendingRequests: RequestItem[];
  onOpenOnboardModal: () => void;
  onOpenDepartmentsModal: () => void;
  onOpenCreateProjectModal: () => void;
  onOpenClientReportModal: () => void;
  onOpenChat?: () => void;
}

// 1. Mini Circular Gauge Ring
function CircularProgressGauge({
  percentage,
  size = 46,
  stroke = 4.5,
  color = '#2c2d96',
  bgColor = 'rgba(226, 232, 240, 0.7)'
}: {
  percentage: number;
  size?: number;
  stroke?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
    </div>
  );
}

// 2. Dual-Tone Ring for the Active Indigo Card (Matching Bedroom card in screenshot)
function ActivePodDualGauge({ percentage = 78 }: { percentage?: number }) {
  const size = 52;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-[52px] h-[52px]">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track with soft white */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Accent Red/Coral Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f43f5e"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
          strokeLinecap="round"
        />
        {/* White Main Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ffffff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Icon badge */}
      <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
        <Sparkles className="w-3 h-3" />
      </div>
    </div>
  );
}

// 3. Relaxed Office Character SVG Illustration (Matching bottom right armchair art)
function RelaxedWorkspaceIllustration() {
  return (
    <div className="relative w-full h-36 flex items-end justify-center overflow-hidden select-none">
      <svg viewBox="0 0 240 140" className="w-full h-full max-w-[240px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wall Frame / Picture */}
        <rect x="180" y="8" width="28" height="24" rx="2" className="stroke-rose-300 dark:stroke-rose-800" strokeWidth="2" fill="#fff5f5" />
        <rect x="165" y="16" width="32" height="22" rx="2" className="stroke-amber-300 dark:stroke-amber-800" strokeWidth="2" fill="#fffbeb" />

        {/* Potted Plant */}
        <ellipse cx="28" cy="120" rx="14" ry="4" className="fill-slate-200 dark:fill-slate-800" />
        <path d="M20 120 L22 96 L34 96 L36 120 Z" className="fill-rose-300 dark:fill-rose-900" />
        {/* Leaves */}
        <path d="M28 96 Q16 75 14 60 Q26 70 28 96" className="fill-emerald-500" />
        <path d="M28 92 Q28 65 36 50 Q38 68 28 92" className="fill-emerald-600" />
        <path d="M28 94 Q40 76 46 62 Q38 78 28 94" className="fill-teal-500" />

        {/* Small Table on the right */}
        <rect x="194" y="100" width="24" height="4" rx="1" className="fill-rose-300" />
        <line x1="198" y1="104" x2="198" y2="124" className="stroke-rose-300" strokeWidth="2" strokeLinecap="round" />
        <line x1="214" y1="104" x2="214" y2="124" className="stroke-rose-300" strokeWidth="2" strokeLinecap="round" />
        {/* Coffee Mug on table */}
        <rect x="202" y="92" width="6" height="8" rx="1" className="fill-amber-400" />

        {/* Armchair (Royal Blue / Indigo) */}
        <rect x="74" y="86" width="92" height="38" rx="8" className="fill-[#2b2c98]" />
        {/* Cushion back */}
        <rect x="80" y="66" width="80" height="26" rx="6" className="fill-[#202175]" />
        {/* Chair Legs */}
        <line x1="84" y1="124" x2="80" y2="134" className="stroke-slate-700" strokeWidth="3" strokeLinecap="round" />
        <line x1="156" y1="124" x2="160" y2="134" className="stroke-slate-700" strokeWidth="3" strokeLinecap="round" />

        {/* Person Relaxing */}
        {/* Legs stretched out in blue denim */}
        <path d="M120 102 L168 86 Q184 94 186 100 Q170 108 140 108 Z" className="fill-sky-300" />
        <circle cx="186" cy="100" r="4" className="fill-amber-200" /> {/* Bare feet */}

        {/* Torso in white tee */}
        <ellipse cx="106" cy="84" rx="14" ry="12" className="fill-white" />

        {/* Head & Hair */}
        <circle cx="98" cy="62" r="9" className="fill-amber-200" />
        <path d="M90 60 Q96 48 106 54 Q106 66 90 64" className="fill-slate-900" />
        {/* Headphones */}
        <path d="M92 56 Q98 50 104 56" className="stroke-sky-600" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="92" cy="62" r="3" className="fill-sky-600" />

        {/* Laptop in hands */}
        <rect x="142" y="74" width="12" height="18" rx="1" transform="rotate(-20 142 74)" className="fill-sky-400 stroke-slate-800" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function ExecutiveDribbbleDashboard({
  currentUser,
  policy,
  projects,
  tasks,
  teamUsers,
  onlineCount,
  pendingRequests,
  onOpenOnboardModal,
  onOpenDepartmentsModal,
  onOpenCreateProjectModal,
  onOpenClientReportModal,
  onOpenChat
}: ExecutiveDribbbleDashboardProps) {
  // Selected department pod filter (0 = Engineering, 1 = Product Design, 2 = Operations, 3 = QA)
  const [activePodIndex, setActivePodIndex] = useState(1); // Default to index 1 (Bedroom style highlighted card)
  const [velocityDialValue, setVelocityDialValue] = useState(60); // 60% as in screenshot
  const [indoorTemp, setIndoorTemp] = useState(25);
  const [humidityLevel, setHumidityLevel] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time formatted date string: e.g. "Monday, 10 February 2026"
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // 4 Top Department Pods data
  const podCards = useMemo(() => {
    const totalHours = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

    return [
      {
        id: 'eng',
        title: 'Engineering',
        icon: '💻',
        value: '174',
        unit: 'hrs',
        percentage: 72,
        color: '#2c2d96'
      },
      {
        id: 'design',
        title: 'Product Design',
        icon: '🎨',
        value: '196',
        unit: 'hrs',
        percentage: 84,
        color: '#2c2d96'
      },
      {
        id: 'ops',
        title: 'Operations & HR',
        icon: '📊',
        value: '289',
        unit: 'hrs',
        percentage: 91,
        color: '#2c2d96'
      },
      {
        id: 'qa',
        title: 'QA & Testing',
        icon: '⚡',
        value: '201',
        unit: 'hrs',
        percentage: 65,
        color: '#2c2d96'
      }
    ];
  }, [tasks]);

  // Spending / Work Hours Bar Chart data for 7 days
  const weeklyAnalytics = [
    { day: 'Mon', electricity: 60, water: 120, gas: 140 },
    { day: 'Tue', electricity: 40, water: 175, gas: 230 },
    { day: 'Wed', electricity: 145, water: 110, gas: 50 },
    { day: 'Thu', electricity: 165, water: 180, gas: 95 },
    { day: 'Fri', electricity: 155, water: 115, gas: 245 },
    { day: 'Sat', electricity: 40, water: 250, gas: 60 },
    { day: 'Sun', electricity: 125, water: 75, gas: 40 }
  ];

  return (
    <div className="w-full max-w-[1360px] mx-auto transition-all duration-300">
      {/* Outer Floating Tablet Container with Soft Shadow */}
      <div className="bg-[#fbfbfe] dark:bg-[#0c0e1a] border border-slate-200/80 dark:border-white/10 rounded-[28px] lg:rounded-[36px] p-4 sm:p-6 lg:p-8 shadow-[0_25px_70px_-15px_rgba(43,44,152,0.12)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ======================================================== */}
          {/* LEFT & CENTER MAIN CANVAS (Cols 1 to 9)                   */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Top Bar: Minimalist Search + Date Display */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search Bar with clean rounded look */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[18px] pl-4 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b2c98]/20 focus:border-[#2b2c98] shadow-sm transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {/* Current Date Display */}
              <div className="text-xs font-bold font-sans text-slate-700 dark:text-slate-300 tracking-wide text-right">
                {formattedDate}
              </div>
            </div>

            {/* Row 1: 4 Department / Pod Metric Cards (Matching Living Room / Bedroom row) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {podCards.map((pod, idx) => {
                const isActive = activePodIndex === idx;

                if (isActive) {
                  // Active Highlighted Royal Blue/Indigo Card
                  return (
                    <motion.div
                      key={pod.id}
                      onClick={() => setActivePodIndex(idx)}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      className="cursor-pointer bg-[#2c2d96] text-white rounded-[22px] p-4 flex flex-col justify-between shadow-[0_16px_36px_-6px_rgba(44,45,150,0.45)] relative overflow-hidden group select-none min-h-[148px]"
                    >
                      {/* Top title & 3-dots */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-sans tracking-wide truncate pr-1">
                          {pod.title}
                        </span>
                        <MoreHorizontal className="w-4 h-4 opacity-75 group-hover:opacity-100 shrink-0" />
                      </div>

                      {/* Content: Dual Gauge & Value */}
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <ActivePodDualGauge percentage={pod.percentage} />
                        <div className="text-right">
                          <div className="text-2xl font-bold font-sans tracking-tight">
                            {pod.value}
                          </div>
                          <div className="text-[10px] text-white/70 font-mono">
                            {pod.unit}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // Inactive Clean White Rounded Card
                return (
                  <motion.div
                    key={pod.id}
                    onClick={() => setActivePodIndex(idx)}
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[22px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative select-none min-h-[148px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 tracking-wide truncate pr-1">
                        {pod.title}
                      </span>
                      <MoreHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3">
                      <div className="w-10 h-10 rounded-[14px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base">
                        {pod.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
                          {pod.value}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pod.unit}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Row 2: Middle Vitals & Center Productivity Dial */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Stack (Indoor Temperature & Humidity equivalent) */}
              <div className="md:col-span-6 flex flex-col justify-between gap-4">
                
                {/* Card 1: Shift Temperature / Punctuality */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[18px] bg-[#f8f9fd] dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-inner">
                      <Thermometer className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <span className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 block">
                        Shift Punctuality
                      </span>
                      <span className="text-2xl font-extrabold font-sans text-slate-900 dark:text-white tracking-tight">
                        +{indoorTemp}°C
                      </span>
                    </div>
                  </div>

                  {/* Vertical Level Gauge Meter on the right */}
                  <div className="flex items-center gap-1.5 h-12">
                    <div className="flex flex-col justify-between h-full py-1">
                      <span className="w-3 h-[2px] bg-slate-300 dark:bg-slate-700" />
                      <span className="w-2 h-[2px] bg-slate-300 dark:bg-slate-700" />
                      <span className="w-4 h-[2px] bg-slate-400 dark:bg-slate-600" />
                      <span className="w-2 h-[2px] bg-slate-300 dark:bg-slate-700" />
                      <span className="w-3 h-[2px] bg-slate-300 dark:bg-slate-700" />
                    </div>
                    <div className="w-2 h-10 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                      <div
                        className="w-full bg-[#2c2d96] rounded-full absolute bottom-0 transition-all duration-500"
                        style={{ height: `${(indoorTemp / 35) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Sprint Capacity & Humidity equivalent */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[18px] bg-[#f8f9fd] dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-inner">
                      <Droplets className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <span className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 block">
                        Sprint Capacity
                      </span>
                      <span className="text-2xl font-extrabold font-sans text-slate-900 dark:text-white tracking-tight">
                        {humidityLevel}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Stepper Chevrons */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-[#f8f9fd] dark:bg-slate-800 rounded-[14px] p-1.5 border border-slate-200/60 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setHumidityLevel(h => Math.min(100, h + 5))}
                      className="p-1 hover:text-[#2c2d96] text-slate-400 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHumidityLevel(h => Math.max(0, h - 5))}
                      className="p-1 hover:text-[#2c2d96] text-slate-400 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Widget: The Rainbow Circular Intensity Dial */}
              <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[24px] p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 tracking-wide">
                    Team Velocity Dial
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>

                {/* Arched Rainbow Dial SVG with Knob */}
                <div className="relative flex flex-col items-center justify-center my-2">
                  <svg viewBox="0 0 200 130" className="w-48 h-32 select-none overflow-visible">
                    <defs>
                      <linearGradient id="rainbowGaugeGrad" x1="0%" y1="100%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2c2d96" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="75%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>

                    {/* Background Track Arc */}
                    <path
                      d="M 25 110 A 75 75 0 0 1 175 110"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />

                    {/* Gradient Progress Arc */}
                    <path
                      d="M 25 110 A 75 75 0 0 1 175 110"
                      fill="none"
                      stroke="url(#rainbowGaugeGrad)"
                      strokeWidth="10"
                      strokeDasharray="235"
                      strokeDashoffset={235 - (velocityDialValue / 100) * 235}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />

                    {/* Draggable Knob Handle Indicator */}
                    {(() => {
                      const angle = Math.PI - (velocityDialValue / 100) * Math.PI;
                      const cx = 100 + 75 * Math.cos(angle);
                      const cy = 110 - 75 * Math.sin(angle);
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8"
                          fill="#ffffff"
                          stroke="#2c2d96"
                          strokeWidth="3.5"
                          className="drop-shadow-md transition-all duration-700 ease-out cursor-pointer"
                        />
                      );
                    })()}

                    {/* Arc Boundary Labels */}
                    <text x="20" y="126" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">0</text>
                    <text x="165" y="126" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">100</text>
                  </svg>

                  {/* Centered Dial Display */}
                  <div className="absolute top-14 flex flex-col items-center">
                    <span className="text-3xl font-extrabold font-sans text-slate-900 dark:text-white tracking-tight">
                      {velocityDialValue}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Optimal Productivity
                    </span>
                  </div>
                </div>

                {/* Subtitle / Controls */}
                <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setVelocityDialValue(v => Math.max(10, v - 10))}
                    className="text-[11px] font-mono text-slate-400 hover:text-slate-800"
                  >
                    - Step
                  </button>
                  <span className="text-[10px] text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setVelocityDialValue(v => Math.min(100, v + 10))}
                    className="text-[11px] font-mono text-slate-400 hover:text-slate-800"
                  >
                    + Step
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Spending / Work Hours Bar Chart Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[28px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              {/* Header with Legends and Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <h3 className="text-sm font-bold font-sans text-slate-900 dark:text-white tracking-wide">
                  Workforce Allocation
                </h3>

                {/* Legends & Filter */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2c2d96]" />
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Standard Shift</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Overtime</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Leave / Break</span>
                  </div>

                  {/* Dropdown pill */}
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[12px] text-xs font-mono font-semibold ml-auto sm:ml-2 flex items-center gap-1">
                    This Week ▾
                  </span>
                </div>
              </div>

              {/* Grouped Bar Chart Area */}
              <div className="relative h-44 sm:h-52 w-full pt-4">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
                  <div className="flex items-center border-b border-slate-100 dark:border-white/5 pb-0.5">
                    <span className="w-8">250h</span>
                  </div>
                  <div className="flex items-center border-b border-slate-100 dark:border-white/5 pb-0.5">
                    <span className="w-8">200h</span>
                  </div>
                  <div className="flex items-center border-b border-slate-100 dark:border-white/5 pb-0.5">
                    <span className="w-8">150h</span>
                  </div>
                  <div className="flex items-center border-b border-slate-100 dark:border-white/5 pb-0.5">
                    <span className="w-8">100h</span>
                  </div>
                  <div className="flex items-center border-b border-slate-100 dark:border-white/5 pb-0.5">
                    <span className="w-8">50h</span>
                  </div>
                  <div className="flex items-center pb-0.5">
                    <span className="w-8">0h</span>
                  </div>
                </div>

                {/* 7 Columns */}
                <div className="relative pl-9 pr-2 h-full flex items-end justify-between">
                  {weeklyAnalytics.map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-2 flex-1 group">
                      {/* 3 Grouped Bars */}
                      <div className="flex items-end gap-1 sm:gap-1.5 h-36 sm:h-40">
                        {/* Bar 1: Standard Shift (Indigo) */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.electricity / 260) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          title={`Standard: ${item.electricity}h`}
                          className="w-2 sm:w-2.5 bg-[#2c2d96] rounded-t-full hover:brightness-110 transition-all cursor-pointer"
                        />
                        {/* Bar 2: Overtime (Amber) */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.water / 260) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                          title={`Overtime: ${item.water}h`}
                          className="w-2 sm:w-2.5 bg-[#f59e0b] rounded-t-full hover:brightness-110 transition-all cursor-pointer"
                        />
                        {/* Bar 3: Leave/Break (Coral) */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.gas / 260) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                          title={`Leave: ${item.gas}h`}
                          className="w-2 sm:w-2.5 bg-[#ef4444] rounded-t-full hover:brightness-110 transition-all cursor-pointer"
                        />
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-sans font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDE PANEL (Profile + 2x2 Pastel Tiles + Art)      */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-[#f8f9fd] dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-5 sm:p-6 space-y-6 flex flex-col justify-between h-full">
              
              {/* Profile Header (Avatar + Icons + Welcome Name) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* Left Chat Icon */}
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:text-[#2c2d96] transition-colors relative"
                    title="Open Live Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
                  </button>

                  {/* Centered Avatar */}
                  <div className="relative">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-1" />
                  </div>

                  {/* Right Bell Icon */}
                  <button
                    type="button"
                    className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:text-[#2c2d96] transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>

                {/* Greeting Name */}
                <div className="text-center">
                  <h3 className="text-base font-extrabold font-sans text-slate-900 dark:text-white tracking-wide">
                    Welcome {currentUser.name.split(' ')[0]}!
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {currentUser.designation || 'Executive Delivery Lead'}
                  </p>
                </div>
              </div>

              {/* 2x2 Pastel Quick Operations Grid ("My Devices" in screenshot) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 tracking-wide">
                    Quick Operations
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Pastel Tile 1: Soft Peach (+ Onboard Employee) */}
                  <motion.button
                    type="button"
                    onClick={onOpenOnboardModal}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-3.5 rounded-[18px] bg-[#fee2e2] dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center select-none"
                  >
                    <div className="w-9 h-9 rounded-[12px] bg-rose-200/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shadow-inner">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold font-sans">
                      + Onboard
                    </span>
                  </motion.button>

                  {/* Pastel Tile 2: Soft Mint (Live Team Chat) */}
                  <motion.button
                    type="button"
                    onClick={onOpenChat}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-3.5 rounded-[18px] bg-[#dcfce7] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center select-none"
                  >
                    <div className="w-9 h-9 rounded-[12px] bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold font-sans">
                      Team Chat
                    </span>
                  </motion.button>

                  {/* Pastel Tile 3: Soft Amber (Manage Departments) */}
                  <motion.button
                    type="button"
                    onClick={onOpenDepartmentsModal}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-3.5 rounded-[18px] bg-[#fef3c7] dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center select-none"
                  >
                    <div className="w-9 h-9 rounded-[12px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-inner">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold font-sans">
                      Departments
                    </span>
                  </motion.button>

                  {/* Pastel Tile 4: Soft Sky Blue (Client PDF Reports) */}
                  <motion.button
                    type="button"
                    onClick={onOpenClientReportModal}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-3.5 rounded-[18px] bg-[#e0f2fe] dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center select-none"
                  >
                    <div className="w-9 h-9 rounded-[12px] bg-sky-200/80 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shadow-inner">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold font-sans">
                      PDF Reports
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Character Artwork (Armchair developer illustration) */}
              <div className="pt-2">
                <RelaxedWorkspaceIllustration />
                <div className="text-center mt-2">
                  <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 rounded-full border border-slate-200/60 dark:border-white/5">
                    ● All Systems Operational
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
