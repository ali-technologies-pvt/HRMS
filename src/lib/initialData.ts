import { User, Project, Task, DailyReport, RequestItem, AttendanceRecord, Announcement, Payslip, CompanyPolicy, ChatGroup, ChatMessage } from '@/types';

export const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    name: 'ali raza',
    email: 'ali.raza@quickslogix.com',
    password: '#Imthepassword@123#',
    tempPassword: false,
    mustChangePassword: false,
    role: 'super_admin',
    department: 'Executive Administration',
    designation: 'Chief Technology & Ops Officer / Super Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '',
    bio: 'Super Admin and Lead Architect of quickslogx Enterprise Systems.',
    status: 'online',
    salary: 15000,
    joiningDate: '2026-10-01',
    leaveQuota: { medical: 12, casual: 12, annual: 24 },
    themePreference: 'liquid-dark'
  }
];

export const initialProjects: Project[] = [];

export const initialTasks: Task[] = [];

export const initialDailyReports: DailyReport[] = [];

export const initialRequests: RequestItem[] = [];

export const initialAttendance: AttendanceRecord[] = [];

export const initialAnnouncements: Announcement[] = [];

export const initialPayslips: Payslip[] = [];

export const initialChatGroups: ChatGroup[] = [];

export const initialChatMessages: ChatMessage[] = [];

export const initialCompanyPolicy: CompanyPolicy = {
  officeStartTime: '09:30',
  officeEndTime: '18:00',
  gracePeriodMinutes: 15,
  workDaysPerWeek: 5,
  departments: [
    'Executive Administration',
    'Engineering',
    'Product Design',
    'Quality Assurance',
    'Human Resources',
    'Operations & HR',
    'Sales & Growth'
  ],
  designations: [
    'Chief Technology & Ops Officer / Super Admin',
    'VP of Engineering & Team Lead',
    'Head of People & Talent',
    'Director of Operations & People',
    'Senior Fullstack Engineer',
    'Junior Frontend Developer',
    'Senior UI/UX & Motion Designer',
    'Lead Test Automation Specialist',
    'DevOps & Cloud Engineer',
    'HR Generalist'
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
