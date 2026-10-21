'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmployeePortal } from '@/components/employee/EmployeePortal';
import { SuperAdminWorkspace } from '@/components/superadmin/SuperAdminWorkspace';
import { RoleWorkspaceShell } from '@/components/common/RoleWorkspaceShell';
import { WorkspaceOverview } from '@/components/common/WorkspaceOverview';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { AmbientBackground } from '@/components/common/AmbientBackground';
import { Topbar } from '@/components/layout/Topbar';
import { PortalView } from '@/components/layout/Sidebar';
import { ForcePasswordModal } from '@/components/common/ForcePasswordModal';

// Super Admin Components
import { LiveActivityTracker } from '@/components/superadmin/LiveActivityTracker';
import { OnboardingDesk } from '@/components/superadmin/OnboardingDesk';
import { CompanySetupDesk } from '@/components/superadmin/CompanySetupDesk';
import { BroadcastDesk } from '@/components/superadmin/BroadcastDesk';

// Manager Components
import { ManagerWorkspace } from '@/components/manager/ManagerWorkspace';
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
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard';
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
  const [loginTransition, setLoginTransition] = useState(false);
  const [currentView, setCurrentView] = useState<PortalView>('admin_overview');
  const [unifiedTab, setUnifiedTab] = useState<'manager' | 'hr'>('manager');
  const [showOperations, setShowOperations] = useState(false);
  const isDashboard = ['manager_dashboard', 'emp_dashboard'].includes(currentView);

  const currentRole = currentUser?.role;

  // Dynamically update view when role switches
  useEffect(() => {
    if (!currentRole) return;
    if (currentRole === 'super_admin') {
      setCurrentView('admin_overview');
    } else if (currentRole === 'manager') {
      setUnifiedTab('manager');
      setCurrentView('manager_dashboard');
    } else if (currentRole === 'hr') {
      setUnifiedTab('hr');
      setCurrentView('manager_dashboard');
    } else if (currentRole === 'manager_hr') {
      setUnifiedTab('manager');
      setCurrentView('manager_dashboard');
    } else if (currentRole === 'employee') {
      setCurrentView('emp_dashboard');
    }
  }, [currentRole]);

  // If unauthenticated or no current user, enforce LoginPage
  if (!isAuthenticated || !currentUser || loginTransition) {
    return <LoginPage onTransitionStart={() => setLoginTransition(true)} onTransitionEnd={() => setLoginTransition(false)} />;
  }

  // Smooth, luxurious entrance animation container after authentication
  if (currentUser.role === 'super_admin') {
    return (
      <motion.div
        key="super_admin"
        initial={{ opacity: 0, scale: 0.985, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full min-h-screen"
      >
        <SuperAdminWorkspace />
      </motion.div>
    );
  }

  if (currentUser.role === 'employee') {
    return (
      <motion.div
        key="employee"
        initial={{ opacity: 0, scale: 0.985, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full min-h-screen"
      >
        <EmployeePortal />
      </motion.div>
    );
  }

  if (currentUser.role === 'manager' || currentUser.role === 'manager_hr' || currentUser.role === 'hr') {
    return (
      <motion.div
        key="manager"
        initial={{ opacity: 0, scale: 0.985, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full min-h-screen"
      >
        <ManagerWorkspace />
      </motion.div>
    );
  }

  // Render the appropriate portal view fallback
  const renderView = () => {
    switch (currentView) {
      case 'admin_overview':
        return <LiveActivityTracker />;
      case 'admin_onboarding':
        return <OnboardingDesk />;
      case 'admin_company_setup':
        return <CompanySetupDesk />;
      case 'admin_broadcasts':
        return <BroadcastDesk />;
      case 'manager_dashboard':
        return unifiedTab === 'hr' ? <AttendanceDesk compactHeader /> : <ManagerDashboard />;
      case 'manager_tasks':
        return <TaskAllocationDesk />;
      case 'manager_team_monitor':
        return <TeamLiveMonitor />;
      case 'manager_eod_desk':
        return <EODReportsDesk />;
      case 'manager_approvals':
        return <RequestsApprovalDesk />;
      case 'hr_attendance':
        return <AttendanceDesk compactHeader />;
      case 'hr_leave_management':
        return <LeaveManagementDesk />;
      case 'hr_payroll':
        return <PayrollDesk />;
      case 'hr_announcements':
        return <BroadcastDesk />;
      case 'emp_dashboard':
        return <EmployeeDashboard onNavigate={setCurrentView} />;
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
      case 'team_chat':
        return <ChatDesk />;
      default:
        return <LiveActivityTracker />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full min-h-screen"
    >
      <RoleWorkspaceShell view={currentView} onNavigate={(view) => { setCurrentView(view); setShowOperations(false); }} workspace={unifiedTab} onWorkspace={setUnifiedTab}>
        <div className="studio-content">
          {isDashboard && <WorkspaceOverview view={currentView} workspace={unifiedTab} onNavigate={(view) => { setCurrentView(view); if (view === 'emp_dashboard') setShowOperations(true); }} />}
          {isDashboard && (
            <button className="studio-operations-toggle" type="button" aria-expanded={showOperations} onClick={() => setShowOperations(!showOperations)}>
              {showOperations ? 'Close operations desk' : 'Open operations desk'}
              <span>{showOperations ? '−' : '+'}</span>
            </button>
          )}
          {(!isDashboard || showOperations) && <div className="at-live-desk studio-operations">{renderView()}</div>}
        </div>
        <ForcePasswordModal />
        <div className="at-live-chat"><FloatingChatWidget /></div>
      </RoleWorkspaceShell>
    </motion.div>
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
