'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, UserStatus } from '@/types';
import { initialUsers } from '@/lib/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { useNotifications } from './NotificationContext';
import {
  fetchRemoteUsers,
  fetchUserByEmail,
  pushUserToSupabase,
  pushUsersBulkToSupabase,
  deleteUserFromSupabase,
  subscribeToRealtimeChanges
} from '@/lib/supabaseSync';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  users: User[];
  loginAsUser: (userId: string) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  completeMandatoryPasswordChange: (newPass: string) => { success: boolean; error?: string };
  updateUserStatus: (status: UserStatus) => void;
  onboardUser: (newUser: Omit<User, 'id'>) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
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

  // 1. Initialize from local storage on mount + sync with Supabase cloud
  useEffect(() => {
    let isMounted = true;
    const localUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, initialUsers);
    setUsers(localUsers);

    const savedAuthState = loadFromStorage<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false);
    const savedUserId = loadFromStorage<string>(STORAGE_KEYS.ACTIVE_USER_ID, '');

    if (savedAuthState && savedUserId) {
      const matched = localUsers.find(u => u.id === savedUserId);
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

    // 2. Asynchronously fetch latest users from Supabase Cloud
    async function syncCloudUsers() {
      try {
        const remote = await fetchRemoteUsers();
        if (!isMounted) return;

        if (remote && remote.length > 0) {
          // Merge: remote has priority, but keep any local users created offline
          const remoteEmails = new Set(remote.map(u => u.email.trim().toLowerCase()));
          const localOnly = localUsers.filter(u => !remoteEmails.has(u.email.trim().toLowerCase()));

          if (localOnly.length > 0) {
            // Push offline/locally created users to Supabase so other devices see them
            pushUsersBulkToSupabase(localOnly);
          }

          const merged = [...remote, ...localOnly];
          setUsers(merged);
          saveToStorage(STORAGE_KEYS.USERS, merged);

          // Update active user in session if profile was updated on cloud
          if (savedAuthState && savedUserId) {
            const upToDateUser = merged.find(u => u.id === savedUserId);
            if (upToDateUser) setCurrentUser(upToDateUser);
          }
        } else if (localUsers.length > 0) {
          // Supabase is empty or connected for the first time: Seed cloud with local users!
          pushUsersBulkToSupabase(localUsers);
        }
      } catch (err) {
        console.warn('Background cloud user sync error:', err);
      }
    }

    syncCloudUsers();

    // 3. Realtime subscription: updates when another manager/user creates an account
    const unsubscribe = subscribeToRealtimeChanges((updatedUsers) => {
      if (isMounted && updatedUsers && updatedUsers.length > 0) {
        setUsers(updatedUsers);
        saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Save users when updated locally
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
    let target = users.find(u => u.role === role);
    if (!target) {
      target = initialUsers.find(u => u.role === role);
    }
    if (target) {
      loginAsUser(target.id);
    }
  }, [users, loginAsUser]);

  // Real-time Cloud Authenticator
  const loginWithCredentials = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    let matched = users.find(u => u.email.trim().toLowerCase() === normalized);

    // If not found in local memory, query Supabase cloud directly in real-time!
    if (!matched) {
      try {
        const cloudUser = await fetchUserByEmail(normalized);
        if (cloudUser) {
          matched = cloudUser;
          const updated = [cloudUser, ...users.filter(u => u.id !== cloudUser.id)];
          setUsers(updated);
          saveToStorage(STORAGE_KEYS.USERS, updated);
        }
      } catch (err) {
        console.warn('Real-time cloud lookup error:', err);
      }
    }

    if (!matched) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    // Verify Password (with cloud re-check in case password was changed on another machine)
    if (matched.password && matched.password !== pass) {
      try {
        const freshCloudUser = await fetchUserByEmail(normalized);
        if (freshCloudUser && freshCloudUser.password === pass) {
          matched = freshCloudUser;
          const updated = users.map(u => u.id === freshCloudUser.id ? freshCloudUser : u);
          setUsers(updated);
          saveToStorage(STORAGE_KEYS.USERS, updated);
        } else {
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }
      } catch {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }
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
      pushUserToSupabase(updated);
      return updated;
    });
    if(Object.keys(updates).some(key=>['name','avatarUrl','phone','bio','department','designation'].includes(key)))showNotification('Profile Saved', 'Your profile details have been updated.', 'success');
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
    pushUserToSupabase(updated);
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
    pushUserToSupabase(updated);
    showNotification('Account Activated', 'Compulsory password reset completed. Full portal unlocked!', 'success');
    return { success: true };
  }, [currentUser, users, syncUsers, showNotification]);

  const updateUserStatus = useCallback((status: UserStatus) => {
    setCurrentUser(prev => {
      const updated = { ...prev, status };
      const newUsers = users.map(u => u.id === prev.id ? updated : u);
      syncUsers(newUsers);
      pushUserToSupabase(updated);
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
    // Push immediately to Supabase Cloud
    pushUserToSupabase(created);
    return created;
  }, [users, syncUsers]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updatedUser = { ...target, ...updates };
    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    syncUsers(updatedUsers);
    pushUserToSupabase(updatedUser);
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    showNotification('Profile Updated', `${updatedUser.name}'s details saved and synced.`, 'success');
  }, [users, currentUser.id, syncUsers, showNotification]);

  const deleteUser = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    const updatedUsers = users.filter(u => u.id !== userId);
    syncUsers(updatedUsers);
    deleteUserFromSupabase(userId);
    showNotification('Account Revoked', `${target?.name || 'User'} access has been permanently deleted.`, 'warning');
  }, [users, syncUsers, showNotification]);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updatedUser = { ...target, role };
    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    syncUsers(updatedUsers);
    pushUserToSupabase(updatedUser);
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role }));
    }
  }, [users, currentUser.id, syncUsers]);

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
        updateUser,
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
