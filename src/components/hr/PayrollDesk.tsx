'use client';

import React, { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { Payslip } from '@/types';
import { DollarSign, Download, Play, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PayrollDesk() {
  const { payslips, generateMonthlyPayroll } = useAppData();
  const { showNotification } = useNotifications();

  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [selectedYear] = useState(2026);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      generateMonthlyPayroll(selectedMonth, selectedYear);
      setIsProcessing(false);
    }, 600);
  };

  const handleDownloadPDF = (slip: Payslip) => {
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
        head: [['Item Description', 'Type', 'Amount (PKR)']],
        body: [
          ['Basic Contractual Salary', 'Earnings', `PKR ${slip.basicSalary.toLocaleString()}`],
          [`Approved Overtime (${slip.overtimeHours} Hours)`, 'Earnings', `+PKR ${slip.overtimePay.toLocaleString()}`],
          ['Standard Allowances (Medical & Travel)', 'Earnings', `+PKR ${slip.allowances.toLocaleString()}`],
          [`Loss of Pay (Unpaid Absence: ${slip.lossOfPayDays} Days)`, 'Deduction', `-PKR ${slip.lossOfPayDeduction.toLocaleString()}`],
          ['Income Tax Withholding', 'Deduction', `-PKR ${slip.taxDeduction.toLocaleString()}`],
          ['NET SALARY DISBURSEMENT', 'FINAL PAY', `PKR ${slip.netSalary.toLocaleString()}`]
        ]
      });

      // Stamp and signature line
      const endY = (doc as any).lastAutoTable.finalY + 25;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Authorized by: quickslogx Payroll & Executive Administration', 14, endY);
      doc.text('This is a verified computer-generated payslip under quickslogx OS.', 14, endY + 6);

      doc.save(`quickslogx_Payslip_${slip.userName.replace(/\s+/g, '_')}_${slip.month}.pdf`);
      showNotification('Payslip Downloaded', `PDF payslip generated for ${slip.userName}.`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build PDF payslip.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-600 dark:text-violet-400 font-extrabold">
            Automated Compensation Engine
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            Payroll Processing & Payslip Generation Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-calculate Net Salary by factoring basic rates, approved overtime compensation, and Loss of Pay (LOP) deductions.
          </p>
        </div>

        {/* Month Selector & Trigger */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="October 2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">October 2026</option>
            <option value="September 2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">September 2026</option>
            <option value="August 2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">August 2026</option>
          </select>

          <LiquidButton
            variant="emerald"
            size="md"
            icon={<Play className="w-4 h-4" />}
            onClick={handleRunPayroll}
            disabled={isProcessing}
          >
            {isProcessing ? 'Calculating...' : 'Run Automated Payroll'}
          </LiquidButton>
        </div>
      </div>

      {/* Payslips Table */}
      <LiquidGlassCard variant="elevated" className="p-5">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Disbursement Statements ({payslips.length})</h3>
          </div>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AUTONOMOUS LOP & OVERTIME RULES APPLIED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="pb-3 pl-2">Beneficiary / Member</th>
                <th className="pb-3">Base Pay</th>
                <th className="pb-3">Overtime Hours</th>
                <th className="pb-3">Overtime Bonus</th>
                <th className="pb-3">Loss of Pay (LOP)</th>
                <th className="pb-3">Tax Deduction</th>
                <th className="pb-3">Net Disbursement</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono">
              {payslips.map((slip) => {
                return (
                  <tr key={slip.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white tracking-wide">{slip.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{slip.department} • {slip.designation}</div>
                    </td>

                    <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">
                      PKR {slip.basicSalary.toLocaleString()}
                    </td>

                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      {slip.overtimeHours > 0 ? `${slip.overtimeHours} hrs` : '0 hrs'}
                    </td>

                    <td className="py-3 text-emerald-700 dark:text-emerald-400 font-bold">
                      +PKR {slip.overtimePay.toLocaleString()}
                    </td>

                    <td className="py-3 text-rose-700 dark:text-rose-400 font-bold">
                      {slip.lossOfPayDays > 0 ? (
                        <span>-PKR {slip.lossOfPayDeduction.toLocaleString()} ({slip.lossOfPayDays}d)</span>
                      ) : (
                        <span className="text-slate-400">PKR 0</span>
                      )}
                    </td>

                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      -PKR {slip.taxDeduction.toLocaleString()}
                    </td>

                    <td className="py-3 text-slate-900 dark:text-white font-extrabold text-sm bg-sky-500/10 dark:bg-cyan-500/5 px-2">
                      PKR {slip.netSalary.toLocaleString()}
                    </td>

                    <td className="py-3 text-right pr-2 font-sans">
                      <LiquidButton
                        variant="glass"
                        size="sm"
                        icon={<Download className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />}
                        onClick={() => handleDownloadPDF(slip)}
                      >
                        PDF Slip
                      </LiquidButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
