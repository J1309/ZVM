import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useUser as useClerkUser } from '@clerk/react';
import { Loader2, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { isPrivilegedAdminEmail } from '../lib/repositories/userRepository';

export default function AuthRedirect() {
  const { user, loading, authError, retrySync, logout } = useAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useClerkUser();

  if (loading || !isClerkLoaded) {
    return (
      <div className="min-h-screen bg-[#071A3D] flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <h2 className="font-display text-xl font-bold text-white">Connecting your ZoomieVan account...</h2>
        <p className="mt-2 text-sm text-white/70 max-w-sm">
          Linking your Clerk identity with your profile.
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' || isPrivilegedAdminEmail(user.email) ? '/admin' : '/dashboard'} replace />;
  }

  // If Clerk is signed in but user doc hasn't synced or encountered a sync error,
  // show status screen instead of redirecting back to /login in a loop.
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#071A3D] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-white/20 bg-white p-7 text-center shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#071A3D]">Account Sync Notice</h2>
          <p className="mt-2 text-sm text-[#315B96] leading-relaxed">
            Your Clerk login was successful, but linking your account profile to Convex needs attention.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono text-amber-800 text-left overflow-auto max-h-24">
              {authError}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={retrySync}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-bold text-white transition hover:bg-brand-600"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6E6FF] bg-white py-3 font-bold text-[#315B96] transition hover:bg-[#EAF2FF]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
}
