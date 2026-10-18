import React, { useState } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle, getRouteBadgeStyle, getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { calculatePTOM } from '../utils/dateUtils.ts';
import { Edit2, RefreshCw, Pause, Play, Trash2, ArrowUpDown } from 'lucide-react';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  inlineEditMode: boolean;
  onEditMedication: (medication: Medication) => void;
  onUpdateMedicationField: (id: string, field: keyof Medication, value: any) => void;
  onQuickRenew: (id: string, days: number) => void;
  onToggleHold: (id: string) => void;
  onDeleteMedication: (id: string) => void;
}

type SortField = 'room' | 'medicationName' | 'startDate' | 'endDate' | 'renewDate' | 'status' | 'ptom';

export const MedicationTable: React.FC<Props> = ({
  medications,
  renewalTheme,
  inlineEditMode,
  onEditMedication,
  onUpdateMedicationField,
  onQuickRenew,
  onToggleHold,
  onDeleteMedication,
}) => {
  const [sortField, setSortField] = useState<SortField>('room');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedMedications = [...medications].sort((a, b) => {
    const valA = (a[sortField] || '').toString().toLowerCase();
    const valB = (b[sortField] || '').toString().toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('room')}>
                <div className="flex items-center gap-1.5">
                  <span>Rx # / Room</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('medicationName')}>
                <div className="flex items-center gap-1.5">
                  <span>Medication Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-2.5 whitespace-nowrap">Dose</th>
              <th className="py-3 px-3 whitespace-nowrap">Frequency</th>
              <th className="py-3 px-2.5 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('startDate')}>
                <div className="flex items-center gap-1.5">
                  <span>Start Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-2.5 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('endDate')}>
                <div className="flex items-center gap-1.5">
                  <span>End Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-2.5 whitespace-nowrap">End TIME</th>

              {/* DISTINCT VIVID COLOUR HIGHLIGHTED HEADERS FOR RENEWAL DATE & TIME */}
              <th
                className="py-3 px-3.5 whitespace-nowrap cursor-pointer bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 border-x border-amber-500/80 font-black tracking-wide shadow-xs"
                onClick={() => handleSort('renewDate')}
                title="Color-coded Renewal Date"
              >
                <div className="flex items-center gap-1.5">
                  <span>RENEW DATE</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-900" />
                </div>
              </th>
              <th
                className="py-3 px-3.5 whitespace-nowrap bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 border-r border-amber-500/80 font-black tracking-wide shadow-xs"
                title="Color-coded Renewal Time"
              >
                <span>RENEW TIME</span>
              </th>

              <th className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('ptom')}>
                <div className="flex items-center gap-1.5">
                  <span>PTOM</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedMedications.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-semibold">No medications found matching your filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting filters or searching another keyword.</p>
                </td>
              </tr>
            ) : (
              sortedMedications.map((med, index) => {
                const renewalStyle = getRenewalStyle(renewalTheme, med.ptom, med.status);
                const routeStyle = getRouteBadgeStyle(med.route);
                const roomStyle = getRoomBadgeStyle(med.room);
                const isHold = med.status === 'HOLD' || med.ptom.includes('HOLD');
                const isDue = med.status === 'DUE' || med.ptom.startsWith('0') || med.ptom.startsWith('-') || med.ptom === '1 DAYS' || med.ptom === '2 DAYS';

                // PTOM pill color
                const getPtomColor = () => {
                  if (isHold) return 'bg-slate-100 text-slate-700 border-slate-300';
                  const match = med.ptom.match(/(-?\d+)\s*DAYS?/i);
                  const days = match ? parseInt(match[1], 10) : 99;
                  if (days <= 0 || med.status === 'DUE') return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
                  if (days <= 2) return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                };

                return (
                  <tr
                    key={med.id}
                    className={`transition-colors group ${
                      isHold
                        ? 'bg-slate-50/60 opacity-80'
                        : isDue
                        ? 'bg-amber-50/20 hover:bg-amber-50/40'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-blue-50/30'
                        : 'bg-slate-50/40 hover:bg-blue-50/40'
                    }`}
                  >
                    {/* Rx # / Room with Distinct Badge */}
                    <td className="py-2.5 px-3.5 font-mono font-bold whitespace-nowrap">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.room}
                          onChange={(e) => onUpdateMedicationField(med.id, 'room', e.target.value)}
                          className="w-18 px-2 py-0.5 border border-slate-300 rounded text-xs font-mono font-bold bg-white"
                        />
                      ) : (
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs shadow-2xs ${roomStyle}`}>
                          {med.room}
                        </span>
                      )}
                    </td>

                    {/* Medication Name with Route Badge */}
                    <td className="py-2.5 px-3.5">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.medicationName}
                          onChange={(e) => onUpdateMedicationField(med.id, 'medicationName', e.target.value)}
                          className="w-full min-w-[150px] px-2 py-0.5 border border-slate-300 rounded text-xs bg-white uppercase font-bold"
                        />
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-950 uppercase tracking-tight text-xs">
                              {med.medicationName}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${routeStyle}`}>
                              {med.route || 'Oral'}
                            </span>
                          </div>
                          {med.notes && (
                            <span className="block text-[10px] text-slate-500 italic mt-0.5">
                              {med.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Dose with Pill Badge */}
                    <td className="py-2.5 px-2.5 font-mono whitespace-nowrap tabular-nums">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.dose}
                          onChange={(e) => onUpdateMedicationField(med.id, 'dose', e.target.value)}
                          className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white font-mono"
                        />
                      ) : (
                        <span className="font-bold text-blue-900 bg-blue-50/90 border border-blue-200/80 px-2 py-0.5 rounded text-[11px]">
                          {med.dose}
                        </span>
                      )}
                    </td>

                    {/* Frequency */}
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => onUpdateMedicationField(med.id, 'frequency', e.target.value)}
                          className="w-32 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white uppercase"
                        />
                      ) : (
                        <span className="text-indigo-800 font-bold text-[11px] uppercase bg-indigo-50/60 px-2 py-0.5 rounded">
                          {med.frequency}
                        </span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-700 whitespace-nowrap tabular-nums font-semibold">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.startDate}
                          onChange={(e) => onUpdateMedicationField(med.id, 'startDate', e.target.value)}
                          className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white font-mono"
                        />
                      ) : (
                        <span>{med.startDate}</span>
                      )}
                    </td>

                    {/* End Date */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-700 whitespace-nowrap tabular-nums font-semibold">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.endDate}
                          onChange={(e) => onUpdateMedicationField(med.id, 'endDate', e.target.value)}
                          className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white font-mono"
                        />
                      ) : (
                        <span>{med.endDate}</span>
                      )}
                    </td>

                    {/* End TIME */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.endTime}
                          onChange={(e) => onUpdateMedicationField(med.id, 'endTime', e.target.value)}
                          className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white font-mono"
                        />
                      ) : (
                        <span>{med.endTime}</span>
                      )}
                    </td>

                    {/* RENEW DATE - DISTINCT VIBRANT COLOR COLUMN */}
                    <td
                      className={`py-2.5 px-3.5 font-mono font-black whitespace-nowrap tabular-nums border-x border-amber-300/80 transition-colors ${renewalStyle.bg} ${renewalStyle.text}`}
                    >
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.renewDate}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            onUpdateMedicationField(med.id, 'renewDate', newDate);
                            const updatedPTOM = calculatePTOM(newDate, med.status === 'HOLD');
                            onUpdateMedicationField(med.id, 'ptom', updatedPTOM);
                          }}
                          className="w-24 px-1.5 py-0.5 border-2 border-amber-500 rounded text-xs bg-white font-mono font-black text-slate-900"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{med.renewDate}</span>
                          {renewalStyle.tag && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans uppercase font-black ${renewalStyle.pill}`}>
                              {renewalStyle.tag}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* RENEW TIME - DISTINCT VIBRANT COLOR COLUMN */}
                    <td
                      className={`py-2.5 px-3.5 font-mono font-black whitespace-nowrap tabular-nums border-r border-amber-300/80 transition-colors ${renewalStyle.bg} ${renewalStyle.text}`}
                    >
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.renewTime}
                          onChange={(e) => onUpdateMedicationField(med.id, 'renewTime', e.target.value)}
                          className="w-20 px-1.5 py-0.5 border-2 border-amber-500 rounded text-xs bg-white font-mono font-black text-slate-900"
                        />
                      ) : (
                        <span className="text-xs">{med.renewTime}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {inlineEditMode ? (
                        <select
                          value={med.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            onUpdateMedicationField(med.id, 'status', newStatus);
                            if (newStatus === 'HOLD') {
                              onUpdateMedicationField(med.id, 'ptom', 'HOLD');
                            }
                          }}
                          className="px-2 py-0.5 border border-slate-300 rounded text-xs bg-white font-semibold"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="HOLD">HOLD</option>
                          <option value="DUE">DUE</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="DISCONTINUED">DISCONTINUED</option>
                        </select>
                      ) : (
                        <span
                          className={`font-black text-[11px] px-2 py-0.5 rounded-full border ${
                            isHold
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : isDue
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {med.status}
                        </span>
                      )}
                    </td>

                    {/* PTOM Countdown */}
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap tabular-nums">
                      {inlineEditMode ? (
                        <input
                          type="text"
                          value={med.ptom}
                          onChange={(e) => onUpdateMedicationField(med.id, 'ptom', e.target.value)}
                          className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white font-mono"
                        />
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[11px] border font-bold ${getPtomColor()}`}>
                          {med.ptom}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Renew Button */}
                        <button
                          onClick={() => onQuickRenew(med.id, 7)}
                          className="p-1 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                          title="Quick Renew: +7 Days"
                        >
                          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        {/* Hold / Resume Toggle */}
                        <button
                          onClick={() => onToggleHold(med.id)}
                          className={`p-1 rounded-md transition-colors ${
                            isHold
                              ? 'text-amber-600 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                          }`}
                          title={isHold ? 'Resume Medication' : 'Place on Hold'}
                        >
                          {isHold ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>

                        {/* Full Edit Modal */}
                        <button
                          onClick={() => onEditMedication(med)}
                          className="p-1 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                          title="Edit Medication Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteMedication(med.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Bar */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <span>Showing {sortedMedications.length} of {medications.length} patient medication records</span>
          {inlineEditMode && (
            <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
              Inline Editing Mode Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>Highlighted Columns: <strong className="text-amber-950">RENEW DATE</strong> & <strong className="text-amber-950">RENEW TIME</strong></span>
        </div>
      </div>
    </div>
  );
};
