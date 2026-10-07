'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { AmbientBackground } from '@/components/common/AmbientBackground';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar, PortalView } from '@/components/layout/Sidebar';
import { ForcePasswordModal } from '@/components/common/ForcePasswordModal';
import { DailyAttendancePopup } from '@/components/common/DailyAttendancePopup';

// Super Admin Components
import { LiveActivityTracker } from '@/components/superadmin/LiveActivityTracker';
import { OnboardingDesk } from '@/components/superadmin/OnboardingDesk';
import { CompanySetupDesk } from '@/components/superadmin/CompanySetupDesk';
import { BroadcastDesk } from '@/components/superadmin/BroadcastDesk';

// Manager Components
import { ManagerDashboard } from '@/components/manager/ManagerDashboard';
import { TaskAllocationDesk } from '@/components/manager/TaskAllocationDesk';
import { TeamLiveMonitor } from '@/components/manager/TeamLiveMonitor';
import { EODReportsDesk } from '@/components/manager/EODReportsDesk';
import { RequestsApprovalDesk } from '@/components/manager/RequestsApprovalDesk';

// HR Components
import { AttendanceDesk } from '@/components/hr/AttendanceDesk';
import { LeaveManagementDesk } from '@/components/hr/LeaveManagementDesk';
import { PayrollDesk } from '@/components/hr/PayrollDesk';

// Employee Components
import { MyTasksDesk } from '@/components/employee/MyTasksDesk';
import { PunchClockCard } from '@/components/employee/PunchClockCard';
import { EmployeeRequestsDesk } from '@/components/employee/EmployeeRequestsDesk';
import { PayslipViewer } from '@/components/employee/PayslipViewer';
import { EmployeeNoticeboard } from '@/components/employee/EmployeeNoticeboard';

// Auth Components
import { LoginPage } from '@/components/auth/LoginPage';

// Chat Components & Context
import { ChatProvider } from '@/context/ChatContext';
import { ChatDesk } from '@/components/chat/ChatDesk';
import { FloatingChatWidget } from '@/components/chat/FloatingChatWidget';

function HRMSPortalContent() {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<PortalView>('admin_overview');
  const [unifiedTab, setUnifiedTab] = useState<'manager' | 'hr'>('manager');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamically update view when role switches
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'super_admin') {
      setCurrentView('admin_overview');
    } else if (currentUser.role === 'manager') {
      setUnifiedTab('manager');
      setCurrentView('manager_dashboard');
    } else if (currentUser.role === 'hr') {
      setUnifiedTab('hr');
      setCurrentView('hr_attendance');
    } else if (currentUser.role === 'manager_hr') {
      setUnifiedTab('manager');
      setCurrentView('manager_dashboard');
    } else if (currentUser.role === 'employee') {
      setCurrentView('emp_tasks');
    }
  }, [currentUser?.role]);

  // If unauthenticated or no current user, enforce LoginPage
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // Render the appropriate portal view
  const renderView = () => {
    switch (currentView) {
      // Super Admin Views
      case 'admin_overview':
        return <LiveActivityTracker />;
      case 'admin_onboarding':
        return <OnboardingDesk />;
      case 'admin_company_setup':
        return <CompanySetupDesk />;
      case 'admin_broadcasts':
        return <BroadcastDesk />;

      // Manager Views
      case 'manager_dashboard':
        return <ManagerDashboard />;
      case 'manager_tasks':
        return <TaskAllocationDesk />;
      case 'manager_team_monitor':
        return <TeamLiveMonitor />;
      case 'manager_eod_desk':
        return <EODReportsDesk />;
      case 'manager_approvals':
        return <RequestsApprovalDesk />;

      // HR Views
      case 'hr_attendance':
        return <AttendanceDesk />;
      case 'hr_leave_management':
        return <LeaveManagementDesk />;
      case 'hr_payroll':
        return <PayrollDesk />;
      case 'hr_announcements':
        return <BroadcastDesk />;

      // Employee Views
      case 'emp_tasks':
        return <MyTasksDesk />;
      case 'emp_attendance':
        return <PunchClockCard />;
      case 'emp_requests':
        return <EmployeeRequestsDesk />;
      case 'emp_payslips':
        return <PayslipViewer />;
      case 'emp_noticeboard':
        return <EmployeeNoticeboard />;

      // Universal Team Chat
      case 'team_chat':
        return <ChatDesk />;

      default:
        return <LiveActivityTracker />;
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 flex flex-col bg-[#f4f6fb] dark:bg-[#080a11] selection:bg-sky-500/20 selection:text-slate-900 dark:selection:text-white transition-colors duration-300">
      {/* Dynamic Apple-style Liquid Mesh Ambient Glow */}
      <AmbientBackground />

      {/* Floating Crystal Topbar */}
      <Topbar
        onOpenChat={() => setCurrentView('team_chat')}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex relative z-10 w-full min-w-0">
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            setMobileMenuOpen(false);
          }}
          unifiedWorkspaceTab={unifiedTab}
          onSelectUnifiedTab={setUnifiedTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full min-w-0 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {/* First-Login Mandatory Change Password Modal */}
      <ForcePasswordModal />

      {/* First-Login Daily Attendance Prompt Popup */}
      <DailyAttendancePopup />

      {/* Global Real-Time Floating Live Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppDataProvider>
            <ChatProvider>
              <HRMSPortalContent />
            </ChatProvider>
          </AppDataProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
