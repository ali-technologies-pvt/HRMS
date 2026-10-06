'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Project,
  Task,
  DailyReport,
  RequestItem,
  AttendanceRecord,
  Announcement,
  Payslip,
  CompanyPolicy,
  TaskStatus,
  RequestStatus
} from '@/types';
import {
  initialProjects,
  initialTasks,
  initialDailyReports,
  initialRequests,
  initialAttendance,
  initialAnnouncements,
  initialPayslips,
  initialCompanyPolicy
} from '@/lib/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { pushCollectionToSupabase, fetchCollectionFromSupabase, subscribeToCollectionChange } from '@/lib/supabaseSync';

interface AppDataContextType {
  projects: Project[];
  tasks: Task[];
  reports: DailyReport[];
  requests: RequestItem[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  payslips: Payslip[];
  policy: CompanyPolicy;

  // Project operations
  addProject: (proj: {
    name: string;
    client: string;
    description: string;
    department?: string;
    budget?: number;
    deadline?: string;
    status?: 'active' | 'completed' | 'on_hold' | 'withdrawn';
  }) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  withdrawProject: (id: string) => void;
  reactivateProject: (id: string) => void;

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'timerActive' | 'loggedHours'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleTaskTimer: (taskId: string) => void;
  getTasksForUser: (userId: string) => Task[];

  // Daily Report EOD operations
  generateEODPreview: (userId: string) => {
    completedTasks: string[];
    inProgressTasks: string[];
    pendingTasks: string[];
  };
  submitEODReport: (report: Omit<DailyReport, 'id' | 'submittedAt'>) => void;
  reviewEODReport: (reportId: string, status: 'approved' | 'revision_requested', remarks?: string) => void;

  // Requests operations
  submitRequest: (req: Omit<RequestItem, 'id' | 'createdAt' | 'status'>) => void;
  reviewRequest: (requestId: string, status: RequestStatus, remarks?: string) => void;

  // Attendance operations
  clockIn: (userId: string) => void;
  clockOut: (userId: string) => void;
  getUserTodayAttendance: (userId: string) => AttendanceRecord | undefined;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  manualRecordAttendance: (record: {
    userId: string;
    userName?: string;
    department?: string;
    date: string; // YYYY-MM-DD
    clockIn: string; // HH:mm
    clockOut?: string; // HH:mm
    status?: 'present' | 'late' | 'half_day' | 'wfh' | 'leave';
    managerRemarks?: string;
  }) => void;
  bulkBackfillAttendance: (records: {
    userId: string;
    userName: string;
    department: string;
    date: string;
    clockIn: string;
    clockOut: string;
    status: 'present' | 'late' | 'half_day' | 'wfh' | 'leave';
    managerRemarks?: string;
  }[]) => void;
  deleteAttendanceRecord: (id: string) => void;

  // Announcements operations
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  // Payroll operations
  generateMonthlyPayroll: (month: string, year: number) => void;
  getPayslipsForUser: (userId: string) => Payslip[];

  // Company Settings & Policies
  updateCompanyPolicy: (updates: Partial<CompanyPolicy>) => void;
  addDepartment: (deptName: string) => boolean;
  deleteDepartment: (deptName: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { showNotification } = useNotifications();
  const { currentUser, users, updateCurrentUserProfile } = useAuth();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [reports, setReports] = useState<DailyReport[]>(initialDailyReports);
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [payslips, setPayslips] = useState<Payslip[]>(initialPayslips);
  const [policy, setPolicy] = useState<CompanyPolicy>(initialCompanyPolicy);

  // Hydrate state from localStorage on load, then sync with Supabase cloud
  useEffect(() => {
    setProjects(loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, initialProjects));
    setTasks(loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, initialTasks));
    setReports(loadFromStorage<DailyReport[]>(STORAGE_KEYS.REPORTS, initialDailyReports));
    setRequests(loadFromStorage<RequestItem[]>(STORAGE_KEYS.REQUESTS, initialRequests));
    setAttendance(loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendance));
    setAnnouncements(loadFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements));
    const loadedPolicy = loadFromStorage<CompanyPolicy>(STORAGE_KEYS.POLICY, initialCompanyPolicy);
    if (loadedPolicy) {
      if (loadedPolicy.officeStartTime === '09:00' || !loadedPolicy.officeStartTime) {
        loadedPolicy.officeStartTime = '09:30';
        loadedPolicy.officeEndTime = '18:00';
        loadedPolicy.gracePeriodMinutes = 15;
      }
      // Clear legacy hardcoded departments so Manager generates fresh departments
      const LEGACY_DEFAULT_DEPTS = [
        'Executive Administration',
        'Engineering',
        'Product Design',
        'Quality Assurance',
        'Human Resources',
        'Operations & HR',
        'Sales & Growth'
      ];
      if (loadedPolicy.departments && Array.isArray(loadedPolicy.departments)) {
        const isLegacyDefault = loadedPolicy.departments.length === LEGACY_DEFAULT_DEPTS.length &&
          loadedPolicy.departments.every((d: string) => LEGACY_DEFAULT_DEPTS.includes(d));
        if (isLegacyDefault) {
          loadedPolicy.departments = [];
        }
      } else {
        loadedPolicy.departments = [];
      }
      saveToStorage(STORAGE_KEYS.POLICY, loadedPolicy);
    }
    setPolicy(loadedPolicy);

    // Fetch collections from Supabase
    (async () => {
      try {
        const [cloudProjects, cloudTasks, cloudReports, cloudRequests, cloudAttendance, cloudAnnouncements, cloudPolicy] = await Promise.all([
          fetchCollectionFromSupabase<Project[]>(STORAGE_KEYS.PROJECTS),
          fetchCollectionFromSupabase<Task[]>(STORAGE_KEYS.TASKS),
          fetchCollectionFromSupabase<DailyReport[]>(STORAGE_KEYS.REPORTS),
          fetchCollectionFromSupabase<RequestItem[]>(STORAGE_KEYS.REQUESTS),
          fetchCollectionFromSupabase<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE),
          fetchCollectionFromSupabase<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS),
          fetchCollectionFromSupabase<CompanyPolicy>(STORAGE_KEYS.POLICY)
        ]);

        if (cloudProjects && cloudProjects.length > 0) {
          setProjects(cloudProjects);
          saveToStorage(STORAGE_KEYS.PROJECTS, cloudProjects);
        } else {
          const local = loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, initialProjects);
          if (local && local.length > 0) pushCollectionToSupabase(STORAGE_KEYS.PROJECTS, local).catch(console.warn);
        }

        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
          saveToStorage(STORAGE_KEYS.TASKS, cloudTasks);
        } else {
          const local = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, initialTasks);
          if (local && local.length > 0) pushCollectionToSupabase(STORAGE_KEYS.TASKS, local).catch(console.warn);
        }

        if (cloudReports && cloudReports.length > 0) {
          setReports(cloudReports);
          saveToStorage(STORAGE_KEYS.REPORTS, cloudReports);
        } else {
          const local = loadFromStorage<DailyReport[]>(STORAGE_KEYS.REPORTS, initialDailyReports);
          if (local && local.length > 0) pushCollectionToSupabase(STORAGE_KEYS.REPORTS, local).catch(console.warn);
        }

        if (cloudRequests && cloudRequests.length > 0) {
          setRequests(cloudRequests);
          saveToStorage(STORAGE_KEYS.REQUESTS, cloudRequests);
        } else {
          const local = loadFromStorage<RequestItem[]>(STORAGE_KEYS.REQUESTS, initialRequests);
          if (local && local.length > 0) pushCollectionToSupabase(STORAGE_KEYS.REQUESTS, local).catch(console.warn);
        }

        if (cloudAttendance && cloudAttendance.length > 0) {
          setAttendance(cloudAttendance);
          saveToStorage(STORAGE_KEYS.ATTENDANCE, cloudAttendance);
        } else {
          const local = loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendance);
          if (local && local.length > 0) pushCollectionToSupabase(STORAGE_KEYS.ATTENDANCE, local).catch(console.warn);
        }

        if (cloudAnnouncements && cloudAnnouncements.length > 0) {
          setAnnouncements(cloudAnnouncements);
          saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, cloudAnnouncements);
        }

        if (cloudPolicy) {
          setPolicy(cloudPolicy);
          saveToStorage(STORAGE_KEYS.POLICY, cloudPolicy);
        }
      } catch (err) {
        console.warn('[AppDataContext] Cloud sync error:', err);
      }
    })();

    // Realtime live subscription: Instant synchronization across devices without reload!
    const unsubscribeRealtime = subscribeToCollectionChange((key: string, data: any) => {
      if (!data) return;
      if (key === STORAGE_KEYS.PROJECTS && Array.isArray(data)) {
        setProjects(data);
        saveToStorage(STORAGE_KEYS.PROJECTS, data);
      } else if (key === STORAGE_KEYS.TASKS && Array.isArray(data)) {
        setTasks(data);
        saveToStorage(STORAGE_KEYS.TASKS, data);
      } else if (key === STORAGE_KEYS.REPORTS && Array.isArray(data)) {
        setReports(data);
        saveToStorage(STORAGE_KEYS.REPORTS, data);
      } else if (key === STORAGE_KEYS.REQUESTS && Array.isArray(data)) {
        setRequests(data);
        saveToStorage(STORAGE_KEYS.REQUESTS, data);
      } else if (key === STORAGE_KEYS.ATTENDANCE && Array.isArray(data)) {
        setAttendance(data);
        saveToStorage(STORAGE_KEYS.ATTENDANCE, data);
      } else if (key === STORAGE_KEYS.ANNOUNCEMENTS && Array.isArray(data)) {
        setAnnouncements(data);
        saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, data);
      } else if (key === STORAGE_KEYS.POLICY && typeof data === 'object') {
        setPolicy(data);
        saveToStorage(STORAGE_KEYS.POLICY, data);
      }
    });

    // Failsafe background sync polling (every 4 seconds) to guarantee consistency
    const pollInterval = setInterval(async () => {
      try {
        const [cloudTasks, cloudAttendance, cloudAnnouncements, cloudRequests, cloudReports, cloudProjects] = await Promise.all([
          fetchCollectionFromSupabase<Task[]>(STORAGE_KEYS.TASKS),
          fetchCollectionFromSupabase<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE),
          fetchCollectionFromSupabase<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS),
          fetchCollectionFromSupabase<RequestItem[]>(STORAGE_KEYS.REQUESTS),
          fetchCollectionFromSupabase<DailyReport[]>(STORAGE_KEYS.REPORTS),
          fetchCollectionFromSupabase<Project[]>(STORAGE_KEYS.PROJECTS)
        ]);

        if (cloudTasks && Array.isArray(cloudTasks)) {
          setTasks(prev => cloudTasks.length !== prev.length ? (saveToStorage(STORAGE_KEYS.TASKS, cloudTasks), cloudTasks) : prev);
        }
        if (cloudAttendance && Array.isArray(cloudAttendance)) {
          setAttendance(prev => cloudAttendance.length !== prev.length ? (saveToStorage(STORAGE_KEYS.ATTENDANCE, cloudAttendance), cloudAttendance) : prev);
        }
        if (cloudAnnouncements && Array.isArray(cloudAnnouncements)) {
          setAnnouncements(prev => cloudAnnouncements.length !== prev.length ? (saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, cloudAnnouncements), cloudAnnouncements) : prev);
        }
        if (cloudRequests && Array.isArray(cloudRequests)) {
          setRequests(prev => cloudRequests.length !== prev.length ? (saveToStorage(STORAGE_KEYS.REQUESTS, cloudRequests), cloudRequests) : prev);
        }
        if (cloudReports && Array.isArray(cloudReports)) {
          setReports(prev => cloudReports.length !== prev.length ? (saveToStorage(STORAGE_KEYS.REPORTS, cloudReports), cloudReports) : prev);
        }
        if (cloudProjects && Array.isArray(cloudProjects)) {
          setProjects(prev => cloudProjects.length !== prev.length ? (saveToStorage(STORAGE_KEYS.PROJECTS, cloudProjects), cloudProjects) : prev);
        }
      } catch {}
    }, 4000);

    return () => {
      unsubscribeRealtime();
      clearInterval(pollInterval);
    };
  }, []);

  // Save changes helper with Supabase persistence
  const syncData = <T,>(key: string, data: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    setter(data);
    saveToStorage(key, data);
    pushCollectionToSupabase(key, data).catch((err) => {
      console.warn(`[AppDataContext] Failed to push collection ${key} to Supabase:`, err);
    });
  };

  // Projects
  const addProject = useCallback((proj: {
    name: string;
    client: string;
    description: string;
    department?: string;
    budget?: number;
    deadline?: string;
    status?: 'active' | 'completed' | 'on_hold' | 'withdrawn';
  }) => {
    const newProj: Project = {
      id: 'proj-' + Date.now().toString(36),
      name: proj.name,
      client: proj.client,
      description: proj.description,
      department: proj.department || 'Engineering',
      budget: proj.budget,
      deadline: proj.deadline || '2026-12-31',
      status: proj.status || 'active',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString()
    };
    const updated = [newProj, ...projects];
    syncData(STORAGE_KEYS.PROJECTS, updated, setProjects);
    showNotification('Project Created', `Project "${proj.name}" for client "${proj.client}" is now active.`, 'success');
  }, [projects, showNotification, currentUser.name]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    syncData(STORAGE_KEYS.PROJECTS, updated, setProjects);
    showNotification('Project Updated', 'Project configuration modified.', 'info');
  }, [projects, showNotification]);

  const deleteProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    const updated = projects.filter(p => p.id !== id);
    syncData(STORAGE_KEYS.PROJECTS, updated, setProjects);
    showNotification('Project Deleted', `Project "${target?.name || ''}" permanently removed.`, 'warning');
  }, [projects, showNotification]);

  const withdrawProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    const updated = projects.map(p => p.id === id ? { ...p, status: 'withdrawn' as const } : p);
    syncData(STORAGE_KEYS.PROJECTS, updated, setProjects);
    showNotification('Project Withdrawn', `Project "${target?.name || ''}" withdrawn. Removed from task allocation while keeping all records.`, 'warning');
  }, [projects, showNotification]);

  const reactivateProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    const updated = projects.map(p => p.id === id ? { ...p, status: 'active' as const } : p);
    syncData(STORAGE_KEYS.PROJECTS, updated, setProjects);
    showNotification('Project Reactivated', `Project "${target?.name || ''}" reactivated for task assignment.`, 'success');
  }, [projects, showNotification]);

  // Tasks
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'timerActive' | 'loggedHours'>) => {
    const assignedUser = users.find(u => u.id === taskData.assignedToId);
    const project = projects.find(p => p.id === taskData.projectId);

    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now().toString(36),
      projectName: project ? project.name : 'General Operations',
      assignedToName: assignedUser ? assignedUser.name : 'Assigned Member',
      assignedToAvatar: assignedUser ? assignedUser.avatarUrl : undefined,
      assignedByName: currentUser.name,
      category: taskData.category || 'General',
      commentsCount: taskData.commentsCount || 0,
      attachmentsCount: taskData.attachmentsCount || 0,
      loggedHours: 0,
      timerActive: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newTask, ...tasks];
    syncData(STORAGE_KEYS.TASKS, updated, setTasks);
    showNotification('Task Assigned', `Task "${newTask.title}" allocated to ${newTask.assignedToName}`, 'success');
  }, [users, projects, currentUser.name, tasks, showNotification]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    syncData(STORAGE_KEYS.TASKS, updated, setTasks);
    showNotification('Task Updated', 'Task details modified and saved.', 'info');
  }, [tasks, showNotification]);

  const deleteTask = useCallback((taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    syncData(STORAGE_KEYS.TASKS, updated, setTasks);
    showNotification('Task Deleted', `Task "${target?.title || ''}" was removed.`, 'warning');
  }, [tasks, showNotification]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const isNowCompleted = status === 'completed';
        return {
          ...t,
          status,
          timerActive: isNowCompleted ? false : t.timerActive,
          completedAt: isNowCompleted ? new Date().toISOString() : t.completedAt
        };
      }
      return t;
    });

    syncData(STORAGE_KEYS.TASKS, updated, setTasks);

    if (status === 'completed') {
      showNotification(
        '🎉 Task Completed',
        `"${targetTask?.title || 'Task'}" marked completed by ${currentUser.name}. Manager notified.`,
        'success'
      );
    } else if (status === 'needs_review') {
      showNotification(
        '📋 Review Requested',
        `"${targetTask?.title || 'Task'}" submitted by ${currentUser.name} for manager review.`,
        'info'
      );
    } else if (status === 'in_progress') {
      showNotification(
        '🚀 Sprint Active',
        `"${targetTask?.title || 'Task'}" is now on progress. Live telemetry active.`,
        'info'
      );
    } else {
      showNotification('Task Status Changed', `Task status updated to ${status.toUpperCase().replace('_', ' ')}`, 'info');
    }
  }, [tasks, currentUser.name, showNotification]);

  const toggleTaskTimer = useCallback((taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const willBeActive = !targetTask.timerActive;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        let loggedHours = t.loggedHours;
        if (!willBeActive && t.startedAt) {
          const elapsedMs = Date.now() - new Date(t.startedAt).getTime();
          const elapsedHrs = elapsedMs / (1000 * 60 * 60);
          loggedHours += Number(elapsedHrs.toFixed(2));
        }

        return {
          ...t,
          timerActive: willBeActive,
          status: willBeActive ? ('in_progress' as TaskStatus) : t.status,
          startedAt: willBeActive ? new Date().toISOString() : undefined,
          loggedHours
        };
      } else if (willBeActive && t.timerActive) {
        // Stop any other active timer
        return { ...t, timerActive: false };
      }
      return t;
    });

    syncData(STORAGE_KEYS.TASKS, updated, setTasks);

    // Update current user live tracker
    if (willBeActive) {
      updateCurrentUserProfile({
        activeTaskId: taskId,
        activeProjectId: targetTask.projectId,
        activeTaskStartedAt: new Date().toISOString(),
        status: 'online'
      });
      showNotification('Timer Started', `Now working on: ${targetTask.title}. Live tracking active.`, 'success');
    } else {
      updateCurrentUserProfile({
        activeTaskId: undefined,
        activeTaskStartedAt: undefined
      });
      showNotification('Timer Paused', `Session recorded for: ${targetTask.title}.`, 'info');
    }
  }, [tasks, updateCurrentUserProfile, showNotification]);

  const getTasksForUser = useCallback((userId: string) => {
    // STRICT DATA PRIVACY: Employees only see tasks where assignedToId matches their userId
    return tasks.filter(t => t.assignedToId === userId);
  }, [tasks]);

  // EOD Reports
  const generateEODPreview = useCallback((userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const userTasks = tasks.filter(t => t.assignedToId === userId);

    const completedTasks = userTasks
      .filter(t => t.status === 'completed' && (t.completedAt?.startsWith(todayStr) || t.createdAt?.startsWith(todayStr) || !t.completedAt))
      .map(t => `${t.title} (${t.projectName || 'General'}) [Completed]`);

    const inProgressTasks = userTasks
      .filter(t => t.status === 'in_progress')
      .map(t => `${t.title} (${t.projectName || 'General'}) [In Progress: ${t.loggedHours || 0}h logged]`);

    const pendingTasks = userTasks
      .filter(t => t.status === 'pending' || t.status === 'blocked' || t.status === 'needs_review')
      .map(t => `${t.title} (${t.projectName || 'General'}) [Pending: Due ${t.deadline || 'Today'}]`);

    return {
      completedTasks,
      inProgressTasks,
      pendingTasks
    };
  }, [tasks]);

  const submitEODReport = useCallback((reportData: Omit<DailyReport, 'id' | 'submittedAt'>) => {
    const newReport: DailyReport = {
      ...reportData,
      id: 'rep-' + Date.now().toString(36),
      submittedAt: new Date().toISOString()
    };

    const updated = [newReport, ...reports];
    syncData(STORAGE_KEYS.REPORTS, updated, setReports);
    showNotification('EOD Report Dispatched', 'Your daily report was successfully submitted to your manager.', 'success');
  }, [reports, showNotification]);

  const reviewEODReport = useCallback((reportId: string, status: 'approved' | 'revision_requested', remarks?: string) => {
    const updated = reports.map(r => r.id === reportId ? { ...r, approvalStatus: status, managerRemarks: remarks } : r);
    syncData(STORAGE_KEYS.REPORTS, updated, setReports);
    showNotification('Report Reviewed', `EOD report marked as ${status === 'approved' ? 'Approved' : 'Revision Requested'}.`, 'success');
  }, [reports, showNotification]);

  // Requests Desk
  const submitRequest = useCallback((reqData: Omit<RequestItem, 'id' | 'createdAt' | 'status'>) => {
    const newReq: RequestItem = {
      ...reqData,
      id: 'req-' + Date.now().toString(36),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updated = [newReq, ...requests];
    syncData(STORAGE_KEYS.REQUESTS, updated, setRequests);
    showNotification('Request Lodged', `Your ${reqData.type.toUpperCase().replace('_', ' ')} application is pending manager review.`, 'info');
  }, [requests, showNotification]);

  const reviewRequest = useCallback((requestId: string, status: RequestStatus, remarks?: string) => {
    const updated = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          managerRemarks: remarks,
          reviewedBy: currentUser.name,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    });

    syncData(STORAGE_KEYS.REQUESTS, updated, setRequests);
    showNotification('Request Decision Logged', `Request marked as ${status.toUpperCase()}.`, status === 'approved' ? 'success' : 'warning');
  }, [requests, currentUser.name, showNotification]);

  // Attendance
  const getUserTodayAttendance = useCallback((userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.userId === userId && a.date === todayStr);
  }, [attendance]);

  const clockIn = useCallback((userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Compare with officeStartTime e.g. 09:30 and gracePeriodMinutes e.g. 15
    const [startH, startM] = (policy.officeStartTime || '09:30').split(':').map(Number);
    const startTotalMins = startH * 60 + startM; // 09:30 => 570 mins
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const graceLimit = startTotalMins + (policy.gracePeriodMinutes ?? 15); // 585 mins => 09:45 AM

    const isLate = currentTotalMins > graceLimit;
    const minsLate = isLate ? currentTotalMins - startTotalMins : 0;

    const userObj = users.find(u => u.id === userId) || currentUser;

    const existing = attendance.find(a => a.userId === userId && a.date === todayStr);
    if (existing) {
      showNotification('Already Clocked In', `You already checked in today at ${existing.clockIn}`, 'warning');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now().toString(36),
      userId,
      userName: userObj.name,
      department: userObj.department || 'Operations',
      date: todayStr,
      clockIn: timeStr,
      totalWorkMinutes: 0,
      status: isLate ? 'late' : 'present',
      isLate,
      lateReason: isLate ? `Late by ${minsLate} mins (Grace limit: 09:45 AM)` : undefined,
      overtimeHours: 0
    };

    const updated = [newRecord, ...attendance];
    syncData(STORAGE_KEYS.ATTENDANCE, updated, setAttendance);
    updateCurrentUserProfile({ status: 'online' });

    if (isLate) {
      showNotification('Clock-In Logged (Late)', `Punched in at ${timeStr}. Grace period (${policy.gracePeriodMinutes || 15}m) exceeded.`, 'warning');
    } else {
      showNotification('Punched In (On-Time)', `Good morning! Clocked in at ${timeStr}. Have a productive day!`, 'success');
    }
  }, [attendance, policy, users, currentUser, updateCurrentUserProfile, showNotification]);

  const clockOut = useCallback((userId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existing = attendance.find(a => a.userId === userId && a.date === todayStr);
    if (!existing) {
      showNotification('Not Clocked In', 'Please punch in first before punching out.', 'warning');
      return;
    }

    // Calculate total minutes
    const [inH, inM] = existing.clockIn.split(':').map(Number);
    const inTotalMins = inH * 60 + inM;
    const outTotalMins = now.getHours() * 60 + now.getMinutes();
    const workedMins = Math.max(0, outTotalMins - inTotalMins);

    // Overtime past officeEndTime e.g. 18:00
    const [endH, endM] = (policy.officeEndTime || '18:00').split(':').map(Number);
    const endTotalMins = endH * 60 + endM; // 18:00 => 1080 mins
    let overtimeHours = 0;
    if (outTotalMins > endTotalMins) {
      overtimeHours = Number(((outTotalMins - endTotalMins) / 60).toFixed(1));
    }

    const updated = attendance.map(a => {
      if (a.id === existing.id) {
        return {
          ...a,
          clockOut: timeStr,
          totalWorkMinutes: workedMins,
          overtimeHours
        };
      }
      return a;
    });

    syncData(STORAGE_KEYS.ATTENDANCE, updated, setAttendance);
    updateCurrentUserProfile({ status: 'offline', activeTaskId: undefined });
    showNotification('Punched Out', `Clocked out at ${timeStr}. Total logged: ${Math.floor(workedMins / 60)}h ${workedMins % 60}m.`, 'info');
  }, [attendance, policy, updateCurrentUserProfile, showNotification]);

  const updateAttendanceRecord = useCallback((id: string, updates: Partial<AttendanceRecord>) => {
    const updated = attendance.map(a => a.id === id ? { ...a, ...updates } : a);
    syncData(STORAGE_KEYS.ATTENDANCE, updated, setAttendance);
    showNotification('Attendance Updated', 'Attendance record modified successfully.', 'success');
  }, [attendance, showNotification]);

  const manualRecordAttendance = useCallback((record: {
    userId: string;
    userName?: string;
    department?: string;
    date: string; // YYYY-MM-DD
    clockIn: string; // HH:mm
    clockOut?: string; // HH:mm
    status?: 'present' | 'late' | 'half_day' | 'wfh' | 'leave';
    managerRemarks?: string;
  }) => {
    const userObj = users.find(u => u.id === record.userId) || currentUser;
    const userName = record.userName || userObj.name;
    const department = record.department || userObj.department || 'Operations';

    // Parse clockIn
    const [inH, inM] = record.clockIn.split(':').map(Number);
    const inTotalMins = inH * 60 + inM;

    // Shift rule: 09:30 + 15 min = 585 mins
    const [startH, startM] = (policy.officeStartTime || '09:30').split(':').map(Number);
    const startTotalMins = startH * 60 + startM;
    const graceLimit = startTotalMins + (policy.gracePeriodMinutes ?? 15);
    const isLate = inTotalMins > graceLimit;

    let workedMins = 0;
    let overtimeHours = 0;

    if (record.clockOut) {
      const [outH, outM] = record.clockOut.split(':').map(Number);
      const outTotalMins = outH * 60 + outM;
      workedMins = Math.max(0, outTotalMins - inTotalMins);

      const [endH, endM] = (policy.officeEndTime || '18:00').split(':').map(Number);
      const endTotalMins = endH * 60 + endM;
      if (outTotalMins > endTotalMins) {
        overtimeHours = Number(((outTotalMins - endTotalMins) / 60).toFixed(1));
      }
    }

    const calculatedStatus = record.status || (isLate ? 'late' : 'present');

    const existingIndex = attendance.findIndex(a => a.userId === record.userId && a.date === record.date);

    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...attendance];
      updated[existingIndex] = {
        ...updated[existingIndex],
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        totalWorkMinutes: workedMins,
        status: calculatedStatus,
        isLate,
        overtimeHours,
        managerRemarks: record.managerRemarks || updated[existingIndex].managerRemarks || 'Adjusted by manager',
        editedBy: currentUser.name
      };
    } else {
      const newRec: AttendanceRecord = {
        id: 'att-man-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        userId: record.userId,
        userName,
        department,
        date: record.date,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        totalWorkMinutes: workedMins,
        status: calculatedStatus,
        isLate,
        overtimeHours,
        managerRemarks: record.managerRemarks || 'Manually entered by manager',
        editedBy: currentUser.name
      };
      updated = [newRec, ...attendance];
    }

    syncData(STORAGE_KEYS.ATTENDANCE, updated, setAttendance);
    showNotification('Attendance Saved', `Attendance for ${userName} on ${record.date} recorded successfully.`, 'success');
  }, [attendance, users, currentUser, policy, showNotification]);

  const bulkBackfillAttendance = useCallback((records: {
    userId: string;
    userName: string;
    department: string;
    date: string;
    clockIn: string;
    clockOut: string;
    status: 'present' | 'late' | 'half_day' | 'wfh' | 'leave';
    managerRemarks?: string;
  }[]) => {
    let currentList = [...attendance];

    records.forEach(rec => {
      const [inH, inM] = rec.clockIn.split(':').map(Number);
      const inTotalMins = inH * 60 + inM;
      const [outH, outM] = rec.clockOut.split(':').map(Number);
      const outTotalMins = outH * 60 + outM;
      const workedMins = Math.max(0, outTotalMins - inTotalMins);

      const [startH, startM] = (policy.officeStartTime || '09:30').split(':').map(Number);
      const isLate = inTotalMins > (startH * 60 + startM + (policy.gracePeriodMinutes ?? 15));

      const [endH, endM] = (policy.officeEndTime || '18:00').split(':').map(Number);
      const endTotalMins = endH * 60 + endM;
      const overtimeHours = outTotalMins > endTotalMins ? Number(((outTotalMins - endTotalMins) / 60).toFixed(1)) : 0;

      const idx = currentList.findIndex(a => a.userId === rec.userId && a.date === rec.date);
      const entry: AttendanceRecord = {
        id: idx >= 0 ? currentList[idx].id : 'att-bf-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        userId: rec.userId,
        userName: rec.userName,
        department: rec.department,
        date: rec.date,
        clockIn: rec.clockIn,
        clockOut: rec.clockOut,
        totalWorkMinutes: workedMins,
        status: rec.status,
        isLate,
        overtimeHours,
        managerRemarks: rec.managerRemarks || '5-Day Shift Backfill (09:30 - 18:00)',
        editedBy: currentUser.name
      };

      if (idx >= 0) {
        currentList[idx] = entry;
      } else {
        currentList.push(entry);
      }
    });

    syncData(STORAGE_KEYS.ATTENDANCE, currentList, setAttendance);
    showNotification('Backfill Successful', `${records.length} attendance records logged and synchronized.`, 'success');
  }, [attendance, policy, currentUser, showNotification]);

  const deleteAttendanceRecord = useCallback((id: string) => {
    const updated = attendance.filter(a => a.id !== id);
    syncData(STORAGE_KEYS.ATTENDANCE, updated, setAttendance);
    showNotification('Record Deleted', 'Attendance record removed.', 'info');
  }, [attendance, showNotification]);

  // Announcements
  const addAnnouncement = useCallback((data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnc: Announcement = {
      ...data,
      id: 'anc-' + Date.now().toString(36),
      createdAt: new Date().toISOString()
    };

    const updated = [newAnc, ...announcements];
    syncData(STORAGE_KEYS.ANNOUNCEMENTS, updated, setAnnouncements);
    showNotification('Notice Published', `Broadcast "${data.title}" posted to ${data.targetDepartment.toUpperCase()}`, 'urgent');
  }, [announcements, showNotification]);

  const updateAnnouncement = useCallback((id: string, updates: Partial<Announcement>) => {
    const updated = announcements.map(a => a.id === id ? {
      ...a,
      ...updates,
      updatedAt: new Date().toISOString()
    } : a);
    syncData(STORAGE_KEYS.ANNOUNCEMENTS, updated, setAnnouncements);
    showNotification('Notice Updated', 'Announcement modified and broadcast updated in real time.', 'info');
  }, [announcements, showNotification]);

  const deleteAnnouncement = useCallback((id: string) => {
    const target = announcements.find(a => a.id === id);
    const updated = announcements.filter(a => a.id !== id);
    syncData(STORAGE_KEYS.ANNOUNCEMENTS, updated, setAnnouncements);
    showNotification('Notice Removed', `Announcement "${target?.title || ''}" was deleted.`, 'warning');
  }, [announcements, showNotification]);

  // Payroll
  const generateMonthlyPayroll = useCallback((month: string, year: number) => {
    const newPayslips: Payslip[] = users.map(user => {
      const basic = user.salary || 5000;
      // Calculate approved overtime
      const userRequests = requests.filter(r => r.userId === user.id && r.type === 'overtime' && r.status === 'approved');
      const totalOvertimeHours = userRequests.reduce((acc, curr) => acc + (curr.hours || 0), 0);
      const hourlyRate = basic / (22 * 8); // 22 working days * 8h
      const overtimePay = Math.round(totalOvertimeHours * hourlyRate * 1.5);

      // Calculate unpaid leaves (Loss of Pay)
      const userLeaves = requests.filter(r => r.userId === user.id && r.type === 'leave' && r.status === 'approved');
      const totalLeaveDays = userLeaves.length;
      const allowedQuota = (user.leaveQuota.medical + user.leaveQuota.casual + user.leaveQuota.annual) / 12; // monthly allowance
      const lopDays = Math.max(0, Math.round(totalLeaveDays - allowedQuota));
      const dailyRate = basic / 22;
      const lopDeduction = Math.round(lopDays * dailyRate);

      const allowances = Math.round(basic * 0.08); // 8% standard allowances
      const taxDeduction = Math.round(basic * 0.1); // 10% tax bracket
      const netSalary = Math.round(basic + overtimePay + allowances - lopDeduction - taxDeduction);

      return {
        id: 'pay-' + Date.now().toString(36) + '-' + user.id,
        userId: user.id,
        userName: user.name,
        designation: user.designation,
        department: user.department,
        month,
        year,
        basicSalary: basic,
        overtimeHours: totalOvertimeHours,
        overtimePay,
        lossOfPayDays: lopDays,
        lossOfPayDeduction: lopDeduction,
        allowances,
        taxDeduction,
        netSalary,
        generatedAt: new Date().toISOString().split('T')[0],
        status: 'processed'
      };
    });

    syncData(STORAGE_KEYS.PAYSLIPS, newPayslips, setPayslips);
    showNotification('Payroll Executed', `Consolidated payslips generated for ${month} ${year} across all staff.`, 'success');
  }, [users, requests, showNotification]);

  const getPayslipsForUser = useCallback((userId: string) => {
    return payslips.filter(p => p.userId === userId);
  }, [payslips]);

  // Policy & Departments
  const updateCompanyPolicy = useCallback((updates: Partial<CompanyPolicy>) => {
    const updated = { ...policy, ...updates };
    syncData(STORAGE_KEYS.POLICY, updated, setPolicy);
    showNotification('Policies Updated', 'Office timings and grace periods updated successfully.', 'success');
  }, [policy, showNotification]);

  const addDepartment = useCallback((deptName: string): boolean => {
    const trimmed = deptName.trim();
    if (!trimmed) return false;
    const currentDepts = policy.departments || [];
    if (currentDepts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      showNotification('Department Exists', `Department "${trimmed}" is already generated.`, 'warning');
      return false;
    }
    const updatedDepts = [...currentDepts, trimmed];
    const updatedPolicy = { ...policy, departments: updatedDepts };
    syncData(STORAGE_KEYS.POLICY, updatedPolicy, setPolicy);
    showNotification('Department Created', `Department "${trimmed}" generated successfully.`, 'success');
    return true;
  }, [policy, showNotification]);

  const deleteDepartment = useCallback((deptName: string) => {
    const currentDepts = policy.departments || [];
    const updatedDepts = currentDepts.filter(d => d !== deptName);
    const updatedPolicy = { ...policy, departments: updatedDepts };
    syncData(STORAGE_KEYS.POLICY, updatedPolicy, setPolicy);
    showNotification('Department Removed', `Department "${deptName}" was deleted.`, 'info');
  }, [policy, showNotification]);

  return (
    <AppDataContext.Provider
      value={{
        projects,
        tasks,
        reports,
        requests,
        attendance,
        announcements,
        payslips,
        policy,
        addProject,
        updateProject,
        deleteProject,
        withdrawProject,
        reactivateProject,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        toggleTaskTimer,
        getTasksForUser,
        generateEODPreview,
        submitEODReport,
        reviewEODReport,
        submitRequest,
        reviewRequest,
        clockIn,
        clockOut,
        getUserTodayAttendance,
        updateAttendanceRecord,
        manualRecordAttendance,
        bulkBackfillAttendance,
        deleteAttendanceRecord,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        generateMonthlyPayroll,
        getPayslipsForUser,
        updateCompanyPolicy,
        addDepartment,
        deleteDepartment
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
