import { useState, useEffect, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { AuthProvider } from './lib/auth';
import Preloader from './components/Preloader';
import ScrollProgress from './components/ScrollProgress';
import Navbar from './components/Navbar';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import CoveragePage from './pages/CoveragePage';
import FAQPage from './pages/FAQPage';
import LegalPage from './pages/LegalPage';
import AboutPage from './pages/AboutPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProductionReadinessGate from './components/ProductionReadinessGate';
import ComingSoonModal from './components/ComingSoonModal';
import AuthRedirect from './components/AuthRedirect';
import { isProductionBackendReady, isProductionBuild } from './lib/runtime';
import LandingSkeleton from './components/LandingSkeleton';

const loadHero = () => import('./components/Hero');
const loadHomeAboutPreview = () => import('./components/HomeAboutPreview');
const loadHowItWorks = () => import('./components/HowItWorks');
const loadBookNow = () => import('./components/BookNow');
const loadCTA = () => import('./components/CTA');
const loadFooter = () => import('./components/Footer');

const Hero = lazy(loadHero);
const HomeAboutPreview = lazy(loadHomeAboutPreview);
const HowItWorks = lazy(loadHowItWorks);
const BookNow = lazy(loadBookNow);
const CTA = lazy(loadCTA);
const Footer = lazy(loadFooter);

const landingModules = Promise.all([
  loadHero, loadHomeAboutPreview, loadHowItWorks, loadBookNow, loadCTA, loadFooter,
].map((loader) => loader()));

function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [modulesReady, setModulesReady] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/hero-dog-van.jpg';
    landingModules.then(() => setModulesReady(true));
  }, []);

  const handlePreloaderComplete = () => {
    setIsLoading(false);
    if (modulesReady) {
      setTimeout(() => setShowContent(true), 100);
    }
  };

  useEffect(() => {
    if (modulesReady && !isLoading) {
      setTimeout(() => setShowContent(true), 100);
    }
  }, [modulesReady, isLoading]);

  useEffect(() => {
    if (showContent && window.location.hash) {
      setTimeout(() => {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [showContent]);

  return (
    <div className="public-site relative bg-dark-900 min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      {!isLoading && !showContent && <LandingSkeleton />}

      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ScrollProgress />
          <Navbar />

          <Hero />
          <HomeAboutPreview />
          <HowItWorks />
          <BookNow />
          <CTA />
          <Footer />
        </motion.div>
      )}

      {showContent && <ComingSoonModal />}
    </div>
  );
}

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-dark-900 min-h-screen">
      <ScrollProgress />
      <Navbar />
      {children}
    </div>
  );
}

function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site relative bg-dark-900 min-h-screen">
      <ScrollProgress />
      <Navbar />
      {children}
    </div>
  );
}

function BackendRequired({ children }: { children: React.ReactNode }) {
  if (isProductionBuild && !isProductionBackendReady) {
    return <ProductionReadinessGate />;
  }

  return children;
}

export default function App() {
  return (
    <ReactLenis root options={{ smoothWheel: true, anchors: true, allowNestedScroll: true }}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<BackendRequired><ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute></BackendRequired>} />
        <Route path="/login/*" element={<BackendRequired><PublicPageLayout><LoginPage /></PublicPageLayout></BackendRequired>} />
        <Route path="/signup/*" element={<BackendRequired><PublicPageLayout><SignupPage /></PublicPageLayout></BackendRequired>} />
        <Route path="/auth/redirect" element={<BackendRequired><AuthRedirect /></BackendRequired>} />
        <Route path="/dashboard" element={<BackendRequired><ProtectedRoute><UserDashboard /></ProtectedRoute></BackendRequired>} />
        <Route path="/about" element={<PublicPageLayout><AboutPage /></PublicPageLayout>} />
        <Route path="/coverage" element={<PublicPageLayout><CoveragePage /></PublicPageLayout>} />
        <Route path="/faq" element={<PublicPageLayout><FAQPage /></PublicPageLayout>} />
        <Route path="/legal/:page" element={<PageLayout><LegalPage /></PageLayout>} />
      </Routes>
    </AuthProvider>
    </ReactLenis>
  );
}
