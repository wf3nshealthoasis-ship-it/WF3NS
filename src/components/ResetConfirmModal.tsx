import React from 'react';
import { RotateCcw, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-amber-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="reset-dialog-title" className="font-black text-sm tracking-wide uppercase">
                Reset F3 Medication Chart
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                Restore Baseline Patient Orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Restore Original Ward Dataset?</span>
              <p className="text-slate-600 text-[11px] mt-1">
                This will reset all medications back to the original 12 inpatient orders from the Ward F3 patient medication chart document, clearing any added custom orders or edits.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
