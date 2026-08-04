import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

const points = [
  {
    icon: Truck,
    title: 'We bring the gym',
    text: 'A fully equipped mobile fitness van arrives at your curb, so there is no drive, waiting room, or crowded facility.',
  },
  {
    icon: Activity,
    title: 'They set the pace',
    text: 'The non-motorized slat mill moves only when your dog moves, creating a dog-led running experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Supervised from start to finish',
    text: 'Every session is shaped around your dog\'s age, comfort, energy level, and fitness goals.',
  },
];

export default function HomeAboutPreview() {
  const [ref, inView] = useInView({ threshold: 0.16, triggerOnce: true });

  return (
    <section id="about-preview" className="relative overflow-hidden py-14 lg:py-20">
      <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#1557B7]/36 blur-3xl" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
              Mobile canine fitness
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              A better outlet for real dog energy, without adding another errand.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/78">
              ZoomieVan brings structured canine fitness to your home with climate-controlled vans,
              dog-powered slat mills, and one-on-one sessions built around safety, comfort, and routine.
            </p>
            <Link
              to="/about"
              className="keep-white mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Learn about ZoomieVan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="friendly-card overflow-hidden rounded-3xl bg-white p-3 sm:p-4 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative overflow-hidden rounded-2xl bg-dark-900">
                <img
                  src="/images/dog-machine1.png"
                  alt="A dog using a non-motorized slat mill inside ZoomieVan"
                  className="h-48 sm:h-56 w-full object-contain bg-[#071A3D] p-1.5 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-white border border-white/20">
                  Custom Slatmill
                </span>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-dark-900">
                <img
                  src="/images/dog-machine3.jpeg"
                  alt="Supervised canine workout session"
                  className="h-48 sm:h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-white border border-white/20">
                  Supervised Cardio
                </span>
              </div>
            </div>

            <div className="mt-3 grid gap-2 p-1 sm:grid-cols-3">
              {points.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-[#F7FBFF] p-3">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF7ED] text-brand-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-[#071A3D]">{title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#315B96]">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
