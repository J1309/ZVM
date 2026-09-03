import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, PenTool, Check, ChevronRight, ArrowLeft, Loader2, Eye, EyeOff, PawPrint, ShieldCheck } from 'lucide-react';
import { SignUp } from '@clerk/react';
import { useAuth } from '../lib/auth';
import { UserAddress } from '../lib/types';

const steps = [
  { step: 1, icon: User, title: 'Your Profile', subtitle: 'Account and route details' },
  { step: 2, icon: PenTool, title: 'Safety Release', subtitle: 'Agreement before booking' },
];

const inputClass = 'h-11 w-full rounded-xl border border-[#D6E6FF] bg-[#EAF2FF] px-4 text-sm text-[#071A3D] placeholder:text-[#7E9ED2] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export default function SignupPage() {
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[310px_1fr]">
          <aside className="friendly-card hidden rounded-3xl border border-white/20 bg-white p-6 shadow-xl shadow-black/10 lg:block">
            <Link to="/" className="mb-9 flex items-center">
              <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-8 w-auto" />
            </Link>

            <div className="keep-white mb-8 rounded-3xl bg-[#071A3D] p-5 text-white">
              <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
                <PawPrint className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight">Start with one happy run.</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Create a secure Clerk account first. After verification, your ZoomieVan profile is created in Convex.
              </p>
            </div>

            <div className="space-y-3 text-sm text-[#315B96]">
              <div className="rounded-2xl bg-[#EAF2FF] p-4 font-semibold text-[#071A3D]">
                Email OTP and verification are handled by Clerk.
              </div>
              <div className="rounded-2xl bg-[#FFF7ED] p-4 font-semibold text-[#071A3D]">
                Add dog details from your dashboard after signup.
              </div>
            </div>

            <Link to="/login" className="mt-8 flex items-center gap-2 text-sm font-bold text-[#315B96] hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </aside>

          <section className="flex justify-center">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              forceRedirectUrl="/dashboard"
              fallbackRedirectUrl="/dashboard"
            />
          </section>
        </div>
      </main>
    );
  }

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<UserAddress>({ line1: '', city: '', province: '', postalCode: '' });
  const [legalAccepted, setLegalAccepted] = useState(false);

  const { user, signup } = useAuth();
  const navigate = useNavigate();

  // Already signed in: no reason to show the create-account form.
  if (user) return <Navigate to="/dashboard" replace />;

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return (
          name.trim() &&
          email.trim() &&
          password.length >= 6 &&
          phone.trim().length >= 7 &&
          address.line1 &&
          address.city &&
          address.province &&
          address.postalCode
        );
      case 1:
        return legalAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    if (!legalAccepted) return;
    setSaving(true);
    setError('');
    const result = await signup({
      email,
      password,
      name,
      phone,
      address,
      dog: { name: '', breed: '', weight: 0, age: 0, energyLevel: '', reactivityNotes: '' },
      vaccines: { rabiesFileName: '', dhppFileName: '', vetName: '', vetPhone: '' },
      legalAccepted,
      legalAcceptedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error ?? 'Signup failed.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-brand-500/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1557B7]/45 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[310px_1fr]">
        <aside className="friendly-card hidden rounded-3xl border border-white/20 bg-white p-6 shadow-xl shadow-black/10 lg:block">
          <Link to="/" className="mb-9 flex items-center">
            <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-8 w-auto" />
          </Link>

          <div className="keep-white mb-8 rounded-3xl bg-[#071A3D] p-5 text-white">
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-[#ffcf8a]">
              <PawPrint className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight">Start with one happy run.</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Create your account, share route details, and complete the safety release before booking.
            </p>
          </div>

          <nav className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const complete = index < activeStep;
              const active = activeStep === index;
              return (
                <button
                  key={step.step}
                  onClick={() => { if (index <= activeStep) setActiveStep(index); }}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    active ? 'border-brand-300 bg-brand-50' : 'border-transparent hover:bg-[#EAF2FF]'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-brand-500 text-white' : complete ? 'bg-[#EAF2FF] text-[#0F3D91]' : 'bg-[#FFF7ED] text-brand-600'
                  }`}>
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#071A3D]">{step.title}</span>
                    <span className="block text-xs text-[#315B96]">{step.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <Link to="/login" className="mt-8 flex items-center gap-2 text-sm font-bold text-[#315B96] hover:text-brand-600">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </aside>

        <section className="friendly-card rounded-3xl border border-white/20 bg-white p-5 shadow-xl shadow-black/10 sm:p-8">
          <div className="mb-7 flex flex-col gap-4 border-b border-[#D6E6FF] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-600">
                Step {activeStep + 1} of {steps.length}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-[#071A3D]">{steps[activeStep].title}</h2>
              <p className="mt-1 text-sm text-[#315B96]">{steps[activeStep].subtitle}</p>
            </div>
            <Link to="/login" className="text-sm font-bold text-[#315B96] hover:text-brand-600 lg:hidden">Sign in</Link>
          </div>

          <motion.div key={activeStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {activeStep === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Full name</label>
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="John Doe" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Email</label>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john@example.com" className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 characters" className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#315B96] hover:text-brand-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">
                        Phone Number <span className="text-brand-600">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded">
                        Owner will call you
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+1 (780) 555-0199"
                      className={inputClass}
                      required
                    />
                    <p className="text-[11px] text-[#4A6B9C]">
                      The owner will personally call this number to schedule your sessions.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Street address</label>
                  <input value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} placeholder="123 Main St" className={inputClass} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">City</label>
                    <input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} placeholder="Edmonton" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Province</label>
                    <select value={address.province} onChange={(event) => setAddress({ ...address, province: event.target.value })} className={inputClass}>
                      <option value="">Select</option>
                      {['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map((province) => <option key={province}>{province}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-[#315B96]">Postal code</label>
                    <input value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value.toUpperCase() })} placeholder="M5V 2T6" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-[#D6E6FF] bg-[#EAF2FF] p-6 text-sm leading-relaxed text-[#071A3D]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-[#0F3D91]">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <strong className="font-display text-xl text-[#071A3D]">Liability waiver</strong>
                  </div>
                  <p>I acknowledge that ZoomieVan mobile canine fitness sessions involve physical activity and that dogs can experience fatigue, stress, illness, escape, reactivity, injury, or other incidents even in a supervised environment.</p>
                  <p className="mt-3">I understand that I remain responsible for my dog's health, behavior, suitability, and safety before, during, and after each session. ZoomieVan is not a veterinary provider and does not provide medical clearance.</p>
                  <p className="mt-3">I confirm that my dog is in good health and that I have disclosed all known medical conditions, prior injuries, medications, behavioral issues, bite history, anxiety, reactivity, or special handling needs.</p>
                  <p className="mt-3">I agree that ZoomieVan may refuse, pause, shorten, or stop service if the handler believes continuing could be unsafe or unsuitable. Safety-based refusal or early termination does not create a refund obligation.</p>
                  <p className="mt-3">I understand that all paid bookings, deposits, packages, and service fees are non-refundable unless ZoomieVan cancels the service and chooses to issue a credit, reschedule, or refund.</p>
                  <p className="mt-3">To the fullest extent permitted by law, I release ZoomieVan, its owners, handlers, contractors, and affiliates from claims, costs, damages, or losses connected to my dog's participation in the service.</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#D6E6FF] bg-white p-4">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(event) => setLegalAccepted(event.target.checked)}
                    className="mt-1 rounded border-[#D6E6FF] text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-semibold text-[#071A3D]">I have read and agree to the safety release, owner responsibility, and non-refundable payment terms above.</span>
                </label>
              </div>
            )}

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </motion.p>
            )}

            <div className="mt-8 flex justify-between border-t border-[#D6E6FF] pt-6">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                className={`rounded-xl border border-[#D6E6FF] px-5 py-2.5 text-sm font-bold text-[#315B96] transition hover:bg-[#EAF2FF] ${activeStep === 0 ? 'pointer-events-none opacity-30' : ''}`}
              >
                Back
              </button>
              {activeStep < 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="keep-white flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold transition hover:bg-brand-600 disabled:opacity-40"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || saving}
                  className="keep-white flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </button>
              )}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
