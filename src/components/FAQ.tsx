import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { HelpCircle, Minus, Plus, Search, Sparkles, MessageCircle } from 'lucide-react';

interface FAQData {
  category: 'General' | 'Equipment & Safety' | 'Fitness & Eligibility' | 'Pricing & Booking' | 'Preparation';
  question: string;
  answer: string | React.ReactNode;
}

const faqs: FAQData[] = [
  {
    category: 'General',
    question: 'What is Zoomie Van?',
    answer: 'Zoomie Van is a mobile canine fitness service that brings a climate-controlled fitness van directly to your home. We use professional, non-motorized slatmills to provide safe, supervised cardio sessions designed to improve your dog’s overall fitness and well-being.',
  },
  {
    category: 'Equipment & Safety',
    question: 'What is a slatmill?',
    answer: 'A slatmill is a dog-powered, non-motorized treadmill. Your dog controls the speed at all times by walking or running naturally. Unlike electric treadmills, the belt only moves when your dog moves, allowing them to exercise at their own comfortable pace.',
  },
  {
    category: 'Equipment & Safety',
    question: 'Is the slatmill safe?',
    answer: 'Yes! Safety is our highest priority. Every session is supervised by trained staff, and we introduce dogs gradually so they become comfortable before beginning a workout.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'Does my dog need experience?',
    answer: 'Not at all. Most dogs are new to the slatmill. That’s why we recommend our Trial Run, where your dog can learn, build confidence, and become familiar with the equipment.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'Which dogs can use the slatmill?',
    answer: 'Healthy dogs of most breeds and sizes can participate. If your dog has a medical condition, recent surgery, or mobility concerns, please consult your veterinarian before booking.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'Is this suitable for puppies?',
    answer: 'We generally recommend waiting until your puppy is physically mature enough for structured exercise. Contact us if you’re unsure whether your puppy is ready.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'Can senior dogs participate?',
    answer: 'Yes! Many senior dogs benefit from controlled, low-impact exercise. Sessions are customized based on your dog’s age, fitness level, and comfort.',
  },
  {
    category: 'General',
    question: 'Does this replace daily walks?',
    answer: 'No. Think of it as a gym workout for your dog. Regular walks provide important mental enrichment and sniffing opportunities, while slatmill sessions help improve cardiovascular fitness, strength, and endurance.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'How long is each session?',
    answer: 'Each session lasts approximately 30 minutes, including warm-up, exercise, cool-down, and water breaks.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'How often should my dog attend?',
    answer: 'Every dog is different, but most dogs benefit from 1–2 sessions per week, depending on their activity level, age, and fitness goals.',
  },
  {
    category: 'Pricing & Booking',
    question: 'What are your packages?',
    answer: (
      <div className="space-y-3">
        <p>We offer the following tailored fitness packages:</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="rounded-xl border border-[#D6E6FF] bg-[#F7FBFF] p-3">
            <span className="font-bold text-[#071A3D]">Trial Run — $70</span>
            <p className="mt-0.5 text-xs text-[#315B96]">Two 30-minute sessions (recommended 1 week apart to build comfort).</p>
          </li>
          <li className="rounded-xl border border-[#D6E6FF] bg-[#F7FBFF] p-3">
            <span className="font-bold text-[#071A3D]">Package 1 — $110</span>
            <p className="mt-0.5 text-xs text-[#315B96]">Three runs (valid for 1 month).</p>
          </li>
          <li className="rounded-xl border border-[#D6E6FF] bg-[#F7FBFF] p-3">
            <span className="font-bold text-[#071A3D]">Package 2 — $200</span>
            <p className="mt-0.5 text-xs text-[#315B96]">Six runs (valid for 1 month, best value).</p>
          </li>
          <li className="rounded-xl border border-[#D6E6FF] bg-[#F7FBFF] p-3">
            <span className="font-bold text-[#071A3D]">Extra Run — $35</span>
            <p className="mt-0.5 text-xs text-[#315B96]">Single additional session between packages.</p>
          </li>
        </ul>
      </div>
    ),
  },
  {
    category: 'Preparation',
    question: 'Do I need to be home?',
    answer: 'Yes. We ask owners to be present for the first visit. After your dog is comfortable and you have completed the necessary paperwork, we’ll discuss future appointment options.',
  },
  {
    category: 'Preparation',
    question: 'What should I do before the appointment?',
    answer: (
      <div className="space-y-2">
        <p>Please take the following steps prior to our arrival:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Allow your dog a bathroom break.</li>
          <li>Avoid feeding a large meal within 1–2 hours before the session.</li>
          <li>Ensure your dog has access to water.</li>
          <li>Have your dog wearing a properly fitted collar or harness.</li>
        </ul>
      </div>
    ),
  },
  {
    category: 'Preparation',
    question: 'Are vaccinations required?',
    answer: 'Yes. All participating dogs must be current on their required vaccinations to ensure the safety of every dog we serve.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'What if my dog is nervous?',
    answer: 'That’s perfectly normal! We use positive reinforcement, patience, and gradual introductions. We never force a dog to run. Building confidence is our first priority.',
  },
  {
    category: 'Fitness & Eligibility',
    question: 'Can reactive or anxious dogs participate?',
    answer: 'In many cases, yes. Since the sessions take place in our private mobile fitness van, they can be an excellent option for dogs that are uncomfortable in busy public environments. Please let us know about any behavioural concerns before booking.',
  },
  {
    category: 'Equipment & Safety',
    question: 'What happens if the weather is bad?',
    answer: 'No worries! Our vans are fully climate-controlled, allowing us to operate year-round in rain, snow, or hot weather. Severe weather that affects safe driving may require rescheduling.',
  },
  {
    category: 'Pricing & Booking',
    question: 'Do you travel to my location?',
    answer: 'Yes! Zoomie Van comes directly to your home, making it easy and convenient for both you and your dog.',
  },
  {
    category: 'Pricing & Booking',
    question: 'How do I book?',
    answer: 'Booking is easy! Simply contact us through the Booking page on ZoomieVan.ca, Email, Phone, or via Facebook / Instagram.',
  },
  {
    category: 'Pricing & Booking',
    question: 'What forms of payment do you accept?',
    answer: 'We accept major credit/debit payment methods. Payment details will be provided when your booking is confirmed.',
  },
  {
    category: 'General',
    question: 'What makes Zoomie Van different?',
    answer: (
      <div className="space-y-2">
        <p>Why dog owners love Zoomie Van:</p>
        <ul className="grid gap-2 sm:grid-cols-2 text-xs font-semibold">
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">🚐 We come directly to you</li>
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">❄️ Climate-controlled mobile gym</li>
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">🐾 Professional non-motorized slatmills</li>
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">👨‍🏫 One-on-one supervised sessions</li>
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">💪 Personalized fitness plans</li>
          <li className="flex items-center gap-2 rounded-lg bg-[#EAF2FF] p-2 text-[#0F3D91]">❤️ Safe, positive & stress-free</li>
        </ul>
      </div>
    ),
  },
];

const categories = ['All', 'General', 'Equipment & Safety', 'Fitness & Eligibility', 'Pricing & Booking', 'Preparation'] as const;

function FAQItem({ faq, index }: { faq: FAQData; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className="border-b border-[#D6E6FF] last:border-b-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between gap-6 py-5 text-left transition"
      >
        <span className="text-base font-bold text-[#071A3D] transition group-hover:text-brand-600 sm:text-lg">
          {faq.question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
            isOpen ? 'border-brand-500 bg-brand-500 text-white' : 'border-[#D6E6FF] bg-[#EAF2FF] text-[#315B96]'
          }`}
        >
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pr-6 text-sm leading-relaxed text-[#315B96] sm:text-base">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-24">
      <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0F3D91] shadow-sm">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Everything you need to know.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/78">
            Have questions about Zoomie Van, slatmills, safety, or packages? Here are answers directly from our team.
          </p>
        </motion.div>

        {/* Search Bar & Category Filter Pills */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#315B96]" />
            <input
              type="text"
              placeholder="Search questions (e.g. slatmill, weather, packages)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-13 w-full rounded-2xl border border-[#D6E6FF] bg-white pl-12 pr-4 text-sm font-bold text-[#071A3D] placeholder:text-[#7E9ED2] shadow-lg shadow-black/5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white/80 text-[#17345f] border border-white/40 hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="friendly-card mt-8 rounded-3xl border border-white/20 bg-white p-5 shadow-xl shadow-black/10 sm:p-8"
        >
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))
          ) : (
            <div className="py-12 text-center text-[#315B96]">
              <p className="font-bold text-lg">No questions match your search.</p>
              <p className="text-sm mt-1">Try clearing your search term or selecting a different category.</p>
            </div>
          )}
        </motion.div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="keep-white mt-8 rounded-3xl border border-white/15 bg-[#071A3D] p-6 text-white shadow-xl shadow-black/10 sm:p-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Still have questions?</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  We’re always happy to help! Contact us anytime, and we’ll be glad to help your dog start their fitness journey with Zoomie Van.
                </p>
              </div>
            </div>
            <a
              href="/#book-now"
              className="keep-white flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-center text-sm font-bold transition hover:bg-brand-600"
            >
              <Sparkles className="h-4 w-4" /> Book your run
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
