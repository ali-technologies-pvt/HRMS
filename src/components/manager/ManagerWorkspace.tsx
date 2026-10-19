'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  LucideIcon,
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
  Radio
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

import { User } from '@/types';

export type ManagerPortalView =
  | 'dashboard'
  | 'employees'
  | 'projects'
  | 'tasks'
  | 'live_team'
  | 'attendance'
  | 'approvals'
  | 'eod_reports'
  | 'leave_mgmt'
  | 'payroll'
  | 'broadcasts'
  | 'team_chat'
  | 'company_setup';

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

  // Navigation State
  const [view, setView] = useState<ManagerPortalView>('dashboard');
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);
  const [inbox, setInbox] = useState(false);
  const [exitClearance, setExitClearance] = useState(false);
  const [query, setQuery] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);

  // Modals State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Filter States
  const [memberDeptFilter, setMemberDeptFilter] = useState('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  const closeProfile = useCallback(() => setProfile(false), []);
  const sidebarRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const isManagerHr = currentUser.role === 'manager_hr';
  const isHrOnly = currentUser.role === 'hr';

  const staff = useMemo(() => users.filter(u => u.role !== 'super_admin'), [users]);
  const activeStaff = useMemo(() => staff.filter(u => u.status === 'online'), [staff]);
  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const openTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);
  const urgentTasks = useMemo(() => openTasks.filter(t => t.priority === 'urgent'), [openTasks]);

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

  // Navigation Items
  const navigation = useMemo(() => {
    const list: { id: ManagerPortalView; label: string; icon: LucideIcon; badge?: number }[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'employees', label: 'Team & People', icon: Users, badge: staff.length },
      { id: 'projects', label: 'Projects', icon: BriefcaseBusiness, badge: activeProjects.length },
      { id: 'tasks', label: 'Tasks Board', icon: CheckSquare, badge: openTasks.length },
      { id: 'live_team', label: 'Live Telemetry', icon: Activity, badge: activeStaff.length },
      { id: 'attendance', label: 'Attendance', icon: CalendarDays },
      { id: 'approvals', label: 'Approvals', icon: FileText, badge: pendingRequests.length },
      { id: 'eod_reports', label: 'EOD Reports', icon: FileText },
      { id: 'broadcasts', label: 'Noticeboard', icon: Megaphone },
      { id: 'team_chat', label: 'Team Chat', icon: MessageSquare, badge: totalUnreadChatCount }
    ];

    if (isManagerHr || isHrOnly) {
      list.push({ id: 'leave_mgmt', label: 'Leave Quotas', icon: Users });
      list.push({ id: 'payroll', label: 'Payroll & Slips', icon: Wallet });
    }

    list.push({ id: 'company_setup', label: 'Office Policies', icon: Settings2 });
    return list;
  }, [staff.length, activeProjects.length, openTasks.length, activeStaff.length, pendingRequests.length, totalUnreadChatCount, isManagerHr, isHrOnly]);

  const navigate = (id: ManagerPortalView) => {
    setView(id);
    setMobile(false);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSignOutRequest = () => {
    const hasActiveShift = myRecord?.clockIn && !myRecord.clockOut;
    const hasPendingReview = pendingRequests.length > 0;
    if (hasActiveShift || hasPendingReview) {
      setExitClearance(true);
      return;
    }
    updateUserStatus('offline');
    logout();
  };

  const avatar = (
    <span className="ep-avatar">
      {currentUser.avatarUrl && !photoFailed ? (
        <img src={currentUser.avatarUrl} alt={currentUser.name} onError={() => setPhotoFailed(true)} />
      ) : (
        currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
      )}
    </span>
  );

  // Live Global Search Results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const navHits = navigation
      .filter(item => item.label.toLowerCase().includes(q))
      .map(item => ({ id: item.id, label: `Go to: ${item.label}`, type: 'nav' }));

    const memberHits = staff
      .filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q))
      .slice(0, 4)
      .map(u => ({ id: 'employees' as ManagerPortalView, label: `Team: ${u.name} (${u.department})`, type: 'user' }));

    const projectHits = projects
      .filter(p => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({ id: 'projects' as ManagerPortalView, label: `Project: ${p.name} - ${p.client}`, type: 'project' }));

    const taskHits = tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map(t => ({ id: 'tasks' as ManagerPortalView, label: `Task: ${t.title}`, type: 'task' }));

    return [...navHits, ...memberHits, ...projectHits, ...taskHits].slice(0, 7);
  }, [query, navigation, staff, projects, tasks]);

  // CSV Report Generator
  const exportManagerReport = () => {
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
    a.download = `quickslogx-manager-report-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render Sub-Views
  const renderViewContent = () => {
    switch (view) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'employees':
        return renderEmployeesDirectory();
      case 'projects':
        return renderProjectsDesk();
      case 'tasks':
        return <TaskAllocationDesk />;
      case 'live_team':
        return <TeamLiveMonitor />;
      case 'attendance':
        return <AttendanceDesk compactHeader />;
      case 'approvals':
        return <RequestsApprovalDesk />;
      case 'eod_reports':
        return <EODReportsDesk />;
      case 'leave_mgmt':
        return <LeaveManagementDesk />;
      case 'payroll':
        return <PayrollDesk />;
      case 'broadcasts':
        return <BroadcastDesk />;
      case 'team_chat':
        return <ChatDesk />;
      case 'company_setup':
        return <CompanySetupDesk key="policies" initialTab="policies" compactHeader />;
      default:
        return renderDashboardOverview();
    }
  };

  // 1. Dashboard Overview Content
  const renderDashboardOverview = () => {
    const metricCards = [
      {
        title: 'Team Directory',
        value: staff.length,
        unit: 'people',
        caption: `${activeStaff.length} active online now`,
        icon: Users,
        target: 'employees' as ManagerPortalView
      },
      {
        title: 'Attendance Today',
        value: `${attendanceRate}%`,
        unit: `${presentCount}/${staff.length}`,
        caption: `${onTimeCount} on-time arrivals recorded`,
        icon: CalendarCheck,
        target: 'attendance' as ManagerPortalView
      },
      {
        title: 'Active Projects',
        value: activeProjects.length,
        unit: 'in flight',
        caption: `${projects.length} total across squads`,
        icon: BriefcaseBusiness,
        target: 'projects' as ManagerPortalView
      },
      {
        title: 'Open Tasks',
        value: openTasks.length,
        unit: 'backlog',
        caption: `${urgentTasks.length} marked urgent priority`,
        icon: CheckSquare,
        target: 'tasks' as ManagerPortalView
      },
      {
        title: 'Pending Requests',
        value: pendingRequests.length,
        unit: 'awaiting',
        caption: `${pendingRequests.filter(r => r.type === 'leave').length} leave · ${pendingRequests.filter(r => r.type === 'wfh').length} WFH`,
        icon: FileText,
        target: 'approvals' as ManagerPortalView
      },
      {
        title: 'EOD Submissions',
        value: reports.filter(r => r.date === todayStr).length,
        unit: 'submitted',
        caption: 'Daily reports reviewed today',
        icon: Clock3,
        target: 'eod_reports' as ManagerPortalView
      }
    ];

    return (
      <div className="space-y-6">
        {/* Manager Shift Strip */}
        <div className="ep-shift">
          <div>
            <span className={`ep-shift-dot ${myRecord?.clockIn && !myRecord.clockOut ? 'is-active' : ''}`} />
            <strong>
              {myRecord?.clockOut
                ? 'Your shift is completed for today'
                : myRecord?.clockIn
                ? `You're clocked in (started at ${myRecord.clockIn})`
                : 'Manager Shift: Ready to punch in?'}
            </strong>
            <span>
              Office hours: {policy.officeStartTime}–{policy.officeEndTime} · {policy.gracePeriodMinutes}m grace
            </span>
          </div>
          <button
            className={myRecord?.clockIn ? 'ep-button ep-secondary' : 'ep-button'}
            disabled={!!myRecord?.clockOut}
            onClick={() => (myRecord?.clockIn ? clockOut(currentUser.id) : clockIn(currentUser.id))}
          >
            {myRecord?.clockOut ? 'Shift Done' : myRecord?.clockIn ? 'Punch Out' : 'Punch In'}
          </button>
        </div>

        {/* 6 Key Metrics Cards */}
        <section className="ep-metrics" aria-label="Management key indicators">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.title}
                className="ep-metric"
                onClick={() => navigate(card.target)}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.25, delay: reduced ? 0 : idx * 0.03 }}
              >
                <span className="ep-metric-icon">
                  <Icon size={19} />
                </span>
                <span className="ep-metric-label">{card.title}</span>
                <span className="ep-metric-value">
                  {card.value}
                  {card.unit && <small className="text-xs ml-1 font-normal text-slate-500">{card.unit}</small>}
                </span>
                <span className="ep-metric-caption">
                  {card.caption}
                  <ArrowRight size={11} />
                </span>
              </motion.button>
            );
          })}
        </section>

        {/* Quick Operations Row */}
        <section className="ep-quick">
          <h2>Quick Actions & Operations</h2>
          <div>
            <button className="ep-card" onClick={() => setShowRegisterModal(true)}>
              <span className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#244c78]" />
                <strong>Register Employee</strong>
              </span>
              <ArrowRight size={13} />
            </button>
            <button className="ep-card" onClick={() => setShowProjectModal(true)}>
              <span className="flex items-center gap-2">
                <BriefcaseBusiness size={16} className="text-[#244c78]" />
                <strong>New Project</strong>
              </span>
              <ArrowRight size={13} />
            </button>
            <button className="ep-card" onClick={() => setShowTaskModal(true)}>
              <span className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#244c78]" />
                <strong>Assign Task</strong>
              </span>
              <ArrowRight size={13} />
            </button>
            <button className="ep-card" onClick={() => navigate('approvals')}>
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-[#244c78]" />
                <strong>Approvals Queue ({pendingRequests.length})</strong>
              </span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* Analytics & Spotlight Grid */}
        <div className="ep-graphs">
          {/* Team Attendance Consistency Chart */}
          <section className="ep-card">
            <header>
              <h2>
                Team Attendance <span>· Today</span>
              </h2>
              <button onClick={() => navigate('attendance')}>View Attendance Logs</button>
            </header>
            <div className="ep-attendance-chart">
              <div
                className="ep-donut"
                role="img"
                aria-label={`Attendance rate ${attendanceRate}%`}
                style={{
                  background:
                    staff.length > 0
                      ? `conic-gradient(#244c78 0% ${attendanceRate}%, #e8ac32 ${attendanceRate}% ${Math.min(
                          100,
                          attendanceRate + (todayAttendance.filter(a => a.isLate).length / staff.length) * 100
                        )}%, #dce5f0 ${Math.min(
                          100,
                          attendanceRate + (todayAttendance.filter(a => a.isLate).length / staff.length) * 100
                        )}% 100%)`
                      : '#e7edf5'
                }}
              >
                <div>
                  <strong>{attendanceRate}%</strong>
                  <span>ARRIVED</span>
                </div>
              </div>
              <div className="ep-legend">
                {[
                  { label: 'Present / On Time', n: onTimeCount, color: '#244c78' },
                  { label: 'Late Arrival', n: todayAttendance.filter(a => a.isLate).length, color: '#e8ac32' },
                  { label: 'Not Yet Arrived / Absent', n: Math.max(0, staff.length - presentCount), color: '#a8bbd3' }
                ].map(item => (
                  <div key={item.label}>
                    <i style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <strong>{item.n}</strong>
                  </div>
                ))}
              </div>
            </div>
            <p className="ep-chart-note">
              {presentCount} of {staff.length} staff checked in today. Excuses and WFH approvals update these records automatically.
            </p>
          </section>

          {/* Pending Requests Spotlight */}
          <section className="ep-card">
            <header>
              <h2>
                Requests Awaiting Decision <span>· Pending</span>
              </h2>
              <button onClick={() => navigate('approvals')}>Open Queue</button>
            </header>
            <div className="p-5 flex flex-col justify-between h-[210px]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 font-bold">
                  {pendingRequests.length} PENDING DECISIONS
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">
                  Every request deserves a timely response.
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Staff leave requests, medical absences, and work-from-home applications are queued for manager review.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {pendingRequests.filter(r => r.type === 'leave').length} Leave · {pendingRequests.filter(r => r.type === 'wfh').length} WFH · {pendingRequests.filter(r => r.type === 'late_excuse' || r.type === 'absence_excuse').length} Excuses
                </span>
                <button className="ep-button" onClick={() => navigate('approvals')}>
                  Review Now <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Layout: Active Projects & Recent Tasks */}
        <div className="ep-bottom-layout">
          {/* Left: Active Projects Portfolio */}
          <aside className="ep-card ep-recent">
            <header>
              <h2>Active Project Portfolio</h2>
              <button onClick={() => navigate('projects')}>View All</button>
            </header>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeProjects.slice(0, 4).map(proj => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const comp = projTasks.filter(t => t.status === 'completed').length;
                const percent = projTasks.length ? Math.round((comp / projTasks.length) * 100) : 0;

                return (
                  <article key={proj.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {proj.name}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{percent}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 my-1">
                      Client: {proj.client} · {proj.department || 'General'}
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-[#244c78] h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </article>
                );
              })}
              {!activeProjects.length && (
                <p className="ep-empty">No active projects. Click "+ New Project" to get started.</p>
              )}
            </div>
          </aside>

          {/* Right: Urgent & High Priority Tasks Peek */}
          <div>
            <section className="ep-card ep-attendance-table">
              <header>
                <h2>
                  Sprint Deliverables & Tasks <span>· In Progress / Open</span>
                </h2>
                <button onClick={() => navigate('tasks')}>Open Board</button>
              </header>
              <div className="ep-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>TASK / DELIVERABLE</th>
                      <th>PROJECT</th>
                      <th>ASSIGNEE</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTasks.slice(0, 6).map(t => (
                      <tr key={t.id}>
                        <td>
                          <strong className="text-xs text-slate-800 dark:text-slate-200">{t.title}</strong>
                        </td>
                        <td>{t.projectName || 'General'}</td>
                        <td>{t.assignedToName || 'Unassigned'}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              t.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : t.priority === 'high'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className="capitalize text-slate-500 font-medium text-xs">
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!openTasks.length && <p className="ep-empty">Task backlog is clear. No pending deliverables.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // 2. Team & Employees Directory Desk
  const renderEmployeesDirectory = () => {
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
      <div className="space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#142338] p-4 rounded-xl border border-[#dce5f0] dark:border-[#30445f]">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="ep-search w-full max-w-sm">
              <Search size={16} />
              <input
                aria-label="Search employees"
                placeholder="Search staff by name, email, or designation..."
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

          <div className="flex items-center gap-2">
            <button className="mp-btn-primary" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={15} /> Register Employee
            </button>
          </div>
        </div>

        {/* Staff Cards Grid */}
        <div className="mp-team-grid">
          {filteredStaff.map(member => {
            const memberTasks = tasks.filter(t => t.assignedToId === member.id);
            const memberOpenTasks = memberTasks.filter(t => t.status !== 'completed');

            return (
              <div key={member.id} className="mp-member-card">
                <div className="mp-member-header">
                  <span className="ep-avatar">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} />
                    ) : (
                      member.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                    )}
                  </span>
                  <div className="mp-member-info">
                    <strong>{member.name}</strong>
                    <span>{member.designation || member.role.replace('_', ' ')}</span>
                  </div>
                  <span
                    className={`mp-status-indicator mp-status-${
                      member.status === 'online'
                        ? 'online'
                        : member.status === 'break'
                        ? 'break'
                        : member.status === 'in_meeting'
                        ? 'meeting'
                        : 'offline'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        member.status === 'online'
                          ? 'bg-emerald-500'
                          : member.status === 'break'
                          ? 'bg-amber-500'
                          : member.status === 'in_meeting'
                          ? 'bg-purple-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {member.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold">{member.department}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Official Email:</span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                      {member.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Salary:</span>
                    <span>PKR {member.salary?.toLocaleString() || '—'}</span>
                  </div>
                </div>

                <div className="mp-member-meta">
                  <span>
                    Tasks: <span className="mp-badge-count">{memberOpenTasks.length} open</span>
                  </span>
                  <button
                    className="text-xs font-semibold text-[#244c78] dark:text-[#b5cce6] hover:underline flex items-center gap-1"
                    onClick={() => {
                      setView('tasks');
                    }}
                  >
                    Assign Task <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!filteredStaff.length && (
          <div className="ep-card p-10 text-center text-slate-500">
            <Users size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-sm">No employees match your search criteria.</p>
            <button className="mp-btn-primary mt-3" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={14} /> Register New Employee
            </button>
          </div>
        )}
      </div>
    );
  };

  // 3. Projects Desk
  const renderProjectsDesk = () => {
    const filtered = projects.filter(
      p => projectStatusFilter === 'all' || p.status === projectStatusFilter
    );

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#142338] p-4 rounded-xl border border-[#dce5f0] dark:border-[#30445f]">
          <div className="flex items-center gap-3">
            <select
              className="mp-select max-w-[180px]"
              value={projectStatusFilter}
              onChange={e => setProjectStatusFilter(e.target.value)}
            >
              <option value="all">All Projects ({projects.length})</option>
              <option value="active">Active ({activeProjects.length})</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button className="mp-btn-secondary" onClick={exportManagerReport}>
              <ArrowDownToLine size={14} /> Export CSV
            </button>
            <button className="mp-btn-primary" onClick={() => setShowProjectModal(true)}>
              <BriefcaseBusiness size={15} /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const comp = projectTasks.filter(t => t.status === 'completed').length;
            const percent = projectTasks.length ? Math.round((comp / projectTasks.length) * 100) : 0;
            const assignees = users.filter(u => projectTasks.some(t => t.assignedToId === u.id));

            return (
              <div key={project.id} className="ep-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {project.department || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        project.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : project.status === 'completed'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Client: {project.client}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress ({comp}/{projectTasks.length} tasks)</span>
                    <strong className="text-slate-700 dark:text-slate-300">{percent}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#244c78] h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-1.5">
                      {assignees.slice(0, 4).map(u => (
                        <span
                          key={u.id}
                          title={u.name}
                          className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#142338]"
                        >
                          {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                      ))}
                      {!assignees.length && <span className="text-[11px] text-slate-400">No team assigned</span>}
                    </div>

                    <button
                      className="text-xs font-semibold text-[#244c78] dark:text-[#b5cce6] hover:underline flex items-center gap-1"
                      onClick={() => {
                        setView('tasks');
                      }}
                    >
                      Tasks Board <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="atelier atelier-live employee-portal manager-portal"
      data-theme={theme}
    >
      {/* Mobile Scrim */}
      {mobile && (
        <button
          className="ep-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}

      {/* Modern Sidebar (matching EmployeePortal) */}
      <aside
        ref={sidebarRef}
        aria-label="Management navigation panel"
        className={`ep-sidebar ${mobile ? 'ep-sidebar-open' : ''}`}
      >
        <button className="ep-logo" aria-label="Go to dashboard" onClick={() => navigate('dashboard')}>
          <img src="/company-logo.png" alt="Quickslogix" />
        </button>

        <span className="ep-portal-label">
          {isHrOnly ? 'HUMAN RESOURCES PORTAL' : isManagerHr ? 'MANAGEMENT & HR PORTAL' : 'MANAGEMENT PORTAL'}
        </span>

        <button className="ep-mobile-close" aria-label="Close navigation" onClick={() => setMobile(false)}>
          <X size={18} />
        </button>

        <nav aria-label="Management navigation">
          {navigation.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && <small>{badge > 99 ? '99+' : badge}</small>}
            </button>
          ))}
        </nav>

        {/* Sidebar Bottom Profile Card */}
        <div className="ep-sidebar-bottom">
          <button className="ep-user" onClick={() => setProfile(true)}>
            {avatar}
            <span>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.designation || currentUser.role.replace('_', ' ')}</small>
            </span>
          </button>
          <div>
            <button onClick={handleSignOutRequest}>
              <LogOut size={14} /> Sign out
            </button>
            <button aria-label="Profile settings" onClick={() => setProfile(true)}>
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Body */}
      <div className="ep-body">
        {/* Topbar */}
        <header className="ep-topbar">
          <button className="ep-menu" aria-label="Open navigation" onClick={() => setMobile(true)}>
            <Menu size={20} />
          </button>

          {/* Global Interactive Search */}
          <div className="ep-search">
            <Search size={17} />
            <input
              aria-label="Search management workspace"
              placeholder="Search employees, tasks, projects, or desks…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setQuery('');
                if (e.key === 'Enter' && searchResults[0]) {
                  navigate(searchResults[0].id);
                }
              }}
            />
            {query && (
              <div className="ep-search-results">
                {searchResults.length ? (
                  searchResults.map((result, i) => (
                    <button key={result.label + i} onClick={() => navigate(result.id)}>
                      {result.label}
                    </button>
                  ))
                ) : (
                  <span>No matching employees, projects, or tasks.</span>
                )}
              </div>
            )}
          </div>

          {/* Topbar Actions */}
          <div className="ep-header-actions">
            {/* Shift Clock Button */}
            <button
              className="ep-button ep-secondary"
              disabled={!!myRecord?.clockOut}
              onClick={() => (myRecord?.clockIn ? clockOut(currentUser.id) : clockIn(currentUser.id))}
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">
                {myRecord?.clockOut ? 'Shift Done' : myRecord?.clockIn ? 'Punch Out' : 'Punch In'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              className="ep-notification"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Team Chat Link */}
            <button
              className="ep-notification"
              aria-label={`Open team chat, ${totalUnreadChatCount} unread`}
              onClick={() => navigate('team_chat')}
            >
              <MessageSquare size={17} />
              {totalUnreadChatCount > 0 && <small>{totalUnreadChatCount}</small>}
            </button>

            {/* Notifications Drawer Toggle */}
            <button
              className="ep-notification"
              aria-label={`Notifications, ${unreadNotifications} unread`}
              onClick={() => setInbox(true)}
            >
              <Bell size={18} />
              {unreadNotifications > 0 && <small>{unreadNotifications}</small>}
            </button>

            {/* User Profile Pill */}
            <button className="ep-header-user" onClick={() => setProfile(true)}>
              {avatar}
              <span>
                <strong>{currentUser.name}</strong>
                <small>{currentUser.designation || 'Manager'}</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="ep-main">
          {/* Page Heading & Hero Actions */}
          <div className="ep-page-heading">
            <div>
              <h1>
                {view === 'dashboard'
                  ? `Welcome back, ${currentUser.name.split(' ')[0]}`
                  : navigation.find(item => item.id === view)?.label}
              </h1>
              <p>
                {view === 'dashboard'
                  ? 'A clear, real-time perspective on your team, projects, and deliverables.'
                  : `${currentUser.department} · Management Workspace`}
              </p>
            </div>

            {/* Quick Hero Creation Buttons */}
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
              <button className="mp-btn-secondary" onClick={exportManagerReport}>
                <ArrowDownToLine size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Animated View Container */}
          <AnimatePresence mode="wait">
            <motion.div
              className="ep-content"
              key={view}
              initial={{ opacity: 0, y: reduced ? 0 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
            >
              <div className={view === 'dashboard' ? '' : 'at-live-desk ep-desk'}>
                {renderViewContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notifications Drawer */}
      {inbox && (
        <>
          <button className="ep-scrim ep-drawer-scrim" aria-label="Close notifications" onClick={() => setInbox(false)} />
          <section
            ref={dialogRef}
            className="at-drawer brand-notification-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="at-drawer-head">
              <span className="at-section-eyebrow">YOUR WORKSPACE</span>
              <button className="at-icon-button" aria-label="Close notifications" onClick={() => setInbox(false)}>
                <X size={20} />
              </button>
            </div>
            <h2>Notifications</h2>
            <NotificationInbox
              onOpenProfile={() => {
                setInbox(false);
                setProfile(true);
              }}
              onNavigate={section => {
                setInbox(false);
                if (section === 'Requests') navigate('approvals');
                else if (section === 'Reports') navigate('eod_reports');
                else if (section === 'Broadcasts') navigate('broadcasts');
                else if (section === 'Team chat' || section === 'People') navigate('team_chat');
                else navigate('tasks');
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
          setView('employees');
        }}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={() => {
          setView('projects');
        }}
      />

      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={() => {
          setView('tasks');
        }}
      />

      {/* User Profile & Password Modals */}
      <div className="at-live-desk">
        <PremiumProfileModal isOpen={profile} onClose={closeProfile} />
        <ForcePasswordModal />
        <ExitClearanceModal
          isOpen={exitClearance}
          onClose={() => setExitClearance(false)}
          onConfirmLogout={() => {
            updateUserStatus('offline');
            logout();
          }}
        />
      </div>

      {/* Global Real-Time Floating Live Chat Widget */}
      <div className="at-live-chat">
        <FloatingChatWidget />
      </div>
    </div>
  );
}
