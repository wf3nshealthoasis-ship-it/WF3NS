import React from 'react';
import { Medication, RenewalColorTheme } from '../types/medication.ts';
import { getRenewalStyle, getRouteBadgeStyle, getRoomBadgeStyle } from '../utils/themeConfig.ts';
import { Clock, AlertTriangle, CheckCircle, RefreshCw, Calendar, Activity, PauseCircle, Printer, Trash2 } from 'lucide-react';

interface Props {
  medications: Medication[];
  renewalTheme: RenewalColorTheme;
  onQuickRenew: (id: string, days: number) => void;
  onEditMedication: (medication: Medication) => void;
  onDeleteMedication?: (id: string) => void;
  onOpenPrintRenewals?: () => void;
}

export const RenewalBoardView: React.FC<Props> = ({
  medications,
  renewalTheme,
  onQuickRenew,
  onEditMedication,
  onDeleteMedication,
  onOpenPrintRenewals,
}) => {
  // Categorize medications
  const urgent: Medication[] = [];
  const upcoming: Medication[] = [];
  const stable: Medication[] = [];
  const onHold: Medication[] = [];

  medications.forEach((med) => {
    if (med.status === 'HOLD' || med.ptom.includes('HOLD')) {
      onHold.push(med);
      return;
    }
    const daysMatch = med.ptom.match(/(-?\d+)\s*DAYS?/i);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 99;

    if (days <= 2 || med.status === 'DUE' || med.status === 'DUE_SOON' || days <= 0) {
      urgent.push(med);
    } else if (days <= 6) {
      upcoming.push(med);
    } else {
      stable.push(med);
    }
  });

  const renderCard = (med: Medication, urgencyBadge: { label: string; color: string }) => {
    const style = getRenewalStyle(renewalTheme, med.ptom, med.status);
    const routeStyle = getRouteBadgeStyle(med.route);
    const roomStyle = getRoomBadgeStyle(med.room);

    return (
      <div
        key={med.id}
        className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 hover:border-blue-400 hover:shadow-md transition-all shadow-xs"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs ${roomStyle}`}>
                {med.room}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${routeStyle}`}>
                {med.route || 'Oral'}
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-900 mt-1.5 uppercase tracking-tight">
              {med.medicationName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono font-bold text-blue-900">
              <span>{med.dose}</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700 font-sans uppercase text-[11px] font-bold">{med.frequency}</span>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded shadow-2xs ${urgencyBadge.color}`}>
            {med.ptom}
          </span>
        </div>

        {/* Distinct Color Highlighted Renewal Box */}
        <div className={`p-2.5 rounded-lg border-2 transition-colors ${style.bg} ${style.text} ${style.borderClass || 'border-amber-300'}`}>
          <div className="flex items-center justify-between text-xs font-black font-mono">
            <span className="flex items-center gap-1 font-sans text-[10px] uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>RENEW DATE:</span>
            </span>
            <span className="text-sm">{med.renewDate}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-1 pt-1 border-t border-black/10">
            <span className="font-sans text-[10px] uppercase font-bold opacity-80">RENEW TIME:</span>
            <span className="font-black text-sm">{med.renewTime}</span>
          </div>
        </div>

        {/* Schedule Strip */}
        <div className="text-[11px] text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-100">
          <span>Start: {med.startDate}</span>
          <span>End: {med.endDate}</span>
        </div>

        {/* Renewal Actions */}
        <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuickRenew(med.id, 7)}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1"
              title="Renew for +7 Days"
            >
              <RefreshCw className="w-3 h-3 stroke-[2.5]" />
              <span>+7d</span>
            </button>
            <button
              onClick={() => onQuickRenew(med.id, 14)}
              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-semibold transition-colors"
              title="Renew for +14 Days"
            >
              +14d
            </button>
            <button
              onClick={() => onQuickRenew(med.id, 30)}
              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-purple-600 hover:text-white rounded-md text-xs font-semibold transition-colors"
              title="Renew for +30 Days"
            >
              +30d
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditMedication(med)}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold underline px-1 cursor-pointer"
            >
              Edit
            </button>
            {onDeleteMedication && (
              <button
                onClick={() => onDeleteMedication(med.id)}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete this order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span>F3 - Ward Renewal Triage Board</span>
            <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full uppercase">
              Action Center
            </span>
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Continuous clinical oversight for upcoming prescription renewals, urgent re-evaluations, and scheduled extensions
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-blue-200 block text-[10px]">Action Required:</span>
            <span className="text-amber-400 font-black text-sm">{urgent.length} orders</span>
          </div>
          {onOpenPrintRenewals && (
            <button
              type="button"
              onClick={onOpenPrintRenewals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition-all shadow-md cursor-pointer shrink-0"
              title="Print official renewal medication sheet for doctor signature"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Renewal Sheet</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Urgent Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-300 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                Action Required (≤ 2 Days)
              </h3>
            </div>
            <span className="text-xs font-mono font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md">
              {urgent.length}
            </span>
          </div>

          <div className="space-y-3">
            {urgent.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                No orders urgently due for renewal.
              </div>
            ) : (
              urgent.map((m) =>
                renderCard(m, { label: 'URGENT', color: 'bg-rose-500 text-white' })
              )
            )}
          </div>
        </div>

        {/* Upcoming Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                Upcoming (3 – 6 Days)
              </h3>
            </div>
            <span className="text-xs font-mono font-black bg-blue-200 text-blue-950 px-2 py-0.5 rounded-md">
              {upcoming.length}
            </span>
          </div>

          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                No upcoming renewals in this window.
              </div>
            ) : (
              upcoming.map((m) =>
                renderCard(m, { label: 'UPCOMING', color: 'bg-blue-600 text-white' })
              )
            )}
          </div>
        </div>

        {/* Stable & Long Term Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                Stable & Long-Term (≥ 7 Days)
              </h3>
            </div>
            <span className="text-xs font-mono font-black bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md">
              {stable.length}
            </span>
          </div>

          <div className="space-y-3">
            {stable.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                No medications currently scheduled beyond 7 days.
              </div>
            ) : (
              stable.slice(0, 10).map((m) =>
                renderCard(m, { label: 'STABLE', color: 'bg-emerald-600 text-white' })
              )
            )}
            {stable.length > 10 && (
              <div className="text-center text-xs text-slate-500 py-2 font-medium">
                + {stable.length - 10} more stable medications in All Records view
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
