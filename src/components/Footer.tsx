import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Camera } from 'lucide-react';

const footerLinks = {
  Service: [
    { label: 'Home', href: '/' },
    { label: 'Pricing', href: '/#book-now' },
    { label: 'Coverage Areas', href: '/coverage' },
    { label: 'Book a Session', href: '/#book-now' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'FAQ', href: '/faq' },
  ],
  Support: [
    { label: 'Help Center', href: '/legal/support' },
    { label: 'Contact Us', href: '/legal/support' },
    { label: 'Safety Protocols', href: '/legal/waiver' },
    { label: 'Vaccine Requirements', href: '/legal/waiver' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Liability Waiver', href: '/legal/waiver' },
    { label: 'PIPEDA Compliance', href: '/legal/pipeda' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-dark-800/50 border-t border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-dark-300 leading-relaxed max-w-xs">
              Mobile canine fitness delivered to your door. Safe, supervised slat mill sessions
              in fully equipped, climate-controlled vans.
            </p>
            <div className="space-y-3 text-sm text-dark-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>Edmonton, AB</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500" />
                <a href="mailto:support@zoomievaninc.com" className="hover:text-white transition-colors">support@zoomievaninc.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500" />
                <a href="tel:+15875684967" className="hover:text-white transition-colors">+1 (587) 568-4967</a>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/zoomie.van?utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ZoomieVan Instagram"
                className="w-10 h-10 rounded-xl bg-dark-700 border border-dark-500 flex items-center justify-center text-dark-300 hover:text-brand-400 hover:border-brand-500/30 transition-all"
              >
                <Camera className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@zoomievaninc.com"
                aria-label="Email ZoomieVan Support"
                className="w-10 h-10 rounded-xl bg-dark-700 border border-dark-500 flex items-center justify-center text-dark-300 hover:text-brand-400 hover:border-brand-500/30 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="tel:+15875684967"
                aria-label="Call ZoomieVan"
                className="w-10 h-10 rounded-xl bg-dark-700 border border-dark-500 flex items-center justify-center text-dark-300 hover:text-brand-400 hover:border-brand-500/30 transition-all"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white text-sm mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/#') ? (
                      <a href={link.href} className="text-sm text-dark-400 hover:text-brand-400 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm text-dark-400 hover:text-brand-400 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="py-6 border-t border-dark-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-400">
            &copy; 2025 ZoomieVan Inc. All rights reserved. Proudly Canadian.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-dark-500">Built for health. Born to zoom.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
