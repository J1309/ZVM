import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, AlertCircle, ArrowRight, Mail, Loader2, Route, Sparkles, Calendar } from 'lucide-react';
import { getUpcomingActiveDatesForRegion, ServiceZone } from '../lib/rotation';

function getFsaRegion(fsa: string): ServiceZone {
  const code = (fsa.charCodeAt(0) + fsa.charCodeAt(fsa.length - 1)) % 4;
  return (['East', 'North', 'West', 'South'] as const)[code];
}

const ACTIVE_FSAS = [
  'M1B','M1C','M1E','M1G','M1H','M1J','M1K','M1L','M1M','M1N','M1P','M1R','M1S','M1T','M1V','M1W','M1X',
  'M2H','M2J','M2K','M2L','M2M','M2N','M2P','M2R','M3A','M3B','M3C','M3H','M3J','M3K','M3L','M3M','M3N',
  'M4A','M4B','M4C','M4E','M4G','M4H','M4J','M4K','M4L','M4M','M4N','M4P','M4R','M4S','M4T','M4V','M4W','M4X','M4Y',
  'M5A','M5B','M5C','M5E','M5G','M5H','M5J','M5K','M5L','M5M','M5N','M5P','M5R','M5S','M5T','M5V','M5W','M5X',
  'M6A','M6B','M6C','M6E','M6G','M6H','M6J','M6K','M6L','M6M','M6N','M6P','M6R','M6S',
  'M9A','M9B','M9C','M9L','M9M','M9N','M9P','M9R','M9V','M9W',
  'V5A','V5B','V5C','V5E','V5G','V5H','V5J','V5K','V5L','V5M','V5N','V5P','V5R','V5S','V5T','V5V','V5W','V5X','V5Y','V5Z',
  'V6A','V6B','V6C','V6E','V6G','V6H','V6J','V6K','V6L','V6M','V6N','V6P','V6R','V6S','V6T','V6V','V6W','V6X','V6Y','V6Z',
  'V7A','V7B','V7C','V7E','V7G','V7H','V7J','V7K','V7L','V7M','V7N','V7P','V7R','V7S','V7T','V7V','V7W','V7X','V7Y',
  'V3A','V3B','V3C','V3E','V3G','V3H','V3J','V3K','V3L','V3M','V3N','V3R','V3S','V3T','V3V','V3W','V3X','V3Y','V3Z',
  'H1A','H1B','H1C','H1E','H1G','H1H','H1J','H1K','H1L','H1M','H1N','H1P','H1R','H1S','H1T','H1V','H1W','H1X','H1Y','H1Z',
  'H2A','H2B','H2C','H2E','H2G','H2H','H2J','H2K','H2L','H2M','H2N','H2P','H2R','H2S','H2T','H2V','H2W','H2X','H2Y','H2Z',
  'H3A','H3B','H3C','H3E','H3G','H3H','H3J','H3K','H3L','H3M','H3N','H3P','H3R','H3S','H3T','H3V','H3W','H3X','H3Y','H3Z',
  'T2A','T2B','T2C','T2E','T2G','T2H','T2J','T2K','T2L','T2M','T2N','T2P','T2R','T2S','T2T','T2V','T2W','T2X','T2Y','T2Z',
  'T3A','T3B','T3C','T3E','T3G','T3H','T3J','T3K','T3L','T3M','T3N','T3P','T3R',
  'K1A','K1B','K1C','K1E','K1G','K1H','K1J','K1K','K1L','K1M','K1N','K1P','K1R','K1S','K1T','K1V','K1W','K1X','K1Y','K1Z',
  'K2A','K2B','K2C','K2E','K2G','K2H','K2J','K2K',
];

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
              Is ZoomieVan on your route?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
              Enter your Canadian postal code and we will check whether a mobile dog gym route already serves your neighbourhood.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Door-to-door visits', 'GTA and major metros', 'More routes opening soon'].map((item) => (
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
                  placeholder="M5V 2T6"
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
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F3D91]">
                      <Calendar className="h-3.5 w-3.5" />
                      Upcoming Service Rotation Dates
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
            Currently active in major Canadian metros
          </div>
          <div className="flex flex-wrap gap-3">
            {['Toronto GTA', 'Vancouver Metro', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Brampton', 'Hamilton', 'Surrey'].map((city) => (
            <span key={city} className="rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-[#071A3D]">
                {city}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
