'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { LiquidButton } from '../common/LiquidButton';
import { generateTemporaryPassword } from '@/lib/utils';
import { User, UserRole } from '@/types';
import {
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Lock,
  Search,
  ShieldAlert,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OnboardingDesk({ createRequest = 0, initialSearch = '', compactHeader = false }: { createRequest?: number; initialSearch?: string; compactHeader?: boolean }) {
  const { users, onboardUser, updateUser, deleteUser, updateUserRole } = useAuth();
  const { policy, addDepartment } = useAppData();
  const { showNotification } = useNotifications();

  const handledCreateRequest = useRef(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [department, setDepartment] = useState(policy.departments?.[0] || 'Executive Leadership');
  const [designation, setDesignation] = useState('Department Manager');
  const [salary, setSalary] = useState(8500);
  const [tempPassword, setTempPassword] = useState(() => generateTemporaryPassword());
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string } | null>(null);

  const handleOpenModal = () => {
    setCopied(false);
    setTempPassword(generateTemporaryPassword());
    setName('');
    setEmail('');
    setRole('manager');
    setDepartment(policy.departments?.[0] || 'Executive Leadership');
    setDesignation('Engineering Team Lead / Manager');
    setShowModal(true);
  };

  useEffect(() => { if (createRequest > handledCreateRequest.current) { handledCreateRequest.current = createRequest; setName(''); setEmail(''); setCopied(false); setRole('manager'); setDesignation('Engineering Team Lead / Manager'); setSalary(8500); setDepartment(policy.departments?.[0] || 'Executive Leadership'); setTempPassword(generateTemporaryPassword()); setShowModal(true); } }, [createRequest, policy.departments]);

  const handleCopyCredentials = async () => {
    try { await navigator.clipboard.writeText(`quickslogx Portal Login\nEmail: ${email || 'user@quickslogx.com'}\nTemporary Password: ${tempPassword}\nNote: First login mandates immediate password replacement.`);
    } catch { showNotification('Copy unavailable', 'Select and copy the credentials manually.', 'warning'); return; }
    setCopied(true);
    showNotification('Copied', 'Temporary login credentials copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      showNotification('Missing Fields', 'Please specify full name and email.', 'warning');
      return;
    }

    if (users.some(user => user.email.trim().toLowerCase() === email.trim().toLowerCase())) { showNotification('Email already exists', 'Use a unique work email for this account.', 'warning'); return; }

    if (department.trim() && !policy.departments?.includes(department.trim())) {
      addDepartment(department.trim());
    }

    onboardUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: tempPassword,
      tempPassword: true,
      mustChangePassword: true, // Compulsory Change Password on first login!
      role,
      department,
      designation: designation || (role === 'manager' ? 'Pod Manager' : role === 'hr' ? 'HR Generalist' : 'Software Engineer'),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      phone: '+1 (555) 000-1122',
      status: 'offline',
      salary: Number(salary),
      joiningDate: new Date().toISOString().split('T')[0],
      leaveQuota: { medical: 10, casual: 10, annual: 18 }
    });

    setCopied(false);
    setCreatedCredentials({ email: email.trim().toLowerCase(), password: tempPassword, name: name.trim() });
    showNotification('Account created', 'Temporary credentials are ready. The user must change their password at first login.', 'success');
    setShowModal(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 at-people-desk">
      {!compactHeader && <>{/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-sky-600 dark:text-cyan-400 font-extrabold">
            Access Control & Staffing
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            User & Credential Onboarding Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provision team credentials with automated temporary passwords and first-login security enforcement.
          </p>
        </div>

        <LiquidButton
          variant="primary"
          size="md"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={handleOpenModal}
        >
          Onboard New Account
        </LiquidButton>
      </div>

      </>}{/* Users table card */}
      <LiquidGlassCard variant="elevated" className="p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-semibold">Staff Accounts:</span>
            <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-400 px-2 py-0.5 bg-sky-500/10 dark:bg-cyan-500/10 border border-sky-400/30 rounded-[2px]">
              {filteredUsers.length} TOTAL
            </span>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, role, email..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="pb-3 pl-2">User / Identity</th>
                <th className="pb-3">Role & Permissions</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Credential State</th>
                <th className="pb-3">Monthly Base</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
              {filteredUsers.map((user) => {
                return (
                  <tr key={user.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    {/* User info */}
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 rounded-[3px] object-cover border border-slate-300 dark:border-white/20"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white tracking-wide">{user.name}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role selector dropdown */}
                    <td className="py-3">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        className="glass-input px-2 py-1 text-[11px] font-mono uppercase font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="employee" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Employee</option>
                        <option value="manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Manager</option>
                        <option value="hr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">HR</option>
                        <option value="manager_hr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Unified Manager & HR</option>
                        <option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Super Admin</option>
                      </select>
                    </td>

                    {/* Department */}
                    <td className="py-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{user.department}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{user.designation}</div>
                    </td>

                    {/* Credential state */}
                    <td className="py-3">
                      {user.mustChangePassword ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-semibold rounded-[2px]">
                          <ShieldAlert className="w-3 h-3 text-amber-500" />
                          Temp Password (Must Reset)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/12 border border-emerald-400/25 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-semibold rounded-[2px]">
                          <Check className="w-3 h-3 text-emerald-500" />
                          Active & Secured
                        </span>
                      )}
                    </td>

                    {/* Salary */}
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-200">
                      PKR {user.salary.toLocaleString()}/mo
                    </td>

                    {/* Actions */}
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          title="Edit User Details"
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-[2px] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user.role !== 'super_admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete account for "${user.name}"?`)) {
                                deleteUser(user.id);
                              }
                            }}
                            title="Revoke access"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2px] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>

      {createdCredentials && <div className="at-credentials-card" role="dialog" aria-modal="true" aria-label="New account credentials"><div className="at-credentials-sheet"><Check className="text-emerald-600" size={26}/><h2>Ready for their first day.</h2><p>{createdCredentials.name}'s account is created. Copy these credentials and share them with your teammate. Their first login requires a password change.</p><dl><dt>Login email</dt><dd>{createdCredentials.email}</dd><dt>Temporary password</dt><dd>{createdCredentials.password}</dd></dl><p>These credentials are displayed for this onboarding session.</p><div className="at-credentials-actions"><button className="at-button at-button-white" type="button" onClick={()=>setCreatedCredentials(null)}>Done</button><button className="at-button at-button-black" type="button" onClick={handleCopyCredentials}>{copied?'Copied':'Copy credentials'}<Copy size={14}/></button></div></div></div>}
      {/* Onboarding Modal with Auto Temp Password */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative z-10 w-full max-w-xl liquid-glass-elevated border border-sky-400/40 dark:border-cyan-500/30 p-6 rounded-[4px] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="p-2 bg-sky-500/15 dark:bg-cyan-500/20 border border-sky-400/30 rounded-[2px] text-sky-600 dark:text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                    Onboard New Staff Member
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    System automatically provisions secure credentials with compulsory first-login password change.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Daniyal Sheikh"
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="daniyal@quickslogx.com"
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Role & Access Scope
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full glass-input px-3 py-2 text-sm"
                    >
                      <option value="employee" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Employee (Self-Service)</option>
                      <option value="manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Manager (Team & Tasks)</option>
                      <option value="hr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">HR (People & Payroll)</option>
                      <option value="manager_hr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Unified Manager & HR (Dual Rights)</option>
                      <option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Super Admin (Master Rights)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Department
                    </label>
                    {policy.departments && policy.departments.length > 0 ? (
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-sm"
                      >
                        {policy.departments.map((dept) => (
                          <option key={dept} value={dept} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {dept}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Executive, Engineering, QA..."
                        className="w-full glass-input px-3 py-2 text-sm"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Job Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Cloud Systems Engineer"
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      Monthly Base Salary (PKR)
                    </label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Auto-Generated Temporary Credentials Box */}
                <div className="p-4 bg-sky-50 dark:bg-cyan-950/30 border border-sky-300 dark:border-cyan-400/30 rounded-[3px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-800 dark:text-cyan-300 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                      Auto-Generated Temporary Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setTempPassword(generateTemporaryPassword())}
                      className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 hover:text-sky-800 dark:hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 font-mono text-sm tracking-widest text-sky-900 dark:text-cyan-300 font-extrabold select-all rounded-[2px]">
                      {tempPassword}
                    </div>
                    <LiquidButton
                      type="button"
                      variant="glass"
                      size="sm"
                      icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      onClick={handleCopyCredentials}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </LiquidButton>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                    ⚠️ The new recruit will be mandated to change this temporary password immediately upon their first login.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <LiquidButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </LiquidButton>
                  <LiquidButton type="submit" variant="primary">
                    Create & Authorize Account
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 rounded-[4px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/10 text-sky-600 rounded-[2px]">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Edit User Profile
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Update role, department, designation, and salary
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const uName = (form.elements.namedItem('editName') as HTMLInputElement).value;
                  const uDept = (form.elements.namedItem('editDept') as HTMLSelectElement).value;
                  const uDesig = (form.elements.namedItem('editDesig') as HTMLInputElement).value;
                  const uSalary = Number((form.elements.namedItem('editSalary') as HTMLInputElement).value);

                  updateUser(editingUser.id, {
                    name: uName,
                    department: uDept,
                    designation: uDesig,
                    salary: uSalary
                  });
                  setEditingUser(null);
                }}
                className="space-y-3.5 text-xs font-mono"
              >
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    name="editName"
                    required
                    defaultValue={editingUser.name}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Department</label>
                    <select
                      name="editDept"
                      defaultValue={editingUser.department || policy.departments?.[0]}
                      className="w-full glass-input px-2.5 py-2 text-xs"
                    >
                      {policy.departments?.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Designation</label>
                    <input
                      type="text"
                      name="editDesig"
                      required
                      defaultValue={editingUser.designation}
                      className="w-full glass-input px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    name="editSalary"
                    required
                    defaultValue={editingUser.salary}
                    className="w-full glass-input px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                  <LiquidButton type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                    Cancel
                  </LiquidButton>
                  <LiquidButton type="submit" variant="primary">
                    Save Changes
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
