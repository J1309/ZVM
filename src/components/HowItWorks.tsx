import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Activity, CalendarCheck, ClipboardCheck, Home, MapPin, MessageSquareText, Truck } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    title: 'Check your area',
    description: 'Tell us where you are and we confirm whether a ZoomieVan route can reach your neighbourhood.',
    image: '/images/how-route-check.jpg',
  },
  {
    icon: ClipboardCheck,
    title: 'Share your dog profile',
    description: 'Add age, breed, weight, temperament, and vaccine details so the first session starts thoughtfully.',
    image: '/images/how-dog-profile.jpg',
  },
  {
    icon: Truck,
    title: 'We arrive at your curb',
    description: 'A handler brings the mobile dog gym to you, introduces the setup, and eases your dog in calmly.',
    image: '/images/how-van-arrival.jpg',
  },
  {
    icon: Activity,
    title: 'They control the pace',
    description: 'The non-motorized slat mill moves only when your dog moves, creating a natural supervised run.',
    image: '/images/how-slatmill-run.jpg',
  },
];

export default function HowItWorks() {
  const [ref, inView] = useInView({ threshold: 0.12, triggerOnce: true });

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#0F3D91] py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute left-1/2 top-24 hidden h-1 w-[76%] -translate-x-1/2 rounded-full bg-white/18 lg:block" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
            <CalendarCheck className="h-4 w-4" />
            Four simple steps
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            How a ZoomieVan session works.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/78">
            From booking to a safe, dog-led workout, the whole ZoomieVan service is designed
            to feel easy for owners, controlled for handlers, and positive for dogs.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description, image }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="friendly-card relative overflow-hidden rounded-3xl border border-white/20 bg-white"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071A3D]/72 to-transparent" />
                <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F3D91]">
                  Step {index + 1}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-bold text-[#071A3D]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#315B96]">{description}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-8 grid gap-4 rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl shadow-black/10 backdrop-blur md:grid-cols-3"
        >
          {[
            { icon: Home, label: 'Fitness that fits your schedule', text: 'No driving, no waiting, and no crowded facilities.' },
            { icon: MessageSquareText, label: 'Personalized goals', text: 'Sessions can support endurance, healthy weight, activity, or confidence.' },
            { icon: Activity, label: 'Why a slat mill?', text: 'Unlike motorized treadmills, the belt moves only when your dog chooses to move.' },
          ].map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex gap-3 rounded-2xl bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0F3D91]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#071A3D]">{label}</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#315B96]">{text}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
