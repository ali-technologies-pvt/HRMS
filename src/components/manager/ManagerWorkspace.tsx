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
  Search,
  Bell,
  ChevronDown,
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
  Eye,
  EyeOff,
  Flame,
  Award,
  Star,
  Check,
  Send,
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

export type V14PillTab = 'Overview' | 'Tasks' | 'Projects' | 'Team' | 'Activity' | 'Reports';
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
  const { totalUnreadChatCount, openOrCreateDirectChat } = useChat();
  const reduced = useReducedMotion();

  // Startup Loading Animation State (Simulates V14 Shimmer Transition from Video)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
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
  const [hoveredChartDay, setHoveredChartDay] = useState<number | null>(null);

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
  const lateCount = useMemo(
    () => todayAttendance.filter(a => a.clockIn && a.isLate).length,
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

  // Total calculated budget from real active projects
  const totalBudget = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  }, [projects]);

  // Real Sprint Velocity Percentage
  const velocityRate = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [tasks, completedTasks]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Top Center Pills strictly matching manager duties
  const PILL_TABS: V14PillTab[] = ['Overview', 'Tasks', 'Projects', 'Team', 'Activity', 'Reports'];

  // Left Dock Navigation strictly relevant to manager
  const DOCK_ITEMS: { id: V14DockTab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare, badge: openTasks.length },
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity, badge: activeStaff.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: totalUnreadChatCount },
    { id: 'people', label: 'Team Directory', icon: Users, badge: staff.length },
    { id: 'settings', label: 'Office Setup', icon: Settings2 }
  ];

  // Dynamic 7-Day Attendance and Sprint Deliverables Trends from Real Data
  const sevenDaysData = useMemo(() => {
    const days: {
      dateStr: string;
      label: string;
      shortDate: string;
      presentCount: number;
      completedCount: number;
    }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : dayNames[d.getDay()];
      const shortDate = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;

      // Count real presence for that specific date
      const dayAttendance = attendance.filter(
        a => a.date === dateStr && a.clockIn && !['absent', 'leave', 'holiday'].includes(a.status)
      );
      const dayPresent = new Set(dayAttendance.map(a => a.userId)).size;

      // Count deliverables completed on or up to this day
      const dayCompleted = tasks.filter(
        t => t.status === 'completed' && t.completedAt && t.completedAt.split('T')[0] <= dateStr
      ).length;

      days.push({
        dateStr,
        label,
        shortDate,
        presentCount: dayPresent,
        completedCount: dayCompleted
      });
    }
    return days;
  }, [attendance, tasks]);

  // Dynamic Department Workload & Squad Capacity computation
  const departmentStats = useMemo(() => {
    const depts =
      policy?.departments && policy.departments.length > 0
        ? policy.departments.filter(d => d !== 'Executive Administration')
        : Array.from(new Set(staff.map(u => u.department).filter(Boolean)));

    const totalOpen = openTasks.length || 1;

    return depts.map(dept => {
      const deptStaff = staff.filter(u => u.department === dept);
      const deptTasks = openTasks.filter(t => {
        const assigned = staff.find(u => u.id === t.assignedToId);
        return assigned?.department === dept;
      });

      const loadPercentage = Math.round((deptTasks.length / totalOpen) * 100);
      return {
        department: dept,
        staffCount: deptStaff.length,
        taskCount: deptTasks.length,
        loadPercentage
      };
    });
  }, [staff, openTasks, policy]);

  const overallCapacityRate = useMemo(() => {
    if (!staff.length) return 0;
    const staffWithTasks = staff.filter(u => openTasks.some(t => t.assignedToId === u.id)).length;
    return Math.round((staffWithTasks / staff.length) * 100);
  }, [staff, openTasks]);

  // Global Search
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();

    const pillHits = PILL_TABS.filter(t => t.toLowerCase().includes(q)).map(t => ({
      label: `Switch to ${t}`,
      action: () => {
        handleNavigatePill(t);
      }
    }));

    const memberHits = staff
      .filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q))
      .slice(0, 3)
      .map(u => ({
        label: `Staff: ${u.name} (${u.department})`,
        action: () => {
          setActivePill('Team');
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

  const handleNavigatePill = (tab: V14PillTab) => {
    setActivePill(tab);
    if (tab === 'Overview') setActiveDock('overview');
    else if (tab === 'Tasks') setActiveDock('tasks');
    else if (tab === 'Activity') setActiveDock('telemetry');
    else if (tab === 'Team') setActiveDock('people');
    else setActiveDock('overview');
  };

  const handleNavigateDock = (dock: V14DockTab) => {
    setActiveDock(dock);
    if (dock === 'overview') setActivePill('Overview');
    else if (dock === 'tasks') setActivePill('Tasks');
    else if (dock === 'telemetry') setActivePill('Activity');
    else if (dock === 'people') setActivePill('Team');
  };

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

  const handleConfirmSignOut = () => {
    updateUserStatus('offline');
    logout();
    setExitClearanceOpen(false);
  };

  const handleExportCSV = () => {
    const escape = (val: unknown) =>
      `"${(/^[=+\-@]/.test(String(val ?? '')) ? "'" : '') + String(val ?? '').replaceAll('"', '""')}"`;
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
    a.download = `quickslogx-manager-report-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Re-trigger skeleton shimmer simulation
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // 1-Click Launch Chat with Team Member
  const handleDirectMessage = (memberId: string) => {
    openOrCreateDirectChat(memberId);
    setActiveDock('messages');
  };

  // =========================================================
  // RENDER MAIN VIEW
  // =========================================================
  const renderMainContent = () => {
    if (activeDock === 'messages') {
      return (
        <div className="v14-chat-pane">
          <ChatDesk />
        </div>
      );
    }

    if (activeDock === 'settings') {
      return <CompanySetupDesk key="policies" initialTab="policies" compactHeader />;
    }

    if (activePill === 'Tasks' || activeDock === 'tasks') {
      return <TaskAllocationDesk />;
    }

    if (activePill === 'Activity' || activeDock === 'telemetry') {
      return <TeamLiveMonitor />;
    }

    if (activePill === 'Team' || activeDock === 'people') {
      return renderTeamDirectoryView();
    }

    if (activePill === 'Projects') {
      return renderProjectsPortfolioView();
    }

    if (activePill === 'Reports') {
      return <EODReportsDesk />;
    }

    return renderV14Overview();
  };

  // =========================================================
  // 1. V14 EXECUTIVE OVERVIEW (100% REAL DATA & PREMIUM ANIMATIONS)
  // =========================================================
  const renderV14Overview = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="v14-skeleton h-12 w-80 rounded-xl" />
          <div className="v14-cards-grid">
            <div className="v14-skeleton v14-skeleton-card" />
            <div className="v14-skeleton v14-skeleton-card bg-orange-100 dark:bg-orange-950/20" />
            <div className="v14-skeleton v14-skeleton-card" />
            <div className="v14-skeleton v14-skeleton-card" />
          </div>
          <div className="v14-layout-row">
            <div className="v14-skeleton h-80 rounded-2xl" />
            <div className="v14-skeleton h-80 rounded-2xl" />
          </div>
        </div>
      );
    }

    // SVG Area Chart coordinates calculation
    const maxVal = Math.max(staff.length, 4);
    const chartPoints = sevenDaysData.map((d, idx) => {
      const x = 40 + idx * ((500 - 80) / 6);
      const y = 145 - (d.presentCount / maxVal) * 105;
      return { x, y, ...d };
    });

    const areaPathD =
      chartPoints.length > 0
        ? `M ${chartPoints[0].x} ${chartPoints[0].y} ` +
          chartPoints
            .slice(1)
            .map(
              (p, i) =>
                `C ${chartPoints[i].x + 25} ${chartPoints[i].y}, ${p.x - 25} ${p.y}, ${p.x} ${p.y}`
            )
            .join(' ') +
          ` L ${chartPoints[chartPoints.length - 1].x} 155 L ${chartPoints[0].x} 155 Z`
        : '';

    const linePathD =
      chartPoints.length > 0
        ? `M ${chartPoints[0].x} ${chartPoints[0].y} ` +
          chartPoints
            .slice(1)
            .map(
              (p, i) =>
                `C ${chartPoints[i].x + 25} ${chartPoints[i].y}, ${p.x - 25} ${p.y}, ${p.x} ${p.y}`
            )
            .join(' ')
        : '';

    // Circumference for 48px radius donut gauge
    const donutRadius = 48;
    const donutCircumference = 2 * Math.PI * donutRadius;
    const donutOffset =
      donutCircumference - (donutCircumference * Math.min(overallCapacityRate, 100)) / 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        {/* Top Greeting Header */}
        <div className="v14-greeting-row">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {greeting}, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Real-time telemetry, squad deliverables, and sprint roadmaps across your departments.
            </p>
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
            <button className="v14-icon-btn" title="Refresh data & telemetry" onClick={handleRefresh}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards Grid strictly matching Manager Sidebar & Tabs */}
        <div className="v14-cards-grid">
          {/* Card 1: Projects & Roadmap (Reflects Projects Tab) */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            className="v14-card cursor-pointer"
            onClick={() => handleNavigatePill('Projects')}
          >
            <div className="v14-card-head">
              <span className="v14-card-label font-bold text-slate-800 dark:text-slate-200">
                Active Projects Budget
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  setShowSensitiveValues(!showSensitiveValues);
                }}
                title="Toggle budget visibility"
              >
                {showSensitiveValues ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>

            <div className="v14-card-number text-slate-950 dark:text-white font-extrabold">
              {showSensitiveValues ? `$${totalBudget.toLocaleString()}` : '••••••••'}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 inline-flex items-center gap-0.5">
                <BriefcaseBusiness size={11} /> {activeProjects.length} active
              </span>
            </div>

            <div className="v14-pill-actions">
              <button
                type="button"
                className="v14-pill-btn-dark"
                onClick={e => {
                  e.stopPropagation();
                  setShowProjectModal(true);
                }}
              >
                <Plus size={12} /> New Project
              </button>
              <button
                type="button"
                className="v14-pill-btn-light"
                onClick={e => {
                  e.stopPropagation();
                  setShowTaskModal(true);
                }}
              >
                Assign Task
              </button>
            </div>
          </motion.div>

          {/* Card 2: Sprint Velocity & Output (Signature Coral Card - Reflects Tasks Tab) */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            className="v14-card v14-card-coral cursor-pointer"
            onClick={() => handleNavigatePill('Tasks')}
          >
            <div className="v14-card-head">
              <span className="v14-card-label font-bold text-white/95">Sprint Output</span>
              <span className="v14-card-coral-badge font-bold">
                <Sparkles size={11} /> {velocityRate}% velocity
              </span>
            </div>

            <div className="v14-card-number text-white font-extrabold">
              {tasks.length} <small className="text-white/90 font-medium">tasks</small>
            </div>

            <p className="text-xs text-white/95 m-0 font-medium flex items-center justify-between">
              <span>{completedTasks.length} deliverables completed</span>
              <span className="inline-flex items-center gap-1 font-bold underline underline-offset-2">
                Board <ArrowRight size={12} />
              </span>
            </p>
          </motion.div>

          {/* Card 3: Team Presence Today (Reflects Activity / Telemetry Tab) */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            className="v14-card cursor-pointer"
            onClick={() => handleNavigatePill('Activity')}
          >
            <div className="v14-card-head">
              <span className="v14-card-label font-bold text-slate-800 dark:text-slate-200">
                Team Presence
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                {attendanceRate}% rate
              </span>
            </div>

            <div className="v14-card-number text-slate-950 dark:text-white font-extrabold">
              {presentCount} <small className="text-slate-500 font-semibold">/ {staff.length} staff</small>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold pt-1">
              <span>{onTimeCount} on time</span>
              <span className={lateCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                {lateCount} late
              </span>
            </div>
          </motion.div>

          {/* Card 4: Operational Approvals & Staff Requests (Reflects Team / Manage Tab) */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            className="v14-card cursor-pointer"
            onClick={() => handleNavigateDock('people')}
          >
            <div className="v14-card-head">
              <span className="v14-card-label font-bold text-slate-800 dark:text-slate-200">
                Staff Approvals
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  pendingRequests.length > 0
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                }`}
              >
                {pendingRequests.length > 0 ? 'Action Needed' : 'All Clear'}
              </span>
            </div>

            <div className="v14-card-number text-slate-950 dark:text-white font-extrabold">
              {pendingRequests.length} <small className="text-slate-500 font-semibold">pending</small>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold pt-1">
              <span>
                {requests.filter(r => r.type === 'leave' && r.status === 'pending').length} Leave /{' '}
                {requests.filter(r => r.type === 'wfh' && r.status === 'pending').length} WFH
              </span>
              <span className="text-[#ea3822] font-bold flex items-center gap-0.5">
                Review <ArrowRight size={11} />
              </span>
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Real Interactive Visualizations (7-Day Trend + Squad Capacity Gauge) */}
        <div className="v14-layout-row">
          {/* Graph 1: 7-Day Team Attendance & Sprint Output Trends */}
          <div className="v14-graph-card">
            <div className="v14-table-header">
              <div>
                <h3 className="text-slate-950 dark:text-white font-bold text-base flex items-center gap-2">
                  <Activity size={17} className="text-[#ea3822]" /> 7-Day Team Telemetry & Attendance
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Dynamic daily clock-ins and deliverable pace computed from verified logs
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea3822]" /> Presence
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Max Capacity
                </span>
              </div>
            </div>

            {/* Interactive SVG Curve */}
            <div className="relative my-2 w-full">
              <svg viewBox="0 0 500 180" className="v14-svg-chart">
                <defs>
                  <linearGradient id="v14AreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea3822" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#ea3822" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="v14LineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff6a47" />
                    <stop offset="100%" stopColor="#ea3822" />
                  </linearGradient>
                </defs>

                {/* Horizontal guide lines */}
                <line x1="30" y1="40" x2="470" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <line x1="30" y1="92" x2="470" y2="92" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <line x1="30" y1="145" x2="470" y2="145" stroke="currentColor" strokeOpacity="0.12" />

                {/* Area Fill */}
                <motion.path
                  d={areaPathD}
                  fill="url(#v14AreaGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Smooth Animated Line Stroke */}
                <motion.path
                  d={linePathD}
                  fill="none"
                  stroke="url(#v14LineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Data Points */}
                {chartPoints.map((pt, idx) => {
                  const isHovered = hoveredChartDay === idx;
                  const isToday = idx === chartPoints.length - 1;

                  return (
                    <g key={pt.dateStr}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isToday ? 4.5 : 3.5}
                        fill={isToday ? '#ea3822' : '#ffffff'}
                        stroke="#ea3822"
                        strokeWidth={isToday ? 3 : 2.5}
                        className="v14-chart-dot transition-all"
                        onMouseEnter={() => setHoveredChartDay(idx)}
                        onMouseLeave={() => setHoveredChartDay(null)}
                      />
                      {/* X-axis day label */}
                      <text
                        x={pt.x}
                        y="170"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isToday ? '700' : '500'}
                        fill="currentColor"
                        className={`transition-colors ${
                          isToday
                            ? 'fill-[#ea3822] dark:fill-[#ff6a47]'
                            : 'fill-slate-600 dark:fill-slate-400'
                        }`}
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredChartDay !== null && chartPoints[hoveredChartDay] && (
                <div
                  className="absolute pointer-events-none transform -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 text-white px-3 py-1.5 rounded-xl shadow-xl text-xs backdrop-blur-md border border-white/10 z-20 flex flex-col items-center gap-0.5"
                  style={{
                    left: `${(chartPoints[hoveredChartDay].x / 500) * 100}%`,
                    top: `${Math.max(10, chartPoints[hoveredChartDay].y - 48)}px`
                  }}
                >
                  <span className="font-bold text-white text-[11px]">
                    {chartPoints[hoveredChartDay].shortDate}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {chartPoints[hoveredChartDay].presentCount} / {staff.length} Present
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Showing real logs for past 7 days across active staff
              </span>
              <button
                className="text-[#ea3822] font-bold hover:underline flex items-center gap-1"
                onClick={() => handleNavigatePill('Activity')}
              >
                Inspect Telemetry Monitor <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Graph 2: Dynamic Department Workload & Squad Capacity Gauge */}
          <div className="v14-graph-card flex flex-col justify-between">
            <div>
              <div className="v14-table-header">
                <div>
                  <h3 className="text-slate-950 dark:text-white font-bold text-base flex items-center gap-2">
                    <Users size={17} className="text-[#ea3822]" /> Squad Capacity & Allocation
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {openTasks.length} active tasks across {staff.length} staff
                  </span>
                </div>
              </div>

              {/* Dynamic Circular Gauge */}
              <div className="flex items-center justify-center my-3">
                <div className="v14-gauge-wrap w-36 h-36">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={donutRadius} className="v14-gauge-circle-bg" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      stroke="url(#v14LineGrad)"
                      className="v14-gauge-circle-fill"
                      strokeDasharray={donutCircumference}
                      initial={{ strokeDashoffset: donutCircumference }}
                      animate={{ strokeDashoffset: donutOffset }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                      {overallCapacityRate}%
                    </span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                      Allocated
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Department Workload Meters */}
              <div className="space-y-3 mt-4 text-xs">
                {departmentStats.slice(0, 3).map(dept => (
                  <div key={dept.department}>
                    <div className="flex justify-between text-slate-700 dark:text-slate-200 font-semibold mb-1">
                      <span>{dept.department}</span>
                      <span className="font-bold text-slate-950 dark:text-white">
                        {dept.taskCount} tasks ({dept.loadPercentage}% load)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-[#ea3822] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.loadPercentage}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Workload balancing & allocation</span>
              <button
                className="text-[#ea3822] font-bold hover:underline flex items-center gap-1"
                onClick={() => handleNavigatePill('Tasks')}
              >
                Reassign on Task Board <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Lower Row: Recent Tasks Table + Live Team Telemetry */}
        <div className="v14-layout-row">
          {/* Recent Sprint Tasks Table */}
          <div className="v14-table-card">
            <div className="v14-table-header">
              <div>
                <h3 className="text-slate-950 dark:text-white font-bold text-base flex items-center gap-2">
                  <CheckSquare size={17} className="text-[#ea3822]" /> Recent Sprint Deliverables
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  High priority items currently in progress or awaiting verification
                </span>
              </div>
              <button
                type="button"
                className="text-slate-700 dark:text-slate-300 font-bold hover:text-[#ea3822] transition-colors"
                onClick={() => handleNavigatePill('Tasks')}
              >
                View Full Board <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="v14-table">
                <thead>
                  <tr>
                    <th>NAME / TASK</th>
                    <th>PROJECT</th>
                    <th>ASSIGNEE</th>
                    <th>DEADLINE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {openTasks.slice(0, 5).map(task => (
                    <tr key={task.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td>
                        <strong className="font-bold text-slate-950 dark:text-white block text-xs">
                          {task.title}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-medium">{task.category || 'General'}</span>
                      </td>
                      <td>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">
                          {task.projectName || 'General'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white text-[10px] font-bold flex items-center justify-center">
                            {(task.assignedToName || 'U').charAt(0)}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {task.assignedToName || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {task.deadline}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : task.status === 'in_progress'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
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
                        No pending deliverables. Click "+ Assign Task" to assign one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Live Team Telemetry & Quick Message Hub */}
          <div className="v14-table-card flex flex-col justify-between">
            <div>
              <div className="v14-table-header">
                <div>
                  <h3 className="text-slate-950 dark:text-white font-bold text-base flex items-center gap-2">
                    <Activity size={17} className="text-emerald-500" /> Live Team Telemetry
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {activeStaff.length} team members currently active online
                  </span>
                </div>
                <button
                  type="button"
                  className="text-slate-700 dark:text-slate-300 font-bold hover:text-[#ea3822] transition-colors"
                  onClick={() => handleNavigatePill('Activity')}
                >
                  Full Telemetry <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="space-y-2.5 mt-2">
                {staff.slice(0, 5).map(member => (
                  <div key={member.id} className="v14-telemetry-row">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0e1525] ${
                            member.status === 'online'
                              ? 'bg-emerald-500 animate-pulse'
                              : member.status === 'break'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-slate-950 dark:text-white">
                          {member.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {member.designation || member.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          member.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {member.status}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#ea3822] hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:hover:bg-[#ea3822] dark:hover:text-white flex items-center justify-center transition-all"
                        title={`Send direct message to ${member.name}`}
                        onClick={() => handleDirectMessage(member.id)}
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Direct live sync with in-app chat desk</span>
              <button
                className="text-[#ea3822] font-bold hover:underline flex items-center gap-1"
                onClick={() => setActiveDock('messages')}
              >
                Open Messages <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // =========================================================
  // 2. TEAM DIRECTORY / MANAGE VIEW
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
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Team & Staff Directory
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Manage team accounts, track live statuses, and assign sprint responsibilities.
            </p>
          </div>

          <div className="mp-hero-actions">
            <button className="mp-btn-primary" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={14} /> Register Employee
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#131924]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
              className="mp-select max-w-[190px]"
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
              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                key={member.id}
                className="v14-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <strong className="block text-sm font-bold text-slate-950 dark:text-white">
                        {member.name}
                      </strong>
                      <span className="text-xs text-slate-500 font-medium">{member.designation || member.role}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      member.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : member.status === 'break'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="my-3 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{member.department}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Official Email:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px] text-slate-700 dark:text-slate-300 font-medium">
                      {member.email}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">{openCount} active tasks</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs font-bold text-slate-600 hover:text-[#ea3822] dark:text-slate-400 flex items-center gap-1 transition-colors"
                      onClick={() => handleDirectMessage(member.id)}
                    >
                      <MessageSquare size={13} /> Chat
                    </button>
                    <button
                      className="text-[#ea3822] font-bold hover:underline flex items-center gap-1"
                      onClick={() => handleNavigatePill('Tasks')}
                    >
                      Tasks <ArrowRight size={12} />
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

  // =========================================================
  // 3. PROJECTS PORTFOLIO VIEW
  // =========================================================
  const renderProjectsPortfolioView = () => {
    const filtered = projects.filter(p => projectFilter === 'all' || p.status === projectFilter);

    return (
      <div className="space-y-6">
        <div className="v14-greeting-row">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Project Portfolio & Roadmap
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Track team roadmaps, milestone deliverables, and budget allocations.
            </p>
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
              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                key={proj.id}
                className="v14-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {proj.department || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        proj.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 dark:text-white">{proj.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Client: {proj.client}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 font-normal">
                    {proj.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <span>Deliverables ({comp}/{pTasks.length})</span>
                    <strong className="text-slate-950 dark:text-white">{percent}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#ea3822] h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Due: {proj.deadline || 'Ongoing'}</span>
                    <button
                      className="text-xs font-bold text-[#ea3822] hover:underline flex items-center gap-1"
                      onClick={() => handleNavigatePill('Tasks')}
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
        <div
          className="v14-dock-logo"
          title="quickslogx Portal"
          onClick={() => {
            handleNavigateDock('overview');
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
                handleNavigateDock(id);
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
          <div
            className="v14-brand-pill"
            onClick={() => {
              handleNavigatePill('Overview');
            }}
          >
            <div className="v14-brand-symbol">Q</div>
            <span className="v14-brand-name font-bold text-slate-950 dark:text-white">quickslogx</span>
          </div>

          {/* Center Sliding Horizontal Navigation Pills strictly aligned with Manager Tabs */}
          <nav className="v14-pills-container">
            {PILL_TABS.map(tab => {
              const isActive = activePill === tab;
              return (
                <button
                  key={tab}
                  className={`v14-pill-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    handleNavigatePill(tab);
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
            <div className="v14-search-pill hidden sm:flex">
              <Search size={14} />
              <input
                placeholder="Search..."
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
              />
              <span className="v14-kbd">⌘K</span>
            </div>

            <button className="v14-icon-btn" title="Toggle theme" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              className="v14-icon-btn"
              title="Notifications"
              onClick={() => setInboxOpen(true)}
            >
              <Bell size={16} />
              {unreadNotifications > 0 && <span className="v14-coral-dot" />}
            </button>

            <div className="v14-profile-chip" onClick={() => setProfileOpen(true)}>
              <div className="v14-profile-avatar">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} />
                ) : (
                  currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                )}
              </div>
              <span className="v14-profile-name hidden md:inline font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Global Search Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-16 right-24 w-80 bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
            {searchResults.map((res, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium"
                onClick={() => {
                  res.action();
                  setGlobalSearchQuery('');
                }}
              >
                {res.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area with Smooth, Slow Luxurious Transition on Tab Switch */}
        <main className="v14-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activePill}-${activeDock}`}
              initial={{ opacity: 0, y: reduced ? 0 : 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : -8, scale: 0.995 }}
              transition={{ duration: reduced ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
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
            aria-label="Notification center"
          >
            <div className="at-drawer-header">
              <div className="at-drawer-title-group">
                <span className="at-drawer-kicker">COMMUNICATIONS</span>
                <h3>Notifications</h3>
              </div>
              <button className="at-drawer-close" onClick={() => setInboxOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <NotificationInbox
              onNavigate={(section) => {
                setInboxOpen(false);
                if (section === 'Projects') handleNavigatePill('Projects');
                else if (section === 'People') handleNavigatePill('Team');
                else if (section === 'Reports') handleNavigatePill('Reports');
                else if (section === 'Team chat') setActiveDock('messages');
                else if (section === 'Requests') handleNavigateDock('people');
                else handleNavigatePill('Overview');
              }}
              onOpenProfile={() => {
                setInboxOpen(false);
                setProfileOpen(true);
              }}
            />
          </section>
        </>
      )}

      {/* Profile Modal */}
      {profileOpen && <PremiumProfileModal isOpen={profileOpen} onClose={closeProfile} />}

      {/* Register Employee Modal */}
      {showRegisterModal && (
        <RegisterEmployeeModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <CreateProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <CreateTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {/* Mandatory Exit Clearance Modal */}
      {exitClearanceOpen && (
        <ExitClearanceModal
          isOpen={exitClearanceOpen}
          onClose={() => setExitClearanceOpen(false)}
          onConfirmLogout={handleConfirmSignOut}
        />
      )}

      {/* Floating Chat Launcher */}
      <FloatingChatWidget />
    </div>
  );
}
