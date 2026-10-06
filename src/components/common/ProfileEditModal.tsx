'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LiquidButton } from './LiquidButton';
import { X, User, Camera, KeyRound, ShieldCheck, Mail, Phone, Building2, Briefcase, FileText, Check, Upload, Sparkles } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
];

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { currentUser, updateCurrentUserProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Form states
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [department, setDepartment] = useState(currentUser.department);
  const [designation, setDesignation] = useState(currentUser.designation);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);

  // Sync state whenever modal is opened or currentUser updates
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setAvatarUrl(currentUser.avatarUrl);
      setPhone(currentUser.phone || '');
      setBio(currentUser.bio || '');
      setDepartment(currentUser.department);
      setDesignation(currentUser.designation);
      setUploadSuccessNotice(null);
    }
  }, [isOpen, currentUser]);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      name,
      avatarUrl,
      phone,
      bio,
      department,
      designation
    });
    onClose();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const res = changePassword(oldPassword, newPassword);
    if (res.success) {
      setPasswordSuccess('Password successfully updated!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to change password');
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          setUploadSuccessNotice(`Photo "${file.name}" loaded successfully! Click "Save Profile Changes" below to apply.`);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Frosted backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xl"
        />

        {/* Square Liquid Glass Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative z-10 w-full max-w-2xl liquid-glass-elevated border border-slate-200 dark:border-white/15 p-6 rounded-[4px] shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[3px] bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-sky-600 dark:text-cyan-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Account & Profile Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize your digital identity, security & preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-[2px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200/80 dark:border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/50 dark:border-cyan-400/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'bg-sky-500/20 text-sky-900 dark:text-cyan-300 border border-sky-400/50 dark:border-cyan-400/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Password & Security
            </button>
          </div>

          {/* Profile Details Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar Customization */}
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3px] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">
                    Profile Photo & Avatar
                  </label>
                  <label
                    htmlFor="avatar-upload-direct"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo from Device</span>
                    <input
                      id="avatar-upload-direct"
                      type="file"
                      accept="image/*"
                      onChange={handleCustomImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadSuccessNotice && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400/40 rounded-[2px] flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{uploadSuccessNotice}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-16 h-16 rounded-[4px] object-cover border-2 border-sky-400/50 dark:border-cyan-400/40 shadow-md"
                    />
                    <label
                      htmlFor="avatar-upload-direct"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[4px] cursor-pointer transition-opacity text-white"
                      title="Click to choose a photo"
                    >
                      <Camera className="w-5 h-5" />
                    </label>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      Select a device photo or choose from preset corporate avatars:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`relative rounded-[2px] overflow-hidden border-2 transition-transform hover:scale-105 ${
                            avatarUrl === url ? 'border-sky-500 scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-7 h-7 object-cover" />
                          {avatarUrl === url && (
                            <span className="absolute inset-0 bg-sky-500/40 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1 font-semibold">Direct Image URL</span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full glass-input px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
                    <User className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
                    <Mail className="w-3 h-3 text-slate-400" />
                    Email (Corporate ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full glass-input px-3 py-2 text-sm opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
                    <Phone className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                      <Building2 className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                      Department
                    </label>
                    {currentUser.role === 'employee' && (
                      <span className="text-[10px] text-slate-400 font-mono">Assigned by Manager</span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={currentUser.role === 'employee'}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full glass-input px-3 py-2 text-sm ${
                      currentUser.role === 'employee' ? 'opacity-65 cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.02]' : ''
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                      <Briefcase className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                      Job Title / Designation
                    </label>
                    {currentUser.role === 'employee' && (
                      <span className="text-[10px] text-slate-400 font-mono">Assigned by Manager</span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={currentUser.role === 'employee'}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className={`w-full glass-input px-3 py-2 text-sm ${
                      currentUser.role === 'employee' ? 'opacity-65 cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.02]' : ''
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
                    <FileText className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                    Professional Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief career summary or notes..."
                    className="w-full glass-input px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
                <LiquidButton type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </LiquidButton>
                <LiquidButton type="submit" variant="primary">
                  Save Profile Changes
                </LiquidButton>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="p-3 bg-sky-50 dark:bg-cyan-500/10 border border-sky-300 dark:border-cyan-400/20 rounded-[2px] flex items-center gap-2.5 text-xs text-sky-900 dark:text-cyan-300 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                <span>Keep your account secure with regular password updates.</span>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 rounded-[2px] text-xs text-rose-800 dark:text-rose-300 font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 rounded-[2px] text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password..."
                  className="w-full glass-input px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters..."
                  className="w-full glass-input px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full glass-input px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
                <LiquidButton type="button" variant="ghost" onClick={onClose}>
                  Close
                </LiquidButton>
                <LiquidButton type="submit" variant="emerald">
                  Update Password
                </LiquidButton>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
