import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, ShieldAlert, CheckCircle2, X, Truck } from 'lucide-react';
import { DAILY_SESSIONS, DailySession, blockSessionSlot, unblockSessionSlot, getSlotOverrides } from '../../lib/operatingHours';
import { getRotationDetails, ServiceZone } from '../../lib/rotation';

const mockDates = [
  { day: 'Mon', dateNum: 13, fullDate: '2026-07-13' },
  { day: 'Tue', dateNum: 14, fullDate: '2026-07-14' },
  { day: 'Wed', dateNum: 15, fullDate: '2026-07-15' },
  { day: 'Thu', dateNum: 16, fullDate: '2026-07-16' },
  { day: 'Fri', dateNum: 17, fullDate: '2026-07-17' },
  { day: 'Sat', dateNum: 18, fullDate: '2026-07-18' },
  { day: 'Sun', dateNum: 19, fullDate: '2026-07-19' },
];

export default function AdminSchedulePanel() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [overrides, setOverrides] = useState(() => getSlotOverrides());
  const [selectedSector, setSelectedSector] = useState<ServiceZone>('East');
  const [blockingSession, setBlockingSession] = useState<DailySession | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const currentDateObj = mockDates[selectedDayIndex];
  const rotationInfo = getRotationDetails(currentDateObj.fullDate);

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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-dark-800 border border-dark-600 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            Pickup Window Control Panel
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Operational Hours & Emergency Overrides</h2>
          <p className="text-xs text-dark-400 mt-1">
            Manage daily 1-hour session pickup windows (9 AM – 4 PM). Block slots in emergency situations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['East', 'North', 'West', 'South'] as ServiceZone[]).map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedSector(zone)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedSector === zone
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-dark-700 text-dark-300 hover:text-white'
              }`}
            >
              {zone} Sector
            </button>
          ))}
        </div>
      </div>

      {/* Date Selector Row */}
      <div className="grid grid-cols-7 gap-2">
        {mockDates.map((item, idx) => {
          const dateRot = getRotationDetails(item.fullDate);
          const isSelected = selectedDayIndex === idx;
          const isSectorActive = selectedSector === dateRot.activeZone;

          return (
            <button
              key={item.fullDate}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3 rounded-xl border text-center transition ${
                isSelected
                  ? 'bg-brand-500 text-white border-brand-400 shadow-md shadow-brand-500/20'
                  : isSectorActive
                    ? 'bg-dark-800 border-dark-600 text-white hover:border-dark-500'
                    : 'bg-dark-800/40 border-dark-700 text-dark-400 hover:text-dark-200'
              }`}
            >
              <p className="text-[11px] font-bold uppercase">{item.day}</p>
              <p className="text-lg font-black mt-0.5">{item.dateNum}</p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                dateRot.activeZone === selectedSector ? 'bg-green-500/20 text-green-300' : 'bg-dark-700 text-dark-400'
              }`}>
                {dateRot.activeZone}
              </span>
            </button>
          );
        })}
      </div>

      {/* Daily Sessions List */}
      <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between border-b border-dark-600 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-white text-base">
              {currentDateObj.day} ({currentDateObj.fullDate}) — 7 Daily Sessions
            </h3>
          </div>
          <span className="text-xs text-dark-300 flex items-center gap-1 bg-dark-700 px-3 py-1.5 rounded-lg border border-dark-600">
            <Truck className="w-3.5 h-3.5 text-brand-400" /> Active: {rotationInfo.activeZone} Sector
          </span>
        </div>

        <div className="space-y-3">
          {DAILY_SESSIONS.map((session) => {
            const key = `${currentDateObj.fullDate}_${session.id}`;
            const override = overrides[key];
            const isBlocked = override?.blocked;
            const vanName = ['Thunder', 'Storm', 'Bolt'][session.id % 3];

            return (
              <div
                key={session.id}
                className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border transition ${
                  isBlocked
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/10 text-brand-400'
                  }`}>
                    #{session.slotNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{session.displayTime}</span>
                      <span className="text-xs text-dark-400">({session.label})</span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">
                      30 min workout + 30 min van setup/prep · Van: {vanName}
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
                        Unblock Slot
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Open for Bookings
                      </span>
                      <button
                        onClick={() => {
                          setBlockingSession(session);
                          setReasonInput('Emergency Driver / Van Maintenance');
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Emergency Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-dark-600 pb-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Slot Cancellation
                </div>
                <button onClick={() => setBlockingSession(null)} className="p-1 text-dark-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-dark-200">
                  You are about to place an <span className="text-red-400 font-bold">Emergency Block</span> on:
                </p>
                <div className="p-3 bg-dark-700/50 rounded-xl border border-dark-600 text-xs text-white space-y-1">
                  <p><span className="text-dark-400">Date:</span> {currentDateObj.day} ({currentDateObj.fullDate})</p>
                  <p><span className="text-dark-400">Session:</span> {blockingSession.displayTime}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400 uppercase tracking-wider">Emergency Reason (Visible to Users)</label>
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Van Maintenance, Severe Weather, Driver Emergency"
                    className="w-full h-11 bg-dark-900 border border-dark-500 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-dark-600">
                <button
                  onClick={() => setBlockingSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-dark-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockSlot}
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/25 transition"
                >
                  Confirm Emergency Block
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
