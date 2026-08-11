import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, MapPinned, Star } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { getAllVans } from '../../lib/repositories/fleetRepository';
import { getAllZones } from '../../lib/repositories/fsaRepository';
import { getAllVaccines } from '../../lib/repositories/vaccineRepository';
import { Booking, FleetVan, FSARecord, VaccineRecord } from '../../lib/types';
import { getFoundingMemberStats, setFoundingOfferClosed, FoundingMemberStats } from '../../lib/foundingMembers';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vans, setVans] = useState<FleetVan[]>([]);
  const [zones, setZones] = useState<FSARecord[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [foundingStats, setFoundingStats] = useState<FoundingMemberStats | null>(null);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllBookings(), getAllVans(), getAllZones(), getAllVaccines(), getFoundingMemberStats()]).then(
      ([b, v, z, vac, fStats]) => {
        setBookings(b);
        setVans(v);
        setZones(z);
        setVaccines(vac);
        setFoundingStats(fStats);
        setLoading(false);
      }
    );
  }, []);

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
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.sessionFee + (b.surcharge || 0), 0);
  const scheduledSessions = bookings.filter(b => b.status === 'scheduled').length;
  const completedSessions = bookings.filter(b => b.status === 'completed').length;
  const activeVans = vans.filter(v => v.status === 'Active').length;
  const activeZones = zones.filter(z => z.status === 'active').length;
  const pendingVaccines = vaccines.filter(v => v.status === 'pending').length;
  const uniqueClients = new Set(paidBookings.map(b => b.customerName)).size;

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
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Dashboard</h2>
        <p className="text-dark-300 text-sm mt-1">Real-time overview of your ZoomieVan operations.</p>
      </div>
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

      <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600">
        <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider">Operations &amp; Revenue Overview</p>
        <p className="text-dark-200 text-sm leading-relaxed">
          {activeVans} vans actively serving {activeZones} zones across Edmonton and Alberta.
          {pendingVaccines > 0 && ` ${pendingVaccines} vaccine records pending review.`}
          {' '}Total paid bookings amount to <strong className="text-emerald-300">${totalRevenue.toFixed(2)} CAD</strong> across {paidBookings.length} paid session{paidBookings.length === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  );
}
