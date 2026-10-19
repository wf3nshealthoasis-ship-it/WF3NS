import React from 'react';
import { Medication } from '../types/medication.ts';
import { Search, Filter, Edit3, AlertCircle, CheckCircle2, Clock, Table, LayoutGrid, Pill, Bell } from 'lucide-react';
import { isDueWithin24Hours, isDueWithin48Hours } from '../utils/dateUtils.ts';

interface Props {
  medications: Medication[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  inlineEditMode: boolean;
  setInlineEditMode: (enabled: boolean) => void;
  activeView: 'mar' | 'cards' | 'renewals' | 'print';
  setActiveView: (view: 'mar' | 'cards' | 'renewals' | 'print') => void;
  onOpenReminderModal?: () => void;
}

export const StatsBar: React.FC<Props> = ({
  medications,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  inlineEditMode,
  setInlineEditMode,
  activeView,
  setActiveView,
  onOpenReminderModal,
}) => {
  const totalCount = medications.length;

  // Count DUE_SOON (< 24 hours)
  const dueSoonCount = medications.filter((m) => {
    if (m.status === 'HOLD' || m.status === 'DISCONTINUED' || m.ptom.includes('HOLD')) return false;
    return m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom);
  }).length;

  // Count 48H Reminders (≤ 48 hours)
  const due48hCount = medications.filter((m) => {
    if (m.status === 'HOLD' || m.status === 'DISCONTINUED' || m.ptom.includes('HOLD')) return false;
    return isDueWithin48Hours(m.renewDate, m.status, m.ptom);
  }).length;

  const holdCount = medications.filter((m) => m.status === 'HOLD' || m.ptom.includes('HOLD')).length;
  const activeCount = medications.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-3.5">
      {/* KPI Cards Row with Vivid Clinical Accents */}
      {/* KPI Cards Row with Vivid Clinical Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Medications Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
                {totalCount}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">ward records</span>
            </div>
          </div>
        </div>

        {/* Active Prescriptions Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Active Orders
              </span>
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-emerald-700 tabular-nums">
                {activeCount}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600/80">active</span>
            </div>
          </div>
        </div>

        {/* DUE_SOON Alert Card (<24 Hours) with Pulsing Beacon */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'DUE_SOON' ? 'ALL' : 'DUE_SOON')}
          className={`rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer ${
            dueSoonCount > 0
              ? 'bg-gradient-to-br from-rose-50 to-amber-50/50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200/90'
          }`}
          title="Click to filter orders whose renewal date is within 24 hours"
        >
          <div className="h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black text-rose-900 uppercase tracking-wider">
                  DUE SOON (&lt;24H)
                </span>
                {dueSoonCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
              </div>
              <div className="w-5 h-5 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center ring-1 ring-rose-300">
                <Bell className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-rose-700 tabular-nums">
                {dueSoonCount}
              </span>
              <span className="text-[10px] font-black text-rose-600 animate-pulse">
                &lt;24h urgent
              </span>
            </div>
          </div>
        </div>

        {/* 48-Hour Reminder Card */}
        <div
          onClick={() => {
            if (onOpenReminderModal) {
              onOpenReminderModal();
            } else {
              setStatusFilter(statusFilter === 'DUE_48H' ? 'ALL' : 'DUE_48H');
            }
          }}
          className={`rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer ${
            due48hCount > 0
              ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200/90'
          }`}
          title="Click to open 48-hour reminder options and renewal review"
        >
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">
                48H REMINDER
              </span>
              <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center ring-1 ring-amber-300">
                <Clock className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-amber-800 tabular-nums">
                {due48hCount}
              </span>
              <span className="text-[10px] font-bold text-amber-700">
                ≤48h due
              </span>
            </div>
          </div>
        </div>

        {/* On Clinical Hold Card */}
        <div className={`rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all ${
          holdCount > 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200/90'
        }`}>
          <div className="h-1 bg-gradient-to-r from-slate-400 via-purple-400 to-indigo-400" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Clinical Hold
              </span>
              <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <AlertCircle className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-slate-800 tabular-nums">
                {holdCount}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">paused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Colorful Search + Filter + Layout Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Search Bar with Medical Icon */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drug name, dose, room (e.g. 377), frequency..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter Segmented Buttons with Distinct Color Badges */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/90 flex-wrap">
            {[
              { id: 'ALL', label: 'All Orders', activeColor: 'bg-white text-slate-900 font-bold shadow-xs' },
              { id: 'ACTIVE', label: 'Active', activeColor: 'bg-emerald-600 text-white font-bold shadow-xs' },
              { id: 'DUE_SOON', label: 'Due Soon (<24h)', activeColor: 'bg-rose-600 text-white font-black shadow-xs' },
              { id: 'DUE_48H', label: 'Due in 48h (≤2d)', activeColor: 'bg-amber-500 text-white font-black shadow-xs' },
              { id: 'HOLD', label: 'On Hold', activeColor: 'bg-slate-700 text-white font-bold shadow-xs' },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    isSelected ? tab.activeColor : 'text-slate-600 hover:text-slate-950 font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Table vs Cards Layout Switcher */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/90">
            <button
              onClick={() => setActiveView('mar')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === 'mar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table Spreadsheet View"
            >
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === 'cards'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Medication Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
              <span>Cards</span>
            </button>
          </div>

          {/* Inline Edit Mode Toggle */}
          {activeView === 'mar' && (
            <button
              onClick={() => setInlineEditMode(!inlineEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 shadow-2xs ${
                inlineEditMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle inline cell editing in the table"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Inline Edit: {inlineEditMode ? 'ON' : 'OFF'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
