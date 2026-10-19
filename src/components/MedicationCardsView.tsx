import React, { useState, useCallback, useMemo } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { MedicationCard } from './MedicationCard.tsx';
import { LayoutGrid, Layers, Building2, Bell, AlertTriangle, Filter, Clock, Printer, ArrowDownUp, Sparkles } from 'lucide-react';
import { getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { isDueWithin24Hours, isDueWithin48Hours, getRenewalDaysRemaining } from '../utils/dateUtils.ts';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onEditMedication: (medication: Medication) => void;
  onQuickRenew: (id: string, days: number) => void;
  onToggleHold: (id: string) => void;
  onDeleteMedication: (id: string) => void;
  onOpenFrequencyPicker?: (medication: Medication) => void;
  onOpenReminderModal?: () => void;
  onOpenPrintRenewals?: () => void;
}

export const MedicationCardsView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onEditMedication,
  onQuickRenew,
  onToggleHold,
  onDeleteMedication,
  onOpenFrequencyPicker,
  onOpenReminderModal,
  onOpenPrintRenewals,
}) => {
  const [groupByRoom, setGroupByRoom] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'DUE_SOON' | 'DUE_48H'>('ALL');
  const [sortBy, setSortBy] = useState<'renewal_days_asc' | 'renewal_days_desc' | 'room' | 'name'>('renewal_days_asc');

  // Identify DUE_SOON medications (< 24 hours)
  const dueSoonMedications = useMemo(() => {
    return medications.filter(
      (m) =>
        m.status !== 'HOLD' &&
        m.status !== 'DISCONTINUED' &&
        (m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom))
    );
  }, [medications]);

  // Identify 48h medications (≤ 48 hours)
  const due48hMedications = useMemo(() => {
    return medications.filter(
      (m) =>
        m.status !== 'HOLD' &&
        m.status !== 'DISCONTINUED' &&
        isDueWithin48Hours(m.renewDate, m.status, m.ptom)
    );
  }, [medications]);

  const displayedMedications = useMemo(() => {
    if (urgencyFilter === 'DUE_SOON') return dueSoonMedications;
    if (urgencyFilter === 'DUE_48H') return due48hMedications;
    return medications;
  }, [medications, dueSoonMedications, due48hMedications, urgencyFilter]);

  // Sort medications according to renewal days (lowest days remaining first by default)
  const sortMedications = useCallback(
    (meds: Medication[]) => {
      return [...meds].sort((a, b) => {
        if (sortBy === 'renewal_days_asc') {
          const daysA = getRenewalDaysRemaining(a.renewDate, a.status, a.ptom);
          const daysB = getRenewalDaysRemaining(b.renewDate, b.status, b.ptom);
          if (daysA !== daysB) return daysA - daysB; // Smallest renewal days remaining first!
          return a.medicationName.localeCompare(b.medicationName);
        }
        if (sortBy === 'renewal_days_desc') {
          const daysA = getRenewalDaysRemaining(a.renewDate, a.status, a.ptom);
          const daysB = getRenewalDaysRemaining(b.renewDate, b.status, b.ptom);
          if (daysA !== daysB) return daysB - daysA;
          return a.medicationName.localeCompare(b.medicationName);
        }
        if (sortBy === 'room') {
          const numA = parseInt(a.room.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.room.replace(/\D/g, ''), 10) || 0;
          if (numA !== numB) return numA - numB;
          return a.medicationName.localeCompare(b.medicationName);
        }
        if (sortBy === 'name') {
          return a.medicationName.localeCompare(b.medicationName);
        }
        return 0;
      });
    },
    [sortBy]
  );

  // Group medications by room if enabled, with cards sorted by renewal days in each room
  const groupedRooms = useMemo(() => {
    const map = new Map<string, Medication[]>();
    displayedMedications.forEach((med) => {
      const list = map.get(med.room) || [];
      list.push(med);
      map.set(med.room, list);
    });
    return Array.from(map.entries())
      .sort(([roomA], [roomB]) => {
        const numA = parseInt(roomA.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(roomB.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      })
      .map(([room, list]) => [room, sortMedications(list)] as [string, Medication[]]);
  }, [displayedMedications, sortMedications]);

  const sortedDisplayedMedications = useMemo(() => {
    return sortMedications(displayedMedications);
  }, [displayedMedications, sortMedications]);

  if (medications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <p className="text-base font-bold text-slate-800">No patient medication cards match your filter.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting the room selector or clearing the search keyword.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Visual Staff Notification Alert Banner for DUE_SOON and 48H REMINDER */}
      {due48hMedications.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white shadow-lg border border-rose-300 flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 border border-white/40 shadow-inner shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-white opacity-40"></span>
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  STAFF NOTIFICATION SYSTEM
                </span>
                {dueSoonMedications.length > 0 && (
                  <span className="text-xs font-mono font-black bg-rose-900/80 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {dueSoonMedications.length} DUE SOON (&lt;24H)
                  </span>
                )}
                <span className="text-xs font-mono font-bold bg-amber-900/60 text-white px-2 py-0.5 rounded-full">
                  {due48hMedications.length} TOTAL IN 48H WINDOW
                </span>
              </div>
              <p className="text-xs font-bold text-rose-50 mt-1">
                Pulsing alert icon active on cards whose renewal is within 24 hours. Advance 48-hour reminders highlighted in amber.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenReminderModal && (
              <button
                type="button"
                onClick={onOpenReminderModal}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-white text-rose-900 hover:bg-rose-50 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Open 48-Hour Reminder Oversight Hub"
              >
                <Clock className="w-3.5 h-3.5 text-rose-700" />
                <span>48h Reminder Hub</span>
              </button>
            )}

            {onOpenPrintRenewals && (
              <button
                type="button"
                onClick={onOpenPrintRenewals}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-black/20 hover:bg-black/30 text-white border border-white/40 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Print renewal medication sheet"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Renewals</span>
              </button>
            )}

            <button
              onClick={() =>
                setUrgencyFilter(
                  urgencyFilter === 'DUE_SOON'
                    ? 'ALL'
                    : urgencyFilter === 'ALL'
                    ? 'DUE_SOON'
                    : 'ALL'
                )
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                urgencyFilter === 'DUE_SOON'
                  ? 'bg-white text-rose-900 ring-2 ring-white'
                  : 'bg-black/20 hover:bg-black/30 text-white border border-white/30'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{urgencyFilter === 'DUE_SOON' ? 'Show All Cards' : 'Filter DUE_SOON (<24h)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* View Options Bar with Subtle Color Accents & Renewal Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm">Patient Medication Cards</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-semibold text-slate-500">
            Displaying {displayedMedications.length} bedside card{displayedMedications.length > 1 ? 's' : ''}
            {urgencyFilter === 'DUE_SOON' && ' (filtered to DUE_SOON <24h)'}
            {urgencyFilter === 'DUE_48H' && ' (filtered to DUE ≤48h)'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Renewal Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-slate-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 focus:outline-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="renewal_days_asc">Renewal Days (Due Soonest First)</option>
              <option value="renewal_days_desc">Renewal Days (Longest First)</option>
              <option value="room">Room Number</option>
              <option value="name">Medication Name (A-Z)</option>
            </select>
          </div>

          {/* Group / Grid Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setGroupByRoom(true)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupByRoom
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Group by Room</span>
            </button>
            <button
              onClick={() => setGroupByRoom(false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !groupByRoom
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Fluid Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Renewal Days Priority Banner */}
      {sortBy === 'renewal_days_asc' && (
        <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200/90 text-blue-950 font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <span>
              <strong className="font-extrabold text-blue-900">Renewal Prioritization Active:</strong> Cards are ordered according to renewal days — medications needing renewal soonest appear first.
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-mono font-bold text-blue-800 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
            0d (Urgent) → 1d → 2d → 5d → 7d
          </span>
        </div>
      )}

      {/* Render Cards */}
      {groupByRoom ? (
        <div className="space-y-8">
          {groupedRooms.map(([room, roomMeds]) => {
            const roomStyle = getRoomBadgeStyle(room);

            return (
              <div key={room} className="space-y-3.5">
                {/* Room Section Header with Rich Color Badge */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-sm font-mono font-black px-3 py-1 rounded-lg shadow-xs tracking-wider ${roomStyle}`}>
                      {room}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {roomMeds.length} Prescription{roomMeds.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      (Ordered by Renewal Days)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roomMeds.map((med) => (
                    <MedicationCard
                      key={med.id}
                      medication={med}
                      renewalTheme={renewalTheme}
                      onEdit={onEditMedication}
                      onQuickRenew={onQuickRenew}
                      onToggleHold={onToggleHold}
                      onDelete={onDeleteMedication}
                      onOpenFrequencyPicker={onOpenFrequencyPicker}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDisplayedMedications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              renewalTheme={renewalTheme}
              onEdit={onEditMedication}
              onQuickRenew={onQuickRenew}
              onToggleHold={onToggleHold}
              onDelete={onDeleteMedication}
              onOpenFrequencyPicker={onOpenFrequencyPicker}
            />
          ))}
        </div>
      )}
    </div>
  );
};
