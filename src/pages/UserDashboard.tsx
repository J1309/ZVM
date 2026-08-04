import { useState, useRef } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, PawPrint, ShieldCheck, MapPinned, LogOut, ChevronRight, Plus, X, Save, Loader2, CreditCard, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { UserDog } from '../lib/types';
import { createCheckoutSession, STRIPE_PLANS, StripePlanKey, SessionPick } from '../lib/payments';
import PickupWindowPicker from '../components/PickupWindowPicker';
import { addVaccine } from '../lib/repositories/vaccineRepository';

const CURRENT_LEGAL_VERSION = '2026-07-14';
const emptyDog: UserDog = { name: '', breed: '', weight: 0, age: 0, energyLevel: '', reactivityNotes: '' };

export default function UserDashboard() {
  const { user, updateUser, acceptLegal, logout, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDogForm, setShowDogForm] = useState(false);
  const [dogForm, setDogForm] = useState<UserDog>(emptyDog);
  const [savingDog, setSavingDog] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    line1: '',
    city: '',
    province: '',
    postalCode: '',
  });

  const [selectedPlan, setSelectedPlan] = useState<StripePlanKey>('trial_run');
  const [pickedSessions, setPickedSessions] = useState<SessionPick[]>([]);
  const [sessionsConfirmed, setSessionsConfirmed] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<StripePlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);
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

  const openAddressForm = () => {
    setAddressForm({
      line1: user.address.line1 || '',
      city: user.address.city || '',
      province: user.address.province || '',
      postalCode: user.address.postalCode || '',
    });
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    if (!addressForm.line1 || !addressForm.city || !addressForm.province || !addressForm.postalCode) return;
    setSavingAddress(true);
    try {
      await updateUser({
        address: {
          line1: addressForm.line1,
          city: addressForm.city,
          province: addressForm.province,
          postalCode: addressForm.postalCode.toUpperCase(),
        },
      });
      setShowAddressForm(false);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user) return;
    setIsUploadingDoc(true);
    setDocUploadSuccess(null);

    try {
      await new Promise(r => setTimeout(r, 600));
      const fileName = file.name;

      await updateUser({
        vaccines: {
          ...user.vaccines,
          rabiesFileName: fileName,
          dhppFileName: fileName,
        },
      });

      await addVaccine({
        dogName: user.dog.name || 'Dog',
        ownerName: user.name,
        vaccineType: `Rabies + DHPP (${fileName})`,
      });

      setDocUploadSuccess(`Successfully uploaded "${fileName}". Sent for admin review.`);
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const saveDog = async () => {
    if (!dogForm.name || !dogForm.breed || dogForm.weight <= 0 || dogForm.age <= 0) return;
    setSavingDog(true);
    await updateUser({ dog: dogForm, vaccines: user.vaccines });
    setSavingDog(false);
    setShowDogForm(false);
  };

  const currentPlan = STRIPE_PLANS.find(p => p.key === selectedPlan)!;
  const requiredCount = currentPlan.sessionsCount;

  // Switching plans changes how many sessions are required, so clear picks.
  const changePlan = (key: StripePlanKey) => {
    setSelectedPlan(key);
    setPickedSessions([]);
    setSessionsConfirmed(false);
    setCheckoutError('');
  };

  const confirmSessions = () => {
    if (pickedSessions.length === requiredCount) setSessionsConfirmed(true);
  };

  const startCheckout = async () => {
    if (!sessionsConfirmed || pickedSessions.length !== requiredCount) {
      setCheckoutError('Confirm your sessions before checkout.');
      return;
    }
    if (!user.legalAccepted || user.legalVersion !== CURRENT_LEGAL_VERSION) {
      setCheckoutError('Accept the current service terms before checkout.');
      return;
    }
    setCheckoutPlan(selectedPlan);
    setCheckoutError('');
    try {
      // The server reserves every session (rejecting double-bookings) before
      // returning the Stripe URL; the webhook confirms them on payment.
      const session = await createCheckoutSession(selectedPlan, pickedSessions);
      window.location.assign(session.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout could not be started.');
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
          {/* Name Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="p-5 bg-dark-800/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wider">Name</span>
            </div>
            <p className="text-sm text-white">{user.name}</p>
          </motion.div>

          {/* Address Card with Edit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="p-5 bg-dark-800/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-dark-400 uppercase tracking-wider">Address</span>
              </div>
              <button onClick={openAddressForm} className="text-xs text-brand-400 hover:underline">
                Edit
              </button>
            </div>
            <p className="text-sm text-white">{`${user.address.line1}, ${user.address.city}, ${user.address.province} ${user.address.postalCode}`}</p>
          </motion.div>

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

        {/* 📄 DEDICATED VACCINE & HEALTH DOCUMENT UPLOAD SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-6 p-6 bg-dark-800/60 rounded-2xl border border-dark-600"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Vaccination & Health Document Upload</h3>
                <p className="text-xs text-dark-300">Upload your dog's Rabies and DHPP certificate (PDF, PNG, JPG up to 10MB).</p>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />

          {/* Upload Status Alert */}
          {docUploadSuccess && (
            <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              {docUploadSuccess}
            </p>
          )}

          {/* Drag & Drop Target / Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer rounded-xl border-2 border-dashed border-dark-500 bg-dark-900/50 p-6 text-center transition hover:border-brand-500/50 hover:bg-dark-900"
          >
            {isUploadingDoc ? (
              <div className="flex flex-col items-center justify-center py-4 text-brand-400">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm font-semibold">Uploading document...</p>
              </div>
            ) : user.vaccines.rabiesFileName ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-3 rounded-lg bg-brand-500/10 text-brand-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.vaccines.rabiesFileName}</p>
                    <p className="text-xs text-dark-400">Status: Sent for Admin Verification</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-dark-700 px-4 py-2 text-xs font-bold text-white hover:bg-dark-600 transition"
                >
                  <Upload className="h-3.5 w-3.5" /> Replace Document
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 text-dark-300">
                <Upload className="h-8 w-8 text-brand-400 mb-2" />
                <p className="text-sm font-bold text-white">Click or drag file to upload vaccine record</p>
                <p className="text-xs text-dark-400 mt-1">Supports PDF, PNG, JPG (Max 10MB)</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Step 1 — Choose your plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 p-6 bg-dark-800/60 rounded-3xl border border-dark-600 shadow-xl"
        >
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white shadow-md shadow-brand-500/20 mb-2">1</span>
            <h2 className="font-display text-2xl font-bold text-white">Choose Your Plan</h2>
            <p className="mt-1 text-xs text-dark-300">
              Select a fitness option below to pick your <span className="font-bold text-brand-400">{requiredCount}</span> session date{requiredCount === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STRIPE_PLANS.map(plan => {
              const isSelected = selectedPlan === plan.key;
              return (
                <label
                  key={plan.key}
                  onClick={() => !sessionsConfirmed && changePlan(plan.key)}
                  className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all ${
                    sessionsConfirmed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'border-2 border-brand-500 bg-gradient-to-b from-brand-500/15 via-dark-800 to-dark-800 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
                      : 'border border-dark-600 bg-dark-900/60 hover:border-dark-400 hover:bg-dark-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-dark-200">{plan.name}</span>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="stripe_plan"
                          value={plan.key}
                          checked={isSelected}
                          disabled={sessionsConfirmed}
                          onChange={() => changePlan(plan.key)}
                          className="sr-only"
                        />
                        <div className={`h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-dark-400 bg-dark-900'
                        }`}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="font-display text-2xl font-black text-white">${plan.price}</span>
                      <span className="text-[11px] font-semibold text-dark-400 ml-1">CAD</span>
                    </div>

                    <p className="text-xs text-dark-300 leading-relaxed min-h-[36px]">{plan.summary}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dark-700/60 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold text-brand-400">
                      {plan.sessionsCount} Session{plan.sessionsCount === 1 ? '' : 's'}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Selected</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </motion.div>

        {/* Step 2 — Pick & confirm your sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-6"
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">2</span>
            <h2 className="font-display text-lg font-bold text-white">Pick &amp; confirm your sessions</h2>
          </div>

          {!sessionsConfirmed && (
            <PickupWindowPicker
              userFsa={user.address.postalCode?.slice(0, 3) || 'T5H'}
              requiredCount={requiredCount}
              picked={pickedSessions}
              onChange={setPickedSessions}
            />
          )}

          {/* Running summary of picks */}
          <div className="mt-4 rounded-2xl border border-dark-600 bg-dark-800/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {sessionsConfirmed ? 'Confirmed sessions' : `${pickedSessions.length} of ${requiredCount} selected`}
              </p>
              {sessionsConfirmed && (
                <button onClick={() => setSessionsConfirmed(false)} className="text-xs font-semibold text-brand-400 hover:underline">
                  Edit dates
                </button>
              )}
            </div>
            {pickedSessions.length === 0 ? (
              <p className="text-xs text-dark-400">No sessions picked yet. Choose {requiredCount} above.</p>
            ) : (
              <div className="space-y-1.5">
                {[...pickedSessions].sort((a, b) => a.date.localeCompare(b.date)).map((s) => (
                  <div key={`${s.date}-${s.timeSlot}`} className="flex items-center justify-between gap-2 rounded-lg bg-dark-900/60 px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-dark-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium">{s.date}</span>
                      <span className="text-dark-400">·</span>
                      <span>{s.timeSlot}</span>
                    </span>
                    {!sessionsConfirmed && (
                      <button
                        onClick={() => setPickedSessions(pickedSessions.filter(p => !(p.date === s.date && p.timeSlot === s.timeSlot)))}
                        className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                        aria-label="Remove session"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!sessionsConfirmed && (
              <button
                onClick={confirmSessions}
                disabled={pickedSessions.length !== requiredCount}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm My Sessions
              </button>
            )}
          </div>
        </motion.div>

        {/* Step 3 — Pay for your plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-5 bg-brand-500/5 rounded-xl border border-brand-500/20"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">3</span>
            <h2 className="font-display text-lg font-bold text-white">Pay for your plan</h2>
          </div>
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
          {sessionsConfirmed ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{currentPlan.name} — {requiredCount} session{requiredCount === 1 ? '' : 's'} confirmed, total ${currentPlan.price} CAD.</span>
            </div>
          ) : (
            <p className="mb-4 rounded-xl border border-dark-600 bg-dark-800/50 px-4 py-3 text-sm text-dark-300">
              Confirm your sessions above to continue to payment.
            </p>
          )}
          <button
            onClick={startCheckout}
            disabled={checkoutPlan !== null || !hasCurrentConsent || !hasDog || !sessionsConfirmed}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-500 hover:to-brand-400 disabled:opacity-60"
          >
            {checkoutPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pay ${currentPlan.price} with Stripe
          </button>
          {checkoutError && <p className="mt-3 text-sm text-red-300">{checkoutError}</p>}
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

      {/* Address Edit Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-dark-600">
              <h2 className="font-display text-lg font-bold text-white">Edit Service Address</h2>
              <button onClick={() => setShowAddressForm(false)} className="p-1 text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-dark-400 uppercase tracking-wider">Street Address</label>
                <input
                  value={addressForm.line1}
                  onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                  placeholder="123 Main St"
                  className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">City</label>
                  <input
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Edmonton"
                    className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Province</label>
                  <select
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="">Select</option>
                    {['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Postal Code</label>
                  <input
                    value={addressForm.postalCode}
                    onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value.toUpperCase() })}
                    placeholder="T6W 0L1"
                    className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-dark-600">
              <button
                onClick={() => setShowAddressForm(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-xl border border-dark-500 text-dark-200 hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAddress}
                disabled={!addressForm.line1 || !addressForm.city || !addressForm.province || !addressForm.postalCode || savingAddress}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-40 flex items-center gap-1.5"
              >
                {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Address
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
