import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Star, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getTimeUntilLaunch, isFullLaunchActive, CountdownState } from '../lib/launchConfig';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';

interface FloatingLaunchTimerProps {
  onOpenModal: () => void;
}

export default function FloatingLaunchTimer({ onOpenModal }: FloatingLaunchTimerProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [isFullLaunch, setIsFullLaunch] = useState(() => isFullLaunchActive());

  useEffect(() => {
    getFoundingMemberStats().then(setFoundingStats);

    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
      setIsFullLaunch(isFullLaunchActive());
    }, 1000);

    const handleLaunchChange = () => {
      setIsFullLaunch(isFullLaunchActive());
    };
    window.addEventListener('zoomievan_launch_mode_changed', handleLaunchChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('zoomievan_launch_mode_changed', handleLaunchChange);
    };
  }, []);

  const remaining = foundingStats?.remainingCount ?? 47;

  if (isFullLaunch) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[800] flex flex-col items-end">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative group"
      >
        {/* Glow backdrop */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-brand-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />

        {/* Card */}
        <div
          onClick={onOpenModal}
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-dark-900/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-md cursor-pointer select-none hover:border-amber-400 transition-all"
        >
          {/* Animated Icon Pill */}
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-brand-600 text-white shadow-md shrink-0">
            <Rocket className="w-4 h-4 text-white animate-pulse" />
          </div>

          {!minimized ? (
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Launch Countdown
                  </span>
                  <span className="text-[10px] text-dark-400 font-medium">· Sept 4 @ 11:11 AM</span>
                </div>

                {/* Digital Clock */}
                <div className="flex items-baseline gap-1 text-sm font-black font-display text-white tabular-nums tracking-wide">
                  <span>{String(countdown.days).padStart(2, '0')}d</span>
                  <span className="text-amber-400">:</span>
                  <span>{String(countdown.hours).padStart(2, '0')}h</span>
                  <span className="text-amber-400">:</span>
                  <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                  <span className="text-amber-400">:</span>
                  <span>{String(countdown.seconds).padStart(2, '0')}s</span>
                </div>
              </div>

              {/* Founding Member Badge */}
              <div className="hidden sm:flex flex-col items-end border-l border-dark-700 pl-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
                  <Star className="w-2.5 h-2.5 fill-amber-400" /> Early Access
                </span>
                <span className="text-[10px] font-bold text-dark-300 mt-0.5">
                  {remaining} Spots Left
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m
              </span>
            </div>
          )}

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors ml-1"
            aria-label={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
