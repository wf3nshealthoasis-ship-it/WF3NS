export type MedicationStatus = 'ACTIVE' | 'HOLD' | 'DUE' | 'EXPIRED' | 'DISCONTINUED';

export interface Medication {
  id: string;
  room: string;             // e.g. "RM 377"
  patientName?: string;     // e.g. "John Doe" or room patient descriptor
  medicationName: string;   // e.g. "PANTOPRAZOLE"
  dose: string;             // e.g. "20 mg"
  frequency: string;        // e.g. "ONCE DAILY"
  route?: string;           // e.g. "Oral", "IV", "Topical"
  startDate: string;        // e.g. "18-10-2026"
  endDate: string;          // e.g. "24-10-2026"
  endTime: string;          // e.g. "9:00 AM"
  renewDate: string;        // e.g. "25-10-2026"
  renewTime: string;        // e.g. "9:00 AM"
  status: MedicationStatus; // 'ACTIVE', 'HOLD', etc.
  ptom: string;             // e.g. "7 DAYS", "2 DAYS", "-5 DAYS HOLD"
  notes?: string;
  prescribingDoctor?: string;
}

export type RenewalColorTheme = 'amber' | 'coral' | 'violet' | 'emerald' | 'cyan' | 'urgency';

export interface RenewalThemeConfig {
  id: RenewalColorTheme;
  name: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  headerAccent: string;
}
