import React from 'react';
import { Plus, Printer, Download, RefreshCw, Layers, Table, Clock, ListFilter, Bell, Radio, Smartphone } from 'lucide-react';
import { SyncStatus } from '../services/liveSyncService.ts';

interface Props {
  activeView: 'mar' | 'cards' | 'renewals' | 'print';
  setActiveView: (view: 'mar' | 'cards' | 'renewals' | 'print') => void;
  onOpenAddModal: () => void;
  onOpenFrequencyList: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  totalMedications: number;
  dueSoonCount?: number;
  due48hCount?: number;
  onOpenDueSoonAlerts?: () => void;
  onOpenReminderModal?: () => void;
  onOpenPrintRenewals?: () => void;
  syncStatus?: SyncStatus;
  clientCount?: number;
  onOpenLiveSyncModal?: () => void;
}

export const Header: React.FC<Props> = ({
  activeView,
  setActiveView,
  onOpenAddModal,
  onOpenFrequencyList,
  onResetData,
  onExportCSV,
  totalMedications,
  dueSoonCount = 0,
  due48hCount = 0,
  onOpenDueSoonAlerts,
  onOpenReminderModal,
  onOpenPrintRenewals,
  syncStatus = 'connected',
  clientCount = 1,
  onOpenLiveSyncModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-6 h-14 sm:h-16">
          {/* Zone 1: Brand Wordmark with Colorful Clinical Accent */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md ring-2 ring-blue-100">
              F3
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 bg-clip-text text-transparent whitespace-nowrap">
                  F3 - MEDICATION CHART
                </span>
                {/* Live Multi-Device Sync Pill Button */}
                <button
                  type="button"
                  onClick={onOpenLiveSyncModal}
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Click to view connected devices and live sync details"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">Live on All Devices</span>
                  <span className="sm:hidden font-mono font-black">{clientCount} Live</span>
                  <span className="hidden sm:inline font-mono text-[9px] bg-emerald-200/60 px-1 rounded-sm text-emerald-900 font-black">
                    {clientCount} {clientCount === 1 ? 'device' : 'devices'}
                  </span>
                </button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden xs:block">
                Inpatient Medication Administration Record (eMAR)
              </p>
            </div>
          </div>

          {/* Zone 2: Desktop Navigation Links / View Modes */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('mar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'mar'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>MAR Table</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeView === 'mar' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalMedications}
              </span>
            </button>

            <button
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'cards'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Medication Cards</span>
            </button>

            <button
              onClick={() => setActiveView('renewals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'renewals'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Renewal Due Board</span>
            </button>

            <button
              onClick={() => setActiveView('print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'print'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print MAR</span>
            </button>

            {/* Dedicated Print Option for Renewal Medication */}
            {onOpenPrintRenewals && (
              <button
                type="button"
                onClick={onOpenPrintRenewals}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100/90 transition-all border border-amber-300 shadow-2xs cursor-pointer"
                title="Print official renewal medication sheet for doctor signature"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700" />
                <span>Print Renewals</span>
              </button>
            )}

            <button
              onClick={onOpenFrequencyList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-100/80 transition-all border border-blue-200/80 bg-blue-50/80 cursor-pointer"
              title="Open CareWare V5.0 Hospital Frequency Reference List"
            >
              <ListFilter className="w-3.5 h-3.5 text-blue-600" />
              <span>Frequencies (55)</span>
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onExportCSV}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Export MAR as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onResetData}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset data back to Ward F3 baseline"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>

            {/* 48-Hour Medication Due Reminder Option */}
            {due48hCount > 0 && onOpenReminderModal && (
              <button
                type="button"
                onClick={onOpenReminderModal}
                className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/90 border border-amber-400 text-amber-950 text-xs font-black transition-all shadow-xs cursor-pointer"
                title={`48-Hour Renewal Reminder: ${due48hCount} orders expiring within 48 hours.`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                <span className="hidden sm:inline">48h Reminder:</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-black">
                  {due48hCount}
                </span>
              </button>
            )}

            {/* Staff DUE_SOON Notification Alert Bell */}
            {dueSoonCount > 0 ? (
              <button
                type="button"
                onClick={onOpenDueSoonAlerts}
                className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border-2 border-rose-400 text-rose-800 text-xs font-black transition-all shadow-xs cursor-pointer"
                title={`Staff Alert: ${dueSoonCount} medication renewal orders are DUE_SOON (<24h)`}
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-600"></span>
                </span>
                <Bell className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                <span className="hidden sm:inline">DUE_SOON:</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] animate-pulse">
                  {dueSoonCount}
                </span>
              </button>
            ) : null}

            {/* Add Medication Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow transition-all whitespace-nowrap ring-2 ring-blue-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Add Medication</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
