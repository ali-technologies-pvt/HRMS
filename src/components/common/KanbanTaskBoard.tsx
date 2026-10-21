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
import { TaskDetailModal } from './TaskDetailModal';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'needs_review' | 'completed'>('all');

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

  // Task click detail popup modal
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  // Live timer tick (throttled to 10s to keep UI lightweight and prevent lag)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Activity stream
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  const eligibleEmployees = useMemo(() => {
    return mode === 'employee' ? users.filter(u=>u.id===currentUser.id) : users.filter(u => u.role === 'employee' || u.role === 'manager');
  }, [users, mode, currentUser.id]);

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

  // Apply search query, project filter, and quick status filter
  const displayedTasks = useMemo(() => {
    return baseTasks.filter(t => {
      const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
      const matchesStatus =
        statusFilter === 'all' ||
        t.status === statusFilter ||
        (statusFilter === 'needs_review' && t.status === 'blocked');
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(query)) ||
        (t.projectName && t.projectName.toLowerCase().includes(query));

      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [baseTasks, selectedProjectId, statusFilter, searchQuery]);

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
    // STRICT BUSINESS RULE: Employee cannot directly complete a task.
    // When employee marks a task done, it submits to 'needs_review' for manager inspection!
    const effectiveStatus: TaskStatus = (mode === 'employee' && newStatus === 'completed')
      ? 'needs_review'
      : newStatus;

    updateTaskStatus(task.id, effectiveStatus);
    setMenuOpenTaskId(null);

    if (mode === 'employee' && (newStatus === 'completed' || newStatus === 'needs_review')) {
      showNotification(
        'Submitted for Review',
        `"${task.title}" has been submitted to your manager for review. Only manager can approve and mark it Done.`,
        'info'
      );
    } else if (newStatus === 'completed') {
      showNotification(
        'Task Approved & Completed',
        `"${task.title}" has been officially approved.`,
        'success'
      );
    }

    // Activity log entry
    const newActivity: ActivityLogItem = {
      id: 'act-' + Date.now(),
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      action:
        effectiveStatus === 'completed'
          ? 'approved task'
          : effectiveStatus === 'needs_review'
          ? 'submitted for review'
          : effectiveStatus === 'in_progress'
          ? 'started working on'
          : 'moved to backlog',
      taskTitle: task.title,
      time: 'Just now',
      color:
        effectiveStatus === 'completed'
          ? 'emerald'
          : effectiveStatus === 'needs_review'
          ? 'violet'
          : effectiveStatus === 'in_progress'
          ? 'cyan'
          : 'slate'
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 9)]);

    // If completed (by manager), fire celebration
    if (effectiveStatus === 'completed') {
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
      const cat = t.category || 'General';
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

  const completedCount = useMemo(() => baseTasks.filter(t => t.status === 'completed').length, [baseTasks]);
  const completionRate = useMemo(() => (baseTasks.length > 0 ? Math.round((completedCount / baseTasks.length) * 100) : 0), [baseTasks, completedCount]);

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER & CONTROL CENTER (V14 LUXURY GLASSY BANNER) */}
      <div className="v14-kanban-hero">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-[#ea3822]/15 to-[#ff6a47]/15 text-[#ea3822] dark:text-[#ff6a47] border border-[#ea3822]/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              {mode === 'manager' ? 'TEAM SPRINT HUB • COLLECTIVE ALLOCATION' : 'MY PERSONAL WORKSPACE'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {displayedTasks.length} tasks shown
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {selectedProjectId === 'all'
                ? (mode === 'employee' ? 'Your Task Board' : 'Sprint Kanban & Task Allocation')
                : projects.find(p => p.id === selectedProjectId)?.name || 'Project Task Board'}
            </h1>

            {mode === 'employee' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-400/30 text-sky-700 dark:text-cyan-300 text-xs font-bold rounded-full">
                <Lock className="w-3 h-3" />
                Assigned to you
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl">
            {mode === 'manager'
              ? 'Collective task board: assign sprint tasks, track real-time deliverable velocity, and review submissions.'
              : 'Track personal deliverables, active work sessions, and submit completed tasks for review.'}
          </p>
        </div>

        {/* Action Controls & Collaborators Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-2 mr-1">
            {eligibleEmployees.slice(0, 4).map(emp => (
              <img
                key={emp.id}
                src={emp.avatarUrl}
                alt={emp.name}
                title={`${emp.name} (${emp.department})`}
                className="w-9 h-9 rounded-full border-2 border-white dark:border-[#0f172a] object-cover shadow-sm ring-1 ring-black/5"
              />
            ))}
            {eligibleEmployees.length > 4 && (
              <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[#0f172a] bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white text-xs font-bold flex items-center justify-center shadow-sm">
                +{eligibleEmployees.length - 4}
              </div>
            )}
          </div>

          {/* Manager Action Controls */}
          {mode === 'manager' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(true)}
                className="mp-btn-secondary"
              >
                <Building2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>+ New Project</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReportSelectedProjectId(projects[0]?.id || '');
                  setShowClientReportModal(true);
                }}
                className="mp-btn-secondary"
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Client Reports</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFullModal(true)}
                className="mp-btn-primary mp-btn-gold"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Task</span>
              </button>
            </div>
          )}

          {/* Employee Action Controls */}
          {mode === 'employee' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowEmployeeMonthlyReportModal(true)}
                className="mp-btn-secondary"
              >
                <Download className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>Monthly Report</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEODModal(true)}
                className="mp-btn-primary mp-btn-gold"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>1-Click Daily EOD</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR (GLASSY PILL STRIP) */}
      <div className="v14-kanban-toolbar">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white text-xs font-bold rounded-full pl-4 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ea3822]/30 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                All Projects ({projects.length})
              </option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Manager Employee Filter Dropdown */}
          {mode === 'manager' && (
            <div className="relative">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="appearance-none bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white text-xs font-bold rounded-full pl-4 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ea3822]/30 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                  All Team Members ({eligibleEmployees.length})
                </option>
                {eligibleEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Quick Status Filter Pills */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-white/5 rounded-full border border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All ({baseTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                statusFilter === 'in_progress'
                  ? 'bg-[#ea3822] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              In Progress ({baseTasks.filter(t => t.status === 'in_progress').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs_review')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                statusFilter === 'needs_review'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Review ({baseTasks.filter(t => t.status === 'needs_review' || t.status === 'blocked').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Done ({baseTasks.filter(t => t.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Search input styled as V14 search pill */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, deliverables, assignees..."
            className="w-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white text-xs font-semibold rounded-full pl-9 pr-12 py-2 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea3822]/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
            ⌘K
          </span>
        </div>
      </div>

      {/* 3. MAIN BOARD LAYOUT: 4 GLASS COLUMNS + RIGHT SIDEBAR */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Kanban Board (3 Columns span in grid) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = getTasksForColumn(col);
            const isInlineActive = inlineAddColumn === col.id;

            const colAccentColor =
              col.id === 'pending'
                ? '#38bdf8'
                : col.id === 'in_progress'
                ? '#ea3822'
                : col.id === 'needs_review'
                ? '#a855f7'
                : '#10b981';

            const badgeBg =
              col.id === 'pending'
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
                : col.id === 'in_progress'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300'
                : col.id === 'needs_review'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';

            return (
              <div
                key={col.id}
                style={{ '--col-accent': colAccentColor } as React.CSSProperties}
                className="v14-kanban-column"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-white/10 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colAccentColor }}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                      {col.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeBg}`}>
                      {columnTasks.length}
                    </span>
                  </div>

                  {mode !== 'employee' && (
                    <button
                      type="button"
                      title="Add task to this column"
                      onClick={() => {
                        setInlineAddColumn(col.id);
                        setInlineTitle('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
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
                        whileHover={{ y: -4, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
                        onClick={() => setSelectedTaskForModal(t)}
                        className={`v14-kanban-card group ${isWorking ? 'is-active-session' : ''}`}
                      >
                        {/* Card Header: Category Capsule Pill & Priority & 3-Dots Menu */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {t.category || 'Task'}
                            </span>

                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                                t.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : t.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : t.priority === 'medium'
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>

                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenTaskId(menuOpenTaskId === t.id ? null : t.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu for Quick Status Change */}
                            <AnimatePresence>
                              {menuOpenTaskId === t.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-7 z-30 w-48 bg-white/95 dark:bg-[#151f33]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl py-1.5 text-xs"
                                >
                                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 dark:border-white/5">
                                    Move Card To:
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'pending')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 flex items-center justify-between text-slate-800 dark:text-slate-200 font-medium"
                                  >
                                    <span>Task Ready</span>
                                    {t.status === 'pending' && <Check className="w-3.5 h-3.5 text-sky-500" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusTransition(t, 'in_progress')}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 flex items-center justify-between text-slate-800 dark:text-slate-200 font-medium"
                                  >
                                    <span>On Progress</span>
                                    {t.status === 'in_progress' && <Check className="w-3.5 h-3.5 text-sky-500" />}
                                  </button>
                                  {mode === 'employee' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusTransition(t, 'needs_review')}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 flex items-center justify-between text-violet-600 dark:text-violet-400 font-bold"
                                    >
                                      <span>Submit for Review 📤</span>
                                      {(t.status === 'needs_review' || t.status === 'blocked') && (
                                        <Check className="w-3.5 h-3.5 text-violet-500" />
                                      )}
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusTransition(t, 'needs_review')}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 flex items-center justify-between text-slate-800 dark:text-slate-200 font-medium"
                                      >
                                        <span>Needs Review</span>
                                        {(t.status === 'needs_review' || t.status === 'blocked') && (
                                          <Check className="w-3.5 h-3.5 text-violet-500" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusTransition(t, 'completed')}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold"
                                      >
                                        <span>Approve & Done ✓</span>
                                        {t.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                      </button>
                                    </>
                                  )}

                                  {/* Delete Task Button (Only for Manager/Admin) */}
                                  {mode !== 'employee' && currentUser.role !== 'employee' && (
                                    <>
                                      <div className="border-t border-slate-100 dark:border-white/5 my-1" />
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
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Task</span>
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Task Title with High Contrast Prominence */}
                        <h4 className="text-[13px] font-bold text-slate-950 dark:text-white leading-snug tracking-tight mb-1.5 group-hover:text-[#ea3822] dark:group-hover:text-[#ff6a47] transition-colors">
                          {t.title}
                        </h4>

                        {/* Project Name Snippet */}
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate mb-3 flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-[#ea3822] shrink-0" />
                          <span>{t.projectName || 'General'}</span>
                        </div>

                        {/* Live Timer & Start Work button (For In Progress tasks) */}
                        {col.id === 'in_progress' && (
                          <div className="p-2.5 bg-slate-50/90 dark:bg-[#0c1424]/90 border border-slate-200/80 dark:border-white/10 rounded-xl mb-3 flex items-center justify-between text-xs font-mono backdrop-blur-sm shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-950 dark:text-white font-bold text-xs">
                              <Clock
                                className={`w-3.5 h-3.5 text-[#ea3822] ${
                                  isWorking ? 'animate-spin' : ''
                                }`}
                                style={{ animationDuration: '4s' }}
                              />
                              <span className="tracking-wider">{isWorking ? formatDuration(sessionSecs) : '00:00:00'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskTimer(t.id);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm ${
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

                        {/* Footer Metadata Row */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{t.deadline.replace('2026-', '')}</span>
                            </span>

                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              <span>{t.commentsCount ?? 0}</span>
                            </span>

                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>{t.attachmentsCount ?? 0}</span>
                            </span>
                          </div>

                          {/* Assignee Avatar */}
                          <div className="relative" title={`Assigned to: ${t.assignedToName || 'Member'}`}>
                            <img
                              src={
                                t.assignedToAvatar ||
                                assignee?.avatarUrl ||
                                '/company-logo.png'
                              }
                              alt={t.assignedToName || 'Member'}
                              className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Inline "Create New Card" UI */}
                  {isInlineActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-white/95 dark:bg-[#162238]/95 backdrop-blur-2xl border-2 border-dashed border-[#ea3822]/80 dark:border-[#ea3822]/70 rounded-2xl shadow-lg space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-950 dark:text-white">
                        <span>Create New Deliverable</span>
                        <button
                          type="button"
                          onClick={() => setInlineAddColumn(null)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        placeholder="What deliverable needs to be created?"
                        autoFocus
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white p-2.5 text-xs rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#ea3822]/30"
                      />

                      {/* Category Pill Picker */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setInlineCategory(cat)}
                              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-all ${
                                inlineCategory === cat
                                  ? 'bg-[#ea3822] text-white border-[#ea3822] shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
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
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assignee:</div>
                          <select
                            value={inlineAssigneeId}
                            onChange={(e) => setInlineAssigneeId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea3822]/30"
                          >
                            {eligibleEmployees.map(emp => (
                              <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                                {emp.name} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleInlineSubmit(col.id)}
                        className="w-full py-2 bg-gradient-to-r from-[#ea3822] to-[#ff6a47] text-white font-bold text-xs rounded-xl shadow-md transition-all hover:opacity-95"
                      >
                        Add Card
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* + Add Card Button at bottom of column */}
                {!isInlineActive && mode !== 'employee' && (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddColumn(col.id);
                      setInlineTitle('');
                    }}
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-xl border border-dashed border-slate-300 dark:border-white/15 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. RIGHT SIDEBAR: SPRINT VELOCITY & LIVE ACTIVITY */}
        <div className="space-y-6">
          {/* Sprint Velocity & Progress Panel */}
          <div className="v14-sidebar-panel">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/10">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ea3822]" />
                Sprint Velocity & Progress
              </h3>
              <span className="text-xs font-extrabold text-slate-950 dark:text-white">
                {completedCount} / {baseTasks.length} Done
              </span>
            </div>

            {/* Overall Velocity Progress Meter */}
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  {completionRate}%
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Sprint Completion Rate
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                <div
                  className="w-12 h-12 rounded-full border-4 border-[#ea3822] border-t-transparent absolute -top-1 -left-1 rotate-45"
                />
                <Sparkles size={16} className="text-[#ea3822]" />
              </div>
            </div>

            <div className="space-y-3.5">
              {categoryProgress.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-950 dark:text-white">{item.name}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color.bar} transition-all duration-500 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Stream Panel */}
          <div className="v14-sidebar-panel">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/10">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-[#ea3822]" />
                Recent Sprint Activity
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[380px] pr-0.5">
              {(activities.length
                ? activities
                : baseTasks.slice(0, 4).map(task => ({
                    id: task.id,
                    userName: users.find(u => u.id === task.assignedById)?.name || 'Sarah Jenkins',
                    userAvatar: '',
                    action: 'assigned deliverable',
                    taskTitle: task.title,
                    time: task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recent',
                    color: 'cyan' as const
                  }))
              ).map((act) => {
                const getDotColor = () => {
                  switch (act.color) {
                    case 'emerald': return 'bg-emerald-500 ring-emerald-500/20';
                    case 'cyan': return 'bg-[#ea3822] ring-[#ea3822]/20';
                    case 'violet': return 'bg-purple-500 ring-purple-500/20';
                    case 'amber': return 'bg-amber-500 ring-amber-500/20';
                    default: return 'bg-slate-400 ring-slate-400/20';
                  }
                };

                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full ${getDotColor()} mt-1 shrink-0 ring-4`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-bold text-slate-950 dark:text-white">{act.userName}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{act.action}</span>{' '}
                        <span className="font-bold text-slate-950 dark:text-white">{act.taskTitle}</span>
                      </p>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 block">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
              className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-[#111927]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 p-6 sm:p-7 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/30 rounded-xl text-sky-600 dark:text-cyan-400 shadow-sm">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      Assign New Task
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Allocated directly to the selected team member.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
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
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Task Title *
                  </label>
                  <input
                    name="taskTitle"
                    required
                    placeholder="e.g. Implement Responsive Grid Layout"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                      Project *
                    </label>
                    <select name="taskProj" className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                      {activeAssignableProjects.map(p => (
                        <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                      Assignee (Employee) *
                    </label>
                    <select name="taskAssignee" className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                      {eligibleEmployees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                      Category Tag
                    </label>
                    <select name="taskCat" className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                      {PRESET_CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                      Priority
                    </label>
                    <select name="taskPrio" defaultValue="high" className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                      <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Urgent</option>
                      <option value="high" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">High</option>
                      <option value="medium" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Medium</option>
                      <option value="low" className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                      Deadline
                    </label>
                    <input
                      name="taskDeadline"
                      type="date"
                      defaultValue="2026-10-18"
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Description & Specifications
                  </label>
                  <textarea
                    name="taskDesc"
                    rows={3}
                    placeholder="Provide acceptance criteria and project deliverables..."
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white p-3 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowFullModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mp-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Allocate Task</span>
                  </button>
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
              className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-[#111927]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 p-6 sm:p-7 rounded-2xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/30 rounded-xl text-sky-600 dark:text-cyan-400 shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      Create New Client Project
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Define client relationship & scope for task allocation and reports.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Apex BioLabs Corp, Pacific Logistics, Vertex Capital"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">The external client or stakeholder company name.</span>
                </div>

                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. HealthAI Diagnostics Cloud, NextGen Portal"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">The official project or software deliverable name.</span>
                </div>

                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Project Description & Deliverables *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Outline high-level goals, key features, and client requirements..."
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white p-3 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div className="p-3 bg-sky-500/10 dark:bg-cyan-950/30 border border-sky-400/30 dark:border-cyan-800/40 rounded-xl text-xs text-sky-950 dark:text-cyan-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-500" />
                  <span>
                    Zero Financial Overhead: Projects track tasks and executive client reports without commercial amount fields.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="mp-btn-primary">
                    <Building2 className="w-4 h-4" />
                    <span>Create Project & Activate</span>
                  </button>
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
              className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-[#111927]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 p-6 sm:p-7 rounded-2xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-400/30 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      Client Project Report Desk
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Download Daily, Weekly, or Monthly executive reports directly for your client.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClientReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Project & Cadence Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Select Target Project *
                  </label>
                  <select
                    value={reportSelectedProjectId || projects[0]?.id}
                    onChange={(e) => setReportSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-950 dark:text-white px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                        {p.name} ({p.client})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Report Cadence / Frequency *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setReportFrequency(freq)}
                        className={`py-2 px-1 text-center capitalize font-bold rounded-xl transition-all text-xs ${
                          reportFrequency === freq
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:text-slate-950 dark:hover:text-white'
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
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-3.5 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                          Client: {targetProj.client}
                        </span>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                          {targetProj.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {targetProj.description}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20">
                        {reportFrequency.toUpperCase()} REPORT
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/5">
                      <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-medium text-slate-400">Total Tasks</span>
                        <div className="font-bold text-slate-950 dark:text-white text-base">{projTasks.length}</div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-medium text-emerald-500">Completed</span>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {completed.length} ({velocity}%)
                        </div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-medium text-sky-500">In Progress</span>
                        <div className="font-bold text-sky-600 dark:text-cyan-400 text-base">{inProgress.length}</div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-medium text-slate-400">Total Hours</span>
                        <div className="font-bold text-slate-950 dark:text-white text-base">{totalHours.toFixed(1)}h</div>
                      </div>
                    </div>

                    {/* Formatted File Name Banner */}
                    <div className="p-3 bg-black/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">PDF File Name:</span>
                      <span className="font-bold text-slate-950 dark:text-white break-all">
                        {generatedFilename}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowClientReportModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        className="mp-btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                        onClick={() => {
                          handleDownloadClientReport(targetProj.id, reportFrequency);
                          setShowClientReportModal(false);
                        }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Client PDF</span>
                      </button>
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
              className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-[#111927]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 p-6 sm:p-7 rounded-2xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/30 rounded-xl text-sky-600 dark:text-cyan-400 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      My Monthly Work Report (General)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Download a certified summary of your personal tasks, logged hours, and presence.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmployeeMonthlyReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Month Selection */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-950 dark:text-white font-bold mb-1.5">
                    Select Evaluation Month:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['October 2026', 'September 2026', 'August 2026'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEmpReportMonth(m)}
                        className={`py-2 px-2 text-center font-bold rounded-xl transition-all text-xs ${
                          empReportMonth === m
                            ? 'bg-sky-500 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:text-slate-950 dark:hover:text-white'
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
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 dark:text-white text-sm">{currentUser.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {currentUser.department || 'Engineering'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] font-medium text-slate-400">Completed</span>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{completed.length} Tasks</div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] font-medium text-slate-400">In Progress</span>
                          <div className="font-bold text-sky-600 dark:text-cyan-400 text-base">{inProgress.length} Tasks</div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] font-medium text-slate-400">Logged Time</span>
                          <div className="font-bold text-slate-950 dark:text-white text-base">{(totalMins / 60).toFixed(1)}h</div>
                        </div>
                      </div>

                      <div className="p-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl text-xs flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Generated File:</span>
                        <span className="font-bold text-slate-950 dark:text-white">{filename}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeMonthlyReportModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="mp-btn-primary"
                    onClick={() => {
                      handleDownloadEmployeeMonthlyReport(empReportMonth);
                      setShowEmployeeMonthlyReportModal(false);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Monthly PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Task Inspector & Submissions Modal */}
      <TaskDetailModal
        task={selectedTaskForModal}
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        mode={mode}
        onStatusChange={(task, newStatus) => {
          handleStatusTransition(task, newStatus);
          setSelectedTaskForModal(prev => prev ? { ...prev, status: newStatus } : null);
        }}
      />
    </div>
  );
}
