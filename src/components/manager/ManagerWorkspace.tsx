'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  LayoutGrid,
  Users,
  BriefcaseBusiness,
  CheckSquare,
  Activity,
  CalendarDays,
  FileText,
  Megaphone,
  MessageSquare,
  Settings2,
  Wallet,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownToLine,
  UserPlus,
  CheckCircle2,
  Clock3,
  CalendarCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  FolderKanban,
  Radio,
  Eye,
  EyeOff,
  Flame,
  Award,
  Star,
  Check,
  LucideIcon
} from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';

// Modals
import { RegisterEmployeeModal } from './RegisterEmployeeModal';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateTaskModal } from './CreateTaskModal';
import { PremiumProfileModal } from '../common/PremiumProfileModal';
import { NotificationInbox } from '../common/NotificationInbox';
import { ForcePasswordModal } from '../common/ForcePasswordModal';
import { ExitClearanceModal } from '../common/ExitClearanceModal';
import { FloatingChatWidget } from '../chat/FloatingChatWidget';

// Desk Components
import { TaskAllocationDesk } from './TaskAllocationDesk';
import { TeamLiveMonitor } from './TeamLiveMonitor';
import { RequestsApprovalDesk } from './RequestsApprovalDesk';
import { EODReportsDesk } from './EODReportsDesk';
import { AttendanceDesk } from '../hr/AttendanceDesk';
import { LeaveManagementDesk } from '../hr/LeaveManagementDesk';
import { PayrollDesk } from '../hr/PayrollDesk';
import { BroadcastDesk } from '../superadmin/BroadcastDesk';
import { CompanySetupDesk } from '../superadmin/CompanySetupDesk';
import { ChatDesk } from '../chat/ChatDesk';

export type V14PillTab = 'Overview' | 'Activity' | 'Manage' | 'Program' | 'Projects' | 'Reports';
export type V14DockTab = 'overview' | 'tasks' | 'telemetry' | 'messages' | 'people' | 'settings';

export function ManagerWorkspace() {
  const { currentUser, users, logout, updateUserStatus } = useAuth();
  const {
    tasks,
    projects,
    requests,
    attendance,
    reports,
    announcements,
    policy,
    getUserTodayAttendance,
    clockIn,
    clockOut
  } = useAppData();
  const { notifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { totalUnreadChatCount } = useChat();
  const reduced = useReducedMotion();

  // Startup Loading Animation State (Simulates V14 Shimmer Transition from Video)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Navigation State
  const [activePill, setActivePill] = useState<V14PillTab>('Overview');
  const [activeDock, setActiveDock] = useState<V14DockTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [exitClearanceOpen, setExitClearanceOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSensitiveValues, setShowSensitiveValues] = useState(true);

  // Animated Points Counter for Program View (from Video Frame 00:04: 11,641 -> 12,480)
  const [programPoints, setProgramPoints] = useState(11641);
  useEffect(() => {
    if (activePill === 'Program') {
      const interval = setInterval(() => {
        setProgramPoints(prev => (prev < 12480 ? Math.min(12480, prev + 84) : 12480));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [activePill]);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Filter States
  const [memberDeptFilter, setMemberDeptFilter] = useState('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const dialogRef = useRef<HTMLElement>(null);

  const staff = useMemo(() => users.filter(u => u.role !== 'super_admin'), [users]);
  const activeStaff = useMemo(() => staff.filter(u => u.status === 'online'), [staff]);
  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const openTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);

  const todayStr = new Date().toISOString().split('T')[0];
  const myRecord = getUserTodayAttendance(currentUser.id);

  const todayAttendance = useMemo(
    () => attendance.filter(a => a.date === todayStr && staff.some(s => s.id === a.userId)),
    [attendance, todayStr, staff]
  );
  const presentCount = useMemo(
    () =>
      new Set(
        todayAttendance
          .filter(a => a.clockIn && !['absent', 'leave', 'holiday'].includes(a.status))
          .map(a => a.userId)
      ).size,
    [todayAttendance]
  );
  const attendanceRate = staff.length ? Math.round((presentCount / staff.length) * 100) : 0;
  const onTimeCount = useMemo(
    () => todayAttendance.filter(a => a.clockIn && !a.isLate && a.status === 'present').length,
    [todayAttendance]
  );

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        n =>
          !n.read &&
          (!n.targetUserId || n.targetUserId === currentUser.id) &&
          (!n.targetRole || n.targetRole === 'manager_hr' || n.targetRole === 'super_admin' || n.targetRole === 'hr')
      ).length,
    [notifications, currentUser.id]
  );

  // Total calculated budget
  const totalBudget = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.budget || 250000), 0);
  }, [projects]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Top Center Pills
  const PILL_TABS: V14PillTab[] = ['Overview', 'Activity', 'Manage', 'Program', 'Projects', 'Reports'];

  // Left Dock Navigation
  const DOCK_ITEMS: { id: V14DockTab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare, badge: openTasks.length },
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity, badge: activeStaff.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: totalUnreadChatCount },
    { id: 'people', label: 'Team Directory', icon: Users, badge: staff.length },
    { id: 'settings', label: 'Office Setup', icon: Settings2 }
  ];

  // Global Search
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();

    const pillHits = PILL_TABS.filter(t => t.toLowerCase().includes(q)).map(t => ({
      label: `Switch to ${t}`,
      action: () => {
        setActivePill(t);
        setActiveDock('overview');
      }
    }));

    const memberHits = staff
      .filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q))
      .slice(0, 3)
      .map(u => ({
        label: `Staff: ${u.name} (${u.department})`,
        action: () => {
          setActivePill('Manage');
          setActiveDock('people');
        }
      }));

    const projectHits = projects
      .filter(p => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({
        label: `Project: ${p.name}`,
        action: () => {
          setActivePill('Projects');
          setActiveDock('overview');
        }
      }));

    return [...pillHits, ...memberHits, ...projectHits].slice(0, 6);
  }, [globalSearchQuery, staff, projects]);

  const handleSignOutRequest = () => {
    const hasActiveShift = myRecord?.clockIn && !myRecord.clockOut;
    const hasPendingReview = pendingRequests.length > 0;
    if (hasActiveShift || hasPendingReview) {
      setExitClearanceOpen(true);
      return;
    }
    updateUserStatus('offline');
    logout();
  };

  const handleExportCSV = () => {
    const escape = (val: unknown) => `"${(/^[=+\-@]/.test(String(val ?? '')) ? "'" : '') + String(val ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['Project Name', 'Client', 'Department', 'Status', 'Tasks Total', 'Completed', 'Deadline'],
      ...projects.map(p => {
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const comp = pTasks.filter(t => t.status === 'completed').length;
        return [p.name, p.client, p.department || '', p.status, pTasks.length, comp, p.deadline || ''];
      })
    ];
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows.map(r => r.map(escape).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8;'
      })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickslogx-v14-report-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Re-trigger skeleton shimmer simulation
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 550);
  };

  // =========================================================
  // RENDER MAIN VIEW
  // =========================================================
  const renderMainContent = () => {
    // 1. In-App Chat Desk (From Video Frame 00:02)
    if (activeDock === 'messages') {
      return (
        <div className="v14-chat-pane">
          <ChatDesk />
        </div>
      );
    }

    // 2. Tasks Board Dock Selection
    if (activeDock === 'tasks') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sprint Kanban & Tasks Allocation</h2>
            <button className="v14-pill-btn-dark" onClick={() => setShowTaskModal(true)}>
              <Plus size={14} /> Assign Task
            </button>
          </div>
          <TaskAllocationDesk />
        </div>
      );
    }

    // 3. Live Telemetry Dock Selection
    if (activeDock === 'telemetry') {
      return <TeamLiveMonitor />;
    }

    // 4. Office Settings Dock Selection
    if (activeDock === 'settings') {
      return <CompanySetupDesk key="policies" initialTab="policies" compactHeader />;
    }

    // 5. Team Directory Dock Selection
    if (activeDock === 'people') {
      return renderTeamDirectoryView();
    }

    // Top Center Pill Views
    switch (activePill) {
      case 'Overview':
        return renderV14Overview();
      case 'Activity':
        return <TeamLiveMonitor />;
      case 'Manage':
        return renderTeamDirectoryView();
      case 'Program':
        return renderV14ProgramRewardsView();
      case 'Projects':
        return renderProjectsPortfolioView();
      case 'Reports':
        return <EODReportsDesk />;
      default:
        return renderV14Overview();
    }
  };

  // =========================================================
  // 1. V14 SIGNATURE OVERVIEW (FRAME 00:01)
  // =========================================================
  const renderV14Overview = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          {/* Skeleton Top Greeting */}
          <div className="v14-skeleton h-12 w-80 rounded-xl" />

          {/* Skeleton 4 Cards Grid */}
          <div className="v14-cards-grid">
            <div className="v14-skeleton v14-skeleton-card" />
            <div className="v14-skeleton v14-skeleton-card bg-orange-100 dark:bg-orange-950/20" />
            <div className="v14-skeleton v14-skeleton-card" />
            <div className="v14-skeleton v14-skeleton-card" />
          </div>

          {/* Skeleton Middle Row */}
          <div className="v14-layout-row">
            <div className="v14-skeleton h-80 rounded-2xl" />
            <div className="v14-skeleton h-80 rounded-2xl" />
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Top Greeting Header */}
        <div className="v14-greeting-row">
          <div>
            <h1>
              {greeting}, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p>Here is what is happening across your team, deliverables, and projects today.</p>
          </div>

          {/* Action Buttons */}
          <div className="mp-hero-actions">
            <button className="mp-btn-primary" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={14} /> Register Employee
            </button>
            <button className="mp-btn-primary mp-btn-gold" onClick={() => setShowProjectModal(true)}>
              <BriefcaseBusiness size={14} /> New Project
            </button>
            <button className="mp-btn-secondary" onClick={() => setShowTaskModal(true)}>
              <CheckSquare size={14} /> Assign Task
            </button>
            <button className="v14-icon-btn" title="Refresh data & animation" onClick={handleRefresh}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Top 4 Cards Grid (Matching Frame 00:01) */}
        <div className="v14-cards-grid">
          {/* Card 1: Main Balance / Project Value Card */}
          <motion.div whileHover={{ y: -4 }} className="v14-card">
            <div className="v14-card-head">
              <span className="v14-card-label">Total Portfolio Budget</span>
              <button
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setShowSensitiveValues(!showSensitiveValues)}
                title="Toggle budget visibility"
              >
                {showSensitiveValues ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>

            <div className="v14-card-number">
              {showSensitiveValues ? `$${totalBudget.toLocaleString()}` : '••••••••'}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 inline-flex items-center gap-0.5">
                <ArrowUpRight size={12} /> +12.4%
              </span>
            </div>

            <div className="v14-pill-actions">
              <button className="v14-pill-btn-dark" onClick={() => setShowProjectModal(true)}>
                <Plus size={12} /> New Project
              </button>
              <button className="v14-pill-btn-light" onClick={() => setShowTaskModal(true)}>
                Assign Task
              </button>
            </div>
          </motion.div>

          {/* Card 2: The Signature Coral/Orange Gradient Card */}
          <motion.div whileHover={{ y: -4 }} className="v14-card v14-card-coral">
            <div className="v14-card-head">
              <span className="v14-card-label">Sprint Output</span>
              <span className="v14-card-coral-badge">
                <Sparkles size={11} /> +18.2%
              </span>
            </div>

            <div className="v14-card-number">
              849 <small className="text-white/80">tasks</small>
            </div>

            <p className="text-xs text-white/80 m-0">
              {completedTasks.length} sprint deliverables closed this cycle
            </p>
          </motion.div>

          {/* Card 3: Team Attendance Today */}
          <motion.div whileHover={{ y: -4 }} className="v14-card">
            <div className="v14-card-head">
              <span className="v14-card-label">Team Presence</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                {attendanceRate}% rate
              </span>
            </div>

            <div className="v14-card-number">
              {presentCount} <small>/ {staff.length} staff</small>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{onTimeCount} on time</span>
              <span className="text-amber-600">{todayAttendance.filter(a => a.isLate).length} late</span>
            </div>
          </motion.div>

          {/* Card 4: Weekly Output Mini Bar Chart Card */}
          <motion.div whileHover={{ y: -4 }} className="v14-card">
            <div className="v14-card-head">
              <span className="v14-card-label">Activity Trend</span>
              <span className="text-[11px] font-semibold text-slate-500">7 days</span>
            </div>

            <div className="v14-mini-bars">
              {[45, 60, 75, 40, 90, 80, 95].map((val, idx) => (
                <div key={idx} className={`v14-mini-bar-col ${idx === 4 ? 'is-highlight' : ''}`}>
                  <div className="v14-mini-bar-fill" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Today</span>
            </div>
          </motion.div>
        </div>

        {/* Middle Layout Row: Monthly Capacity & Recent Activities Table */}
        <div className="v14-layout-row">
          {/* Left: Monthly Spending & Allocation Gauge */}
          <div className="v14-table-card flex flex-col justify-between">
            <div>
              <div className="v14-table-header">
                <h3>Monthly Squad Capacity</h3>
                <span className="text-xs text-slate-400 font-semibold">{openTasks.length} active tasks</span>
              </div>

              {/* Capacity Donut / Progress */}
              <div className="flex flex-col items-center justify-center my-4">
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border-8 border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">78%</span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Allocated</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Engineering Squad</span>
                  <span className="font-semibold">62% load</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#244c78] h-full rounded-full" style={{ width: '62%' }} />
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-300 pt-2">
                  <span>Product & Design</span>
                  <span className="font-semibold">84% load</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ea3822] h-full rounded-full" style={{ width: '84%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Need to balance workload?</span>
              <button
                className="text-[#ea3822] font-semibold hover:underline flex items-center gap-1"
                onClick={() => setActiveDock('tasks')}
              >
                Reassign Tasks <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Right: Recent Activities / Deliverables Table (From Video Frame 00:01) */}
          <div className="v14-table-card">
            <div className="v14-table-header">
              <h3>Recent Deliverables & Activities</h3>
              <button onClick={() => setActiveDock('tasks')}>
                View All <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="v14-table">
                <thead>
                  <tr>
                    <th>NAME / TASK</th>
                    <th>PROJECT</th>
                    <th>ASSIGNEE</th>
                    <th>DUE DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {openTasks.slice(0, 5).map(task => (
                    <tr key={task.id}>
                      <td>
                        <strong className="font-bold text-slate-950 dark:text-white">{task.title}</strong>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-xs">{task.projectName || 'General'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-bold flex items-center justify-center">
                            {(task.assignedToName || 'U').charAt(0)}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{task.assignedToName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{task.deadline}</span>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : task.status === 'in_progress'
                              ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                              : task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!openTasks.length && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No recent task activities. Click "+ Assign Task" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // =========================================================
  // 2. V14 REWARDS / PROGRAM VIEW (FRAMES 00:03 - 00:05)
  // =========================================================
  const renderV14ProgramRewardsView = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="v14-greeting-row">
          <div>
            <h1>Performance & Rewards Program</h1>
            <p>Team recognition milestones, deliverable bounties, and leadership benefits.</p>
          </div>
        </div>

        {/* Big Orange/Coral Program Hero Card (Matching Frame 00:04) */}
        <div className="v14-program-grid">
          <div className="v14-program-hero">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm inline-flex items-center gap-1.5">
                  <Star size={13} /> Elite Tier Leadership
                </span>
                <span className="text-xs text-white/80">Active Season Q4</span>
              </div>

              <div className="v14-program-score">
                {programPoints.toLocaleString()} <small>points</small>
              </div>

              <p className="text-xs text-white/90 max-w-md">
                Earned via on-time sprint completions, high customer feedback scores, and zero critical deployment bugs.
              </p>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
              <span>Next Reward Tier: Diamond (15,000 pts)</span>
              <span className="font-bold">83% completed</span>
            </div>
          </div>

          {/* Tier Benefits Checklist */}
          <div className="v14-table-card flex flex-col justify-between">
            <div>
              <div className="v14-table-header">
                <h3>Tier Benefits & Perks</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>24/7 Priority Squad Resource Allocation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>Executive Cloud Sandbox & GPU Budget</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>Direct Annual Bonus Multiplier (1.25x)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>Flexible WFH & Remote Stipend Quota</span>
                </li>
              </ul>
            </div>

            <button className="v14-pill-btn-dark w-full justify-center mt-4">
              Explore Reward Marketplace
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // =========================================================
  // 3. TEAM DIRECTORY / MANAGE VIEW
  // =========================================================
  const renderTeamDirectoryView = () => {
    const departments = Array.from(new Set(staff.map(u => u.department || 'General')));
    const filteredStaff = staff.filter(u => {
      const matchDept = memberDeptFilter === 'all' || u.department === memberDeptFilter;
      const matchQuery =
        !memberSearchQuery.trim() ||
        u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        u.designation.toLowerCase().includes(memberSearchQuery.toLowerCase());
      return matchDept && matchQuery;
    });

    return (
      <div className="space-y-6">
        <div className="v14-greeting-row">
          <div>
            <h1>Team & Employees Directory</h1>
            <p>Manage staff accounts, department roles, and track active statuses.</p>
          </div>

          <div className="mp-hero-actions">
            <button className="mp-btn-primary" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={14} /> Register Employee
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#131924] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="v14-search-pill w-full max-w-sm">
              <Search size={15} />
              <input
                placeholder="Search staff by name, email, or role..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="mp-select max-w-[180px]"
              value={memberDeptFilter}
              onChange={e => setMemberDeptFilter(e.target.value)}
            >
              <option value="all">All Departments ({staff.length})</option>
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(member => {
            const memberTasks = tasks.filter(t => t.assignedToId === member.id);
            const openCount = memberTasks.filter(t => t.status !== 'completed').length;

            return (
              <motion.div whileHover={{ y: -3 }} key={member.id} className="v14-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </strong>
                      <span className="text-xs text-slate-500">{member.designation || member.role}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      member.status === 'online'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : member.status === 'break'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="my-3 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{member.department}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Official Email:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px]">{member.email}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{openCount} active tasks</span>
                  <button
                    className="text-[#ea3822] font-semibold hover:underline flex items-center gap-1"
                    onClick={() => {
                      setActiveDock('tasks');
                    }}
                  >
                    Assign Task <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================
  // 4. PROJECTS PORTFOLIO VIEW
  // =========================================================
  const renderProjectsPortfolioView = () => {
    const filtered = projects.filter(p => projectFilter === 'all' || p.status === projectFilter);

    return (
      <div className="space-y-6">
        <div className="v14-greeting-row">
          <div>
            <h1>Project Portfolio & Deliverables</h1>
            <p>Track team roadmaps, milestone deadlines, and budget allocations.</p>
          </div>

          <div className="mp-hero-actions">
            <button className="mp-btn-secondary" onClick={handleExportCSV}>
              <ArrowDownToLine size={14} /> Export CSV
            </button>
            <button className="mp-btn-primary" onClick={() => setShowProjectModal(true)}>
              <BriefcaseBusiness size={14} /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(proj => {
            const pTasks = tasks.filter(t => t.projectId === proj.id);
            const comp = pTasks.filter(t => t.status === 'completed').length;
            const percent = pTasks.length ? Math.round((comp / pTasks.length) * 100) : 0;

            return (
              <motion.div whileHover={{ y: -3 }} key={proj.id} className="v14-card">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {proj.department || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        proj.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{proj.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Client: {proj.client}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Deliverables ({comp}/{pTasks.length})</span>
                    <strong className="text-slate-700 dark:text-slate-300">{percent}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#ea3822] h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Due: {proj.deadline || 'Ongoing'}</span>
                    <button
                      className="text-xs font-semibold text-[#ea3822] hover:underline flex items-center gap-1"
                      onClick={() => setActiveDock('tasks')}
                    >
                      Kanban Board <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="v14-dashboard" data-theme={theme}>
      {/* 1. SLIM LEFT VERTICAL ICON DOCK */}
      <aside className={`v14-dock ${mobileMenuOpen ? 'is-open' : ''}`}>
        {/* Top Flame/Q Brand Logo */}
        <div
          className="v14-dock-logo"
          title="quickslogx Portal"
          onClick={() => {
            setActivePill('Overview');
            setActiveDock('overview');
          }}
        >
          Q
        </div>

        {/* Vertical Icon Stack */}
        <nav className="v14-dock-nav">
          {DOCK_ITEMS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`v14-dock-btn ${activeDock === id ? 'is-active' : ''}`}
              title={label}
              onClick={() => {
                setActiveDock(id);
                setMobileMenuOpen(false);
              }}
            >
              <Icon size={19} />
              {badge !== undefined && badge > 0 && <span className="v14-dock-badge" />}
            </button>
          ))}
        </nav>

        {/* Dock Bottom Actions */}
        <div className="v14-dock-bottom">
          <button
            className="v14-dock-btn"
            title={myRecord?.clockIn ? 'Punch Out' : 'Punch In'}
            onClick={() => (myRecord?.clockIn ? clockOut(currentUser.id) : clockIn(currentUser.id))}
          >
            <CalendarDays size={18} />
          </button>

          <button className="v14-dock-btn" title="Sign Out" onClick={handleSignOutRequest}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN BODY */}
      <div className="v14-body">
        {/* Topbar with Center Sliding Pills */}
        <header className="v14-topbar">
          {/* Left Brand Title */}
          <div
            className="v14-brand-pill"
            onClick={() => {
              setActivePill('Overview');
              setActiveDock('overview');
            }}
          >
            <div className="v14-brand-symbol">Q</div>
            <span className="v14-brand-name">quickslogx</span>
          </div>

          {/* Center Sliding Horizontal Navigation Pills (The V14 Video Signature) */}
          <nav className="v14-pills-container">
            {PILL_TABS.map(tab => {
              const isActive = activePill === tab && activeDock === 'overview';
              return (
                <button
                  key={tab}
                  className={`v14-pill-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    setActivePill(tab);
                    setActiveDock('overview');
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="v14-pill-active"
                      className="v14-pill-active-bg"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="v14-pill-text">{tab}</span>
                </button>
              );
            })}
          </nav>

          {/* Topbar Right Actions */}
          <div className="v14-topbar-actions">
            {/* Search Pill */}
            <div className="v14-search-pill hidden sm:flex">
              <Search size={14} />
              <input
                placeholder="Search..."
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
              />
              <span className="v14-kbd">⌘K</span>
            </div>

            {/* Theme Toggle */}
            <button className="v14-icon-btn" title="Toggle theme" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification Bell with Coral Dot */}
            <button
              className="v14-icon-btn"
              title="Notifications"
              onClick={() => setInboxOpen(true)}
            >
              <Bell size={16} />
              {unreadNotifications > 0 && <span className="v14-coral-dot" />}
            </button>

            {/* User Profile Chip ("Code XR" style) */}
            <div className="v14-profile-chip" onClick={() => setProfileOpen(true)}>
              <div className="v14-profile-avatar">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} />
                ) : (
                  currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                )}
              </div>
              <span className="v14-profile-name hidden md:inline">
                {currentUser.name}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="v14-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activePill}-${activeDock}`}
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notifications Drawer */}
      {inboxOpen && (
        <>
          <button className="mp-modal-backdrop" onClick={() => setInboxOpen(false)} />
          <section
            ref={dialogRef}
            className="at-drawer brand-notification-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="at-drawer-head">
              <span className="at-section-eyebrow">WORKSPACE ALERTS</span>
              <button className="at-icon-button" onClick={() => setInboxOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <h2>Notifications</h2>
            <NotificationInbox
              onOpenProfile={() => {
                setInboxOpen(false);
                setProfileOpen(true);
              }}
              onNavigate={sec => {
                setInboxOpen(false);
                if (sec === 'Requests') {
                  setActivePill('Reports');
                  setActiveDock('overview');
                } else if (sec === 'Team chat' || sec === 'People') {
                  setActiveDock('messages');
                } else {
                  setActiveDock('tasks');
                }
              }}
            />
          </section>
        </>
      )}

      {/* Core Creation Modals */}
      <RegisterEmployeeModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          setActivePill('Manage');
          setActiveDock('people');
        }}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={() => {
          setActivePill('Projects');
          setActiveDock('overview');
        }}
      />

      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={() => {
          setActiveDock('tasks');
        }}
      />

      {/* Profile & Security Modals */}
      <div className="at-live-desk">
        <PremiumProfileModal isOpen={profileOpen} onClose={closeProfile} />
        <ForcePasswordModal />
        <ExitClearanceModal
          isOpen={exitClearanceOpen}
          onClose={() => setExitClearanceOpen(false)}
          onConfirmLogout={() => {
            updateUserStatus('offline');
            logout();
          }}
        />
      </div>

      {/* Floating Chat Widget */}
      <div className="at-live-chat">
        <FloatingChatWidget />
      </div>
    </div>
  );
}
