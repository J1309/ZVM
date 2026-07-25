import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { DAILY_SESSIONS } from '../lib/operatingHours';

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
  {
    name: 'Single Run',
    price: 35,
    period: '1 session',
    description: 'One 30-minute session for an extra workout, occasional exercise, or routine maintenance.',
    features: ['1 run, 30 minutes', 'Add between packages', 'Occasional exercise option', 'Keep your dog\'s routine going'],
    accent: 'bg-[#F7FBFF]',
    popular: false,
  },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dates = [12, 13, 14, 15, 16, 17, 18];

const timeSlots = DAILY_SESSIONS.map((session, index) => ({
  time: session.displayTime,
  label: session.label,
  available: index !== 1 && index !== 5,
  van: ['Thunder', 'Storm', 'Bolt'][index % 3],
}));

const trustSignals = [
  { number: '1,200+', label: 'active members' },
  { number: '4.9/5', label: 'owner rating' },
  { number: '15K+', label: 'sessions run' },
];

export default function BookNow() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [selectedDay, setSelectedDay] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(2);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setIsLoading(false), 900);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  useEffect(() => {
    setIsLoading(true);
    setSelectedSlot(null);
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, [selectedDay]);

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
            Plans and booking preview
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Pick the fitness routine that fits your dog.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/78">
            Start with a trial, choose a monthly package, or add a single run when your dog
            needs an extra outlet.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-1"
          >
            {plans.map((plan, index) => (
              <button
                key={plan.name}
                type="button"
                onClick={() => setSelectedPlan(index)}
                className={`friendly-card relative overflow-hidden rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-1 ${
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
                <div className="flex items-end gap-3">
                  <h3 className="font-display text-xl font-bold text-[#071A3D]">{plan.name}</h3>
                  <div className="mb-0.5 text-sm text-[#315B96]">
                    <span className="font-display text-3xl font-bold text-brand-600">${plan.price}</span> {plan.period}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#315B96]">{plan.description}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
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

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="friendly-card overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl shadow-black/10"
          >
            <div className="border-b border-[#D6E6FF] bg-[#EAF2FF] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#071A3D]">Preview a pickup window</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-[#315B96]">
                    <MapPin className="h-4 w-4 text-brand-500" /> Example route: T5H, Edmonton Downtown
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-xl border border-[#D6E6FF] bg-white p-2 text-[#315B96] transition hover:text-brand-600" aria-label="Previous week">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="rounded-xl border border-[#D6E6FF] bg-white p-2 text-[#315B96] transition hover:text-brand-600" aria-label="Next week">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 border-b border-[#D6E6FF] p-3">
              {days.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(index)}
                  className={`flex flex-col items-center rounded-xl py-2 transition ${
                    selectedDay === index
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'text-[#315B96] hover:bg-[#EAF2FF]'
                  }`}
                >
                  <span className="text-[10px] font-bold">{day}</span>
                  <span className="mt-0.5 text-sm font-black">{dates[index]}</span>
                </button>
              ))}
            </div>

            <div className="max-h-[300px] space-y-2 overflow-y-auto p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                timeSlots.map((slot, index) => (
                  <motion.button
                    key={`${slot.time}-${slot.van}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(index)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedSlot === index
                        ? 'border-brand-400 bg-brand-50 text-[#071A3D]'
                        : slot.available
                          ? 'border-[#D6E6FF] bg-white text-[#071A3D] hover:border-brand-300'
                          : 'cursor-not-allowed border-[#D6E6FF] bg-[#EAF2FF] text-[#7E9ED2]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-500" />
                        <span className="text-sm font-bold">{slot.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#315B96]">{slot.van} route</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          slot.available ? 'bg-[#EAF2FF] text-[#0F3D91]' : 'bg-[#D6E6FF] text-[#315B96]'
                        }`}>
                          {slot.available ? (selectedSlot === index ? 'Selected' : 'Open') : 'Booked'}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <button
            onClick={() => navigate('/signup')}
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-brand-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/25 transition hover:-translate-y-0.5 hover:bg-brand-600"
          >
            <ShieldCheck className="h-4 w-4" />
            Create account to book
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
