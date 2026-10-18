import React, { useState, useMemo } from 'react';
import { DRUG_FREQUENCIES, DrugFrequency, FREQUENCY_CATEGORIES } from '../data/drugFrequencies.ts';
import { Search, X, Clock, Check, Sparkles, Filter, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFrequency: (frequency: DrugFrequency) => void;
  currentFrequency?: string;
}

export const FrequencySelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectFrequency,
  currentFrequency = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Frequencies');

  const filteredFrequencies = useMemo(() => {
    return DRUG_FREQUENCIES.filter((item) => {
      // Category match
      if (selectedCategory !== 'All Frequencies' && item.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const codeMatch = item.code.toLowerCase().includes(query);
        const nameMatch = item.frequency.toLowerCase().includes(query);
        const doseMatch = item.doseTimes.toLowerCase().includes(query);
        const remarksMatch = (item.remarks || '').toLowerCase().includes(query);
        const categoryMatch = item.category.toLowerCase().includes(query);
        return codeMatch || nameMatch || doseMatch || remarksMatch || categoryMatch;
      }

      return true;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with CareWare Title */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Hospital Drug's Frequencies List
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  CareWare V5.0
                </span>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Select from Health Oasis Hospital standard administration schedules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code (e.g., BID, Q8H4, OD06, STAT, HS) or instructions (e.g., insulin, bedtime)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder-slate-400 shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            {FREQUENCY_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all shrink-0 text-[11px] ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frequencies List Table */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
          {filteredFrequencies.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No hospital frequencies found.</p>
              <p className="text-xs mt-1">Try a different search term or category filter.</p>
            </div>
          ) : (
            filteredFrequencies.map((freq) => {
              const isCurrent =
                currentFrequency.toUpperCase().includes(freq.code) ||
                currentFrequency.toUpperCase() === freq.frequency.toUpperCase();

              return (
                <div
                  key={freq.slNo}
                  onClick={() => {
                    onSelectFrequency(freq);
                    onClose();
                  }}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-blue-50/80 border border-blue-200 ring-1 ring-blue-300'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* SL & Code Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-5 text-right">
                        #{freq.slNo}
                      </span>
                      <span className="px-2 py-1 rounded-md font-mono font-black text-xs bg-slate-900 text-white group-hover:bg-blue-600 transition-colors shadow-2xs">
                        {freq.code}
                      </span>
                    </div>

                    {/* Frequency Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {freq.frequency}
                        </span>
                        {freq.remarks && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {freq.remarks}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {freq.category}
                        </span>
                      </div>

                      {/* Dose Times & Start Time */}
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-600">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Start:</span>
                          <span className="font-bold text-slate-800">{freq.startTime}</span>
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Dose Times:</span>
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            {freq.doseTimes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Select button */}
                  <div className="shrink-0 flex items-center gap-1">
                    {isCurrent ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 rounded-lg transition-all shadow-2xs"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Click any frequency to automatically apply code, directions & dose administration times</span>
          </div>
          <span className="font-mono font-bold text-slate-700">
            {DRUG_FREQUENCIES.length} Standard Frequencies
          </span>
        </div>
      </div>
    </div>
  );
};
