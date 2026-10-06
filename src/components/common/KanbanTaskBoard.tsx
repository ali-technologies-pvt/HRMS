'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from './LiquidGlassCard';
import { LiquidButton } from './LiquidButton';
import { SquareBadge } from './SquareBadge';
import { EODReportModal } from '../employee/EODReportModal';
import { formatDuration } from '@/lib/utils';
import { Task, TaskStatus, TaskPriority, User } from '@/types';
import {
  Search,
  Plus,
  MoreHorizontal,
  Flag,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  FolderKanban,
  Lock,
  FileCheck2,
  Users,
  X,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  History,
  Check,
  ChevronDown,
  Trash2,
  User as UserIcon,
  Sparkles,
  ExternalLink,
  Download,
  FileText,
  Building2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KanbanTaskBoardProps {
  mode: 'manager' | 'employee';
}

interface ActivityLogItem {
  id: string;
  userName: string;
  userAvatar?: string;
  action: string;
  taskTitle: string;
  time: string;
  color: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate';
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'UI Design': {
    bg: 'bg-sky-100 dark:bg-sky-950/70',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700',
    bar: 'bg-sky-500'
  },
  'Copywriting': {
    bg: 'bg-pink-100 dark:bg-pink-950/70',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-700',
    bar: 'bg-pink-500'
  },
  'Illustration': {
    bg: 'bg-emerald-100 dark:bg-emerald-950/70',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    bar: 'bg-emerald-500'
  },
  'Frontend': {
    bg: 'bg-indigo-100 dark:bg-indigo-950/70',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
    bar: 'bg-indigo-500'
  },
  'Backend': {
    bg: 'bg-amber-100 dark:bg-amber-950/70',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    bar: 'bg-amber-500'
  },
  'QA / Testing': {
    bg: 'bg-teal-100 dark:bg-teal-950/70',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    bar: 'bg-teal-500'
  }
};

const DEFAULT_CATEGORY_COLOR = {
  bg: 'bg-slate-100 dark:bg-slate-800',
  text: 'text-slate-700 dark:text-slate-300',
  border: 'border-slate-300 dark:border-slate-700',
  bar: 'bg-slate-500'
};

const PRESET_CATEGORIES = [
  'UI Design',
  'Frontend',
  'Backend',
  'Copywriting',
  'Illustration',
  'QA / Testing'
];

export function KanbanTaskBoard({ mode }: KanbanTaskBoardProps) {
  const { users, currentUser } = useAuth();
  const { tasks, projects, addTask, updateTask, deleteTask, updateTaskStatus, toggleTaskTimer, addProject, attendance, reports } = useAppData();
  const { showNotification } = useNotifications();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // EOD Report modal state (for employees)
  const [showEODModal, setShowEODModal] = useState(false);

  // Full Assign Task modal (for managers)
  const [showFullModal, setShowFullModal] = useState(false);

  // Create Project modal (for manager)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Client Project Report modal (for manager)
  const [showClientReportModal, setShowClientReportModal] = useState(false);
  const [reportSelectedProjectId, setReportSelectedProjectId] = useState<string>('');
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // General Monthly Report modal (for employee)
  const [showEmployeeMonthlyReportModal, setShowEmployeeMonthlyReportModal] = useState(false);
  const [empReportMonth, setEmpReportMonth] = useState('October 2026');

  // Active inline "Create New Card" column (e.g. 'pending', 'in_progress', 'needs_review', 'completed')
  const [inlineAddColumn, setInlineAddColumn] = useState<TaskStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCategory, setInlineCategory] = useState('UI Design');
  const [inlineAssigneeId, setInlineAssigneeId] = useState('');
  const [inlineDeadline, setInlineDeadline] = useState('2026-10-15');

  // Active card options menu dropdown
  const [menuOpenTaskId, setMenuOpenTaskId] = useState<string | null>(null);

  // Live timer tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Activity stream
  const [activities, setActivities] = useState<ActivityLogItem[]>([
    {
      id: 'act-1',
      userName: 'Hamza Tariq',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      action: 'completed task',
      taskTitle: 'Report Aggregation Logic',
      time: '12m ago',
      color: 'emerald'
    },
    {
      id: 'act-2',
      userName: 'Zoya Malik',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      action: 'requested review on',
      taskTitle: 'Onboarding Copywriting',
      time: '35m ago',
      color: 'violet'
    },
    {
      id: 'act-3',
      userName: 'Hamza Tariq',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      action: 'started work on',
      taskTitle: 'Liquid Glass Navigation',
      time: '1h ago',
      color: 'cyan'
    },
    {
      id: 'act-4',
      userName: 'Sarah Jenkins',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      action: 'assigned new task to',
      taskTitle: 'Bilal Siddiqui (QA Suite)',
      time: '2h ago',
      color: 'amber'
    }
  ]);

  const eligibleEmployees = useMemo(() => {
    return users.filter(u => u.role === 'employee' || u.role === 'manager');
  }, [users]);

  // Filter out withdrawn projects so they never appear in task assignment dropdowns
  const activeAssignableProjects = useMemo(() => {
    return projects.filter(p => p.status !== 'withdrawn');
  }, [projects]);

  // Set default assignee for inline form
  useEffect(() => {
    if (!inlineAssigneeId && eligibleEmployees.length > 0) {
      setInlineAssigneeId(mode === 'employee' ? currentUser.id : eligibleEmployees[0].id);
    }
  }, [eligibleEmployees, mode, currentUser.id, inlineAssigneeId]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // STRICT DATA PRIVACY LOGIC & NEXT-DAY FOCUS:
  // - In 'employee' mode:
  //   Excludes tasks completed on previous days, so the employee only sees:
  //   (1) Today's newly assigned & active tasks
  //   (2) Previous days' pending & in-progress rollover tasks
  // - In 'manager' mode: tasks are collective across all team members, with optional filter by employee
  const baseTasks = useMemo(() => {
    if (mode === 'employee') {
      const myTasks = tasks.filter(t => t.assignedToId === currentUser.id);
      return myTasks.filter(t => {
        if (t.status === 'completed') {
          const compDate = t.completedAt ? t.completedAt.split('T')[0] : '';
          const createDate = t.createdAt ? t.createdAt.split('T')[0] : '';
          return compDate === todayStr || createDate === todayStr;
        }
        // All unfinished tasks (pending, in_progress, needs_review) remain visible
        return true;
      });
    }
    // Manager mode: collective
    if (selectedEmployeeId !== 'all') {
      return tasks.filter(t => t.assignedToId === selectedEmployeeId);
    }
    return tasks;
  }, [mode, tasks, currentUser.id, selectedEmployeeId, todayStr]);

  // Apply search query and project filter
  const displayedTasks = useMemo(() => {
    return baseTasks.filter(t => {
      const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(query)) ||
        (t.projectName && t.projectName.toLowerCase().includes(query));

      return matchesProject && matchesSearch;
    });
  }, [baseTasks, selectedProjectId, searchQuery]);

  // 4 Columns configuration
  const COLUMNS: {
    id: TaskStatus;
    title: string;
    aliasStatus?: TaskStatus[];
    color: 'slate' | 'cyan' | 'violet' | 'emerald';
  }[] = [
    { id: 'pending', title: 'Task Ready', color: 'slate' },
    { id: 'in_progress', title: 'On Progress', color: 'cyan' },
    { id: 'needs_review', title: 'Needs Review', aliasStatus: ['blocked'], color: 'violet' },
    { id: 'completed', title: 'Done', color: 'emerald' }
  ];

  // Helper to categorize tasks into columns
  const getTasksForColumn = (col: typeof COLUMNS[0]) => {
    return displayedTasks.filter(t => {
      if (t.status === col.id) return true;
      if (col.aliasStatus && col.aliasStatus.includes(t.status)) return true;
      return false;
    });
  };

  // Status Change handler with real-time manager notification & activity logging
  const handleStatusTransition = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
    setMenuOpenTaskId(null);

    // Activity log entry
    const newActivity: ActivityLogItem = {
      id: 'act-' + Date.now(),
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      action:
        newStatus === 'completed'
          ? 'completed task'
          : newStatus === 'needs_review'
          ? 'submitted for review'
          : newStatus === 'in_progress'
          ? 'started working on'
          : 'moved to backlog',
      taskTitle: task.title,
      time: 'Just now',
      color:
        newStatus === 'completed'
          ? 'emerald'
          : newStatus === 'needs_review'
          ? 'violet'
          : newStatus === 'in_progress'
          ? 'cyan'
          : 'slate'
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 9)]);

    // If completed, fire celebration
    if (newStatus === 'completed') {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#00f0ff', '#10b981', '#ffffff', '#8b5cf6']
        });
      } catch {}
    }
  };

  // Create Project Handler (Strictly client name, project name, description - NO AMOUNT)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newClientName.trim() || !newProjectDesc.trim()) {
      showNotification('Required Fields Missing', 'Please provide Project Name, Client Name, and Description.', 'warning');
      return;
    }

    addProject({
      name: newProjectName.trim(),
      client: newClientName.trim(),
      description: newProjectDesc.trim(),
      department: currentUser.department || 'Engineering'
    });

    setNewProjectName('');
    setNewClientName('');
    setNewProjectDesc('');
    setShowCreateProjectModal(false);
  };

  // Manager: Download Client Project Report PDF (Daily, Weekly, Monthly)
  const handleDownloadClientReport = (projectId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    try {
      const doc = new jsPDF();
      const projTasks = tasks.filter(t => t.projectId === projectId);
      const completedTasks = projTasks.filter(t => t.status === 'completed');
      const inProgressTasks = projTasks.filter(t => t.status === 'in_progress');
      const pendingTasks = projTasks.filter(
        t => t.status === 'pending' || t.status === 'needs_review' || t.status === 'blocked'
      );
      const totalHours = projTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
      const velocity = projTasks.length > 0 ? Math.round((completedTasks.length / projTasks.length) * 100) : 0;

      // Brand Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Client Executive Report • ${frequency.toUpperCase()} CADENCE AUDIT`, 14, 28);
      doc.text(
        `Generated: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • Lead: ${currentUser.name}`,
        14,
        35
      );

      // Client & Project Information
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT & PROJECT SPECIFICATIONS', 14, 52);

      autoTable(doc, {
        startY: 56,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        body: [
          ['Project Name', targetProject.name, 'Client Organization', targetProject.client],
          ['Department Pod', targetProject.department || 'Engineering', 'Report Cadence', `${frequency.toUpperCase()} CLIENT AUDIT`],
          ['Executive Manager', currentUser.name, 'Delivery Status', targetProject.status.toUpperCase()],
          ['Project Description', { content: targetProject.description, colSpan: 3 }]
        ]
      });

      // Executive Metrics
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.text('DELIVERY VELOCITY & MILESTONES', 14, finalY1);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'plain',
        body: [
          [
            `Total Tasks: ${projTasks.length}`,
            `Completed: ${completedTasks.length} (${velocity}%)`,
            `In Progress: ${inProgressTasks.length}`,
            `Pending / Review: ${pendingTasks.length}`,
            `Logged Hours: ${totalHours.toFixed(1)} hrs`
          ]
        ],
        bodyStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });

      // Tasks Table
      const finalY2 = (doc as any).lastAutoTable.finalY + 10;
      doc.text('TASK ALLOCATION & WORKSTREAM BREAKDOWN', 14, finalY2);

      const rows = projTasks.map(t => [
        t.title,
        t.category || 'General',
        t.assignedToName || 'Unassigned',
        t.priority.toUpperCase(),
        t.status.toUpperCase(),
        t.deadline || 'Ongoing',
        `${t.loggedHours || 0}h`
      ]);

      autoTable(doc, {
        startY: finalY2 + 4,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
        head: [['Task Title', 'Category', 'Assignee', 'Priority', 'Status', 'Deadline', 'Hours']],
        body: rows.length > 0 ? rows : [['No tasks assigned for this project yet', '', '', '', '', '', '']]
      });

      const endY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Authorized by: ${currentUser.name} (Executive Delivery Management)`, 14, endY);
      doc.text('Certified quickslogx Client Delivery Document.', 14, endY + 6);

      // Download file with Project Name and Client Name sanitized
      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitize(targetProject.name)}_${sanitize(targetProject.client)}_${frequency.toUpperCase()}_Report.pdf`;
      doc.save(filename);
      showNotification('Client Report Exported', `Downloaded ${filename} for client ${targetProject.client}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build client report PDF.', 'warning');
    }
  };

  // Employee: Download General Monthly Work Report PDF
  const handleDownloadEmployeeMonthlyReport = (monthLabel: string) => {
    try {
      const doc = new jsPDF();
      const monthPrefix = monthLabel.includes('October')
        ? '2026-10'
        : monthLabel.includes('September')
        ? '2026-09'
        : '2026-08';

      const userTasks = tasks.filter(t => t.assignedToId === currentUser.id);
      const userMonthAttendance = attendance.filter(
        a => a.userId === currentUser.id && a.date.startsWith(monthPrefix)
      );
      const userMonthReports = reports.filter(
        r => r.userId === currentUser.id && r.date.startsWith(monthPrefix)
      );

      const completed = userTasks.filter(t => t.status === 'completed');
      const inProgress = userTasks.filter(t => t.status === 'in_progress');
      const pending = userTasks.filter(t => t.status !== 'completed' && t.status !== 'in_progress');

      const totalWorkMinutes = userMonthAttendance.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
      const totalOvertime = userMonthAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
      const daysPresent = userMonthAttendance.filter(a => a.status === 'present' || a.status === 'wfh').length;

      // Brand Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee General Monthly Performance & Task Report • ${monthLabel}`, 14, 28);
      doc.text(
        `Employee ID: ${currentUser.id} • Issued: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`,
        14,
        35
      );

      // Employee Profile Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE PROFILE & MONTHLY ACTIVITY', 14, 52);

      autoTable(doc, {
        startY: 56,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        body: [
          ['Employee Name', currentUser.name, 'Department', currentUser.department || 'Engineering'],
          ['Evaluation Period', monthLabel, 'Designation / Role', currentUser.designation || currentUser.role.toUpperCase()],
          ['Days Present', `${daysPresent} Days`, 'Logged Hours', `${(totalWorkMinutes / 60).toFixed(1)} Hours`],
          ['Overtime Tracked', `+${totalOvertime} Hours`, 'EOD Reports Submitted', `${userMonthReports.length} Reports`]
        ]
      });

      // Tasks Summary
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.text('ASSIGNED TASKS & PROJECT DELIVERABLES', 14, finalY1);

      const taskRows = userTasks.map(t => [
        t.title,
        t.projectName || 'General',
        t.category || 'Engineering',
        t.status.toUpperCase(),
        t.priority.toUpperCase(),
        t.deadline || 'Ongoing',
        `${t.loggedHours || 0}h`
      ]);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
        head: [['Task Title', 'Project', 'Category', 'Status', 'Priority', 'Deadline', 'Logged Hours']],
        body: taskRows.length > 0 ? taskRows : [['No tasks assigned for this period', '', '', '', '', '', '']]
      });

      const endY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('General Work Report generated under quickslogx HRMS Personal Terminal.', 14, endY);
      doc.text('Confidential internal performance summary.', 14, endY + 6);

      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitize(currentUser.name)}_General_Monthly_Report_${sanitize(monthLabel)}.pdf`;
      doc.save(filename);
      showNotification('Monthly Report Downloaded', `Saved ${filename}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build monthly report PDF.', 'warning');
    }
  };

  // Inline Card Submission
  const handleInlineSubmit = (columnId: TaskStatus) => {
    if (!inlineTitle.trim()) return;

    const targetAssigneeId = mode === 'employee' ? currentUser.id : (inlineAssigneeId || eligibleEmployees[0]?.id);
    const assignedUser = users.find(u => u.id === targetAssigneeId);
    const activeProject = activeAssignableProjects.find(p => p.id === selectedProjectId) || activeAssignableProjects[0];

    addTask({
      title: inlineTitle.trim(),
      description: `Task created directly from ${mode === 'manager' ? 'Manager Task Desk' : 'Employee Board'}.`,
      projectId: activeProject?.id || 'proj-1',
      assignedToId: targetAssigneeId,
      assignedById: currentUser.id,
      category: inlineCategory,
      priority: 'high',
      status: columnId,
      deadline: inlineDeadline,
      estimatedHours: 4,
      commentsCount: 0,
      attachmentsCount: 0
    });

    // Add activity
    setActivities(prev => [
      {
        id: 'act-' + Date.now(),
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        action: 'added new card to',
        taskTitle: inlineTitle.trim(),
        time: 'Just now',
        color: 'cyan'
      },
      ...prev.slice(0, 9)
    ]);

    setInlineTitle('');
    setInlineAddColumn(null);
  };

  // Calculate Category Progress Bars for Right Sidebar
  const categoryProgress = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    PRESET_CATEGORIES.forEach(cat => {
      counts[cat] = { total: 0, completed: 0 };
    });

    baseTasks.forEach(t => {
      const cat = t.category || 'UI Design';
      if (!counts[cat]) {
        counts[cat] = { total: 0, completed: 0 };
      }
      counts[cat].total += 1;
      if (t.status === 'completed') {
        counts[cat].completed += 1;
      }
    });

    return Object.entries(counts)
      .filter(([_, stat]) => stat.total > 0)
      .map(([name, stat]) => ({
        name,
        completed: stat.completed,
        total: stat.total,
        percentage: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
        color: CATEGORY_COLORS[name] || DEFAULT_CATEGORY_COLOR
      }));
  }, [baseTasks]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 liquid-glass-elevated border border-slate-200/80 dark:border-white/10 rounded-[4px] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/10 dark:bg-cyan-500/15 border border-sky-400/30 text-sky-600 dark:text-cyan-400 rounded-[2px]">
              <FolderKanban className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
              {mode === 'manager' ? 'Team Task Hub & Collective Allocation' : 'Dedicated Personal Task Board'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
              {selectedProjectId === 'all'
                ? 'All Active Projects'
                : projects.find(p => p.id === selectedProjectId)?.name || 'Project Task Board'}
            </h2>

            {mode === 'employee' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-500/10 border border-sky-400/30 text-sky-700 dark:text-cyan-300 text-xs font-mono font-semibold rounded-[2px]">
                <Lock className="w-3 h-3" />
                Data Privacy Enforced (Only Your Tasks)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'manager'
              ? 'Collective task board: Assign tasks to any team member, drag/move cards, and monitor live progress.'
              : 'Execute your private tasks, start live stopwatch timers, and update task status with instant manager notification.'}
          </p>
        </div>

        {/* Action Controls & Collaborators Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Collaborator Avatars (Pictured in reference UI) */}
          <div className="flex items-center -space-x-2">
            {eligibleEmployees.slice(0, 4).map(emp => (
              <img
                key={emp.id}
                src={emp.avatarUrl}
                alt={emp.name}
                title={`${emp.name} (${emp.department})`}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm"
              />
            ))}
            {eligibleEmployees.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shadow-sm">
                +{eligibleEmployees.length - 4}
              </div>
            )}
          </div>

          {/* Manager Action Controls */}
          {mode === 'manager' && (
            <div className="flex flex-wrap items-center gap-2">
              <LiquidButton
                variant="glass"
                size="md"
                icon={<Building2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />}
                onClick={() => setShowCreateProjectModal(true)}
              >
                + New Project
              </LiquidButton>

              <LiquidButton
                variant="glass"
                size="md"
                icon={<FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={() => {
                  setReportSelectedProjectId(projects[0]?.id || '');
                  setShowClientReportModal(true);
                }}
              >
                Client Reports (PDF)
              </LiquidButton>

              <LiquidButton
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowFullModal(true)}
              >
                Assign Task
              </LiquidButton>
            </div>
          )}

          {/* Employee Action Controls */}
          {mode === 'employee' && (
            <div className="flex flex-wrap items-center gap-2">
              <LiquidButton
                variant="glass"
                size="md"
                icon={<Download className="w-4 h-4 text-sky-600 dark:text-cyan-400" />}
                onClick={() => setShowEmployeeMonthlyReportModal(true)}
              >
                Monthly Report (PDF)
              </LiquidButton>

              <LiquidButton
                variant="primary"
                size="md"
                icon={<FileCheck2 className="w-4 h-4" />}
                onClick={() => setShowEODModal(true)}
                className="shadow-[0_4px_16px_rgba(2,132,199,0.25)]"
              >
                1-Click Daily EOD Report
              </LiquidButton>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 liquid-glass rounded-[3px] border border-slate-200/80 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="glass-input px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-[2px]"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              All Projects ({projects.length})
            </option>
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {p.name}
              </option>
            ))}
          </select>

          {/* Manager Employee Filter Dropdown (Collective control) */}
          {mode === 'manager' && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="glass-input px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-[2px]"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                All Team Members ({eligibleEmployees.length})
              </option>
              {eligibleEmployees.map(emp => (
                <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search everything..."
            className="w-full glass-input pl-8 pr-2.5 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Main Board Layout: 4 Columns + Right Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Kanban Board (3 Columns span in grid or flex) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = getTasksForColumn(col);
            const isInlineActive = inlineAddColumn === col.id;

            return (
              <div
                key={col.id}
                className="bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 rounded-[4px] p-3 flex flex-col space-y-3 min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                      {col.title}
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    title="Column options"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[2px]"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-0.5">
                  {columnTasks.map((t) => {
                    const catStyle = CATEGORY_COLORS[t.category || 'UI Design'] || DEFAULT_CATEGORY_COLOR;
                    const assignee = users.find(u => u.id === t.assignedToId);
                    const isWorking = t.timerActive;

                    let sessionSecs = 0;
                    if (isWorking && t.startedAt) {
                      const started = new Date(t.startedAt).getTime();
                      sessionSecs = Math.max(0, Math.floor((Date.now() - started) / 1000));
                      if (sessionSecs > 8 * 3600) {
                        sessionSecs = (sessionSecs % (3 * 3600)) + 3600;
                      }
                    }

                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
                        className={`p-3.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-[4px] border transition-all duration-200 shadow-sm hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] ${
                          isWorking
                            ? 'border-sky-400 dark:border-cyan-400 ring-2 ring-sky-400/25 shadow-[0_0_20px_rgba(14,165,233,0.2)]'
                            : 'border-slate-200/90 dark:border-white/10 hover:border-sky-400/50'
                        }`}
                      >
                        {/* Card Header: Category Pill & 3-Dots Menu */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px] border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {t.category || 'Task'}
                          </span>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuOpenTaskId(menuOpenTaskId === t.id ? null : t.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[2px]"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu for Quick Status Change */}
                            <AnimatePresence>
                              {menuOpenTaskId === t.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-6 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/15 rounded-[3px] shadow-xl py-1 text-xs font-mono"
                                >
                                  <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 dark:border-white/5">
                                    Move Card To:
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'pending')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between"
                                  >
                                    <span>Task Ready</span>
                                    {t.status === 'pending' && <Check className="w-3 h-3 text-sky-500" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'in_progress')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between"
                                  >
                                    <span>On Progress</span>
                                    {t.status === 'in_progress' && <Check className="w-3 h-3 text-sky-500" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'needs_review')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between"
                                  >
                                    <span>Needs Review</span>
                                    {(t.status === 'needs_review' || t.status === 'blocked') && (
                                      <Check className="w-3 h-3 text-violet-500" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'completed')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold"
                                  >
                                    <span>Done 🎉</span>
                                    {t.status === 'completed' && <Check className="w-3 h-3 text-emerald-500" />}
                                  </button>

                                  <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                                  {/* Delete Task Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuOpenTaskId(null);
                                      if (window.confirm(`Are you sure you want to delete task "${t.title}"?`)) {
                                        deleteTask(t.id);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-bold"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Task</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-wide mb-1.5">
                          {t.title}
                        </h4>

                        {/* Project Name Snippet */}
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mb-2.5 flex items-center gap-1">
                          <FolderKanban className="w-2.5 h-2.5 text-sky-600 dark:text-cyan-400" />
                          <span>{t.projectName || 'General'}</span>
                        </div>

                        {/* Live Timer & Start Work button (For In Progress tasks) */}
                        {col.id === 'in_progress' && (
                          <div className="p-2 bg-sky-50 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-500/30 rounded-[2px] mb-2.5 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-sky-800 dark:text-cyan-300 font-bold text-[11px]">
                              <Clock
                                className={`w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 ${
                                  isWorking ? 'animate-spin' : ''
                                }`}
                                style={{ animationDuration: '4s' }}
                              />
                              <span>{isWorking ? formatDuration(sessionSecs) : '00:00:00'}</span>
                            </div>

                            {/* Employee can toggle timer */}
                            <button
                              type="button"
                              onClick={() => toggleTaskTimer(t.id)}
                              className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold flex items-center gap-1 transition-all ${
                                isWorking
                                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {isWorking ? (
                                <>
                                  <Pause className="w-2.5 h-2.5" /> Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5" /> Start Work
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Footer Metadata Row (Due date, Comments, Attachments, Assignee Avatar) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2.5">
                            {/* Deadline */}
                            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                              <Flag className="w-3 h-3 text-slate-400" />
                              <span>{t.deadline.replace('2026-', '')}</span>
                            </span>

                            {/* Comments */}
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                              <span>{t.commentsCount || 2}</span>
                            </span>

                            {/* Attachments */}
                            <span className="flex items-center gap-0.5">
                              <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                              <span>{t.attachmentsCount || 1}</span>
                            </span>
                          </div>

                          {/* Assignee Avatar */}
                          <div className="relative" title={`Assigned to: ${t.assignedToName || 'Member'}`}>
                            <img
                              src={
                                t.assignedToAvatar ||
                                assignee?.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={t.assignedToName || 'Member'}
                              className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-white/20"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Inline "Create New Card" UI (as displayed in column 1 of reference image) */}
                  {isInlineActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-white dark:bg-slate-900 border-2 border-dashed border-sky-400/80 dark:border-cyan-400/70 rounded-[4px] shadow-md space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span>Create New Card</span>
                        <button
                          type="button"
                          onClick={() => setInlineAddColumn(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        placeholder="What is the task?"
                        autoFocus
                        className="w-full glass-input p-2 text-xs rounded-[2px] resize-none"
                      />

                      {/* Category Pill Picker */}
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Category Tag:</div>
                        <div className="flex flex-wrap gap-1">
                          {PRESET_CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setInlineCategory(cat)}
                              className={`px-1.5 py-0.5 text-[9px] font-mono rounded-[2px] border ${
                                inlineCategory === cat
                                  ? 'bg-sky-500 text-white border-sky-600 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assignee selector for Manager */}
                      {mode === 'manager' && (
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Assignee:</div>
                          <select
                            value={inlineAssigneeId}
                            onChange={(e) => setInlineAssigneeId(e.target.value)}
                            className="w-full glass-input px-2 py-1 text-xs font-mono rounded-[2px]"
                          >
                            {eligibleEmployees.map(emp => (
                              <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                {emp.name} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Done Submit button */}
                      <button
                        type="button"
                        onClick={() => handleInlineSubmit(col.id)}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs rounded-[2px] shadow-sm transition-all"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* + Add Card Button at bottom of column */}
                {!isInlineActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddColumn(col.id);
                      setInlineTitle('');
                    }}
                    className="w-full py-2 text-center text-xs font-mono font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-[2px] transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Sidebar: Task Progress & Recent Activity (Pictured in Reference UI) */}
        <div className="space-y-5">
          {/* Task Progress Panel */}
          <LiquidGlassCard variant="elevated" className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                Task Progress
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {baseTasks.filter(t => t.status === 'completed').length} / {baseTasks.length} Done
              </span>
            </div>

            <div className="space-y-3">
              {categoryProgress.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-500 font-bold">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color.bar} transition-all duration-500 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </LiquidGlassCard>

          {/* Recent Activity Stream Panel */}
          <LiquidGlassCard variant="elevated" className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                Recent Activity
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-0.5">
              {activities.map((act) => {
                const getDotColor = () => {
                  switch (act.color) {
                    case 'emerald': return 'bg-emerald-500';
                    case 'cyan': return 'bg-sky-500';
                    case 'violet': return 'bg-violet-500';
                    case 'amber': return 'bg-amber-500';
                    default: return 'bg-slate-400';
                  }
                };

                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getDotColor()} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">{act.userName}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">{act.action}</span>{' '}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{act.taskTitle}</span>
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </LiquidGlassCard>
        </div>
      </div>

      {/* 1-Click EOD Report Modal for Employee */}
      <EODReportModal isOpen={showEODModal} onClose={() => setShowEODModal(false)} />

      {/* Full Task Assignment Modal for Manager */}
      <AnimatePresence>
        {showFullModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/15 border border-sky-400/30 rounded-[2px] text-sky-600 dark:text-cyan-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Assign New Task
                    </h3>
                    <p className="text-xs text-slate-500">Allocated directly to the selected team member.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  const title = form.taskTitle.value;
                  const description = form.taskDesc.value;
                  const projectId = form.taskProj.value;
                  const assigneeId = form.taskAssignee.value;
                  const category = form.taskCat.value;
                  const priority = form.taskPrio.value;
                  const deadline = form.taskDeadline.value;

                  if (!title || !assigneeId) return;

                  addTask({
                    title,
                    description,
                    projectId,
                    assignedToId: assigneeId,
                    assignedById: currentUser.id,
                    category,
                    priority,
                    status: 'pending',
                    deadline,
                    estimatedHours: 6,
                    commentsCount: 0,
                    attachmentsCount: 0
                  });

                  setShowFullModal(false);
                }}
                className="space-y-3.5 text-xs font-mono"
              >
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Task Title *
                  </label>
                  <input
                    name="taskTitle"
                    required
                    placeholder="e.g. Implement Responsive Grid Layout"
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Project *
                    </label>
                    <select name="taskProj" className="w-full glass-input px-3 py-2 text-xs">
                      {activeAssignableProjects.map(p => (
                        <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Assignee (Employee) *
                    </label>
                    <select name="taskAssignee" className="w-full glass-input px-3 py-2 text-xs">
                      {eligibleEmployees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Category Tag
                    </label>
                    <select name="taskCat" className="w-full glass-input px-2.5 py-2 text-xs">
                      {PRESET_CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Priority
                    </label>
                    <select name="taskPrio" defaultValue="high" className="w-full glass-input px-2.5 py-2 text-xs">
                      <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Urgent</option>
                      <option value="high" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">High</option>
                      <option value="medium" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Medium</option>
                      <option value="low" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Deadline
                    </label>
                    <input
                      name="taskDeadline"
                      type="date"
                      defaultValue="2026-10-18"
                      className="w-full glass-input px-2.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Description & Specifications
                  </label>
                  <textarea
                    name="taskDesc"
                    rows={3}
                    placeholder="Provide acceptance criteria and project deliverables..."
                    className="w-full glass-input p-2.5 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowFullModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <LiquidButton variant="primary" size="md" type="submit">
                    Allocate Task
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW PROJECT MODAL (Manager only - Strictly Client Name, Project Name, Description. NO AMOUNT!) */}
      <AnimatePresence>
        {showCreateProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateProjectModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/15 border border-sky-400/30 rounded-[2px] text-sky-600 dark:text-cyan-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create New Client Project
                    </h3>
                    <p className="text-xs text-slate-500">
                      Define client relationship & scope for task allocation and reports.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Apex BioLabs Corp, Pacific Logistics, Vertex Capital"
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">The external client or stakeholder company name.</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. HealthAI Diagnostics Cloud, NextGen Portal"
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">The official project or software deliverable name.</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Project Description & Deliverables *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Outline high-level goals, key features, and client requirements..."
                    className="w-full glass-input p-2.5 text-xs"
                  />
                </div>

                <div className="p-3 bg-sky-50 dark:bg-cyan-950/30 border border-sky-200 dark:border-cyan-800/40 rounded-[2px] text-[11px] text-sky-800 dark:text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-500" />
                  <span>
                    Zero Financial Overhead: Projects track tasks and executive client reports without commercial amount fields.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <LiquidButton variant="primary" size="md" type="submit">
                    Create Project & Activate
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT PROJECT REPORTS DESK (Daily, Weekly, Monthly PDF for Client) */}
      <AnimatePresence>
        {showClientReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClientReportModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-2xl liquid-glass-elevated border border-emerald-400/40 dark:border-emerald-500/30 p-6 rounded-[4px] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/15 border border-emerald-400/30 rounded-[2px] text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Client Project Report Desk
                    </h3>
                    <p className="text-xs text-slate-500">
                      Download Daily, Weekly, or Monthly executive reports directly for your client.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClientReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Project & Cadence Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Select Target Project *
                  </label>
                  <select
                    value={reportSelectedProjectId || projects[0]?.id}
                    onChange={(e) => setReportSelectedProjectId(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.client})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Report Cadence / Frequency *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setReportFrequency(freq)}
                        className={`py-2 px-1 text-center capitalize font-semibold rounded-[2px] transition-all text-xs ${
                          reportFrequency === freq
                            ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-400/50 shadow-sm font-bold'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Live Preview of the Project Report */}
              {(() => {
                const targetProj =
                  projects.find((p) => p.id === (reportSelectedProjectId || projects[0]?.id)) || projects[0];
                if (!targetProj) return null;
                const projTasks = tasks.filter((t) => t.projectId === targetProj.id);
                const completed = projTasks.filter((t) => t.status === 'completed');
                const inProgress = projTasks.filter((t) => t.status === 'in_progress');
                const pending = projTasks.filter(
                  (t) => t.status === 'pending' || t.status === 'needs_review' || t.status === 'blocked'
                );
                const totalHours = projTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
                const velocity = projTasks.length > 0 ? Math.round((completed.length / projTasks.length) * 100) : 0;
                const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
                const generatedFilename = `${sanitize(targetProj.name)}_${sanitize(targetProj.client)}_${reportFrequency.toUpperCase()}_Report.pdf`;

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px] space-y-3 text-xs font-mono">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                          Client: {targetProj.client}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {targetProj.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {targetProj.description}
                        </p>
                      </div>

                      <SquareBadge
                        label={`${reportFrequency.toUpperCase()} REPORT`}
                        variant="emerald"
                        dot
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 dark:border-white/5">
                      <div className="p-2 bg-white dark:bg-slate-800/60 rounded-[2px] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-400">Total Tasks</span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{projTasks.length}</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800/60 rounded-[2px] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-emerald-500">Completed</span>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {completed.length} ({velocity}%)
                        </div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800/60 rounded-[2px] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-sky-500">In Progress</span>
                        <div className="font-bold text-sky-600 dark:text-cyan-400 text-sm">{inProgress.length}</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800/60 rounded-[2px] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-400">Total Hours</span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{totalHours.toFixed(1)}h</div>
                      </div>
                    </div>

                    {/* Formatted File Name Banner */}
                    <div className="p-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-[2px] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">PDF File Download Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono break-all">
                        {generatedFilename}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowClientReportModal(false)}
                        className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        Close
                      </button>

                      <LiquidButton
                        variant="emerald"
                        size="md"
                        icon={<Download className="w-4 h-4" />}
                        onClick={() => {
                          handleDownloadClientReport(targetProj.id, reportFrequency);
                          setShowClientReportModal(false);
                        }}
                      >
                        Download Report for Client (PDF)
                      </LiquidButton>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMPLOYEE GENERAL MONTHLY REPORT MODAL */}
      <AnimatePresence>
        {showEmployeeMonthlyReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmployeeMonthlyReportModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/15 border border-sky-400/30 rounded-[2px] text-sky-600 dark:text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      My Monthly Work Report (General)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Download a certified summary of your personal tasks, logged hours, and presence.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmployeeMonthlyReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Month Selection */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Select Evaluation Month:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['October 2026', 'September 2026', 'August 2026'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEmpReportMonth(m)}
                        className={`py-2 px-2 text-center font-semibold rounded-[2px] transition-all text-xs ${
                          empReportMonth === m
                            ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/50 shadow-sm font-bold'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Preview */}
                {(() => {
                  const monthPrefix = empReportMonth.includes('October')
                    ? '2026-10'
                    : empReportMonth.includes('September')
                    ? '2026-09'
                    : '2026-08';
                  const userTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
                  const userMonthAttendance = attendance.filter(
                    (a) => a.userId === currentUser.id && a.date.startsWith(monthPrefix)
                  );
                  const completed = userTasks.filter((t) => t.status === 'completed');
                  const inProgress = userTasks.filter((t) => t.status === 'in_progress');
                  const totalMins = userMonthAttendance.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
                  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
                  const filename = `${sanitize(currentUser.name)}_General_Monthly_Report_${sanitize(empReportMonth)}.pdf`;

                  return (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                        <SquareBadge label={currentUser.department || 'Engineering'} variant="slate" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                          <span className="text-slate-400">Completed</span>
                          <div className="font-bold text-emerald-600">{completed.length} Tasks</div>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                          <span className="text-slate-400">In Progress</span>
                          <div className="font-bold text-sky-600">{inProgress.length} Tasks</div>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                          <span className="text-slate-400">Logged Time</span>
                          <div className="font-bold text-slate-900 dark:text-white">{(totalMins / 60).toFixed(1)}h</div>
                        </div>
                      </div>

                      <div className="p-2 bg-black/[0.03] dark:bg-white/[0.03] rounded text-[10px] flex items-center justify-between text-slate-500">
                        <span>Generated File:</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{filename}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeMonthlyReportModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Close
                  </button>

                  <LiquidButton
                    variant="primary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => {
                      handleDownloadEmployeeMonthlyReport(empReportMonth);
                      setShowEmployeeMonthlyReportModal(false);
                    }}
                  >
                    Download General Monthly Report (PDF)
                  </LiquidButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
