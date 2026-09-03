import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, ArrowRight, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getTimeUntilLaunch, isFullLaunchActive, CountdownState, LAUNCH_TIME_LABEL_CANADIAN } from '../lib/launchConfig';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';

export default function LaunchCelebrationBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [fullLaunch, setFullLaunch] = useState<boolean>(() => isFullLaunchActive());
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);

  useEffect(() => {
    getFoundingMemberStats().then(setFoundingStats);

    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
      setFullLaunch(isFullLaunchActive());
    }, 1000);

    const handleLaunchModeChange = () => {
      setFullLaunch(isFullLaunchActive());
    };
    window.addEventListener('zoomievan_launch_mode_changed', handleLaunchModeChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('zoomievan_launch_mode_changed', handleLaunchModeChange);
    };
  }, []);

  const handleCta = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const remaining = foundingStats?.remainingCount ?? 47;
  const claimed = foundingStats?.claimedCount ?? 3;
  const isFoundingCapped = remaining <= 0;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 py-12 px-4 sm:px-6 lg:px-8 border-b border-dark-700/80">
      {/* Background celebration glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[350px] h-[200px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Celebration Header Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-brand-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Official Launch Celebration
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-800/90 border border-dark-600 text-dark-300 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            {LAUNCH_TIME_LABEL_CANADIAN}
          </span>
        </div>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {fullLaunch ? (
              <span className="bg-gradient-to-r from-brand-300 via-white to-emerald-300 bg-clip-text text-transparent">
                ZoomieVan is Officially Live!
              </span>
            ) : (
              <>
                Countdown to Launch &amp;{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-brand-400 bg-clip-text text-transparent">
                  Founding Member Early Access
                </span>
              </>
            )}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-dark-300 max-w-2xl mx-auto leading-relaxed">
            {fullLaunch ? (
              'All fitness packages and custom scheduling slots are now fully open across Edmonton. Book your dog’s private session today!'
            ) : (
              <>
                General public booking unlocks on <strong className="text-white">September 4th at 11:11 AM</strong>. 
                Right now, <strong className="text-amber-300">Founding Members enjoy exclusive Early Access</strong> to lock in priority slots with a free bonus workout!
              </>
            )}
          </p>
        </div>

        {/* ⏰ Live Countdown Timer Cards */}
        {!fullLaunch && (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-xl mx-auto mb-8">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Minutes', value: countdown.minutes },
              { label: 'Seconds', value: countdown.seconds },
            ].map((unit) => (
              <motion.div
                key={unit.label}
                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-dark-850/90 border border-dark-700/80 shadow-2xl backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-amber-400 to-brand-500 opacity-70" />
                <span className="font-display text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-dark-400 mt-1">
                  {unit.label}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* 🎟️ Founding Member Early Access Callout Card */}
        <div className="max-w-2xl mx-auto rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-amber-500/30 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-left space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {isFoundingCapped ? 'Founding Offer Completed' : 'Early Access Privilege'}
                </span>
                <span className="text-xs text-dark-400 font-medium">
                  {isFoundingCapped ? '50 / 50 Claimed' : `${remaining} of 50 Spots Left`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isFoundingCapped
                  ? 'Founding Member Roster Full (50 / 50)'
                  : 'Trial Run: 3 Sessions for $70 CAD (+1 Free)'}
              </h3>
              <p className="text-xs text-dark-300 leading-relaxed">
                {isFoundingCapped
                  ? 'All 50 early access slots have been claimed. Regular booking opens September 4th at 11:11 AM.'
                  : 'Only Founding Members can book and subscribe prior to 11:11 AM. Lock in your dog’s private van workouts today.'}
              </p>

              {/* Live progress indicator */}
              <div className="pt-2">
                <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (claimed / 50) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-dark-400 mt-1 font-semibold">
                  <span>{claimed} Claimed</span>
                  <span>50 Max Cap</span>
                </div>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={handleCta}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 group"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{user ? 'Go to Early Access' : 'Claim Early Access'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
