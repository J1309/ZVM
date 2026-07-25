import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Quote, Star } from 'lucide-react';
import { TestimonialSkeleton } from './Skeleton';

const featuredQuotes = [
  {
    quote: "The best part is not just that my dog runs. It is that he comes home relaxed, proud, and easier to live with.",
    author: 'Amanda Liu, veterinarian and client',
  },
  {
    quote: "ZoomieVan makes professional dog exercise feel simple. The van arrives, the handler knows the plan, and my evening gets calmer.",
    author: 'Sarah Chen, ZoomieVan member',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    location: 'Glenora, Edmonton',
    dog: 'Max, German Shepherd, 3 yr',
    avatar: 'https://images.pexels.com/photos/31734355/pexels-photo-31734355.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    text: "Max used to chew furniture from pent-up energy. After a few weekly sessions, he settles faster and sleeps through the night.",
  },
  {
    name: 'James Okafor',
    location: 'Oliver, Edmonton',
    dog: 'Bella, Pit Bull mix, 5 yr',
    avatar: 'https://images.pexels.com/photos/14234151/pexels-photo-14234151.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    text: "The handler was patient with Bella's nerves and never rushed her. It felt safe, professional, and very human.",
  },
  {
    name: 'Marie Tremblay',
    location: 'Clareview, Edmonton',
    dog: 'Hugo, Belgian Malinois, 2 yr',
    avatar: 'https://images.pexels.com/photos/34658892/pexels-photo-34658892.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    text: 'Hugo has serious working-dog energy. The slatmill sessions give him the focused outlet that walks never really did.',
  },
  {
    name: 'David Park',
    location: 'Mill Woods, Edmonton',
    dog: 'Luna, Husky, 4 yr',
    avatar: 'https://images.pexels.com/photos/19757897/pexels-photo-19757897.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    text: 'Condo life with a Husky is a lot. Having the gym come to us has made bad-weather days much easier.',
  },
  {
    name: 'Priya Sharma',
    location: 'Castle Downs, Edmonton',
    dog: 'Bruno, Rottweiler, 6 yr',
    avatar: 'https://images.pexels.com/photos/5749781/pexels-photo-5749781.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    text: "Our vet wanted Bruno moving more consistently. The weekly routine is helping, and the notes make it easy to track progress.",
  },
  {
    name: 'Alex Dubois',
    location: 'Jasper Place, Edmonton',
    dog: 'Koda, Lab mix, 1 yr',
    avatar: 'https://images.pexels.com/photos/5482854/pexels-photo-5482854.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    text: 'Koda is a young dog with endless energy. These sessions take the edge off in the best way.',
  },
];

function StarRating() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setIsLoading(false), 900);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#071A3D] py-16 lg:py-24">
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#1557B7]/45 blur-3xl" />
      <div className="absolute right-0 top-12 h-72 w-72 rounded-full bg-brand-500/18 blur-3xl" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
            <Star className="h-4 w-4 fill-brand-500" />
            Owner stories
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Dogs burn energy. Homes get calmer.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/78">
            The real win is what happens after the van leaves: easier evenings,
            better routines, and dogs who feel understood.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {featuredQuotes.map((item, index) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-3xl border border-white/20 bg-white p-7 shadow-xl shadow-black/10"
            >
              <Quote className="mb-4 h-9 w-9 text-brand-500/30" />
              <p className="font-display text-xl font-bold leading-snug text-[#071A3D]">"{item.quote}"</p>
              <p className="mt-4 text-sm font-bold text-brand-600">{item.author}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [...Array(6)].map((_, index) => <TestimonialSkeleton key={index} />)
            : testimonials.map((testimonial, index) => (
                <motion.article
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="friendly-card flex flex-col rounded-3xl border border-white/20 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-300"
                >
                  <StarRating />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[#071A3D]">"{testimonial.text}"</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[#D6E6FF] pt-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="h-12 w-12 rounded-2xl object-cover" />
                    <div>
                      <p className="text-sm font-bold text-[#071A3D]">{testimonial.name}</p>
                      <p className="text-xs text-[#315B96]">{testimonial.location}</p>
                      <p className="text-xs font-semibold text-brand-600">{testimonial.dog}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
        </div>
      </div>
    </section>
  );
}
