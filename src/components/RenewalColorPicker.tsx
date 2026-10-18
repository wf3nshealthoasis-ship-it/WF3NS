import React from 'react';
import { RenewalColorTheme } from '../types/medication.ts';
import { RENEWAL_THEMES } from '../utils/themeConfig.ts';
import { Palette, Check, Sparkles } from 'lucide-react';

interface Props {
  currentTheme: RenewalColorTheme;
  onThemeChange: (theme: RenewalColorTheme) => void;
}

export const RenewalColorPicker: React.FC<Props> = ({ currentTheme, onThemeChange }) => {
  const themes: { id: RenewalColorTheme; label: string; dotClass: string; badgeClass: string }[] = [
    { id: 'amber', label: 'Clinical Gold', dotClass: 'bg-amber-500 ring-2 ring-amber-300', badgeClass: 'bg-amber-100 text-amber-950 border-amber-300' },
    { id: 'coral', label: 'Vivid Coral', dotClass: 'bg-rose-500 ring-2 ring-rose-300', badgeClass: 'bg-rose-100 text-rose-950 border-rose-300' },
    { id: 'violet', label: 'Royal Violet', dotClass: 'bg-violet-600 ring-2 ring-violet-300', badgeClass: 'bg-violet-100 text-violet-950 border-violet-300' },
    { id: 'emerald', label: 'Pharmacy Mint', dotClass: 'bg-emerald-600 ring-2 ring-emerald-300', badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300' },
    { id: 'cyan', label: 'Ocean Cyan', dotClass: 'bg-cyan-600 ring-2 ring-cyan-300', badgeClass: 'bg-cyan-100 text-cyan-950 border-cyan-300' },
    { id: 'urgency', label: 'Smart Dynamic Triage', dotClass: 'bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 ring-2 ring-amber-200', badgeClass: 'bg-gradient-to-r from-amber-100 to-rose-100 text-slate-900 border-amber-300' },
  ];

  const activeThemeConfig = RENEWAL_THEMES[currentTheme] || RENEWAL_THEMES.amber;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-white via-slate-50 to-white rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <Palette className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Renewal Schedule Color Accent:
          </span>
          <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
            Customizes RENEW DATE & TIME highlight colors across MAR tables and cards
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {themes.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                isSelected
                  ? 'bg-slate-950 text-white shadow-xs scale-102 ring-2 ring-slate-400'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              title={`Switch renewal highlight color to ${theme.label}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${theme.dotClass} shrink-0`} />
              <span>{theme.label}</span>
              {isSelected && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Live Preview Pill */}
      <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Preview:</span>
        <div className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs border shadow-2xs flex items-center gap-1.5 ${activeThemeConfig.bgClass} ${activeThemeConfig.textClass} ${activeThemeConfig.borderClass}`}>
          <span>RENEW: 23-10-2026</span>
          <span className="opacity-40">|</span>
          <span>09:00 AM</span>
        </div>
      </div>
    </div>
  );
};
