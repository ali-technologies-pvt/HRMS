'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { Payslip, AttendanceRecord } from '@/types';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  DollarSign,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
  Award,
  Activity,
  ArrowUpRight,
  Filter,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PunchClockCard() {
  const { currentUser } = useAuth();
  const { attendance, clockIn, clockOut, getUserTodayAttendance, policy, getPayslipsForUser, tasks, reports } = useAppData();
  const { showNotification } = useNotifications();

  // Active view tab inside the desk
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'payslips'>('daily');
  // Monthly filter for historical report: 'all' | '2026-10' | '2026-09' | '2026-08'
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Real-time ticking digital clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateFormatted(
        now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's attendance record
  const todayRecord = getUserTodayAttendance(currentUser.id);
  const isClockedIn = !!todayRecord && !todayRecord.clockOut;
  const isFinished = !!todayRecord && !!todayRecord.clockOut;

  // Filter attendance records for current user
  const userAllRecords = useMemo(() => {
    return attendance
      .filter((a) => a.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser.id]);

  // Filtered by selected 3-month window
  const filteredRecords = useMemo(() => {
    if (selectedMonth === 'all') {
      return userAllRecords.filter((a) =>
        a.date.startsWith('2026-10') || a.date.startsWith('2026-09') || a.date.startsWith('2026-08')
      );
    }
    return userAllRecords.filter((a) => a.date.startsWith(selectedMonth));
  }, [userAllRecords, selectedMonth]);

  // Calculate 3-Month KPI stats
  const kpiStats = useMemo(() => {
    const records = filteredRecords;
    const totalDays = records.length;
    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'wfh').length;
    const lateCount = records.filter((r) => r.isLate || r.status === 'late').length;
    const punctualityRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    const totalOvertimeHours = records.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
    const totalMinutes = records.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      totalDays,
      presentCount,
      lateCount,
      punctualityRate,
      totalOvertimeHours,
      totalHours
    };
  }, [filteredRecords]);

  // Employee's payslips
  const myPayslips = getPayslipsForUser(currentUser.id);

  // Download PDF Payslip function
  const handleDownloadPayslipPDF = (slip: Payslip) => {
    try {
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Salary Statement • ${slip.month} ${slip.year}`, 14, 30);

      // Employee Information Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE DISBURSEMENT SUMMARY', 14, 52);

      autoTable(doc, {
        startY: 56,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        body: [
          ['Employee Name', slip.userName, 'Designation', slip.designation],
          ['Department', slip.department, 'Disbursement Period', `${slip.month} ${slip.year}`],
          ['Generated Date', slip.generatedAt, 'Payment Status', 'PROCESSED & APPROVED']
        ]
      });

      // Financial Breakdown Table
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.text('EARNINGS & STATUTORY DEDUCTIONS', 14, finalY);

      autoTable(doc, {
        startY: finalY + 4,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
        head: [['Item Description', 'Type', 'Amount (USD)']],
        body: [
          ['Basic Contractual Base', 'Earnings', `$${slip.basicSalary.toLocaleString()}`],
          [`Approved Overtime (${slip.overtimeHours} Hours)`, 'Earnings', `+$${slip.overtimePay.toLocaleString()}`],
          ['Standard Allowances (Medical & Transit)', 'Earnings', `+$${slip.allowances.toLocaleString()}`],
          [`Loss of Pay (Unpaid Absence: ${slip.lossOfPayDays} Days)`, 'Deduction', `-$${slip.lossOfPayDeduction.toLocaleString()}`],
          ['Income Tax Withholding', 'Deduction', `-$${slip.taxDeduction.toLocaleString()}`],
          ['NET SALARY DISBURSEMENT', 'FINAL PAY', `$${slip.netSalary.toLocaleString()}`]
        ]
      });

      const endY = (doc as any).lastAutoTable.finalY + 25;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Authorized by: quickslogx Payroll & Executive Administration', 14, endY);
      doc.text('This is a verified computer-generated payslip under quickslogx OS.', 14, endY + 6);

      doc.save(`quickslogx_Payslip_${slip.userName.replace(/\s+/g, '_')}_${slip.month.replace(/\s+/g, '_')}.pdf`);
      showNotification('Payslip Downloaded', `PDF payslip generated for ${slip.month}.`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build PDF payslip.', 'warning');
    }
  };

  // Download 3-Month Attendance Report PDF
  const handleDownloadAttendanceReport = () => {
    try {
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodLabel =
        selectedMonth === 'all'
          ? 'Quarterly Audit (August - October 2026)'
          : `Monthly Audit (${selectedMonth})`;
      doc.text(`Official Attendance Audit Report • ${periodLabel}`, 14, 30);

      // Metadata summary
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE AUDIT PROFILE', 14, 50);

      autoTable(doc, {
        startY: 54,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        body: [
          ['Employee Name', currentUser.name, 'Employee ID', currentUser.id],
          ['Department', currentUser.department || 'Engineering', 'Role', currentUser.role.toUpperCase()],
          ['Total Days Recorded', `${kpiStats.totalDays} Days`, 'Punctuality Rate', `${kpiStats.punctualityRate}%`],
          ['Late Count', `${kpiStats.lateCount} Days`, 'Cumulative Overtime', `+${kpiStats.totalOvertimeHours} Hours`]
        ]
      });

      // Attendance records table
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.text('DAY-BY-DAY SHIFT & ATTENDANCE LOGS', 14, finalY);

      const tableRows = filteredRecords.map((item) => {
        const hrs = Math.floor(item.totalWorkMinutes / 60);
        const mins = item.totalWorkMinutes % 60;
        return [
          item.date,
          item.clockIn,
          item.clockOut || 'Active',
          `${hrs}h ${mins}m`,
          item.status.toUpperCase(),
          item.overtimeHours > 0 ? `+${item.overtimeHours}h` : '0h',
          item.managerRemarks || item.lateReason || 'Standard shift'
        ];
      });

      autoTable(doc, {
        startY: finalY + 4,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
        head: [['Date', 'Punch In', 'Punch Out', 'Duration', 'Status', 'Overtime', 'Supervisor Remarks']],
        body: tableRows
      });

      const endY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Verified by quickslogx Automated Attendance System & Corporate Governance.', 14, endY);

      doc.save(`quickslogx_Attendance_Report_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
      showNotification('Attendance Report Exported', 'Certified PDF attendance report downloaded.', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build Attendance PDF.', 'warning');
    }
  };

  // Download Employee General Monthly Work Report
  const handleDownloadEmployeeMonthlyReport = () => {
    try {
      const doc = new jsPDF();
      const monthPrefix = selectedMonth === 'all' ? '2026-10' : selectedMonth;
      const monthLabel =
        selectedMonth === 'all'
          ? 'Quarterly Overview (Aug - Oct 2026)'
          : selectedMonth === '2026-10'
          ? 'October 2026'
          : selectedMonth === '2026-09'
          ? 'September 2026'
          : 'August 2026';

      const userTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
      const userMonthAttendance = filteredRecords;
      const userMonthReports = reports.filter(
        (r) => r.userId === currentUser.id && (selectedMonth === 'all' || r.date.startsWith(monthPrefix))
      );

      const totalWorkMinutes = userMonthAttendance.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0);
      const totalOvertime = userMonthAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
      const daysPresent = userMonthAttendance.filter((a) => a.status === 'present' || a.status === 'wfh').length;

      // Brand Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('quickslogx HRMS', 14, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee General Monthly Performance & Task Report • ${monthLabel}`, 14, 28);
      doc.text(
        `Employee ID: ${currentUser.id} • Generated: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`,
        14,
        35
      );

      // Employee Profile Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE PROFILE & MONTHLY ACTIVITY', 14, 52);

      autoTable(doc, {
        startY: 56,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        body: [
          ['Employee Name', currentUser.name, 'Department', currentUser.department || 'Engineering'],
          ['Evaluation Period', monthLabel, 'Designation / Role', currentUser.designation || currentUser.role.toUpperCase()],
          ['Days Present', `${daysPresent} Days`, 'Logged Hours', `${(totalWorkMinutes / 60).toFixed(1)} Hours`],
          ['Overtime Tracked', `+${totalOvertime} Hours`, 'EOD Reports Submitted', `${userMonthReports.length} Reports`]
        ]
      });

      // Tasks Summary
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.text('ASSIGNED TASKS & PROJECT DELIVERABLES', 14, finalY1);

      const taskRows = userTasks.map((t) => [
        t.title,
        t.projectName || 'General',
        t.category || 'Engineering',
        t.status.toUpperCase(),
        t.priority.toUpperCase(),
        t.deadline || 'Ongoing',
        `${t.loggedHours || 0}h`
      ]);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
        head: [['Task Title', 'Project', 'Category', 'Status', 'Priority', 'Deadline', 'Logged Hours']],
        body: taskRows.length > 0 ? taskRows : [['No tasks assigned for this period', '', '', '', '', '', '']]
      });

      const endY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('General Work Report generated under quickslogx HRMS Personal Terminal.', 14, endY);
      doc.text('Confidential internal performance summary.', 14, endY + 6);

      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitize(currentUser.name)}_General_Monthly_Report_${sanitize(monthLabel)}.pdf`;
      doc.save(filename);
      showNotification('Monthly Report Downloaded', `Saved ${filename}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build monthly report PDF.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Employee Self-Service Desk
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
            Attendance Terminal & Compensation Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Punch in/out, monitor daily shift punctuality, review last 3 months attendance reports, and download certified salary slips.
          </p>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center p-1 bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-[3px] shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
              activeTab === 'daily'
                ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Punch Terminal & Daily</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
              activeTab === 'history'
                ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3-Month Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payslips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
              activeTab === 'payslips'
                ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-400/40 dark:border-emerald-400/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary Slips ({myPayslips.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: INTERACTIVE PUNCH TERMINAL & DAILY REPORT     */}
      {/* ======================================================== */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Punch Terminal (5 Cols) */}
          <LiquidGlassCard variant="elevated" className="p-6 lg:col-span-5 flex flex-col justify-between" glow="cyan">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-mono uppercase text-sky-700 dark:text-cyan-400 font-extrabold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  Live Web Punch Clock
                </span>
                <SquareBadge
                  label={isClockedIn ? 'SHIFT ACTIVE' : isFinished ? 'SHIFT CONCLUDED' : 'STANDBY (NOT IN)'}
                  variant={isClockedIn ? 'emerald' : isFinished ? 'cyan' : 'slate'}
                  dot
                  pulse={isClockedIn}
                />
              </div>

              {/* Digital Clock Display */}
              <div className="text-center py-4 bg-gradient-to-b from-sky-500/5 to-transparent border border-sky-400/20 dark:border-cyan-400/10 rounded-[3px]">
                <div className="text-4xl sm:text-5xl font-mono font-bold text-slate-900 dark:text-white tracking-wider drop-shadow-[0_4px_16px_rgba(14,165,233,0.18)]">
                  {currentTime || '09:00:00 AM'}
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {currentDateFormatted}
                </div>
                <div className="inline-block mt-2 px-2.5 py-0.5 bg-sky-500/10 dark:bg-cyan-500/15 text-sky-700 dark:text-cyan-300 text-[10px] font-mono font-bold rounded-[2px]">
                  Schedule: {policy.officeStartTime} - {policy.officeEndTime} (Grace: {policy.gracePeriodMinutes}m)
                </div>
              </div>

              {/* Today's Punch Snapshot */}
              <div className="mt-4 p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[3px] space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5 text-sky-500" />
                    Check-In (Punch In):
                  </span>
                  <span className="text-sky-700 dark:text-cyan-300 font-bold text-sm">
                    {todayRecord?.clockIn || '--:--'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    Check-Out (Punch Out):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    {todayRecord?.clockOut || (isClockedIn ? 'Active In Progress' : '--:--')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-1.5 border-t border-slate-200/80 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Total Work Duration:</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {todayRecord
                      ? `${Math.floor(todayRecord.totalWorkMinutes / 60)}h ${todayRecord.totalWorkMinutes % 60}m`
                      : '0h 0m'}
                  </span>
                </div>

                {todayRecord?.isLate && (
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-white/5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Late Arrival Recorded ({todayRecord.clockIn} &gt; {policy.officeStartTime} + {policy.gracePeriodMinutes}m).</span>
                  </div>
                )}
              </div>
            </div>

            {/* Check-In / Check-Out Punch Action Buttons */}
            <div className="pt-6">
              {!todayRecord ? (
                <LiquidButton
                  variant="emerald"
                  size="lg"
                  icon={<LogIn className="w-4 h-4" />}
                  onClick={() => clockIn(currentUser.id)}
                  className="w-full justify-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] text-sm font-bold"
                >
                  Punch In / Check-In (Start Shift)
                </LiquidButton>
              ) : isClockedIn ? (
                <LiquidButton
                  variant="danger"
                  size="lg"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={() => clockOut(currentUser.id)}
                  className="w-full justify-center shadow-[0_4px_16px_rgba(244,63,94,0.3)] text-sm font-bold"
                >
                  Punch Out / Check-Out (End Shift)
                </LiquidButton>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-center text-xs font-mono font-semibold rounded-[2px] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shift closed for today. All hours recorded!</span>
                </div>
              )}
            </div>
          </LiquidGlassCard>

          {/* Right Column: Today's Daily Attendance Report (7 Cols) */}
          <LiquidGlassCard variant="surface" className="p-6 lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-[2px] border border-indigo-400/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                      Today's Daily Attendance Report
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Shift metrics, punctuality analysis & overtime tracking
                    </p>
                  </div>
                </div>

                <SquareBadge
                  label={todayRecord?.status ? todayRecord.status.toUpperCase() : 'NO SHIFT YET'}
                  variant={
                    todayRecord?.status === 'present'
                      ? 'emerald'
                      : todayRecord?.status === 'late'
                      ? 'rose'
                      : todayRecord?.status === 'wfh'
                      ? 'cyan'
                      : 'slate'
                  }
                  dot
                />
              </div>

              {/* Shift Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Shift Target</span>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">8.0 hrs</div>
                  <span className="text-[10px] text-slate-400 font-mono">09:00 - 18:00</span>
                </div>

                <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Logged Hours</span>
                  <div className="text-lg font-mono font-bold text-sky-700 dark:text-cyan-300 mt-0.5">
                    {todayRecord
                      ? `${(todayRecord.totalWorkMinutes / 60).toFixed(1)} hrs`
                      : '0.0 hrs'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {todayRecord ? `${Math.floor(todayRecord.totalWorkMinutes / 60)}h ${todayRecord.totalWorkMinutes % 60}m` : 'Not punched'}
                  </span>
                </div>

                <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Punctuality</span>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {todayRecord ? (todayRecord.isLate ? 'Late' : 'On-Time') : '--'}
                  </div>
                  <span className={`text-[10px] font-mono font-semibold ${todayRecord?.isLate ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {todayRecord?.isLate ? 'Grace Exceeded' : 'Within Grace Window'}
                  </span>
                </div>

                <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-[3px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Overtime</span>
                  <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{todayRecord?.overtimeHours || 0} hrs
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Auto Calculated</span>
                </div>
              </div>

              {/* Shift Progress Bar */}
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-[3px] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Daily Shift Progress (8h Target):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {todayRecord
                      ? `${Math.min(100, Math.round((todayRecord.totalWorkMinutes / 480) * 100))}%`
                      : '0%'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${todayRecord ? Math.min(100, (todayRecord.totalWorkMinutes / 480) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Shift Timeline Details */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/5 rounded-[2px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Morning Punch-In:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {todayRecord?.clockIn ? `${todayRecord.clockIn} (Verified)` : 'Pending Check-In'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/5 rounded-[2px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Standard Lunch / Rest Break:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">60 Minutes (Subtracted)</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/5 rounded-[2px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Manager Review Status:</span>
                  </div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    {todayRecord?.managerRemarks ? todayRecord.managerRemarks : 'Shift Active • Under Regular Audit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Cryptographically logged to HRMS state
              </span>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View 3-Month History</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </LiquidGlassCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: LAST 3 MONTHS ATTENDANCE REPORT               */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Controls Bar: Monthly Tabs & PDF Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-[4px] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Select Period:
              </span>

              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  selectedMonth === 'all'
                    ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All 3 Months (Consolidated)
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonth('2026-10')}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  selectedMonth === '2026-10'
                    ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                October 2026 (Current)
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonth('2026-09')}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  selectedMonth === '2026-09'
                    ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                September 2026
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonth('2026-08')}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] transition-all ${
                  selectedMonth === '2026-08'
                    ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/40 dark:border-cyan-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                August 2026
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <LiquidButton
                variant="glass"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />}
                onClick={handleDownloadEmployeeMonthlyReport}
              >
                Monthly Work Report (PDF)
              </LiquidButton>

              <LiquidButton
                variant="primary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadAttendanceReport}
              >
                Export Attendance PDF
              </LiquidButton>
            </div>
          </div>

          {/* 3-Month KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LiquidGlassCard variant="surface" className="p-4" glow="none">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Total Days Logged</span>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">
                {kpiStats.totalDays} Days
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                {kpiStats.presentCount} Days Present
              </span>
            </LiquidGlassCard>

            <LiquidGlassCard variant="surface" className="p-4" glow="cyan">
              <span className="text-[10px] font-mono uppercase text-sky-600 dark:text-cyan-400 font-bold">Punctuality Score</span>
              <div className="text-2xl font-mono font-bold text-sky-700 dark:text-cyan-300 mt-1">
                {kpiStats.punctualityRate}%
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                On-time arrivals
              </span>
            </LiquidGlassCard>

            <LiquidGlassCard variant="surface" className="p-4" glow="none">
              <span className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 font-bold">Late Arrivals</span>
              <div className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400 mt-1">
                {kpiStats.lateCount} Days
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                Exceeded grace limit
              </span>
            </LiquidGlassCard>

            <LiquidGlassCard variant="surface" className="p-4" glow="emerald">
              <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">Cumulative Overtime</span>
              <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                +{kpiStats.totalOvertimeHours} hrs
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                {kpiStats.totalHours} Total Hours Logged
              </span>
            </LiquidGlassCard>
          </div>

          {/* Historical Attendance Records Table */}
          <LiquidGlassCard variant="elevated" className="p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  Day-by-Day Historical Attendance Logs
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Showing {filteredRecords.length} records for {selectedMonth === 'all' ? 'August to October 2026' : selectedMonth}
                </p>
              </div>

              <span className="text-xs font-mono text-sky-700 dark:text-cyan-400 font-semibold">
                Official HR Records
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-[3px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/75 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Clock In</th>
                    <th className="py-2.5 px-3">Clock Out</th>
                    <th className="py-2.5 px-3">Total Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Overtime</th>
                    <th className="py-2.5 px-3">Manager Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                        No attendance logs found for the selected time window.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item) => {
                      const hrs = Math.floor(item.totalWorkMinutes / 60);
                      const mins = item.totalWorkMinutes % 60;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {item.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-sky-700 dark:text-cyan-300">
                            {item.clockIn}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            {item.clockOut || 'Active'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-semibold">
                            {hrs}h {mins}m
                          </td>
                          <td className="py-2.5 px-3">
                            <SquareBadge
                              label={item.status}
                              variant={
                                item.status === 'present'
                                  ? 'emerald'
                                  : item.status === 'late'
                                  ? 'rose'
                                  : item.status === 'wfh'
                                  ? 'cyan'
                                  : 'slate'
                              }
                            />
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {item.overtimeHours > 0 ? `+${item.overtimeHours}h` : '0h'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px] max-w-[240px] truncate" title={item.managerRemarks || item.lateReason}>
                            {item.managerRemarks || item.lateReason || 'Standard workday shift'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </LiquidGlassCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: SALARY SLIPS (PAYSLIPS) & CERTIFIED PDFS       */}
      {/* ======================================================== */}
      {activeTab === 'payslips' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Monthly Salary Statements (Last 3 Months)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                View compensation breakdowns, overtime pay, deductions, and download certified employer-sealed PDF statements.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-[2px] border border-emerald-400/30">
              <Check className="w-3.5 h-3.5" />
              <span>All 3 Months Processed & Paid</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {myPayslips.length === 0 ? (
              <div className="col-span-3 py-16 text-center liquid-glass border border-slate-200/80 dark:border-white/10 rounded-[3px] p-6 space-y-2">
                <DollarSign className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No payslips issued yet</h3>
                <p className="text-xs text-slate-500 font-mono">Monthly payslips are generated during the end-of-month payroll run.</p>
              </div>
            ) : (
              myPayslips.map((slip) => (
                <LiquidGlassCard key={slip.id} variant="elevated" className="p-5 flex flex-col justify-between" glow="cyan">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-white/10">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                          {slip.month}
                        </h3>
                        <div className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 uppercase font-semibold">
                          Disbursed on {slip.generatedAt}
                        </div>
                      </div>
                      <SquareBadge label="PAID" variant="emerald" dot />
                    </div>

                    {/* Breakdown Items */}
                    <div className="space-y-2 text-xs font-mono mb-4">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500 dark:text-slate-400">Basic Monthly Base:</span>
                        <span className="font-semibold">${slip.basicSalary.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Overtime Pay ({slip.overtimeHours}h):</span>
                        <span>+${slip.overtimePay.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-sky-700 dark:text-cyan-300 font-semibold">
                        <span>Standard Allowances:</span>
                        <span>+${slip.allowances.toLocaleString()}</span>
                      </div>

                      {slip.lossOfPayDays > 0 && (
                        <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-semibold">
                          <span>Loss of Pay ({slip.lossOfPayDays}d):</span>
                          <span>-${slip.lossOfPayDeduction.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                        <span>Tax Withholding:</span>
                        <span>-${slip.taxDeduction.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Net Pay Highlight */}
                    <div className="p-3 bg-sky-50 dark:bg-cyan-950/40 border border-sky-300 dark:border-cyan-400/30 rounded-[2px] flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-800 dark:text-cyan-300 uppercase">
                        Net Disbursed:
                      </span>
                      <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                        ${slip.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click PDF Download Button */}
                  <div className="pt-4 mt-3 border-t border-slate-200/80 dark:border-white/10">
                    <LiquidButton
                      variant="primary"
                      size="sm"
                      icon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => handleDownloadPayslipPDF(slip)}
                      className="w-full justify-center text-xs font-bold"
                    >
                      Download PDF Payslip
                    </LiquidButton>
                  </div>
                </LiquidGlassCard>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
