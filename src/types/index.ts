export type UserRole = 'super_admin' | 'manager' | 'hr' | 'manager_hr' | 'employee';

export type UserStatus = 'online' | 'offline' | 'break' | 'in_meeting';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'needs_review' | 'completed' | 'blocked';

export type RequestType = 'leave' | 'wfh' | 'late_excuse' | 'overtime';
export type LeaveSubType = 'medical' | 'casual' | 'annual';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type AnnouncementType = 'urgent_alert' | 'general_notice' | 'holiday_alert';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  tempPassword?: boolean;
  mustChangePassword?: boolean;
  role: UserRole;
  department: string;
  designation: string;
  avatarUrl: string;
  phone: string;
  bio?: string;
  status: UserStatus;
  activeProjectId?: string;
  activeTaskId?: string;
  activeTaskStartedAt?: string; // ISO date
  salary: number;
  joiningDate: string;
  leaveQuota: {
    medical: number;
    casual: number;
    annual: number;
  };
  managerId?: string;
  themePreference?: 'liquid-dark' | 'liquid-light' | 'obsidian';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  department?: string;
  budget?: number;
  deadline?: string;
  status: 'active' | 'completed' | 'on_hold' | 'withdrawn';
  description: string;
  leadId?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  category?: string; // e.g. 'UI Design', 'Copywriting', 'Illustration', 'Frontend', 'Backend', 'QA'
  commentsCount?: number;
  attachmentsCount?: number;
  assignedToId: string; // STRICT DATA PRIVACY: only visible to assigned user and manager/admin
  assignedToName?: string;
  assignedToAvatar?: string;
  assignedById: string;
  assignedByName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  estimatedHours: number;
  loggedHours: number;
  startedAt?: string;
  completedAt?: string;
  timerActive: boolean;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  department: string;
  date: string; // YYYY-MM-DD
  completedTasks: string[]; // List of task titles/summaries
  inProgressTasks: string[];
  pendingTasks: string[];
  blockers: string;
  tomorrowPlan: string;
  additionalNotes: string;
  managerRemarks?: string;
  approvalStatus: 'pending' | 'approved' | 'revision_requested';
  submittedAt: string;
}

export interface RequestItem {
  id: string;
  userId: string;
  userName: string;
  department: string;
  type: RequestType;
  subType?: LeaveSubType;
  title: string;
  reason: string;
  startDate: string;
  endDate?: string;
  hours?: number; // for overtime or late excuse
  projectDetails?: string; // for overtime
  status: RequestStatus;
  managerRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  department: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm or ISO
  clockOut?: string;
  totalWorkMinutes: number;
  status: 'present' | 'late' | 'half_day' | 'wfh' | 'leave';
  isLate: boolean;
  lateReason?: string;
  overtimeHours: number;
  managerRemarks?: string;
  editedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  targetDepartment: string; // 'all' or department name
  authorName: string;
  authorRole: UserRole;
  priority?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Payslip {
  id: string;
  userId: string;
  userName: string;
  designation: string;
  department: string;
  month: string; // e.g. "October 2026"
  year: number;
  basicSalary: number;
  overtimeHours: number;
  overtimePay: number;
  lossOfPayDays: number;
  lossOfPayDeduction: number;
  allowances: number;
  taxDeduction: number;
  netSalary: number;
  generatedAt: string;
  status: 'processed' | 'paid';
}

export interface CompanyPolicy {
  officeStartTime: string; // "09:00"
  officeEndTime: string;   // "18:00"
  gracePeriodMinutes: number; // 15 mins
  workDaysPerWeek: number; // 5
  departments: string[];
  designations: string[];
  holidays: {
    id: string;
    title: string;
    date: string;
    description: string;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  timestamp: string;
  read: boolean;
  targetRole?: UserRole;
  targetUserId?: string;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedUserName: string;
  invitedById: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string; // Must show employee name, NOT email
  senderAvatar?: string;
  senderRole?: UserRole;
  text: string;
  timestamp: string;
  createdAt: string;
  attachments?: {
    name: string;
    url: string;
    type?: string;
  }[];
  isSystem?: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  avatar?: string;
  memberIds: string[];
  pendingInvitations?: GroupInvitation[];
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: string;
  };
}

