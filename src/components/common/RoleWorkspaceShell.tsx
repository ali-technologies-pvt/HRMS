'use client';
import { useEffect, useState } from 'react';
import { LayoutGrid, CheckSquare, Activity, FileText, CalendarDays, MessageSquare, Megaphone, Wallet, Users, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Topbar } from '@/components/layout/Topbar';
import type { PortalView } from '@/components/layout/Sidebar';
import './luxury-admin.css';
import './admin-finish.css';
import './brand-system.css';
import './role-workspace.css';
const employeeNav=[['emp_dashboard','Overview',LayoutGrid],['emp_tasks','My tasks',CheckSquare],['emp_attendance','My attendance',CalendarDays],['emp_requests','My requests',FileText],['emp_payslips','Payslips',Wallet],['emp_noticeboard','Noticeboard',Megaphone],['team_chat','Team chat',MessageSquare]] as const;
const managerNav=[['manager_dashboard','Overview',LayoutGrid],['manager_tasks','Task allocation',CheckSquare],['manager_team_monitor','Live activity',Activity],['hr_attendance','Attendance',CalendarDays],['manager_approvals','Requests',FileText],['manager_eod_desk','EOD reports',FileText],['hr_announcements','Announcements',Megaphone],['team_chat','Team chat',MessageSquare]] as const;
const hrNav=[['manager_dashboard','Overview',LayoutGrid],['hr_attendance','Attendance',CalendarDays],['manager_approvals','Requests',FileText],['hr_leave_management','Leave management',Users],['hr_payroll','Payroll & slips',Wallet],['hr_announcements','Announcements',Megaphone],['team_chat','Team chat',MessageSquare]] as const;
export function RoleWorkspaceShell({children,view,onNavigate,workspace,onWorkspace}:{children:React.ReactNode;view:PortalView;onNavigate:(view:PortalView)=>void;workspace:'manager'|'hr';onWorkspace:(tab:'manager'|'hr')=>void}){
 const {currentUser}=useAuth();const {theme}=useTheme();const [mobile,setMobile]=useState(false);const [appearance,setAppearance]=useState({cover:'navy',density:'comfortable'});
 useEffect(()=>{const load=()=>{try{const a=JSON.parse(localStorage.getItem('quickslogx_appearance_'+currentUser.id)||'{}');setAppearance({cover:['navy','amber','slate'].includes(a.cover)?a.cover:'navy',density:a.density==='compact'?'compact':'comfortable'});}catch{}};load();window.addEventListener('quickslogx-appearance',load);return()=>window.removeEventListener('quickslogx-appearance',load);},[currentUser.id]);
 const personal=currentUser.role==='employee';const nav=personal?employeeNav:workspace==='hr'?hrNav:managerNav;
 const navigate=(value:PortalView)=>{onNavigate(value);setMobile(false);window.scrollTo({top:0,behavior:'instant'});};
 return <div className="atelier atelier-live role-workspace" data-theme={theme} data-cover={appearance.cover} data-density={appearance.density}>{mobile&&<button className="rw-scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}<aside className="rw-sidebar" data-open={mobile}><a className="rw-logo" href="/" aria-label="Quickslogix home"><img src="/company-logo.png" alt="quickslogix"/></a><button className="rw-mobile-close" aria-label="Close navigation" onClick={()=>setMobile(false)}><X size={20}/></button><div className="rw-workspace-label">{personal?'PERSONAL WORKSPACE':'PEOPLE & OPERATIONS'}</div>{!personal&&<div className="rw-switch">{(['manager','hr'] as const).map(tab=><button key={tab} aria-pressed={workspace===tab} onClick={()=>{onWorkspace(tab);navigate(tab==='hr'?'hr_attendance':'manager_dashboard');}}>{tab==='hr'?'Human resources':'Management'}</button>)}</div>}<nav aria-label="Workspace navigation">{nav.map(([id,label,Icon])=><button key={id} aria-current={view===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="rw-sidebar-footer"><span>QUICKSLOGIX HRMS</span><strong>Good people.<br/>Exceptional work.</strong><span className="rw-connected"><i/>Connected workspace</span></div></aside><div className="rw-body"><div className="rw-topbar"><Topbar onOpenChat={()=>navigate('team_chat')} onToggleMobileMenu={()=>setMobile(!mobile)} isMobileMenuOpen={mobile}/></div><main className="rw-main">{children}</main></div></div>;
}
