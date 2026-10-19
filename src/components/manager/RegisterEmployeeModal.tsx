'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { generateTemporaryPassword } from '@/lib/utils';
import { User, UserRole } from '@/types';
import {
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  Building2,
  Mail,
  User as UserIcon,
  Briefcase,
  DollarSign,
  Phone,
  Calendar
} from 'lucide-react';

interface RegisterEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export function RegisterEmployeeModal({ isOpen, onClose, onSuccess }: RegisterEmployeeModalProps) {
  const { onboardUser } = useAuth();
  const { policy } = useAppData();
  const { showNotification } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [department, setDepartment] = useState(policy.departments?.[0] || 'Engineering');
  const [customDept, setCustomDept] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState(80000);
  const [phone, setPhone] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tempPassword, setTempPassword] = useState(() => generateTemporaryPassword());
  const [copied, setCopied] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setRole('employee');
      setDepartment(policy.departments?.[0] || 'Engineering');
      setCustomDept('');
      setDesignation('Software Engineer');
      setSalary(80000);
      setPhone('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setTempPassword(generateTemporaryPassword());
      setCopied(false);
      setCreatedUser(null);
      setIsSubmitting(false);
    }
  }, [isOpen, policy.departments]);

  if (!isOpen) return null;

  const handleRegeneratePassword = () => {
    setTempPassword(generateTemporaryPassword());
    setCopied(false);
  };

  const handleCopyCredentials = async () => {
    const credText = `quickslogx Portal Login Credentials\n-----------------------------------\nName: ${createdUser?.name || name}\nOfficial Email: ${createdUser?.email || email}\nTemporary Password: ${tempPassword}\nPortal Role: ${(createdUser?.role || role).replace('_', ' ').toUpperCase()}\n-----------------------------------\nNote: First login mandates immediate password replacement.`;
    try {
      await navigator.clipboard.writeText(credText);
      setCopied(true);
      showNotification('Copied', 'Login credentials copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showNotification('Error', 'Failed to copy credentials automatically.', 'warning');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Missing Name', 'Please provide employee full name.', 'warning');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showNotification('Invalid Email', 'Please enter a valid work email address.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const finalDept = department === '__custom__' ? customDept.trim() || 'General' : department;

    try {
      const newUser = onboardUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: tempPassword,
        tempPassword: true,
        mustChangePassword: true,
        role,
        department: finalDept,
        designation: designation.trim() || 'Team Member',
        phone: phone.trim() || '+92 300 0000000',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=1f4874,2563eb,0d9488,4f46e5`,
        salary: Number(salary) || 50000,
        joiningDate,
        status: 'offline',
        leaveQuota: {
          medical: 8,
          casual: 10,
          annual: 14
        }
      });

      setCreatedUser(newUser);
      showNotification('Employee Registered', `${newUser.name} added to workspace successfully.`, 'success');
      onSuccess?.(newUser);
    } catch (err) {
      showNotification('Registration Error', 'Failed to register employee. Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-card mp-modal-wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mp-modal-header">
          <div className="mp-modal-header-text">
            <h3>
              <UserPlus size={18} className="text-[#244c78] dark:text-[#b5cce6]" />
              {createdUser ? 'Account Issued Successfully' : 'Register New Employee'}
            </h3>
            <p>
              {createdUser
                ? 'Credentials generated. Share these login details with your teammate.'
                : 'Create team profile, assign department role, and issue secure one-time credentials.'}
            </p>
          </div>
          <button className="mp-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {createdUser ? (
          <div className="mp-modal-body">
            <div className="mp-credentials-box">
              <div className="mp-credentials-header">
                <span>
                  <ShieldCheck size={16} /> Official Portal Access Slip
                </span>
                <button type="button" onClick={handleCopyCredentials}>
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </button>
              </div>

              <div className="space-y-2 mt-1">
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Full Name:</span>
                  <span>{createdUser.name}</span>
                </div>
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Login Email:</span>
                  <span>{createdUser.email}</span>
                </div>
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Temporary Password:</span>
                  <span className="text-[#8c6010] font-bold">{tempPassword}</span>
                </div>
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Assigned Role:</span>
                  <span className="capitalize">{createdUser.role.replace('_', ' ')}</span>
                </div>
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Department:</span>
                  <span>{createdUser.department}</span>
                </div>
              </div>

              <p className="mp-credentials-note">
                <strong>Important:</strong> The employee will be required to change their temporary password immediately upon their first login.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="mp-modal-body">
              {/* Row 1: Name and Email */}
              <div className="mp-form-grid-2">
                <div className="mp-form-group">
                  <label htmlFor="reg-name">
                    <UserIcon size={12} /> Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="reg-name"
                    className="mp-input"
                    placeholder="e.g. Bilal Ahmed"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="mp-form-group">
                  <label htmlFor="reg-email">
                    <Mail size={12} /> Work Email <span className="req">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    className="mp-input"
                    placeholder="e.g. bilal@quickslogx.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Role, Department, Designation */}
              <div className="mp-form-grid-3">
                <div className="mp-form-group">
                  <label htmlFor="reg-role">Portal Role</label>
                  <select
                    id="reg-role"
                    className="mp-select"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Specialist</option>
                    <option value="manager_hr">Manager & HR (Dual)</option>
                  </select>
                </div>

                <div className="mp-form-group">
                  <label htmlFor="reg-dept">
                    <Building2 size={12} /> Department
                  </label>
                  <select
                    id="reg-dept"
                    className="mp-select"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    {(policy.departments || ['Engineering', 'Design', 'Marketing', 'Operations', 'Quality Assurance']).map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Custom Department</option>
                  </select>
                </div>

                <div className="mp-form-group">
                  <label htmlFor="reg-desig">
                    <Briefcase size={12} /> Designation
                  </label>
                  <input
                    id="reg-desig"
                    className="mp-input"
                    placeholder="e.g. UI/UX Designer"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                  />
                </div>
              </div>

              {/* Custom department if selected */}
              {department === '__custom__' && (
                <div className="mp-form-group">
                  <label htmlFor="reg-custom-dept">Custom Department Name</label>
                  <input
                    id="reg-custom-dept"
                    className="mp-input"
                    placeholder="Enter department name"
                    value={customDept}
                    onChange={e => setCustomDept(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Row 3: Salary, Phone, Joining Date */}
              <div className="mp-form-grid-3">
                <div className="mp-form-group">
                  <label htmlFor="reg-salary">
                    <DollarSign size={12} /> Monthly Salary (PKR)
                  </label>
                  <input
                    id="reg-salary"
                    type="number"
                    min="10000"
                    step="5000"
                    className="mp-input"
                    value={salary}
                    onChange={e => setSalary(Number(e.target.value))}
                  />
                </div>

                <div className="mp-form-group">
                  <label htmlFor="reg-phone">
                    <Phone size={12} /> Contact Number
                  </label>
                  <input
                    id="reg-phone"
                    className="mp-input"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="mp-form-group">
                  <label htmlFor="reg-date">
                    <Calendar size={12} /> Joining Date
                  </label>
                  <input
                    id="reg-date"
                    type="date"
                    className="mp-input"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Temporary Password Box */}
              <div className="mp-credentials-box">
                <div className="mp-credentials-header">
                  <span>Auto-Generated One-Time Password</span>
                  <button type="button" onClick={handleRegeneratePassword}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
                <div className="mp-credentials-row">
                  <span className="text-xs text-slate-500 font-sans">Password:</span>
                  <span className="text-[#8c6010] font-bold text-sm tracking-wider">{tempPassword}</span>
                </div>
                <p className="mp-credentials-note">
                  This secure password will be issued for initial access. The employee will be forced to change it on their first login.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mp-modal-footer">
              <button type="button" className="mp-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="mp-btn-primary" disabled={isSubmitting}>
                <UserPlus size={14} />
                {isSubmitting ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        {/* Success Footer */}
        {createdUser && (
          <div className="mp-modal-footer">
            <button type="button" className="mp-btn-secondary" onClick={handleCopyCredentials}>
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Credentials'}
            </button>
            <button type="button" className="mp-btn-primary" onClick={onClose}>
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
