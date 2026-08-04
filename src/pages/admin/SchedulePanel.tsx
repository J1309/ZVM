import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, ShieldAlert, CheckCircle2, X, Truck, ChevronLeft, ChevronRight, PawPrint } from 'lucide-react';
import { DAILY_SESSIONS, DailySession, blockSessionSlot, unblockSessionSlot, getSlotOverrides } from '../../lib/operatingHours';
import { getRotationDetails, ServiceZone } from '../../lib/rotation';
import { getTakenSlots, getAllBookings } from '../../lib/repositories/bookingRepository';
import { Booking } from '../../lib/types';

function generate60Days() {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    dates.push({
      fullDate,
      dayName,
      monthName,
      dayNum: d.getDate(),
    });
  }
  return dates;
}

export default function AdminSchedulePanel() {
  const dates = generate60Days();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [overrides, setOverrides] = useState(() => getSlotOverrides());
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<ServiceZone | 'All'>('All');
  const [blockingSession, setBlockingSession] = useState<DailySession | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [takenSlotsList, setTakenSlotsList] = useState<string[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  const currentDateObj = dates[selectedDateIndex] || dates[0];
  const rotationInfo = getRotationDetails(currentDateObj.fullDate);

  useEffect(() => {
    getTakenSlots(currentDateObj.fullDate).then(setTakenSlotsList);
    getAllBookings().then(setAllBookings);
  }, [currentDateObj.fullDate]);

  const handleBlockSlot = () => {
    if (!blockingSession) return;
    const reason = reasonInput.trim() || 'Emergency Driver / Van Unavailable';
    blockSessionSlot(currentDateObj.fullDate, blockingSession.id, reason);
    setOverrides(getSlotOverrides());
    setBlockingSession(null);
    setReasonInput('');
  };

  const handleUnblockSlot = (sessionId: number) => {
    unblockSessionSlot(currentDateObj.fullDate, sessionId);
    setOverrides(getSlotOverrides());
  };

  // Find bookings for selected date
  const dayBookings = allBookings.filter(
    b => b.date === currentDateObj.fullDate && b.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-dark-800 border border-dark-600 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            60-Day Pickup Window Control Panel
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Operational Hours &amp; 2-Month Slot Calendar</h2>
          <p className="text-xs text-dark-400 mt-1">
            Browse the active 60-day booking window. View live bookings, active sector rotation, and manage emergency blocks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSectorFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedSectorFilter === 'All'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-dark-700 text-dark-300 hover:text-white'
            }`}
          >
            All Sectors
          </button>
          {(['East', 'North', 'West', 'South'] as ServiceZone[]).map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedSectorFilter(zone)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedSectorFilter === zone
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-dark-700 text-dark-300 hover:text-white'
              }`}
            >
              {zone} Sector
            </button>
          ))}
        </div>
      </div>

      {/* 60-Day Date Navigation Bar */}
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-dark-300">
            60-Day Calendar ({dates[0].monthName} {dates[0].dayNum} – {dates[59].monthName} {dates[59].dayNum})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
              disabled={selectedDateIndex === 0}
              className="p-1.5 rounded-lg bg-dark-700 text-dark-200 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-white">
              Day {selectedDateIndex + 1} of 60
            </span>
            <button
              onClick={() => setSelectedDateIndex(Math.min(59, selectedDateIndex + 1))}
              disabled={selectedDateIndex === 59}
              className="p-1.5 rounded-lg bg-dark-700 text-dark-200 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Date Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {dates.map((item, idx) => {
            const dateRot = getRotationDetails(item.fullDate);
            const isSelected = selectedDateIndex === idx;
            const matchesFilter =
              selectedSectorFilter === 'All' || selectedSectorFilter === dateRot.activeZone;

            if (!matchesFilter && !isSelected) return null;

            return (
              <button
                key={item.fullDate}
                onClick={() => setSelectedDateIndex(idx)}
                className={`min-w-[4.25rem] p-2.5 rounded-xl border text-center transition shrink-0 ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-400 shadow-md shadow-brand-500/20'
                    : 'bg-dark-700/60 border-dark-600 text-dark-200 hover:border-dark-400 hover:text-white'
                }`}
              >
                <p className="text-[10px] font-bold uppercase">{item.dayName}</p>
                <p className="text-base font-black my-0.5">{item.monthName} {item.dayNum}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                  dateRot.activeZone === 'East' ? 'bg-blue-500/20 text-blue-300' :
                  dateRot.activeZone === 'North' ? 'bg-purple-500/20 text-purple-300' :
                  dateRot.activeZone === 'West' ? 'bg-emerald-500/20 text-emerald-300' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {dateRot.activeZone}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Summary & Bookings Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Sessions List (2 Columns) */}
        <div className="lg:col-span-2 bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden p-5">
          <div className="flex items-center justify-between border-b border-dark-600 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-white text-base">
                {currentDateObj.dayName}, {currentDateObj.monthName} {currentDateObj.dayNum} ({currentDateObj.fullDate})
              </h3>
            </div>
            <span className="text-xs text-dark-300 flex items-center gap-1 bg-dark-700 px-3 py-1.5 rounded-lg border border-dark-600">
              <Truck className="w-3.5 h-3.5 text-brand-400" /> Sector: {rotationInfo.activeZone}
            </span>
          </div>

          <div className="space-y-3">
            {DAILY_SESSIONS.map((session) => {
              const key = `${currentDateObj.fullDate}_${session.id}`;
              const override = overrides[key];
              const isBlocked = override?.blocked;
              const isTakenByCustomer = takenSlotsList.some(
                slotStr => slotStr.includes(session.displayTime) || slotStr.includes(session.label)
              );
              const bookedDetails = dayBookings.find(
                b => b.timeSlot && (b.timeSlot.includes(session.displayTime) || b.timeSlot.includes(session.label))
              );

              return (
                <div
                  key={session.id}
                  className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border transition ${
                    isBlocked
                      ? 'bg-red-500/10 border-red-500/30'
                      : isTakenByCustomer
                      ? 'bg-brand-500/10 border-brand-500/30'
                      : 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isBlocked ? 'bg-red-500/20 text-red-400' :
                      isTakenByCustomer ? 'bg-brand-500/20 text-brand-300' :
                      'bg-dark-600 text-dark-200'
                    }`}>
                      #{session.slotNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{session.displayTime}</span>
                        <span className="text-xs text-dark-400">({session.label})</span>
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {bookedDetails ? (
                          <span className="text-emerald-300 font-medium">Booked by {bookedDetails.customerName} ({bookedDetails.dogName})</span>
                        ) : (
                          '30 min workout + 30 min van setup/prep'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isBlocked ? (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          Blocked: {override.reason}
                        </span>
                        <button
                          onClick={() => handleUnblockSlot(session.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl transition"
                        >
                          Unblock
                        </button>
                      </div>
                    ) : isTakenByCustomer ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
                        <PawPrint className="w-3.5 h-3.5 text-brand-400" />
                        Reserved Slot
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Available
                        </span>
                        <button
                          onClick={() => {
                            setBlockingSession(session);
                            setReasonInput('Emergency Driver / Van Maintenance');
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Block
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Bookings Panel for Selected Date */}
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-dark-600 pb-3 mb-4">
              <PawPrint className="h-4 w-4 text-brand-400" />
              <h3 className="font-bold text-white text-base">Bookings on {currentDateObj.fullDate}</h3>
            </div>

            {dayBookings.length === 0 ? (
              <div className="py-8 text-center text-dark-400 text-xs">
                No active bookings scheduled for this date yet.
              </div>
            ) : (
              <div className="space-y-3">
                {dayBookings.map(b => (
                  <div key={b.id} className="p-3.5 rounded-xl bg-dark-900/80 border border-dark-600 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{b.customerName}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-dark-300">Dog: <strong className="text-brand-300">{b.dogName}</strong> ({b.dogBreed || 'Dog'})</p>
                    <p className="text-dark-300">Time: {b.timeSlot}</p>
                    <p className="text-dark-300">Plan: {b.planName}</p>
                    <p className="text-dark-400 text-[11px] truncate">Address: {b.address || b.fsa}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-dark-700 text-[11px] text-dark-400 text-center">
            Sector Rotation: <strong className="text-white">{rotationInfo.activeZone}</strong>
          </div>
        </div>
      </div>

      {/* Emergency Block Modal */}
      <AnimatePresence>
        {blockingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-dark-600 pb-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Block Session
                </div>
                <button
                  onClick={() => setBlockingSession(null)}
                  className="p-1 text-dark-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-dark-300">Target Session:</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Slot #{blockingSession.slotNumber} ({blockingSession.displayTime})
                  </p>
                  <p className="text-xs text-dark-400">Date: {currentDateObj.fullDate}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dark-300">Reason for Emergency Block</label>
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Driver emergency / Van maintenance"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-700">
                  <button
                    onClick={() => setBlockingSession(null)}
                    className="px-4 py-2 text-xs font-bold text-dark-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlockSlot}
                    className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition"
                  >
                    Confirm Emergency Block
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
