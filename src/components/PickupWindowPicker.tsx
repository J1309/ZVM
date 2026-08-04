import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar, Check } from 'lucide-react';
import { DAILY_SESSIONS, isSlotBlocked } from '../lib/operatingHours';
import { getTakenSlots } from '../lib/repositories/bookingRepository';
import { SessionPick } from '../lib/payments';
import { Skeleton } from './Skeleton';

interface PickupWindowPickerProps {
  userFsa?: string;
  requiredCount: number;
  picked: SessionPick[];
  onChange: (picked: SessionPick[]) => void;
  disabled?: boolean;
}

interface PickerDate {
  day: string;
  dateNum: number;
  fullDate: string;
  monthName: string;
  shortMonth: string;
}

// Rolling two-month (60-day) window of upcoming dates, starting today.
function upcomingDates(count: number = 60): PickerDate[] {
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
      monthName: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      shortMonth: d.toLocaleDateString(undefined, { month: 'short' }),
    };
  });
}

export default function PickupWindowPicker({
  userFsa = 'T5H',
  requiredCount,
  picked,
  onChange,
  disabled = false,
}: PickupWindowPickerProps) {
  const dates = useMemo(() => upcomingDates(60), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedDateObj = dates[selectedDayIndex];
  const pickedDates = useMemo(() => new Set(picked.map(p => p.date)), [picked]);

  // Window of visible dates (scroll through 60 days in pages of 7)
  const visibleStartIndex = Math.floor(selectedDayIndex / 7) * 7;
  const visibleDates = dates.slice(visibleStartIndex, visibleStartIndex + 7);

  // Refetch other customers' held slots whenever the viewed day changes. Picks
  // persist across navigation — only the availability lookup is per-day.
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getTakenSlots(selectedDateObj.fullDate)
      .then(taken => { if (active) setTakenSlots(taken); })
      .catch(() => { if (active) setTakenSlots([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayIndex]);

  const dayPick = picked.find(p => p.date === selectedDateObj.fullDate);
  const isFull = picked.length >= requiredCount;

  const slots = DAILY_SESSIONS.map((session) => {
    const override = isSlotBlocked(selectedDateObj.fullDate, session.id);
    const isBlocked = override.blocked;
    const isBooked = takenSlots.includes(session.displayTime);
    const isPicked = dayPick?.timeSlot === session.displayTime;
    const dayHasOtherPick = !!dayPick && !isPicked;
    const planFull = isFull && !isPicked;
    const selectable = !disabled && !isBlocked && !isBooked && !dayHasOtherPick && !planFull;
    return { session, isBlocked, isBooked, isPicked, dayHasOtherPick, planFull, selectable, blockedReason: override.reason };
  });

  const toggle = (timeSlot: string, isPicked: boolean, selectable: boolean) => {
    if (disabled) return;
    if (isPicked) {
      onChange(picked.filter(p => !(p.date === selectedDateObj.fullDate && p.timeSlot === timeSlot)));
    } else if (selectable) {
      onChange([...picked, { date: selectedDateObj.fullDate, timeSlot }]);
    }
  };

  return (
    <div className="friendly-card rounded-3xl border border-[#D6E6FF] bg-white p-5 shadow-xl shadow-black/5 sm:p-7">
      <div className="border-b border-[#D6E6FF] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-bold text-[#071A3D]">Choose Your Sessions</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-0.5 text-xs font-bold text-brand-600">
                <Calendar className="h-3.5 w-3.5" />
                {selectedDateObj.monthName}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#315B96]">
              <MapPin className="h-4 w-4 text-brand-500" />
              Service area <span className="font-bold">{userFsa}</span>
              <span className="text-dark-300">·</span>
              <span className="text-xs font-semibold text-dark-500">2-Month Availability</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${isFull ? 'bg-green-100 text-green-700' : 'bg-[#EAF2FF] text-[#0F3D91]'}`}>
              {picked.length} / {requiredCount} picked
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
      </div>

      {/* Date Selector — 2 Month timeline with Month indicator badges */}
      <div className="grid grid-cols-7 gap-1 border-b border-[#D6E6FF] py-3">
        {visibleDates.map((item) => {
          const globalIndex = dates.findIndex(d => d.fullDate === item.fullDate);
          const hasPick = pickedDates.has(item.fullDate);
          return (
            <button
              key={item.fullDate}
              type="button"
              onClick={() => setSelectedDayIndex(globalIndex)}
              className={`relative flex flex-col items-center rounded-xl py-2 transition ${
                selectedDayIndex === globalIndex
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : hasPick
                    ? 'bg-brand-50 text-[#071A3D]'
                    : 'text-[#071A3D] hover:bg-[#EAF2FF]'
              }`}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-tighter opacity-80">{item.shortMonth}</span>
              <span className="text-[10px] font-bold uppercase">{item.day}</span>
              <span className="mt-0.5 text-sm font-black">{item.dateNum}</span>
              {hasPick && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${selectedDayIndex === globalIndex ? 'bg-white' : 'bg-brand-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Sessions Slots List */}
      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#315B96]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            7 Daily Sessions (9:00 AM – 4:00 PM)
          </span>
          <span className="text-[11px] font-semibold text-[#059669]">
            One session per day
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
            const label = item.isBlocked
              ? `Unavailable: ${item.blockedReason}`
              : item.isBooked
                ? 'Booked'
                : item.isPicked
                  ? 'Selected'
                  : item.dayHasOtherPick
                    ? 'Another slot chosen'
                    : item.planFull
                      ? 'Plan full'
                      : 'Open';
            return (
              <motion.button
                key={item.session.id}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                disabled={!item.isPicked && !item.selectable}
                onClick={() => toggle(item.session.displayTime, item.isPicked, item.selectable)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  item.isPicked
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                    : item.isBlocked
                      ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-800'
                      : item.selectable
                        ? 'border-[#D6E6FF] bg-white text-[#071A3D] hover:border-brand-300'
                        : 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${item.isPicked ? 'text-brand-600' : item.isBlocked ? 'text-red-500' : item.selectable ? 'text-brand-500' : 'text-[#94A3B8]'}`} />
                    <div>
                      <span className="text-sm font-bold">{item.session.displayTime}</span>
                      <span className="ml-2 text-xs font-medium text-[#64748B]">({item.session.label})</span>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                      item.isPicked
                        ? 'bg-brand-500 text-white'
                        : item.isBlocked
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : item.selectable
                            ? 'bg-[#EAF2FF] text-[#0F3D91]'
                            : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {item.isPicked && <Check className="h-3 w-3" />}
                    {label}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
