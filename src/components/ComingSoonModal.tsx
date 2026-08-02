import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PawPrint, X, Sparkles } from 'lucide-react';
import { getItem, setItem } from '../lib/db';

const SEEN_KEY = 'comingSoonSeen';

export default function ComingSoonModal() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(() => !getItem<boolean>(SEEN_KEY));

  const dismiss = () => {
    setItem(SEEN_KEY, true);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[900] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-900/80 backdrop-blur-md"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 shadow-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {/* Glow header band */}
            <div className="relative h-28 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 overflow-hidden">
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_30%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                  <PawPrint className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
              </motion.div>
            </div>

            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Body */}
            <div className="p-6 sm:p-7 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Launching Soon
              </div>
              <h2 id="coming-soon-title" className="text-2xl font-display font-bold text-white">
                We're almost off the leash!
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-dark-300">
                ZoomieVan is warming up for the big run. Our tails are wagging and
                the treats are packed — we'll be rolling into your neighbourhood
                <span className="text-brand-300 font-medium"> very soon</span>.
                Take a look around while we finish our stretches. 🐾
              </p>
              <button
                onClick={dismiss}
                className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all"
              >
                Sniff Around the Site
              </button>
              <p className="mt-3 text-xs text-dark-500">Booking opens the moment we launch.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
