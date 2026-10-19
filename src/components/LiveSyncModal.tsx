import React from 'react';
import { X, Wifi, Radio, Smartphone, Monitor, RefreshCw, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { SyncStatus, getDeviceId, getDeviceName, liveSync } from '../services/liveSyncService.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: SyncStatus;
  clientCount: number;
  medicationsCount: number;
}

export const LiveSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  status,
  clientCount,
  medicationsCount,
}) => {
  if (!isOpen) return null;

  const deviceId = getDeviceId();
  const deviceName = getDeviceName();

  const handleManualSync = () => {
    liveSync.requestFullSync();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Live Multi-Device Sync</h3>
              <p className="text-xs text-blue-100 font-medium">Real-time Ward F3 synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  {status === 'connected' ? 'Live on All Devices' : 'Reconnecting to Server...'}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Every medication added, renewed, or edited updates immediately on all connected phones, tablets, and computers at the same time.
              </p>
            </div>
          </div>

          {/* Device Counter Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Connected Devices</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">{clientCount}</span>
                <span className="text-[11px] text-emerald-600 font-bold">Active Live</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ward Medications</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">{medicationsCount}</span>
                <span className="text-[11px] text-slate-500 font-medium">Orders</span>
              </div>
            </div>
          </div>

          {/* Current Device Details */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-700">This Device:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {deviceName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-700">Device ID:</span>
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
                {deviceId}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-700">Protocol:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3" /> WebSocket + Persistent Store
              </span>
            </div>
          </div>

          {/* Clinical Safety Reassurance */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Seamless Handover:</strong> Ward nurses walking with mobile phones, doctors on tablets, and ward clerks at desk computers always share the exact same authoritative medication records with sub-second synchronization.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleManualSync}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Force Resync</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
