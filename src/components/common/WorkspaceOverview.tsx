'use client';
import { RoleOverview } from './RoleOverview';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import type { PortalView } from '@/components/layout/Sidebar';
export function WorkspaceOverview({ view, onNavigate, workspace }: { workspace?: 'manager' | 'hr'; view: PortalView; onNavigate: (view: PortalView) => void }) {
  const { currentUser, users } = useAuth();
  const { tasks, projects, requests, attendance, announcements } = useAppData();
  const kind = currentUser.role === 'employee' ? 'employee' : currentUser.role === 'super_admin' ? 'super_admin' : (workspace === 'hr' || view.startsWith('hr_')) ? 'hr' : 'manager';
  return <RoleOverview personal={kind==='employee'} hr={kind==='hr'} data={{user:currentUser,users,tasks,projects,requests,attendance,announcements}} onNavigate={onNavigate}/>;
}
