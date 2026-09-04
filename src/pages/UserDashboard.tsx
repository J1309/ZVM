import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, PawPrint, LogOut, Plus, X, Save,
  Loader2, CreditCard, Upload, FileText, CheckCircle2, Sparkles, Star, Clock,
  PhoneCall, AlertCircle, ExternalLink, Trash2, Calendar, Settings,
  Lock, RefreshCw, Search, ChevronDown, Bell,
  Edit2
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

type DashboardTab = 'dashboard' | 'booking' | 'dog' | 'vaccines' | 'account';

export default function UserDashboard() {
  const { user, updateUser, acceptLegal, submitProfile, deleteAccount, refreshUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

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

  // Quick Inline Edit States on Profile Card
  const [editingProfileCard, setEditingProfileCard] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profilePhoneInput, setProfilePhoneInput] = useState('');
  const [smsAlertsActive, setSmsAlertsActive] = useState(true);
  const [savingProfileCard, setSavingProfileCard] = useState(false);

  // Top user menu dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    if (user) {
      setProfileNameInput(user.name || '');
      setProfilePhoneInput(user.phone || '');
    }
  }, [user]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
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
    if (!allMandatoryComplete) {
      alert('Please complete all 5 mandatory details (Dog Vitals, Address, Phone, Vaccines, and Terms) before submitting for verification.');
      return;
    }
    setSubmittingProfile(true);
    setProfileSuccessMsg(null);
    try {
      await submitProfile();
      setProfileSuccessMsg('Profile and canine health details submitted successfully! Our safety team is reviewing your account.');
      setTimeout(() => setProfileSuccessMsg(null), 7000);
    } catch (err: any) {
      console.error('Failed to submit profile:', err);
      alert(err?.message || 'Failed to submit profile for verification.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Quick Save from Profile Card
  const handleSaveProfileCard = async () => {
    setSavingProfileCard(true);
    try {
      await updateUser({
        name: profileNameInput.trim() || user.name,
        phone: profilePhoneInput.trim() || user.phone,
      });
      setEditingProfileCard(false);
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile details.');
    } finally {
      setSavingProfileCard(false);
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

  const userFirstName = user.name.trim().split(' ')[0] || 'Member';
  const userInitials = user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans relative overflow-x-hidden selection:bg-[#FF6B00] selection:text-white">
      {/* ========================================================================= */}
      {/* 🎨 ARTISTIC GEOMETRIC ACCENTS (Directly matching the attached mockup)     */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft atmospheric gradient blurs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#FF6B00]/5 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-[#071A3D]/5 blur-[140px]" />

        {/* Floating Angled Rounded Rectangles/Lozenges (Matching the mockup's bottom-right signature aesthetic) */}
        <div
          className="absolute -bottom-24 -right-24 w-[380px] h-[380px] rounded-[54px] bg-gradient-to-tr from-[#FF6B00] via-[#FF8800] to-[#FFA726] shadow-2xl opacity-90 transform -rotate-12"
          style={{ filter: 'drop-shadow(0 25px 35px rgba(255, 107, 0, 0.35))' }}
        />
        <div
          className="absolute -bottom-16 right-36 w-[280px] h-[280px] rounded-[48px] bg-gradient-to-tr from-[#FF007A] to-[#FF6B00] shadow-xl opacity-80 transform -rotate-[24deg]"
          style={{ filter: 'drop-shadow(0 20px 30px rgba(255, 0, 122, 0.25))' }}
        />
        <div
          className="absolute bottom-24 -right-16 w-[220px] h-[220px] rounded-[40px] bg-gradient-to-br from-[#FFA726] to-[#FF6B00] shadow-lg opacity-75 transform -rotate-6"
        />
      </div>

      <div className="relative z-10 max-w-[1340px] mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ========================================================================= */}
        {/* 🌟 TOP HEADER (Logo, Title, Subtitle, Bell, Avatar, User Dropdown)        */}
        {/* ========================================================================= */}
        <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            {/* Squircle Brand Logo Icon (Matching the mockup's top-left rounded squircle) */}
            <Link to="/" className="group flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-[#FF8800] to-[#FFA726] p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center p-1.5">
                  <img src="/images/zvm_logo.png" alt="ZoomieVan" className="w-7 h-7 object-contain" />
                </div>
              </div>
            </Link>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A3D] tracking-tight leading-tight">
                My ZoomieVan dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Welcome to client fitness &amp; booking portal
              </p>
            </div>
          </div>

          {/* Right Header Controls: Notification Bell, User Avatar, Hello Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4 relative" ref={userMenuRef}>
            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('dashboard')}
              title="Notifications"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#071A3D] transition relative"
            >
              <Bell className="w-4 h-4" />
              {!isAccountVerified && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6B00] ring-2 ring-white" />
              )}
            </button>

            {/* User Dropdown Trigger */}
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 cursor-pointer select-none bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full py-1.5 pl-1.5 pr-3 shadow-sm transition"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#071A3D] p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-black text-[#071A3D] font-display">
                  {userInitials}
                </div>
              </div>

              {/* Hello [Name] with Chevron */}
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Hello {userFirstName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-64 rounded-2xl bg-white border border-slate-200/80 shadow-2xl p-2 z-50 text-slate-800"
                >
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {isAccountVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Client
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Clearance
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setActiveTab('dashboard'); setShowUserDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" /> My Profile
                    </button>
                    <button
                      onClick={() => { setActiveTab('booking'); setShowUserDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Bookings &amp; Schedule
                    </button>
                    <button
                      onClick={() => { handleRefreshStatus(); setShowUserDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Refresh Status
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 🎛️ MAIN CANVAS & SIDEBAR LAYOUT (Directly matching the attached mockup)   */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left Vertical Navigation Rail (Matches the mockup's left sidebar) */}
          <aside className="w-full lg:w-48 xl:w-52 shrink-0 flex lg:flex-col gap-1 sm:gap-1.5 overflow-x-auto pb-2 lg:pb-0 select-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-tr from-[#FF6B00] to-[#FFA726] text-white shadow-sm shadow-orange-500/30'
                  : 'bg-slate-200/70 text-slate-500'
              }`}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span>My dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left whitespace-nowrap ${
                activeTab === 'booking'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Bookings</span>
              {!isAccountVerified && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] ml-auto" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('dog')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left whitespace-nowrap ${
                activeTab === 'dog'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <PawPrint className="w-4 h-4 text-slate-400" />
              <span>Dog Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('vaccines')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left whitespace-nowrap ${
                activeTab === 'vaccines'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Vaccines</span>
              {hasVaccines && user.vaccines?.status === 'approved' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition text-left whitespace-nowrap ${
                activeTab === 'account'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <div className="pt-2 mt-2 border-t border-slate-200/60 hidden lg:block">
              <button
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete Account</span>
              </button>
            </div>
          </aside>

          {/* Center Main Card Container Canvas */}
          <div className="flex-1 w-full rounded-[36px] bg-[#EEF2F6]/75 border border-white/80 p-5 sm:p-7 md:p-8 shadow-sm backdrop-blur-md">

            {/* Notification alert banner if profile incomplete or submitted */}
            {profileSuccessMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🖼️ VIEW 1: MY DASHBOARD (EXACT 2-COLUMN LAYOUT FROM THE ATTACHED IMAGE)    */}
            {/* ========================================================================= */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">

                {/* --------------------------------------------------------------------- */}
                {/* 👤 LEFT COLUMN: TALL PROFILE CARD ("My profile")                      */}
                {/* --------------------------------------------------------------------- */}
                <div className="lg:col-span-5 bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-5">
                  {/* Portrait photo arched / rounded at the top (Matching the mockup) */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-inner group">
                    <img
                      src="/images/how-dog-profile.jpg"
                      alt="Canine Athlete &amp; Owner"
                      className="w-full h-56 sm:h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-[#071A3D] shadow-sm">
                        {user.dog?.name ? `Athlete: ${user.dog.name}` : 'ZoomieVan Client'}
                      </span>
                      {hasDogVitals && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold backdrop-blur-md shadow-sm">
                          {user.dog.breed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Header & Metadata */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-display text-xl font-extrabold text-[#071A3D]">
                          My profile
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {isAccountVerified ? 'Verified Active Client' : (isProfileSubmitted ? 'Submitted for Admin Review' : 'Profile Setup Required')}
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 font-mono leading-tight">
                        <p>Member 2026</p>
                        <p className="text-slate-500 font-bold">Edmonton, AB</p>
                      </div>
                    </div>

                    {/* Form Fields: Minimalist Underline Input Look (Matches image) */}
                    <div className="space-y-3 pt-1">
                      {/* Name Field */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Client Name
                        </span>
                        {editingProfileCard ? (
                          <input
                            type="text"
                            value={profileNameInput}
                            onChange={e => setProfileNameInput(e.target.value)}
                            className="w-full py-1 text-sm font-semibold text-slate-800 border-b-2 border-[#FF6B00] bg-transparent focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-between border-b border-slate-200 py-1">
                            <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                            <button
                              onClick={() => setEditingProfileCard(true)}
                              className="text-slate-400 hover:text-[#FF6B00] transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Phone Number
                        </span>
                        {editingProfileCard ? (
                          <input
                            type="tel"
                            value={profilePhoneInput}
                            onChange={e => setProfilePhoneInput(e.target.value)}
                            placeholder="+1 (780) 555-0199"
                            className="w-full py-1 text-sm font-mono font-semibold text-slate-800 border-b-2 border-[#FF6B00] bg-transparent focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-between border-b border-slate-200 py-1">
                            <span className="text-sm font-mono font-semibold text-slate-800">
                              {user.phone || 'No phone set (Required)'}
                            </span>
                            <button
                              onClick={() => setEditingProfileCard(true)}
                              className="text-slate-400 hover:text-[#FF6B00] transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Email Address
                        </span>
                        <div className="border-b border-slate-200 py-1">
                          <span className="text-sm text-slate-600 truncate block">{user.email}</span>
                        </div>
                      </div>

                      {/* Dog Vitals Quick Note */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Canine Athlete
                        </span>
                        <div className="flex items-center justify-between border-b border-slate-200 py-1">
                          <span className="text-xs text-slate-700 font-medium">
                            {hasDogVitals ? `${user.dog.name} (${user.dog.breed}, ${user.dog.weight} lbs)` : 'Vitals missing — Click to add'}
                          </span>
                          <button
                            onClick={openDogForm}
                            className="text-xs font-bold text-[#FF6B00] hover:underline"
                          >
                            {hasDogVitals ? 'Edit' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {/* SMS & VIP Alerts Switch (Matching the mockup's "SMS alerts activation" toggle) */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          SMS alerts activation
                        </span>
                        <button
                          type="button"
                          onClick={() => setSmsAlertsActive(!smsAlertsActive)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                            smsAlertsActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                              smsAlertsActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Centered Pill Action Button (Matches the mockup's gradient pill "Save" button) */}
                  <div className="pt-3 flex justify-center">
                    {editingProfileCard ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveProfileCard}
                          disabled={savingProfileCard}
                          className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF7A1A] to-[#FFA726] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {savingProfileCard ? 'Saving...' : 'Save Details'}
                        </button>
                        <button
                          onClick={() => setEditingProfileCard(false)}
                          className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : !isProfileSubmitted ? (
                      <button
                        onClick={handleSubmitProfile}
                        disabled={!allMandatoryComplete || submittingProfile}
                        className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF7A1A] to-[#FFA726] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submittingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>{allMandatoryComplete ? 'Submit Profile For Clearance' : 'Create & Submit Profile'}</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingProfileCard(true)}
                        className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF7A1A] to-[#FFA726] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {/* --------------------------------------------------------------------- */}
                {/* 📑 RIGHT COLUMN: TWO STACKED CARDS (Matches mockup right cards)       */}
                {/* --------------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-7">

                  {/* =================================================================== */}
                  {/* 💳 TOP RIGHT CARD: "My ZoomieVan accounts"                          */}
                  {/* =================================================================== */}
                  <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 space-y-4">
                    {/* Header Row: Title on Left, Search & Edit Pill on Right */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-[#071A3D]">
                        My ZoomieVan accounts
                      </h3>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRefreshStatus}
                          disabled={refreshingStatus}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="Refresh status"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveTab('account')}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Row 1: Active Account / Safety Clearance (Matches Mockup's Active Account) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">
                          Active account
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {user.id ? `ZVM-${user.id.slice(0, 12).toUpperCase()}` : 'ZVM-ACCOUNT-8040'}
                        </p>
                      </div>

                      {/* Pill Button (Matches the mockup's colored button) */}
                      {isAccountVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm self-start sm:self-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified &amp; Cleared</span>
                        </span>
                      ) : isProfileSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm self-start sm:self-auto animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Under Review</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (!hasDogVitals) openDogForm();
                            else if (!hasAddress) openAddressForm();
                            else if (!hasVaccines) setActiveTab('vaccines');
                            else handleSubmitProfile();
                          }}
                          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white text-xs font-bold shadow-sm hover:opacity-95 transition self-start sm:self-auto"
                        >
                          Setup Required
                        </button>
                      )}
                    </div>

                    {/* Row 2: Founding Membership Tier */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">
                          Membership Tier
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {foundingApplies ? 'Founding Member (3 Runs for $70 CAD)' : 'Standard Client Account'}
                        </p>
                      </div>

                      {foundingApplies ? (
                        <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#E05D00] text-white text-xs font-bold shadow-sm self-start sm:self-auto">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Founding VIP</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm self-start sm:self-auto">
                          <span>Active Client</span>
                        </span>
                      )}
                    </div>

                    {/* Row 3: Service Address & Sector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">
                          Service Address
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {hasAddress ? `${user.address.line1}, ${user.address.city}` : 'No address set'}
                        </p>
                      </div>

                      <button
                        onClick={openAddressForm}
                        className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition self-start sm:self-auto"
                      >
                        {hasAddress ? 'Doorstep Route' : 'Set Address'}
                      </button>
                    </div>
                  </div>

                  {/* =================================================================== */}
                  {/* 📋 BOTTOM RIGHT CARD: "My fitness records & schedule" ("My bills")   */}
                  {/* =================================================================== */}
                  <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 space-y-4">
                    {/* Header Row: "My bills" style list */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-base sm:text-lg font-extrabold text-[#071A3D]">
                        My fitness records &amp; schedule
                      </h3>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveTab('booking')}
                          className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          Filter by ▾
                        </button>
                      </div>
                    </div>

                    {/* Status List with Colored Dots & Rounded Pill Badges (Matches Mockup) */}
                    <div className="space-y-3 pt-1">

                      {/* 1. Rabies & DHPP Vaccination Certificate */}
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            user.vaccines?.status === 'approved'
                              ? 'bg-emerald-500'
                              : user.vaccines?.rabiesFileName
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-red-400'
                          }`} />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              Vaccination record (Rabies / DHPP)
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              {user.vaccines?.rabiesFileName || 'Mandatory certificate'}
                            </span>
                          </div>
                        </div>

                        {user.vaccines?.status === 'approved' ? (
                          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            Verified
                          </span>
                        ) : user.vaccines?.rabiesFileName ? (
                          <span className="px-4 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                            In review
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveTab('vaccines')}
                            className="px-4 py-1 rounded-full bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition"
                          >
                            Upload record
                          </button>
                        )}
                      </div>

                      {/* 2. Canine Athlete Dossier */}
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            hasDogVitals ? 'bg-emerald-500' : 'bg-red-400'
                          }`} />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              Canine athlete vitals
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              {hasDogVitals ? `${user.dog.name} (${user.dog.weight} lbs)` : 'Weight, age, breed'}
                            </span>
                          </div>
                        </div>

                        {hasDogVitals ? (
                          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            Complete
                          </span>
                        ) : (
                          <button
                            onClick={openDogForm}
                            className="px-4 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm transition"
                          >
                            Add vitals
                          </button>
                        )}
                      </div>

                      {/* 3. Slatmill Fitness Package */}
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            checkoutStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              Slatmill fitness package
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              {foundingApplies ? 'Founding Member Trial ($70)' : currentPlan.name}
                            </span>
                          </div>
                        </div>

                        {checkoutStatus === 'success' ? (
                          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            Paid &amp; Active
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveTab('booking')}
                            className="px-4 py-1 rounded-full bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition"
                          >
                            Select plan
                          </button>
                        )}
                      </div>

                      {/* 4. Personal Concierge Doorstep Scheduling */}
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            hasPhone ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              Doorstep scheduling call
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              {hasPhone ? user.phone : 'Phone required'}
                            </span>
                          </div>
                        </div>

                        {hasPhone ? (
                          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            Call ready
                          </span>
                        ) : (
                          <button
                            onClick={() => setEditingProfileCard(true)}
                            className="px-4 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
                          >
                            Add phone
                          </button>
                        )}
                      </div>

                      {/* 5. Liability Waiver & Service Terms */}
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            hasLegal ? 'bg-emerald-500' : 'bg-red-400'
                          }`} />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">
                              Liability waiver &amp; terms
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              No-refund safety policy
                            </span>
                          </div>
                        </div>

                        {hasLegal ? (
                          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            Signed
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveTab('account')}
                            className="px-4 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm transition"
                          >
                            Sign terms
                          </button>
                        )}
                      </div>

                      {/* 6. Account Deletion Pill */}
                      <div className="flex items-center justify-between gap-3 py-1 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-500" />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-red-600">
                              Permanently delete account
                            </span>
                            <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                              Irreversible data wipe
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setDeleteConfirmText('');
                            setDeleteError('');
                            setShowDeleteModal(true);
                          }}
                          className="px-4 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm transition"
                        >
                          Delete account
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🏃 VIEW 2: BOOKINGS & SCHEDULE (PRESERVING FULL 3-STEP WORKFLOW)           */}
            {/* ========================================================================= */}
            {activeTab === 'booking' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#071A3D]">
                      Bookings &amp; Slatmill Packages
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select your mobile package, configure appointment windows, and finalize through Stripe.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                  >
                    Back to Dashboard
                  </button>
                </div>

                {/* Launch Countdown Banner */}
                {!fullLaunchActive ? (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-[#FF6B00] to-amber-500 text-white shadow-md">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mb-1">
                          <span className="px-3 py-1 rounded-full bg-white text-[#071A3D] font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                            FOUNDING MEMBER EARLY ACCESS
                          </span>
                          <span className="text-xs text-amber-100 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Launch: {LAUNCH_TIME_LABEL_CANADIAN}
                          </span>
                        </div>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                          Early Access is Open for Founding Members
                        </h3>
                        <p className="text-xs text-white/90 mt-1 max-w-xl">
                          Only the <strong>Founding Member Trial Run</strong> (3 runs for $70 CAD) is currently active. General plans unlock at 11:11 AM on September 4th.
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
                          <div key={u.label} className="bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-2 rounded-xl text-center min-w-[50px]">
                            <span className="font-display font-black text-lg text-white tabular-nums block">{String(u.val).padStart(2, '0')}</span>
                            <span className="text-[9px] uppercase font-bold text-white/80 block">{u.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold">🚀 Official Launch is Live!</p>
                      <p className="text-xs text-emerald-700">All fitness packages and custom scheduling windows are now open.</p>
                    </div>
                  </div>
                )}

                {/* Step 1 — Choose your plan */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00] text-xs font-black text-white shadow-md">1</span>
                    <h3 className="font-display text-lg font-bold text-[#071A3D]">Choose Your Plan</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STRIPE_PLANS.map(plan => {
                      const isSelected = selectedPlan === plan.key;
                      const planIsFounding = plan.key === 'trial_run' && !!foundingStats?.isOfferActive;
                      const planSessions = plan.sessionsCount + (planIsFounding ? (foundingStats?.bonusSessions ?? 0) : 0);
                      const isLocked = !fullLaunchActive && plan.key !== 'trial_run';

                      return (
                        <div
                          key={plan.key}
                          onClick={() => {
                            if (isLocked) {
                              setCheckoutError('Regular packages unlock at official launch. Subscribe with Founding Member Early Access below!');
                              return;
                            }
                            if (!sessionsConfirmed) changePlan(plan.key);
                          }}
                          className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all border ${
                            isLocked
                              ? 'cursor-not-allowed opacity-50 bg-slate-50 border-slate-200'
                              : isSelected
                                ? 'border-2 border-[#FF6B00] bg-orange-50/50 shadow-md ring-1 ring-[#FF6B00]/30 cursor-pointer'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-800">{plan.name}</span>
                              <input
                                type="radio"
                                name="stripe_plan_tab"
                                value={plan.key}
                                checked={isSelected}
                                disabled={sessionsConfirmed || isLocked}
                                onChange={() => !isLocked && changePlan(plan.key)}
                                className="h-4 w-4 accent-orange-600"
                              />
                            </div>

                            {planIsFounding && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FF6B00] bg-orange-100 px-2 py-0.5 rounded-full mb-2">
                                <Sparkles className="w-3 h-3" /> Includes 1 Bonus Run
                              </span>
                            )}

                            <div className="mb-2">
                              <span className="font-display text-2xl font-extrabold text-[#071A3D]">${plan.price}</span>
                              <span className="text-xs text-slate-500 ml-1">CAD</span>
                            </div>

                            <p className="text-xs text-slate-600">
                              {planSessions} session{planSessions === 1 ? '' : 's'} included
                            </p>
                          </div>

                          {isLocked && (
                            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1 text-[10px] text-slate-500">
                              <Lock className="w-3 h-3" />
                              <span>Unlocks at launch</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 — Pick & Confirm Sessions (Gated by Account Verification) */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00] text-xs font-black text-white shadow-md">2</span>
                    <h3 className="font-display text-lg font-bold text-[#071A3D]">
                      {foundingApplies ? 'VIP Personal Scheduling Concierge' : 'Pick & Confirm Your Sessions'}
                    </h3>
                  </div>

                  {!isAccountVerified && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Account Verification Required to Finalize Sessions</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Under Alberta canine safety regulations, our mobile van team reviews your dog profile and vaccine records before appointments can be scheduled. Submit your profile and wait for admin approval to finalize your calendar slots.
                      </p>
                    </div>
                  )}

                  {foundingApplies ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FFA726] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                          <PhoneCall className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-wider">
                              Founding Perk
                            </span>
                            <span className="text-xs text-[#071A3D] font-bold">Personal Owner Concierge</span>
                          </div>
                          <h4 className="font-display text-base font-bold text-[#071A3D]">
                            No calendar picking required!
                          </h4>
                          <p className="text-xs text-slate-600 max-w-xl">
                            The ZoomieVan owner will <strong>personally call you</strong> at your phone number to coordinate all <strong>3 of your private mobile slatmill sessions</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner Contact Phone</span>
                          <span className="text-base font-mono font-bold text-[#071A3D]">
                            {user.phone || '⚠️ No phone number saved yet'}
                          </span>
                        </div>

                        <button
                          onClick={() => { setActiveTab('dashboard'); setEditingProfileCard(true); }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition self-start sm:self-auto"
                        >
                          {user.phone ? 'Update Phone' : 'Enter Phone Number'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={!isAccountVerified ? 'opacity-40 pointer-events-none' : ''}>
                      {!sessionsConfirmed && (
                        <PickupWindowPicker
                          userFsa={user.address.postalCode?.slice(0, 3) || 'T5H'}
                          requiredCount={requiredCount}
                          picked={pickedSessions}
                          onChange={setPickedSessions}
                        />
                      )}
                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-slate-800">
                            {sessionsConfirmed ? 'Confirmed sessions' : `${pickedSessions.length} of ${requiredCount} selected`}
                          </p>
                          {sessionsConfirmed && (
                            <button onClick={() => setSessionsConfirmed(false)} className="text-xs font-bold text-[#FF6B00] hover:underline">
                              Edit dates
                            </button>
                          )}
                        </div>
                        {!sessionsConfirmed && (
                          <button
                            onClick={confirmSessions}
                            disabled={pickedSessions.length !== requiredCount}
                            className="w-full mt-2 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs disabled:opacity-40 transition"
                          >
                            Confirm Sessions
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3 — Pay for your plan (STRICTLY GATED BY ACCOUNT VERIFICATION) */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00] text-xs font-black text-white shadow-md">3</span>
                    <h3 className="font-display text-lg font-bold text-[#071A3D]">Pay for Your Plan</h3>
                  </div>

                  {!isAccountVerified && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Payment Locked — Admin Safety Clearance Required</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        You cannot finalize payment until your dog profile and vaccine certificate have been approved by the admin team.
                      </p>
                    </div>
                  )}

                  {/* Terms checkbox if not accepted */}
                  {!hasLegal && (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={e => setConsentChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-orange-600"
                        />
                        <span>
                          I agree to the <Link to="/legal/terms" target="_blank" className="font-bold underline text-[#FF6B00]">Terms of Service</Link>, <Link to="/legal/waiver" target="_blank" className="font-bold underline text-[#FF6B00]">Liability Waiver</Link>, and <Link to="/legal/privacy" target="_blank" className="font-bold underline text-[#FF6B00]">Strict No-Refund Policy</Link>.
                        </span>
                      </label>
                      <button
                        onClick={saveConsent}
                        disabled={!consentChecked || savingConsent}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs disabled:opacity-40"
                      >
                        {savingConsent ? 'Saving...' : 'Accept Current Terms'}
                      </button>
                    </div>
                  )}

                  {/* Checkout Button */}
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
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#FF7A1A] to-[#FFA726] hover:scale-[1.01] active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-orange-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {!isAccountVerified ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Locked — Admin Safety Clearance Required to Pay</span>
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
                    <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{checkoutError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🐕 VIEW 3: DOG PROFILE                                                    */}
            {/* ========================================================================= */}
            {activeTab === 'dog' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#071A3D]">
                      Canine Athlete Dossier
                    </h2>
                    <p className="text-xs text-slate-500">
                      Vitals and behavioral notes used by handlers to calibrate custom slatmill workout speeds.
                    </p>
                  </div>
                  <button
                    onClick={openDogForm}
                    className="px-4 py-2 rounded-full bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{hasDogVitals ? 'Edit Dog Profile' : 'Add Dog Profile'}</span>
                  </button>
                </div>

                {hasDogVitals ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Dog Name</span>
                        <p className="text-lg font-display font-extrabold text-[#071A3D]">{user.dog.name}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Breed</span>
                        <p className="text-lg font-display font-extrabold text-[#071A3D] truncate">{user.dog.breed}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Weight &amp; Age</span>
                        <p className="text-lg font-display font-extrabold text-[#071A3D]">
                          {user.dog.weight} lbs · {user.dog.age} yr{user.dog.age === 1 ? '' : 's'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Energy Level</span>
                        <p className="text-lg font-display font-extrabold text-[#FF6B00]">
                          {user.dog.energyLevel || 'High'}
                        </p>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Reactivity &amp; Special Handling Notes</span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {user.dog.reactivityNotes || 'No reactivity issues reported. Friendly with handlers and enthusiastic about workouts.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-slate-300 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
                      <PawPrint className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-[#071A3D]">No Dog Profile Added Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add your dog's name, breed, weight, and age so our mobile handlers can calibrate safe treadmill speeds.
                    </p>
                    <button
                      onClick={openDogForm}
                      className="px-6 py-2.5 rounded-full bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/25"
                    >
                      Create Dog Profile
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 💉 VIEW 4: VACCINES & HEALTH RECORDS                                      */}
            {/* ========================================================================= */}
            {activeTab === 'vaccines' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#071A3D]">
                      Vaccination Records &amp; Health Clearance
                    </h2>
                    <p className="text-xs text-slate-500">
                      Mandatory Rabies and DHPP immunization certificate for mobile van access.
                    </p>
                  </div>

                  {user.vaccines?.status && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      user.vaccines.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : user.vaccines.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {user.vaccines.status === 'approved' ? '✓ Approved' : user.vaccines.status === 'rejected' ? '✕ Rejected' : 'Pending Review'}
                    </span>
                  )}
                </div>

                {/* Dropzone Container */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={onFileInputChange}
                  className="hidden"
                />

                {docUploadSuccess && (
                  <p className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{docUploadSuccess}</span>
                  </p>
                )}
                {docUploadError && (
                  <p className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{docUploadError}</span>
                  </p>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-[#FF6B00] hover:bg-orange-50/20"
                >
                  {isUploadingDoc ? (
                    <div className="flex flex-col items-center justify-center py-6 text-[#FF6B00]">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p className="text-sm font-semibold">Uploading and securely storing certificate...</p>
                      <p className="text-xs text-slate-500 mt-1">Please wait a moment.</p>
                    </div>
                  ) : user.vaccines?.rabiesFileName ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-3.5 rounded-2xl bg-orange-100 text-[#FF6B00] shrink-0">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 break-all">{user.vaccines.rabiesFileName}</p>
                          <div className="flex items-center gap-2">
                            {user.vaccines.documentType && (
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {user.vaccines.documentType}
                              </span>
                            )}
                            <span className="text-xs text-emerald-600 font-medium">
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#FF6B00] border border-orange-200 px-4 py-2 text-xs font-bold transition"
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
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 text-xs font-bold transition"
                        >
                          <Upload className="h-3.5 w-3.5" /> Replace Record
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-slate-500">
                      <Upload className="h-10 w-10 text-[#FF6B00] mb-3" />
                      <p className="text-sm font-bold text-slate-800">Click or drag file to upload vaccine record</p>
                      <p className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPG (Max 20MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ⚙️ VIEW 5: ACCOUNT & SECURITY (SETTINGS)                                  */}
            {/* ========================================================================= */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#071A3D]">
                      Account Settings &amp; Security
                    </h2>
                    <p className="text-xs text-slate-500">
                      Service address, owner contact info, and legal policies.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                  >
                    Back to Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service Address Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Van Service Address</span>
                      {hasAddress ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-base font-bold text-[#071A3D]">{user.address.line1}</p>
                          <p className="text-xs text-slate-600">{user.address.city}, {user.address.province} {user.address.postalCode}</p>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Edmonton Route Sector
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 mt-2">No service address set yet.</p>
                      )}
                    </div>

                    <button
                      onClick={openAddressForm}
                      className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition self-start"
                    >
                      {hasAddress ? 'Edit Service Address' : 'Add Service Address'}
                    </button>
                  </div>

                  {/* Legal Policies Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Legal Agreement &amp; Policies</span>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-bold text-[#071A3D]">Terms of Service, Liability Waiver &amp; Strict No-Refund Policy</p>
                        <p className="text-xs text-slate-500">Legal Version: {user.legalVersion || CURRENT_LEGAL_VERSION}</p>
                      </div>
                    </div>

                    {hasLegal ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Accepted
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold self-start">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Danger Zone: Permanent Account Deletion */}
                <div className="bg-red-50/50 rounded-3xl border border-red-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                    <Trash2 className="w-4 h-4" />
                    <span>Danger Zone: Permanently Delete Account</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    Permanently delete your ZoomieVan client account, canine athlete records, uploaded vaccine documents, and any appointment reservations. This action is <strong>irreversible</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeleteError('');
                      setShowDeleteModal(true);
                    }}
                    className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🐾 DOG PROFILE MODAL                                                      */}
      {/* ========================================================================= */}
      {showDogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-display text-lg font-bold text-[#071A3D]">
                {hasDogVitals ? 'Edit Canine Athlete Profile' : 'Add Canine Athlete'}
              </h2>
              <button onClick={() => setShowDogForm(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#FF6B00] font-semibold">* Required fields for safety calibration</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Dog Name <span className="text-red-500">*</span></label>
                  <input value={dogForm.name} onChange={e => setDogForm({ ...dogForm, name: e.target.value })} placeholder="Max" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Breed <span className="text-red-500">*</span></label>
                  <input value={dogForm.breed} onChange={e => setDogForm({ ...dogForm, breed: e.target.value })} placeholder="Golden Retriever" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Weight (lbs) <span className="text-red-500">*</span></label>
                  <input type="number" value={dogForm.weight || ''} onChange={e => setDogForm({ ...dogForm, weight: Number(e.target.value) })} placeholder="65" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Age (years) <span className="text-red-500">*</span></label>
                  <input type="number" value={dogForm.age || ''} onChange={e => setDogForm({ ...dogForm, age: Number(e.target.value) })} placeholder="3" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-bold">Energy Level</label>
                <select value={dogForm.energyLevel} onChange={e => setDogForm({ ...dogForm, energyLevel: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00]">
                  <option value="">Select...</option>
                  <option>Low — couch potato</option>
                  <option>Moderate — daily walks</option>
                  <option>High — needs serious exercise</option>
                  <option>Extreme — endless energy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-bold">Reactivity Notes</label>
                <textarea value={dogForm.reactivityNotes} onChange={e => setDogForm({ ...dogForm, reactivityNotes: e.target.value })} placeholder="Any behavioral notes, fears, or special handling instructions..." className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowDogForm(false)} className="px-5 py-2.5 text-sm font-medium rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveDog}
                disabled={!dogForm.name || !dogForm.breed || dogForm.weight <= 0 || dogForm.age <= 0 || savingDog}
                className="px-6 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white hover:opacity-95 transition-all shadow-md shadow-orange-500/20 disabled:opacity-40 flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-display text-lg font-bold text-[#071A3D]">Edit Van Service Address</h2>
              <button onClick={() => setShowAddressForm(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#FF6B00] font-semibold">* Required fields for doorstep van arrival</p>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 font-bold">Street Address <span className="text-red-500">*</span></label>
                <input
                  value={addressForm.line1}
                  onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                  placeholder="123 Main St NW"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">City <span className="text-red-500">*</span></label>
                  <input
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Edmonton"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Province <span className="text-red-500">*</span></label>
                  <select
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">Select</option>
                    {['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold">Postal Code <span className="text-red-500">*</span></label>
                  <input
                    value={addressForm.postalCode}
                    onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value.toUpperCase() })}
                    placeholder="T6W 0L1"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => setShowAddressForm(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAddress}
                disabled={!addressForm.line1 || !addressForm.city || !addressForm.province || !addressForm.postalCode || savingAddress}
                className="px-6 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white hover:opacity-95 transition-all shadow-md shadow-orange-500/20 disabled:opacity-40 flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-red-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-[#071A3D]">Permanently Delete Account?</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  This action is <strong>completely permanent and irreversible</strong>. Your user account, your dog profile, vaccination documents, and all appointment reservations will be permanently wiped.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-left">
                <p className="text-[11px] text-red-800 leading-snug">
                  ⚠️ Type <strong>DELETE</strong> below to confirm you want to wipe your account:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="mt-2 w-full h-10 px-3 rounded-xl bg-white border border-red-300 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-red-500"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-red-600 font-semibold">{deleteError}</p>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="px-5 py-2 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelf}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="px-6 py-2.5 text-xs font-bold rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-md shadow-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Action Required</span>
                  <h2 className="font-display text-xl font-bold text-[#071A3D]">Client Service Agreement &amp; Policy Waiver</h2>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Please scroll to the bottom of the agreement below to review and accept our service terms.
              </p>
            </div>

            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed custom-scrollbar" onScroll={handleAgreementScroll}>
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 font-medium">
                <strong className="text-red-700 font-bold uppercase tracking-wider block mb-1 text-xs">
                  ⚠️ IMPORTANT: STRICT NO-REFUND POLICY
                </strong>
                All purchases, trial runs, packages, single runs, and service surcharges paid to ZoomieVan Inc. are 100% final and strictly <strong>NON-REFUNDABLE</strong> under any circumstances once payment is completed. Missed appointments, doorstep late cancellations, user scheduling errors, handler safety refusals, or early session stops are non-refundable.
              </div>

              <div>
                <h3 className="font-bold text-[#071A3D] text-sm sm:text-base border-b border-slate-100 pb-1.5 mb-2">1. Scope of Mobile Canine Fitness Services</h3>
                <p>
                  ZoomieVan Inc. provides mobile dog fitness workouts using custom, non-motorized slatmills inside climate-controlled vans delivered directly to your doorstep in active Edmonton and Alberta service sectors. Services are subject to sector scheduling, driver routing, and safe handler evaluation.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#071A3D] text-sm sm:text-base border-b border-slate-100 pb-1.5 mb-2">2. Strict Non-Refundable Payment Terms</h3>
                <p>
                  By purchasing any package or booking a run through Stripe, you explicitly agree that all transactions are non-refundable. Package runs carry no cash redemption value and must be used within their designated validity period. Rescheduling must be requested at least 24 hours prior to a scheduled session window.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#071A3D] text-sm sm:text-base border-b border-slate-100 pb-1.5 mb-2">3. Canine Health, Vaccinations &amp; Owner Disclosures</h3>
                <p>
                  You certify that your dog is in good physical health and fit for active exercise. You must fully disclose any medical conditions, cardiac or joint history, heat sensitivity, prior injuries, aggression toward humans/dogs, or bite history. Up-to-date Rabies and DHPP vaccination records must be provided prior to service.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#071A3D] text-sm sm:text-base border-b border-slate-100 pb-1.5 mb-2">4. Handler Safety Discretion &amp; Session Termination</h3>
                <p>
                  ZoomieVan certified handlers hold sole discretion to adjust treadmill pace, restrict session duration, or stop a session immediately if a dog exhibits signs of severe fatigue, distress, heat exhaustion, or unhandled reactivity. Safety-based session adjustments or stops do not entitle the owner to any refund or credit.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#071A3D] text-sm sm:text-base border-b border-slate-100 pb-1.5 mb-2">5. Liability Waiver &amp; Release</h3>
                <p>
                  To the fullest extent permitted under Canadian federal and Alberta law, you waive and release ZoomieVan Inc., its directors, employees, and mobile handlers from any liabilities, claims, injuries, illnesses, or property damage connected with participation in mobile exercise sessions.
                </p>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-[#FF6B00] font-bold text-center">
                ✓ END OF AGREEMENT — Scroll completed. You may now check the declaration below.
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              {!agreementScrolled ? (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
                  <span>👇 Please scroll to the very bottom of the agreement text to unlock acceptance.</span>
                </div>
              ) : (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={e => setAgreementChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]/40"
                  />
                  <span className="text-xs text-slate-800 leading-tight font-medium">
                    I have read, understood, and agree to the <strong>ZoomieVan Terms of Service, Liability Waiver, and Strict No-Refund Policy (Non-refundable once paid)</strong>.
                  </span>
                </label>
              )}

              <button
                onClick={handleAcceptAgreement}
                disabled={!agreementScrolled || !agreementChecked || submittingAgreement}
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-sm font-bold text-white hover:opacity-95 transition-all shadow-md shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
