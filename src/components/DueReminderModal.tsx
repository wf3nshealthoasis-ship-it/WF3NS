import React, { useState } from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle, getRouteBadgeStyle, getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { isDueWithin24Hours, isDueWithin48Hours, playMedicalChime } from '../utils/dateUtils.ts';
import {
  X,
  Bell,
  Clock,
  Printer,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onQuickRenew: (id: string, days: number) => void;
  onBatchRenew: (ids: string[], days: number) => void;
  onEditMedication: (medication: Medication) => void;
  onToggleHold: (id: string) => void;
  onOpenPrintRenewals: (scope?: '48h' | '24h' | 'all') => void;
  chimeEnabled: boolean;
  setChimeEnabled: (enabled: boolean) => void;
}

export const DueReminderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  medications,
  renewalTheme,
  onQuickRenew,
  onBatchRenew,
  onEditMedication,
  onToggleHold,
  onOpenPrintRenewals,
  chimeEnabled,
  setChimeEnabled,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | '24H' | '48H'>('ALL');

  if (!isOpen) return null;

  // Categorize medications
  const due24hList = medications.filter((m) => {
    if (m.status === 'HOLD' || m.status === 'DISCONTINUED' || m.ptom.includes('HOLD')) return false;
    return m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom);
  });

  const due48hOnlyList = medications.filter((m) => {
    if (m.status === 'HOLD' || m.status === 'DISCONTINUED' || m.ptom.includes('HOLD')) return false;
    const is24h = m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom);
    return !is24h && isDueWithin48Hours(m.renewDate, m.status, m.ptom);
  });

  const allDue48h = [...due24hList, ...due48hOnlyList];

  const displayedList =
    filterTab === '24H'
      ? due24hList
      : filterTab === '48H'
      ? due48hOnlyList
      : allDue48h;

  const handleTestChime = () => {
    playMedicalChime();
  };

  const handleBatchRenewAll = (days: number = 7) => {
    const ids = allDue48h.map((m) => m.id);
    if (ids.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to batch extend ALL ${ids.length} prescription renewals due in the next 48 hours by +${days} days?`
      )
    ) {
      onBatchRenew(ids, days);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-amber-400 opacity-40"></span>
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  48-Hour Medication Renewal Reminder
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                  Ward F3 Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Staff clinical reminder system for orders expiring or due for re-authorization within 48 hours (reference date: 18-10-2026).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Oversight Bar: KPI Counts + Reminder Audio Toggle + Quick Batch Print */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Urgency Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filterTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Due (≤48h):</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-900 text-[10px]">
                {allDue48h.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('24H')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filterTab === '24H'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Critical (&lt;24h):</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-950 text-[10px]">
                {due24hList.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('48H')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filterTab === '48H'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Advance Notice (24-48h):</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 text-[10px]">
                {due48hOnlyList.length}
              </span>
            </button>
          </div>

          {/* Audio Chime Setting + Test Chime */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !chimeEnabled;
                setChimeEnabled(next);
                if (next) playMedicalChime();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chimeEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
              title="Toggle audible staff alert chime for renewals"
            >
              {chimeEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Chime {chimeEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleTestChime}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 transition-colors"
              title="Play test hospital chime"
            >
              Test Sound
            </button>
          </div>
        </div>

        {/* Global Batch Actions Toolbar */}
        <div className="px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-indigo-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              Doctor re-authorization required before medication lapse. Review and sign off:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenPrintRenewals('48h');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50 font-bold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-700" />
              <span>Print 48h Renewal Sheet</span>
            </button>

            {allDue48h.length > 0 && (
              <button
                onClick={() => handleBatchRenewAll(7)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Extend All +7d ({allDue48h.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Medication Due List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {displayedList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                No medication orders currently due in this window.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                All prescribed patient therapies in Ward F3 are active and stable beyond 48 hours.
              </p>
            </div>
          ) : (
            displayedList.map((med) => {
              const is24h =
                med.status === 'DUE_SOON' || isDueWithin24Hours(med.renewDate, med.status, med.ptom);
              const roomStyle = getRoomBadgeStyle(med.room);
              const routeStyle = getRouteBadgeStyle(med.route);
              const renewalStyle = getRenewalStyle(renewalTheme, med.ptom, med.status);

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    is24h
                      ? 'border-rose-400 ring-2 ring-rose-200/60 bg-gradient-to-r from-rose-50/30 via-white to-white'
                      : 'border-amber-300 ring-1 ring-amber-200/80 bg-gradient-to-r from-amber-50/30 via-white to-white'
                  }`}
                >
                  {/* Left: Medication Info & Patient Bed */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold shadow-2xs ${roomStyle}`}>
                        {med.room}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${routeStyle}`}>
                        {med.route || 'Oral'}
                      </span>
                      {is24h ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>DUE_SOON &lt;24H</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white shadow-xs">
                          <Clock className="w-3 h-3" />
                          <span>48H REMINDER</span>
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {med.ptom}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                        {med.medicationName}
                      </h4>
                      <span className="text-xs font-mono font-extrabold text-blue-900">{med.dose}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-indigo-700 font-bold uppercase">{med.frequency}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>Start: {med.startDate}</span>
                      <span>·</span>
                      <span>End: {med.endDate} ({med.endTime})</span>
                    </div>
                  </div>

                  {/* Center: Renew Date & Time Box */}
                  <div className={`p-2.5 rounded-lg border-2 text-center min-w-[170px] shrink-0 ${renewalStyle.bg} ${renewalStyle.text} ${renewalStyle.borderClass || 'border-amber-400'}`}>
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-80 flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>RENEW DEADLINE</span>
                    </div>
                    <div className="text-sm font-black font-mono mt-0.5">{med.renewDate}</div>
                    <div className="text-[11px] font-bold font-mono opacity-90">{med.renewTime}</div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <button
                      onClick={() => onQuickRenew(med.id, 7)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      title="Renew for +7 Days"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>+7d</span>
                    </button>

                    <button
                      onClick={() => onQuickRenew(med.id, 14)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      title="Renew for +14 Days"
                    >
                      +14d
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onEditMedication(med);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hospital Alert Standard: Continuous 48-Hour Proactive Renewal Protection</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenPrintRenewals('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Open Full Renewal Print Sheet
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
