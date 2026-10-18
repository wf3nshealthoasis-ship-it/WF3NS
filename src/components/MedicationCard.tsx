import React from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle, getRouteBadgeStyle, getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { isDueWithin24Hours } from '../utils/dateUtils.ts';
import { Calendar, Clock, RefreshCw, Pause, Play, Edit2, Trash2, Pill, Activity, Check, Bell, AlertTriangle } from 'lucide-react';

interface Props {
  medication: Medication;
  renewalTheme: RenewalColorTheme;
  onEdit: (medication: Medication) => void;
  onQuickRenew: (id: string, days: number) => void;
  onToggleHold: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFrequencyPicker?: (medication: Medication) => void;
}

export const MedicationCard: React.FC<Props> = ({
  medication,
  renewalTheme,
  onEdit,
  onQuickRenew,
  onToggleHold,
  onDelete,
  onOpenFrequencyPicker,
}) => {
  const renewalStyle = getRenewalStyle(renewalTheme, medication.ptom, medication.status);
  const routeStyle = getRouteBadgeStyle(medication.route);
  const roomStyle = getRoomBadgeStyle(medication.room);

  const isHold = medication.status === 'HOLD' || medication.ptom.includes('HOLD');
  const isDueSoon24h = medication.status === 'DUE_SOON' || isDueWithin24Hours(medication.renewDate, medication.status, medication.ptom);
  const isDue = isDueSoon24h || medication.status === 'DUE' || medication.ptom.startsWith('0') || medication.ptom.startsWith('-') || medication.ptom === '1 DAYS' || medication.ptom === '2 DAYS';

  // PTOM badge styling
  const getPtomBadge = () => {
    if (isHold) {
      return 'bg-slate-200 text-slate-800 border-slate-300';
    }
    const match = medication.ptom.match(/(-?\d+)\s*DAYS?/i);
    const days = match ? parseInt(match[1], 10) : 99;
    if (days <= 0 || medication.status === 'DUE' || medication.status === 'DUE_SOON' || isDueSoon24h) {
      return 'bg-rose-600 text-white font-black animate-pulse shadow-xs';
    }
    if (days <= 2) {
      return 'bg-amber-500 text-white font-bold shadow-xs';
    }
    if (days <= 5) {
      return 'bg-blue-100 text-blue-900 border border-blue-300 font-bold';
    }
    return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg ${
        isHold
          ? 'border-slate-300 bg-slate-50/70'
          : isDueSoon24h
          ? 'border-rose-500 ring-4 ring-rose-400/40 shadow-lg shadow-rose-100/60'
          : isDue
          ? 'border-amber-400 ring-2 ring-amber-200'
          : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      {/* Top Banner: Colorful Room Badge + Route Tag + Pulsing 24h Alert + PTOM Badge */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-md font-mono font-black text-xs shadow-xs tracking-wider ${roomStyle}`}>
            {medication.room}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${routeStyle}`}>
            {medication.route || 'Oral'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pulsing Visual Alert Icon for Staff when DUE_SOON is triggered (<24h) */}
          {isDueSoon24h && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-md animate-pulse ring-2 ring-rose-300"
              title="CRITICAL STAFF ALERT: 'DUE_SOON' status triggered! Renewal date is within 24 hours."
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <Bell className="w-3.5 h-3.5 text-white animate-bounce stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase">DUE_SOON &lt;24H</span>
            </div>
          )}

          <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono tracking-wide ${getPtomBadge()}`}>
            {medication.ptom}
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isHold
                ? 'bg-slate-400 ring-2 ring-slate-200'
                : isDueSoon24h
                ? 'bg-rose-600 ring-2 ring-rose-300 animate-ping'
                : isDue
                ? 'bg-amber-500 ring-2 ring-amber-200'
                : 'bg-emerald-500 ring-2 ring-emerald-200'
            }`}
            title={`Status: ${isDueSoon24h ? 'DUE_SOON (<24h)' : medication.status}`}
          />
        </div>
      </div>

      {/* Medication Identification & Dosage Body */}
      <div className="p-4 space-y-3.5 flex-1">
        {/* Pulsing Critical 24h Renewal Notification Banner for Staff */}
        {isDueSoon24h && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-rose-500/20 via-rose-500/15 to-amber-500/20 border-2 border-rose-500 text-rose-950 shadow-sm animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md ring-2 ring-rose-300">
                <Bell className="w-4 h-4 animate-bounce stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-tight text-rose-950 leading-tight">
                    ALERT: 'DUE_SOON' STATUS TRIGGERED
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider">
                    &lt;24h
                  </span>
                </div>
                <span className="text-[11px] text-rose-800 font-bold block truncate mt-0.5">
                  Renewal deadline: {medication.renewDate} at {medication.renewTime}
                </span>
              </div>
            </div>
            <button
              onClick={() => onQuickRenew(medication.id, 7)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-colors shadow-sm flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
              title="Immediate 1-Click Renewal (+7 Days)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew</span>
            </button>
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-extrabold tracking-tight text-slate-950 uppercase leading-snug">
              {medication.medicationName}
            </h3>
            <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
              {medication.dose}
            </span>
          </div>

          {/* Interactive Frequency with 1-Click List Opener */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenFrequencyPicker?.(medication)}
              className="group flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 hover:text-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-2xs"
              title="Click to open hospital frequency list and change frequency"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="uppercase">{medication.frequency}</span>
              <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1 py-0.2 rounded font-bold ml-1 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                Update
              </span>
            </button>
          </div>
        </div>

        {medication.notes && (
          <p className="text-[11px] text-slate-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/70 italic font-medium">
            Note: {medication.notes}
          </p>
        )}

        {/* Start / End Schedule Block */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div>
            <span className="block text-[9px] uppercase font-sans font-bold text-slate-400">
              Start Date
            </span>
            <span className="font-bold text-slate-800 text-xs">{medication.startDate}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-sans font-bold text-slate-400">
              End Date & Time
            </span>
            <span className="font-bold text-slate-800 text-xs">
              {medication.endDate} <span className="text-slate-500 font-medium">({medication.endTime})</span>
            </span>
          </div>
        </div>

        {/* DISTINCT HIGHLIGHTED RENEWAL BOX WITH VIBRANT COLOR */}
        <div
          className={`p-3.5 rounded-xl border-2 transition-all shadow-xs ${
            isDueSoon24h ? 'bg-rose-50 border-rose-400 text-rose-950' : `${renewalStyle.bg} ${renewalStyle.text} ${renewalStyle.borderClass || 'border-amber-300'}`
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black font-mono mb-1.5 pb-1 border-b border-black/10">
            <div className="flex items-center gap-1.5">
              {isDueSoon24h ? (
                <Bell className="w-4 h-4 text-rose-600 animate-bounce" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span className="uppercase tracking-wider text-[11px] font-sans font-extrabold">
                RENEWAL SCHEDULE
              </span>
            </div>
            {isDueSoon24h ? (
              <span className="text-[9px] px-2 py-0.2 rounded-full font-sans uppercase font-black tracking-wider bg-rose-600 text-white animate-pulse">
                ACTION DUE &lt;24H
              </span>
            ) : renewalStyle.tag ? (
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-sans uppercase font-black tracking-wider ${renewalStyle.pill}`}>
                {renewalStyle.tag}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="block text-[10px] opacity-80 font-sans font-bold">RENEW DATE:</span>
              <span className="font-black text-sm tracking-tight">{medication.renewDate}</span>
            </div>
            <div>
              <span className="block text-[10px] opacity-80 font-sans font-bold">RENEW TIME:</span>
              <span className="font-black text-sm tracking-tight">{medication.renewTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer with Colorful Action Buttons */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-slate-100/50 to-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
        {/* Quick Renew Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onQuickRenew(medication.id, 7)}
            className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center gap-1 shadow-2xs"
            title="Renew for +7 Days"
          >
            <RefreshCw className="w-3 h-3 stroke-[2.5]" />
            <span>+7d</span>
          </button>
          <button
            onClick={() => onQuickRenew(medication.id, 14)}
            className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-2xs"
            title="Renew for +14 Days"
          >
            +14d
          </button>
          <button
            onClick={() => onQuickRenew(medication.id, 30)}
            className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-purple-600 hover:text-white rounded-lg transition-all shadow-2xs"
            title="Renew for +30 Days"
          >
            +30d
          </button>
        </div>

        {/* Card Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleHold(medication.id)}
            className={`p-1.5 rounded-lg transition-all ${
              isHold
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isHold ? 'Resume order' : 'Place on hold'}
          >
            {isHold ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onEdit(medication)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Medication Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(medication.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
