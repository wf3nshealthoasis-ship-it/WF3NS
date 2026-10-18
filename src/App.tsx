import React, { useState, useEffect, useMemo } from 'react';
import { Medication, RenewalColorTheme } from './types/medication.ts';
import { INITIAL_WARD_F3_MEDICATIONS } from './data/wardF3InitialData.ts';
import { Header } from './components/Header.tsx';
import { StatsBar } from './components/StatsBar.tsx';
import { RoomTabs } from './components/RoomTabs.tsx';
import { RenewalColorPicker } from './components/RenewalColorPicker.tsx';
import { MedicationTable } from './components/MedicationTable.tsx';
import { MedicationModal } from './components/MedicationModal.tsx';
import { RenewalBoardView } from './components/RenewalBoardView.tsx';
import { PrintMarView } from './components/PrintMarView.tsx';
import { MedicationCardsView } from './components/MedicationCardsView.tsx';
import { FrequencySelectorModal } from './components/FrequencySelectorModal.tsx';
import { DrugFrequency } from './data/drugFrequencies.ts';
import { addDaysToDate, calculatePTOM, isDueWithin24Hours } from './utils/dateUtils.ts';

const LOCAL_STORAGE_KEY = 'f3_medication_chart_records_v1';
const THEME_STORAGE_KEY = 'f3_medication_chart_theme_v1';

export default function App() {
  // Load saved medications or fall back to Ward F3 initial data
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved medications', e);
    }
    return INITIAL_WARD_F3_MEDICATIONS;
  });

  // Renewal date & time highlight theme
  const [renewalTheme, setRenewalTheme] = useState<RenewalColorTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) return saved as RenewalColorTheme;
    } catch (e) {
      // fallback
    }
    return 'amber';
  });

  const [activeView, setActiveView] = useState<'mar' | 'cards' | 'print' | 'renewals'>('mar');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inlineEditMode, setInlineEditMode] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFrequencyChartOpen, setIsFrequencyChartOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [frequencyTargetMedication, setFrequencyTargetMedication] = useState<Medication | null>(null);

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Save to localStorage whenever medications change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(medications));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [medications]);

  // Save theme to localStorage
  const handleThemeChange = (newTheme: RenewalColorTheme) => {
    setRenewalTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      // ignore
    }
    showToast(`Renewal highlight color changed to ${newTheme.toUpperCase()}`);
  };

  // Extract all unique rooms in sorted order
  const existingRooms = useMemo(() => {
    const set = new Set<string>();
    medications.forEach((m) => {
      if (m.room) set.add(m.room);
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [medications]);

  // Compute medication counts per room
  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: medications.length };
    medications.forEach((m) => {
      counts[m.room] = (counts[m.room] || 0) + 1;
    });
    return counts;
  }, [medications]);

  // Compute DUE_SOON count across all active medications (<24 hours)
  const dueSoonCount = useMemo(() => {
    return medications.filter(
      (m) =>
        m.status !== 'HOLD' &&
        m.status !== 'DISCONTINUED' &&
        (m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom))
    ).length;
  }, [medications]);

  // Filter medications
  const filteredMedications = useMemo(() => {
    return medications.filter((m) => {
      // Room match
      if (selectedRoom !== 'ALL' && m.room !== selectedRoom) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && m.status !== 'ACTIVE') {
        return false;
      }
      if (statusFilter === 'HOLD' && m.status !== 'HOLD' && !m.ptom.includes('HOLD')) {
        return false;
      }
      if (statusFilter === 'DUE_SOON') {
        const isDue =
          m.status !== 'HOLD' &&
          m.status !== 'DISCONTINUED' &&
          (m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom));
        if (!isDue) {
          return false;
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inName = m.medicationName.toLowerCase().includes(query);
        const inDose = m.dose.toLowerCase().includes(query);
        const inRoom = m.room.toLowerCase().includes(query);
        const inFreq = m.frequency.toLowerCase().includes(query);
        const inNotes = (m.notes || '').toLowerCase().includes(query);
        return inName || inDose || inRoom || inFreq || inNotes;
      }

      return true;
    });
  }, [medications, selectedRoom, statusFilter, searchTerm]);

  // Handlers
  const handleSaveMedication = (med: Medication) => {
    setMedications((prev) => {
      const idx = prev.findIndex((m) => m.id === med.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = med;
        return updated;
      }
      return [med, ...prev];
    });
    showToast(`Order for ${med.medicationName} saved.`);
  };

  const handleUpdateMedicationField = (id: string, field: keyof Medication, value: any) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleQuickRenew = (id: string, days: number = 7) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newStart = m.endDate || '18-10-2026';
        const newEnd = addDaysToDate(newStart, days);
        const newRenew = addDaysToDate(newEnd, 1);
        const newPtom = calculatePTOM(newRenew, false);

        return {
          ...m,
          startDate: newStart,
          endDate: newEnd,
          renewDate: newRenew,
          status: 'ACTIVE',
          ptom: newPtom,
        };
      })
    );
    showToast(`Medication extended by +${days} days.`);
  };

  const handleToggleHold = (id: string) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const isCurrentlyHold = m.status === 'HOLD' || m.ptom.includes('HOLD');
        if (isCurrentlyHold) {
          const ptomRestored = calculatePTOM(m.renewDate, false);
          return { ...m, status: 'ACTIVE', ptom: ptomRestored };
        } else {
          return { ...m, status: 'HOLD', ptom: '- HOLD -' };
        }
      })
    );
    showToast(`Order status updated.`);
  };

  const handleDeleteMedication = (id: string) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    if (window.confirm(`Are you sure you want to remove ${med.medicationName} (${med.room})?`)) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      showToast(`Removed ${med.medicationName}.`);
    }
  };

  const handleAddNewRoom = (roomName: string) => {
    setSelectedRoom(roomName);
    showToast(`Room ${roomName} added to ward view.`);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all records back to the original Ward F3 patient medication chart from the document?'
      )
    ) {
      setMedications(INITIAL_WARD_F3_MEDICATIONS);
      setSelectedRoom('ALL');
      setSearchTerm('');
      setStatusFilter('ALL');
      showToast('Reset to original F3 medication chart dataset.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Room',
      'Medication Name',
      'Dose',
      'Frequency',
      'Route',
      'Start Date',
      'End Date',
      'End Time',
      'Renew Date',
      'Renew Time',
      'Status',
      'PTOM',
      'Notes',
    ];

    const rows = medications.map((m) => [
      `"${m.room}"`,
      `"${m.medicationName}"`,
      `"${m.dose}"`,
      `"${m.frequency}"`,
      `"${m.route || 'Oral'}"`,
      `"${m.startDate}"`,
      `"${m.endDate}"`,
      `"${m.endTime}"`,
      `"${m.renewDate}"`,
      `"${m.renewTime}"`,
      `"${m.status}"`,
      `"${m.ptom}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `F3_Medication_Chart_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV Medication Chart.');
  };

  const handleOpenDueSoonAlerts = () => {
    setStatusFilter('DUE_SOON');
    setActiveView('cards');
    showToast(`Filtered to ${dueSoonCount} DUE_SOON medication order${dueSoonCount > 1 ? 's' : ''} (<24h).`);
  };

  const handleSelectFrequency = (freq: DrugFrequency) => {
    if (frequencyTargetMedication) {
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id !== frequencyTargetMedication.id) return m;
          let newEndTime = m.endTime;
          let newRenewTime = m.renewTime;
          if (freq.startTime) {
            const [hStr, mStr] = freq.startTime.split(':');
            const h = parseInt(hStr, 10);
            const min = mStr || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            const formattedHour = h % 12 === 0 ? 12 : h % 12;
            const timeStr = `${formattedHour}:${min} ${ampm}`;
            newEndTime = timeStr;
            newRenewTime = timeStr;
          }
          return {
            ...m,
            frequency: freq.frequency,
            endTime: newEndTime,
            renewTime: newRenewTime,
          };
        })
      );
      showToast(`Updated frequency for ${frequencyTargetMedication.medicationName} to [${freq.code}] ${freq.frequency}`);
      setFrequencyTargetMedication(null);
    } else {
      showToast(`Selected frequency: [${freq.code}] ${freq.frequency} (${freq.doseTimes})`);
    }
    setIsFrequencyChartOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddModal={() => {
          setEditingMedication(null);
          setIsModalOpen(true);
        }}
        onOpenFrequencyList={() => {
          setFrequencyTargetMedication(null);
          setIsFrequencyChartOpen(true);
        }}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        totalMedications={medications.length}
        dueSoonCount={dueSoonCount}
        onOpenDueSoonAlerts={handleOpenDueSoonAlerts}
      />

      {/* Main Viewport Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View Routing */}
        {activeView === 'print' ? (
          <PrintMarView
            medications={medications}
            renewalTheme={renewalTheme}
            onBack={() => setActiveView('mar')}
          />
        ) : activeView === 'renewals' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <RenewalColorPicker
                currentTheme={renewalTheme}
                onThemeChange={handleThemeChange}
              />
            </div>
            <RenewalBoardView
              medications={medications}
              renewalTheme={renewalTheme}
              onQuickRenew={handleQuickRenew}
              onEditMedication={(med) => {
                setEditingMedication(med);
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : activeView === 'cards' ? (
          /* Medication Cards View */
          <div className="space-y-4">
            {/* KPI Stats Bar */}
            <StatsBar
              medications={medications}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              inlineEditMode={inlineEditMode}
              setInlineEditMode={setInlineEditMode}
              activeView={activeView}
              setActiveView={setActiveView}
            />

            {/* Renewal Date & Time Customizer Toolbar */}
            <RenewalColorPicker
              currentTheme={renewalTheme}
              onThemeChange={handleThemeChange}
            />

            {/* Room Tabs */}
            <RoomTabs
              rooms={existingRooms}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
              roomCounts={roomCounts}
              onAddNewRoom={handleAddNewRoom}
            />

            {/* Medication Cards Component */}
            <MedicationCardsView
              medications={filteredMedications}
              renewalTheme={renewalTheme}
              onEditMedication={(med) => {
                setEditingMedication(med);
                setIsModalOpen(true);
              }}
              onQuickRenew={handleQuickRenew}
              onToggleHold={handleToggleHold}
              onDeleteMedication={handleDeleteMedication}
              onOpenFrequencyPicker={(med) => {
                setFrequencyTargetMedication(med);
                setIsFrequencyChartOpen(true);
              }}
            />
          </div>
        ) : (
          /* Standard MAR Table View */
          <div className="space-y-4">
            {/* KPI Stats Bar */}
            <StatsBar
              medications={medications}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              inlineEditMode={inlineEditMode}
              setInlineEditMode={setInlineEditMode}
              activeView={activeView}
              setActiveView={setActiveView}
            />

            {/* Renewal Date & Time Customizer Toolbar */}
            <RenewalColorPicker
              currentTheme={renewalTheme}
              onThemeChange={handleThemeChange}
            />

            {/* Room Tabs */}
            <RoomTabs
              rooms={existingRooms}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
              roomCounts={roomCounts}
              onAddNewRoom={handleAddNewRoom}
            />

            {/* High-Density Interactive MAR Table */}
            <MedicationTable
              medications={filteredMedications}
              renewalTheme={renewalTheme}
              inlineEditMode={inlineEditMode}
              onEditMedication={(med) => {
                setEditingMedication(med);
                setIsModalOpen(true);
              }}
              onUpdateMedicationField={handleUpdateMedicationField}
              onQuickRenew={handleQuickRenew}
              onToggleHold={handleToggleHold}
              onDeleteMedication={handleDeleteMedication}
              onOpenFrequencyPicker={(med) => {
                setFrequencyTargetMedication(med);
                setIsFrequencyChartOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Medication Edit/Add Modal */}
      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        initialMedication={editingMedication}
        existingRooms={existingRooms}
        renewalTheme={renewalTheme}
      />

      {/* Hospital CareWare V5.0 Frequency Reference Modal */}
      <FrequencySelectorModal
        isOpen={isFrequencyChartOpen}
        onClose={() => {
          setIsFrequencyChartOpen(false);
          setFrequencyTargetMedication(null);
        }}
        currentFrequency={frequencyTargetMedication?.frequency || ''}
        onSelectFrequency={handleSelectFrequency}
      />

      {/* Minimal Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>F3 - MEDICATION CHART · Inpatient Medication Administration Record</span>
          <span className="font-mono">Reference Date: October 18, 2026</span>
        </div>
      </footer>
    </div>
  );
}
