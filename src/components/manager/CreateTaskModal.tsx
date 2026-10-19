'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useNotifications } from '@/context/NotificationContext';
import { TaskPriority, TaskStatus } from '@/types';
import {
  CheckSquare,
  X,
  BriefcaseBusiness,
  User as UserIcon,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  FileText
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProjectId?: string;
  defaultAssigneeId?: string;
}

const CATEGORIES = [
  'Frontend',
  'Backend',
  'UI/UX Design',
  'QA & Testing',
  'DevOps',
  'Mobile App',
  'Documentation',
  'Management'
];

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultAssigneeId
}: CreateTaskModalProps) {
  const { users, currentUser } = useAuth();
  const { projects, addTask } = useAppData();
  const { showNotification } = useNotifications();

  const activeProjects = projects.filter(p => p.status !== 'withdrawn');
  const staff = users.filter(u => u.role !== 'super_admin');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || activeProjects[0]?.id || '');
  const [assignedToId, setAssignedToId] = useState(defaultAssigneeId || staff[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setProjectId(defaultProjectId || activeProjects[0]?.id || '');
      setAssignedToId(defaultAssigneeId || staff[0]?.id || '');
      setPriority('medium');
      setCategory(CATEGORIES[0]);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDeadline(nextWeek.toISOString().split('T')[0]);
      setEstimatedHours(6);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultProjectId, defaultAssigneeId, projects, users]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotification('Missing Title', 'Please enter a task title.', 'warning');
      return;
    }
    if (!projectId) {
      showNotification('Missing Project', 'Please select a project for this task.', 'warning');
      return;
    }
    if (!assignedToId) {
      showNotification('Missing Assignee', 'Please assign this task to a team member.', 'warning');
      return;
    }

    const assignedUser = users.find(u => u.id === assignedToId);
    const assignedProject = projects.find(p => p.id === projectId);

    setIsSubmitting(true);
    try {
      addTask({
        title: title.trim(),
        description: description.trim() || 'No additional instructions provided.',
        projectId,
        projectName: assignedProject?.name || 'General Project',
        assignedToId,
        assignedToName: assignedUser?.name || 'Unassigned',
        assignedToAvatar: assignedUser?.avatarUrl || '',
        assignedById: currentUser.id,
        assignedByName: currentUser.name,
        priority,
        status: 'pending' as TaskStatus,
        deadline: deadline || new Date().toISOString().split('T')[0],
        estimatedHours: Number(estimatedHours) || 4,
        category
      });

      showNotification('Task Assigned', `Task allocated to ${assignedUser?.name || 'team member'}.`, 'success');
      onSuccess?.();
      onClose();
    } catch {
      showNotification('Task Error', 'Failed to create task. Please try again.', 'warning');
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
              <CheckSquare size={18} className="text-[#244c78] dark:text-[#b5cce6]" />
              Create & Allocate Task
            </h3>
            <p>Assign a deliverable to a teammate with priority, sprint category, and deadline.</p>
          </div>
          <button className="mp-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="mp-modal-body">
            {/* Task Title */}
            <div className="mp-form-group">
              <label htmlFor="task-title">
                Task Title <span className="req">*</span>
              </label>
              <input
                id="task-title"
                className="mp-input"
                placeholder="e.g. Design and integrate biometric authentication modal"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Project & Assignee */}
            <div className="mp-form-grid-2">
              <div className="mp-form-group">
                <label htmlFor="task-project">
                  <BriefcaseBusiness size={12} /> Target Project <span className="req">*</span>
                </label>
                <select
                  id="task-project"
                  className="mp-select"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  required
                >
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-form-group">
                <label htmlFor="task-assignee">
                  <UserIcon size={12} /> Assigned Member <span className="req">*</span>
                </label>
                <select
                  id="task-assignee"
                  className="mp-select"
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  required
                >
                  {staff.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.designation || u.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="mp-form-group">
              <label>
                <AlertCircle size={12} /> Priority Level
              </label>
              <div className="mp-pill-selector">
                {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`mp-pill-btn is-${p} ${priority === p ? 'is-active' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p === 'urgent'
                          ? 'bg-rose-500'
                          : p === 'high'
                          ? 'bg-amber-500'
                          : p === 'medium'
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category, Deadline & Hours */}
            <div className="mp-form-grid-3">
              <div className="mp-form-group">
                <label htmlFor="task-category">
                  <Tag size={12} /> Category
                </label>
                <select
                  id="task-category"
                  className="mp-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-form-group">
                <label htmlFor="task-deadline">
                  <Calendar size={12} /> Deadline
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  className="mp-input"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="mp-form-group">
                <label htmlFor="task-hours">
                  <Clock size={12} /> Est. Hours
                </label>
                <input
                  id="task-hours"
                  type="number"
                  min="1"
                  max="160"
                  className="mp-input"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mp-form-group">
              <label htmlFor="task-desc">
                <FileText size={12} /> Task Brief & Instructions
              </label>
              <textarea
                id="task-desc"
                className="mp-textarea"
                placeholder="Scope, acceptance criteria, links to Figma/docs, expectations..."
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
              <CheckSquare size={14} />
              {isSubmitting ? 'Allocating...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
