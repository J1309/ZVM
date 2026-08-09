import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, MapPin, ShieldCheck, Star, Heart, PawPrint } from 'lucide-react';

const trustItems = [
  { icon: ShieldCheck, label: 'Safe, supervised setup' },
  { icon: MapPin, label: 'Door-to-door service' },
  { icon: PawPrint, label: 'Dog-led pace' },
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={containerRef} className="hero-section relative overflow-hidden bg-[#071A3D] lg:flex lg:min-h-screen lg:items-center">
      <motion.div className="absolute inset-0 hidden lg:block" style={{ y }}>
        <img
          src="/images/dog_mchine_final1.png"
          alt="ZoomieVan slat mill fitness setup"
          className="h-full w-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,61,0.92)_0%,rgba(15,61,145,0.70)_48%,rgba(7,26,61,0.10)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,26,61,0.35)_0%,transparent_34%,rgba(7,26,61,0.42)_100%)]" />
      </motion.div>

      <div className="relative z-0 block bg-[#071A3D] pt-20 lg:hidden">
        <img
          src="/images/dog_mchine_final1.png"
          alt="ZoomieVan slat mill fitness setup"
          className="h-auto w-full object-contain"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#071A3D]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32"
        style={{ opacity }}
      >
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-[#0F3D91] shadow-lg"
          >
            <Heart className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
            Build for health. Born to zoom.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-display font-bold text-white"
          >
            <span className="block text-lg font-bold uppercase tracking-[0.18em] text-[#ffb24b] sm:text-xl lg:text-2xl">
              ZoomieVan Inc.
            </span>
            <span className="mt-2 block text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
              Mobile canine fitness,{' '}
              <span className="text-[#ffb24b]">delivered to your door.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg lg:text-xl"
          >
            ZoomieVan brings professional one-on-one canine fitness sessions to your driveway
            in fully equipped, climate-controlled mobile vans, built around your dog's pace,
            comfort, and goals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-9 lg:flex-wrap"
          >
            <a
              href="#book-now"
              className="keep-white group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-base font-bold shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Find a session
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/12 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <PawPrint className="h-5 w-5" />
              How it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-3 lg:mt-10 lg:gap-x-7"
          >
            {trustItems.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Icon className="h-4 w-4 text-[#ffb24b]" />
                {label}
              </div>
            ))}
          </motion.div>

        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        className="friendly-card absolute bottom-10 right-8 z-10 hidden w-72 rounded-2xl border border-white/70 bg-white/95 p-5 text-[#071A3D] shadow-2xl backdrop-blur lg:block"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1557B7]">The ZoomieVan way</p>
            <p className="mt-1 font-display text-xl font-bold">Built around their pace</p>
          </div>
          <div className="rounded-xl bg-[#EAF2FF] p-2.5 text-[#0F3D91]">
            <PawPrint className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFF7ED] p-3">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((value) => (
              <Star key={value} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
            ))}
          </div>
          <span className="text-sm font-semibold">Friendly, focused sessions</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#315B96]">
          A non-motorized slat mill moves only when your dog moves, creating a natural,
          dog-controlled run with every session closely supervised.
        </p>
      </motion.div>
    </section>
  );
}
