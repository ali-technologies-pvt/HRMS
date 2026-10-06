'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import {
  Building2,
  Clock,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Edit,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  X,
  Download,
  Sparkles,
  Check,
  Sliders,
  RotateCcw,
  TrendingUp,
  Inbox,
  Send,
  Eye,
  Calendar,
  UserPlus,
  Copy,
  RefreshCw,
  Zap,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceRecord, Project, RequestItem } from '@/types';
import { generateTemporaryPassword } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExecutiveDribbbleDashboard } from './ExecutiveDribbbleDashboard';

// ==========================================
// 1. APPLE-STYLE MINIMAL ANIMATED SVGs
// ==========================================

// SVG 1: Minimalist Blueprint Projects Folder
function ModernFolderBlueprintSvg() {
  return (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="24" width="72" height="56" rx="8" className="fill-sky-500/10 stroke-sky-500" strokeWidth="2.5" />
        <path d="M14 36 L40 36 L48 44 L86 44" className="stroke-sky-400" strokeWidth="2" strokeLinecap="round" />
        <motion.circle
          cx="66"
          cy="60"
          r="8"
          className="fill-sky-500/20 stroke-sky-500"
          strokeWidth="2"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M32 60 H50"
          className="stroke-sky-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M32 68 H44"
          className="stroke-sky-300"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
      </svg>
    </div>
  );
}

// SVG 2: Modern Task Checklist Pad with floating check
function ModernTaskChecklistSvg() {
  return (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="16" width="60" height="68" rx="8" className="fill-indigo-500/10 stroke-indigo-500" strokeWidth="2.5" />
        <rect x="34" y="12" width="32" height="8" rx="3" className="fill-indigo-600" />
        
        {/* Task line 1 */}
        <line x1="32" y1="36" x2="68" y2="36" className="stroke-indigo-400" strokeWidth="2.5" strokeLinecap="round" />
        <motion.path
          d="M26 36 L29 39 L35 33"
          className="stroke-emerald-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Task line 2 */}
        <line x1="32" y1="52" x2="64" y2="52" className="stroke-indigo-300" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="52" r="3" className="stroke-indigo-400" strokeWidth="1.5" />

        {/* Task line 3 */}
        <line x1="32" y1="68" x2="56" y2="68" className="stroke-indigo-200" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="68" r="3" className="stroke-indigo-300" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// SVG 3: Modern Pulse Clock
function ModernPulseClockSvg() {
  return (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pulsing Outer Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          className="stroke-emerald-400/40"
          strokeWidth="1.5"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="50" cy="50" r="32" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="3" className="fill-emerald-600" />
        {/* Hour hand */}
        <line x1="50" y1="50" x2="50" y2="34" className="stroke-emerald-600" strokeWidth="2.5" strokeLinecap="round" />
        {/* Rotating minute hand */}
        <motion.line
          x1="50"
          y1="50"
          x2="64"
          y2="50"
          className="stroke-emerald-400"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        />
      </svg>
    </div>
  );
}

// SVG 4: Modern Approval Shield
function ModernShieldApprovalSvg() {
  return (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M50 16 L76 28 C76 56 50 82 50 82 C50 82 24 56 24 28 L50 16 Z"
          className="fill-amber-500/10 stroke-amber-500"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <motion.circle
          cx="50"
          cy="48"
          r="10"
          className="stroke-amber-400"
          strokeWidth="2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <path d="M46 48 L49 51 L55 45" className="stroke-amber-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ==========================================
// MANAGER DASHBOARD COMPONENT
// ==========================================
export function ManagerDashboard() {
  const { currentUser, users, onboardUser } = useAuth();
  const {
    projects,
    tasks,
    requests,
    attendance,
    policy,
    getUserTodayAttendance,
    updateCompanyPolicy,
    addProject,
    withdrawProject,
    reactivateProject,
    reviewRequest,
    updateAttendanceRecord,
    manualRecordAttendance,
    bulkBackfillAttendance,
    deleteAttendanceRecord,
    addDepartment,
    deleteDepartment
  } = useAppData();
  const { showNotification } = useNotifications();

  // Active view filters
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'late' | 'wfh'>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<'all' | 'today' | 'past5' | 'october'>('all');
  const [attendanceUserFilter, setAttendanceUserFilter] = useState<string>('all');

  // Office timings configuration state
  const [startTime, setStartTime] = useState(policy.officeStartTime || '09:30');
  const [endTime, setEndTime] = useState(policy.officeEndTime || '18:00');
  const [gracePeriod, setGracePeriod] = useState(policy.gracePeriodMinutes || 15);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Quick Backfill & Manual Add Modals
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfillTargetUser, setBackfillTargetUser] = useState<string>('all');
  const [backfillDaysList, setBackfillDaysList] = useState<string[]>([
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05'
  ]);
  const [backfillStartTime, setBackfillStartTime] = useState<string>('09:30');
  const [backfillEndTime, setBackfillEndTime] = useState<string>('18:00');

  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualUserId, setManualUserId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualClockIn, setManualClockIn] = useState<string>('09:30');
  const [manualClockOut, setManualClockOut] = useState<string>('18:00');
  const [manualStatus, setManualStatus] = useState<AttendanceRecord['status']>('present');
  const [manualRemarks, setManualRemarks] = useState<string>('');

  // Modals state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Department Management Modal state
  const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  // Employee Onboard Modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empDepartment, setEmpDepartment] = useState(policy.departments?.[0] || currentUser.department || '');
  const [empSalary, setEmpSalary] = useState(5500);
  const [empTempPassword, setEmpTempPassword] = useState('');
  const [createdEmpResult, setCreatedEmpResult] = useState<{ email: string; pass: string; name: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [showClientReportModal, setShowClientReportModal] = useState(false);
  const [selectedReportProjectId, setSelectedReportProjectId] = useState<string>('');
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const [showSuperAdminLockWarning, setShowSuperAdminLockWarning] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceRecord['status']>('present');
  const [editRemarks, setEditRemarks] = useState('');

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // View mode: 'clean_studio' (Dribbble/Modern UI) vs 'detailed_console'
  const [dashboardViewMode, setDashboardViewMode] = useState<'clean_studio' | 'detailed_console'>('clean_studio');

  // Manager's own attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const managerAttendanceRecord: AttendanceRecord = getUserTodayAttendance(currentUser.id) || {
    id: 'att-mgr-fallback',
    userId: currentUser.id,
    userName: currentUser.name,
    department: currentUser.department || 'Engineering',
    date: todayStr,
    clockIn: '08:50',
    clockOut: undefined,
    totalWorkMinutes: 240,
    status: 'present',
    isLate: false,
    overtimeHours: 0
  };

  // Team employees (exclude super_admin)
  const teamUsers = useMemo(() => {
    return users.filter(u => u.role === 'employee' || u.role === 'manager');
  }, [users]);

  const filteredTeamAttendance = useMemo(() => {
    return attendance.filter(item => {
      if (item.userId === currentUser.id) return false;
      if (attendanceUserFilter !== 'all' && item.userId !== attendanceUserFilter) return false;

      if (attendanceDateFilter === 'today' && item.date !== todayStr) return false;
      if (attendanceDateFilter === 'past5' && !['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].includes(item.date)) return false;
      if (attendanceDateFilter === 'october' && !item.date.startsWith('2026-10')) return false;

      const matchesFilter =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'present' && (item.status === 'present' || item.status === 'wfh')) ||
        (attendanceFilter === 'late' && (item.isLate || item.status === 'late')) ||
        (attendanceFilter === 'wfh' && item.status === 'wfh');

      const matchesSearch =
        !attendanceSearch ||
        item.userName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        (item.department && item.department.toLowerCase().includes(attendanceSearch.toLowerCase())) ||
        item.date.includes(attendanceSearch) ||
        (item.managerRemarks || '').toLowerCase().includes(attendanceSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.clockIn.localeCompare(a.clockIn));
  }, [attendance, currentUser.id, attendanceUserFilter, attendanceDateFilter, todayStr, attendanceFilter, attendanceSearch]);

  // KPIs
  const activeProjects = projects.filter(p => p.status !== 'withdrawn');
  const withdrawnProjects = projects.filter(p => p.status === 'withdrawn');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const onlineCount = users.filter(u => u.status === 'online').length;

  // Handle Save Office Timings Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);

    updateCompanyPolicy({
      officeStartTime: startTime,
      officeEndTime: endTime,
      gracePeriodMinutes: Number(gracePeriod)
    });

    setTimeout(() => {
      setIsSavingPolicy(false);
      showNotification(
        'Office Timings Synchronized',
        `Punctuality schedule set to ${startTime} - ${endTime} (Grace: ${gracePeriod}m). All punch calculations updated.`,
        'success'
      );
    }, 400);
  };

  // Handle Create Project (Strictly Client Name, Project Name, Description - NO AMOUNT!)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newClientName.trim() || !newProjectDesc.trim()) {
      showNotification('Missing Information', 'Please complete Project Name, Client Name, and Description.', 'warning');
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
    showNotification('Project Created', `"${newProjectName}" activated for client ${newClientName}.`, 'success');
  };

  // Handle Department Creation & Deletion
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;
    const added = addDepartment(trimmed);
    if (added) {
      showNotification('Department Created', `Department "${trimmed}" added successfully.`, 'success');
      setNewDeptInput('');
    } else {
      showNotification('Department Exists', `Department "${trimmed}" already exists in the system.`, 'warning');
    }
  };

  const handleDeleteDepartment = (deptName: string) => {
    deleteDepartment(deptName);
    showNotification('Department Removed', `Department "${deptName}" was removed.`, 'info');
  };

  // Handle Employee Onboarding by Manager
  const handleOpenOnboardModal = () => {
    setEmpTempPassword(generateTemporaryPassword());
    setEmpName('');
    setEmpEmail('');
    setEmpDesignation('');
    setEmpDepartment(policy.departments?.[0] || currentUser.department || '');
    setEmpSalary(5500);
    setCreatedEmpResult(null);
    setCopiedCreds(false);
    setShowOnboardModal(true);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) {
      showNotification('Missing Information', 'Please provide employee name and work email.', 'warning');
      return;
    }

    if (empDepartment.trim() && !policy.departments?.includes(empDepartment.trim())) {
      addDepartment(empDepartment.trim());
    }

    onboardUser({
      name: empName.trim(),
      email: empEmail.trim(),
      password: empTempPassword,
      tempPassword: true,
      mustChangePassword: true,
      role: 'employee',
      department: empDepartment,
      designation: empDesignation || 'Software Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: '+92 (300) 000-0000',
      status: 'offline',
      salary: Number(empSalary),
      joiningDate: new Date().toISOString().split('T')[0],
      leaveQuota: { medical: 10, casual: 10, annual: 18 },
      managerId: currentUser.id
    });

    setCreatedEmpResult({
      name: empName.trim(),
      email: empEmail.trim(),
      pass: empTempPassword
    });
  };

  const handleCopyEmployeeCredentials = () => {
    if (!createdEmpResult) return;
    navigator.clipboard.writeText(
      `quickslogx Portal Login Credentials\nEmployee: ${createdEmpResult.name}\nEmail: ${createdEmpResult.email}\nTemporary Password: ${createdEmpResult.pass}\nNote: First-time sign in mandates compulsory password change.`
    );
    setCopiedCreds(true);
    showNotification('Credentials Copied', 'Login credentials copied to clipboard.', 'info');
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  // Handle Manager Attendance Edit Attempt
  const handleManagerAttendanceEditAttempt = () => {
    if (currentUser.role === 'super_admin') {
      setEditingAttendanceRecord(managerAttendanceRecord);
      setEditClockIn(managerAttendanceRecord.clockIn || '09:00');
      setEditClockOut(managerAttendanceRecord.clockOut || '');
      setEditStatus(managerAttendanceRecord.status);
      setEditRemarks(managerAttendanceRecord.managerRemarks || '');
    } else {
      setShowSuperAdminLockWarning(true);
    }
  };

  // Handle Open Employee Attendance Edit Modal
  const handleOpenEditEmployeePunch = (record: AttendanceRecord) => {
    setEditingAttendanceRecord(record);
    setEditClockIn(record.clockIn || '09:00');
    setEditClockOut(record.clockOut || '');
    setEditStatus(record.status);
    setEditRemarks(record.managerRemarks || '');
  };

  // Save Employee Attendance Record
  const handleSaveAttendanceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendanceRecord) return;

    updateAttendanceRecord(editingAttendanceRecord.id, {
      clockIn: editClockIn,
      clockOut: editClockOut || undefined,
      status: editStatus,
      isLate: editStatus === 'late',
      managerRemarks: editRemarks || 'Manual adjustment authorized by Manager.'
    });

    setEditingAttendanceRecord(null);
  };

  // Open Manual Add Modal
  const handleOpenManualAddModal = () => {
    setManualUserId(teamUsers[0]?.id || '');
    setManualDate(todayStr);
    setManualClockIn('09:30');
    setManualClockOut('18:00');
    setManualStatus('present');
    setManualRemarks('Standard shift 09:30 - 18:00 (On-Time)');
    setShowManualAddModal(true);
  };

  // Save Manual Add Attendance Record
  const handleSaveManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId || !manualDate || !manualClockIn) {
      showNotification('Missing Information', 'Employee, Date, and Punch-In time are required.', 'warning');
      return;
    }
    const targetUser = users.find(u => u.id === manualUserId);
    manualRecordAttendance({
      userId: manualUserId,
      userName: targetUser?.name,
      department: targetUser?.department,
      date: manualDate,
      clockIn: manualClockIn,
      clockOut: manualClockOut.trim() ? manualClockOut : undefined,
      status: manualStatus,
      managerRemarks: manualRemarks.trim() ? manualRemarks : undefined
    });
    setShowManualAddModal(false);
  };

  // Execute 5-Day Quick Backfill
  const handleExecuteBackfill = () => {
    if (backfillDaysList.length === 0) {
      showNotification('No Dates Selected', 'Select at least one date.', 'warning');
      return;
    }
    const targetUsers = backfillTargetUser === 'all'
      ? teamUsers
      : teamUsers.filter(u => u.id === backfillTargetUser);

    if (targetUsers.length === 0) {
      showNotification('No Employees Found', 'No employees to backfill.', 'warning');
      return;
    }

    const recordsToCreate = targetUsers.flatMap(emp =>
      backfillDaysList.map(day => ({
        userId: emp.id,
        userName: emp.name,
        department: emp.department || 'Engineering',
        date: day,
        clockIn: backfillStartTime,
        clockOut: backfillEndTime,
        status: 'present' as const,
        managerRemarks: `Past 5-Day Shift Backfill (${backfillStartTime} - ${backfillEndTime})`
      }))
    );

    bulkBackfillAttendance(recordsToCreate);
    setShowBackfillModal(false);
  };

  // Download Client Executive Report PDF
  const handleDownloadClientReport = (projectId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    try {
      const doc = new jsPDF();
      const projTasks = tasks.filter(t => t.projectId === projectId);
      const completed = projTasks.filter(t => t.status === 'completed');
      const inProgress = projTasks.filter(t => t.status === 'in_progress');
      const pending = projTasks.filter(t => t.status === 'pending' || t.status === 'needs_review' || t.status === 'blocked');
      const totalHours = projTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
      const velocity = projTasks.length > 0 ? Math.round((completed.length / projTasks.length) * 100) : 0;

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Client Executive Report • ${frequency.toUpperCase()} AUDIT`, 14, 28);
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
          ['Department', targetProject.department || 'Engineering', 'Report Cadence', `${frequency.toUpperCase()} CLIENT AUDIT`],
          ['Executive Manager', currentUser.name, 'Delivery Status', targetProject.status.toUpperCase()],
          ['Project Scope', { content: targetProject.description, colSpan: 3 }]
        ]
      });

      // Executive Metrics
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.text('DELIVERY PROGRESS & MILESTONES', 14, finalY1);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'plain',
        body: [
          [
            `Total Tasks: ${projTasks.length}`,
            `Completed: ${completed.length} (${velocity}%)`,
            `In Progress: ${inProgress.length}`,
            `Pending / Review: ${pending.length}`,
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
      doc.text(`Authorized by: ${currentUser.name} (Delivery Executive)`, 14, endY);
      doc.text('Certified quickslogx Client Delivery Document.', 14, endY + 6);

      // Download file with Project Name and Client Name sanitized
      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitize(targetProject.name)}_${sanitize(targetProject.client)}_${frequency.toUpperCase()}_Report.pdf`;
      doc.save(filename);
      showNotification('Client Report Downloaded', `Saved ${filename}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build client report PDF.', 'warning');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* ======================================================== */}
      {/* 0. VIEW MODE SWITCHER (Studio Clean UI vs Detailed Console) */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border border-slate-200/80 dark:border-white/10 w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setDashboardViewMode('clean_studio')}
            className={`px-4 py-2 rounded-[16px] text-xs font-sans font-bold transition-all flex items-center gap-1.5 ${
              dashboardViewMode === 'clean_studio'
                ? 'bg-[#2c2d96] text-white shadow-md shadow-[#2c2d96]/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Clean View</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardViewMode('detailed_console')}
            className={`px-4 py-2 rounded-[16px] text-xs font-sans font-bold transition-all flex items-center gap-1.5 ${
              dashboardViewMode === 'detailed_console'
                ? 'bg-[#2c2d96] text-white shadow-md shadow-[#2c2d96]/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Detailed Console</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/25 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM LIVE
          </span>
        </div>
      </div>

      {dashboardViewMode === 'clean_studio' ? (
        <ExecutiveDribbbleDashboard
          currentUser={currentUser}
          policy={policy}
          projects={projects}
          tasks={tasks}
          teamUsers={teamUsers}
          onlineCount={onlineCount}
          pendingRequests={pendingRequests}
          onOpenOnboardModal={handleOpenOnboardModal}
          onOpenDepartmentsModal={() => setShowDepartmentsModal(true)}
          onOpenCreateProjectModal={() => setShowCreateProjectModal(true)}
          onOpenClientReportModal={() => {
            if (activeProjects.length > 0) {
              setSelectedReportProjectId(activeProjects[0].id);
              setShowClientReportModal(true);
            } else {
              showNotification('No Projects Found', 'Please create a client project first.', 'warning');
            }
          }}
        />
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. WELCOME BANNER & EXECUTIVE HEADER                     */}
          {/* ======================================================== */}
          <div className="relative overflow-hidden p-6 lg:p-7 rounded-[4px] liquid-glass-elevated border border-slate-200/90 dark:border-white/10 shadow-sm transition-all duration-300">
            {/* Subtle ambient gradient mesh in the card corner */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 dark:bg-cyan-500/15 border border-sky-400/30 text-sky-700 dark:text-cyan-300 rounded-[2px] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                Executive Console
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 dark:text-emerald-300 rounded-[2px] text-[10px] font-mono font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Shift Active ({policy.officeStartTime} - {policy.officeEndTime})
              </span>
            </div>

            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {greetingTime}, <span className="bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">{currentUser.name}</span>
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Real-time team presence monitor, deliverable allocation cockpit, and automated attendance policy enforcement.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <LiquidButton
              variant="primary"
              size="md"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={handleOpenOnboardModal}
              className="shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)]"
            >
              + Onboard Employee
            </LiquidButton>

            <LiquidButton
              variant="glass"
              size="md"
              icon={<Building2 className="w-4 h-4 text-sky-500" />}
              onClick={() => setShowDepartmentsModal(true)}
              className="hover:border-sky-400/50"
            >
              Departments ({policy.departments?.length || 0})
            </LiquidButton>

            <LiquidButton
              variant="glass"
              size="md"
              icon={<Plus className="w-4 h-4 text-indigo-500" />}
              onClick={() => setShowCreateProjectModal(true)}
              className="hover:border-indigo-400/50"
            >
              + New Project
            </LiquidButton>

            <LiquidButton
              variant="glass"
              size="md"
              icon={<FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={() => {
                if (activeProjects.length > 0) {
                  setSelectedReportProjectId(activeProjects[0].id);
                  setShowClientReportModal(true);
                } else {
                  showNotification('No Projects Found', 'Please create a client project first.', 'warning');
                }
              }}
              className="hover:border-emerald-400/50"
            >
              Client Reports (PDF)
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 ANIMATED SVG METRIC CARDS                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <motion.div
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          className="relative overflow-hidden p-5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-400/30 dark:border-sky-500/20 hover:border-sky-400/70 rounded-[4px] shadow-sm hover:shadow-[0_12px_28px_rgba(14,165,233,0.12)] transition-all duration-300 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Active Client Projects
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1.5 tracking-tight">
                {activeProjects.length}
              </div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                {withdrawnProjects.length > 0 ? `${withdrawnProjects.length} Withdrawn` : 'All in Active Scope'}
              </div>
            </div>
            <div className="p-2 bg-sky-500/10 dark:bg-sky-500/15 rounded-[3px] border border-sky-400/20 group-hover:scale-105 transition-transform">
              <ModernFolderBlueprintSvg />
            </div>
          </div>
          {/* Mini Accent Progress Indicator */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(100, Math.max(15, activeProjects.length * 20))}%` }} 
            />
          </div>
        </motion.div>

        {/* Card 2: Total Deliverable Tasks */}
        <motion.div
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          className="relative overflow-hidden p-5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-400/30 dark:border-indigo-500/20 hover:border-indigo-400/70 rounded-[4px] shadow-sm hover:shadow-[0_12px_28px_rgba(99,102,241,0.12)] transition-all duration-300 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Deliverable Tasks
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1.5 tracking-tight">
                {tasks.length}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {completedTasks.length} Completed ({Math.round(completionRate)}%)
              </div>
            </div>
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-[3px] border border-indigo-400/20 group-hover:scale-105 transition-transform">
              <ModernTaskChecklistSvg />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.round(completionRate)}%` }} 
            />
          </div>
        </motion.div>

        {/* Card 3: Team Online & Shift Schedule */}
        <motion.div
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          className="relative overflow-hidden p-5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-400/30 dark:border-emerald-500/20 hover:border-emerald-400/70 rounded-[4px] shadow-sm hover:shadow-[0_12px_28px_rgba(16,185,129,0.12)] transition-all duration-300 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Team Online Today
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1.5 tracking-tight flex items-center gap-1.5">
                <span>{onlineCount}</span>
                <span className="text-sm text-slate-400 font-normal">/ {teamUsers.length}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Grace Window: {policy.gracePeriodMinutes} mins
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-[3px] border border-emerald-400/20 group-hover:scale-105 transition-transform">
              <ModernPulseClockSvg />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${teamUsers.length > 0 ? Math.round((onlineCount / teamUsers.length) * 100) : 0}%` }} 
            />
          </div>
        </motion.div>

        {/* Card 4: Pending Clearances */}
        <motion.div
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
          className="relative overflow-hidden p-5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-amber-400/30 dark:border-amber-500/20 hover:border-amber-400/70 rounded-[4px] shadow-sm hover:shadow-[0_12px_28px_rgba(245,158,11,0.12)] transition-all duration-300 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Pending Approvals
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1.5 tracking-tight">
                {pendingRequests.length}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                {pendingRequests.length === 0 ? 'All Reviewed & Cleared' : 'Action Required for Exit'}
              </div>
            </div>
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/15 rounded-[3px] border border-amber-400/20 group-hover:scale-105 transition-transform">
              <ModernShieldApprovalSvg />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${pendingRequests.length === 0 ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-1/2'}`}
            />
          </div>
        </motion.div>
      </div>
    </>
  )}

      {/* ======================================================== */}
      {/* 3. MANAGER ATTENDANCE & OFFICE TIMINGS ROW              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Manager Personal Attendance Card (Locked to Super Admin) */}
        <div className="lg:col-span-6 p-5 liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 rounded-[4px] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                My Manager Attendance (Locked Record)
              </span>

              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-300 rounded-[2px] flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Super Admin Only
              </span>
            </div>

            <div className="flex items-center gap-3.5 mt-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-12 h-12 rounded-[3px] object-cover border-2 border-sky-400"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {currentUser.designation || 'Engineering Lead / Manager'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-[3px] text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Date</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {managerAttendanceRecord.date}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Punch In</span>
                <div className="font-bold text-sky-600 dark:text-cyan-400 mt-0.5">
                  {managerAttendanceRecord.clockIn || '08:50 AM'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Punch Out</span>
                <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {managerAttendanceRecord.clockOut || 'Active In Shift'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Status</span>
                <div className="mt-0.5">
                  <SquareBadge
                    label={managerAttendanceRecord.isLate ? 'Late' : 'On Time'}
                    variant={managerAttendanceRecord.isLate ? 'rose' : 'emerald'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Manager shifts cannot be self-edited.
            </span>

            <button
              type="button"
              onClick={handleManagerAttendanceEditAttempt}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded-[2px] border border-slate-300 dark:border-white/10 flex items-center gap-1.5 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Request Edit</span>
            </button>
          </div>
        </div>

        {/* Right: Office Timings & Working Hours Policy Config Desk */}
        <div className="lg:col-span-6 p-5 liquid-glass-elevated border border-slate-200/80 dark:border-white/10 rounded-[4px] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Office Timings & Shift Hours Engine
              </h3>
            </div>
            <SquareBadge label="Dynamic Policy" variant="cyan" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            Configure official office start, end times, and punctuality grace periods. Employee Check-In late status and overtime hours are dynamically computed from these settings.
          </p>

          <form onSubmit={handleSavePolicy} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Shift Start Time
                </label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00"
                  className="w-full glass-input px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[9px] text-slate-400">e.g. 09:00</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Shift End Time
                </label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="18:00"
                  className="w-full glass-input px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[9px] text-slate-400">e.g. 18:00</span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Grace Limit (mins)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={60}
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                  placeholder="15"
                  className="w-full glass-input px-2.5 py-1.5 text-xs font-bold"
                />
                <span className="text-[9px] text-slate-400">Grace threshold</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[10px] text-slate-500 font-mono">
                Current Active: {policy.officeStartTime} - {policy.officeEndTime} (Grace: {policy.gracePeriodMinutes}m)
              </div>

              <LiquidButton
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSavingPolicy}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                {isSavingPolicy ? 'Saving...' : 'Update Office Timings'}
              </LiquidButton>
            </div>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CLIENT PROJECTS DESK (Create, Withdraw, Reports)       */}
      {/* ======================================================== */}
      <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[4px] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Client Projects & Workstream Desk
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create client projects, withdraw completed or cancelled pods, and export cadence reports for clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateProjectModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold rounded-[2px] shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Project</span>
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Project Title</th>
                <th className="py-2.5 px-3">Client Organization</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Active Tasks</th>
                <th className="py-2.5 px-3">Project Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-mono text-xs">
                    No client projects found. Click "+ Create Project" to add your first project.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const isWithdrawn = proj.status === 'withdrawn';

                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isWithdrawn ? 'opacity-65 bg-slate-50/30 dark:bg-slate-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white font-sans text-xs">
                          {proj.name}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate" title={proj.description}>
                          {proj.description}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {proj.client}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {proj.department || 'Engineering'}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {projTasks.length} Tasks
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <SquareBadge
                          label={isWithdrawn ? 'WITHDRAWN' : proj.status.toUpperCase()}
                          variant={isWithdrawn ? 'rose' : proj.status === 'completed' ? 'emerald' : 'cyan'}
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Client Report PDF button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportProjectId(proj.id);
                              setShowClientReportModal(true);
                            }}
                            title="Download Report for Client"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-[2px]"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Withdraw / Reactivate Toggle */}
                          {isWithdrawn ? (
                            <button
                              type="button"
                              onClick={() => reactivateProject(proj.id)}
                              className="px-2 py-1 text-[10px] font-mono font-bold text-sky-700 dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/30 border border-sky-300 dark:border-cyan-700 rounded-[2px]"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => withdrawProject(proj.id)}
                              className="px-2 py-1 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-[2px]"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. TEAM ATTENDANCE MANAGEMENT DESK                       */}
      {/* ======================================================== */}
      <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[4px] shadow-sm space-y-4">
        {/* Header with Title & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Team Attendance & Shift Desk
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-sky-500/10 text-sky-700 dark:text-cyan-300 border border-sky-400/20 rounded-[2px] font-bold">
                09:30 - 18:00 PST (15m Grace)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review employee history, punch-in/out records, manually adjust entries, or backfill past 5 days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBackfillModal(true)}
              className="px-3 py-1.5 rounded-[2px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>5-Day Shift Backfill</span>
            </button>

            <button
              type="button"
              onClick={handleOpenManualAddModal}
              className="px-3 py-1.5 rounded-[2px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Filter */}
            <select
              value={attendanceUserFilter}
              onChange={(e) => setAttendanceUserFilter(e.target.value)}
              className="glass-input text-xs font-mono py-1 px-2.5 rounded-[2px]"
            >
              <option value="all">All Team Members ({teamUsers.length})</option>
              {teamUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department || 'Engineering'})
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={attendanceDateFilter}
              onChange={(e) => setAttendanceDateFilter(e.target.value as any)}
              className="glass-input text-xs font-mono py-1 px-2.5 rounded-[2px]"
            >
              <option value="all">All Dates / History</option>
              <option value="today">Today's Records</option>
              <option value="past5">Past 5 Days (Mon-Fri)</option>
              <option value="october">October 2026</option>
            </select>

            {/* Punctuality Status */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-[2px] text-xs font-mono">
              {(['all', 'present', 'late', 'wfh'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAttendanceFilter(f)}
                  className={`px-2 py-0.5 rounded-[1px] uppercase font-semibold transition-all ${
                    attendanceFilter === f
                      ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              placeholder="Search member, date..."
              className="w-full glass-input pl-8 pr-2 py-1 text-xs font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Punch In</th>
                <th className="py-2.5 px-3">Punch Out</th>
                <th className="py-2.5 px-3">Work Duration</th>
                <th className="py-2.5 px-3">Punctuality Status</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
              {filteredTeamAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span>No team attendance logs found matching current filter.</span>
                      <button
                        type="button"
                        onClick={() => setShowBackfillModal(true)}
                        className="text-amber-600 dark:text-amber-400 underline font-bold text-xs"
                      >
                        Quick backfill past 5 days now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeamAttendance.map(item => {
                  const hrs = Math.floor(item.totalWorkMinutes / 60);
                  const mins = item.totalWorkMinutes % 60;
                  const emp = users.find(u => u.id === item.userId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <img
                            src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={item.userName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">{item.userName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{item.department || 'Engineering'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <span>{item.date}</span>
                        {item.date === todayStr && (
                          <span className="ml-1.5 px-1 py-0.2 text-[9px] font-bold bg-sky-500/10 text-sky-600 dark:text-cyan-300 rounded-[2px]">
                            TODAY
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-sky-700 dark:text-cyan-300">{item.clockIn}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {item.clockOut || (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-semibold">
                        {item.totalWorkMinutes > 0 ? `${hrs}h ${mins}m` : 'In Session'}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.isLate ? (
                          <SquareBadge label="LATE" variant="rose" dot />
                        ) : (
                          <SquareBadge label="ON-TIME" variant="emerald" dot />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={item.managerRemarks || item.lateReason}>
                        {item.managerRemarks || item.lateReason || 'Standard shift'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEmployeePunch(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/30 rounded-[2px] transition-all"
                            title="Edit punch"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAttendanceRecord(item.id)}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2px] transition-all"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5.5 TEAM STAFF & CREDENTIALS DIRECTORY                   */}
      {/* ======================================================== */}
      <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[4px] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Team Staff & Credentials Roster
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Employees provisioned with temporary access. Monitor first-login password update compliance.
            </p>
          </div>

          <LiquidButton
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={handleOpenOnboardModal}
          >
            + Onboard New Employee
          </LiquidButton>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Staff Member</th>
                <th className="py-2.5 px-3">Work Email</th>
                <th className="py-2.5 px-3">Designation & Pod</th>
                <th className="py-2.5 px-3">Base Salary</th>
                <th className="py-2.5 px-3">Credential Security</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
              {teamUsers.filter(u => u.role === 'employee').length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No employees onboarded yet.</p>
                    <p className="text-[11px] mt-0.5">Click "+ Onboard New Employee" to provision employee accounts with temporary credentials.</p>
                  </td>
                </tr>
              ) : (
                teamUsers.filter(u => u.role === 'employee').map(emp => {
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-7 h-7 rounded-[2px] object-cover border border-slate-200 dark:border-white/10"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span className="capitalize">{emp.status}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 select-all font-mono">
                        {emp.email}
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">{emp.designation}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp.department}</div>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        ${emp.salary.toLocaleString()}/mo
                      </td>

                      <td className="py-2.5 px-3">
                        {emp.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3 text-amber-500" />
                            Temp Credentials Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-500" />
                            Password Secured
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {emp.mustChangePassword && emp.password ? (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `quickslogx Portal Login\nEmployee: ${emp.name}\nEmail: ${emp.email}\nTemporary Password: ${emp.password}\nMandatory password change upon login.`
                              );
                              showNotification('Credentials Copied', `Login credentials for ${emp.name} copied to clipboard.`, 'info');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-sky-700 dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/30 border border-sky-300 dark:border-cyan-700 rounded-[2px] hover:bg-sky-100 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Temp Credentials</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Profile Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. PENDING EMPLOYEE REQUESTS REVIEW DESK                 */}
      {/* ======================================================== */}
      <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[4px] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Pending Employee Requests Desk
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review team Leave, WFH, Overtime claims, and Late Excuses. Mandatory clearance required before shift exit.
            </p>
          </div>

          <SquareBadge
            label={pendingRequests.length === 0 ? 'ALL CLEARED' : `${pendingRequests.length} PENDING`}
            variant={pendingRequests.length === 0 ? 'emerald' : 'amber'}
          />
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[3px] text-xs font-mono text-slate-400 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-slate-700 dark:text-slate-300 font-bold">All Requests Cleared</p>
            <p className="text-[11px]">No pending team clearance items at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-[3px] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                      {req.userName}
                    </span>
                    <SquareBadge label={req.type.toUpperCase()} variant="cyan" />
                    <span className="text-[10px] text-slate-400">Date: {req.startDate}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-semibold font-sans">
                    {req.title}
                  </p>

                  <p className="text-slate-500 text-[11px] font-sans">
                    Reason: "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => reviewRequest(req.id, 'rejected', 'Manager review: Request rejected.')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-[2px] font-bold text-xs transition-all"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => reviewRequest(req.id, 'approved', 'Manager review: Request approved.')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2px] font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. MODALS                                                */}
      {/* ======================================================== */}

      {/* CREATE NEW CLIENT PROJECT MODAL (Strictly NO AMOUNT!) */}
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

      {/* CLIENT EXECUTIVE REPORT MODAL */}
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
                      Client Executive Report Desk
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

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Select Client Project:
                  </label>
                  <select
                    value={selectedReportProjectId}
                    onChange={(e) => setSelectedReportProjectId(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.client})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Report Cadence Frequency:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setReportFrequency(freq)}
                        className={`py-2 px-1 text-center uppercase font-semibold rounded-[2px] transition-all text-[11px] ${
                          reportFrequency === freq
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/50 shadow-sm font-bold'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Report Preview */}
              {(() => {
                const targetProject = projects.find(p => p.id === selectedReportProjectId) || projects[0];
                if (!targetProject) return null;
                const projTasks = tasks.filter(t => t.projectId === targetProject.id);
                const completed = projTasks.filter(t => t.status === 'completed');
                const inProgress = projTasks.filter(t => t.status === 'in_progress');
                const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
                const filename = `${sanitize(targetProject.name)}_${sanitize(targetProject.client)}_${reportFrequency.toUpperCase()}_Report.pdf`;

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px] space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Client Target:</span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{targetProject.client}</div>
                      </div>
                      <SquareBadge label={`${reportFrequency.toUpperCase()} REPORT`} variant="emerald" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                        <span className="text-slate-400">Total Tasks</span>
                        <div className="font-bold text-slate-900 dark:text-white">{projTasks.length} Deliverables</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                        <span className="text-slate-400">Completed</span>
                        <div className="font-bold text-emerald-600">{completed.length} Tasks</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                        <span className="text-slate-400">In Progress</span>
                        <div className="font-bold text-sky-600">{inProgress.length} Tasks</div>
                      </div>
                    </div>

                    <div className="p-2 bg-black/[0.03] dark:bg-white/[0.03] rounded text-[10px] flex items-center justify-between text-slate-500">
                      <span>Export File Target:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{filename}</span>
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
                          handleDownloadClientReport(targetProject.id, reportFrequency);
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

      {/* SUPER ADMIN SECURITY LOCK WARNING MODAL */}
      <AnimatePresence>
        {showSuperAdminLockWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuperAdminLockWarning(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-amber-400/50 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/15 border border-amber-400/30 rounded-[3px] text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Super Admin Clearance Mandatory
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Under quickslogx governance policy, <strong>Manager attendance logs are cryptographically sealed</strong>. Managers cannot self-modify punch timestamps.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-[2px] text-xs font-mono text-amber-800 dark:text-amber-300">
                🔒 Security Rule: Only accounts with <span className="font-bold">Super Admin role</span> (Alexander Vance) can override or adjust manager attendance records.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuperAdminLockWarning(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-mono font-bold rounded-[2px]"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT EMPLOYEE PUNCH MODAL */}
      <AnimatePresence>
        {editingAttendanceRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAttendanceRecord(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/40 dark:border-cyan-500/30 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30 rounded-[2px]">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Adjust Attendance & Punch Record
                    </h3>
                    <p className="text-xs text-slate-500">
                      Managing shift for {editingAttendanceRecord.userName} ({editingAttendanceRecord.department || 'Engineering'})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingAttendanceRecord(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAttendanceRecord} className="space-y-3.5 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Clock-In Time (HH:mm) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClockIn}
                      onChange={(e) => setEditClockIn(e.target.value)}
                      placeholder="09:00"
                      className="w-full glass-input px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Clock-Out Time (HH:mm)
                    </label>
                    <input
                      type="text"
                      value={editClockOut}
                      onChange={(e) => setEditClockOut(e.target.value)}
                      placeholder="18:00"
                      className="w-full glass-input px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Presence Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full glass-input px-2.5 py-2 text-xs"
                  >
                    <option value="present" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Present (On Time)</option>
                    <option value="late" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Late Arrival</option>
                    <option value="half_day" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Half Day</option>
                    <option value="wfh" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Work From Home (WFH)</option>
                    <option value="leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Approved Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Manager Remarks / Reason for Modification
                  </label>
                  <textarea
                    rows={2}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="e.g. Approved delay excuse or manual punch adjustment..."
                    className="w-full glass-input p-2.5 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingAttendanceRecord(null)}
                    className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <LiquidButton variant="primary" size="md" type="submit">
                    Save Attendance Changes
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK 5-DAY SHIFT BACKFILL MODAL */}
      <AnimatePresence>
        {showBackfillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBackfillModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-400/30 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[2px]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Quick Backfill Past 5 Working Days
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Populates Oct 01 - Oct 05 with On-Time 09:30 AM to 06:00 PM
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackfillModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Employee(s)
                  </label>
                  <select
                    value={backfillTargetUser}
                    onChange={(e) => setBackfillTargetUser(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    <option value="all">⚡ All Team Members ({teamUsers.length})</option>
                    {teamUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.department || 'Engineering'} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Days Included in Backfill
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2px]">
                    {[
                      { date: '2026-10-01', day: 'Day 1 (Thursday)' },
                      { date: '2026-10-02', day: 'Day 2 (Friday)' },
                      { date: '2026-10-03', day: 'Day 3 (Saturday)' },
                      { date: '2026-10-04', day: 'Day 4 (Sunday)' },
                      { date: '2026-10-05', day: 'Day 5 (Monday - Today)' }
                    ].map(item => {
                      const isChecked = backfillDaysList.includes(item.date);
                      return (
                        <label key={item.date} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBackfillDaysList([...backfillDaysList, item.date]);
                              } else {
                                setBackfillDaysList(backfillDaysList.filter(d => d !== item.date));
                              }
                            }}
                            className="rounded-[2px] text-amber-600 focus:ring-amber-500"
                          />
                          <span>{item.date} <span className="text-slate-400 text-[10px]">({item.day})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      value={backfillStartTime}
                      onChange={(e) => setBackfillStartTime(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                      ✓ On-Time (Grace relaxation to 09:45)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      value={backfillEndTime}
                      onChange={(e) => setBackfillEndTime(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Shift duration: 8h 30m
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[2px] text-slate-700 dark:text-slate-300 text-[11px]">
                  <strong>Summary:</strong> Will create or update {backfillDaysList.length} attendance records per selected employee with 8 hours 30 minutes worked and On-Time status.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBackfillModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBackfill}
                  className="px-4 py-2 rounded-[2px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute 5-Day Backfill</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL SINGLE ATTENDANCE ENTRY MODAL */}
      <AnimatePresence>
        {showManualAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/40 dark:border-cyan-400/30 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-cyan-400 rounded-[2px]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Manual Attendance Entry
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Log single shift punch for any date (past or today)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualAdd} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee
                  </label>
                  <select
                    required
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    {teamUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.department || 'Engineering'} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      required
                      value={manualClockIn}
                      onChange={(e) => setManualClockIn(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Grace relaxation limit: 09:45 AM
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Check-Out Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={manualClockOut}
                      onChange={(e) => setManualClockOut(e.target.value)}
                      className="w-full glass-input py-2 px-3 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Leave blank if employee is currently in shift
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recorded Status
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full glass-input py-2 px-3 text-xs"
                  >
                    <option value="present">Present (On-Time)</option>
                    <option value="late">Late Arrival</option>
                    <option value="half_day">Half Day</option>
                    <option value="wfh">Work From Home (WFH)</option>
                    <option value="leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Manager Remarks
                  </label>
                  <input
                    type="text"
                    value={manualRemarks}
                    onChange={(e) => setManualRemarks(e.target.value)}
                    placeholder="e.g. Standard shift 09:30 - 18:00 or approved exception"
                    className="w-full glass-input py-2 px-3 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowManualAddModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[2px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Attendance</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE COMPANY DEPARTMENTS MODAL */}
      <AnimatePresence>
        {showDepartmentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDepartmentsModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/50 dark:border-cyan-500/40 p-6 rounded-[4px] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/40 text-sky-600 dark:text-cyan-400 rounded-[3px]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Department Management
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-cyan-400 border border-sky-400/30 rounded">
                        {policy.departments?.length || 0} TOTAL
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create, generate, and organize company departments in real-time.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDepartmentsModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Department Form */}
              <form onSubmit={handleAddDepartment} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Add New Department
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    placeholder="e.g. Frontend Engineering, Product Design, Marketing..."
                    className="flex-1 glass-input px-3 py-2 text-xs"
                  />
                  <LiquidButton variant="primary" size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                    Create
                  </LiquidButton>
                </div>
              </form>

              {/* Existing Departments List */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Active Departments
                </span>

                {policy.departments && policy.departments.length > 0 ? (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {policy.departments.map((dept) => {
                      const count = users.filter(u => u.department === dept).length;
                      return (
                        <div
                          key={dept}
                          className="flex items-center justify-between p-2.5 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-[3px] hover:border-sky-400/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-sky-500/10 text-sky-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {dept}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {count} {count === 1 ? 'member' : 'members'} assigned
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove department "${dept}"? Any assigned employees will retain their current title.`)) {
                                handleDeleteDepartment(dept);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-[3px] space-y-1">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No Custom Departments Created Yet
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Use the input box above to generate your company's departments.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex justify-end">
                <LiquidButton variant="glass" size="sm" onClick={() => setShowDepartmentsModal(false)}>
                  Done
                </LiquidButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ONBOARD NEW EMPLOYEE MODAL (Temporary Email & Password) */}
      <AnimatePresence>
        {showOnboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboardModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-sky-400/50 dark:border-cyan-500/40 p-6 rounded-[4px] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/15 border border-sky-400/40 text-sky-600 dark:text-cyan-400 rounded-[3px]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Onboard New Employee
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provision temporary login credentials. First login enforces mandatory password reset.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createdEmpResult ? (
                /* Success State with Credentials & Copy button */
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-[3px] text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Employee Successfully Onboarded!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Share these temporary credentials with <strong>{createdEmpResult.name}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-black/[0.03] dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-[3px] space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Login Work Email</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white select-all">{createdEmpResult.email}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Temporary Password</span>
                      <span className="text-sm font-bold text-sky-600 dark:text-cyan-400 select-all">{createdEmpResult.pass}</span>
                    </div>

                    <div className="pt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-sans font-medium">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Employee will be forced to change this password immediately upon first sign-in.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyEmployeeCredentials}
                      className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-[2px] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCreds ? 'Credentials Copied!' : 'Copy Login Credentials'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOnboardModal(false)}
                      className="py-2.5 px-4 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-[2px] font-bold text-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Onboarding Form */
                <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs font-mono">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="e.g. Hamza Tariq"
                      className="w-full glass-input px-3 py-2 text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Corporate Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      placeholder="hamza.dev@quickslogix.com"
                      className="w-full glass-input px-3 py-2 text-xs font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Job Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={empDesignation}
                        onChange={(e) => setEmpDesignation(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full glass-input px-3 py-2 text-xs font-sans"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold text-xs">
                          Department
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowDepartmentsModal(true)}
                          className="text-[10px] text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          + Manage Depts
                        </button>
                      </div>
                      {policy.departments && policy.departments.length > 0 ? (
                        <select
                          value={empDepartment}
                          onChange={(e) => setEmpDepartment(e.target.value)}
                          className="w-full glass-input px-2.5 py-2 text-xs"
                        >
                          {policy.departments.map((dept) => (
                            <option key={dept} value={dept} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {dept}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Engineering, Sales, QA..."
                          value={empDepartment}
                          onChange={(e) => setEmpDepartment(e.target.value)}
                          className="w-full glass-input px-2.5 py-2 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Base Monthly Salary ($)
                      </label>
                      <input
                        type="number"
                        value={empSalary}
                        onChange={(e) => setEmpSalary(Number(e.target.value))}
                        className="w-full glass-input px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">
                          Temporary Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setEmpTempPassword(generateTemporaryPassword())}
                          className="text-[10px] text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> New
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={empTempPassword}
                        onChange={(e) => setEmpTempPassword(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-xs font-mono font-bold text-sky-600 dark:text-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowOnboardModal(false)}
                      className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <LiquidButton variant="primary" size="md" type="submit">
                      Create & Issue Credentials
                    </LiquidButton>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
