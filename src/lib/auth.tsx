import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useClerk, useUser as useClerkUser } from '@clerk/react';
import { useConvexAuth } from 'convex/react';
import {
  getUserByEmail,
  createUser,
  getOrCreateCurrent,
  acceptLegal as acceptLegalRepo,
  updateUser as updateUserRepo,
  submitProfile as submitProfileRepo,
  deleteSelf as deleteSelfRepo,
} from './repositories/userRepository';
import { User } from './types';
import { usesConvexBackend } from './convexClient';
import { hasClerkConfig } from './runtime';

type SignupData = Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'passwordSalt' | 'role'> & {
  password: string;
};

interface AuthContext {
  user: User | null;
  loading: boolean;
  authError?: string | null;
  retrySync?: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  acceptLegal: () => Promise<void>;
  submitProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | null>(null);

const SESSION_KEY = 'zoomievan_session';
const SESSION_TIME_KEY = 'zoomievan_session_time';
const MAX_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours max session lifetime

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashDemoPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return bytesToHex(await crypto.subtle.digest('SHA-256', data));
}

function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = sessionStorage.getItem(SESSION_KEY);
    const timeStr = sessionStorage.getItem(SESSION_TIME_KEY);
    const sessionTime = timeStr ? parseInt(timeStr, 10) : 0;
    const isExpired = !sessionTime || (Date.now() - sessionTime > MAX_SESSION_DURATION_MS);

    if (id && !isExpired) {
      import('./repositories/userRepository').then(({ getUserById }) =>
        getUserById(id).then(u => {
          if (u) {
            setUser(u);
          } else {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_TIME_KEY);
          }
          setLoading(false);
        })
      );
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_TIME_KEY);
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const found = await getUserByEmail(email);
    if (!found?.passwordHash || !found.passwordSalt) return { success: false, error: 'Invalid email or password.' };
    const passwordHash = await hashDemoPassword(password, found.passwordSalt);
    if (found.passwordHash !== passwordHash) return { success: false, error: 'Invalid email or password.' };
    sessionStorage.setItem(SESSION_KEY, found.id);
    sessionStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
    setUser(found);
    return { success: true };
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const existing = await getUserByEmail(data.email);
    if (existing) return { success: false, error: 'An account with this email already exists.' };
    const passwordSalt = randomSalt();
    const passwordHash = await hashDemoPassword(data.password, passwordSalt);
    const { password, ...profile } = data;
    void password;
    const created = await createUser({
      ...profile,
      passwordHash,
      passwordSalt,
      role: 'customer',
    });
    sessionStorage.setItem(SESSION_KEY, created.id);
    sessionStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
    setUser(created);

    if (data.dog.name) {
      import('./repositories/vaccineRepository').then(({ addVaccine }) => {
        addVaccine({
          dogName: data.dog.name,
          ownerName: data.name,
          vaccineType: 'Rabies + DHPP',
        });
      });
    }

    return { success: true };
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    const updated = await updateUserRepo(user.id, updates);
    setUser(updated);
  }, [user]);

  const acceptLegal = useCallback(async () => {
    if (!user) throw new Error('Not logged in');
    const updated = await updateUserRepo(user.id, {
      legalAccepted: true,
      legalAcceptedAt: new Date().toISOString(),
      legalVersion: '2026-07-14',
    });
    setUser(updated);
  }, [user]);

  const submitProfile = useCallback(async () => {
    if (!user) throw new Error('Not logged in');
    const updated = await submitProfileRepo();
    setUser(updated);
  }, [user]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TIME_KEY);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteSelfRepo();
    logout();
  }, [logout]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const { getUserById } = await import('./repositories/userRepository');
    const fresh = await getUserById(user.id);
    if (fresh) setUser(fresh);
  }, [user]);

  return (
    <AuthCtx.Provider value={{
      user,
      loading,
      login,
      signup,
      updateUser,
      acceptLegal,
      submitProfile,
      deleteAccount,
      refreshUser,
      logout,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

function ClerkBackedAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useClerkUser();
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const retrySync = useCallback(() => {
    setAuthError(null);
    setLoading(true);
    setSyncCount(c => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      if (!isLoaded || convexLoading) return;

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        setAuthError(null);
        setLoading(false);
        return;
      }

      if (!isAuthenticated) {
        // While Clerk is signed in but Convex auth token is initializing
        setLoading(true);
        return;
      }

      setLoading(true);
      setAuthError(null);

      try {
        const appUser = await getOrCreateCurrent(
          clerkUser.fullName || clerkUser.firstName || undefined,
          clerkUser.primaryPhoneNumber?.phoneNumber,
          clerkUser.primaryEmailAddress?.emailAddress,
        );

        if (!cancelled) {
          setUser(appUser);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setUser(null);
          setAuthError(err?.message || 'Failed to sync user profile with Convex.');
          setLoading(false);
        }
      }
    }

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [clerkUser, convexLoading, isAuthenticated, isLoaded, isSignedIn, syncCount]);

  const login = useCallback(async () => {
    return { success: false, error: 'Use the Clerk sign-in form.' };
  }, []);

  const signup = useCallback(async () => {
    return { success: false, error: 'Use the Clerk sign-up form.' };
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    const updated = await updateUserRepo(user.id, updates);
    setUser(updated);
  }, [user]);

  const acceptLegal = useCallback(async () => {
    const updated = await acceptLegalRepo();
    setUser(updated);
  }, []);

  const submitProfile = useCallback(async () => {
    const updated = await submitProfileRepo();
    setUser(updated);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    void signOut({ redirectUrl: '/' });
  }, [signOut]);

  const deleteAccount = useCallback(async () => {
    await deleteSelfRepo();
    logout();
  }, [logout]);

  const refreshUser = useCallback(async () => {
    retrySync();
  }, [retrySync]);

  return (
    <AuthCtx.Provider value={{
      user,
      loading,
      authError,
      retrySync,
      login,
      signup,
      updateUser,
      acceptLegal,
      submitProfile,
      deleteAccount,
      refreshUser,
      logout,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (hasClerkConfig && usesConvexBackend) return (
    <ClerkBackedAuthProvider>{children}</ClerkBackedAuthProvider>
  );

  if (!import.meta.env.PROD) return <DemoAuthProvider>{children}</DemoAuthProvider>;

  return (
    <AuthCtx.Provider value={{
      user: null,
      loading: false,
      login: async () => ({ success: false, error: 'Production authentication is not configured.' }),
      signup: async () => ({ success: false, error: 'Production authentication is not configured.' }),
      updateUser: async () => { throw new Error('Production authentication is not configured.'); },
      acceptLegal: async () => { throw new Error('Production authentication is not configured.'); },
      submitProfile: async () => { throw new Error('Production authentication is not configured.'); },
      deleteAccount: async () => { throw new Error('Production authentication is not configured.'); },
      refreshUser: async () => { throw new Error('Production authentication is not configured.'); },
      logout: () => undefined,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
