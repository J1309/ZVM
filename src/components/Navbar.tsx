import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  Settings,
  LogIn,
  LayoutDashboard,
  PawPrint,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const navLinks = [
  { label: 'Home', href: '/', page: true },
  { label: 'About', href: '/about', page: true },
  { label: 'Pricing', href: '/#book-now', page: false },
  { label: 'Coverage', href: '/coverage', page: true },
  { label: 'FAQ', href: '/faq', page: true },
];

const navItemClass =
  'group relative rounded-full px-4 py-2 text-sm font-bold text-[#17345f] transition-colors hover:text-[#071A3D] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

function MotionUnderline({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-brand-500 transition-transform duration-300 ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}
    />
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 36);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
    navigate('/');
  };

  const handlePageNavigate = (href: string) => {
    setIsMobileOpen(false);
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.slice(1);
    return location.pathname === href;
  };

  return (
    <>
      <motion.nav
        initial={{ y: -96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
        aria-label="Primary navigation"
      >
        <motion.div
          animate={{
            y: isScrolled ? 0 : 4,
            boxShadow: isScrolled
              ? '0 20px 55px rgba(3, 14, 34, 0.18)'
              : '0 12px 36px rgba(3, 14, 34, 0.10)',
          }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-7xl overflow-hidden rounded-[1.45rem] border border-white/70 bg-white/94 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/88"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-[#ffb24b] to-[#0F3D91]" />

          <div className="flex h-16 items-center justify-between px-3 sm:px-5 lg:h-[4.5rem] lg:px-6">
            <Link
              to="/"
              className="group relative flex min-w-0 items-center gap-2.5 rounded-2xl px-1.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-label="ZoomieVan home"
            >
              <motion.span
                aria-hidden="true"
                className="absolute -left-2 top-1/2 hidden h-8 w-20 -translate-y-1/2 rounded-full bg-brand-500/12 blur-md lg:block"
                initial={{ opacity: 0, x: -16 }}
                whileHover={{ opacity: 1, x: 20 }}
                transition={{ duration: 0.38 }}
              />
              <img
                src="/images/zvm_companyname_logo.png"
                alt="ZoomieVan"
                className="relative h-8 w-auto sm:h-9"
              />
              <span className="hidden items-center gap-1 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-brand-700 xl:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                Mobile Fitness
              </span>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                link.page ? (
                  <button
                    key={link.label}
                    onClick={() => handlePageNavigate(link.href)}
                    className={navItemClass}
                  >
                    {link.label}
                    <MotionUnderline active={isActive(link.href)} />
                  </button>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className={navItemClass}
                  >
                    {link.label}
                    <MotionUnderline active={isActive(link.href)} />
                  </a>
                )
              ))}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#17345f] transition-colors hover:text-[#071A3D] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Settings className="h-3.5 w-3.5 text-brand-500" />
                  Admin
                  <MotionUnderline active={location.pathname === '/admin'} />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 rounded-full border border-[#D6E6FF] bg-[#F7FBFF] px-4 py-2 text-sm font-bold text-[#17345f] transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-[#071A3D] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#0F3D91]" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-full px-4 py-2 text-sm font-bold text-[#5b7299] transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#17345f] transition hover:bg-[#EAF2FF] hover:text-[#071A3D] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <LogIn className="h-3.5 w-3.5 text-brand-500" />
                    Sign In
                  </button>
                  <motion.button
                    onClick={() => navigate('/signup')}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative overflow-hidden rounded-full bg-brand-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                    <span className="relative flex items-center gap-1.5">
                      Get Started
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </motion.button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMobileOpen((open) => !open)}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#D6E6FF] bg-[#F7FBFF] text-[#071A3D] transition hover:border-brand-200 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#071A3D]/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 top-[5.35rem] z-50 overflow-hidden rounded-[1.35rem] border border-white/75 bg-white shadow-2xl shadow-[#071A3D]/25 lg:hidden"
            >
              <div className="h-1 bg-gradient-to-r from-brand-500 via-[#ffb24b] to-[#0F3D91]" />
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-sm font-black text-[#071A3D]">
                  <PawPrint className="h-4 w-4 text-brand-500" />
                  ZoomieVan mobile fitness
                </div>

                <div className="grid gap-1">
                  {navLinks.map((link, index) => (
                    link.page ? (
                      <motion.button
                        key={link.label}
                        onClick={() => handlePageNavigate(link.href)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.035 }}
                        className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-left text-base font-bold text-[#17345f] transition hover:bg-[#EAF2FF] hover:text-[#071A3D]"
                      >
                        {link.label}
                        <ChevronRight className="h-4 w-4 text-brand-500" />
                      </motion.button>
                    ) : (
                      <motion.a
                        key={link.label}
                        href={link.href}
                        onClick={() => setIsMobileOpen(false)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.035 }}
                        className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-bold text-[#17345f] transition hover:bg-[#EAF2FF] hover:text-[#071A3D]"
                      >
                        {link.label}
                        <ChevronRight className="h-4 w-4 text-brand-500" />
                      </motion.a>
                    )
                  ))}
                </div>

                <div className="mt-3 border-t border-[#D6E6FF] pt-3">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handlePageNavigate('/admin')}
                      className="mb-1 flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-base font-bold text-[#17345f] transition hover:bg-[#EAF2FF]"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-brand-500" />
                        Admin
                      </span>
                      <ChevronRight className="h-4 w-4 text-brand-500" />
                    </button>
                  )}

                  {user ? (
                    <>
                      <button
                        onClick={() => handlePageNavigate('/dashboard')}
                        className="flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-base font-bold text-[#17345f] transition hover:bg-[#EAF2FF]"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-[#0F3D91]" />
                          Dashboard
                        </span>
                        <ChevronRight className="h-4 w-4 text-brand-500" />
                      </button>
                      <button
                        onClick={handleLogout}
                        className="mt-1 min-h-12 w-full rounded-2xl px-4 text-left text-base font-bold text-[#5b7299] transition hover:bg-[#FFF7ED] hover:text-brand-600"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="grid gap-2">
                      <button
                        onClick={() => handlePageNavigate('/login')}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#D6E6FF] bg-[#F7FBFF] px-4 text-base font-bold text-[#17345f] transition hover:border-brand-200"
                      >
                        <LogIn className="h-4 w-4 text-brand-500" />
                        Sign In
                      </button>
                      <button
                        onClick={() => handlePageNavigate('/signup')}
                        className="keep-white flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 text-base font-black text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
                      >
                        Get Started
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
