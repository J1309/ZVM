import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, PawPrint, ShieldCheck, MapPinned, LogOut, ChevronRight, Plus, X, Save,
  Loader2, CreditCard, Upload, FileText, CheckCircle2, Sparkles, Star, Clock,
  PhoneCall, AlertCircle, ExternalLink, ShieldAlert, Trash2, Calendar, Settings,
  Check, Lock, ChevronDown, RefreshCw, AlertTriangle, Shield
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { UserDog } from '../lib/types';
import { createCheckoutSession, cancelPendingCheckout, STRIPE_PLANS, StripePlanKey, SessionPick } from '../lib/payments';
import { getFoundingMemberStats, FoundingMemberStats } from '../lib/foundingMembers';
import { isFullLaunchActive, getTimeUntilLaunch, CountdownState, LAUNCH_TIME_LABEL_CANADIAN } from '../lib/launchConfig';
import { convex, api } from '../lib/convexClient';
import PickupWindowPicker from '../components/PickupWindowPicker';

const CURRENT_LEGAL_VERSION = '2026-07-14';
const emptyDog: UserDog = { name: '', breed: '', weight: 0, age: 0, energyLevel: '', reactivityNotes: '' };

type DashboardTab = 'booking' | 'dog' | 'account';

export default function UserDashboard() {
  const { user, updateUser, acceptLegal, submitProfile, deleteAccount, refreshUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('booking');

  // Modals State
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Profile Submission State
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Booking & Plan State
  const [selectedPlan, setSelectedPlan] = useState<StripePlanKey>('trial_run');
  const [pickedSessions, setPickedSessions] = useState<SessionPick[]>([]);
  const [sessionsConfirmed, setSessionsConfirmed] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<StripePlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);

  // Vaccine Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Agreement Scroll Modal State
  const [agreementScrolled, setAgreementScrolled] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [submittingAgreement, setSubmittingAgreement] = useState(false);

  // Launch & Founding Stats State
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [fullLaunchActive, setFullLaunchActive] = useState<boolean>(() => isFullLaunchActive());

  // Phone Contact Quick Edit State
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSavedMessage, setPhoneSavedMessage] = useState('');

  const checkoutStatus = new URLSearchParams(window.location.search).get('checkout');

  useEffect(() => {
    let active = true;
    getFoundingMemberStats()
      .then(s => { if (active) setFoundingStats(s); })
      .catch(() => { if (active) setFoundingStats(null); });

    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
      setFullLaunchActive(isFullLaunchActive());
    }, 1000);

    const handleLaunchChange = () => {
      setFullLaunchActive(isFullLaunchActive());
    };
    window.addEventListener('zoomievan_launch_mode_changed', handleLaunchChange);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('zoomievan_launch_mode_changed', handleLaunchChange);
    };
  }, []);

  useEffect(() => {
    if (checkoutStatus === 'cancelled') {
      cancelPendingCheckout().catch(() => {});
      setPickedSessions([]);
      setSessionsConfirmed(false);
      setCheckoutPlan(null);
    }
  }, [checkoutStatus]);

  const handleAgreementScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 30;
    if (isAtBottom) {
      setAgreementScrolled(true);
    }
  };

  const handleAcceptAgreement = async () => {
    if (!agreementScrolled || !agreementChecked) return;
    setSubmittingAgreement(true);
    try {
      await acceptLegal();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAgreement(false);
    }
  };

  const isAgreementRequired = !!user && (!user.legalAccepted || user.legalVersion !== CURRENT_LEGAL_VERSION);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071A3D] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
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

  // Helper checks for mandatory fields
  const hasDogVitals = !!(user.dog?.name && user.dog?.breed && (user.dog?.weight ?? 0) > 0 && (user.dog?.age ?? 0) > 0);
  const hasAddress = !!(user.address?.line1 && user.address?.city && user.address?.province && user.address?.postalCode);
  const hasPhone = !!(user.phone && user.phone.trim().length >= 7);
  const hasVaccines = !!(user.vaccines?.documentUrl || user.vaccines?.rabiesFileName);
  const hasLegal = !!(user.legalAccepted && user.legalVersion === CURRENT_LEGAL_VERSION);

  const mandatoryTotal = 5;
  const mandatoryCompletedCount = [hasDogVitals, hasAddress, hasPhone, hasVaccines, hasLegal].filter(Boolean).length;
  const allMandatoryComplete = mandatoryCompletedCount === mandatoryTotal;

  const isProfileSubmitted = !!user.profileCompleted;
  const isAccountVerified = !!user.accountVerified;

  // Submit Profile Handler
  const handleSubmitProfile = async () => {
    if (!allMandatoryComplete) return;
    setSubmittingProfile(true);
    setProfileSuccessMsg(null);
    try {
      await submitProfile();
      setProfileSuccessMsg('Profile and canine health details submitted successfully! Our safety team is now reviewing your account.');
      setTimeout(() => setProfileSuccessMsg(null), 7000);
    } catch (err: any) {
      console.error('Failed to submit profile:', err);
      alert(err?.message || 'Failed to submit profile for verification.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Refresh status handler
  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    try {
      await refreshUser();
    } finally {
      setTimeout(() => setRefreshingStatus(false), 600);
    }
  };

  // Delete Account Handler
  const handleDeleteSelf = async () => {
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  const openDogForm = () => {
    if (user.dog?.name) {
      setDogForm({ ...user.dog });
    } else {
      setDogForm({ ...emptyDog });
    }
    setShowDogForm(true);
  };

  const openAddressForm = () => {
    setAddressForm({
      line1: user.address?.line1 || '',
      city: user.address?.city || '',
      province: user.address?.province || '',
      postalCode: user.address?.postalCode || '',
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

  const readDocumentFile = async (file: File): Promise<{ dataUrl: string; docType: 'pdf' | 'image' }> => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, docType: 'pdf' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), docType: 'image' });
          } else {
            resolve({ dataUrl: rawUrl, docType: 'image' });
          }
        };
        img.onerror = () => resolve({ dataUrl: rawUrl, docType: 'image' });
        img.src = rawUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      setDocUploadError('File size is too large (maximum 20MB). Please select a smaller file.');
      return;
    }

    setIsUploadingDoc(true);
    setDocUploadSuccess(null);
    setDocUploadError(null);

    try {
      const fileName = file.name;
      const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      const docType = isPdf ? 'pdf' : 'image';
      let storageId: string | null = null;
      let dataUrl: string | null = null;

      // 1. Try Convex direct file storage first (handles up to 50MB)
      if (convex) {
        try {
          const uploadUrl = await convex.mutation(api.users.generateUploadUrl, {});
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type || (isPdf ? 'application/pdf' : 'image/jpeg') },
            body: file,
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            storageId = data.storageId;
          }
        } catch (storageErr) {
          console.warn('Direct storage upload failed, falling back to data URL:', storageErr);
        }
      }

      // 2. If storageId wasn't obtained, fall back to compressed data URL
      if (!storageId) {
        const fileData = await readDocumentFile(file);
        dataUrl = fileData.dataUrl;
      }

      const updatedVaccines = {
        ...user.vaccines,
        rabiesFileName: fileName,
        dhppFileName: fileName,
        documentUrl: dataUrl || user.vaccines?.documentUrl || null,
        documentType: docType,
        storageId: storageId || undefined,
        status: 'pending' as const,
        verifiedAt: null,
        verifiedBy: null,
      };

      await updateUser({
        vaccines: updatedVaccines,
      });

      setDocUploadSuccess(`Successfully uploaded "${fileName}". Sent for admin verification.`);
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setDocUploadError(err?.message || 'Failed to upload certificate. Please try again.');
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
    try {
      await updateUser({ dog: dogForm, vaccines: user.vaccines });
      setShowDogForm(false);
    } finally {
      setSavingDog(false);
    }
  };

  const currentPlan = STRIPE_PLANS.find(p => p.key === selectedPlan)!;
  const foundingApplies = selectedPlan === 'trial_run' && !!foundingStats?.isOfferActive;
  const bonusSessions = foundingApplies ? (foundingStats?.bonusSessions ?? 0) : 0;
  const requiredCount = currentPlan.sessionsCount + bonusSessions;

  const changePlan = (key: StripePlanKey) => {
    if (!fullLaunchActive && key !== 'trial_run') {
      setCheckoutError('Regular packages unlock at official launch (September 4 at 11:11 AM MDT). Early access is currently open exclusively for Founding Members (Trial Run)!');
      return;
    }
    setSelectedPlan(key);
    setPickedSessions([]);
    setSessionsConfirmed(false);
    setCheckoutError('');
  };

  const handleSavePhone = async () => {
    if (!newPhone.trim() || newPhone.trim().length < 7) {
      setCheckoutError('Please enter a valid phone number with area code (at least 7 digits).');
      return;
    }
    setSavingPhone(true);
    setCheckoutError('');
    try {
      await updateUser({ phone: newPhone.trim() });
      setEditingPhone(false);
      setPhoneSavedMessage('Phone number saved! The owner will personally call this number to schedule your sessions.');
      setTimeout(() => setPhoneSavedMessage(''), 5000);
    } catch {
      setCheckoutError('Failed to save phone number. Please try again.');
    } finally {
      setSavingPhone(false);
    }
  };

  const confirmSessions = () => {
    if (pickedSessions.length === requiredCount) setSessionsConfirmed(true);
  };

  const startCheckout = async () => {
    if (!isAccountVerified) {
      setCheckoutError('Account verification required: Your profile and canine health records must be verified by an admin before you can pay and finalize sessions.');
      return;
    }
    if (!fullLaunchActive && selectedPlan !== 'trial_run') {
      setCheckoutError('Only the Founding Member Trial Run package is available during early access.');
      return;
    }
    if (!fullLaunchActive && foundingStats && foundingStats.remainingCount <= 0) {
      setCheckoutError('All 50 Founding Member spots have been claimed. General booking unlocks on September 4th at 11:11 AM.');
      return;
    }
    if (foundingApplies) {
      if (!user.phone || user.phone.trim().length < 7) {
        setCheckoutError('Please provide and save your phone number in Step 2 so our owner can call you to schedule your 3 sessions.');
        return;
      }
    } else {
      if (!sessionsConfirmed || pickedSessions.length !== requiredCount) {
        setCheckoutError('Confirm your sessions before checkout.');
        return;
      }
    }
    if (!user.legalAccepted || user.legalVersion !== CURRENT_LEGAL_VERSION) {
      setCheckoutError('Accept the current service terms before checkout.');
      return;
    }
    setCheckoutPlan(selectedPlan);
    setCheckoutError('');
    try {
      const sessionsToSend = foundingApplies ? [] : pickedSessions;
      const session = await createCheckoutSession(selectedPlan, sessionsToSend);
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

  const userInitials = user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

  return (
    <div className="min-h-screen bg-[#071A3D] text-white flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Background Ambience / Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#1557B7]/25 blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[400px] rounded-full bg-brand-600/5 blur-[180px]" />
      </div>

      {/* ========================================================================= */}
      {/* 🌟 TOP NAVIGATION & IDENTITY BAR                                         */}
      {/* ========================================================================= */}
      <header className="relative z-10 border-b border-white/10 bg-[#071A3D]/85 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-7 sm:h-8 w-auto transition-transform group-hover:scale-105" />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10">
              Client Portal
            </span>
          </Link>

          {/* User Quick Identity Pill & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account Clearance Pill */}
            {isAccountVerified ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Verified</span>
              </span>
            ) : isProfileSubmitted ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Under Safety Review</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Profile Incomplete</span>
              </span>
            )}

            {/* Refresh Status Button */}
            <button
              onClick={handleRefreshStatus}
              disabled={refreshingStatus}
              title="Refresh Account Status"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingStatus ? 'animate-spin text-brand-400' : ''}`} />
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 p-0.5 shadow-md shadow-brand-500/20">
                <div className="w-full h-full rounded-full bg-[#071A3D] flex items-center justify-center text-xs font-bold text-white font-display">
                  {userInitials}
                </div>
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] text-white/60 truncate max-w-[120px]">{user.email}</p>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-red-400 transition-colors rounded-xl hover:bg-white/5 border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ========================================================================= */}
        {/* 🌟 HERO GREETING & ACCOUNT STATUS OVERVIEW BANNER                        */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0C234E] via-[#091C3F] to-[#06142E] border border-white/15 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <PawPrint className="w-3.5 h-3.5 text-brand-400" />
                  {hasDogVitals ? `${user.dog.name}'s Dashboard` : 'Client Dashboard'}
                </span>
                {foundingApplies && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Founding Member VIP
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-sm text-white/75 mt-1 max-w-xl leading-relaxed">
                Manage your dog profile, submit health records for safety verification, and schedule mobile slatmill sessions.
              </p>
            </div>

            {/* Account Clearance Status Card */}
            <div className="shrink-0 p-4 rounded-2xl bg-[#071A3D]/80 border border-white/10 backdrop-blur-md min-w-[240px]">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block mb-1">
                Account Clearance Status
              </span>
              {isAccountVerified ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verified &amp; Cleared</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 leading-tight">
                    Full access granted to schedule sessions and complete Stripe payment.
                  </p>
                </div>
              ) : isProfileSubmitted ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <span>Under Safety Review</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 leading-tight">
                    Submitted! Waiting for admin certificate &amp; address clearance.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Setup Required</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-tight">
                    Complete all 5 mandatory details below to submit for clearance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📋 MANDATORY PROFILE COMPLETION & ONBOARDING STEPPER                      */}
        {/* ========================================================================= */}
        {!isAccountVerified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 sm:p-6 rounded-3xl bg-[#091D42]/90 border border-brand-500/30 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Step-by-Step Account Verification &amp; Safety Setup
                  </h3>
                  <p className="text-xs text-white/70">
                    All 5 safety items are required by our veterinary guidelines before sessions can be scheduled.
                  </p>
                </div>
              </div>

              {/* Progress Count */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-brand-300">
                  {mandatoryCompletedCount} of {mandatoryTotal} Completed
                </span>
                <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(mandatoryCompletedCount / mandatoryTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 5 Mandatory Micro-Checklist Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* 1. Dog Profile */}
              <div
                onClick={() => { setActiveTab('dog'); if (!hasDogVitals) openDogForm(); }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  hasDogVitals
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60">1. Dog Profile</span>
                  {hasDogVitals ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">
                    {hasDogVitals ? user.dog.name : 'Missing Vitals'}
                  </p>
                  <p className="text-[10px] text-white/60">
                    {hasDogVitals ? `${user.dog.breed} (${user.dog.weight} lbs)` : 'Name, breed, weight, age'}
                  </p>
                </div>
              </div>

              {/* 2. Service Address */}
              <div
                onClick={() => { setActiveTab('account'); if (!hasAddress) openAddressForm(); }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  hasAddress
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60">2. Service Address</span>
                  {hasAddress ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">
                    {hasAddress ? user.address.city : 'No Address Set'}
                  </p>
                  <p className="text-[10px] text-white/60">
                    {hasAddress ? user.address.postalCode : 'Doorstep routing area'}
                  </p>
                </div>
              </div>

              {/* 3. Owner Phone Contact */}
              <div
                onClick={() => { setActiveTab('account'); setEditingPhone(true); }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  hasPhone
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60">3. Phone Number</span>
                  {hasPhone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">
                    {hasPhone ? user.phone : 'Missing Phone'}
                  </p>
                  <p className="text-[10px] text-white/60">
                    {hasPhone ? 'Direct owner contact' : 'For scheduling call'}
                  </p>
                </div>
              </div>

              {/* 4. Vaccine Certificate */}
              <div
                onClick={() => setActiveTab('dog')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  hasVaccines
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60">4. Vaccines &amp; Rabies</span>
                  {hasVaccines ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">
                    {hasVaccines ? (user.vaccines?.status === 'approved' ? '✓ Approved' : 'Uploaded (Pending)') : 'Upload Record'}
                  </p>
                  <p className="text-[10px] text-white/60">
                    Rabies &amp; DHPP document
                  </p>
                </div>
              </div>

              {/* 5. Policy Terms & Waiver */}
              <div
                onClick={() => setActiveTab('account')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  hasLegal
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60">5. Terms &amp; Waiver</span>
                  {hasLegal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">
                    {hasLegal ? 'Accepted' : 'Review Required'}
                  </p>
                  <p className="text-[10px] text-white/60">
                    No-refund policy &amp; waiver
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Creation / Submit Action Banner */}
            <div className="pt-2">
              {profileSuccessMsg && (
                <div className="mb-3 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {!isProfileSubmitted ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/20 via-[#0B2556] to-brand-500/10 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      {allMandatoryComplete
                        ? 'Ready to Submit for Admin Verification!'
                        : 'Complete Mandatory Details to Create & Submit Profile'}
                    </h4>
                    <p className="text-xs text-white/70 max-w-xl">
                      {allMandatoryComplete
                        ? 'All 5 required items are complete. Click the button to create your account profile and submit it to our safety team for clearance.'
                        : `Please fill the remaining ${mandatoryTotal - mandatoryCompletedCount} required item(s) above before you can submit your profile for admin verification.`}
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitProfile}
                    disabled={!allMandatoryComplete || submittingProfile}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    {submittingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create &amp; Submit Account Profile</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#071A3D]/90 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Profile Submitted &amp; Awaiting Admin Clearance</p>
                      <p className="text-xs text-white/70 mt-0.5">
                        Submitted on {user.profileSubmittedAt ? new Date(user.profileSubmittedAt).toLocaleDateString() : 'recently'}. Once an admin approves your vaccine records and account, session booking and payment will unlock automatically.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshingStatus}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin text-brand-400' : ''}`} />
                    <span>Check Clearance Status</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 🗂️ PORTAL NAVIGATION TABS                                                */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#091D42]/80 border border-white/10 backdrop-blur-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 relative ${
              activeTab === 'booking'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings &amp; Schedule</span>
            {!isAccountVerified && (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Account verification required to finalize" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('dog')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 relative ${
              activeTab === 'dog'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <DogIcon className="w-4 h-4" />
            <span>Dog Profile &amp; Vaccines</span>
            {hasVaccines && user.vaccines?.status === 'approved' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-brand-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 relative ${
              activeTab === 'account'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account &amp; Security</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 🏃 TAB 1: SESSIONS & BOOKING                                              */}
        {/* ========================================================================= */}
        {activeTab === 'booking' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Launch Celebration Banner */}
            {!fullLaunchActive ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-brand-500/25 to-amber-500/20 border border-amber-400/50 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mb-1">
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-black font-black text-xs uppercase tracking-wider shrink-0 shadow-md flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        FOUNDING MEMBER EARLY ACCESS
                      </span>
                      <span className="text-xs text-amber-200 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        Launch: {LAUNCH_TIME_LABEL_CANADIAN}
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      Early Access is Open for Founding Members
                    </h3>
                    <p className="text-xs text-white/70 mt-1 max-w-xl">
                      Only the <strong className="text-amber-300">Founding Member Trial Run</strong> (3 runs for $70 CAD) is currently active. General plans unlock at 11:11 AM on September 4th.
                    </p>
                  </div>

                  {/* Countdown Cards */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {[
                      { label: 'Days', val: countdown.days },
                      { label: 'Hrs', val: countdown.hours },
                      { label: 'Mins', val: countdown.minutes },
                      { label: 'Secs', val: countdown.seconds },
                    ].map((u) => (
                      <div key={u.label} className="bg-[#071A3D]/90 border border-white/15 px-2.5 py-2 rounded-xl text-center min-w-[50px]">
                        <span className="font-display font-black text-lg text-white tabular-nums block">{String(u.val).padStart(2, '0')}</span>
                        <span className="text-[9px] uppercase font-bold text-white/60 block">{u.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-200">🚀 Official Launch is Live!</p>
                  <p className="text-xs text-white/70">All fitness packages and custom scheduling windows are now open.</p>
                </div>
              </div>
            )}

            {/* Step 1 — Choose your plan */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white shadow-md shadow-brand-500/20 mb-2">1</span>
                <h2 className="font-display text-2xl font-bold text-white">Choose Your Plan</h2>
                <p className="mt-1 text-xs text-white/70">
                  Select a fitness option below to pick your <span className="font-bold text-brand-400">{requiredCount}</span> session date{requiredCount === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STRIPE_PLANS.map(plan => {
                  const isSelected = selectedPlan === plan.key;
                  const planIsFounding = plan.key === 'trial_run' && !!foundingStats?.isOfferActive;
                  const planSessions = plan.sessionsCount + (planIsFounding ? (foundingStats?.bonusSessions ?? 0) : 0);
                  const isLocked = !fullLaunchActive && plan.key !== 'trial_run';

                  return (
                    <label
                      key={plan.key}
                      onClick={() => {
                        if (isLocked) {
                          setCheckoutError('Regular packages unlock at official launch (September 4 at 11:11 AM MDT). Subscribe with Founding Member Early Access below!');
                          return;
                        }
                        if (!sessionsConfirmed) changePlan(plan.key);
                      }}
                      className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all ${
                        isLocked
                          ? 'cursor-not-allowed opacity-50 border border-white/5 bg-[#06142E]/40'
                          : sessionsConfirmed
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-2 border-brand-500 bg-gradient-to-b from-brand-500/15 via-[#0C244E] to-[#071A3D] shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
                          : !isLocked
                            ? 'border border-white/10 bg-[#071A3D]/70 hover:border-white/20 hover:bg-[#0B2556]'
                            : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-white/80">{plan.name}</span>
                          <div className="relative flex items-center justify-center">
                            <input
                              type="radio"
                              name="stripe_plan"
                              value={plan.key}
                              checked={isSelected}
                              disabled={sessionsConfirmed || isLocked}
                              onChange={() => !isLocked && changePlan(plan.key)}
                              className="h-4 w-4 accent-orange-500"
                            />
                          </div>
                        </div>

                        {planIsFounding && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full mb-2">
                            <Sparkles className="w-3 h-3" />
                            Includes 1 Bonus Run
                          </span>
                        )}

                        <div className="mb-2">
                          <span className="font-display text-2xl font-bold text-white">${plan.price}</span>
                          <span className="text-xs text-white/60 ml-1">CAD</span>
                        </div>

                        <p className="text-xs text-white/70 leading-relaxed">
                          {planSessions} session{planSessions === 1 ? '' : 's'} included
                        </p>
                      </div>

                      {isLocked && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-amber-300/80">
                          <Lock className="w-3 h-3" />
                          <span>Unlocks at launch</span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — Pick & Confirm Sessions (GATED BY ACCOUNT VERIFICATION) */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">2</span>
                <h2 className="font-display text-lg font-bold text-white">
                  {foundingApplies ? 'VIP Personal Scheduling Concierge' : 'Pick & Confirm Your Sessions'}
                </h2>
              </div>

              {/* 🔒 Locked State Overlay if Not Account Verified */}
              {!isAccountVerified && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-white space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Account Verification Required to Finalize Sessions</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Under Alberta veterinary safety protocols, our mobile team reviews your dog's profile and vaccine records before appointments can be confirmed. Complete your profile and wait for admin approval to finalize your calendar slots.
                  </p>
                </div>
              )}

              {foundingApplies ? (
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#071A3D] to-[#071A3D] p-5 text-white shadow-xl space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-brand-500 text-dark-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <PhoneCall className="w-6 h-6 text-dark-950" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-dark-950 text-[10px] font-black uppercase tracking-wider">
                          Exclusive Founding Perk
                        </span>
                        <span className="text-xs text-amber-300 font-bold">Personal Owner Concierge</span>
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        No online calendar picking required!
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
                        As a Founding Member, you do not need to choose dates online. The ZoomieVan owner will <strong>personally call you</strong> to welcome you and personally arrange all <strong>3 of your private slatmill sessions</strong> around your preferred schedule.
                      </p>
                    </div>
                  </div>

                  {/* Verified Phone Contact Card */}
                  <div className="rounded-xl bg-[#06142E]/80 border border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                        Phone Number for Owner’s Call
                      </span>
                      {user.phone ? (
                        <div className="flex items-center gap-2">
                          <p className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                            {user.phone}
                          </p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Verified for Call
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-amber-300">
                          ⚠️ No phone number saved yet. Please enter your number below:
                        </p>
                      )}
                    </div>

                    {!editingPhone ? (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPhone(user.phone || '');
                          setEditingPhone(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition shrink-0"
                      >
                        {user.phone ? 'Update Phone' : 'Enter Phone Number'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+1 (780) 555-0199"
                          className="h-10 px-3 rounded-xl bg-[#06142E] border border-brand-500 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none w-full sm:w-44"
                        />
                        <button
                          type="button"
                          onClick={handleSavePhone}
                          disabled={savingPhone}
                          className="px-3.5 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 text-xs font-bold text-white shrink-0 disabled:opacity-50"
                        >
                          {savingPhone ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhone(false)}
                          className="px-2.5 h-10 rounded-xl bg-white/10 text-xs text-white/60 hover:text-white shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {phoneSavedMessage && (
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {phoneSavedMessage}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className={!isAccountVerified ? 'opacity-40 pointer-events-none' : ''}>
                    {!sessionsConfirmed && (
                      <PickupWindowPicker
                        userFsa={user.address.postalCode?.slice(0, 3) || 'T5H'}
                        requiredCount={requiredCount}
                        picked={pickedSessions}
                        onChange={setPickedSessions}
                      />
                    )}

                    {/* Running summary of picks */}
                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#071A3D]/70 p-4">
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
                        <p className="text-xs text-white/60">No sessions picked yet. Choose {requiredCount} above.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {[...pickedSessions].sort((a, b) => a.date.localeCompare(b.date)).map((s) => (
                            <div key={`${s.date}-${s.timeSlot}`} className="flex items-center justify-between gap-2 rounded-lg bg-[#06142E]/70 px-3 py-2">
                              <span className="flex items-center gap-2 text-xs text-white">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span className="font-medium">{s.date}</span>
                                <span className="text-white/40">·</span>
                                <span>{s.timeSlot}</span>
                              </span>
                              {!sessionsConfirmed && (
                                <button
                                  onClick={() => setPickedSessions(pickedSessions.filter(p => !(p.date === s.date && p.timeSlot === s.timeSlot)))}
                                  className="p-1 text-white/50 hover:text-red-400 transition-colors"
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
                  </div>
                </>
              )}
            </div>

            {/* Step 3 — Pay for your plan (STRICTLY GATED BY ACCOUNT VERIFICATION) */}
            <div className="p-6 bg-gradient-to-br from-brand-500/10 to-[#071A3D] rounded-3xl border border-brand-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">3</span>
                <h2 className="font-display text-lg font-bold text-white">Pay for Your Plan</h2>
              </div>

              {checkoutStatus === 'success' && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Checkout completed! We are confirming your payment and booking.
                </p>
              )}
              {checkoutStatus === 'cancelled' && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Checkout was cancelled. No payment was taken.
                </p>
              )}

              {/* Gated Alert Message */}
              {!isAccountVerified && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-white space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Payment Locked — Admin Account Verification Required</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    You cannot finalize payment until your dog profile and vaccine certificate have been approved by the admin team. Check your verification status above.
                  </p>
                </div>
              )}

              {/* Terms of Service Consent */}
              {!hasLegal && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Service Agreement Required</p>
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/80">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={event => setConsentChecked(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-orange-500"
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/legal/terms" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Terms of Service</Link>
                      {', '}
                      <Link to="/legal/waiver" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Liability Waiver</Link>
                      {' and '}
                      <Link to="/legal/privacy" target="_blank" rel="noreferrer" className="font-semibold text-brand-300 underline">Privacy Policy (Strict No-Refund Policy)</Link>.
                    </span>
                  </label>
                  <button
                    onClick={saveConsent}
                    disabled={!consentChecked || savingConsent}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-dark-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingConsent && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Accept Current Terms
                  </button>
                </div>
              )}

              {foundingApplies ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                  <PhoneCall className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Founding Member Trial Run — 3 sessions included ($70 CAD). The owner will personally call you at {user.phone ? <strong className="text-white">{user.phone}</strong> : 'your phone number'} to arrange all 3 dates.
                  </span>
                </div>
              ) : sessionsConfirmed ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{currentPlan.name} — {requiredCount} session{requiredCount === 1 ? '' : 's'} confirmed, total ${currentPlan.price} CAD.</span>
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-[#071A3D]/70 px-4 py-3 text-xs text-white/60">
                  Confirm your sessions above to continue to payment.
                </p>
              )}

              {/* Stripe Checkout Button */}
              <button
                onClick={startCheckout}
                disabled={
                  !isAccountVerified ||
                  checkoutPlan !== null ||
                  !hasLegal ||
                  !hasDogVitals ||
                  (!foundingApplies && !sessionsConfirmed) ||
                  (!fullLaunchActive && (foundingStats?.remainingCount ?? 1) <= 0) ||
                  (foundingApplies && (!user.phone || user.phone.trim().length < 7))
                }
                className="w-full h-13 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!isAccountVerified ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Locked — Admin Account Verification Required</span>
                  </>
                ) : checkoutPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ${currentPlan.price} CAD with Stripe</span>
                  </>
                )}
              </button>

              {checkoutError && (
                <p className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{checkoutError}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 🐕 TAB 2: DOG PROFILE & VACCINES                                          */}
        {/* ========================================================================= */}
        {activeTab === 'dog' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Dog Profile Dossier Card */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <DogIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Canine Athlete Dossier</h3>
                    <p className="text-xs text-white/70">Dog vitals, exercise temperament, and handler handling notes</p>
                  </div>
                </div>

                <button
                  onClick={openDogForm}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{hasDogVitals ? 'Edit Dog Profile' : 'Add Dog Profile'}</span>
                </button>
              </div>

              {hasDogVitals ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Dog Name</span>
                    <p className="text-lg font-display font-bold text-white">{user.dog.name}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Breed</span>
                    <p className="text-lg font-display font-bold text-white truncate">{user.dog.breed}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Weight &amp; Age</span>
                    <p className="text-lg font-display font-bold text-white">
                      {user.dog.weight} lbs · {user.dog.age} yr{user.dog.age === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Energy Level</span>
                    <p className="text-base font-bold text-brand-300 truncate">
                      {user.dog.energyLevel || 'High'}
                    </p>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Reactivity &amp; Special Handling Notes</span>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {user.dog.reactivityNotes || 'No reactivity issues reported. Friendly with handlers and enthusiastic about workouts.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl bg-[#06142E]/40 border border-dashed border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                    <DogIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Dog Profile Added Yet</h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    Add your dog's name, breed, weight, and age so our mobile handlers can calibrate safe treadmill speeds.
                  </p>
                  <button
                    onClick={openDogForm}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Dog Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Vaccine Certificate & Health Pass Card */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Vaccination Record &amp; Health Clearance</h3>
                    <p className="text-xs text-white/70">Mandatory Rabies &amp; DHPP immunization certificate for mobile van access</p>
                  </div>
                </div>

                {user.vaccines?.status && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 self-start sm:self-auto ${
                    user.vaccines.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : user.vaccines.status === 'rejected'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {user.vaccines.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✓ Verified &amp; Approved</span>
                      </>
                    ) : user.vaccines.status === 'rejected' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>✕ Rejected</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pending Admin Review</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={onFileInputChange}
                className="hidden"
              />

              {docUploadSuccess && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {docUploadSuccess}
                </p>
              )}
              {docUploadError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  {docUploadError}
                </p>
              )}

              {/* File Dropzone / Current Certificate Display */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-[#06142E]/70 p-6 text-center transition hover:border-brand-500/50 hover:bg-[#071A3D]"
              >
                {isUploadingDoc ? (
                  <div className="flex flex-col items-center justify-center py-4 text-brand-400">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p className="text-sm font-semibold">Uploading and securely storing certificate...</p>
                    <p className="text-xs text-white/50 mt-1">Please wait a moment.</p>
                  </div>
                ) : user.vaccines?.rabiesFileName ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-3 rounded-xl bg-brand-500/15 text-brand-400 shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white break-all">{user.vaccines.rabiesFileName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.vaccines.documentType && (
                            <span className="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded">
                              {user.vaccines.documentType}
                            </span>
                          )}
                          <span className="text-xs text-emerald-400 font-medium">
                            {user.vaccines.status === 'approved' ? '✓ Cleared for active workouts' : '⏳ Waiting for admin inspection'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.vaccines.documentUrl && (
                        <a
                          href={user.vaccines.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 px-3.5 py-2 text-xs font-bold text-brand-300 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View Certificate
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 transition"
                      >
                        <Upload className="h-3.5 w-3.5" /> Replace Record
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-white/70">
                    <Upload className="h-8 w-8 text-brand-400 mb-2" />
                    <p className="text-sm font-bold text-white">Click or drag file to upload vaccine record</p>
                    <p className="text-xs text-white/50 mt-1">Supports PDF, PNG, JPG (Max 20MB)</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* ⚙️ TAB 3: ACCOUNT & SECURITY (INCLUDES DANGER ZONE DELETION)               */}
        {/* ========================================================================= */}
        {activeTab === 'account' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Account Details & Address Card */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Personal &amp; Service Profile</h3>
                  <p className="text-xs text-white/70">Manage your owner contact information and service address</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="p-5 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Owner Contact</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-white/60">{user.email}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold text-white/50 block mb-1">Direct Phone</span>
                    {!editingPhone ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-mono font-bold text-white">{user.phone || 'No phone saved'}</p>
                        <button
                          onClick={() => { setNewPhone(user.phone || ''); setEditingPhone(true); }}
                          className="text-xs font-bold text-brand-300 hover:underline"
                        >
                          {user.phone ? 'Edit' : 'Add Phone'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+1 (780) 555-0199"
                          className="h-9 px-3 rounded-xl bg-[#06142E] border border-brand-500 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none flex-1"
                        />
                        <button
                          onClick={handleSavePhone}
                          disabled={savingPhone}
                          className="px-3 h-9 rounded-xl bg-brand-500 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPhone(false)}
                          className="px-2 h-9 text-xs text-white/50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Address Card */}
                <div className="p-5 rounded-2xl bg-[#06142E]/70 border border-white/5 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Van Service Address</span>
                    {hasAddress ? (
                      <div className="space-y-1 mt-2">
                        <p className="text-sm font-bold text-white">{user.address.line1}</p>
                        <p className="text-xs text-white/60">{user.address.city}, {user.address.province} {user.address.postalCode}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Edmonton Route Sector
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-300 mt-2">No service address set yet.</p>
                    )}
                  </div>

                  <button
                    onClick={openAddressForm}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition self-start"
                  >
                    {hasAddress ? 'Edit Service Address' : 'Add Service Address'}
                  </button>
                </div>
              </div>
            </div>

            {/* Legal Agreements & Consent Summary */}
            <div className="p-6 bg-[#091D42]/90 rounded-3xl border border-white/10 shadow-xl space-y-3">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Legal Consent &amp; Policies</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-white">ZoomieVan Terms of Service, Liability Waiver &amp; Strict No-Refund Policy</p>
                  <p className="text-white/60 mt-0.5">Version {user.legalVersion || '2026-07-14'}</p>
                </div>
                {hasLegal ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold self-start sm:self-auto flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Accepted {user.legalAcceptedAt ? `on ${new Date(user.legalAcceptedAt).toLocaleDateString()}` : ''}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold self-start sm:self-auto">
                    Action Required
                  </span>
                )}
              </div>
            </div>

            {/* ⚠️ DANGER ZONE: ACCOUNT DELETION */}
            <div className="p-6 bg-gradient-to-br from-red-950/40 via-[#071A3D] to-[#071A3D] rounded-3xl border border-red-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-400">Danger Zone</span>
                  <h3 className="font-display text-lg font-bold text-white">Permanently Delete Account</h3>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
                Permanently delete your ZoomieVan client account, dog profile, and uploaded vaccine certificates, and cancel any pending session appointments. This action is <strong>irreversible</strong> and cannot be undone.
              </p>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setDeleteConfirmText('');
                    setDeleteError('');
                    setShowDeleteModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 🐾 DOG PROFILE MODAL                                                      */}
      {/* ========================================================================= */}
      {showDogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#091D42] border border-white/15 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-display text-lg font-bold text-white">
                {hasDogVitals ? 'Edit Canine Athlete Profile' : 'Add Canine Athlete'}
              </h2>
              <button onClick={() => setShowDogForm(false)} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-brand-400 font-semibold">* Required fields for safety calibration</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Dog Name <span className="text-red-400 font-bold">*</span></label>
                  <input value={dogForm.name} onChange={e => setDogForm({ ...dogForm, name: e.target.value })} placeholder="Max" className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Breed <span className="text-red-400 font-bold">*</span></label>
                  <input value={dogForm.breed} onChange={e => setDogForm({ ...dogForm, breed: e.target.value })} placeholder="Golden Retriever" className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Weight (lbs) <span className="text-red-400 font-bold">*</span></label>
                  <input type="number" value={dogForm.weight || ''} onChange={e => setDogForm({ ...dogForm, weight: Number(e.target.value) })} placeholder="65" className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Age (years) <span className="text-red-400 font-bold">*</span></label>
                  <input type="number" value={dogForm.age || ''} onChange={e => setDogForm({ ...dogForm, age: Number(e.target.value) })} placeholder="3" className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 uppercase tracking-wider">Energy Level</label>
                <select value={dogForm.energyLevel} onChange={e => setDogForm({ ...dogForm, energyLevel: e.target.value })} className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-brand-500">
                  <option value="">Select...</option>
                  <option>Low — couch potato</option>
                  <option>Moderate — daily walks</option>
                  <option>High — needs serious exercise</option>
                  <option>Extreme — endless energy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 uppercase tracking-wider">Reactivity Notes</label>
                <textarea value={dogForm.reactivityNotes} onChange={e => setDogForm({ ...dogForm, reactivityNotes: e.target.value })} placeholder="Any behavioral notes, fears, or special handling instructions..." className="w-full h-20 bg-[#06142E] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button onClick={() => setShowDogForm(false)} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-white/15 text-white/70 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveDog}
                disabled={!dogForm.name || !dogForm.breed || dogForm.weight <= 0 || dogForm.age <= 0 || savingDog}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-40 flex items-center gap-1.5"
              >
                {savingDog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Dog Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📍 ADDRESS EDIT MODAL                                                     */}
      {/* ========================================================================= */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#091D42] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-display text-lg font-bold text-white">Edit Van Service Address</h2>
              <button onClick={() => setShowAddressForm(false)} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-brand-400 font-semibold">* Required fields for doorstep van arrival</p>
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 uppercase tracking-wider">Street Address <span className="text-red-400 font-bold">*</span></label>
                <input
                  value={addressForm.line1}
                  onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                  placeholder="123 Main St NW"
                  className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">City <span className="text-red-400 font-bold">*</span></label>
                  <input
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Edmonton"
                    className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Province <span className="text-red-400 font-bold">*</span></label>
                  <select
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select</option>
                    {['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Postal Code <span className="text-red-400 font-bold">*</span></label>
                  <input
                    value={addressForm.postalCode}
                    onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value.toUpperCase() })}
                    placeholder="T6W 0L1"
                    className="w-full h-11 bg-[#06142E] border border-white/15 rounded-xl px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowAddressForm(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-xl border border-white/15 text-white/70 hover:bg-white/5 transition-colors"
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

      {/* ========================================================================= */}
      {/* 🗑️ DELETE ACCOUNT CONFIRMATION MODAL (DANGER ZONE)                        */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#091D42] border border-red-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-red-900/30"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30 shadow-inner">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-white/70 mt-2 leading-relaxed">
                  This action is <strong>completely permanent and irreversible</strong>. Your user account, your dog profile, vaccination documents, and all appointment reservations will be permanently wiped from ZoomieVan.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                <p className="text-[11px] text-red-200 leading-snug">
                  ⚠️ Type <strong>DELETE</strong> below to confirm you want to wipe your account:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="mt-2 w-full h-10 px-3 rounded-xl bg-[#06142E] border border-red-500/40 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-red-400 font-semibold">{deleteError}</p>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-[#06142E]/70 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/15 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelf}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 MANDATORY CLIENT SERVICE AGREEMENT MODAL                               */}
      {/* ========================================================================= */}
      {isAgreementRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#091D42] border border-brand-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-brand-500/10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#06142E]/70">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-400">Action Required</span>
                  <h2 className="font-display text-xl font-bold text-white">Client Service Agreement &amp; Policy Waiver</h2>
                </div>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Please scroll to the bottom of the agreement below to review and accept our service terms.
              </p>
            </div>

            {/* Scrollable Agreement Content Container */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed custom-scrollbar" onScroll={handleAgreementScroll}>
              <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 font-medium">
                <strong className="text-red-300 font-bold uppercase tracking-wider block mb-1 text-xs">
                  ⚠️ IMPORTANT: STRICT NO-REFUND POLICY
                </strong>
                All purchases, trial runs, packages, single runs, and service surcharges paid to ZoomieVan Inc. are 100% final and strictly <strong>NON-REFUNDABLE</strong> under any circumstances once payment is completed. Missed appointments, doorstep late cancellations, user scheduling errors, handler safety refusals, or early session stops are non-refundable.
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base border-b border-white/10 pb-1.5 mb-2">1. Scope of Mobile Canine Fitness Services</h3>
                <p>
                  ZoomieVan Inc. provides mobile dog fitness workouts using custom, non-motorized slatmills inside climate-controlled vans delivered directly to your doorstep in active Edmonton and Alberta service sectors. Services are subject to sector scheduling, driver routing, and safe handler evaluation.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base border-b border-white/10 pb-1.5 mb-2">2. Strict Non-Refundable Payment Terms</h3>
                <p>
                  By purchasing any package or booking a run through Stripe, you explicitly agree that all transactions are non-refundable. Package runs carry no cash redemption value and must be used within their designated validity period. Rescheduling must be requested at least 24 hours prior to a scheduled session window.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base border-b border-white/10 pb-1.5 mb-2">3. Canine Health, Vaccinations &amp; Owner Disclosures</h3>
                <p>
                  You certify that your dog is in good physical health and fit for active exercise. You must fully disclose any medical conditions, cardiac or joint history, heat sensitivity, prior injuries, aggression toward humans/dogs, or bite history. Up-to-date Rabies and DHPP vaccination records must be provided prior to service.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base border-b border-white/10 pb-1.5 mb-2">4. Handler Safety Discretion &amp; Session Termination</h3>
                <p>
                  ZoomieVan certified handlers hold sole discretion to adjust treadmill pace, restrict session duration, or stop a session immediately if a dog exhibits signs of severe fatigue, distress, heat exhaustion, or unhandled reactivity. Safety-based session adjustments or stops do not entitle the owner to any refund or credit.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base border-b border-white/10 pb-1.5 mb-2">5. Liability Waiver &amp; Release</h3>
                <p>
                  To the fullest extent permitted under Canadian federal and Alberta law, you waive and release ZoomieVan Inc., its directors, employees, and mobile handlers from any liabilities, claims, injuries, illnesses, or property damage connected with participation in mobile exercise sessions.
                </p>
              </div>

              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300 font-bold text-center">
                ✓ END OF AGREEMENT — Scroll completed. You may now check the declaration below.
              </div>
            </div>

            {/* Scroll Indicator & Checkbox Action Footer */}
            <div className="p-5 border-t border-white/10 bg-[#06142E]/80 space-y-3">
              {!agreementScrolled ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
                  <span>👇 Please scroll to the very bottom of the agreement text to unlock acceptance.</span>
                </div>
              ) : (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={e => setAgreementChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#071A3D] text-brand-500 focus:ring-brand-500/40"
                  />
                  <span className="text-xs text-white leading-tight font-medium">
                    I have read, understood, and agree to the <strong>ZoomieVan Terms of Service, Liability Waiver, and Strict No-Refund Policy (Non-refundable once paid)</strong>.
                  </span>
                </label>
              )}

              <button
                onClick={handleAcceptAgreement}
                disabled={!agreementScrolled || !agreementChecked || submittingAgreement}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-sm font-bold text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingAgreement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Acceptance...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Accept &amp; Continue to Dashboard
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Simple Helper Dog Icon component
function DogIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return <PawPrint className={className} />;
}
