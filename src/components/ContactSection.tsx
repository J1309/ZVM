import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Camera, Copy, Check, Send, MapPin, MessageSquare, Sparkles } from 'lucide-react';

export default function ContactSection() {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', dogName: '', message: '' });

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('+1 (587) 568-4967');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@zoomievaninc.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-dark-900 py-20 lg:py-28">
      {/* Subtle background glows */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-18">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-400 mb-4"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Get In Touch
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            Contact Us &amp; Let&apos;s Chat
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base text-dark-200 sm:text-lg"
          >
            Have questions about our mobile canine fitness sessions, custom scheduling, or service areas? Reach out directly or send us a message below.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Interactive Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-dark-600 bg-dark-800/60 p-6 transition hover:border-brand-500/40 hover:bg-dark-800/90"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:scale-105 transition-transform">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Call or Text Us</p>
                    <a href="tel:+15875684967" className="font-display text-lg font-bold text-white hover:text-brand-400 transition-colors">
                      +1 (587) 568-4967
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/60 flex items-center gap-2">
                <a
                  href="tel:+15875684967"
                  className="keep-white inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition shadow-md shadow-brand-500/20"
                >
                  <Phone className="h-3.5 w-3.5" /> Call Now
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500 bg-dark-700 px-3.5 py-2 text-xs font-semibold text-dark-200 hover:border-dark-400 hover:text-white transition"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-dark-400" /> Copy Number
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Email Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl border border-dark-600 bg-dark-800/60 p-6 transition hover:border-brand-500/40 hover:bg-dark-800/90"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:scale-105 transition-transform">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Email Support</p>
                    <a href="mailto:support@zoomievaninc.com" className="font-display text-base font-bold text-white hover:text-brand-400 transition-colors break-all">
                      support@zoomievaninc.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/60 flex items-center gap-2">
                <a
                  href="mailto:support@zoomievaninc.com"
                  className="keep-white inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition shadow-md shadow-brand-500/20"
                >
                  <Mail className="h-3.5 w-3.5" /> Send Email
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500 bg-dark-700 px-3.5 py-2 text-xs font-semibold text-dark-200 hover:border-dark-400 hover:text-white transition"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-dark-400" /> Copy Email
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Instagram & Service Region Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-3xl border border-dark-600 bg-dark-800/60 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Instagram</p>
                    <p className="text-xs text-dark-400">@zoomie.van</p>
                  </div>
                </div>
                <a
                  href="https://www.instagram.com/zoomie.van?utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:underline"
                >
                  Follow Us &rarr;
                </a>
              </div>

              <div className="pt-3 border-t border-dark-700/60 flex items-center gap-2 text-xs text-dark-300">
                <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                <span>Service Region: Edmonton, St. Albert, Sherwood Park, Leduc, Spruce Grove</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Quick Inquiry Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-dark-600 bg-dark-800/80 p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Send Us a Quick Message</h3>
                  <p className="text-xs text-dark-300 mt-1">We usually respond within a few hours!</p>
                </div>
                <Sparkles className="h-5 w-5 text-brand-400 opacity-80" />
              </div>

              <AnimatePresence mode="wait">
                {formSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                      <Check className="h-8 w-8" />
                    </div>
                    <h4 className="font-display text-2xl font-bold text-white">Message Received!</h4>
                    <p className="mt-2 text-sm text-dark-300 max-w-md">
                      Thank you <span className="font-bold text-white">{formData.name}</span>. Our ZoomieVan team will respond to <span className="font-bold text-brand-400">{formData.email}</span> shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormData({ name: '', email: '', dogName: '', message: '' });
                      }}
                      className="mt-6 rounded-xl border border-dark-500 bg-dark-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-dark-600 transition"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-bold text-dark-200 mb-1.5">
                          Your Name <span className="text-brand-400">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Sarah Jenkins"
                          className="h-11 w-full rounded-xl border border-dark-500 bg-dark-900 px-4 text-sm text-white placeholder-dark-400 focus:border-brand-500/60 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-bold text-dark-200 mb-1.5">
                          Email Address <span className="text-brand-400">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="e.g. sarah@example.com"
                          className="h-11 w-full rounded-xl border border-dark-500 bg-dark-900 px-4 text-sm text-white placeholder-dark-400 focus:border-brand-500/60 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-dog" className="block text-xs font-bold text-dark-200 mb-1.5">
                        Dog&apos;s Name &amp; Breed (Optional)
                      </label>
                      <input
                        id="contact-dog"
                        type="text"
                        value={formData.dogName}
                        onChange={e => setFormData(prev => ({ ...prev, dogName: e.target.value }))}
                        placeholder="e.g. Buster (Golden Retriever)"
                        className="h-11 w-full rounded-xl border border-dark-500 bg-dark-900 px-4 text-sm text-white placeholder-dark-400 focus:border-brand-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-bold text-dark-200 mb-1.5">
                        How can we help? <span className="text-brand-400">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your dog's fitness needs, question, or preferred pickup area..."
                        className="w-full rounded-xl border border-dark-500 bg-dark-900 p-4 text-sm text-white placeholder-dark-400 focus:border-brand-500/60 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="keep-white w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition"
                    >
                      <Send className="h-4 w-4" /> Send Message
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
