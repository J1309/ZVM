import { getItem, setItem, generateId } from '../db';
import { User } from '../types';
import { api, convex } from '../convexClient';

const KEY = 'users';

export async function getAllUsers(): Promise<User[]> {
  if (convex) return convex.query(api.users.list);
  return getItem<User[]>(KEY) ?? [];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = getItem<User[]>(KEY) ?? [];
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (convex) return convex.query(api.users.getById, { id: id as any });
  return (getItem<User[]>(KEY) ?? []).find(user => user.id === id) ?? null;
}

export async function getOrCreateCurrent(name?: string, phone?: string, email?: string): Promise<User> {
  if (!convex) throw new Error('Production authentication is not configured.');
  return convex.mutation(api.users.getOrCreateCurrent, { name, phone, email });
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  if (convex) throw new Error('Production accounts must be created through Clerk.');
  const users = getItem<User[]>(KEY) ?? [];
  const newUser: User = { ...user, id: generateId(), createdAt: new Date().toISOString() };
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
      ...safeUpdates
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
    return convex.mutation(api.users.update, { id: id as any, updates: safeUpdates });
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

export async function deleteUser(id: string): Promise<void> {
  const users = getItem<User[]>(KEY) ?? [];
  const filtered = users.filter(user => user.id !== id);
  setItem(KEY, filtered);
}
