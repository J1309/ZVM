import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity, ArrowRight, CheckCircle2, ShieldCheck,
  Truck, Sparkles, PawPrint, Quote, UserRound, Gauge, Home,
} from 'lucide-react';

const principles = [
  'Dog-led movement, never forced running',
  'One-on-one supervised sessions',
  'Climate-controlled comfort year-round',
  'Workouts adapted to age, breed, energy, and goals',
];

const trustStats = [
  { icon: Home, value: 'At your door', label: 'Fully mobile service' },
  { icon: Gauge, value: '30 min', label: 'Focused 1-on-1 sessions' },
  { icon: ShieldCheck, value: 'Supervised', label: 'Every single run' },
];



const founderLetter = [
  'My love for dogs has always been more than a passion, it is a way of life. As a lifelong dog owner, I have experienced firsthand the joy, energy, and unconditional love our four-legged companions bring into our lives. That love inspired me to create something unique for pet parents who want the very best for their dogs.',
  'ZoomieVan was born from a simple idea: make professional canine fitness convenient, accessible, and enjoyable. Instead of asking busy families to travel, we bring the experience directly to them with our fully mobile dog fitness service.',
  'Our focus is on safe, structured, one-on-one exercise using non-motorized slatmills in a climate-controlled environment. Every session is designed around your dog’s individual needs, helping build confidence, improve fitness, and support their overall health, whether they are an energetic working breed, an athletic companion, or simply a dog who needs a healthy outlet for their energy.',
  'Before launching ZoomieVan, I spent years building a career in customer service, healthcare, and business. Those experiences taught me the importance of trust, professionalism, and treating every client with genuine care. Today, I bring those same values to every dog and every family we serve.',
  'At ZoomieVan, we believe that every dog deserves the opportunity to move, thrive, and enjoy a healthier, happier life.',
  'Thank you for trusting us with a member of your family. We cannot wait to welcome you and your pup to the ZoomieVan community.',
];

/** Founder portrait. */
function FounderPortrait() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[#D6E6FF] bg-[#EAF2FF] shadow-2xl group">
      {!failed ? (
        <img
          src="/images/owner_img_new.png"
          alt="Megha George, founder of ZoomieVan"
          width={800}
          height={1000}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EAF2FF] via-[#F7FBFF] to-[#FFF7ED] p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#0F3D91] shadow-sm">
            <UserRound className="h-8 w-8" />
          </div>
          <p className="font-display text-base font-bold text-[#071A3D]">Megha George</p>
          <p className="text-xs text-[#315B96]">Founder, ZoomieVan Inc.</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071A3D]/60 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-xl bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white border border-white/20">
        Megha George &mdash; Founder
      </span>
    </div>
  );
}

export default function AboutPage() {
  const reduce = useReducedMotion();

  // Shared scroll-reveal preset — disabled when the visitor prefers reduced motion.
  const reveal = (delay = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.55, delay },
  });

  return (
    <main className="public-site min-h-screen overflow-hidden bg-[#071A3D] pt-28">
      {/* Hero */}
      <section className="relative px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
        <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-brand-500/22 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/42 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
              <Sparkles className="h-4 w-4 text-brand-500" />
              About ZoomieVan
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Mobile canine fitness, built around your dog.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
              ZoomieVan Inc. brings professional canine fitness directly to your home with
              fully equipped mobile fitness vans. Our mission is to help dogs live healthier,
              happier, and more active lives through convenient, supervised exercise.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/#book-now"
                className="keep-white inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A3D]"
              >
                Find a session
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/coverage"
                className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white transition duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A3D]"
              >
                Check coverage
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {trustStats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm"
                >
                  <Icon className="mb-2 h-5 w-5 text-[#ffcf8a]" />
                  <p className="font-display text-base font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Slatmill gallery */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="friendly-card overflow-hidden rounded-3xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { src: '/images/dog_mchine_final1.png', alt: 'Dog running on a ZoomieVan non-motorized slatmill', icon: PawPrint, caption: 'Professional slatmill setup' },
                { src: '/images/dog-machine3.jpeg', alt: 'Handler supervising a mobile canine cardio session', icon: ShieldCheck, caption: 'Safe & supervised running' },
              ].map(({ src, alt, icon: Icon, caption }) => (
                <div key={src} className="group relative overflow-hidden rounded-2xl bg-dark-900">
                  <img
                    src={src}
                    alt={alt}
                    width={640}
                    height={576}
                    loading="lazy"
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 p-2.5 text-xs font-bold text-white backdrop-blur-md">
                    <Icon className="h-4 w-4 shrink-0 text-[#ffcf8a]" />
                    {caption}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {principles.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl bg-[#F7FBFF] p-2.5 text-xs font-bold text-[#071A3D] sm:text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="relative bg-white px-4 py-14 text-[#071A3D] sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {/* Prominent Section Header */}
          <motion.div {...reveal()} className="mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-[#FFF7ED] border border-brand-200 px-5 py-2 text-base sm:text-lg font-black text-brand-700 shadow-sm">
              <PawPrint className="h-5 w-5 text-brand-500" />
              Meet the Founder
            </span>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            {/* Left Column: Portrait */}
            <motion.div {...reveal(0.05)} className="lg:sticky lg:top-28 lg:self-start">
              <FounderPortrait />

              <div className="mt-5 rounded-2xl border border-[#D6E6FF] bg-[#F7FBFF] p-5">
                <p className="font-display text-lg font-bold text-[#071A3D]">Megha George</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-600">Founder, ZoomieVan Inc.</p>
                <p className="mt-3 text-sm leading-relaxed text-[#315B96]">
                  Lifelong dog owner with a background in customer service, healthcare, and business.
                </p>
              </div>
            </motion.div>

            {/* Right Column: Greeting Heading & Letter */}
            <motion.div {...reveal(0.1)}>
              <h2 className="font-display text-3xl font-extrabold leading-tight text-[#071A3D] sm:text-4xl lg:text-5xl mb-6">
                Hi, I&rsquo;m Megha George, the founder of Zoomie Van.
              </h2>

              <div className="space-y-5 text-base leading-relaxed text-[#315B96] sm:text-[17px] sm:leading-8">
                {founderLetter.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>

              {/* Pull quote / signature */}
              <div className="mt-9 rounded-3xl border border-[#D6E6FF] bg-gradient-to-br from-[#FFF7ED] to-[#F7FBFF] p-6 sm:p-8">
                <Quote className="h-7 w-7 text-brand-500" aria-hidden="true" />
                <p className="mt-3 font-display text-2xl font-bold leading-snug text-[#071A3D] sm:text-3xl">
                  Build for Health. Born to Zoom.
                </p>
                <p className="mt-4 text-sm font-semibold text-[#315B96]">
                  &mdash; Megha George, Founder
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Mission + CTA */}
      <section className="relative px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <motion.div {...reveal()} className="keep-white rounded-3xl bg-[#071A3D] p-7 text-white sm:p-9">
            <div className="mb-5 inline-flex rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
              <Truck className="h-7 w-7" />
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Fitness that fits your schedule.
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-white/76">
              No driving. No waiting. No crowded facilities. ZoomieVan comes directly to your
              home, making it easier to give your dog a structured outlet while keeping your day intact.
            </p>
          </motion.div>

          <motion.div {...reveal(0.08)} className="friendly-card rounded-3xl bg-white p-6 text-[#071A3D]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7ED] text-brand-600">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl font-bold">Built for health. Born to zoom.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#315B96]">
              By combining expert care, premium equipment, and personalized exercise programs,
              ZoomieVan makes canine fitness more accessible for dogs and easier for owners.
            </p>
            <Link
              to="/#how-it-works"
              className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-black text-brand-600 transition-colors duration-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              See how it works
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
