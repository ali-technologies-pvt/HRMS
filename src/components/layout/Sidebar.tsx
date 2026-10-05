'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import {
  Home,
  CheckSquare,
  Activity,
  Users,
  Bell,
  Settings,
  HelpCircle,
  Search,
  ChevronRight,
  ChevronLeft,
  Layers,
  FolderKanban,
  FileText,
  DollarSign,
  Radio,
  Clock,
  CalendarCheck,
  Sparkles,
  ClipboardList,
  FileCheck2,
  CalendarDays,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type PortalView =
  // Super Admin
  | 'admin_overview'
  | 'admin_onboarding'
  | 'admin_company_setup'
  | 'admin_broadcasts'
  // Manager
  | 'manager_dashboard'
  | 'manager_tasks'
  | 'manager_team_monitor'
  | 'manager_eod_desk'
  | 'manager_approvals'
  // HR
  | 'hr_attendance'
  | 'hr_leave_management'
  | 'hr_payroll'
  | 'hr_announcements'
  // Employee
  | 'emp_tasks'
  | 'emp_attendance'
  | 'emp_requests'
  | 'emp_payslips'
  | 'emp_noticeboard'
  // Universal Chat
  | 'team_chat';

interface SidebarProps {
  currentView: PortalView;
  onSelectView: (view: PortalView) => void;
  unifiedWorkspaceTab: 'manager' | 'hr';
  onSelectUnifiedTab: (tab: 'manager' | 'hr') => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  unifiedWorkspaceTab,
  onSelectUnifiedTab
}: SidebarProps) {
  const { currentUser } = useAuth();
  const { requests, tasks, projects } = useAppData();
  const role = currentUser.role;

  // Collapsed state for mini-rail view (as shown in the 3rd sidebar in reference UI)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = role === 'super_admin';
  const isManager = role === 'manager';
  const isHR = role === 'hr';
  const isUnified = role === 'manager_hr' || isManager || isHR;
  const isEmployee = role === 'employee';

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const myPendingTasksCount = tasks.filter(
    t => (role === 'employee' ? t.assignedToId === currentUser.id : true) && t.status !== 'completed'
  ).length;

  // Define Navigation Items based on Role
  interface NavConfig {
    view: PortalView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hasRedDot?: boolean;
    badgeText?: string;
  }

  let menuItems: NavConfig[] = [];

  if (isSuperAdmin) {
    menuItems = [
      { view: 'admin_overview', label: 'Home', icon: Home },
      { view: 'admin_company_setup', label: 'Projects & Setup', icon: CheckSquare },
      { view: 'admin_onboarding', label: 'Users Desk', icon: Users, badgeText: 'Auto' },
      { view: 'admin_broadcasts', label: 'Broadcasts', icon: Bell, hasRedDot: true },
      { view: 'team_chat', label: 'Team Chat', icon: MessageSquare, badgeText: 'Live' }
    ];
  } else if (isUnified) {
    if (unifiedWorkspaceTab === 'manager') {
      menuItems = [
        { view: 'manager_dashboard', label: 'Home', icon: Home },
        { view: 'hr_attendance', label: 'Attendance Desk', icon: Clock },
        { view: 'manager_tasks', label: 'Task', icon: CheckSquare, badgeText: `${myPendingTasksCount}` },
        { view: 'manager_team_monitor', label: 'Activity', icon: Activity },
        { view: 'team_chat', label: 'Team Chat', icon: MessageSquare, badgeText: 'Live' },
        { view: 'manager_approvals', label: 'Requests', icon: Bell, hasRedDot: pendingRequestsCount > 0 },
        { view: 'manager_eod_desk', label: 'EOD Reports', icon: FileCheck2 }
      ];
    } else {
      menuItems = [
        { view: 'hr_attendance', label: 'Attendance Desk', icon: Clock },
        { view: 'hr_leave_management', label: 'Leave Quotas', icon: CalendarDays },
        { view: 'hr_payroll', label: 'Payroll & Slips', icon: DollarSign, badgeText: 'LOP' },
        { view: 'team_chat', label: 'Team Chat', icon: MessageSquare, badgeText: 'Live' },
        { view: 'hr_announcements', label: 'Circulars', icon: Megaphone }
      ];
    }
  } else if (isEmployee) {
    menuItems = [
      { view: 'emp_tasks', label: 'Task', icon: CheckSquare, badgeText: `${myPendingTasksCount}` },
      { view: 'team_chat', label: 'Team Chat', icon: MessageSquare, badgeText: 'Live' },
      { view: 'emp_attendance', label: 'Shift Clock', icon: Clock },
      { view: 'emp_requests', label: 'Requests', icon: Bell, hasRedDot: pendingRequestsCount > 0 },
      { view: 'emp_payslips', label: 'Payslips', icon: DollarSign },
      { view: 'emp_noticeboard', label: 'Noticeboard', icon: Megaphone }
    ];
  }

  // Filter items by search query if user types in search
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items (Colored circles as shown in the reference UI)
  const groupItems = [
    {
      id: 'active_projects',
      label: 'Active Projects',
      color: 'bg-emerald-500',
      action: () => {
        if (isSuperAdmin) onSelectView('admin_company_setup');
        else if (isUnified) onSelectView('manager_tasks');
        else onSelectView('emp_tasks');
      },
      count: projects.filter(p => p.status !== 'withdrawn').length
    },
    {
      id: 'reports_desk',
      label: 'Reports Desk',
      color: 'bg-blue-500',
      action: () => {
        if (isSuperAdmin) onSelectView('admin_overview');
        else if (isUnified) onSelectView('manager_eod_desk');
        else onSelectView('emp_attendance');
      }
    },
    {
      id: 'clearances',
      label: 'Clearances',
      color: 'bg-rose-500',
      action: () => {
        if (isUnified) onSelectView('manager_approvals');
        else onSelectView('emp_requests');
      },
      count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    {
      id: 'policies',
      label: 'Office Policies',
      color: 'bg-amber-500',
      action: () => {
        if (isSuperAdmin) onSelectView('admin_company_setup');
        else if (isUnified) onSelectView('manager_dashboard');
        else onSelectView('emp_noticeboard');
      }
    }
  ];

  return (
    <aside
      className={`relative shrink-0 flex flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? 'w-16 p-2.5' : 'w-60 p-4'
      } bg-white dark:bg-[#0e111a] border-r border-slate-200/90 dark:border-white/10 shadow-sm min-h-[calc(100vh-53px)]`}
    >
      <div className="space-y-4">
        {/* ======================================================== */}
        {/* 1. TOP macOS WINDOW CONTROLS & BRANDING                  */}
        {/* ======================================================== */}
        <div className="space-y-3.5">
          {/* macOS 3 dots (red, yellow, green) */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-xs" />
            </div>

            {/* Collapse / Expand icon toggle button */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar into mini-rail"
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Logo Header: "QUICKSLOGX >" / "QX" */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
              className="w-10 h-10 mx-auto rounded-[6px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono shadow-sm group hover:scale-105 transition-all"
            >
              <span>QX</span>
            </button>
          ) : (
            <div className="px-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="font-extrabold tracking-wider text-base text-slate-900 dark:text-white font-sans uppercase">
                  QUICKSLOGX
                </span>
                <span className="text-rose-500 font-black text-base">{'>'}</span>
              </div>
            </div>
          )}

          {/* Unified Manager / HR Workspace Switcher Pills */}
          {isUnified && !isSuperAdmin && !isCollapsed && (
            <div className="p-0.5 bg-slate-100 dark:bg-[#1a1e2c] rounded-[5px] flex items-center gap-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onSelectUnifiedTab('manager');
                  onSelectView('manager_dashboard');
                }}
                className={`flex-1 py-1 rounded-[4px] text-[11px] transition-all flex items-center justify-center gap-1 ${
                  unifiedWorkspaceTab === 'manager'
                    ? 'bg-white dark:bg-[#252b3d] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3 text-sky-500" />
                <span>Manager</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectUnifiedTab('hr');
                  onSelectView('hr_attendance');
                }}
                className={`flex-1 py-1 rounded-[4px] text-[11px] transition-all flex items-center justify-center gap-1 ${
                  unifiedWorkspaceTab === 'hr'
                    ? 'bg-white dark:bg-[#252b3d] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-violet-500" />
                <span>HR Desk</span>
              </button>
            </div>
          )}

          {/* Search Pill Input (As pictured in reference UI) */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Search menu"
              className="w-10 h-10 mx-auto rounded-[6px] bg-slate-100 dark:bg-[#161924] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-slate-100/90 dark:bg-[#161924] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-xs rounded-[6px] pl-8 pr-3 py-1.5 border border-transparent focus:border-slate-300 dark:focus:border-white/20 focus:outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. "MENU" SECTION (With Red Accent Left Bar & Red Dot)   */}
        {/* ======================================================== */}
        <div className="space-y-1">
          {/* "Menu" Category Label */}
          <div className={`px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${isCollapsed ? 'text-center text-[9px]' : ''}`}>
            Menu
          </div>

          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              if (isCollapsed) {
                return (
                  <button
                    key={item.view}
                    onClick={() => onSelectView(item.view)}
                    title={item.label}
                    className={`relative w-10 h-10 mx-auto rounded-[6px] flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-[#1e2333] text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {/* Left Red Vertical Accent Bar when active */}
                    {isActive && (
                      <span className="absolute -left-2.5 top-2 bottom-2 w-1 rounded-r-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                    )}

                    <Icon className="w-4 h-4" />

                    {/* Red dot badge on top-right */}
                    {item.hasRedDot && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.view}
                  onClick={() => onSelectView(item.view)}
                  className={`relative w-full text-left px-3 py-2 rounded-[6px] transition-all flex items-center justify-between text-xs font-medium group ${
                    isActive
                      ? 'bg-slate-100 dark:bg-[#1a1f2e] text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Left Red Vertical Accent Bar when active (Matches Reference Image) */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`} />
                    <span className="tracking-wide">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badgeText && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                        {item.badgeText}
                      </span>
                    )}

                    {/* Red Dot Indicator (Matches Reference Image) */}
                    {item.hasRedDot && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. "GROUP" SECTION (Colored Dots & Chevron Links)        */}
        {/* ======================================================== */}
        <div className="space-y-1 pt-1">
          {/* "Group" Category Label */}
          <div className={`px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${isCollapsed ? 'text-center text-[9px]' : ''}`}>
            Group
          </div>

          <div className="space-y-0.5">
            {groupItems.map((grp) => {
              if (isCollapsed) {
                return (
                  <button
                    key={grp.id}
                    onClick={grp.action}
                    title={grp.label}
                    className="w-10 h-8 mx-auto rounded-[4px] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${grp.color} inline-block shadow-xs`} />
                  </button>
                );
              }

              return (
                <button
                  key={grp.id}
                  onClick={grp.action}
                  className="w-full text-left px-3 py-2 rounded-[6px] transition-all flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${grp.color} inline-block shrink-0 shadow-xs`} />
                    <span className="font-medium tracking-wide">{grp.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {grp.count !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {grp.count}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. FOOTER: Quick Expand Button or Security Clearance     */}
      {/* ======================================================== */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/10">
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title="Expand sidebar"
            className="w-10 h-9 mx-auto rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-2.5 bg-slate-50 dark:bg-[#141722] rounded-[6px] border border-slate-200/80 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">
                Security clearance
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {currentUser.name}
            </div>

            <div className="text-[10px] text-slate-500 font-mono truncate">
              {role.toUpperCase().replace('_', ' ')} &bull; Active
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
