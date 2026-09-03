import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Star, ArrowRight, PhoneCall, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getItem, setItem } from '../lib/db.ts';
import { useAuth } from '../lib/auth';
import { getTimeUntilLaunch, isFullLaunchActive, CountdownState } from '../lib/launchConfig';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';

const SEEN_KEY = 'zoomievan_launch_celebration_modal_seen';

interface LaunchCelebrationModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function LaunchCelebrationModal({ forceOpen, onClose }: LaunchCelebrationModalProps) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(() => !getItem<boolean>(SEEN_KEY));
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);

  const isOpen = forceOpen !== undefined ? forceOpen : internalOpen;

  useEffect(() => {
    getFoundingMemberStats().then(setFoundingStats);

    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dismiss = () => {
    setItem(SEEN_KEY, true);
    setInternalOpen(false);
    if (onClose) onClose();
  };

  const handleClaim = () => {
    dismiss();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const remaining = foundingStats?.remainingCount ?? 47;
  const claimed = foundingStats?.claimedCount ?? 3;
  const isCapped = remaining <= 0;
  const isFullLaunch = isFullLaunchActive();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[950] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-md"
            onClick={dismiss}
          />

          {/* Modal Container — Compact & Sleek */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/30 bg-dark-900 shadow-2xl shadow-black/80 my-auto z-10"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 15 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Top Close Button */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition-colors z-20 backdrop-blur-md border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visual Hero Header with Real Van Dog Image (No owner photo) */}
            <div className="relative h-36 sm:h-40 w-full overflow-hidden">
              <img
                src="/images/hero-dog-van.jpg"
                alt="ZoomieVan Celebration"
                className="w-full h-full object-cover object-center filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-black/30" />

              {/* Floating Celebration Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-dark-950 text-[11px] font-black uppercase tracking-wider shadow-md shadow-amber-500/30 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  Launch Celebration
                </span>
              </div>

              {/* Clean Date & Concierge Call Badge on Image Bottom */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-dark-900/85 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-500/20">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0" />
                  Owner personally calls to schedule!
                </span>

                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-dark-200 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                  <Clock className="w-3 h-3 text-brand-400" />
                  Sept 4 @ 11:11 AM MDT
                </span>
              </div>
            </div>

            {/* Content Body — Compact Layout */}
            <div className="p-4 sm:p-5 space-y-3.5 text-center">
              <div>
                <h2 id="celebration-title" className="text-xl sm:text-2xl font-display font-black text-white tracking-tight leading-snug">
                  {isFullLaunch ? (
                    'ZoomieVan is Officially Live! 🚀'
                  ) : (
                    <>
                      Going Live September 4th at{' '}
                      <span className="bg-gradient-to-r from-amber-400 to-brand-400 bg-clip-text text-transparent">
                        11:11 AM
                      </span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-dark-300 mt-1 max-w-md mx-auto">
                  {isFullLaunch
                    ? 'All van packages are open across Edmonton. Book your private workout today!'
                    : 'Exclusive Early Access is now active for Founding Members before the public launch!'}
                </p>
              </div>

              {/* ⏰ Countdown Timer */}
              {!isFullLaunch && (
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                  {[
                    { label: 'Days', val: countdown.days },
                    { label: 'Hours', val: countdown.hours },
                    { label: 'Mins', val: countdown.minutes },
                    { label: 'Secs', val: countdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="bg-dark-950/80 border border-dark-700/80 rounded-xl py-1.5 px-1 text-center shadow-inner relative overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 to-brand-400" />
                      <span className="font-display font-black text-lg sm:text-xl text-white tabular-nums block leading-tight">
                        {String(unit.val).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] uppercase font-bold text-dark-400 tracking-wider block">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 🎟️ Founding Member Early Access VIP Card */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-dark-850 to-dark-900 border border-amber-500/30 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-dark-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-dark-950" />
                      Founding VIP Access
                    </span>
                    <span className="text-[11px] font-bold text-amber-300">
                      {isCapped ? '50 / 50 Claimed' : `${remaining} of 50 Spots Left`}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">
                    3 Runs for $70 CAD (+1 Free)
                  </span>
                </div>

                {/* VIP Perks List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-dark-200">
                  <div className="flex items-center gap-2 bg-dark-900/60 p-2 rounded-xl border border-dark-700/50">
                    <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Owner Calls You:</strong> No calendar picking needed</span>
                  </div>
                  <div className="flex items-center gap-2 bg-dark-900/60 p-2 rounded-xl border border-dark-700/50">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Priority Routing:</strong> First pick of Edmonton routes</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-0.5">
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden border border-dark-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (claimed / 50) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-dark-400 mt-1 font-semibold">
                    <span>{claimed} Claimed</span>
                    <span>Max 50 Members (Auto-Capping)</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  onClick={handleClaim}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 group"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>{user ? 'Go to Early Access Dashboard' : 'Claim Founding Member Early Access'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-1 text-[11px] font-semibold text-dark-400 hover:text-white transition-colors"
                >
                  Close &amp; browse site preview
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
