import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Heart } from 'lucide-react';
import { SignIn } from '@clerk/react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden lg:block"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
              <Heart className="h-4 w-4" />
              Welcome back
            </span>
            <h1 className="font-display text-5xl font-bold leading-tight text-white">
              Manage your dog's next happy run.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/78">
              Sign in with secure Clerk authentication to view bookings, session notes,
              route updates, and your dog's ZoomieVan profile.
            </p>
            <div className="keep-white mt-8 rounded-3xl border border-white/15 bg-[#071A3D] p-6 text-white shadow-xl shadow-black/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Verified account access</h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    Clerk handles secure sessions and email verification before your profile connects to ZoomieVan.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mx-auto flex w-full max-w-md justify-center"
          >
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              forceRedirectUrl="/auth/redirect"
              fallbackRedirectUrl="/auth/redirect"
            />
          </motion.section>
        </div>
      </main>
    );
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Already signed in: no reason to show the sign-in form.
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden lg:block"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
            <Heart className="h-4 w-4" />
            Welcome back
          </span>
          <h1 className="font-display text-5xl font-bold leading-tight text-white">
            Manage your dog's next happy run.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/78">
            Sign in to view bookings, session notes, route updates, and your dog's ZoomieVan profile.
          </p>
          <div className="keep-white mt-8 rounded-3xl border border-white/15 bg-[#071A3D] p-6 text-white shadow-xl shadow-black/10">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Safe account access</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  Your booking details, address, and dog profile stay behind your account login.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="friendly-card mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-xl shadow-black/10 sm:p-8"
        >
          <div className="mb-7 text-center">
            <Link to="/" className="mb-5 inline-flex items-center justify-center">
              <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-9 w-auto" />
            </Link>
            <h2 className="font-display text-3xl font-bold text-[#071A3D]">Sign in</h2>
            <p className="mt-2 text-sm text-[#315B96]">Access bookings, routes, and dog profiles.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-[#D6E6FF] bg-[#EAF2FF] pl-10 pr-4 text-sm text-[#071A3D] placeholder:text-[#7E9ED2] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#D6E6FF] bg-[#EAF2FF] pl-10 pr-10 text-sm text-[#071A3D] placeholder:text-[#7E9ED2] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#315B96] hover:text-brand-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="keep-white flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-[#315B96]">
            New to ZoomieVan?{' '}
            <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700">Book a first run</Link>
          </p>
        </motion.section>
      </div>
    </main>
  );
}
