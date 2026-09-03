import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PawPrint, X, Sparkles, Star, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getItem, setItem } from '../lib/db';
import { useAuth } from '../lib/auth';
import { getTimeUntilLaunch, isFullLaunchActive, CountdownState, LAUNCH_TIME_LABEL_CANADIAN } from '../lib/launchConfig';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';

const SEEN_KEY = 'comingSoonSeen';

export default function ComingSoonModal() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(() => !getItem<boolean>(SEEN_KEY));
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);

  useEffect(() => {
    getFoundingMemberStats().then(setFoundingStats);

    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dismiss = () => {
    setItem(SEEN_KEY, true);
    setOpen(false);
  };

  const handleClaimEarlyAccess = () => {
    dismiss();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const remaining = foundingStats?.remainingCount ?? 47;
  const isFullLaunch = isFullLaunchActive();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[900] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-900/85 backdrop-blur-md"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-dark-600 bg-dark-800 shadow-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {/* Glow header band */}
            <div className="relative h-24 bg-gradient-to-br from-amber-600 via-brand-600 to-brand-500 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_30%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
              <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/25 border border-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-sm shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Official Launch Celebration
              </div>
            </div>

            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Body */}
            <div className="p-6 sm:p-7 text-center space-y-4">
              <div>
                <h2 id="coming-soon-title" className="text-2xl sm:text-3xl font-display font-black text-white">
                  Launching September 4th!
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-brand-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{LAUNCH_TIME_LABEL_CANADIAN}</span>
                </div>
              </div>

              {/* Countdown Flip Boxes */}
              {!isFullLaunch && (
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto pt-1">
                  {[
                    { label: 'Days', val: countdown.days },
                    { label: 'Hours', val: countdown.hours },
                    { label: 'Mins', val: countdown.minutes },
                    { label: 'Secs', val: countdown.seconds },
                  ].map((unit) => (
                    <div key={unit.label} className="bg-dark-900 border border-dark-700 rounded-xl p-2 text-center">
                      <span className="font-display font-black text-xl sm:text-2xl text-white tabular-nums block">
                        {String(unit.val).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-dark-400 block">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Founding Member Early Access Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-dark-900 to-dark-900 border border-amber-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Early Access Active
                  </span>
                  <span className="text-[11px] font-bold text-amber-300">
                    {remaining > 0 ? `${remaining} / 50 Spots Left` : 'All 50 Claimed'}
                  </span>
                </div>
                <p className="text-xs text-dark-200 leading-relaxed">
                  General packages unlock at 11:11 AM. <strong>Founding Members can subscribe right now</strong> with exclusive early access and get <strong>3 runs for the price of 2 ($70 CAD)</strong>.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={handleClaimEarlyAccess}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 hover:from-amber-400 hover:to-brand-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group"
                >
                  <PawPrint className="w-4 h-4" />
                  <span>{user ? 'Enter Early Access Dashboard' : 'Claim Founding Member Early Access'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-dark-300 hover:text-white transition-colors"
                >
                  Explore site preview first
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
