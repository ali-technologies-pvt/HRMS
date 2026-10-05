import {
  User,
  Project,
  Task,
  DailyReport,
  RequestItem,
  AttendanceRecord,
  Announcement,
  Payslip,
  CompanyPolicy,
  NotificationItem
} from '@/types';
import {
  initialUsers,
  initialProjects,
  initialTasks,
  initialDailyReports,
  initialRequests,
  initialAttendance,
  initialAnnouncements,
  initialPayslips,
  initialCompanyPolicy
} from './initialData';

export const STORAGE_KEYS = {
  USERS: 'quickslogx_users_v6',
  PROJECTS: 'quickslogx_projects_v6',
  TASKS: 'quickslogx_tasks_v6',
  REPORTS: 'quickslogx_reports_v6',
  REQUESTS: 'quickslogx_requests_v6',
  ATTENDANCE: 'quickslogx_attendance_v6',
  ANNOUNCEMENTS: 'quickslogx_announcements_v6',
  PAYSLIPS: 'quickslogx_payslips_v6',
  POLICY: 'quickslogx_policy_v6',
  NOTIFICATIONS: 'quickslogx_notifications_v6',
  ACTIVE_USER_ID: 'quickslogx_active_user_id_v6',
  IS_AUTHENTICATED: 'quickslogx_is_authenticated_v6',
  CHAT_GROUPS: 'quickslogx_chat_groups_v6',
  CHAT_MESSAGES: 'quickslogx_chat_messages_v6',
};

// Safe JSON parse from localStorage with fallback
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error reading ${key} from storage, resetting to fallback:`, error);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

export function resetAllStorageToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialProjects));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialTasks));
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(initialDailyReports));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(initialRequests));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(initialAnnouncements));
  localStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(initialPayslips));
  localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(initialCompanyPolicy));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
}
