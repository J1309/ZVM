import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { DAILY_SESSIONS, DailySession } from '../lib/operatingHours';
import { getRotationDetails, ServiceZone } from '../lib/rotation';
import { Skeleton } from './Skeleton';

interface PickupWindowPickerProps {
  userFsa?: string;
  userRegion?: ServiceZone;
  onSelectSlot?: (session: DailySession, dateStr: string) => void;
  readOnly?: boolean;
}

const mockDates = [
  { day: 'Mon', dateNum: 13, fullDate: '2026-07-13' },
  { day: 'Tue', dateNum: 14, fullDate: '2026-07-14' },
  { day: 'Wed', dateNum: 15, fullDate: '2026-07-15' },
  { day: 'Thu', dateNum: 16, fullDate: '2026-07-16' },
  { day: 'Fri', dateNum: 17, fullDate: '2026-07-17' },
  { day: 'Sat', dateNum: 18, fullDate: '2026-07-18' },
  { day: 'Sun', dateNum: 19, fullDate: '2026-07-19' },
];

export default function PickupWindowPicker({
  userFsa = 'T5H',
  userRegion,
  onSelectSlot,
  readOnly = false,
}: PickupWindowPickerProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedDateObj = mockDates[selectedDayIndex];
  const rotationInfo = getRotationDetails(selectedDateObj.fullDate);
  const activeZone = rotationInfo.activeZone;

  // Is this date active for the user's region?
  const isRegionActive = !userRegion || userRegion === activeZone;

  useEffect(() => {
    setIsLoading(true);
    setSelectedSlotId(null);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedDayIndex]);

  const slots = DAILY_SESSIONS.map((session, index) => {
    // Demo availability: mock some slots as booked
    const isBooked = index === 1 || index === 5;
    const vanName = ['Thunder', 'Storm', 'Bolt'][index % 3];
    return {
      session,
      available: !isBooked && isRegionActive,
      van: vanName,
    };
  });

  return (
    <div className="friendly-card rounded-3xl border border-[#D6E6FF] bg-white p-5 shadow-xl shadow-black/5 sm:p-7">
      <div className="border-b border-[#D6E6FF] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-[#071A3D]">Pickup Window Preview</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#315B96]">
              <MapPin className="h-4 w-4 text-brand-500" />
              Zone <span className="font-bold">{userFsa}</span> (Edmonton {userRegion || activeZone} Sector)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-bold text-[#0F3D91] border border-[#D6E6FF]">
              Active: {activeZone} Sector
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className="rounded-xl border border-[#D6E6FF] bg-white p-2 text-[#315B96] transition hover:bg-[#EAF2FF] disabled:opacity-40"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayIndex((prev) => Math.min(mockDates.length - 1, prev + 1))}
                disabled={selectedDayIndex === mockDates.length - 1}
                className="rounded-xl border border-[#D6E6FF] bg-white p-2 text-[#315B96] transition hover:bg-[#EAF2FF] disabled:opacity-40"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!isRegionActive && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-medium text-amber-800">
            ⚠️ Edmonton {userRegion} Sector is not scheduled on {selectedDateObj.day} ({selectedDateObj.fullDate}). Rotates to {userRegion} next.
          </div>
        )}
      </div>

      {/* Date Selector Row */}
      <div className="grid grid-cols-7 gap-1 border-b border-[#D6E6FF] py-3">
        {mockDates.map((item, index) => {
          const dateRot = getRotationDetails(item.fullDate);
          const isCurrentActive = !userRegion || userRegion === dateRot.activeZone;

          return (
            <button
              key={item.fullDate}
              type="button"
              onClick={() => setSelectedDayIndex(index)}
              className={`flex flex-col items-center rounded-xl py-2 transition ${
                selectedDayIndex === index
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : isCurrentActive
                    ? 'text-[#071A3D] hover:bg-[#EAF2FF]'
                    : 'text-[#94A3B8] hover:bg-[#F1F5F9]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{item.day}</span>
              <span className="mt-0.5 text-sm font-black">{item.dateNum}</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tighter opacity-80">
                {dateRot.activeZone}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sessions Slots List */}
      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#315B96]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            7 Operational Sessions (9:00 AM – 4:00 PM)
          </span>
          <span className="text-[11px] font-semibold text-[#059669]">
            30 min workout + 30 min buffer
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          slots.map((item) => {
            const isSelected = selectedSlotId === item.session.id;

            return (
              <motion.button
                key={item.session.id}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                disabled={!item.available || readOnly}
                onClick={() => {
                  if (readOnly) return;
                  setSelectedSlotId(item.session.id);
                  onSelectSlot?.(item.session, selectedDateObj.fullDate);
                }}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                    : item.available
                      ? 'border-[#D6E6FF] bg-white text-[#071A3D] hover:border-brand-300'
                      : 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-brand-500'}`} />
                    <div>
                      <span className="text-sm font-bold">{item.session.displayTime}</span>
                      <span className="ml-2 text-xs font-medium text-[#64748B]">({item.session.label})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#315B96]">{item.van} van</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : item.available
                            ? 'bg-[#EAF2FF] text-[#0F3D91]'
                            : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {item.available ? (isSelected ? 'Selected' : 'Open') : 'Booked'}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {selectedSlotId && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 p-3 text-xs font-bold text-green-800 border border-green-200">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Slot Selected: {DAILY_SESSIONS.find((s) => s.id === selectedSlotId)?.displayTime} on {selectedDateObj.day} ({selectedDateObj.fullDate})
          </span>
        </div>
      )}
    </div>
  );
}
