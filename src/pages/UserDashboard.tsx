import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, PawPrint, ShieldCheck, MapPinned, LogOut, ChevronRight, Plus, X, Save, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { UserDog } from '../lib/types';
import { createCheckoutSession, STRIPE_PLANS, StripePlanKey } from '../lib/payments';
import PickupWindowPicker from '../components/PickupWindowPicker';

const CURRENT_LEGAL_VERSION = '2026-07-14';
const emptyDog: UserDog = { name: '', breed: '', weight: 0, age: 0, energyLevel: '', reactivityNotes: '' };

export default function UserDashboard() {
  const { user, updateUser, acceptLegal, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [showDogForm, setShowDogForm] = useState(false);
  const [dogForm, setDogForm] = useState<UserDog>(emptyDog);
  const [savingDog, setSavingDog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StripePlanKey>('trial_run');
  const [checkoutPlan, setCheckoutPlan] = useState<StripePlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const checkoutStatus = new URLSearchParams(window.location.search).get('checkout');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openDogForm = () => {
    if (user.dog.name) {
      setDogForm({ ...user.dog });
    } else {
      setDogForm({ ...emptyDog });
    }
    setShowDogForm(true);
  };

  const saveDog = async () => {
    if (!dogForm.name || !dogForm.breed || dogForm.weight <= 0 || dogForm.age <= 0) return;
    setSavingDog(true);
    await updateUser({ dog: dogForm, vaccines: user.vaccines });
    setSavingDog(false);
    setShowDogForm(false);
  };

  const startCheckout = async () => {
    if (!user.legalAccepted || user.legalVersion !== CURRENT_LEGAL_VERSION) {
      setCheckoutError('Accept the current service terms before checkout.');
      return;
    }
    setCheckoutPlan(selectedPlan);
    setCheckoutError('');
    try {
      const session = await createCheckoutSession(selectedPlan);
      window.location.assign(session.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Stripe checkout could not be started.');
      setCheckoutPlan(null);
    }
  };

  const saveConsent = async () => {
    if (!consentChecked) return;
    setSavingConsent(true);
    setCheckoutError('');
    try {
      await acceptLegal();
      setConsentChecked(false);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Consent could not be saved.');
    } finally {
      setSavingConsent(false);
    }
  };

  const hasDog = !!user.dog.name;
  const hasCurrentConsent = user.legalAccepted && user.legalVersion === CURRENT_LEGAL_VERSION;

  const details = [
    { icon: User, label: 'Name', value: user.name },
    { icon: MapPinned, label: 'Address', value: `${user.address.line1}, ${user.address.city}, ${user.address.province} ${user.address.postalCode}` },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-dark-600">
        <Link to="/" className="flex items-center">
          <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-6 w-auto" />
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:text-red-400 transition-colors rounded-xl hover:bg-dark-800">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-white">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-dark-300 mt-1">Manage your profile and book sessions.</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-8 overflow-hidden rounded-2xl border border-brand-500/25 bg-brand-500/10"
        >
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-300">
                <PawPrint className="h-3.5 w-3.5" />
                Start with one happy run
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Set up your dog's first ZoomieVan visit.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dark-200">
                Add your dog profile, confirm safety details, and choose a booking window when you are ready.
              </p>
            </div>
            <button
              onClick={openDogForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              {hasDog ? 'Review dog profile' : 'Add dog profile'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {details.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 bg-dark-800/50 rounded-xl border border-dark-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <d.icon className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-dark-400 uppercase tracking-wider">{d.label}</span>
              </div>
              <p className="text-sm text-white">{d.value}</p>
            </motion.div>
          ))}

          {/* Dog Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="p-5 bg-dark-800/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-dark-400 uppercase tracking-wider">Dog</span>
              </div>
              <button onClick={openDogForm} className="text-xs text-brand-400 hover:underline">
                {hasDog ? 'Edit' : 'Add'} {hasDog ? '' : <Plus className="w-3 h-3 inline" />}
              </button>
            </div>
            <p className="text-sm text-white">
              {hasDog ? `${user.dog.name} — ${user.dog.breed}, ${user.dog.weight}lbs, ${user.dog.age}yrs` : 'No pet profile yet'}
            </p>
          </motion.div>

          {/* Vaccines Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="p-5 bg-dark-800/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wider">Vaccines</span>
            </div>
            <p className="text-sm text-white">{hasDog ? (user.vaccines.rabiesFileName ? 'Rabies + DHPP submitted' : 'Not yet submitted') : 'Add a dog profile first'}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-5 bg-brand-500/5 rounded-xl border border-brand-500/20"
        >
          {checkoutStatus === 'success' && (
            <p className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Checkout completed. We are verifying the payment before confirming your booking.
            </p>
          )}
          {checkoutStatus === 'cancelled' && (
            <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Checkout was cancelled. No payment was taken.
            </p>
          )}
          {!hasCurrentConsent && (
            <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-100">Service agreement required</p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-dark-200">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={event => setConsentChecked(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/legal/terms" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Terms of Service</Link>
                  {', '}
                  <Link to="/legal/waiver" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Liability Waiver</Link>
                  {' and '}
                  <Link to="/legal/privacy" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Privacy Policy</Link>.
                </span>
              </label>
              <button
                onClick={saveConsent}
                disabled={!consentChecked || savingConsent}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-dark-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingConsent && <Loader2 className="h-4 w-4 animate-spin" />}
                Accept current terms
              </button>
            </div>
          )}
          <p className="text-sm text-dark-300 mb-4">
            Ready for a session? Check availability and book a visit.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={selectedPlan}
              onChange={event => setSelectedPlan(event.target.value as StripePlanKey)}
              className="h-11 rounded-xl border border-dark-500 bg-dark-900 px-4 text-sm text-white focus:outline-none focus:border-brand-500/50"
            >
              {STRIPE_PLANS.map(plan => (
                <option key={plan.key} value={plan.key}>
                  {plan.name} - ${plan.price} CAD, {plan.summary}
                </option>
              ))}
            </select>
            <button
              onClick={startCheckout}
              disabled={checkoutPlan !== null || !hasCurrentConsent || !hasDog}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-500 hover:to-brand-400 disabled:opacity-60"
            >
              {checkoutPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Pay with Stripe
            </button>
          </div>
          {checkoutError && <p className="mt-3 text-sm text-red-300">{checkoutError}</p>}
        </motion.div>

        {/* Pickup Window & Session Scheduling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <PickupWindowPicker
            userFsa={user.address.postalCode?.slice(0, 3) || 'T5H'}
          />
        </motion.div>
      </div>

      {/* Dog Profile Modal */}
      {showDogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-dark-600">
              <h2 className="font-display text-lg font-bold text-white">
                {hasDog ? 'Edit Your Dog' : 'Add Your Dog'}
              </h2>
              <button onClick={() => setShowDogForm(false)} className="p-1 text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Name</label>
                  <input value={dogForm.name} onChange={e => setDogForm({ ...dogForm, name: e.target.value })} placeholder="Max" className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Breed</label>
                  <input value={dogForm.breed} onChange={e => setDogForm({ ...dogForm, breed: e.target.value })} placeholder="Golden Retriever" className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Weight (lbs)</label>
                  <input type="number" value={dogForm.weight || ''} onChange={e => setDogForm({ ...dogForm, weight: Number(e.target.value) })} placeholder="65" className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Age (years)</label>
                  <input type="number" value={dogForm.age || ''} onChange={e => setDogForm({ ...dogForm, age: Number(e.target.value) })} placeholder="3" className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 uppercase tracking-wider">Energy Level</label>
                <select value={dogForm.energyLevel} onChange={e => setDogForm({ ...dogForm, energyLevel: e.target.value })} className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-brand-500/50">
                  <option value="">Select...</option>
                  <option>Low — couch potato</option>
                  <option>Moderate — daily walks</option>
                  <option>High — needs serious exercise</option>
                  <option>Extreme — endless energy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 uppercase tracking-wider">Reactivity Notes</label>
                <textarea value={dogForm.reactivityNotes} onChange={e => setDogForm({ ...dogForm, reactivityNotes: e.target.value })} placeholder="Any behavioral notes, fears, or special handling instructions..." className="w-full h-20 bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-dark-600">
              <button onClick={() => setShowDogForm(false)} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-dark-500 text-dark-200 hover:bg-dark-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveDog}
                disabled={!dogForm.name || !dogForm.breed || dogForm.weight <= 0 || dogForm.age <= 0 || savingDog}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-40 flex items-center gap-1.5"
              >
                {savingDog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
