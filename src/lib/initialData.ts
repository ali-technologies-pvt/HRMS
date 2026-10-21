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
  ChatGroup,
  ChatMessage
} from '@/types';

// Helper to compute recent dates for realistic dynamic initial history
const getRecentDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Ali Raza',
    email: 'ali.raza@quickslogix.com',
    password: '#Imthepassword@123#',
    tempPassword: false,
    mustChangePassword: false,
    role: 'super_admin',
    department: 'Executive Administration',
    designation: 'Chief Technology & Ops Officer / Super Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+92 300 1234567',
    bio: 'Super Admin and Lead Architect of quickslogx Enterprise Systems.',
    status: 'online',
    salary: 15000,
    joiningDate: '2026-01-01',
    leaveQuota: { medical: 12, casual: 12, annual: 24 },
    themePreference: 'liquid-dark'
  },
  {
    id: 'usr-mgr-1',
    name: 'Sarah Jenkins',
    email: 'manager@quickslogix.com',
    password: 'manager@123',
    tempPassword: false,
    mustChangePassword: false,
    role: 'manager',
    department: 'Engineering & Operations',
    designation: 'VP of Engineering & Team Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 555 0192',
    bio: 'Leading product engineering, sprint velocity, and technical operations.',
    status: 'online',
    salary: 12000,
    joiningDate: '2026-02-15',
    leaveQuota: { medical: 12, casual: 10, annual: 20 },
    themePreference: 'liquid-dark'
  },
  {
    id: 'usr-emp-1',
    name: 'David Chen',
    email: 'david.chen@quickslogix.com',
    password: 'employee@123',
    tempPassword: false,
    mustChangePassword: false,
    role: 'employee',
    department: 'Engineering',
    designation: 'Senior Fullstack Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 555 0143',
    bio: 'Specializing in Next.js, distributed backend microservices, and WebGPU UI.',
    status: 'online',
    activeProjectId: 'proj-1',
    activeTaskId: 'task-1',
    salary: 7500,
    joiningDate: '2026-03-01',
    leaveQuota: { medical: 10, casual: 8, annual: 18 },
    themePreference: 'liquid-dark'
  },
  {
    id: 'usr-emp-2',
    name: 'Ayesha Khan',
    email: 'ayesha.khan@quickslogix.com',
    password: 'employee@123',
    tempPassword: false,
    mustChangePassword: false,
    role: 'employee',
    department: 'Product & Design',
    designation: 'Senior UI/UX & Motion Designer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+92 321 9876543',
    bio: 'Crafting fluid motion, glassy spatial user interfaces, and micro-interactions.',
    status: 'online',
    activeProjectId: 'proj-1',
    activeTaskId: 'task-2',
    salary: 6800,
    joiningDate: '2026-04-10',
    leaveQuota: { medical: 10, casual: 8, annual: 18 },
    themePreference: 'liquid-dark'
  },
  {
    id: 'usr-emp-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@quickslogix.com',
    password: 'employee@123',
    tempPassword: false,
    mustChangePassword: false,
    role: 'employee',
    department: 'Infrastructure & Cloud',
    designation: 'DevOps & Cloud Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 555 0188',
    bio: 'Kubernetes orchestration, automated CI/CD pipelines, and zero-trust security.',
    status: 'online',
    activeProjectId: 'proj-2',
    activeTaskId: 'task-3',
    salary: 7200,
    joiningDate: '2026-05-01',
    leaveQuota: { medical: 10, casual: 8, annual: 18 },
    themePreference: 'liquid-dark'
  }
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Executive Design System V14',
    client: 'quickslogx Internal',
    department: 'Product & Design',
    budget: 85000,
    deadline: getRecentDate(-30),
    status: 'active',
    description: 'High-contrast frosted glassy executive suite with fluid physics-based gestures and real-time telemetry.',
    leadId: 'usr-mgr-1',
    createdBy: 'usr-admin-1',
    createdAt: getRecentDate(45)
  },
  {
    id: 'proj-2',
    name: 'HealthAI Cloud Platform',
    client: 'Apex BioLabs',
    department: 'Engineering',
    budget: 140000,
    deadline: getRecentDate(-45),
    status: 'active',
    description: 'Distributed genomic clinical data pipeline and high-throughput real-time analytics engine.',
    leadId: 'usr-mgr-1',
    createdBy: 'usr-mgr-1',
    createdAt: getRecentDate(60)
  },
  {
    id: 'proj-3',
    name: 'Zero-Trust Infrastructure Guard',
    client: 'FinTech Global',
    department: 'Infrastructure & Cloud',
    budget: 95000,
    deadline: getRecentDate(-60),
    status: 'active',
    description: 'Global multi-region edge deployment with automated compliance audits and telemetry hooks.',
    leadId: 'usr-mgr-1',
    createdBy: 'usr-admin-1',
    createdAt: getRecentDate(20)
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement Fluid Area Telemetry Chart',
    description: 'Render high-precision SVG area curves with dynamic path length animations and interactive date tooltips.',
    projectId: 'proj-1',
    projectName: 'Executive Design System V14',
    category: 'Frontend',
    commentsCount: 3,
    attachmentsCount: 1,
    assignedToId: 'usr-emp-1',
    assignedToName: 'David Chen',
    assignedToAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedById: 'usr-mgr-1',
    assignedByName: 'Sarah Jenkins',
    priority: 'high',
    status: 'in_progress',
    deadline: getRecentDate(-2),
    estimatedHours: 16,
    loggedHours: 11,
    timerActive: false,
    createdAt: getRecentDate(4)
  },
  {
    id: 'task-2',
    title: 'Refactor High-Contrast Frosted Glass Tokens',
    description: 'Audit light and dark color contrast tokens, eliminate boxed containers, and unify capsule pills.',
    projectId: 'proj-1',
    projectName: 'Executive Design System V14',
    category: 'UI Design',
    commentsCount: 5,
    attachmentsCount: 2,
    assignedToId: 'usr-emp-2',
    assignedToName: 'Ayesha Khan',
    assignedToAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedById: 'usr-mgr-1',
    assignedByName: 'Sarah Jenkins',
    priority: 'urgent',
    status: 'completed',
    deadline: getRecentDate(1),
    estimatedHours: 20,
    loggedHours: 19,
    completedAt: getRecentDate(1),
    timerActive: false,
    createdAt: getRecentDate(7)
  },
  {
    id: 'task-3',
    title: 'Deploy Multi-Region Edge Kubernetes Clusters',
    description: 'Configure automated rollouts with zero downtime and Prometheus latency telemetry probes.',
    projectId: 'proj-3',
    projectName: 'Zero-Trust Infrastructure Guard',
    category: 'DevOps',
    commentsCount: 2,
    attachmentsCount: 0,
    assignedToId: 'usr-emp-3',
    assignedToName: 'Marcus Vance',
    assignedToAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assignedById: 'usr-mgr-1',
    assignedByName: 'Sarah Jenkins',
    priority: 'high',
    status: 'in_progress',
    deadline: getRecentDate(-4),
    estimatedHours: 24,
    loggedHours: 14,
    timerActive: false,
    createdAt: getRecentDate(5)
  },
  {
    id: 'task-4',
    title: 'Clinical Data Stream Ingestion Endpoint',
    description: 'Establish high-throughput WebSocket streams for genomic sequence ingestion with rate-limiting.',
    projectId: 'proj-2',
    projectName: 'HealthAI Cloud Platform',
    category: 'Backend',
    commentsCount: 1,
    attachmentsCount: 1,
    assignedToId: 'usr-emp-1',
    assignedToName: 'David Chen',
    assignedToAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedById: 'usr-mgr-1',
    assignedByName: 'Sarah Jenkins',
    priority: 'medium',
    status: 'needs_review',
    deadline: getRecentDate(-3),
    estimatedHours: 18,
    loggedHours: 18,
    timerActive: false,
    createdAt: getRecentDate(6)
  },
  {
    id: 'task-5',
    title: 'Automated Security Penetration Testing',
    description: 'Run automated vulnerability tests against API endpoints and verify role-based token boundaries.',
    projectId: 'proj-3',
    projectName: 'Zero-Trust Infrastructure Guard',
    category: 'QA',
    commentsCount: 0,
    attachmentsCount: 0,
    assignedToId: 'usr-emp-3',
    assignedToName: 'Marcus Vance',
    assignedToAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assignedById: 'usr-mgr-1',
    assignedByName: 'Sarah Jenkins',
    priority: 'medium',
    status: 'pending',
    deadline: getRecentDate(-7),
    estimatedHours: 12,
    loggedHours: 0,
    timerActive: false,
    createdAt: getRecentDate(2)
  }
];

export const initialDailyReports: DailyReport[] = [
  {
    id: 'rep-1',
    userId: 'usr-emp-1',
    userName: 'David Chen',
    userRole: 'employee',
    department: 'Engineering',
    date: getRecentDate(1),
    completedTasks: ['Clinical Data Stream Ingestion Endpoint schema validation'],
    inProgressTasks: ['Implement Fluid Area Telemetry Chart'],
    pendingTasks: ['Mobile Biometric Auth integration'],
    blockers: 'None. All APIs responding with sub-30ms latency.',
    tomorrowPlan: 'Finalize SVG stroke animations and connect live attendance feeds.',
    additionalNotes: 'Great sprint progress so far.',
    approvalStatus: 'approved',
    submittedAt: `${getRecentDate(1)}T17:45:00.000Z`
  },
  {
    id: 'rep-2',
    userId: 'usr-emp-2',
    userName: 'Ayesha Khan',
    userRole: 'employee',
    department: 'Product & Design',
    date: getRecentDate(1),
    completedTasks: ['Refactor High-Contrast Frosted Glass Tokens'],
    inProgressTasks: ['Kanban board glassy card transition polish'],
    pendingTasks: ['Icon micro-hover states audit'],
    blockers: 'None.',
    tomorrowPlan: 'Review typography hierarchy in Manager Workspace.',
    additionalNotes: 'Design tokens fully aligned with executive specs.',
    approvalStatus: 'approved',
    submittedAt: `${getRecentDate(1)}T17:55:00.000Z`
  }
];

export const initialRequests: RequestItem[] = [
  {
    id: 'req-1',
    userId: 'usr-emp-1',
    userName: 'David Chen',
    department: 'Engineering',
    type: 'leave',
    subType: 'annual',
    title: 'Annual Family Vacation',
    reason: 'Planned family leave following the V14 sprint launch.',
    startDate: getRecentDate(-10),
    endDate: getRecentDate(-14),
    status: 'pending',
    createdAt: getRecentDate(1)
  }
];

// Generate past 7 days of attendance records for the team so the 7-day graphs compute real data
const generateRecentAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const teamMembers = [
    { id: 'usr-mgr-1', name: 'Sarah Jenkins', dept: 'Engineering & Operations' },
    { id: 'usr-emp-1', name: 'David Chen', dept: 'Engineering' },
    { id: 'usr-emp-2', name: 'Ayesha Khan', dept: 'Product & Design' },
    { id: 'usr-emp-3', name: 'Marcus Vance', dept: 'Infrastructure & Cloud' }
  ];

  // Past 6 days + today (daysAgo: 6, 5, 4, 3, 2, 1, 0)
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const dateStr = getRecentDate(daysAgo);
    const dayOfWeek = new Date(dateStr).getDay();
    // Skip weekends (0 is Sunday, 6 is Saturday) for standard work records
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    teamMembers.forEach((member, idx) => {
      if (isWeekend) return;

      const isToday = daysAgo === 0;
      const isLate = !isToday && idx === 3 && daysAgo === 2; // Marcus was late 2 days ago
      const clockIn = isLate ? '09:48' : `09:${10 + idx * 4}`;
      const clockOut = isToday ? undefined : `18:${15 + idx * 5}`;
      const totalMinutes = isToday ? 280 : 510;

      records.push({
        id: `att-${member.id}-${dateStr}`,
        userId: member.id,
        userName: member.name,
        department: member.dept,
        date: dateStr,
        clockIn,
        clockOut,
        totalWorkMinutes: totalMinutes,
        status: isLate ? 'late' : 'present',
        isLate,
        lateReason: isLate ? 'Traffic congestion on transit line' : undefined,
        overtimeHours: daysAgo === 3 ? 1.5 : 0
      });
    });
  }

  return records;
};

export const initialAttendance: AttendanceRecord[] = generateRecentAttendance();

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'quickslogx Executive System V14 Released',
    content: 'The new high-contrast glassy architecture, real-time telemetry, and unified team management suite are now live for all departments.',
    type: 'general_notice',
    targetDepartment: 'all',
    authorName: 'Ali Raza',
    authorRole: 'super_admin',
    priority: true,
    createdAt: getRecentDate(2)
  }
];

export const initialPayslips: Payslip[] = [];

export const initialChatGroups: ChatGroup[] = [
  {
    id: 'grp-eng',
    name: 'Core Engineering & Architecture',
    description: 'Sprint planning, code reviews, and tech discussions',
    memberIds: ['usr-admin-1', 'usr-mgr-1', 'usr-emp-1', 'usr-emp-3'],
    createdBy: 'usr-admin-1',
    createdByName: 'Ali Raza',
    createdAt: getRecentDate(20)
  },
  {
    id: 'grp-design',
    name: 'Product Design & UX Guild',
    description: 'Spatial UI tokens, motion graphics, and usability feedback',
    memberIds: ['usr-mgr-1', 'usr-emp-2'],
    createdBy: 'usr-mgr-1',
    createdByName: 'Sarah Jenkins',
    createdAt: getRecentDate(15)
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    groupId: 'grp-eng',
    senderId: 'usr-mgr-1',
    senderName: 'Sarah Jenkins',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    text: 'Team, the sprint goals for the Executive Design System V14 are on track. Great work on the high-contrast tokens!',
    timestamp: `${getRecentDate(0)}T09:30:00.000Z`,
    createdAt: `${getRecentDate(0)}T09:30:00.000Z`
  },
  {
    id: 'msg-2',
    groupId: 'grp-eng',
    senderId: 'usr-emp-1',
    senderName: 'David Chen',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'Thanks Sarah! Telemetry graphs are now fully connected with real-time data.',
    timestamp: `${getRecentDate(0)}T09:35:00.000Z`,
    createdAt: `${getRecentDate(0)}T09:35:00.000Z`
  }
];

export const initialCompanyPolicy: CompanyPolicy = {
  officeStartTime: '09:30',
  officeEndTime: '18:00',
  gracePeriodMinutes: 15,
  workDaysPerWeek: 5,
  departments: ['Executive Administration', 'Engineering & Operations', 'Engineering', 'Product & Design', 'Infrastructure & Cloud'],
  designations: [
    'Chief Technology & Ops Officer / Super Admin',
    'VP of Engineering & Team Lead',
    'Senior Fullstack Engineer',
    'Senior UI/UX & Motion Designer',
    'DevOps & Cloud Engineer',
    'Head of People & Talent',
    'QA Automation Specialist'
  ],
  holidays: [
    {
      id: 'hol-1',
      title: 'New Year Celebration',
      date: '2026-01-01',
      description: 'Annual corporate kickoff and holiday'
    },
    {
      id: 'hol-2',
      title: 'Iqbal Day & Mid-Autumn Break',
      date: '2026-11-09',
      description: 'Official national holiday and team well-being day'
    },
    {
      id: 'hol-3',
      title: 'Winter Solstice & Year-End Gala',
      date: '2026-12-25',
      description: 'Holiday festivities and global team shutdown'
    }
  ]
};
