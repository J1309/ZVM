import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';

const plans = [
  {
    name: 'Trial Run',
    price: 70,
    period: '2 sessions',
    description: 'Two 30-minute sessions to help your dog become comfortable with the slat mill.',
    features: ['2 runs, 30 minutes each', 'Space sessions about one week apart', 'Safe, positive introduction', 'Move to a package when ready'],
    accent: 'bg-[#EAF2FF]',
    popular: false,
  },
  {
    name: 'Single Run',
    price: 35,
    period: '1 session',
    description: 'One 30-minute session for an extra workout, occasional exercise, or routine maintenance.',
    features: ['1 run, 30 minutes', 'Add between packages', 'Occasional exercise option', 'Keep your dog\'s routine going'],
    accent: 'bg-[#F7FBFF]',
    popular: false,
  },
  {
    name: 'Package 1',
    price: 110,
    period: '3 runs',
    description: 'Three 30-minute runs to maintain your dog\'s fitness and overall health.',
    features: ['3 runs, 30 minutes each', 'Use anytime within one month', 'Great for routine maintenance', 'Flexible scheduling'],
    accent: 'bg-[#FFF7ED]',
    popular: false,
  },
  {
    name: 'Package 2',
    price: 200,
    period: '6 runs',
    description: 'Six 30-minute runs for regular cardio, conditioning, weight management, and endurance.',
    features: ['6 runs, 30 minutes each', 'Use anytime within one month', 'Ideal for regular conditioning', 'Best package value'],
    accent: 'bg-[#D6E6FF]',
    popular: true,
  },
];

export default function BookNow() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [stats, setStats] = useState<FoundingMemberStats | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getFoundingMemberStats().then(setStats);
  }, []);

  return (
    <section id="book-now" className="relative overflow-hidden py-16 lg:py-24" ref={ref}>
      <div className="absolute bottom-10 left-0 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
            <Heart className="h-4 w-4" />
            Plans &amp; Pricing
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Pick the ZoomieVan routine that fits your dog.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/78">
            Start with a ZoomieVan trial, choose a monthly package, or add a single run when
            your dog needs an extra outlet.
          </p>
        </motion.div>

        {/* Founding Member Claim Counter Banner */}
        {stats && stats.isOfferActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 mx-auto max-w-4xl p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-brand-500/25 to-amber-500/20 border border-amber-400/50 text-white shadow-xl shadow-amber-500/10 backdrop-blur-md"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shrink-0 shadow-lg">
                  <Star className="w-5 h-5 fill-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-amber-400 text-black px-2 py-0.5 rounded-md">
                      LIMITED OFFER
                    </span>
                    <span className="text-xs font-bold text-amber-300">Founding Member Special</span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-white mt-0.5">
                    Get 50% OFF Your First Trial Run ($35 for 2 sessions!)
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-2xl border border-amber-400/30 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  🔥 <strong className="text-white font-black">{stats.remainingCount} / {stats.maxCount}</strong> Spots Claimable
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {plans.map((plan, index) => {
              const isTrial = plan.name === 'Trial Run';
              const isFoundingActive = isTrial && stats?.isOfferActive;

              return (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => setSelectedPlan(index)}
                  className={`friendly-card relative overflow-hidden rounded-3xl border bg-white p-6 text-left transition hover:-translate-y-1 ${
                    selectedPlan === index ? 'border-brand-400 ring-4 ring-brand-500/20' : 'border-white/20'
                  }`}
                >
                  {isFoundingActive && (
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-white shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> 50% OFF Founding Member
                    </div>
                  )}

                  {plan.popular && !isFoundingActive && (
                    <div className="absolute right-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                      Best value
                    </div>
                  )}

                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${plan.accent} text-[#0F3D91]`}>
                    <CalendarDays className="h-6 w-6" />
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold text-[#071A3D]">{plan.name}</h3>
                    <div className="text-right">
                      {isFoundingActive ? (
                        <div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs text-dark-400 line-through font-bold">${stats.originalPrice}</span>
                            <span className="font-display text-3xl font-bold text-emerald-600">${stats.trialPrice}</span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">50% OFF · Founding Member</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-display text-3xl font-bold text-brand-600">${plan.price}</span>
                          <span className="ml-1 text-xs text-[#315B96]">/{plan.period}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#315B96]">{plan.description}</p>
                  <ul className="mt-5 grid gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs font-semibold text-[#071A3D]">
                        <Check className="h-4 w-4 shrink-0 text-brand-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-brand-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/25 transition hover:-translate-y-0.5 hover:bg-brand-600"
          >
            <ShieldCheck className="h-4 w-4" />
            {user ? 'Book a session' : 'Create account to book'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="mt-3 text-sm text-white/75">
            Build for health. Born to zoom.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
