import React from 'react';
import { Medication } from '../types/medication.ts';
import { Search, Filter, Edit3, AlertCircle, CheckCircle2, Clock, Table, LayoutGrid, Pill } from 'lucide-react';

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
}) => {
  const totalCount = medications.length;

  // Count due soon (<= 2 days)
  const dueSoonCount = medications.filter((m) => {
    if (m.status === 'DUE') return true;
    const match = m.ptom.match(/(-?\d+)\s*DAYS?/i);
    return match ? parseInt(match[1], 10) <= 2 && m.status !== 'HOLD' : false;
  }).length;

  const holdCount = medications.filter((m) => m.status === 'HOLD' || m.ptom.includes('HOLD')).length;
  const activeCount = medications.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-3.5">
      {/* KPI Cards Row with Vivid Clinical Accents */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Medications Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />
          <div className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
                {totalCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">ward records</span>
            </div>
          </div>
        </div>

        {/* Active Prescriptions Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Active Orders
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-emerald-700 tabular-nums">
                {activeCount}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600/80">administering</span>
            </div>
          </div>
        </div>

        {/* Due for Renewal Card */}
        <div className={`rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all ${
          dueSoonCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200/90'
        }`}>
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400" />
          <div className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Due Renewal (≤2d)
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center ring-1 ring-amber-300">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-amber-900 tabular-nums">
                {dueSoonCount}
              </span>
              <span className="text-[11px] font-bold text-amber-700">review required</span>
            </div>
          </div>
        </div>

        {/* On Clinical Hold Card */}
        <div className={`rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all ${
          holdCount > 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200/90'
        }`}>
          <div className="h-1 bg-gradient-to-r from-slate-400 via-purple-400 to-indigo-400" />
          <div className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Clinical Hold
              </span>
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-800 tabular-nums">
                {holdCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">paused orders</span>
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
          <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/90">
            {[
              { id: 'ALL', label: 'All Orders', activeColor: 'bg-white text-slate-900 font-bold shadow-xs' },
              { id: 'ACTIVE', label: 'Active', activeColor: 'bg-emerald-600 text-white font-bold shadow-xs' },
              { id: 'DUE_SOON', label: 'Due ≤ 2d', activeColor: 'bg-amber-600 text-white font-bold shadow-xs' },
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
