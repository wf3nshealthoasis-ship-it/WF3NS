/**
 * Converts "DD-MM-YYYY" or "YYYY-MM-DD" to Date object
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    // If DD-MM-YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    // If YYYY-MM-DD
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object as "DD-MM-YYYY" (standard hospital MAR format)
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Converts "DD-MM-YYYY" to "YYYY-MM-DD" for standard HTML5 <input type="date">
 */
export function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts HTML5 "YYYY-MM-DD" back to "DD-MM-YYYY"
 */
export function fromInputDateFormat(inputDate: string): string {
  if (!inputDate) return '';
  const parts = inputDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return inputDate;
}

/**
 * Calculates days remaining from today or between dates
 */
export function calculatePTOM(renewDateStr: string, isHold: boolean = false): string {
  if (isHold) {
    return 'HOLD';
  }
  const target = parseDate(renewDateStr);
  if (!target) return 'N/A';
  
  // Base reference date from the current prompt time (October 18, 2026)
  const today = new Date(2026, 9, 18); // Oct 18, 2026
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return `${diffDays} DAYS`;
  }
  return `${diffDays} DAYS`;
}

/**
 * Returns numeric days remaining until renewal for sorting and triage.
 * Lower numbers mean more urgent. Overdue/due today are <= 0.
 * HOLD orders return 9999 so they sort to the end.
 */
export function getRenewalDaysRemaining(
  renewDateStr: string,
  status?: string,
  ptomStr?: string
): number {
  if (status === 'HOLD' || (ptomStr && ptomStr.includes('HOLD'))) {
    return 9999;
  }
  if (status === 'DISCONTINUED') {
    return 99999;
  }
  if (ptomStr) {
    const match = ptomStr.match(/(-?\d+)\s*DAYS?/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  const target = parseDate(renewDateStr);
  if (!target) return 9999;
  const today = new Date(2026, 9, 18);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks whether a medication renewal date is within 24 hours (today or tomorrow)
 */
export function isDueWithin24Hours(renewDateStr: string, status?: string, ptomStr?: string): boolean {
  if (status === 'HOLD' || status === 'DISCONTINUED' || (ptomStr && ptomStr.includes('HOLD'))) {
    return false;
  }
  if (status === 'DUE' || status === 'DUE_SOON' || status === 'EXPIRED') {
    return true;
  }
  if (ptomStr) {
    const match = ptomStr.match(/(-?\d+)\s*DAYS?/i);
    if (match) {
      const days = parseInt(match[1], 10);
      return days <= 1; // 0 days (today) or 1 day (within 24 hours)
    }
  }
  const target = parseDate(renewDateStr);
  if (!target) return false;
  const today = new Date(2026, 9, 18); // Oct 18, 2026 reference date
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}

/**
 * Checks whether a medication renewal date is within 48 hours (today, tomorrow, or in 2 days)
 */
export function isDueWithin48Hours(renewDateStr: string, status?: string, ptomStr?: string): boolean {
  if (status === 'HOLD' || status === 'DISCONTINUED' || (ptomStr && ptomStr.includes('HOLD'))) {
    return false;
  }
  if (status === 'DUE' || status === 'DUE_SOON' || status === 'EXPIRED') {
    return true;
  }
  if (ptomStr) {
    const match = ptomStr.match(/(-?\d+)\s*DAYS?/i);
    if (match) {
      const days = parseInt(match[1], 10);
      return days <= 2; // 0, 1, or 2 days remaining (within 48 hours)
    }
  }
  const target = parseDate(renewDateStr);
  if (!target) return false;
  const today = new Date(2026, 9, 18); // Oct 18, 2026 reference date
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
}

/**
 * Optional soft medical audio chime for staff alerts
 */
export function playMedicalChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // First tone (523.25 Hz - C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (659.25 Hz - E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Audio autoplay or permissions prevented
  }
}

/**
 * Returns the effective clinical status, automatically promoting to 'DUE_SOON'
 * when renewal deadline is within 24 hours.
 */
export function getEffectiveStatus(status: string, renewDate: string, ptom?: string): string {
  if (status === 'HOLD' || status === 'DISCONTINUED' || (ptom && ptom.includes('HOLD'))) {
    return status;
  }
  if (status === 'DUE_SOON' || isDueWithin24Hours(renewDate, status, ptom)) {
    return 'DUE_SOON';
  }
  return status;
}

/**
 * Add days to a given "DD-MM-YYYY" string
 */
export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  const d = parseDate(dateStr) || new Date();
  d.setDate(d.getDate() + daysToAdd);
  return formatDate(d);
}

/**
 * Standard frequency options for medication administration
 */
export const FREQUENCY_PRESETS = [
  'ONCE DAILY',
  'ONCE DAILY AT NIGHT',
  'AT BEDTIME',
  'TWICE DAILY',
  'THRICE DAILY',
  'FOUR TIMES DAILY',
  'EVERY 6 HOURLY',
  'EVERY 8 HOUR',
  'EVERY 12 HOUR',
  'EVERY OTHER DAY',
  'ONCE WEEKLY',
  'WEEKLY TWICE',
  'AS NEEDED (PRN)',
];

/**
 * Administration routes
 */
export const ROUTE_OPTIONS = [
  'Oral',
  'Oral Liquid',
  'Subcutaneous',
  'Intravenous (IV)',
  'Topical',
  'Ophthalmic',
  'Inhalation',
  'Transdermal',
  'Sublingual',
  'Rectal',
];
