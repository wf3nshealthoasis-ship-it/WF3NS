import React, { useState } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { MedicationCard } from './MedicationCard.tsx';
import { LayoutGrid, Layers, Building2 } from 'lucide-react';
import { getRoomBadgeStyle } from '../utils/themeConfig.ts';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onEditMedication: (medication: Medication) => void;
  onQuickRenew: (id: string, days: number) => void;
  onToggleHold: (id: string) => void;
  onDeleteMedication: (id: string) => void;
}

export const MedicationCardsView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onEditMedication,
  onQuickRenew,
  onToggleHold,
  onDeleteMedication,
}) => {
  const [groupByRoom, setGroupByRoom] = useState(true);

  // Group medications by room if enabled
  const groupedRooms = React.useMemo(() => {
    const map = new Map<string, Medication[]>();
    medications.forEach((med) => {
      const list = map.get(med.room) || [];
      list.push(med);
      map.set(med.room, list);
    });
    return Array.from(map.entries()).sort(([roomA], [roomB]) => {
      const numA = parseInt(roomA.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(roomB.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [medications]);

  if (medications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <p className="text-base font-bold text-slate-800">No patient medication cards match your filter.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting the room selector or clearing the search keyword.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Options Bar with Subtle Color Accents */}
      <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm">Patient Medication Cards</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-semibold text-slate-500">
            Displaying {medications.length} active bedside cards
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setGroupByRoom(true)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                      {roomMeds.length} Active Prescriptions
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
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              renewalTheme={renewalTheme}
              onEdit={onEditMedication}
              onQuickRenew={onQuickRenew}
              onToggleHold={onToggleHold}
              onDelete={onDeleteMedication}
            />
          ))}
        </div>
      )}
    </div>
  );
};
