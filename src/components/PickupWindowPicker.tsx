import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { DAILY_SESSIONS, DailySession, isSlotBlocked } from '../lib/operatingHours';
import { getTakenSlots } from '../lib/repositories/bookingRepository';
import { Skeleton } from './Skeleton';

interface PickupWindowPickerProps {
  userFsa?: string;
  onSelectSlot?: (selection: { session: DailySession; dateStr: string } | null) => void;
  readOnly?: boolean;
}

interface PickerDate {
  day: string;
  dateNum: number;
  fullDate: string;
}

// Rolling window of upcoming calendar dates, starting today. Every date is
// selectable — the admin assigns a van/handler to each booking afterwards.
function upcomingDates(count: number): PickerDate[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getTime() + i * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dateNum: d.getDate(),
      fullDate: `${y}-${m}-${dd}`,
    };
  });
}

export default function PickupWindowPicker({
  userFsa = 'T5H',
  onSelectSlot,
  readOnly = false,
}: PickupWindowPickerProps) {
  const dates = useMemo(() => upcomingDates(14), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedDateObj = dates[selectedDayIndex];

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setSelectedSlotId(null);
    onSelectSlot?.(null);
    getTakenSlots(selectedDateObj.fullDate)
      .then(taken => { if (active) setTakenSlots(taken); })
      .catch(() => { if (active) setTakenSlots([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayIndex]);

  const slots = DAILY_SESSIONS.map((session) => {
    const override = isSlotBlocked(selectedDateObj.fullDate, session.id);
    const isBooked = takenSlots.includes(session.displayTime);
    return {
      session,
      available: !override.blocked && !isBooked,
      isBlocked: override.blocked,
      isBooked,
      blockedReason: override.reason,
    };
  });

  return (
    <div className="friendly-card rounded-3xl border border-[#D6E6FF] bg-white p-5 shadow-xl shadow-black/5 sm:p-7">
      <div className="border-b border-[#D6E6FF] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-[#071A3D]">Choose Your Session</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#315B96]">
              <MapPin className="h-4 w-4 text-brand-500" />
              Service area <span className="font-bold">{userFsa}</span>
            </p>
          </div>
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
              onClick={() => setSelectedDayIndex((prev) => Math.min(dates.length - 1, prev + 1))}
              disabled={selectedDayIndex === dates.length - 1}
              className="rounded-xl border border-[#D6E6FF] bg-white p-2 text-[#315B96] transition hover:bg-[#EAF2FF] disabled:opacity-40"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Selector — every upcoming date is selectable */}
      <div className="grid grid-cols-7 gap-1 border-b border-[#D6E6FF] py-3">
        {dates.map((item, index) => (
          <button
            key={item.fullDate}
            type="button"
            onClick={() => setSelectedDayIndex(index)}
            className={`flex flex-col items-center rounded-xl py-2 transition ${
              selectedDayIndex === index
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-[#071A3D] hover:bg-[#EAF2FF]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">{item.day}</span>
            <span className="mt-0.5 text-sm font-black">{item.dateNum}</span>
          </button>
        ))}
      </div>

      {/* Sessions Slots List */}
      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#315B96]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            7 Daily Sessions (9:00 AM – 4:00 PM)
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
                  onSelectSlot?.({ session: item.session, dateStr: selectedDateObj.fullDate });
                }}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                    : item.isBlocked
                      ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-800'
                      : item.isBooked
                        ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]'
                        : 'border-[#D6E6FF] bg-white text-[#071A3D] hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${isSelected ? 'text-brand-600' : item.isBlocked ? 'text-red-500' : item.isBooked ? 'text-[#94A3B8]' : 'text-brand-500'}`} />
                    <div>
                      <span className="text-sm font-bold">{item.session.displayTime}</span>
                      <span className="ml-2 text-xs font-medium text-[#64748B]">({item.session.label})</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : item.isBlocked
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : item.isBooked
                            ? 'bg-[#E2E8F0] text-[#64748B]'
                            : 'bg-[#EAF2FF] text-[#0F3D91]'
                    }`}
                  >
                    {item.isBlocked
                      ? `Unavailable: ${item.blockedReason}`
                      : item.isBooked
                        ? 'Booked'
                        : isSelected ? 'Selected' : 'Open'}
                  </span>
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
