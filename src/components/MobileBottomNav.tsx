import React from 'react';
import { Layers, Table, Clock, Plus, Bell, Printer } from 'lucide-react';

interface Props {
  activeView: 'mar' | 'cards' | 'renewals' | 'print';
  setActiveView: (view: 'mar' | 'cards' | 'renewals' | 'print') => void;
  onOpenAddModal: () => void;
  onOpenReminderModal: () => void;
  onOpenPrintRenewals: () => void;
  dueAlertsCount: number;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeView,
  setActiveView,
  onOpenAddModal,
  onOpenReminderModal,
  dueAlertsCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Tab 1: Medication Cards (Optimal mobile view) */}
        <button
          type="button"
          onClick={() => setActiveView('cards')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeView === 'cards'
              ? 'text-purple-700 font-bold bg-purple-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className={`w-5 h-5 ${activeView === 'cards' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Cards</span>
        </button>

        {/* Tab 2: MAR Table */}
        <button
          type="button"
          onClick={() => setActiveView('mar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeView === 'mar'
              ? 'text-blue-700 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className={`w-5 h-5 ${activeView === 'mar' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">MAR Table</span>
        </button>

        {/* Center Action: Add Medication FAB Button */}
        <div className="flex items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all ring-4 ring-white cursor-pointer"
            title="Add Medication Order"
            aria-label="Add Medication"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Renewal Due Board */}
        <button
          type="button"
          onClick={() => setActiveView('renewals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeView === 'renewals'
              ? 'text-amber-700 font-bold bg-amber-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeView === 'renewals' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Renewals</span>
        </button>

        {/* Tab 4: 48h / Urgent Alerts */}
        <button
          type="button"
          onClick={onOpenReminderModal}
          className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <div className="relative">
            <Bell className="w-5 h-5 stroke-2 text-amber-600" />
            {dueAlertsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center font-mono animate-pulse shadow-xs">
                {dueAlertsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight text-amber-900 font-semibold">Alerts</span>
        </button>
      </div>
    </nav>
  );
};
