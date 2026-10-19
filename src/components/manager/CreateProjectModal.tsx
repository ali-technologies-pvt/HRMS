'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { Project } from '@/types';
import {
  BriefcaseBusiness,
  X,
  Building2,
  Calendar,
  DollarSign,
  User as UserIcon,
  FileText
} from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { users } = useAuth();
  const { addProject, policy } = useAppData();
  const { showNotification } = useNotifications();

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(policy.departments?.[0] || 'Engineering');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState(150000);
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold' | 'withdrawn'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setClient('');
      setDescription('');
      setDepartment(policy.departments?.[0] || 'Engineering');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDeadline(nextMonth.toISOString().split('T')[0]);
      setBudget(150000);
      setStatus('active');
      setIsSubmitting(false);
    }
  }, [isOpen, policy.departments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Missing Project Name', 'Please specify a title for the project.', 'warning');
      return;
    }
    if (!client.trim()) {
      showNotification('Missing Client', 'Please specify the client or stakeholder.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      addProject({
        name: name.trim(),
        client: client.trim(),
        description: description.trim() || 'Project initialized via Management Portal.',
        department,
        budget: Number(budget) || 0,
        deadline: deadline || undefined,
        status
      });

      showNotification('Project Created', `"${name.trim()}" added to project portfolio.`, 'success');
      onSuccess?.();
      onClose();
    } catch {
      showNotification('Project Error', 'Failed to create project. Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mp-modal-header">
          <div className="mp-modal-header-text">
            <h3>
              <BriefcaseBusiness size={18} className="text-[#244c78] dark:text-[#b5cce6]" />
              Create New Project
            </h3>
            <p>Initialize a project deliverable, define milestones, and assign client account.</p>
          </div>
          <button className="mp-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="mp-modal-body">
            {/* Project Name & Client */}
            <div className="mp-form-grid-2">
              <div className="mp-form-group">
                <label htmlFor="proj-name">
                  Project Title <span className="req">*</span>
                </label>
                <input
                  id="proj-name"
                  className="mp-input"
                  placeholder="e.g. Mobile Banking App 2.0"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="mp-form-group">
                <label htmlFor="proj-client">
                  Client / Organization <span className="req">*</span>
                </label>
                <input
                  id="proj-client"
                  className="mp-input"
                  placeholder="e.g. Standard Chartered / Internal"
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department & Status */}
            <div className="mp-form-grid-2">
              <div className="mp-form-group">
                <label htmlFor="proj-dept">
                  <Building2 size={12} /> Assigned Department
                </label>
                <select
                  id="proj-dept"
                  className="mp-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  {(policy.departments || ['Engineering', 'Design', 'Marketing', 'Operations', 'Quality Assurance']).map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-form-group">
                <label htmlFor="proj-status">Project Status</label>
                <select
                  id="proj-status"
                  className="mp-select"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'active' | 'completed' | 'on_hold' | 'withdrawn')}
                >
                  <option value="active">Active (In Flight)</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>

            {/* Deadline & Budget */}
            <div className="mp-form-grid-2">
              <div className="mp-form-group">
                <label htmlFor="proj-deadline">
                  <Calendar size={12} /> Target Deadline
                </label>
                <input
                  id="proj-deadline"
                  type="date"
                  className="mp-input"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>

              <div className="mp-form-group">
                <label htmlFor="proj-budget">
                  <DollarSign size={12} /> Budget (PKR)
                </label>
                <input
                  id="proj-budget"
                  type="number"
                  step="10000"
                  min="0"
                  className="mp-input"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mp-form-group">
              <label htmlFor="proj-desc">
                <FileText size={12} /> Scope & Objectives
              </label>
              <textarea
                id="proj-desc"
                className="mp-textarea"
                placeholder="Key deliverables, client requirements, milestones..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mp-modal-footer">
            <button type="button" className="mp-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mp-btn-primary" disabled={isSubmitting}>
              <BriefcaseBusiness size={14} />
              {isSubmitting ? 'Creating...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
