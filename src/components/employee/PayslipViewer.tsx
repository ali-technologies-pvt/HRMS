'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { SquareBadge } from '../common/SquareBadge';
import { Payslip } from '@/types';
import { DollarSign, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PayslipViewer() {
  const { currentUser } = useAuth();
  const { getPayslipsForUser } = useAppData();
  const { showNotification } = useNotifications();

  const myPayslips = getPayslipsForUser(currentUser.id);

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
        head: [['Item Description', 'Type', 'Amount (USD)']],
        body: [
          ['Basic Contractual Salary', 'Earnings', `$${slip.basicSalary.toLocaleString()}`],
          [`Approved Overtime (${slip.overtimeHours} Hours)`, 'Earnings', `+$${slip.overtimePay.toLocaleString()}`],
          ['Standard Allowances (Medical & Travel)', 'Earnings', `+$${slip.allowances.toLocaleString()}`],
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

      doc.save(`quickslogx_Payslip_${slip.userName.replace(/\s+/g, '_')}_${slip.month}.pdf`);
      showNotification('Payslip Downloaded', `PDF payslip generated for ${slip.month}.`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Export Error', 'Unable to build PDF payslip.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
          Compensation & Earnings
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
          My Monthly Payslips & Salary Statements
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          View transparent earnings breakdowns, overtime bonuses, and generate certified PDF payslips.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myPayslips.length === 0 ? (
          <div className="col-span-2 py-16 text-center liquid-glass border border-slate-200/80 dark:border-white/10 rounded-[3px] p-6 space-y-2">
            <DollarSign className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No payslips issued yet</h3>
            <p className="text-xs text-slate-500 font-mono">Monthly payslips are generated during the end-of-month payroll run.</p>
          </div>
        ) : (
          myPayslips.map((slip) => (
            <LiquidGlassCard key={slip.id} variant="elevated" className="p-5 flex flex-col justify-between" glow="cyan">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">{slip.month} {slip.year}</h3>
                    <div className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 uppercase font-semibold">Processed & Cleared</div>
                  </div>
                  <SquareBadge label="PAID" variant="emerald" dot />
                </div>

                {/* Breakdown List */}
                <div className="space-y-2 text-xs font-mono mb-4">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Basic Monthly Base:</span>
                    <span className="font-semibold">${slip.basicSalary.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Overtime Bonus ({slip.overtimeHours}h):</span>
                    <span>+${slip.overtimePay.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-sky-700 dark:text-cyan-300 font-semibold">
                    <span>Standard Allowances:</span>
                    <span>+${slip.allowances.toLocaleString()}</span>
                  </div>

                  {slip.lossOfPayDays > 0 && (
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-semibold">
                      <span>Loss of Pay (LOP {slip.lossOfPayDays}d):</span>
                      <span>-${slip.lossOfPayDeduction.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                    <span>Statutory Tax Deduction:</span>
                    <span>-${slip.taxDeduction.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-sky-50 dark:bg-cyan-950/40 border border-sky-300 dark:border-cyan-400/30 rounded-[2px] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-800 dark:text-cyan-300 uppercase">Net Disbursed Pay:</span>
                  <span className="text-lg font-mono font-black text-slate-900 dark:text-white">
                    ${slip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-200/80 dark:border-white/10 flex justify-end">
                <LiquidButton
                  variant="primary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleDownloadPDF(slip)}
                >
                  Download PDF Statement
                </LiquidButton>
              </div>
            </LiquidGlassCard>
          ))
        )}
      </div>
    </div>
  );
}
