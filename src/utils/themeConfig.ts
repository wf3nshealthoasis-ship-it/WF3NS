import { RenewalColorTheme, RenewalThemeConfig } from '../types/medication.ts';

export const RENEWAL_THEMES: Record<RenewalColorTheme, RenewalThemeConfig> = {
  amber: {
    id: 'amber',
    name: 'Clinical Gold Amber',
    label: 'Amber / Gold',
    bgClass: 'bg-amber-100/90 hover:bg-amber-200/90',
    textClass: 'text-amber-950 font-bold',
    borderClass: 'border-amber-300',
    badgeBg: 'bg-amber-200',
    badgeText: 'text-amber-900',
    headerAccent: 'text-amber-950 bg-amber-100 border-amber-300',
  },
  coral: {
    id: 'coral',
    name: 'Vivid Coral Sunset',
    label: 'Coral / Rose',
    bgClass: 'bg-rose-100/90 hover:bg-rose-200/90',
    textClass: 'text-rose-950 font-bold',
    borderClass: 'border-rose-300',
    badgeBg: 'bg-rose-200',
    badgeText: 'text-rose-900',
    headerAccent: 'text-rose-950 bg-rose-100 border-rose-300',
  },
  violet: {
    id: 'violet',
    name: 'Royal Orchid Violet',
    label: 'Violet / Purple',
    bgClass: 'bg-violet-100/90 hover:bg-violet-200/90',
    textClass: 'text-violet-950 font-bold',
    borderClass: 'border-violet-300',
    badgeBg: 'bg-violet-200',
    badgeText: 'text-violet-900',
    headerAccent: 'text-violet-950 bg-violet-100 border-violet-300',
  },
  emerald: {
    id: 'emerald',
    name: 'Bio-Pharmacy Emerald',
    label: 'Emerald / Green',
    bgClass: 'bg-emerald-100/90 hover:bg-emerald-200/90',
    textClass: 'text-emerald-950 font-bold',
    borderClass: 'border-emerald-300',
    badgeBg: 'bg-emerald-200',
    badgeText: 'text-emerald-900',
    headerAccent: 'text-emerald-950 bg-emerald-100 border-emerald-300',
  },
  cyan: {
    id: 'cyan',
    name: 'Ocean Cyan Clinical',
    label: 'Cyan / Teal',
    bgClass: 'bg-cyan-100/90 hover:bg-cyan-200/90',
    textClass: 'text-cyan-950 font-bold',
    borderClass: 'border-cyan-300',
    badgeBg: 'bg-cyan-200',
    badgeText: 'text-cyan-900',
    headerAccent: 'text-cyan-950 bg-cyan-100 border-cyan-300',
  },
  urgency: {
    id: 'urgency',
    name: 'Smart Dynamic Triage',
    label: 'Smart Triage',
    bgClass: 'bg-amber-100/90',
    textClass: 'text-amber-950 font-bold',
    borderClass: 'border-amber-300',
    badgeBg: 'bg-amber-200',
    badgeText: 'text-amber-900',
    headerAccent: 'text-amber-950 bg-amber-100 border-amber-300',
  },
};

/**
 * Returns cell styling classes for Renewal Date and Time columns
 */
export function getRenewalStyle(theme: RenewalColorTheme, ptom: string, status: string) {
  if (theme === 'urgency') {
    if (status === 'HOLD' || ptom.includes('HOLD')) {
      return {
        bg: 'bg-slate-200/90 hover:bg-slate-300/80',
        text: 'text-slate-800 font-bold',
        pill: 'bg-slate-300 text-slate-800 border border-slate-400',
        borderClass: 'border-slate-400',
        tag: 'HOLD',
      };
    }
    const daysMatch = ptom.match(/(-?\d+)\s*DAYS?/i);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 99;
    if (days <= 0 || status === 'DUE' || status === 'EXPIRED') {
      return {
        bg: 'bg-rose-100 hover:bg-rose-200/90',
        text: 'text-rose-950 font-bold',
        pill: 'bg-rose-200 text-rose-900 border border-rose-400',
        borderClass: 'border-rose-400',
        tag: 'DUE NOW',
      };
    }
    if (days <= 2) {
      return {
        bg: 'bg-amber-100 hover:bg-amber-200/90',
        text: 'text-amber-950 font-bold',
        pill: 'bg-amber-200 text-amber-950 border border-amber-400',
        borderClass: 'border-amber-400',
        tag: 'DUE SOON',
      };
    }
    return {
      bg: 'bg-emerald-100/90 hover:bg-emerald-200/80',
      text: 'text-emerald-950 font-bold',
      pill: 'bg-emerald-200 text-emerald-950 border border-emerald-400',
      borderClass: 'border-emerald-400',
      tag: 'STABLE',
    };
  }

  const selectedTheme = RENEWAL_THEMES[theme] || RENEWAL_THEMES.amber;
  return {
    bg: selectedTheme.bgClass,
    text: selectedTheme.textClass,
    pill: `${selectedTheme.badgeBg} ${selectedTheme.badgeText}`,
    borderClass: selectedTheme.borderClass,
    tag: null,
  };
}

/**
 * Route-specific color schemes for quick visual recognition
 */
export function getRouteBadgeStyle(route?: string) {
  const r = (route || '').toLowerCase();
  if (r.includes('subcutaneous') || r.includes('insulin') || r.includes('injection')) {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  }
  if (r.includes('ophthalmic') || r.includes('eye') || r.includes('drop')) {
    return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  }
  if (r.includes('topical') || r.includes('cream') || r.includes('gel') || r.includes('shampoo')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
  if (r.includes('liquid') || r.includes('syrup')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }
  if (r.includes('iv') || r.includes('intravenous')) {
    return 'bg-rose-100 text-rose-800 border-rose-300';
  }
  // Default oral / tab
  return 'bg-blue-100 text-blue-800 border-blue-300';
}

/**
 * Distinct color for Room badge
 */
export function getRoomBadgeStyle(room: string) {
  const num = parseInt(room.replace(/\D/g, ''), 10) || 0;
  const palettes = [
    'bg-indigo-700 text-white',
    'bg-blue-700 text-white',
    'bg-teal-700 text-white',
    'bg-emerald-700 text-white',
    'bg-cyan-800 text-white',
    'bg-slate-800 text-white',
    'bg-sky-800 text-white',
  ];
  return palettes[num % palettes.length];
}
