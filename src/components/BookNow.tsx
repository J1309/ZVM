import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, Heart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

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

const trustSignals = [
  { number: '1,200+', label: 'active members' },
  { number: '4.9/5', label: 'owner rating' },
  { number: '15K+', label: 'sessions run' },
];

export default function BookNow() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [selectedPlan, setSelectedPlan] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

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
            Plans & Pricing
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Pick the fitness routine that fits your dog.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/78">
            Start with a trial, choose a monthly package, or add a single run when your dog
            needs an extra outlet.
          </p>
        </motion.div>

        <div className="mt-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {plans.map((plan, index) => (
              <button
                key={plan.name}
                type="button"
                onClick={() => setSelectedPlan(index)}
                className={`friendly-card relative overflow-hidden rounded-3xl border bg-white p-6 text-left transition hover:-translate-y-1 ${
                  selectedPlan === index ? 'border-brand-400 ring-4 ring-brand-500/20' : 'border-white/20'
                }`}
              >
                {plan.popular && (
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
                    <span className="font-display text-3xl font-bold text-brand-600">${plan.price}</span>
                    <span className="ml-1 text-xs text-[#315B96]">/{plan.period}</span>
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
            ))}
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

          <div className="mt-7 flex flex-wrap justify-center gap-6">
            {trustSignals.map((signal) => (
              <div key={signal.label} className="text-center">
                <p className="font-display text-2xl font-bold text-white">{signal.number}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/65">{signal.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
