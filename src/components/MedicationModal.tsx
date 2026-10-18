import React, { useState, useEffect } from 'react';
import { Medication, MedicationStatus, RenewalColorTheme } from '../types/medication.ts';
import {
  toInputDateFormat,
  fromInputDateFormat,
  addDaysToDate,
  calculatePTOM,
  formatDate,
  FREQUENCY_PRESETS,
  ROUTE_OPTIONS,
} from '../utils/dateUtils.ts';
import { RENEWAL_THEMES } from '../utils/themeConfig.ts';
import { X, Calendar, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medication: Medication) => void;
  initialMedication?: Medication | null;
  existingRooms: string[];
  renewalTheme: RenewalColorTheme;
}

export const MedicationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialMedication,
  existingRooms,
  renewalTheme,
}) => {
  const [room, setRoom] = useState('RM 377');
  const [customRoom, setCustomRoom] = useState('');
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('ONCE DAILY');
  const [route, setRoute] = useState('Oral');
  const [startDate, setStartDate] = useState(formatDate(new Date(2026, 9, 18)));
  const [endDate, setEndDate] = useState(formatDate(new Date(2026, 9, 24)));
  const [endTime, setEndTime] = useState('9:00 AM');
  const [renewDate, setRenewDate] = useState(formatDate(new Date(2026, 9, 25)));
  const [renewTime, setRenewTime] = useState('9:00 AM');
  const [status, setStatus] = useState<MedicationStatus>('ACTIVE');
  const [ptom, setPtom] = useState('7 DAYS');
  const [notes, setNotes] = useState('');

  const activeThemeConfig = RENEWAL_THEMES[renewalTheme] || RENEWAL_THEMES.amber;

  useEffect(() => {
    if (initialMedication) {
      if (existingRooms.includes(initialMedication.room)) {
        setRoom(initialMedication.room);
        setIsCustomRoom(false);
      } else {
        setCustomRoom(initialMedication.room);
        setIsCustomRoom(true);
      }
      setMedicationName(initialMedication.medicationName);
      setDose(initialMedication.dose);
      setFrequency(initialMedication.frequency);
      setRoute(initialMedication.route || 'Oral');
      setStartDate(initialMedication.startDate);
      setEndDate(initialMedication.endDate);
      setEndTime(initialMedication.endTime);
      setRenewDate(initialMedication.renewDate);
      setRenewTime(initialMedication.renewTime);
      setStatus(initialMedication.status);
      setPtom(initialMedication.ptom);
      setNotes(initialMedication.notes || '');
    } else {
      // Default new medication
      setRoom(existingRooms[0] || 'RM 377');
      setIsCustomRoom(false);
      setMedicationName('');
      setDose('');
      setFrequency('ONCE DAILY');
      setRoute('Oral');
      const todayStr = '18-10-2026';
      setStartDate(todayStr);
      setEndDate(addDaysToDate(todayStr, 7));
      setEndTime('9:00 AM');
      const nextRenew = addDaysToDate(todayStr, 8);
      setRenewDate(nextRenew);
      setRenewTime('9:00 AM');
      setStatus('ACTIVE');
      setPtom(calculatePTOM(nextRenew));
      setNotes('');
    }
  }, [initialMedication, isOpen, existingRooms]);

  if (!isOpen) return null;

  // Quick preset helper
  const handleApplyDuration = (days: number) => {
    const end = addDaysToDate(startDate, days);
    const renew = addDaysToDate(end, 1);
    setEndDate(end);
    setRenewDate(renew);
    setPtom(calculatePTOM(renew, status === 'HOLD'));
  };

  const handleRenewDateChange = (newDate: string) => {
    setRenewDate(newDate);
    setPtom(calculatePTOM(newDate, status === 'HOLD'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim()) return;

    const finalRoom = isCustomRoom && customRoom.trim() ? customRoom.trim() : room;

    const medData: Medication = {
      id: initialMedication ? initialMedication.id : `med-${Date.now()}`,
      room: finalRoom,
      medicationName: medicationName.trim().toUpperCase(),
      dose: dose.trim(),
      frequency: frequency.trim().toUpperCase(),
      route,
      startDate,
      endDate,
      endTime,
      renewDate,
      renewTime,
      status,
      ptom,
      notes: notes.trim(),
    };

    onSave(medData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header with Executive Gradient */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40" />
              <h2 className="text-base font-extrabold tracking-tight">
                {initialMedication ? 'Edit Medication Order' : 'New Patient Medication Order'}
              </h2>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              F3 - MEDICATION CHART · Inpatient Prescription & Administration Record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Room and Route Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rx # / Room
              </label>
              {!isCustomRoom ? (
                <div className="flex gap-2">
                  <select
                    value={room}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomRoom(true);
                      } else {
                        setRoom(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
                  >
                    {existingRooms.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Other Room...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    placeholder="e.g. RM 395"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomRoom(false)}
                    className="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                  >
                    Select
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administration Route
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
              >
                {ROUTE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medication Name & Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="e.g. PANTOPRAZOLE, BACLOFEN, LANTUS"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 uppercase font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dose *
              </label>
              <input
                type="text"
                required
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 20 mg, 14 UNIT"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Frequency & Quick Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency / Timing
              </label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. ONCE DAILY, TWICE DAILY"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 uppercase font-medium"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {FREQUENCY_PRESETS.slice(0, 5).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quick Course Duration Presets
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[5, 7, 10, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleApplyDuration(days)}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-md transition-colors"
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Calculates End Date and Renewal Date based on Start Date
              </p>
            </div>
          </div>

          {/* Start Date & End Date Row */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={toInputDateFormat(startDate)}
                onChange={(e) => {
                  const d = fromInputDateFormat(e.target.value);
                  setStartDate(d);
                }}
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{startDate}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={toInputDateFormat(endDate)}
                onChange={(e) => {
                  const d = fromInputDateFormat(e.target.value);
                  setEndDate(d);
                }}
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{endDate}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End TIME
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 9:00 AM, 9:00 PM"
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          {/* RENEW DATE & TIME - COLOR HIGHLIGHTED CLINICAL SECTION */}
          <div className={`p-4 rounded-lg border transition-colors ${activeThemeConfig.bgClass} ${activeThemeConfig.borderClass}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className={`w-4 h-4 ${activeThemeConfig.textClass}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${activeThemeConfig.textClass}`}>
                  RENEWAL SCHEDULE (Color-Coded Critical Alert)
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${activeThemeConfig.badgeBg} ${activeThemeConfig.badgeText} ${activeThemeConfig.borderClass}`}>
                Highlighted in {activeThemeConfig.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${activeThemeConfig.textClass}`}>
                  RENEW DATE *
                </label>
                <input
                  type="date"
                  required
                  value={toInputDateFormat(renewDate)}
                  onChange={(e) => handleRenewDateChange(fromInputDateFormat(e.target.value))}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-600 font-mono font-bold mt-0.5 block">
                  MAR Record: {renewDate}
                </span>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${activeThemeConfig.textClass}`}>
                  RENEW TIME *
                </label>
                <input
                  type="text"
                  required
                  value={renewTime}
                  onChange={(e) => setRenewTime(e.target.value)}
                  placeholder="e.g. 9:00 AM"
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Status & PTOM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as MedicationStatus;
                  setStatus(s);
                  if (s === 'HOLD') {
                    setPtom('HOLD');
                  } else {
                    setPtom(calculatePTOM(renewDate, false));
                  }
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="HOLD">HOLD (Clinical Hold)</option>
                <option value="DUE">DUE (Requires Renewal Review)</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="DISCONTINUED">DISCONTINUED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PTOM (Period to Overdue / Duration)
              </label>
              <input
                type="text"
                value={ptom}
                onChange={(e) => setPtom(e.target.value)}
                placeholder="e.g. 5 DAYS, 7 DAYS, -5 DAYS HOLD"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Instructions / Pharmacy Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Check blood pressure before administration, take with breakfast"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg ring-2 ring-blue-300"
            >
              {initialMedication ? 'Save Changes' : 'Create Medication Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
