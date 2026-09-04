import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, MapPinned, Star, Rocket, Clock, CheckCircle2 } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { getAllZones } from '../../lib/repositories/fsaRepository';
import { getAllVaccines } from '../../lib/repositories/vaccineRepository';
import { getAllPayments } from '../../lib/repositories/paymentRepository';
import { getAllUsers } from '../../lib/repositories/userRepository';
import { Booking, FSARecord, VaccineRecord, Payment, User } from '../../lib/types';
import { getFoundingMemberStats, setFoundingOfferClosed, FoundingMemberStats } from '../../lib/foundingMembers';
import {
  getTimeUntilLaunch,
  isFullLaunchActive,
  setAdminFullLaunchOverride,
  getAdminFullLaunchOverride,
  CountdownState,
  LAUNCH_TIME_LABEL_CANADIAN,
} from '../../lib/launchConfig';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<FSARecord[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);
  const [countdown, setCountdown] = useState<CountdownState>(() => getTimeUntilLaunch());
  const [isFullLaunch, setIsFullLaunch] = useState<boolean>(() => isFullLaunchActive());
  const [manualOverrideActive, setManualOverrideActive] = useState<boolean>(() => getAdminFullLaunchOverride());
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAll = (initial = false) => {
      if (initial) setLoading(true);
      Promise.all([
        getAllBookings(),
        getAllZones(),
        getAllVaccines(),
        getFoundingMemberStats(),
        getAllPayments(),
        getAllUsers(),
      ])
        .then(([b, z, vac, fStats, p, u]) => {
          if (!active) return;
          setBookings(b);
          setZones(z);
          setVaccines(vac);
          setFoundingStats(fStats);
          setPayments(p);
          setUsers(u);
          if (initial) setLoading(false);
        })
        .catch(() => {
          if (active && initial) setLoading(false);
        });
    };

    loadAll(true);

    const timer = setInterval(() => {
      if (!active) return;
      setCountdown(getTimeUntilLaunch());
      setIsFullLaunch(isFullLaunchActive());
      loadAll(false);
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleToggleFullLaunch = () => {
    const nextState = !isFullLaunch;
    setAdminFullLaunchOverride(nextState);
    setIsFullLaunch(nextState);
    setManualOverrideActive(nextState);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  const paidBookings = bookings.filter(b => b.status === 'scheduled' || b.status === 'completed');

  // 1. Calculate confirmed revenue from payments table
  const paidPayments = payments.filter(p => p.status === 'paid');
  const paymentsTotal = paidPayments.reduce((sum, p) => sum + (p.amountCents / 100), 0);

  // 2. Check any users marked hasPaid: true who might not yet have a record in payments table
  const paidUsersWithoutPaymentRow = users.filter(u =>
    u.hasPaid &&
    !paidPayments.some(p => p.userId === u.id || (p.customerEmail && u.email && p.customerEmail.toLowerCase() === u.email.toLowerCase()))
  );
  const usersTotal = paidUsersWithoutPaymentRow.reduce((sum, u) => {
    const isTrial = u.paidPlanName?.toLowerCase().includes('trial') || u.paidPlanName?.toLowerCase().includes('founding');
    return sum + (isTrial ? 70 : 35);
  }, 0);

  // 3. True paid revenue combines both confirmed payments and paid member accounts
  const totalRevenue = (paymentsTotal + usersTotal) > 0
    ? (paymentsTotal + usersTotal)
    : paidBookings.reduce((sum, b) => sum + b.sessionFee + (b.surcharge || 0), 0);

  const scheduledSessions = bookings.filter(b => b.status === 'scheduled').length;
  const completedSessions = bookings.filter(b => b.status === 'completed').length;
  const activeZones = zones.filter(z => z.status === 'active').length;
  const pendingVaccines = vaccines.filter(v => v.status === 'pending').length;

  const paidCustomerEmails = new Set<string>();
  paidPayments.forEach(p => { if (p.customerEmail) paidCustomerEmails.add(p.customerEmail.toLowerCase()); });
  users.filter(u => u.hasPaid).forEach(u => { if (u.email) paidCustomerEmails.add(u.email.toLowerCase()); });
  paidBookings.forEach(b => { if (b.customerName) paidCustomerEmails.add(b.customerName.toLowerCase()); });
  const uniqueClients = Math.max(paidCustomerEmails.size, paidPayments.length, paidBookings.length > 0 ? 1 : 0);

  const stats = [
    { label: 'Total Paid Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Scheduled (Upcoming)', value: scheduledSessions.toLocaleString(), icon: Activity, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Completed Sessions', value: completedSessions.toLocaleString(), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Paid Clients', value: uniqueClients.toLocaleString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Service Zones', value: activeZones.toLocaleString(), icon: MapPinned, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Pending Vaccines', value: pendingVaccines.toLocaleString(), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Dashboard</h2>
          <p className="text-dark-300 text-sm mt-1">Real-time overview of your ZoomieVan operations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync (3s)</span>
        </div>
      </div>

      {/* 🚀 Launch Operations & Early Access Command Center */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border-2 border-brand-500/40 shadow-2xl space-y-5"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-dark-700/80">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-brand-400" />
                Launch Celebration &amp; Access Control
              </span>
              <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                isFullLaunch
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
              }`}>
                {isFullLaunch ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Launch Active (All Packages Unlocked)
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> Early Access Mode (Founding Members Only)
                  </>
                )}
              </span>
            </div>
            <h3 className="font-display text-xl font-black text-white">
              Official Launch: {LAUNCH_TIME_LABEL_CANADIAN}
            </h3>
            <p className="text-xs text-dark-300 mt-0.5">
              Target Timezone: Edmonton / Mountain Daylight Time (MDT). All normal pricing packages unlock automatically at countdown expiry.
            </p>
          </div>

          {/* Quick Pre-Launch Override Control */}
          <div className="flex flex-col items-start lg:items-end gap-1.5 w-full lg:w-auto">
            <button
              onClick={handleToggleFullLaunch}
              className={`w-full lg:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                isFullLaunch
                  ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-500'
                  : 'bg-gradient-to-r from-brand-600 via-amber-500 to-brand-600 hover:from-brand-500 hover:to-amber-400 text-white shadow-brand-500/20'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>
                {isFullLaunch
                  ? 'Revert to Early Access Only'
                  : 'Activate Full Launch Now (Unlock All Plans)'}
              </span>
            </button>
            <span className="text-[11px] text-dark-400">
              {manualOverrideActive
                ? '⚡ Manual override is active.'
                : '💡 You can click to unlock normal pricing 5 min before 11:11 AM, or let the timer do it.'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Countdown Clock */}
          <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                Launch Countdown Clock
              </span>
              <span className="text-[11px] font-semibold text-brand-400">
                {countdown.isLive ? 'Countdown Reached!' : 'Ticking Live'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Days', val: countdown.days },
                { label: 'Hours', val: countdown.hours },
                { label: 'Mins', val: countdown.minutes },
                { label: 'Secs', val: countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="bg-dark-800 border border-dark-600 rounded-lg py-2 px-1 text-center">
                  <span className="font-display font-black text-xl sm:text-2xl text-white tabular-nums block">
                    {String(unit.val).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-dark-400 block">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Founding Member Live Capping Status */}
          <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Real-Time Founding Members (50 Cap)
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {(foundingStats?.remainingCount ?? 47) <= 0 ? '🛑 Auto-Capped' : '🟢 Live Auto-Cap Active'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-display text-2xl font-black text-white tabular-nums">
                  {foundingStats?.claimedCount ?? 3}
                </span>
                <span className="text-xs text-dark-400 font-bold ml-1">/ 50 Claimed</span>
              </div>
              <span className="text-xs font-extrabold text-amber-300 tabular-nums">
                {foundingStats?.remainingCount ?? 47} Spots Remaining
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-dark-800 rounded-full overflow-hidden border border-dark-600">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (((foundingStats?.claimedCount ?? 3) / 50) * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-dark-400 leading-tight">
              {(foundingStats?.remainingCount ?? 47) <= 0
                ? 'All 50 spots claimed! The system has automatically stopped the founding early access promotion.'
                : 'The system updates this count in real time. Once all 50 spots are claimed, early access automatically stops.'}
            </p>
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 bg-dark-700/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Founding Member Special Tracker Card */}
      {foundingStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl border border-amber-500/30 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-white">Founding Member Offer Tracker</h3>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                    foundingStats.isOfferActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-dark-700 text-dark-400 border-dark-600'
                  }`}>
                    {foundingStats.isOfferActive
                      ? 'ACTIVE'
                      : foundingStats.manuallyClosed
                        ? 'ENDED BY ADMIN'
                        : `COMPLETED (${foundingStats.maxCount}/${foundingStats.maxCount} CLAIMED)`}
                  </span>
                </div>
                <p className="text-xs text-dark-300 mt-0.5">
                  First {foundingStats.maxCount} Trial Run buyers get {foundingStats.bonusSessions} bonus session
                  {foundingStats.bonusSessions === 1 ? '' : 's'} free (3 runs for the price of 2, $70 + tax).
                  Counts paid and in-progress checkouts; abandoned checkouts release their slot.
                </p>
              </div>
            </div>

            <div className="text-right self-end sm:self-center">
              <p className="text-xs text-dark-400 uppercase tracking-wider font-semibold">Claimed Progress</p>
              <p className="text-xl font-black text-amber-400">{foundingStats.claimedCount} / {foundingStats.maxCount} <span className="text-xs font-normal text-dark-300">spots filled</span></p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden p-0.5 border border-dark-600">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-brand-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(foundingStats.claimedCount / foundingStats.maxCount) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-dark-400 font-medium">
              <span>{foundingStats.claimedCount} Claimed</span>
              <span className="text-amber-300 font-bold">{foundingStats.remainingCount} Spots Remaining</span>
              <span>Max {foundingStats.maxCount} Members</span>
            </div>
          </div>

          {/* Offer control — stops the bonus immediately for new checkouts */}
          <div className="mt-4 pt-4 border-t border-dark-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-dark-400">
              {foundingStats.isOfferActive
                ? 'Offer is live. Ending it stops the bonus session for all new checkouts.'
                : foundingStats.manuallyClosed
                  ? 'Offer was ended manually. Reopen to grant the bonus again.'
                  : 'All spots are claimed. The offer closed automatically.'}
            </span>
            {(foundingStats.isOfferActive || foundingStats.manuallyClosed) && (
              <button
                onClick={async () => {
                  setOfferSaving(true);
                  setOfferError('');
                  try {
                    setFoundingStats(await setFoundingOfferClosed(!foundingStats.manuallyClosed));
                  } catch (err) {
                    setOfferError(err instanceof Error ? err.message : 'Could not update the offer.');
                  } finally {
                    setOfferSaving(false);
                  }
                }}
                disabled={offerSaving}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 ${
                  foundingStats.manuallyClosed
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25'
                }`}
              >
                {offerSaving ? 'Saving…' : foundingStats.manuallyClosed ? 'Reopen offer' : 'End offer now'}
              </button>
            )}
          </div>
          {offerError && <p className="mt-2 text-xs text-red-300">{offerError}</p>}
        </motion.div>
      )}

      {/* Recent Payments & Orders Section */}
      <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-dark-300 font-bold uppercase tracking-wider">
              Confirmed Paid Transactions ({paidPayments.length + paidUsersWithoutPaymentRow.length})
            </span>
          </div>
          <span className="text-emerald-400 font-extrabold text-sm">
            Total: ${totalRevenue.toFixed(2)} CAD
          </span>
        </div>

        {paidPayments.length === 0 && paidUsersWithoutPaymentRow.length === 0 ? (
          <p className="text-xs text-dark-400 py-2">No paid transactions recorded yet.</p>
        ) : (
          <div className="divide-y divide-dark-600/60 overflow-hidden rounded-lg border border-dark-600 bg-dark-800/60">
            {paidPayments.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-dark-700/30 transition-colors">
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{p.planName || 'Slatmill Session'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      PAID
                    </span>
                  </div>
                  <p className="text-dark-400 text-[11px] mt-0.5">{p.customerEmail || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${(p.amountCents / 100).toFixed(2)} CAD
                  </span>
                  <p className="text-dark-400 text-[10px] mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {paidUsersWithoutPaymentRow.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between text-xs hover:bg-dark-700/30 transition-colors">
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{u.paidPlanName || 'Founding Member Trial Run'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      PAID
                    </span>
                  </div>
                  <p className="text-dark-400 text-[11px] mt-0.5">{u.email} ({u.name})</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${(u.paidPlanName?.toLowerCase().includes('trial') || u.paidPlanName?.toLowerCase().includes('founding') ? 70 : 35).toFixed(2)} CAD
                  </span>
                  <p className="text-dark-400 text-[10px] mt-0.5">
                    {u.paidAt ? new Date(u.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600">
        <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider">Operations &amp; Revenue Overview</p>
        <p className="text-dark-200 text-sm leading-relaxed">
          {activeZones} service zones active across Edmonton and Alberta.
          {pendingVaccines > 0 && ` ${pendingVaccines} vaccine records pending review.`}
          {' '}Total paid revenue amounts to <strong className="text-emerald-300">${totalRevenue.toFixed(2)} CAD</strong> across {paidPayments.length + paidUsersWithoutPaymentRow.length} confirmed payment{paidPayments.length + paidUsersWithoutPaymentRow.length === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  );
}
