import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, PawPrint, Clock, ChevronDown, Trash2, X, Plus, Save, RefreshCw
} from 'lucide-react';
import { getAllBookings, updateBookingStatus, createManualBooking, deleteBooking } from '../../lib/repositories/bookingRepository';
import { Booking } from '../../lib/types';
import { api, convex } from '../../lib/convexClient';

const statusBadgeStyles: Record<Booking['status'], string> = {
  scheduled: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  pending_payment: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/20',
};

const emptyBookingForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  dogName: '',
  planName: 'Single Run',
  date: new Date().toISOString().split('T')[0],
  timeSlot: '09:00 AM - 10:00 AM',
  addressLine: '1234 Jasper Ave, Edmonton, AB',
  fsa: 'T5J',
  sessionFee: 35,
  surcharge: 0,
  status: 'scheduled' as Booking['status'],
};

export default function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Sweep state
  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  // New Booking Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [saving, setSaving] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    getAllBookings().then(data => {
      setBookings(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    let active = true;
    fetchBookings();

    const interval = setInterval(() => {
      getAllBookings()
        .then(data => {
          if (!active) return;
          setBookings(data);
        })
        .catch(() => {});
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
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

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    await updateBookingStatus(id, newStatus);
    fetchBookings();
  };

  const handleDeleteBooking = async (id: string, customerName?: string) => {
    if (!confirm(`Delete booking ${id} for ${customerName || 'customer'}?`)) return;
    await deleteBooking(id);
    fetchBookings();
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.customerName || !bookingForm.date) return;
    setSaving(true);
    try {
      await createManualBooking({
        vanId: 'VAN-001',
        customerName: bookingForm.customerName,
        customerEmail: bookingForm.customerEmail,
        customerPhone: bookingForm.customerPhone,
        dogName: bookingForm.dogName,
        planName: bookingForm.planName,
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        fsa: bookingForm.fsa,
        sessionFee: bookingForm.sessionFee,
        surcharge: bookingForm.surcharge,
        status: bookingForm.status,
      });
      setShowAddModal(false);
      setBookingForm(emptyBookingForm);
      fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-dark-700/30 animate-pulse rounded-2xl" />
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Scheduled</span>
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending Pay</span>
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

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, dog, plan, FSA, date..."
            className="w-full h-11 bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {convex && (
            <button
              onClick={handleSweepUnpaid}
              disabled={sweeping}
              className="h-11 px-4 rounded-xl bg-dark-800 border border-dark-600 text-xs font-semibold text-dark-200 hover:text-white hover:bg-dark-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sweeping ? 'animate-spin' : ''}`} />
              Sweep Un-paid
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-sm font-bold text-white hover:from-brand-500 hover:to-brand-400 transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {sweepMessage && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs rounded-xl flex items-center justify-between">
          <span>{sweepMessage}</span>
          <button onClick={() => setSweepMessage(null)} className="text-dark-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-dark-800/40 rounded-2xl border border-dark-700/60">
          <Calendar className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-sm text-dark-300 font-medium">No bookings match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(b => {
            const isExpanded = expandedBookingId === b.id;
            return (
              <motion.div
                key={b.id}
                layout
                className="bg-dark-800/80 rounded-2xl border border-dark-600 overflow-hidden hover:border-dark-500 transition-colors"
              >
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 font-bold text-xs">
                      {b.fsa || 'FSA'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{b.customerName || 'Customer'}</span>
                        {b.dogName && (
                          <span className="text-xs text-brand-300 font-medium flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                            <PawPrint className="w-3 h-3" /> {b.dogName}
                          </span>
                        )}
                        {b.planName && (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 uppercase tracking-wider">
                            {b.planName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-dark-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-dark-500" /> {b.date}
                        </span>
                        {b.timeSlot && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-dark-500" /> {b.timeSlot}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={b.status}
                      onChange={e => handleStatusChange(b.id, e.target.value as Booking['status'])}
                      className={`h-9 px-3 text-xs font-bold rounded-xl border focus:outline-none cursor-pointer ${statusBadgeStyles[b.status]}`}
                    >
                      <option value="scheduled" className="bg-dark-900 text-emerald-300">Scheduled</option>
                      <option value="completed" className="bg-dark-900 text-blue-300">Completed</option>
                      <option value="pending_payment" className="bg-dark-900 text-amber-300">Pending Pay</option>
                      <option value="cancelled" className="bg-dark-900 text-red-300">Cancelled</option>
                    </select>

                    <button
                      onClick={() => handleDeleteBooking(b.id, b.customerName)}
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                      className="p-2 text-dark-400 hover:text-white rounded-lg transition"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Booking Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-dark-600 bg-dark-900/50 p-4 space-y-3 text-xs text-dark-300"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold mb-1">Customer &amp; Contact</p>
                          <p className="text-white font-medium">{b.customerName || 'N/A'}</p>
                          <p className="text-dark-400">{b.customerEmail || 'No email'}</p>
                          <p className="text-dark-400">{b.customerPhone || 'No phone'}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Service Zone (FSA: {b.fsa || 'T5J'})</p>
                          <p className="text-brand-400">Assigned Van: {b.vanId || 'VAN-001'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-dark-700/60 flex items-center justify-between text-xs">
                        <span className="text-dark-400">Booking ID: <code className="text-white font-mono">{b.id}</code></span>
                        <span className="font-bold text-white">Fee: ${b.sessionFee || 35}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Manual Booking Creation Modal */}
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
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Create Manual Session Booking</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-dark-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    placeholder="Sarah Connor"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={e => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                    placeholder="sarah@example.com"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Dog Name</label>
                  <input
                    type="text"
                    value={bookingForm.dogName}
                    onChange={e => setBookingForm({ ...bookingForm, dogName: e.target.value })}
                    placeholder="Buster"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Plan Package</label>
                  <select
                    value={bookingForm.planName}
                    onChange={e => setBookingForm({ ...bookingForm, planName: e.target.value })}
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Single Run">Single Run ($35)</option>
                    <option value="Trial Run">Trial Run ($70 - 2 Runs)</option>
                    <option value="Package 1">Package 1 ($110 - 3 Runs)</option>
                    <option value="Package 2">Package 2 ($200 - 6 Runs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Booking Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Time Slot Window</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="09:00 AM - 10:00 AM">Session 1 (09:00 AM - 10:00 AM)</option>
                    <option value="10:00 AM - 11:00 AM">Session 2 (10:00 AM - 11:00 AM)</option>
                    <option value="11:00 AM - 12:00 PM">Session 3 (11:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 01:00 PM">Session 4 (12:00 PM - 01:00 PM)</option>
                    <option value="01:00 PM - 02:00 PM">Session 5 (01:00 PM - 02:00 PM)</option>
                    <option value="02:00 PM - 03:00 PM">Session 6 (02:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 04:00 PM">Session 7 (03:00 PM - 04:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={bookingForm.addressLine}
                  onChange={e => setBookingForm({ ...bookingForm, addressLine: e.target.value })}
                  placeholder="1234 Jasper Ave, Edmonton, AB"
                  className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                />
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
                  {saving ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
