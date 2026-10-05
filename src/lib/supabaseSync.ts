import { User, UserRole, UserStatus } from '@/types';
import { getSupabase } from './supabase';

export function mapRowToUser(row: any): User {
  if (row.raw_data && typeof row.raw_data === 'object') {
    return {
      ...row.raw_data,
      id: row.id || row.raw_data.id,
      email: (row.email || row.raw_data.email || '').trim().toLowerCase(),
      name: row.name || row.raw_data.name,
      password: row.password || row.raw_data.password,
      role: (row.role || row.raw_data.role) as UserRole,
      department: row.department || row.raw_data.department,
      designation: row.designation || row.raw_data.designation,
      tempPassword: row.temp_password ?? row.raw_data.tempPassword ?? false,
      mustChangePassword: row.must_change_password ?? row.raw_data.mustChangePassword ?? false,
      status: (row.status || row.raw_data.status || 'offline') as UserStatus
    };
  }

  return {
    id: row.id,
    email: (row.email || '').trim().toLowerCase(),
    name: row.name || 'Team Member',
    password: row.password || '',
    role: (row.role || 'employee') as UserRole,
    department: row.department || 'Operations',
    designation: row.designation || '',
    phone: row.phone || '',
    bio: row.bio || '',
    avatarUrl: row.avatar_url || row.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: (row.status || 'offline') as UserStatus,
    salary: Number(row.salary) || 5000,
    joiningDate: row.joining_date || row.joiningDate || '2026-10-01',
    tempPassword: Boolean(row.temp_password ?? row.tempPassword),
    mustChangePassword: Boolean(row.must_change_password ?? row.mustChangePassword),
    leaveQuota: row.leave_quota || row.leaveQuota || { medical: 12, casual: 12, annual: 24 }
  };
}

export function mapUserToRow(user: User): any {
  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    password: user.password || '',
    role: user.role,
    department: user.department || 'Operations',
    designation: user.designation || '',
    salary: user.salary || 5000,
    avatar_url: user.avatarUrl || '',
    phone: user.phone || '',
    status: user.status || 'offline',
    temp_password: Boolean(user.tempPassword),
    must_change_password: Boolean(user.mustChangePassword),
    joining_date: user.joiningDate || '2026-10-01',
    leave_quota: user.leaveQuota || { medical: 12, casual: 12, annual: 24 },
    raw_data: user,
    updated_at: new Date().toISOString()
  };
}

// Track active table name ('hrms_users' or fallback 'users')
let determinedUsersTable: string | null = null;

async function getUsersTable(client: any): Promise<string> {
  if (determinedUsersTable) return determinedUsersTable;

  try {
    const { error: err1 } = await client.from('hrms_users').select('id').limit(1);
    if (!err1) {
      determinedUsersTable = 'hrms_users';
      return 'hrms_users';
    }
  } catch {}

  try {
    const { error: err2 } = await client.from('users').select('id').limit(1);
    if (!err2) {
      determinedUsersTable = 'users';
      return 'users';
    }
  } catch {}

  // Default to hrms_users
  determinedUsersTable = 'hrms_users';
  return 'hrms_users';
}

/**
 * Fetch all users from Supabase cloud database
 */
export async function fetchRemoteUsers(): Promise<User[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const table = await getUsersTable(client);
    const { data, error } = await client.from(table).select('*');

    if (!error && Array.isArray(data)) {
      return data.map(mapRowToUser);
    }

    // Secondary fallback: check hrms_sync table for key 'users'
    const { data: syncData, error: syncError } = await client
      .from('hrms_sync')
      .select('data')
      .eq('key', 'users')
      .single();

    if (!syncError && syncData?.data && Array.isArray(syncData.data)) {
      return syncData.data;
    }

    return null;
  } catch (err) {
    console.warn('fetchRemoteUsers error:', err);
    return null;
  }
}

/**
 * Fetch a single user by email address (for real-time login verification across devices)
 */
export async function fetchUserByEmail(email: string): Promise<User | null> {
  const client = getSupabase();
  if (!client || !email) return null;

  const normalized = email.trim().toLowerCase();

  try {
    const table = await getUsersTable(client);
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('email', normalized)
      .limit(1);

    if (!error && data && data.length > 0) {
      return mapRowToUser(data[0]);
    }

    // Secondary check: hrms_sync table
    const { data: syncData } = await client
      .from('hrms_sync')
      .select('data')
      .eq('key', 'users')
      .single();

    if (syncData?.data && Array.isArray(syncData.data)) {
      const matched = syncData.data.find((u: any) => (u.email || '').trim().toLowerCase() === normalized);
      if (matched) return matched;
    }

    return null;
  } catch (err) {
    console.warn('fetchUserByEmail error:', err);
    return null;
  }
}

/**
 * Save / Upsert a single user to Supabase
 */
export async function pushUserToSupabase(user: User): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const table = await getUsersTable(client);
    const row = mapUserToRow(user);

    const { error } = await client
      .from(table)
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn(`Supabase upsert to ${table} failed, trying sync table:`, error.message);
    }

    // Also update hrms_sync 'users' list as redundancy backup
    try {
      const { data: currentSync } = await client
        .from('hrms_sync')
        .select('data')
        .eq('key', 'users')
        .single();

      let currentUsers: User[] = currentSync?.data && Array.isArray(currentSync.data) ? currentSync.data : [];
      const idx = currentUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (idx >= 0) {
        currentUsers[idx] = user;
      } else {
        currentUsers = [user, ...currentUsers];
      }

      await client.from('hrms_sync').upsert({
        key: 'users',
        data: currentUsers,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch {}

    return true;
  } catch (err) {
    console.warn('pushUserToSupabase error:', err);
    return false;
  }
}

/**
 * Save multiple users to Supabase in bulk
 */
export async function pushUsersBulkToSupabase(usersList: User[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || usersList.length === 0) return false;

  try {
    const table = await getUsersTable(client);
    const rows = usersList.map(mapUserToRow);

    await client.from(table).upsert(rows, { onConflict: 'id' });

    // Also sync to hrms_sync 'users'
    await client.from('hrms_sync').upsert({
      key: 'users',
      data: usersList,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    return true;
  } catch (err) {
    console.warn('pushUsersBulkToSupabase error:', err);
    return false;
  }
}

/**
 * Delete a user from Supabase
 */
export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const table = await getUsersTable(client);
    await client.from(table).delete().eq('id', userId);

    // Also remove from hrms_sync
    try {
      const { data: currentSync } = await client
        .from('hrms_sync')
        .select('data')
        .eq('key', 'users')
        .single();

      if (currentSync?.data && Array.isArray(currentSync.data)) {
        const filtered = currentSync.data.filter((u: any) => u.id !== userId);
        await client.from('hrms_sync').upsert({
          key: 'users',
          data: filtered,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('deleteUserFromSupabase error:', err);
    return false;
  }
}

/**
 * Universal Synchronized Collection for Attendance, Projects, Tasks, Reports, Requests, Chat
 */
export async function pushCollectionToSupabase<T>(key: string, data: T): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('hrms_sync').upsert({
      key,
      data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    if (error) {
      console.warn(`Supabase sync for key "${key}" error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`pushCollectionToSupabase [${key}] error:`, err);
    return false;
  }
}

export async function fetchCollectionFromSupabase<T>(key: string): Promise<T | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('hrms_sync')
      .select('data')
      .eq('key', key)
      .single();

    if (!error && data?.data) {
      return data.data as T;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Realtime channel listener for instant multi-user synchronization
 */
export function subscribeToRealtimeChanges(
  onUsersChange?: (users: User[]) => void,
  onCollectionChange?: (key: string, data: any) => void
) {
  const client = getSupabase();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('hrms-cloud-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hrms_users' },
        async () => {
          if (onUsersChange) {
            const updated = await fetchRemoteUsers();
            if (updated) onUsersChange(updated);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hrms_sync' },
        (payload: any) => {
          if (onCollectionChange && payload.new?.key && payload.new?.data) {
            onCollectionChange(payload.new.key, payload.new.data);
            if (payload.new.key === 'users' && onUsersChange && Array.isArray(payload.new.data)) {
              onUsersChange(payload.new.data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
