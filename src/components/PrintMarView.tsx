import React from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle } from '../utils/themeConfig.ts';
import { Printer, ArrowLeft } from 'lucide-react';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onBack: () => void;
}

export const PrintMarView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onBack,
}) => {
  // Group medications by room
  const roomsMap = new Map<string, Medication[]>();
  medications.forEach((med) => {
    const list = roomsMap.get(med.room) || [];
    list.push(med);
    roomsMap.set(med.room, list);
  });

  const sortedRooms = Array.from(roomsMap.keys()).sort();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printed action toolbar */}
      <div className="no-print flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to F3 Medication Chart</span>
          </button>
          <span className="text-xs text-slate-500">
            Previewing official printable F3 Medication Chart format
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print F3 Chart</span>
        </button>
      </div>

      {/* Official MAR Printable Document */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            F3 - MEDICATION CHART · PATIENT MEDICATION ADMINISTRATION RECORD
          </h1>
          <div className="flex justify-between items-center text-xs text-slate-600 font-mono mt-2 pt-2 border-t border-slate-200">
            <span>Hospital Department: Inpatient Ward F3</span>
            <span>Current Date: 18-10-2026</span>
            <span className="font-bold text-slate-900">
              Total Active Medications: {medications.length}
            </span>
          </div>
        </div>

        {/* Room by Room Groups */}
        <div className="space-y-6">
          {sortedRooms.map((room) => {
            const roomMeds = roomsMap.get(room) || [];

            return (
              <div key={room} className="break-inside-avoid">
                <div className="bg-slate-800 text-white px-3 py-1 text-xs font-bold font-mono tracking-wide flex justify-between items-center">
                  <span>{room}</span>
                  <span className="text-[11px] font-normal">{roomMeds.length} Prescribed Medications</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <th className="py-1 px-2 border-r border-slate-300 w-12 font-mono">Rx #</th>
                        <th className="py-1 px-2 border-r border-slate-300">Medication Name</th>
                        <th className="py-1 px-2 border-r border-slate-300">Dose</th>
                        <th className="py-1 px-2 border-r border-slate-300">Frequency</th>
                        <th className="py-1 px-2 border-r border-slate-300 font-mono">Start Date</th>
                        <th className="py-1 px-2 border-r border-slate-300 font-mono">End Date</th>
                        <th className="py-1 px-2 border-r border-slate-300 font-mono">End TIME</th>

                        {/* DISTINCT COLOR HIGHLIGHT FOR RENEWAL DATE & TIME */}
                        <th className="py-1 px-2 border-r border-amber-300 bg-amber-100 text-amber-950 font-bold font-mono">
                          RENEW DATE
                        </th>
                        <th className="py-1 px-2 border-r border-amber-300 bg-amber-100 text-amber-950 font-bold font-mono">
                          RENEW TIME
                        </th>

                        <th className="py-1 px-2 border-r border-slate-300">Status</th>
                        <th className="py-1 px-2 font-mono">PTOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomMeds.map((med, idx) => {
                        const renewalStyle = getRenewalStyle(renewalTheme, med.ptom, med.status);

                        return (
                          <tr
                            key={med.id}
                            className={`border-b border-slate-300 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            }`}
                          >
                            <td className="py-1 px-2 border-r border-slate-300 font-mono font-medium">
                              {med.room.replace('RM ', '')}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 font-semibold uppercase text-slate-900">
                              {med.medicationName}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 font-mono">{med.dose}</td>
                            <td className="py-1 px-2 border-r border-slate-300 uppercase text-[10px]">
                              {med.frequency}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 font-mono">{med.startDate}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-mono">{med.endDate}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-mono">{med.endTime}</td>

                            {/* DISTINCT COLOR HIGHLIGHT */}
                            <td className={`py-1 px-2 border-r border-slate-300 font-mono font-bold ${renewalStyle.bg} ${renewalStyle.text}`}>
                              {med.renewDate}
                            </td>
                            <td className={`py-1 px-2 border-r border-slate-300 font-mono font-bold ${renewalStyle.bg} ${renewalStyle.text}`}>
                              {med.renewTime}
                            </td>

                            <td className="py-1 px-2 border-r border-slate-300 font-semibold text-[10px]">
                              {med.status}
                            </td>
                            <td className="py-1 px-2 font-mono font-medium">{med.ptom}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Document Footer Signatures */}
        <div className="mt-8 pt-4 border-t-2 border-slate-400 grid grid-cols-3 gap-6 text-xs text-slate-600 font-mono">
          <div>
            <span className="block font-bold text-slate-800">Administering Nurse:</span>
            <div className="mt-4 border-b border-slate-300 w-3/4"></div>
          </div>
          <div>
            <span className="block font-bold text-slate-800">Attending Physician:</span>
            <div className="mt-4 border-b border-slate-300 w-3/4"></div>
          </div>
          <div>
            <span className="block font-bold text-slate-800">Clinical Pharmacist Review:</span>
            <div className="mt-4 border-b border-slate-300 w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
