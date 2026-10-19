import React, { useState } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle } from '../utils/themeConfig.ts';
import { isDueWithin24Hours, isDueWithin48Hours } from '../utils/dateUtils.ts';
import { Printer, ArrowLeft, Filter, FileText, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onBack: () => void;
  initialPrintMode?: 'renewal' | 'mar';
  initialScope?: '48h' | '24h' | 'all';
}

export const PrintMarView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onBack,
  initialPrintMode = 'renewal',
  initialScope = 'all',
}) => {
  const [printMode, setPrintMode] = useState<'renewal' | 'mar'>(initialPrintMode);
  const [renewalScope, setRenewalScope] = useState<'48h' | '24h' | 'all'>(initialScope);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  // Filtered medications for Renewal Print
  const renewalMedications = React.useMemo(() => {
    return medications.filter((m) => {
      if (m.status === 'HOLD' || m.status === 'DISCONTINUED' || m.ptom.includes('HOLD')) {
        return false;
      }
      if (selectedRoom !== 'ALL' && m.room !== selectedRoom) {
        return false;
      }
      if (renewalScope === '24h') {
        return m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom);
      }
      if (renewalScope === '48h') {
        return isDueWithin48Hours(m.renewDate, m.status, m.ptom);
      }
      // 'all' renewals (e.g. urgent, upcoming, or stable within 14 days)
      return true;
    });
  }, [medications, renewalScope, selectedRoom]);

  // Group medications by room for MAR chart
  const roomsMap = new Map<string, Medication[]>();
  const sourceMeds = printMode === 'renewal' ? renewalMedications : medications;
  sourceMeds.forEach((med) => {
    if (selectedRoom !== 'ALL' && med.room !== selectedRoom) return;
    const list = roomsMap.get(med.room) || [];
    list.push(med);
    roomsMap.set(med.room, list);
  });

  const sortedRooms = Array.from(roomsMap.keys()).sort();

  // Metrics for renewal summary
  const count24h = medications.filter(
    (m) =>
      m.status !== 'HOLD' &&
      m.status !== 'DISCONTINUED' &&
      (m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom))
  ).length;

  const count48h = medications.filter(
    (m) =>
      m.status !== 'HOLD' &&
      m.status !== 'DISCONTINUED' &&
      isDueWithin48Hours(m.renewDate, m.status, m.ptom)
  ).length;

  const handlePrint = () => {
    window.print();
  };

  const existingRooms = Array.from(new Set(medications.map((m) => m.room))).sort();

  return (
    <div className="space-y-6">
      {/* Non-printed action toolbar */}
      <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to F3 Application</span>
          </button>

          {/* Mode Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setPrintMode('renewal')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printMode === 'renewal'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print Renewal Sheet</span>
            </button>
            <button
              onClick={() => setPrintMode('mar')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printMode === 'mar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Print Full MAR Chart</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
          {/* Renewal Scope Filter when in Renewal Mode */}
          {printMode === 'renewal' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Scope:</span>
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  onClick={() => setRenewalScope('48h')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    renewalScope === '48h'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Print orders due for renewal within 48 hours"
                >
                  Due ≤48 Hours ({count48h})
                </button>
                <button
                  onClick={() => setRenewalScope('24h')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    renewalScope === '24h'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Print orders due within 24 hours only"
                >
                  Critical &lt;24h ({count24h})
                </button>
                <button
                  onClick={() => setRenewalScope('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    renewalScope === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Renewals
                </button>
              </div>
            </div>
          )}

          {/* Room Filter Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-semibold">Room:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="ALL">All Rooms</option>
              {existingRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{printMode === 'renewal' ? 'Print Renewal Form' : 'Print F3 Chart'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRINTABLE DOCUMENT SECTION
         ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0">
        {printMode === 'renewal' ? (
          /* =====================================================================
             MODE 1: RENEWAL MEDICATION ORDERS & RE-AUTHORIZATION FORM
             ===================================================================== */
          <div className="space-y-5">
            {/* Document Header */}
            <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                <span>INPATIENT MEDICAL SERVICES · WARD F3</span>
                <span className="font-bold text-slate-900">FORM: MAR-RX-REN-2026</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                F3 - MEDICATION RENEWAL &amp; RE-AUTHORIZATION REPORT
              </h1>
              <p className="text-xs text-slate-600 font-sans mt-0.5 font-medium">
                Official Clinical Prescription Extension &amp; Pharmacy Review Handover Sheet
              </p>

              <div className="flex justify-between items-center text-xs text-slate-700 font-mono mt-3 pt-2 border-t border-slate-300">
                <div>
                  <span className="font-bold">Ward / Department:</span> Inpatient F3
                  {selectedRoom !== 'ALL' && ` (${selectedRoom})`}
                </div>
                <div>
                  <span className="font-bold">Chart Reference Date:</span> 18-10-2026
                </div>
                <div>
                  <span className="font-bold">Total Orders for Renewal:</span>{' '}
                  <span className="text-amber-800 font-black">{renewalMedications.length}</span>
                </div>
                <div className="text-rose-700 font-bold">
                  <span>≤48h Due: {count48h}</span> (≤24h: {count24h})
                </div>
              </div>
            </div>

            {/* Renewal Orders Table */}
            {renewalMedications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium text-xs">
                No medication orders currently meet the selected renewal criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border border-slate-400 border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold border-b border-slate-400 text-[10px] uppercase">
                      <th className="py-1.5 px-2 border-r border-slate-400 w-16 font-mono">Room/Bed</th>
                      <th className="py-1.5 px-2 border-r border-slate-400">Prescribed Medication</th>
                      <th className="py-1.5 px-2 border-r border-slate-400">Dose &amp; Route</th>
                      <th className="py-1.5 px-2 border-r border-slate-400">Frequency</th>
                      <th className="py-1.5 px-2 border-r border-slate-400 font-mono">Start Date</th>
                      
                      {/* DISTINCT HIGHLIGHT FOR RENEWAL DEADLINE */}
                      <th className="py-1.5 px-2 border-r border-amber-400 bg-amber-400 text-amber-950 font-black font-mono">
                        RENEW DATE &amp; TIME
                      </th>
                      <th className="py-1.5 px-2 border-r border-slate-400 font-mono text-center">PTOM</th>

                      {/* CLINICAL AUTHORIZATION CHECKBOXES & SIGNATURE */}
                      <th className="py-1.5 px-2 border-r border-slate-400 text-center w-36">
                        Extension Authorized
                      </th>
                      <th className="py-1.5 px-2 border-r border-slate-400 w-32">Physician Sig.</th>
                      <th className="py-1.5 px-2 w-20 text-center">Pharm / RN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renewalMedications.map((med, idx) => {
                      const is24h =
                        med.status === 'DUE_SOON' || isDueWithin24Hours(med.renewDate, med.status, med.ptom);
                      const is48h = isDueWithin48Hours(med.renewDate, med.status, med.ptom);
                      const renewalStyle = getRenewalStyle(renewalTheme, med.ptom, med.status);

                      return (
                        <tr
                          key={med.id}
                          className={`border-b border-slate-300 break-inside-avoid ${
                            is24h
                              ? 'bg-rose-50/70 font-semibold'
                              : is48h
                              ? 'bg-amber-50/60'
                              : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50'
                          }`}
                        >
                          <td className="py-2 px-2 border-r border-slate-300 font-mono font-bold text-slate-900">
                            {med.room}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 font-black uppercase text-slate-950">
                            <div>{med.medicationName}</div>
                            {med.notes && (
                              <div className="text-[9px] text-slate-500 font-normal italic">
                                Note: {med.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 font-mono text-slate-800">
                            <span className="font-bold">{med.dose}</span>
                            <span className="block text-[9px] text-slate-600 uppercase font-sans">
                              {med.route || 'Oral'}
                            </span>
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 uppercase text-[10px] text-slate-700">
                            {med.frequency}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 font-mono text-[10px] text-slate-600">
                            {med.startDate}
                          </td>

                          {/* Distinct Highlighted Renew Date & Time */}
                          <td
                            className={`py-2 px-2 border-r border-slate-300 font-mono font-black ${renewalStyle.bg} ${renewalStyle.text}`}
                          >
                            <div className="text-[11px]">{med.renewDate}</div>
                            <div className="text-[10px] opacity-90">{med.renewTime}</div>
                          </td>

                          <td className="py-2 px-2 border-r border-slate-300 font-mono text-center font-bold text-slate-900">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                is24h
                                  ? 'bg-rose-600 text-white font-black'
                                  : is48h
                                  ? 'bg-amber-500 text-white font-bold'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {med.ptom}
                            </span>
                          </td>

                          {/* Extension Checkbox Form */}
                          <td className="py-2 px-2 border-r border-slate-300 text-[10px] font-sans">
                            <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold">
                              <span>[ &nbsp; ] +7 Days</span>
                              <span>[ &nbsp; ] +14 Days</span>
                              <span>[ &nbsp; ] +30 Days</span>
                              <span>[ &nbsp; ] Stop (D/C)</span>
                            </div>
                          </td>

                          {/* Physician Signature Line */}
                          <td className="py-2 px-2 border-r border-slate-300">
                            <div className="border-b border-slate-400 mt-4"></div>
                            <span className="text-[8px] text-slate-400 font-mono block mt-0.5">
                              MD Signature &amp; Reg#
                            </span>
                          </td>

                          {/* Pharmacist / Nurse Verification */}
                          <td className="py-2 px-2 text-center">
                            <div className="text-[9px] font-mono space-y-1">
                              <div>[ &nbsp; ] Rx</div>
                              <div>[ &nbsp; ] RN</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Legal / Certification Footer */}
            <div className="mt-8 pt-4 border-t-2 border-slate-800 space-y-4 break-inside-avoid">
              <div className="text-[11px] text-slate-700 italic">
                <strong>Attending Physician Certification:</strong> I hereby certify that the medications listed above have been clinically re-evaluated. Renewals indicated above are medically necessary and authorized for continuing administration under Inpatient Ward F3 protocols.
              </div>

              <div className="grid grid-cols-3 gap-6 text-xs text-slate-800 font-mono pt-2">
                <div>
                  <span className="block font-bold">Attending / Prescribing Physician:</span>
                  <div className="mt-6 border-b border-slate-500 w-full"></div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Printed Name / Reg # / Date</span>
                </div>
                <div>
                  <span className="block font-bold">Ward Charge Nurse Verification:</span>
                  <div className="mt-6 border-b border-slate-500 w-full"></div>
                  <span className="text-[10px] text-slate-500 mt-1 block">RN Signature / Date &amp; Shift</span>
                </div>
                <div>
                  <span className="block font-bold">Clinical Pharmacist Review &amp; Dispense:</span>
                  <div className="mt-6 border-b border-slate-500 w-full"></div>
                  <span className="text-[10px] text-slate-500 mt-1 block">RPh Signature / License #</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
             MODE 2: COMPLETE PATIENT MAR CHART (FULL WARD eMAR)
             ===================================================================== */
          <div className="space-y-6">
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
                      <span className="text-[11px] font-normal">
                        {roomMeds.length} Prescribed Medications
                      </span>
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
        )}
      </div>
    </div>
  );
};
