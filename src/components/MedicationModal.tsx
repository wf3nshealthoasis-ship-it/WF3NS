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
import { X, Calendar, Clock, AlertTriangle, ShieldCheck, ListFilter, Sparkles } from 'lucide-react';
import { FrequencySelectorModal } from './FrequencySelectorModal.tsx';
import { DrugFrequency, DRUG_FREQUENCIES } from '../data/drugFrequencies.ts';

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
  const [selectedFreqDetails, setSelectedFreqDetails] = useState<DrugFrequency | null>(null);
  const [isFrequencyListOpen, setIsFrequencyListOpen] = useState(false);
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Frequency / Administration Cadence *
                </label>
                <button
                  type="button"
                  onClick={() => setIsFrequencyListOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded-md transition-colors border border-blue-200"
                >
                  <ListFilter className="w-3 h-3 text-blue-600" />
                  <span>Open Frequency List (55)</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={frequency}
                    onClick={() => setIsFrequencyListOpen(true)}
                    onFocus={() => setIsFrequencyListOpen(true)}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="Click to open hospital frequency list or type..."
                    className="w-full pl-3 pr-20 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-bold text-slate-900 cursor-pointer hover:border-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setIsFrequencyListOpen(true)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-colors"
                  >
                    Browse List
                  </button>
                </div>

                {/* Selected CareWare frequency badge if details known */}
                {selectedFreqDetails && (
                  <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] font-mono text-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 mr-1.5">[{selectedFreqDetails.code}]</span>
                      <span>Dose Times: <strong className="text-blue-800">{selectedFreqDetails.doseTimes}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-900">
                      CareWare V5.0
                    </span>
                  </div>
                )}

                {/* Popular Hospital CareWare V5.0 Quick Chips */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { code: 'OD', label: 'OD (Once daily)', time: '9:00 AM' },
                    { code: 'BID', label: 'BID (Twice Daily)', time: '9:00 AM' },
                    { code: 'TID', label: 'TID (3x Daily)', time: '9:00 AM' },
                    { code: 'QID', label: 'QID (4x Daily)', time: '9:00 AM' },
                    { code: 'BIDI', label: 'BIDI (Insulin)', time: '6:00 AM' },
                    { code: 'OD06', label: 'OD06 (Levothyroxine)', time: '6:00 AM' },
                    { code: 'HS', label: 'HS (Bedtime 21:00)', time: '9:00 PM' },
                    { code: 'Q8H6', label: 'Q8H (Antibiotic)', time: '6:00 AM' },
                  ].map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => {
                        const matched = DRUG_FREQUENCIES.find((df) => df.code === preset.code);
                        if (matched) {
                          setFrequency(matched.frequency);
                          setSelectedFreqDetails(matched);
                        } else {
                          setFrequency(preset.label);
                        }
                        if (preset.time) {
                          setEndTime(preset.time);
                          setRenewTime(preset.time);
                        }
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-md border border-slate-200 transition-colors"
                    >
                      {preset.label}
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
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-md transition-colors"
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
                <option value="DUE_SOON">DUE_SOON (Renewal &lt;24h)</option>
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

      {/* Hospital CareWare V5.0 Frequency List Modal */}
      <FrequencySelectorModal
        isOpen={isFrequencyListOpen}
        onClose={() => setIsFrequencyListOpen(false)}
        currentFrequency={frequency}
        onSelectFrequency={(freq) => {
          setFrequency(freq.frequency);
          setSelectedFreqDetails(freq);
          if (freq.startTime) {
            const [hStr, mStr] = freq.startTime.split(':');
            const h = parseInt(hStr, 10);
            const m = mStr || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            const formattedHour = h % 12 === 0 ? 12 : h % 12;
            const timeStr = `${formattedHour}:${m} ${ampm}`;
            setEndTime(timeStr);
            setRenewTime(timeStr);
          }
        }}
      />
    </div>
  );
};
