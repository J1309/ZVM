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
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-dark-950/85 backdrop-blur-md"
            onClick={dismiss}
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-500/30 bg-dark-900 shadow-2xl shadow-black/80 my-auto z-10"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Top Close Button */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition-colors z-20 backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Visual Hero Header with Real Image */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
              <img
                src="/images/hero-dog-van.jpg"
                alt="ZoomieVan Celebration"
                className="w-full h-full object-cover object-center filter brightness-90 transform scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-black/30" />

              {/* Floating Celebration Pill */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-dark-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  Official Launch Celebration
                </span>
              </div>

              {/* Founder VIP Concierge Floating Badge */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 bg-dark-900/80 backdrop-blur-md p-1.5 pr-3 rounded-full border border-white/15">
                  <img
                    src="/images/owner_img_new.png"
                    alt="Owner"
                    className="w-7 h-7 rounded-full object-cover border border-amber-400"
                  />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wide text-amber-300 flex items-center gap-1">
                      <PhoneCall className="w-2.5 h-2.5 text-amber-400" /> Personal Concierge Call
                    </p>
                    <p className="text-[11px] font-bold text-white">Owner calls you to schedule!</p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-dark-200 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <Clock className="w-3 h-3 text-brand-400" />
                  11:11 AM MDT (Canada)
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 space-y-5 text-center">
              <div>
                <h2 id="celebration-title" className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
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
                <p className="text-xs sm:text-sm text-dark-300 mt-1.5 max-w-lg mx-auto">
                  {isFullLaunch
                    ? 'All van packages are open across Edmonton. Book your private workout today!'
                    : 'The site officially opens to everyone on September 4th. Right now, Founding Members enjoy exclusive Early Access with VIP perks!'}
                </p>
              </div>

              {/* ⏰ Countdown Timer */}
              {!isFullLaunch && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
                  {[
                    { label: 'Days', val: countdown.days },
                    { label: 'Hours', val: countdown.hours },
                    { label: 'Mins', val: countdown.minutes },
                    { label: 'Secs', val: countdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="bg-dark-950/80 border border-dark-700/90 rounded-2xl py-2.5 px-1 text-center shadow-inner relative overflow-hidden"
                    >
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 to-brand-400" />
                      <span className="font-display font-black text-2xl sm:text-3xl text-white tabular-nums block leading-tight">
                        {String(unit.val).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-dark-400 tracking-wider block mt-0.5">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 🎟️ Founding Member Early Access VIP Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-dark-850 to-dark-900 border border-amber-500/40 text-left space-y-3 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-dark-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-dark-950" />
                      Founding Member VIP Access
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {isCapped ? '50 / 50 Claimed' : `${remaining} of 50 Spots Left`}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">
                    3 Runs for $70 CAD (+1 Free)
                  </span>
                </div>

                {/* VIP Perks List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-dark-200 pt-1">
                  <div className="flex items-center gap-2 bg-dark-900/60 p-2 rounded-xl border border-dark-700/60">
                    <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Personal Call:</strong> Owner calls you to arrange dates</span>
                  </div>
                  <div className="flex items-center gap-2 bg-dark-900/60 p-2 rounded-xl border border-dark-700/60">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Priority Route:</strong> First access to Edmonton slots</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-1">
                  <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden border border-dark-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (claimed / 50) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-dark-400 mt-1 font-semibold">
                    <span>{claimed} Claimed</span>
                    <span>Max 50 Members (Auto-Capping)</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleClaim}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{user ? 'Go to Early Access Dashboard' : 'Claim Founding Member Early Access'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-2 text-xs font-semibold text-dark-400 hover:text-white transition-colors"
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
