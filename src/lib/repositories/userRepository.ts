import { getItem, setItem, generateId } from '../db';
import { User } from '../types';
import { api, convex } from '../convexClient';

const KEY = 'users';

export function isPrivilegedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'admin' ||
    clean === 'admin@zoomievan.ca' ||
    clean === 'support@zoomievaninc.com' ||
    clean.startsWith('admin@') ||
    clean.includes('+admin@') ||
    clean.endsWith('@zoomievan.ca') ||
    clean.endsWith('@zoomievaninc.com')
  );
}

export async function getAllUsers(): Promise<User[]> {
  if (convex) return convex.query(api.users.list);
  const users = getItem<User[]>(KEY) ?? [];
  let changed = false;
  users.forEach(u => {
    if (isPrivilegedAdminEmail(u.email) && u.role !== 'admin') {
      u.role = 'admin';
      changed = true;
    }
  });
  if (changed) setItem(KEY, users);
  return users;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = getItem<User[]>(KEY) ?? [];
  const found = users.find(user => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  if (found && isPrivilegedAdminEmail(found.email) && found.role !== 'admin') {
    found.role = 'admin';
    const index = users.findIndex(u => u.id === found.id);
    if (index !== -1) {
      users[index] = found;
      setItem(KEY, users);
    }
  }
  return found;
}

export async function getUserById(id: string): Promise<User | null> {
  if (convex) return convex.query(api.users.getById, { id: id as any });
  const users = getItem<User[]>(KEY) ?? [];
  const found = users.find(user => user.id === id) ?? null;
  if (found && isPrivilegedAdminEmail(found.email) && found.role !== 'admin') {
    found.role = 'admin';
    const index = users.findIndex(u => u.id === found.id);
    if (index !== -1) {
      users[index] = found;
      setItem(KEY, users);
    }
  }
  return found;
}

export async function getOrCreateCurrent(name?: string, phone?: string, email?: string): Promise<User> {
  if (!convex) throw new Error('Production authentication is not configured.');
  return convex.mutation(api.users.getOrCreateCurrent, { name, phone, email });
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  if (convex) throw new Error('Production accounts must be created through Clerk.');
  const users = getItem<User[]>(KEY) ?? [];
  const role = isPrivilegedAdminEmail(user.email) ? 'admin' : (user.role || 'customer');
  const newUser: User = { ...user, role, id: generateId(), createdAt: new Date().toISOString() };
  users.push(newUser);
  setItem(KEY, users);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  if (convex) {
    const {
      id: _id,
      createdAt,
      email,
      role,
      authProviderUserId,
      passwordHash,
      passwordSalt,
      legalAccepted,
      legalAcceptedAt,
      legalVersion,
      profileSubmittedAt,
      accountVerifiedAt,
      ...otherUpdates
    } = updates;
    void _id;
    void createdAt;
    void email;
    void role;
    void authProviderUserId;
    void passwordHash;
    void passwordSalt;
    void legalAccepted;
    void legalAcceptedAt;
    void legalVersion;

    const safeUpdates: Record<string, any> = { ...otherUpdates };
    if (profileSubmittedAt !== undefined) {
      safeUpdates.profileSubmittedAt = profileSubmittedAt ? new Date(profileSubmittedAt).getTime() : null;
    }
    if (accountVerifiedAt !== undefined) {
      safeUpdates.accountVerifiedAt = accountVerifiedAt ? new Date(accountVerifiedAt).getTime() : null;
    }

    return convex.mutation(api.users.update, { id: id as any, updates: safeUpdates as any });
  }

  const users = getItem<User[]>(KEY) ?? [];
  const index = users.findIndex(user => user.id === id);
  if (index === -1) throw new Error('User not found');
  users[index] = { ...users[index], ...updates };
  setItem(KEY, users);
  return users[index];
}

export async function acceptLegal(): Promise<User> {
  if (!convex) throw new Error('Production authentication is not configured.');
  return convex.mutation(api.users.acceptLegal, {});
}

export async function submitProfile(): Promise<User> {
  if (convex) return convex.mutation(api.users.submitProfile, {});
  const id = sessionStorage.getItem('zoomievan_session');
  if (!id) throw new Error('Not logged in');
  return updateUser(id, { profileCompleted: true, profileSubmittedAt: new Date().toISOString() });
}

export async function verifyAccount(userId: string, verified: boolean): Promise<User | null> {
  if (convex) return convex.mutation(api.users.verifyAccount, { userId: userId as any, verified });
  return updateUser(userId, {
    accountVerified: verified,
    accountVerifiedAt: verified ? new Date().toISOString() : null,
    accountVerifiedBy: verified ? 'Admin' : null,
  });
}

export async function deleteSelf(): Promise<{ success: boolean }> {
  if (convex) return convex.mutation(api.users.deleteSelf, {});
  const id = sessionStorage.getItem('zoomievan_session');
  if (id) await deleteUser(id);
  return { success: true };
}

export async function deleteUser(id: string): Promise<void> {
  if (convex) {
    await convex.mutation(api.users.remove, { id: id as any });
    return;
  }
  const users = getItem<User[]>(KEY) ?? [];
  const filtered = users.filter(user => user.id !== id);
  setItem(KEY, filtered);
}
