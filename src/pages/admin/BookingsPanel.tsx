import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Filter, PawPrint, User, MapPin, CreditCard, Clock, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Mail, Phone, Trash2, X } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { Booking } from '../../lib/types';
import { api, convex } from '../../lib/convexClient';

export default function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    getAllBookings().then(data => {
      setBookings(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSweepUnpaid = async () => {
    if (!convex) return;
    setSweeping(true);
    setSweepMessage(null);
    try {
      const res = await convex.mutation(api.bookings.cleanOrphanedBookings, {});
      setSweepMessage(`Cleaned ${res.cleanedCount} un-paid test record(s).`);
      fetchBookings();
    } catch (err) {
      setSweepMessage('Sweep completed.');
      fetchBookings();
    } finally {
      setSweeping(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus =
      statusFilter === 'all' ||
      b.status === statusFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      b.customerName?.toLowerCase().includes(query) ||
      b.customerEmail?.toLowerCase().includes(query) ||
      b.dogName?.toLowerCase().includes(query) ||
      b.fsa?.toLowerCase().includes(query) ||
      b.planName?.toLowerCase().includes(query) ||
      b.date?.includes(query);

    return matchesStatus && matchesQuery;
  });

  const totalCount = bookings.length;
  const scheduledCount = bookings.filter(b => b.status === 'scheduled').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending_payment').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-brand-500/15 border-brand-500/40 text-white'
              : 'bg-dark-800/60 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Total Bookings</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('scheduled')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'scheduled'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-dark-800/60 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Scheduled (Paid)</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">{scheduledCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'completed'
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
              : 'bg-dark-800/60 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Completed</span>
          <p className="text-2xl font-black text-blue-300 mt-1">{completedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('pending_payment')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'pending_payment'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : 'bg-dark-800/60 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Payment</span>
          <p className="text-2xl font-black text-amber-300 mt-1">{pendingCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'cancelled'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-dark-800/60 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Cancelled</span>
          <p className="text-2xl font-black text-red-300 mt-1">{cancelledCount}</p>
        </button>
      </div>

      {/* Search Bar & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-dark-800 border border-dark-600 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer, dog, email, date..."
            className="w-full h-10 pl-10 pr-4 bg-dark-900 border border-dark-600 rounded-xl text-xs text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-dark-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-dark-900 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500/50"
          >
            <option value="all">All Statuses ({totalCount})</option>
            <option value="scheduled">Scheduled ({scheduledCount})</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="pending_payment">Pending Payment ({pendingCount})</option>
            <option value="cancelled">Cancelled ({cancelledCount})</option>
          </select>
          <button
            onClick={handleSweepUnpaid}
            disabled={sweeping}
            className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-300 hover:bg-red-500/20 transition disabled:opacity-50 shrink-0"
            title="Clean legacy test reservations created before payment verification"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            {sweeping ? 'Cleaning...' : 'Clean Test Entries'}
          </button>
        </div>
      </div>

      {sweepMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-200 flex items-center justify-between">
          <span>{sweepMessage}</span>
          <button onClick={() => setSweepMessage(null)} className="text-dark-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Booking List Cards */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center bg-dark-800/40 border border-dark-600 rounded-2xl">
            <Calendar className="h-8 w-8 text-dark-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No bookings found</p>
            <p className="text-xs text-dark-400 mt-1">Try adjusting your filter or search criteria.</p>
          </div>
        ) : (
          filteredBookings.map(b => {
            const isExpanded = expandedBookingId === b.id;

            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-dark-600 bg-dark-800/80 transition hover:border-dark-500"
              >
                {/* Main Card Summary */}
                <div
                  onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      <PawPrint className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{b.customerName}</h3>
                        <span className="text-xs font-semibold text-brand-300">({b.dogName})</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-dark-700 text-dark-300 border border-dark-600">
                          {b.fsa || 'FSA N/A'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-dark-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-brand-400" />
                          <strong className="text-white">{b.date}</strong>
                        </span>
                        {b.timeSlot && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-brand-400" />
                            <span>{b.timeSlot}</span>
                          </span>
                        )}
                        {b.planName && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-brand-400" />
                            <span>{b.planName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-dark-700/60">
                    <div className="text-right">
                      <p className="text-base font-black text-white">${b.sessionFee + (b.surcharge || 0)} CAD</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        b.status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        b.status === 'completed' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                        b.status === 'pending_payment' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                        'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {b.status === 'scheduled' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {b.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-blue-400" />}
                        {b.status === 'pending_payment' && <AlertCircle className="h-3 w-3 text-amber-400" />}
                        {b.status === 'cancelled' && <XCircle className="h-3 w-3 text-red-400" />}
                        {b.status === 'scheduled' ? 'Scheduled (Paid)' : b.status}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-dark-700 text-dark-300">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-dark-700/80 bg-dark-900/60 p-4 sm:p-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Customer & Address Details */}
                        <div className="p-3.5 rounded-xl bg-dark-800 border border-dark-600/80 space-y-2">
                          <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-brand-400" />
                            Customer Details
                          </p>
                          <p className="text-dark-200"><strong className="text-white">Name:</strong> {b.customerName}</p>
                          {b.customerEmail && (
                            <p className="text-dark-200 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-dark-400" />
                              {b.customerEmail}
                            </p>
                          )}
                          {b.customerPhone && (
                            <p className="text-dark-200 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-dark-400" />
                              {b.customerPhone}
                            </p>
                          )}
                          <p className="text-dark-200 flex items-start gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                            <span>{b.address || `FSA Sector: ${b.fsa}`}</span>
                          </p>
                        </div>

                        {/* Pet Profile Details */}
                        <div className="p-3.5 rounded-xl bg-dark-800 border border-dark-600/80 space-y-2">
                          <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <PawPrint className="h-3.5 w-3.5 text-brand-400" />
                            Dog Profile Details
                          </p>
                          <p className="text-dark-200"><strong className="text-white">Dog Name:</strong> {b.dogName}</p>
                          {b.dogBreed && <p className="text-dark-200"><strong className="text-white">Breed:</strong> {b.dogBreed}</p>}
                          {b.dogWeight ? <p className="text-dark-200"><strong className="text-white">Weight:</strong> {b.dogWeight} lbs</p> : null}
                          {b.dogAge ? <p className="text-dark-200"><strong className="text-white">Age:</strong> {b.dogAge} years</p> : null}
                          {b.dogEnergy && <p className="text-dark-200"><strong className="text-white">Energy Level:</strong> {b.dogEnergy}</p>}
                        </div>

                        {/* Subscription & Session Details */}
                        <div className="p-3.5 rounded-xl bg-dark-800 border border-dark-600/80 space-y-2">
                          <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-brand-400" />
                            Subscription &amp; Session
                          </p>
                          <p className="text-dark-200"><strong className="text-white">Subscription Plan:</strong> {b.planName || 'Single Session'}</p>
                          <p className="text-dark-200"><strong className="text-white">Session Fee:</strong> ${b.sessionFee} CAD</p>
                          <p className="text-dark-200"><strong className="text-white">Zone Surcharge:</strong> ${b.surcharge || 0} CAD</p>
                          <p className="text-dark-200"><strong className="text-white">Total Amount:</strong> ${b.sessionFee + (b.surcharge || 0)} CAD</p>
                          <p className="text-dark-200"><strong className="text-white">Booking Date:</strong> {b.date}</p>
                          <p className="text-dark-200"><strong className="text-white">Pickup Time Slot:</strong> {b.timeSlot || 'Not assigned'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
