import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, ChevronDown, Mail, Phone, MapPin, Dog,
  CheckCircle2, Clock, ShieldCheck, ShieldAlert, Plus, Edit2, Trash2, X, Save,
  Eye, FileText, Check, XCircle, DollarSign,
  ExternalLink, FileCheck2, Shield, AlertCircle, Loader2, Sparkles,
  Calendar, PhoneCall
} from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser, verifyAccount } from '../../lib/repositories/userRepository';
import { getAllPayments } from '../../lib/repositories/paymentRepository';
import { getAllVaccines, approveVaccine, rejectVaccine, addVaccine } from '../../lib/repositories/vaccineRepository';
import { User, Payment, VaccineRecord } from '../../lib/types';

const planStyles: Record<string, string> = {
  package_2: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  package_1: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  trial_run: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
  single_run: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
};

const statusStyles: Record<Payment['status'], string> = {
  paid: 'bg-green-500/10 text-green-400',
  checkout_created: 'bg-amber-500/10 text-amber-400',
  cancelled: 'bg-dark-600 text-dark-300',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-orange-500/10 text-orange-400',
};

const money = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

interface Enriched {
  user: User;
  payments: Payment[];
  currentPlan: Payment | null;
  totalSpent: number;
}

const emptyUserForm = {
  name: '',
  email: '',
  phone: '',
  role: 'customer' as 'customer' | 'admin',
  address: { line1: '', city: 'Edmonton', province: 'AB', postalCode: '' },
  dog: { name: '', breed: '', weight: 30, age: 3, energyLevel: 'High', reactivityNotes: '' },
  password: 'Password123!',
};

const STANDARD_TIME_SLOTS = [
  'Session 1 (9:00 AM – 10:00 AM)',
  'Session 2 (10:00 AM – 11:00 AM)',
  'Session 3 (11:00 AM – 12:00 PM)',
  'Session 4 (1:00 PM – 2:00 PM)',
  'Session 5 (2:00 PM – 3:00 PM)',
  'Session 6 (3:00 PM – 4:00 PM)',
  'Session 7 (4:00 PM – 5:00 PM)',
];

type QueueFilter = 'all' | 'needs_call' | 'scheduled_unpaid' | 'paid' | 'incomplete';

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vaccinesList, setVaccinesList] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Review & Schedule Modal State
  const [schedulingUser, setSchedulingUser] = useState<User | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('Session 2 (10:00 AM – 11:00 AM)');
  const [callConfirmed, setCallConfirmed] = useState<boolean>(true);
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  // User Profile Popup Modal State
  const [viewingUser, setViewingUser] = useState<Enriched | null>(null);
  const [viewingCertUser, setViewingCertUser] = useState<User | null>(null);
  const [blobDocUrl, setBlobDocUrl] = useState<string | null>(null);
  const [verifyingDoc, setVerifyingDoc] = useState(false);
  const [verifyToast, setVerifyToast] = useState<string | null>(null);
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);

  // Safely convert PDF data URLs to Blob URLs so Chromium never blocks the iframe
  useEffect(() => {
    let createdUrl: string | null = null;
    if (!viewingCertUser) {
      setBlobDocUrl(null);
      return;
    }

    const rawUrl = viewingCertUser.vaccines?.documentUrl || null;

    if (rawUrl) {
      if (rawUrl.startsWith('data:application/pdf') || (rawUrl.startsWith('data:') && viewingCertUser.vaccines?.documentType === 'pdf')) {
        try {
          const parts = rawUrl.split(',');
          const base64 = parts[1] || parts[0];
          const binaryStr = atob(base64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(blob);
          setBlobDocUrl(createdUrl);
        } catch (err) {
          console.error('Failed to convert base64 PDF to blob:', err);
          setBlobDocUrl(rawUrl);
        }
      } else {
        setBlobDocUrl(rawUrl);
      }
    } else {
      setBlobDocUrl(null);
    }

    return () => {
      if (createdUrl && createdUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [viewingCertUser]);

  // CRUD Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);

  const reloadData = () => {
    setLoading(true);
    Promise.all([getAllUsers(), getAllPayments(), getAllVaccines()]).then(([u, p, v]) => {
      setUsers(u);
      setPayments(p);
      setVaccinesList(v);
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadData();
  }, []);

  const enriched = useMemo<Enriched[]>(() => {
    return users.map(user => {
      const userPayments = payments
        .filter(p => p.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const paid = userPayments.filter(p => p.status === 'paid');
      return {
        user,
        payments: userPayments,
        currentPlan: paid[0] ?? null,
        totalSpent: paid.reduce((sum, p) => sum + p.amountCents, 0),
      };
    });
  }, [users, payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(({ user }) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesQuery = !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone && user.phone.includes(q)) ||
        (user.dog?.name && user.dog.name.toLowerCase().includes(q)) ||
        (user.address?.postalCode && user.address.postalCode.toLowerCase().includes(q));

      let matchesQueue = true;
      if (queueFilter === 'needs_call') {
        matchesQueue = !!user.profileCompleted && !user.accountVerified;
      } else if (queueFilter === 'scheduled_unpaid') {
        matchesQueue = !!user.accountVerified && !user.hasPaid;
      } else if (queueFilter === 'paid') {
        matchesQueue = !!user.hasPaid;
      } else if (queueFilter === 'incomplete') {
        matchesQueue = !user.profileCompleted;
      }

      return matchesRole && matchesQuery && matchesQueue;
    });
  }, [enriched, query, roleFilter, queueFilter]);

  const queueCounts = useMemo(() => {
    const customers = users.filter(u => u.role !== 'admin');
    return {
      all: users.length,
      needs_call: customers.filter(u => u.profileCompleted && !u.accountVerified).length,
      scheduled_unpaid: customers.filter(u => u.accountVerified && !u.hasPaid).length,
      paid: customers.filter(u => u.hasPaid).length,
      incomplete: customers.filter(u => !u.profileCompleted).length,
    };
  }, [users]);

  // Helper to determine certificate status for a user
  const getCertStatus = (u: User) => {
    if (u.vaccines?.status) {
      if (u.vaccines.status === 'approved') return { status: 'approved', label: 'Verified', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      if (u.vaccines.status === 'rejected') return { status: 'rejected', label: 'Rejected', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
      return { status: 'pending', label: 'Pending Review', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    const matching = vaccinesList.find(
      v => v.ownerName.toLowerCase() === u.name.toLowerCase() ||
           (u.dog?.name && v.dogName.toLowerCase() === u.dog.name.toLowerCase())
    );
    if (matching) {
      if (matching.status === 'approved') return { status: 'approved', label: 'Verified', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      if (matching.status === 'rejected') return { status: 'rejected', label: 'Rejected', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
      return { status: 'pending', label: 'Pending Review', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (u.vaccines?.rabiesFileName || u.vaccines?.dhppFileName) {
      return { status: 'pending', label: 'Pending Review', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    return { status: 'none', label: 'No Cert', badgeClass: 'bg-dark-700 text-dark-400 border-dark-600' };
  };

  // Certificate Verification Handler (Approve / Reject / Reset)
  const handleVerifyCertificate = async (user: User, newStatus: 'approved' | 'rejected' | 'pending') => {
    setVerifyingDoc(true);
    try {
      const nowIso = new Date().toISOString();
      const updatedVaccines = {
        ...user.vaccines,
        rabiesFileName: user.vaccines?.rabiesFileName || 'rabies_dhpp_record.pdf',
        dhppFileName: user.vaccines?.dhppFileName || 'rabies_dhpp_record.pdf',
        status: newStatus,
        verifiedAt: newStatus === 'approved' ? nowIso : null,
        verifiedBy: newStatus === 'approved' ? 'Admin' : null,
      };

      // 1. Update user in repository
      await updateUser(user.id, {
        vaccines: updatedVaccines,
      });

      // 2. Sync with vaccine queue records
      const matchingVaccines = vaccinesList.filter(
        v => v.ownerName.toLowerCase() === user.name.toLowerCase() ||
             (user.dog?.name && v.dogName.toLowerCase() === user.dog.name.toLowerCase())
      );

      if (matchingVaccines.length > 0) {
        for (const rec of matchingVaccines) {
          if (newStatus === 'approved') await approveVaccine(rec.id);
          else if (newStatus === 'rejected') await rejectVaccine(rec.id);
        }
      } else {
        const newRec = await addVaccine({
          dogName: user.dog?.name || 'Dog',
          ownerName: user.name,
          vaccineType: `Rabies + DHPP (${user.vaccines?.rabiesFileName || 'Uploaded'})`,
        });
        if (newStatus === 'approved') await approveVaccine(newRec.id);
        else if (newStatus === 'rejected') await rejectVaccine(newRec.id);
      }

      // 3. Update state in memory
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, vaccines: updatedVaccines } : u));
      if (viewingUser && viewingUser.user.id === user.id) {
        setViewingUser({
          ...viewingUser,
          user: { ...viewingUser.user, vaccines: updatedVaccines },
        });
      }
      if (viewingCertUser && viewingCertUser.id === user.id) {
        setViewingCertUser({ ...viewingCertUser, vaccines: updatedVaccines });
      }

      // Re-fetch vaccines
      getAllVaccines().then(setVaccinesList);

      const actionText = newStatus === 'approved'
        ? `Certificate verified & approved for ${user.dog?.name || user.name}'s dog!`
        : newStatus === 'rejected'
          ? `Certificate marked as rejected for ${user.dog?.name || user.name}.`
          : `Certificate status reset to pending for ${user.dog?.name || user.name}.`;

      if (newStatus === 'approved') {
        setJustApprovedId(user.id);
        setTimeout(() => setJustApprovedId(null), 3000);
      }

      setVerifyToast(actionText);
      setTimeout(() => setVerifyToast(null), 4000);
    } catch (err) {
      console.error('Failed to verify certificate:', err);
    } finally {
      setVerifyingDoc(false);
    }
  };

  // Account Verification Handler (Approves or Revokes customer account clearance)
  const handleVerifyAccount = async (user: User, verified: boolean) => {
    setVerifyingDoc(true);
    try {
      await verifyAccount(user.id, verified);
      const nowIso = new Date().toISOString();
      const updatedUser: User = {
        ...user,
        accountVerified: verified,
        accountVerifiedAt: verified ? nowIso : null,
        accountVerifiedBy: verified ? 'Admin' : null,
      };

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      if (viewingUser && viewingUser.user.id === user.id) {
        setViewingUser({
          ...viewingUser,
          user: updatedUser,
        });
      }
      if (viewingCertUser && viewingCertUser.id === user.id) {
        setViewingCertUser(updatedUser);
      }

      const msg = verified
        ? `Account verified & cleared for ${user.name}! Customer can now book and pay.`
        : `Account verification revoked for ${user.name}.`;
      setVerifyToast(msg);
      setTimeout(() => setVerifyToast(null), 4000);
    } catch (err) {
      console.error('Failed to verify account:', err);
      alert('Failed to update account verification.');
    } finally {
      setVerifyingDoc(false);
    }
  };

  const handleOpenScheduleModal = (u: User) => {
    setSchedulingUser(u);
    if (u.assignedSessionDate) {
      setScheduledDate(u.assignedSessionDate);
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      setScheduledDate(targetDate.toISOString().split('T')[0]);
    }
    setScheduledTimeSlot(u.assignedTimeSlot || 'Session 2 (10:00 AM – 11:00 AM)');
    setCallConfirmed(u.callConfirmed ?? true);
    setScheduleNotes(u.assignedNotes || '');
  };

  const handleSaveScheduleAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingUser) return;
    if (!scheduledDate) {
      alert('Please specify a session date.');
      return;
    }
    if (!callConfirmed) {
      alert('Please confirm the date with the customer via phone call before granting verification.');
      return;
    }

    setSavingSchedule(true);
    try {
      await verifyAccount(schedulingUser.id, true, {
        assignedSessionDate: scheduledDate,
        assignedTimeSlot: scheduledTimeSlot,
        assignedNotes: scheduleNotes.trim() || undefined,
        callConfirmed: true,
      });

      if (schedulingUser.vaccines && schedulingUser.vaccines.status !== 'approved') {
        try {
          await handleVerifyCertificate(schedulingUser, 'approved');
        } catch (cErr) {
          console.warn('Auto-approving certificate alongside verification:', cErr);
        }
      }

      const nowIso = new Date().toISOString();
      const updatedUser: User = {
        ...schedulingUser,
        accountVerified: true,
        accountVerifiedAt: nowIso,
        accountVerifiedBy: 'Admin',
        assignedSessionDate: scheduledDate,
        assignedTimeSlot: scheduledTimeSlot,
        assignedNotes: scheduleNotes.trim() || undefined,
        callConfirmed: true,
        callConfirmedAt: nowIso,
        assignedBy: 'Admin',
      };

      setUsers(prev => prev.map(u => u.id === schedulingUser.id ? updatedUser : u));
      if (viewingUser && viewingUser.user.id === schedulingUser.id) {
        setViewingUser({ ...viewingUser, user: updatedUser });
      }

      setSchedulingUser(null);
      setVerifyToast(`Session scheduled on ${scheduledDate} (${scheduledTimeSlot}) for ${updatedUser.name}! Account verified & payment unlocked.`);
      setTimeout(() => setVerifyToast(null), 5000);
    } catch (err) {
      console.error('Failed to schedule & verify:', err);
      alert('Failed to save schedule and grant verification.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenAddModal = () => {
    setUserForm(emptyUserForm);
    setEditingUser(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'customer',
      address: {
        line1: user.address?.line1 || '',
        city: user.address?.city || 'Edmonton',
        province: user.address?.province || 'AB',
        postalCode: user.address?.postalCode || '',
      },
      dog: {
        name: user.dog?.name || '',
        breed: user.dog?.breed || '',
        weight: user.dog?.weight || 30,
        age: user.dog?.age || 3,
        energyLevel: user.dog?.energyLevel || 'High',
        reactivityNotes: user.dog?.reactivityNotes || '',
      },
      password: '',
    });
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          address: userForm.address,
          dog: userForm.dog,
        });
      } else {
        await createUser({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          address: userForm.address,
          dog: userForm.dog,
          vaccines: { rabiesFileName: '', dhppFileName: '', vetName: '', vetPhone: '' },
          legalAccepted: true,
          legalAcceptedAt: new Date().toISOString(),
          legalVersion: '2026-07-14',
        });
      }
      setShowAddModal(false);
      reloadData();
    } catch (err) {
      console.error('Failed to save user:', err);
      alert('Error saving user account. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser(userId);
      if (viewingUser?.user.id === userId) setViewingUser(null);
      reloadData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High-visibility Floating Toast Alert */}
      <AnimatePresence>
        {verifyToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3.5 px-6 py-4 bg-emerald-950/95 border-2 border-emerald-400 text-white font-bold text-sm rounded-2xl shadow-2xl shadow-emerald-950/80 backdrop-blur-xl pointer-events-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">{verifyToast}</p>
              <p className="text-emerald-300/80 text-[11px] font-medium">Health compliance verified · Dog cleared for fitness sessions</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Users &amp; Customer Accounts</h2>
          <p className="text-dark-300 text-sm mt-1">
            {users.length} registered accounts · {users.filter(u => u.role === 'customer').length} customers · {users.filter(u => u.role === 'admin').length} admins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-sm font-bold text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 DEDICATED SECTION: ONBOARDING, CLEARANCE & SCHEDULING QUEUE HUB         */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border-2 border-brand-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-dark-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-500 p-0.5 shadow-lg shadow-brand-500/20 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-dark-900 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-display font-extrabold text-white">
                  Clearance &amp; Onboarding Queue
                </h3>
                {queueCounts.needs_call > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    {queueCounts.needs_call} To Call &amp; Clear
                  </span>
                )}
              </div>
              <p className="text-xs text-dark-300">
                Review submitted canine profiles, call customer to lock in session date, grant account clearance, and unlock Founding Member payment.
              </p>
            </div>
          </div>

          <div className="text-xs text-dark-400 font-mono bg-dark-900/80 px-3 py-1.5 rounded-xl border border-dark-700 self-start md:self-auto shrink-0">
            Flow: Register → Profile → Call &amp; Date → Verify → Pay ($70) → Confirmed
          </div>
        </div>

        {/* 4 Interactive Queue Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setQueueFilter(queueFilter === 'needs_call' ? 'all' : 'needs_call')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              queueFilter === 'needs_call'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-dark-900/60 border-dark-700 hover:border-amber-500/40 hover:bg-dark-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> Needs Call &amp; Verify
              </span>
              {queueCounts.needs_call > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-display font-extrabold text-white">
              {queueCounts.needs_call}
            </p>
            <p className="text-[10px] text-dark-400 mt-0.5">Profiles ready for phone schedule</p>
          </button>

          <button
            type="button"
            onClick={() => setQueueFilter(queueFilter === 'scheduled_unpaid' ? 'all' : 'scheduled_unpaid')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              queueFilter === 'scheduled_unpaid'
                ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/30'
                : 'bg-dark-900/60 border-dark-700 hover:border-blue-500/40 hover:bg-dark-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Awaiting Payment
              </span>
            </div>
            <p className="text-2xl font-display font-extrabold text-white">
              {queueCounts.scheduled_unpaid}
            </p>
            <p className="text-[10px] text-dark-400 mt-0.5">Scheduled &amp; unlocked for $70 fee</p>
          </button>

          <button
            type="button"
            onClick={() => setQueueFilter(queueFilter === 'paid' ? 'all' : 'paid')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              queueFilter === 'paid'
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-dark-900/60 border-dark-700 hover:border-emerald-500/40 hover:bg-dark-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed &amp; Paid
              </span>
            </div>
            <p className="text-2xl font-display font-extrabold text-white">
              {queueCounts.paid}
            </p>
            <p className="text-[10px] text-dark-400 mt-0.5">Active paid Founding Members</p>
          </button>

          <button
            type="button"
            onClick={() => setQueueFilter(queueFilter === 'incomplete' ? 'all' : 'incomplete')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              queueFilter === 'incomplete'
                ? 'bg-dark-700 border-dark-500 ring-2 ring-dark-500/30'
                : 'bg-dark-900/60 border-dark-700 hover:border-dark-500 hover:bg-dark-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-dark-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Incomplete
              </span>
            </div>
            <p className="text-2xl font-display font-extrabold text-white">
              {queueCounts.incomplete}
            </p>
            <p className="text-[10px] text-dark-400 mt-0.5">Missing dog, cert or address</p>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-dark-400 font-semibold mr-1">Queue Filter:</span>
            {[
              { key: 'all', label: `All Accounts (${queueCounts.all})` },
              { key: 'needs_call', label: `Needs Call & Verify (${queueCounts.needs_call})` },
              { key: 'scheduled_unpaid', label: `Awaiting Payment (${queueCounts.scheduled_unpaid})` },
              { key: 'paid', label: `Confirmed & Paid (${queueCounts.paid})` },
              { key: 'incomplete', label: `Incomplete (${queueCounts.incomplete})` },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setQueueFilter(tab.key as QueueFilter)}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  queueFilter === tab.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-dark-900/80 text-dark-300 hover:text-white border border-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {queueFilter !== 'all' && (
            <button
              onClick={() => setQueueFilter('all')}
              className="text-xs text-brand-400 hover:underline font-semibold"
            >
              Reset Queue Filter
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, dog name, postal code..."
            className="w-full h-11 bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex bg-dark-800 border border-dark-600 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              roleFilter === 'all' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            All ({enriched.length})
          </button>
          <button
            onClick={() => setRoleFilter('customer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              roleFilter === 'customer' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              roleFilter === 'admin' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users List Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-dark-800/40 rounded-2xl border border-dark-700/60">
          <Users className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-sm text-dark-300 font-medium">No matching user accounts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(enrichedItem => {
            const { user, payments: userPayments, currentPlan, totalSpent } = enrichedItem;
            const isOpen = expanded === user.id;
            const cert = getCertStatus(user);

            return (
              <motion.div
                key={user.id}
                layout
                className="bg-dark-800/80 rounded-2xl border border-dark-600 overflow-hidden hover:border-dark-500 transition-colors"
              >
                <div className="flex items-center gap-3 p-3 sm:p-4 text-left">
                  {/* Avatar & User Details */}
                  <button
                    onClick={() => setViewingUser(enrichedItem)}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-600/10 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300 group-hover:scale-105 transition-transform">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                          {user.name}
                        </p>
                        {userPayments.some(p => p.planKey === 'trial_run' && p.status === 'paid') && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-md">
                            ⭐ Founding Member
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-400 truncate">{user.email}</p>
                    </div>

                    {/* Dog & Certificate Status Pill */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      {user.dog?.name ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-dark-700/80 text-dark-200 border border-dark-600 flex items-center gap-1.5">
                          <Dog className="w-3.5 h-3.5 text-brand-400" />
                          <span>{user.dog.name}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs text-dark-500 rounded-xl bg-dark-700/40 border border-dark-700">No Dog</span>
                      )}

                      <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${cert.badgeClass}`}>
                        {cert.status === 'approved' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : cert.status === 'rejected' ? (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : cert.status === 'pending' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-dark-400" />
                        )}
                        <span>{cert.label}</span>
                      </span>
                    </div>

                    {/* Account Clearance Pill */}
                    <div className="hidden lg:flex items-center shrink-0">
                      {user.accountVerified ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Account Cleared</span>
                        </span>
                      ) : user.profileCompleted ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Needs Clearance</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-xl bg-dark-750 text-dark-400 border border-dark-700">
                          Incomplete Profile
                        </span>
                      )}
                    </div>

                    {/* Scheduled Date / Time Slot Pill */}
                    <div className="hidden xl:flex items-center gap-1.5 shrink-0">
                      {user.assignedSessionDate ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30 flex items-center gap-1.5 shadow-sm">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" />
                          <span>{user.assignedSessionDate}</span>
                          {user.hasPaid ? (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">Paid $70</span>
                          ) : (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">Unpaid</span>
                          )}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs text-dark-500 rounded-xl bg-dark-750 border border-dark-700">
                          Not Scheduled
                        </span>
                      )}
                    </div>

                    {/* Plan Badge */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {currentPlan ? (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-xl border ${planStyles[currentPlan.planKey] ?? 'bg-dark-600 text-dark-200 border-dark-500'}`}>
                          {currentPlan.planName}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-xl bg-dark-700 text-dark-400 border border-dark-600">No plan</span>
                      )}
                    </div>

                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold text-white">{money(totalSpent)}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wide font-semibold">total spent</p>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-dark-700">
                    {/* Review & Schedule Action Button */}
                    {!user.accountVerified && user.profileCompleted ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenScheduleModal(user); }}
                        title="Review Canine Profile, Call Customer & Grant Verification"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md transition animate-pulse"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Review &amp; Schedule</span>
                      </button>
                    ) : user.accountVerified ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenScheduleModal(user); }}
                        title={user.assignedSessionDate ? 'Edit Scheduled Session Date & Slot' : 'Set Scheduled Session Date'}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-dark-200 bg-dark-700/90 hover:bg-dark-600 hover:text-white border border-dark-600 rounded-xl transition"
                      >
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        <span className="hidden xl:inline">{user.assignedSessionDate ? 'Edit Date' : 'Schedule'}</span>
                      </button>
                    ) : null}

                    {/* View Profile Popup Button */}
                    <button
                      onClick={() => setViewingUser(enrichedItem)}
                      title="View Full User & Dog Profile"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/25 rounded-xl transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Profile</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(user)}
                      title="Edit User Profile"
                      className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      title="Delete User"
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : user.id)}
                      className="p-2 text-dark-400 hover:text-white rounded-lg transition"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Inline Accordion Preview */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-dark-600 bg-dark-900/40"
                    >
                      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Contact &amp; Profile Details</p>
                            <button
                              onClick={() => setViewingUser(enrichedItem)}
                              className="text-xs font-bold text-brand-400 hover:underline flex items-center gap-1"
                            >
                              Open Full Profile Popup <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <Detail icon={Mail} text={user.email} />
                          <Detail icon={Phone} text={user.phone || 'No phone provided'} />
                          <Detail icon={MapPin} text={[user.address?.line1, user.address?.city, user.address?.province, user.address?.postalCode].filter(Boolean).join(', ') || 'No address set'} />
                          <Detail icon={Dog} text={user.dog?.name ? `${user.dog.name} · ${user.dog.breed || 'Unknown breed'} · ${user.dog.weight || 0}lbs · ${user.dog.age || 0}y` : 'No dog profile set'} />
                          
                          <div className="pt-2 border-t border-dark-700/60">
                            <div className="flex items-center gap-2 text-xs">
                              {user.legalAccepted ? (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                                  <span className="text-green-300 font-medium">
                                    Terms Accepted {user.legalAcceptedAt ? `(${new Date(user.legalAcceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="text-amber-300 font-medium">Terms Acceptance Pending</span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] text-dark-400 mt-1">Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">
                            Purchase &amp; Subscription History ({userPayments.length})
                          </p>
                          {userPayments.length === 0 ? (
                            <p className="text-xs text-dark-400 italic">No package purchases yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {userPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 p-3 bg-dark-800 border border-dark-700/80 rounded-xl">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {p.status === 'paid' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{p.planName}</p>
                                      <p className="text-[10px] text-dark-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${statusStyles[p.status]}`}>
                                      {p.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-white">{money(p.amountCents)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👤 COMPREHENSIVE USER & DOG PROFILE POPUP MODAL                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-dark-850 border border-dark-600 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto"
            >
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-dark-700 bg-gradient-to-r from-dark-800 via-dark-800 to-dark-750 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-display font-black text-xl flex items-center justify-center shadow-lg shadow-brand-500/25 shrink-0 border border-brand-400/30">
                    {initials(viewingUser.user.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                        {viewingUser.user.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-lg border ${
                        viewingUser.user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                      }`}>
                        {viewingUser.user.role}
                      </span>
                      {viewingUser.payments.some(p => p.planKey === 'trial_run' && p.status === 'paid') && (
                        <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 rounded-lg">
                          ⭐ Founding Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-300 mt-1 flex items-center gap-2">
                      <span>Account ID: <code className="text-dark-400">{viewingUser.user.id.slice(0, 8)}...</code></span>
                      <span>·</span>
                      <span>Joined: {new Date(viewingUser.user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(viewingUser.user)}
                    className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewingUser(null)}
                    className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-dark-200">
                
                {/* 1. Contact & Service Location */}
                <div className="p-4 rounded-2xl bg-dark-800/80 border border-dark-700/80">
                  <div className="flex items-center justify-between mb-3 border-b border-dark-700/60 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> Customer Contact &amp; Service Address
                    </span>
                    <span className="text-[11px] text-dark-400">Edmonton Service Territory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-dark-400 font-semibold mb-1">Email Address</p>
                      <a href={`mailto:${viewingUser.user.email}`} className="text-white hover:text-brand-300 font-bold transition flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        {viewingUser.user.email}
                      </a>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-dark-400 font-semibold">Phone Number</p>
                        {viewingUser.payments.some(p => p.planKey === 'trial_run') && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                            📞 Call to Schedule
                          </span>
                        )}
                      </div>
                      {viewingUser.user.phone ? (
                        <a
                          href={`tel:${viewingUser.user.phone}`}
                          className="text-amber-300 hover:text-white font-bold transition flex items-center gap-1.5 text-xs sm:text-sm bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-xl w-fit"
                          title="Click to Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{viewingUser.user.phone}</span>
                        </a>
                      ) : (
                        <span className="text-dark-500 italic">No phone number provided</span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-dark-400 font-semibold mb-1">Physical Delivery Address</p>
                      <p className="text-white font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        {[
                          viewingUser.user.address?.line1,
                          viewingUser.user.address?.city,
                          viewingUser.user.address?.province,
                          viewingUser.user.address?.postalCode
                        ].filter(Boolean).join(', ') || 'No address registered'}
                      </p>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-dark-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {viewingUser.user.legalAccepted ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300 font-medium">
                              Terms &amp; Waiver Accepted {viewingUser.user.legalAcceptedAt ? `(${new Date(viewingUser.user.legalAcceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-amber-300 font-medium">Agreement Pending Consent</span>
                          </>
                        )}
                      </div>
                      <span className="text-dark-400 font-mono text-[10px]">Legal V.{viewingUser.user.legalVersion || '2026-07-14'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dog Profile Details */}
                <div className="p-4 rounded-2xl bg-dark-800/80 border border-dark-700/80">
                  <div className="flex items-center justify-between mb-3 border-b border-dark-700/60 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Dog className="w-4 h-4" /> Dog Profile &amp; Temperament
                    </span>
                    {viewingUser.user.dog?.name && (
                      <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 text-[11px] font-bold">
                        🐾 {viewingUser.user.dog.name}
                      </span>
                    )}
                  </div>

                  {viewingUser.user.dog?.name ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Dog Name</p>
                          <p className="text-white font-bold text-sm mt-0.5">{viewingUser.user.dog.name}</p>
                        </div>
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Breed</p>
                          <p className="text-white font-bold text-sm mt-0.5">{viewingUser.user.dog.breed || 'Mixed / Unknown'}</p>
                        </div>
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Weight</p>
                          <p className="text-white font-bold text-sm mt-0.5">{viewingUser.user.dog.weight || 0} lbs</p>
                        </div>
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Age</p>
                          <p className="text-white font-bold text-sm mt-0.5">{viewingUser.user.dog.age || 0} yrs</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Energy Level</p>
                          <p className="text-white font-bold mt-0.5">{viewingUser.user.dog.energyLevel || 'High'}</p>
                        </div>
                        <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                          <p className="text-dark-400 font-medium text-[10px] uppercase">Veterinary Clinic</p>
                          <p className="text-white font-bold mt-0.5">
                            {viewingUser.user.vaccines?.vetName || 'Edmonton Companion Clinic'}
                            {viewingUser.user.vaccines?.vetPhone && ` · ${viewingUser.user.vaccines.vetPhone}`}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-700/50">
                        <p className="text-dark-400 font-medium text-[10px] uppercase mb-1">Reactivity &amp; Handler Notes</p>
                        <p className="text-dark-200 leading-relaxed">
                          {viewingUser.user.dog.reactivityNotes || 'No reactivity issues reported. Friendly with handlers and enthusiastic about workouts.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-dark-900/40 rounded-xl border border-dark-700/50 text-dark-400 text-xs">
                      No dog profile information has been filled in yet for this customer account.
                    </div>
                  )}
                </div>

                {/* 3. 📄 VACCINE CERTIFICATE VERIFICATION (PRIMARY REQUESTED FEATURE) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-750 border border-brand-500/30 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-dark-700 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Dog Vaccine Certificate &amp; Verification</h4>
                        <p className="text-[11px] text-dark-300">Mandatory Rabies &amp; DHPP immunization certificate review</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {(() => {
                        const cert = getCertStatus(viewingUser.user);
                        return (
                          <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl border flex items-center gap-1.5 ${cert.badgeClass}`}>
                            {cert.status === 'approved' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : cert.status === 'rejected' ? (
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            {cert.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Certificate Information Card */}
                  <div className="p-4 bg-dark-900/80 rounded-xl border border-dark-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        {viewingUser.user.vaccines?.documentUrl ? (
                          <>
                            <p className="text-sm font-bold text-white">
                              {viewingUser.user.vaccines.rabiesFileName || 'Canine Vaccine Document'}
                            </p>
                            <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                              ✓ Real customer document uploaded and available
                            </p>
                          </>
                        ) : viewingUser.user.vaccines?.rabiesFileName ? (
                          <>
                            <p className="text-sm font-bold text-white">
                              {viewingUser.user.vaccines.rabiesFileName}
                            </p>
                            <p className="text-xs text-amber-400 mt-0.5">
                              ⚠️ File registered prior to document storage (no physical file stored)
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-dark-300">
                              No Document Uploaded
                            </p>
                            <p className="text-xs text-dark-500 mt-0.5">
                              Customer has not submitted rabies or DHPP records
                            </p>
                          </>
                        )}
                        <p className="text-[11px] text-dark-400 mt-0.5">
                          Clinic: {viewingUser.user.vaccines?.vetName || 'Not specified'}
                          {viewingUser.user.vaccines?.verifiedAt && (
                            <span className="text-emerald-400 ml-2">
                              · Verified {new Date(viewingUser.user.vaccines.verifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* View Certificate Button */}
                    <button
                      onClick={() => setViewingCertUser(viewingUser.user)}
                      className="px-4 py-2 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                  </div>

                  {/* Admin Verification Controls */}
                  <div className="mt-4 pt-3 border-t border-dark-700/70 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-dark-300">Admin Verification Actions:</span>
                    <div className="flex items-center gap-2">
                      {viewingUser.user.vaccines?.status === 'approved' ? (
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Approved &amp; Cleared</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerifyCertificate(viewingUser.user, 'approved')}
                          disabled={verifyingDoc}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Verify &amp; Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleVerifyCertificate(viewingUser.user, 'rejected')}
                        disabled={verifyingDoc}
                        className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifyCertificate(viewingUser.user, 'pending')}
                        disabled={verifyingDoc}
                        className="px-3 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 text-xs font-semibold transition"
                      >
                        Reset Status
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3b. 🛡️ ACCOUNT VERIFICATION & BOOKING CLEARANCE */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-750 border border-emerald-500/30 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-dark-700 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${viewingUser.user.accountVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Account Clearance &amp; Booking Permission</h4>
                        <p className="text-[11px] text-dark-300">Controls whether this customer is permitted to finalize bookings and pay</p>
                      </div>
                    </div>

                    <div>
                      {viewingUser.user.accountVerified ? (
                        <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Account Verified &amp; Cleared
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Awaiting Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-dark-900/80 rounded-xl border border-dark-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                      <span className="text-dark-400">Profile Submission Status:</span>
                      <span className="font-semibold text-white">
                        {viewingUser.user.profileCompleted ? (
                          <span className="text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Completed &amp; Submitted {viewingUser.user.profileSubmittedAt ? `(${new Date(viewingUser.user.profileSubmittedAt).toLocaleDateString()})` : ''}
                          </span>
                        ) : (
                          <span className="text-dark-400">Not yet submitted by customer</span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                      <span className="text-dark-400">Booking &amp; Stripe Checkout Gate:</span>
                      <span className={`font-bold ${viewingUser.user.accountVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {viewingUser.user.accountVerified ? 'Unlocked (Customer can pay Founding Member $70 CAD)' : 'Locked (Account verification required)'}
                      </span>
                    </div>

                    {/* Assigned Session Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pt-1 border-t border-dark-800">
                      <span className="text-dark-400">Agreed Session Date &amp; Slot:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {viewingUser.user.assignedSessionDate ? (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-brand-400" />
                            <span>{viewingUser.user.assignedSessionDate} · {viewingUser.user.assignedTimeSlot || 'Standard Slot'}</span>
                            {viewingUser.user.callConfirmed && (
                              <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">Call Confirmed ✓</span>
                            )}
                          </>
                        ) : (
                          <span className="text-dark-500 italic">Not scheduled yet</span>
                        )}
                      </span>
                    </div>

                    {/* Payment Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                      <span className="text-dark-400">Founding Member Payment:</span>
                      <span className="font-bold">
                        {viewingUser.user.hasPaid ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid $70 CAD {viewingUser.user.paidAt ? `(${new Date(viewingUser.user.paidAt).toLocaleDateString()})` : ''}
                          </span>
                        ) : (
                          <span className="text-amber-400">Unpaid ($70 CAD pending)</span>
                        )}
                      </span>
                    </div>

                    {viewingUser.user.accountVerified && viewingUser.user.accountVerifiedAt && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="text-dark-400">Cleared By:</span>
                        <span className="text-dark-300">
                          {viewingUser.user.accountVerifiedBy || 'Admin'} on {new Date(viewingUser.user.accountVerifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Admin Verification Buttons */}
                  <div className="mt-3 pt-3 border-t border-dark-700/70 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-dark-300">Account Status Controls:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenScheduleModal(viewingUser.user)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {viewingUser.user.assignedSessionDate ? 'Edit Schedule & Clearance' : 'Schedule Session & Clear'}
                      </button>

                      {viewingUser.user.accountVerified ? (
                        <button
                          onClick={() => handleVerifyAccount(viewingUser.user, false)}
                          disabled={verifyingDoc}
                          className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-amber-300 border border-amber-500/20 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Revoke Clearance
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleVerifyAccount(viewingUser.user, true)}
                            disabled={verifyingDoc}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Verify &amp; Approve Account
                          </button>
                          {viewingUser.user.vaccines?.status !== 'approved' && (
                            <button
                              onClick={async () => {
                                await handleVerifyCertificate(viewingUser.user, 'approved');
                                await handleVerifyAccount(viewingUser.user, true);
                              }}
                              disabled={verifyingDoc}
                              className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Approve Cert &amp; Account
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Purchase & Subscription History */}
                <div className="p-4 rounded-2xl bg-dark-800/80 border border-dark-700/80">
                  <div className="flex items-center justify-between mb-3 border-b border-dark-700/60 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Orders &amp; Subscription History ({viewingUser.payments.length})
                    </span>
                    <span className="text-xs font-bold text-white">
                      Lifetime Spend: <strong className="text-emerald-400">{money(viewingUser.totalSpent)} CAD</strong>
                    </span>
                  </div>

                  {viewingUser.payments.length === 0 ? (
                    <p className="text-xs text-dark-400 italic py-3 text-center">No order or package transactions recorded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {viewingUser.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-3 bg-dark-900/60 border border-dark-700/60 rounded-xl text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.status === 'paid' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{p.planName}</p>
                              <p className="text-[10px] text-dark-400">{new Date(p.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${statusStyles[p.status]}`}>
                              {p.status.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-white">{money(p.amountCents)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-dark-700 bg-dark-800/90 flex items-center justify-between">
                <button
                  onClick={() => {
                    const u = viewingUser.user;
                    setViewingUser(null);
                    handleOpenEditModal(u);
                  }}
                  className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit User Account
                </button>
                <button
                  onClick={() => setViewingUser(null)}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white transition shadow-lg shadow-brand-500/20"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 📜 REAL CERTIFICATE & PDF DOCUMENT VIEWER MODAL                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingCertUser && (() => {
          const hasUserDoc = !!viewingCertUser.vaccines?.documentUrl;
          const isPdf = !!(
            viewingCertUser.vaccines?.documentType === 'pdf' ||
            viewingCertUser.vaccines?.documentUrl?.startsWith('data:application/pdf') ||
            viewingCertUser.vaccines?.rabiesFileName?.toLowerCase().endsWith('.pdf') ||
            (blobDocUrl && blobDocUrl.startsWith('blob:'))
          );

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-900 border border-dark-600 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl my-auto flex flex-col"
              >
                {/* Top Navigation Bar */}
                <div className="p-4 border-b border-dark-700 bg-dark-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-base text-white truncate">
                          {viewingCertUser.vaccines?.rabiesFileName || 'Canine Vaccination Certificate'}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {isPdf ? 'PDF Document' : 'Document Image'}
                        </span>
                        {hasUserDoc && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Uploaded by Customer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-300 truncate">
                        Patient: <strong className="text-white">{viewingCertUser.dog?.name || 'Dog'}</strong> ({viewingCertUser.dog?.breed || 'Canine'}) · Owner: {viewingCertUser.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {blobDocUrl && (
                      <a
                        href={blobDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-xs font-bold text-brand-300 border border-brand-500/30 flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open Full Size</span>
                      </a>
                    )}
                    <button
                      onClick={() => setViewingCertUser(null)}
                      className="px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-bold text-dark-300 hover:text-white flex items-center gap-1.5 transition"
                      title="Exit PDF View"
                    >
                      <X className="w-4 h-4" />
                      <span>Exit PDF View</span>
                    </button>
                  </div>
                </div>

                {/* Document Viewing Area */}
                <div className="p-4 sm:p-6 bg-dark-950 flex-1 overflow-auto flex flex-col items-center justify-center min-h-[50vh] max-h-[70vh]">
                  {blobDocUrl ? (
                    isPdf ? (
                      <div className="w-full h-full min-h-[62vh] rounded-2xl overflow-hidden border border-dark-700 bg-white shadow-xl relative">
                        <object
                          data={blobDocUrl}
                          type="application/pdf"
                          className="w-full h-full min-h-[62vh]"
                        >
                          <iframe
                            src={blobDocUrl}
                            className="w-full h-full min-h-[62vh] border-0 bg-white"
                            title="Vaccine Certificate PDF"
                          />
                        </object>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={blobDocUrl}
                          alt={`Vaccination Document for ${viewingCertUser.dog?.name || 'Canine'}`}
                          className="max-h-[62vh] max-w-full rounded-2xl object-contain shadow-2xl border border-dark-700 bg-white"
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8 max-w-md bg-dark-900/90 rounded-2xl border border-dark-700 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <h5 className="text-base font-bold text-white">No Physical File Stored</h5>
                      {viewingCertUser.vaccines?.rabiesFileName ? (
                        <>
                          <p className="text-xs text-dark-300 leading-relaxed">
                            File name on record: <code className="text-brand-300 font-mono font-semibold">{viewingCertUser.vaccines.rabiesFileName}</code>
                          </p>
                          <p className="text-xs text-dark-400 leading-relaxed">
                            This user registered a file name before full file storage was enabled, so the actual file content was not preserved on the server. Please ask the customer to re-upload their certificate file from their account dashboard.
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-dark-400 leading-relaxed">
                          This customer has not uploaded a vaccine certificate yet. Certificates must be uploaded by the pet owner through their customer account dashboard.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Celebratory Approval In-Modal Banner */}
                <AnimatePresence>
                  {justApprovedId === viewingCertUser.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-emerald-950/95 border-t border-b border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 text-center shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>✓ Certificate verified &amp; approved! Health clearance is active. Returning to profile...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Verification & Exit Controls Bar */}
                <div className="p-4 border-t border-dark-700 bg-dark-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      onClick={() => setViewingCertUser(null)}
                      className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-bold text-white transition flex items-center gap-1.5"
                    >
                      ← Exit PDF View (Back to Profile)
                    </button>
                    {viewingCertUser.vaccines?.status === 'approved' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Verified &amp; Approved
                      </span>
                    ) : (
                      <span className="text-xs text-dark-300">
                        Status: <strong className="text-white uppercase">{viewingCertUser.vaccines?.status || 'Pending'}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {!viewingCertUser.accountVerified && (
                      <button
                        onClick={async () => {
                          await handleVerifyCertificate(viewingCertUser, 'approved');
                          await handleVerifyAccount(viewingCertUser, true);
                          setTimeout(() => {
                            setViewingCertUser(null);
                          }, 1400);
                        }}
                        disabled={verifyingDoc}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        Verify Cert &amp; Clear Account
                      </button>
                    )}
                    {viewingCertUser.vaccines?.status === 'approved' ? (
                      <button
                        onClick={() => setViewingCertUser(null)}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        ✓ Done (Return to Profile)
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await handleVerifyCertificate(viewingCertUser, 'approved');
                          setTimeout(() => {
                            setViewingCertUser(null);
                          }, 1400);
                        }}
                        disabled={verifyingDoc}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {verifyingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Verify &amp; Approve Cert
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await handleVerifyCertificate(viewingCertUser, 'rejected');
                      }}
                      disabled={verifyingDoc}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject Certificate
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 📞 REVIEW, CALL & SCHEDULE SESSION MODAL                                  */}
      {/* ========================================================================= */}
      {schedulingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-600 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-600 flex items-center justify-between bg-dark-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-dark-900 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    Review Profile &amp; Schedule Session
                  </h3>
                  <p className="text-xs text-dark-300">
                    Client: <span className="text-white font-bold">{schedulingUser.name}</span> · Dog: <span className="text-brand-300 font-bold">{schedulingUser.dog?.name || 'Athlete'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSchedulingUser(null)}
                className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleAndVerify} className="p-5 flex-1 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Top Step Banner */}
              <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div className="text-xs text-dark-200 leading-relaxed">
                  <span className="font-bold text-white">Flow Step:</span> Call the customer to agree upon their preferred session date. Once confirmed, specify the date and grant verification. This immediately unlocks the <span className="text-brand-300 font-bold">Founding Member ($70 CAD)</span> payment for their account.
                </div>
              </div>

              {/* Step 1: Customer Phone Call Bar */}
              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      1. Call Customer to Agree on Date
                    </p>
                    <p className="text-xs text-dark-400 mt-0.5">
                      Phone: <span className="text-white font-mono font-bold">{schedulingUser.phone || 'No phone registered'}</span>
                    </p>
                  </div>

                  {schedulingUser.phone ? (
                    <a
                      href={`tel:${schedulingUser.phone}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Call {schedulingUser.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-red-400 font-semibold">Missing phone number</span>
                  )}
                </div>

                <label className="flex items-center gap-2.5 pt-2 border-t border-dark-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={callConfirmed}
                    onChange={e => setCallConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-800 border-dark-600"
                  />
                  <span className="text-xs text-emerald-300 font-semibold">
                    I spoke with {schedulingUser.name} on the phone and confirmed the session date &amp; time slot.
                  </span>
                </label>
              </div>

              {/* Step 2: Canine Records & Vaccine Check */}
              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 space-y-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Dog className="w-3.5 h-3.5 text-brand-400" />
                  2. Canine Health &amp; Vaccine Review
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-dark-800 border border-dark-700/80">
                    <p className="text-[10px] text-dark-400 uppercase font-bold">Dog Name</p>
                    <p className="text-white font-bold mt-0.5">{schedulingUser.dog?.name || 'Unknown'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-dark-800 border border-dark-700/80">
                    <p className="text-[10px] text-dark-400 uppercase font-bold">Breed</p>
                    <p className="text-white font-semibold mt-0.5 truncate">{schedulingUser.dog?.breed || 'Unknown'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-dark-800 border border-dark-700/80">
                    <p className="text-[10px] text-dark-400 uppercase font-bold">Weight &amp; Age</p>
                    <p className="text-white font-semibold mt-0.5">{schedulingUser.dog?.weight || 0} lbs · {schedulingUser.dog?.age || 0} yrs</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-dark-800 border border-dark-700/80">
                    <p className="text-[10px] text-dark-400 uppercase font-bold">Energy Level</p>
                    <p className="text-brand-300 font-semibold mt-0.5">{schedulingUser.dog?.energyLevel || 'Moderate'}</p>
                  </div>
                </div>

                {schedulingUser.dog?.reactivityNotes && (
                  <div className="p-2.5 rounded-xl bg-dark-800/80 border border-dark-700 text-xs">
                    <span className="text-dark-400 font-bold">Behavioral Notes:</span>{' '}
                    <span className="text-dark-200">{schedulingUser.dog.reactivityNotes}</span>
                  </div>
                )}

                {/* Vaccine Record Inspection */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800 border border-dark-700/80 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        {schedulingUser.vaccines?.rabiesFileName || 'Vaccine Document'}
                      </p>
                      <p className="text-[11px] text-dark-400">
                        Status: <span className="font-semibold text-white">{schedulingUser.vaccines?.status || 'Pending'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {schedulingUser.vaccines?.documentUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingCertUser(schedulingUser)}
                        className="px-3 py-1.5 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Certificate
                      </button>
                    )}
                    {schedulingUser.vaccines?.status !== 'approved' && (
                      <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        Will auto-approve on verify
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Session Date & Time Slot */}
              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 space-y-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  3. Specify Agreed Session Date &amp; Pickup Window
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1">
                      Agreed Session Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full h-11 bg-dark-800 border border-dark-600 rounded-xl px-3 text-white text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1">
                      Pickup Window / Time Slot *
                    </label>
                    <select
                      value={scheduledTimeSlot}
                      onChange={e => setScheduledTimeSlot(e.target.value)}
                      className="w-full h-11 bg-dark-800 border border-dark-600 rounded-xl px-3 text-white text-sm focus:outline-none focus:border-brand-500"
                    >
                      {STANDARD_TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">
                    Internal Concierge Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduleNotes}
                    onChange={e => setScheduleNotes(e.target.value)}
                    placeholder="e.g. Park on driveway, dog loves tennis ball warm-up, gate latch instructions..."
                    className="w-full h-10 bg-dark-800 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSchedulingUser(null)}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl border border-dark-600 text-dark-300 hover:text-white transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingSchedule || !scheduledDate}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {savingSchedule ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving &amp; Granting Verification...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Call, Set Date &amp; Grant Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ ADD / EDIT USER ACCOUNT MODAL                                          */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-600 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-dark-600 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-dark-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="(780) 555-0199"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Account Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as 'customer' | 'admin' })}
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="pt-2 border-t border-dark-700/60 space-y-3">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">Address Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={userForm.address.line1}
                      onChange={e => setUserForm({ ...userForm, address: { ...userForm.address, line1: e.target.value } })}
                      placeholder="1234 Jasper Ave"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Postal Code (FSA)</label>
                    <input
                      type="text"
                      value={userForm.address.postalCode}
                      onChange={e => setUserForm({ ...userForm, address: { ...userForm.address, postalCode: e.target.value.toUpperCase() } })}
                      placeholder="T5J 1N1 or T8A 1A1"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white uppercase focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dog Profile Fields */}
              <div className="pt-2 border-t border-dark-700/60 space-y-3">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">Dog Profile</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Dog Name</label>
                    <input
                      type="text"
                      value={userForm.dog.name}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, name: e.target.value } })}
                      placeholder="Max"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Breed</label>
                    <input
                      type="text"
                      value={userForm.dog.breed}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, breed: e.target.value } })}
                      placeholder="Golden Retriever"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      value={userForm.dog.weight}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, weight: Number(e.target.value) } })}
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-dark-600 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-dark-600 text-dark-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-dark-300">
      <Icon className="w-3.5 h-3.5 text-dark-500 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}
