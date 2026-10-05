'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, UserStatus } from '@/types';
import { initialUsers } from '@/lib/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useNotifications } from './NotificationContext';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  users: User[];
  loginAsUser: (userId: string) => void;
  loginWithCredentials: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  completeMandatoryPasswordChange: (newPass: string) => { success: boolean; error?: string };
  updateUserStatus: (status: UserStatus) => void;
  onboardUser: (newUser: Omit<User, 'id'>) => User;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const loadedUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, initialUsers);
    setUsers(loadedUsers);

    const savedAuthState = loadFromStorage<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false);
    const savedUserId = loadFromStorage<string>(STORAGE_KEYS.ACTIVE_USER_ID, '');

    if (savedAuthState && savedUserId) {
      const matched = loadedUsers.find(u => u.id === savedUserId);
      if (matched) {
        setCurrentUser(matched);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoaded(true);
  }, []);

  // Save users when updated
  const syncUsers = useCallback((updatedUsers: User[]) => {
    setUsers(updatedUsers);
    saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
  }, []);

  const loginAsUser = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      saveToStorage(STORAGE_KEYS.ACTIVE_USER_ID, target.id);
      saveToStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      showNotification('Account Switched', `Logged in as ${target.name} (${target.role.replace('_', ' ').toUpperCase()})`, 'info');
    }
  }, [users, showNotification]);

  const switchRole = useCallback((role: UserRole) => {
    // Find first user with this role
    let target = users.find(u => u.role === role);
    if (!target) {
      target = initialUsers.find(u => u.role === role);
    }
    if (target) {
      loginAsUser(target.id);
    }
  }, [users, loginAsUser]);

  const loginWithCredentials = useCallback((email: string, pass: string) => {
    const matched = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (!matched) {
      return { success: false, error: 'No account registered with this email address.' };
    }
    if (matched.password && matched.password !== pass) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }
    setCurrentUser(matched);
    setIsAuthenticated(true);
    saveToStorage(STORAGE_KEYS.ACTIVE_USER_ID, matched.id);
    saveToStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
    showNotification('Access Granted', `Welcome back, ${matched.name}`, 'success');
    return { success: true };
  }, [users, showNotification]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    saveToStorage(STORAGE_KEYS.IS_AUTHENTICATED, false);
    saveToStorage(STORAGE_KEYS.ACTIVE_USER_ID, '');
    showNotification('Shift Ended', 'You have been safely signed out.', 'info');
  }, [showNotification]);

  const updateCurrentUserProfile = useCallback((updates: Partial<User>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      const newUsers = users.map(u => u.id === prev.id ? updated : u);
      syncUsers(newUsers);
      return updated;
    });
    showNotification('Profile Saved', 'Your profile customization has been applied.', 'success');
  }, [users, syncUsers, showNotification]);

  const changePassword = useCallback((oldPass: string, newPass: string) => {
    if (currentUser.password && currentUser.password !== oldPass) {
      return { success: false, error: 'Current password does not match' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    const updated: User = {
      ...currentUser,
      password: newPass,
      tempPassword: false,
      mustChangePassword: false
    };

    setCurrentUser(updated);
    const newUsers = users.map(u => u.id === currentUser.id ? updated : u);
    syncUsers(newUsers);
    showNotification('Security Updated', 'Password changed successfully.', 'success');
    return { success: true };
  }, [currentUser, users, syncUsers, showNotification]);

  const completeMandatoryPasswordChange = useCallback((newPass: string) => {
    if (newPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const updated: User = {
      ...currentUser,
      password: newPass,
      tempPassword: false,
      mustChangePassword: false
    };

    setCurrentUser(updated);
    const newUsers = users.map(u => u.id === currentUser.id ? updated : u);
    syncUsers(newUsers);
    showNotification('Account Activated', 'Compulsory password reset completed. Full portal unlocked!', 'success');
    return { success: true };
  }, [currentUser, users, syncUsers, showNotification]);

  const updateUserStatus = useCallback((status: UserStatus) => {
    setCurrentUser(prev => {
      const updated = { ...prev, status };
      const newUsers = users.map(u => u.id === prev.id ? updated : u);
      syncUsers(newUsers);
      return updated;
    });
  }, [users, syncUsers]);

  const onboardUser = useCallback((newUserData: Omit<User, 'id'>) => {
    const id = 'usr-' + Date.now().toString(36);
    const created: User = {
      ...newUserData,
      id,
    };
    const updatedUsers = [created, ...users];
    syncUsers(updatedUsers);
    showNotification('User Onboarded', `${created.name} (${created.email}) added with temporary credentials.`, 'success');
    return created;
  }, [users, syncUsers, showNotification]);

  const deleteUser = useCallback((userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    syncUsers(updatedUsers);
    showNotification('Account Revoked', 'User access has been permanently removed.', 'warning');
  }, [users, syncUsers, showNotification]);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role } : u);
    syncUsers(updatedUsers);
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role }));
    }
    showNotification('Permissions Updated', `Role updated to ${role.replace('_', ' ').toUpperCase()}`, 'info');
  }, [users, currentUser.id, syncUsers, showNotification]);

  if (!isLoaded) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        loginAsUser,
        loginWithCredentials,
        logout,
        switchRole,
        updateCurrentUserProfile,
        changePassword,
        completeMandatoryPasswordChange,
        updateUserStatus,
        onboardUser,
        deleteUser,
        updateUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
