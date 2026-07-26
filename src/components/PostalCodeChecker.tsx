import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, AlertCircle, ArrowRight, Mail, Loader2, Route, Sparkles, Calendar, Truck } from 'lucide-react';
import { getUpcomingActiveDatesForRegion, ServiceZone } from '../lib/rotation';
import { estimateLocalDriveTime } from '../lib/geo';

/** Edmonton T5 & T6 zone mapping per rotation sector. */
const EDMONTON_ZONE_MAP: Record<string, ServiceZone> = {
  // East — Clareview, Beverly, Highlands, Belvedere, Lake District
  T5A: 'East', T5B: 'East', T5C: 'East', T5E: 'East', T5Y: 'East',
  // North — Spruce Avenue, Inglewood, Calder, Castle Downs, Pilot Sound
  T5K: 'North', T5L: 'North', T5M: 'North', T5V: 'North', T5Z: 'North',
  // West — Glenora, Woodcroft, Jasper Place, Winterburn, Lewis Estates
  T5N: 'West', T5P: 'West', T5R: 'West', T5S: 'West', T5T: 'West',
  // South — Parkdale, Downtown, Oliver, Bonnie Doon/Ottewell, Mill Woods, Windermere, Terwillegar, Ellerslie
  T5G: 'South', T5H: 'South', T5J: 'South', T5W: 'South', T5X: 'South',
  T6W: 'South', T6H: 'South', T6X: 'South', T6E: 'South', T6L: 'South', T6K: 'South',
};

const ACTIVE_FSAS = Object.keys(EDMONTON_ZONE_MAP);

function getFsaRegion(fsa: string): ServiceZone {
  return EDMONTON_ZONE_MAP[fsa] ?? 'East';
}

type Status = 'idle' | 'loading' | 'serviceable' | 'unserviceable';

export default function PostalCodeChecker() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const navigate = useNavigate();

  const fsa = postalCode.toUpperCase().replace(/\s/g, '').slice(0, 3);

  const handleCheck = () => {
    if (postalCode.length < 3) return;

    setStatus('loading');
    setTimeout(() => {
      setStatus(ACTIVE_FSAS.includes(fsa) ? 'serviceable' : 'unserviceable');
    }, 900);
  };

  const handleWaitlist = () => {
    if (!email) return;
    setWaitlistSubmitted(true);
  };

  return (
    <section id="coverage" className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-24">
      <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

      <div ref={ref} className="relative mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
              <Route className="h-4 w-4" />
              Coverage check
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Is ZoomieVan in your neighbourhood?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
              Enter your Edmonton postal code and we will check whether our mobile dog gym serves your area.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Door-to-door visits', 'Edmonton neighbourhoods', '8-day service rotation'].map((item) => (
                <span key={item} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="friendly-card rounded-3xl border border-white/20 bg-white p-5 shadow-xl shadow-black/10 sm:p-7"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />
                <input
                  type="text"
                  placeholder="T5J 3S9"
                  value={postalCode}
                  onChange={(event) => {
                    setPostalCode(event.target.value.toUpperCase());
                    if (status !== 'idle') setStatus('idle');
                    setWaitlistSubmitted(false);
                  }}
                  onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
                  className="h-14 w-full rounded-2xl border border-[#D6E6FF] bg-[#EAF2FF] pl-12 pr-4 text-lg font-bold text-[#071A3D] placeholder:text-[#7E9ED2] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  maxLength={7}
                />
              </div>
              <button
                onClick={handleCheck}
                disabled={postalCode.length < 3 || status === 'loading'}
                className="keep-white inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 font-bold shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Check <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {status === 'serviceable' && (
                <motion.div
                  key="serviceable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 rounded-2xl border border-[#D6E6FF] bg-[#EAF2FF] p-5"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-[#0F3D91]" />
                    <div>
                      <p className="font-display text-xl font-bold text-[#14532d]">Good news, we are in your area.</p>
                      <p className="mt-1 text-sm text-[#276749]">
                        Zone <span className="font-bold">{fsa}</span> is in our <span className="font-bold text-[#0F3D91]">{getFsaRegion(fsa)} Region</span> (8-Day Rotation).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/60 bg-white/70 p-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0F3D91]">
                      <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Upcoming Service Rotation Dates</span>
                      <span className="flex items-center gap-1 text-[#059669] font-semibold text-[11px]"><Truck className="h-3 w-3" /> {estimateLocalDriveTime(53.54 + ((fsa.charCodeAt(2) || 65) % 10) * 0.015, -113.49 - ((fsa.charCodeAt(1) || 53) % 10) * 0.015).formattedDuration} from Fleet Hub</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getUpcomingActiveDatesForRegion(getFsaRegion(fsa), 4, new Date('2026-07-25')).map((d) => (
                        <span key={d} className="rounded-lg bg-[#0F3D91]/10 px-2.5 py-1 text-xs font-semibold text-[#0F3D91]">
                          {new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' })}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/signup')}
                    className="keep-white mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] py-3 font-bold transition hover:bg-[#15803d]"
                  >
                    Book your first run
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {status === 'unserviceable' && (
                <motion.div
                  key="unserviceable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 rounded-2xl border border-brand-300 bg-[#FFF7ED] p-5"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-6 w-6 text-[#b45309]" />
                    <div>
                      <p className="font-display text-xl font-bold text-[#78350f]">Not there yet, but we are growing.</p>
                      <p className="mt-1 text-sm text-[#8a5a28]">Zone <span className="font-bold">{fsa}</span> is not covered yet. Join the waitlist and we will let you know when routes open.</p>
                    </div>
                  </div>
                  {!waitlistSubmitted ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#315B96]" />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-12 w-full rounded-xl border border-[#D6E6FF] bg-white pl-10 pr-4 text-sm text-[#071A3D] placeholder:text-[#7E9ED2] focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <button onClick={handleWaitlist} className="keep-white rounded-xl bg-[#f59e0b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d97706]">
                        Join waitlist
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#16743c]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-bold">You are on the list. We will notify you when coverage expands.</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur"
        >
          <div className="mb-5 flex items-center gap-2 text-sm font-bold text-brand-600">
            <Sparkles className="h-4 w-4" />
            Now serving Edmonton, Alberta
          </div>
          <div className="flex flex-wrap gap-3">
            {['Downtown', 'Oliver', 'Clareview', 'Castle Downs', 'Mill Woods', 'Jasper Place', 'Bonnie Doon', 'Beverly', 'Glenora', 'Lewis Estates'].map((area) => (
            <span key={area} className="rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-[#071A3D]">
                {area}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
