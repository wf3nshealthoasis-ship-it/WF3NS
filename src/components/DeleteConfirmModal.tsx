import React from 'react';
import { Medication } from '../types/medication.ts';
import { Trash2, AlertTriangle, X, ShieldAlert, Bed, Clock } from 'lucide-react';
import { getRoomBadgeStyle, getRouteBadgeStyle } from '../utils/themeConfig.ts';

interface Props {
  isOpen: boolean;
  medication: Medication | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  isOpen,
  medication,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !medication) return null;

  const roomStyle = getRoomBadgeStyle(medication.room);
  const routeStyle = getRouteBadgeStyle(medication.route);

  const handleConfirm = () => {
    onConfirmDelete(medication.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Header with clinical warning banner */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="font-black text-sm tracking-wide uppercase">
                Delete Medication Order
              </h3>
              <p className="text-[11px] text-rose-100 font-medium">
                Ward F3 · Clinical Chart Safety Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-950 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Are you sure you want to delete this medication?</span>
              <p className="text-slate-600 text-[11px] mt-1">
                This will permanently remove the prescription order from the bedside MAR chart and all renewal rosters.
              </p>
            </div>
          </div>

          {/* Medication Order Card Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs ${roomStyle}`}>
                  {medication.room}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${routeStyle}`}>
                  {medication.route || 'Oral'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                PTOM: {medication.ptom}
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 tracking-tight uppercase">
                {medication.medicationName}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-900 mt-0.5">
                <span className="bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                  {medication.dose}
                </span>
                <span className="text-indigo-700 font-sans uppercase font-bold text-[11px]">
                  {medication.frequency}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Start: {medication.startDate}</span>
              <span>Renew: {medication.renewDate}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel (Keep Order)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm & Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
