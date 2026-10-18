import React, { useState } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { MedicationCard } from './MedicationCard.tsx';
import { LayoutGrid, Layers, Building2, Bell, AlertTriangle, Filter } from 'lucide-react';
import { getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { isDueWithin24Hours } from '../utils/dateUtils.ts';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onEditMedication: (medication: Medication) => void;
  onQuickRenew: (id: string, days: number) => void;
  onToggleHold: (id: string) => void;
  onDeleteMedication: (id: string) => void;
  onOpenFrequencyPicker?: (medication: Medication) => void;
}

export const MedicationCardsView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onEditMedication,
  onQuickRenew,
  onToggleHold,
  onDeleteMedication,
  onOpenFrequencyPicker,
}) => {
  const [groupByRoom, setGroupByRoom] = useState(true);
  const [filterDueSoonOnly, setFilterDueSoonOnly] = useState(false);

  // Identify DUE_SOON medications (< 24 hours)
  const dueSoonMedications = React.useMemo(() => {
    return medications.filter(
      (m) => m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom)
    );
  }, [medications]);

  const displayedMedications = React.useMemo(() => {
    if (!filterDueSoonOnly) return medications;
    return dueSoonMedications;
  }, [medications, dueSoonMedications, filterDueSoonOnly]);

  // Group medications by room if enabled
  const groupedRooms = React.useMemo(() => {
    const map = new Map<string, Medication[]>();
    displayedMedications.forEach((med) => {
      const list = map.get(med.room) || [];
      list.push(med);
      map.set(med.room, list);
    });
    return Array.from(map.entries()).sort(([roomA], [roomB]) => {
      const numA = parseInt(roomA.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(roomB.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [displayedMedications]);

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
      {/* Visual Staff Notification Alert Banner for DUE_SOON */}
      {dueSoonMedications.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white shadow-lg border border-rose-300 flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 border border-white/40 shadow-inner shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-white opacity-40"></span>
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  STAFF NOTIFICATION SYSTEM
                </span>
                <span className="text-xs font-mono font-black bg-rose-900/60 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {dueSoonMedications.length} DUE SOON (&lt;24H)
                </span>
              </div>
              <p className="text-xs font-bold text-rose-50 mt-0.5">
                Pulsing alert icon active on {dueSoonMedications.length} medication card{dueSoonMedications.length > 1 ? 's' : ''} whose renewal deadline is within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterDueSoonOnly(!filterDueSoonOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                filterDueSoonOnly
                  ? 'bg-white text-rose-900 ring-2 ring-white'
                  : 'bg-black/20 hover:bg-black/30 text-white border border-white/30'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterDueSoonOnly ? 'Show All Cards' : 'View DUE_SOON Cards Only'}</span>
            </button>
          </div>
        </div>
      )}

      {/* View Options Bar with Subtle Color Accents */}
      <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm">Patient Medication Cards</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-semibold text-slate-500">
            Displaying {displayedMedications.length} bedside card{displayedMedications.length > 1 ? 's' : ''}
            {filterDueSoonOnly && ' (filtered to DUE_SOON)'}
          </span>
        </div>

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
          {displayedMedications.map((med) => (
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
