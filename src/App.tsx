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
import { DueReminderModal } from './components/DueReminderModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { ResetConfirmModal } from './components/ResetConfirmModal.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { LiveSyncModal } from './components/LiveSyncModal.tsx';
import { liveSync, SyncStatus } from './services/liveSyncService.ts';
import { DrugFrequency } from './data/drugFrequencies.ts';
import { addDaysToDate, calculatePTOM, isDueWithin24Hours, isDueWithin48Hours } from './utils/dateUtils.ts';

const LOCAL_STORAGE_KEY = 'f3_medication_chart_records_v1';
const THEME_STORAGE_KEY = 'f3_medication_chart_theme_v1';
const CHIME_STORAGE_KEY = 'f3_medication_chart_chime_v1';

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

  // Default to 'cards' on mobile devices (<768px) for optimal bedside reading and touch interaction
  const [activeView, setActiveView] = useState<'mar' | 'cards' | 'print' | 'renewals'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'mar';
  });

  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inlineEditMode, setInlineEditMode] = useState<boolean>(false);

  // Print mode and scope settings
  const [printMode, setPrintMode] = useState<'renewal' | 'mar'>('renewal');
  const [printScope, setPrintScope] = useState<'48h' | '24h' | 'all'>('48h');

  // Multi-Device Live Synchronization States
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');
  const [clientCount, setClientCount] = useState<number>(1);
  const [isLiveSyncModalOpen, setIsLiveSyncModalOpen] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFrequencyChartOpen, setIsFrequencyChartOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [frequencyTargetMedication, setFrequencyTargetMedication] = useState<Medication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Audio reminder setting
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CHIME_STORAGE_KEY);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Subscribe to real-time live synchronization across all devices
  useEffect(() => {
    // Initial fetch from live server
    liveSync.fetchHttpSnapshot();

    const unsubscribe = liveSync.subscribe({
      onMedicationsChange: (remoteMeds, source) => {
        if (Array.isArray(remoteMeds) && remoteMeds.length > 0) {
          setMedications(remoteMeds);
        }
      },
      onThemeChange: (remoteTheme) => {
        setRenewalTheme(remoteTheme);
      },
      onClientCountChange: (count) => {
        setClientCount(count);
      },
      onStatusChange: (status) => {
        setSyncStatus(status);
      },
      onToastNotice: (msg) => {
        showToast(msg);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save to localStorage whenever medications change (offline resilience)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(medications));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [medications]);

  // Save theme to localStorage and sync across devices
  const handleThemeChange = (newTheme: RenewalColorTheme) => {
    setRenewalTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      // ignore
    }
    liveSync.setTheme(newTheme);
    showToast(`Renewal highlight color changed to ${newTheme.toUpperCase()}`);
  };

  const handleChimeToggle = (enabled: boolean) => {
    setChimeEnabled(enabled);
    try {
      localStorage.setItem(CHIME_STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }
    showToast(`Staff Alert Sound Chime ${enabled ? 'Enabled' : 'Disabled'}.`);
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
        !m.ptom.includes('HOLD') &&
        (m.status === 'DUE_SOON' || isDueWithin24Hours(m.renewDate, m.status, m.ptom))
    ).length;
  }, [medications]);

  // Compute 48-Hour reminder count across all active medications (≤48 hours)
  const due48hCount = useMemo(() => {
    return medications.filter(
      (m) =>
        m.status !== 'HOLD' &&
        m.status !== 'DISCONTINUED' &&
        !m.ptom.includes('HOLD') &&
        isDueWithin48Hours(m.renewDate, m.status, m.ptom)
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
      if (statusFilter === 'DUE_48H') {
        const is48h =
          m.status !== 'HOLD' &&
          m.status !== 'DISCONTINUED' &&
          isDueWithin48Hours(m.renewDate, m.status, m.ptom);
        if (!is48h) {
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

  // Handlers with Real-Time Multi-Device Synchronization
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
    // Broadcast live to all devices
    liveSync.saveMedication(med);
    showToast(`Order for ${med.medicationName} saved & synced.`);
  };

  const handleUpdateMedicationField = (id: string, field: keyof Medication, value: any) => {
    let updatedMed: Medication | null = null;
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const mod = { ...m, [field]: value };
          updatedMed = mod;
          return mod;
        }
        return m;
      })
    );
    if (updatedMed) {
      liveSync.saveMedication(updatedMed);
    }
  };

  const handleQuickRenew = (id: string, days: number = 7) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    const newStart = med.endDate || '18-10-2026';
    const newEnd = addDaysToDate(newStart, days);
    const newRenew = addDaysToDate(newEnd, 1);
    const newPtom = calculatePTOM(newRenew, false);

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
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
    // Broadcast live to all devices
    liveSync.quickRenew(id, days, newRenew, newPtom);
    showToast(`Medication extended by +${days} days across all devices.`);
  };

  const handleBatchRenew = (ids: string[], days: number = 7) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (!ids.includes(m.id)) return m;
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
    // Broadcast live to all devices
    liveSync.batchRenew(ids, days);
    showToast(`Batch renewed ${ids.length} orders by +${days} days across all devices.`);
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
    // Broadcast live to all devices
    liveSync.toggleHold(id);
    showToast(`Order status updated across all devices.`);
  };

  const handleDeleteMedication = (id: string) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    setMedicationToDelete(med);
  };

  const handleConfirmDelete = (id: string) => {
    const med = medications.find((m) => m.id === id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setMedicationToDelete(null);
    // Broadcast live deletion to all devices
    liveSync.deleteMedication(id);
    showToast(`Order for ${med?.medicationName || 'Medication'} deleted across all devices.`);
  };

  const handleAddNewRoom = (roomName: string) => {
    setSelectedRoom(roomName);
    showToast(`Room ${roomName} added to ward view.`);
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    setMedications(INITIAL_WARD_F3_MEDICATIONS);
    setSelectedRoom('ALL');
    setSearchTerm('');
    setStatusFilter('ALL');
    // Broadcast live reset to all devices
    liveSync.resetToBaseline();
    showToast('Reset to original F3 medication chart dataset on all devices.');
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
    setIsReminderModalOpen(true);
  };

  const handleOpenReminderModal = () => {
    setIsReminderModalOpen(true);
  };

  const handleOpenPrintRenewals = (scope: '48h' | '24h' | 'all' = '48h') => {
    setPrintMode('renewal');
    setPrintScope(scope);
    setActiveView('print');
    showToast(`Opened printable Renewal Orders Sheet (${scope === '48h' ? '≤48h Due' : scope === '24h' ? '<24h Critical' : 'All'}).`);
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
        setActiveView={(v) => {
          if (v === 'print') {
            setPrintMode('mar');
          }
          setActiveView(v);
        }}
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
        due48hCount={due48hCount}
        onOpenDueSoonAlerts={handleOpenDueSoonAlerts}
        onOpenReminderModal={handleOpenReminderModal}
        onOpenPrintRenewals={() => handleOpenPrintRenewals('48h')}
        syncStatus={syncStatus}
        clientCount={clientCount}
        onOpenLiveSyncModal={() => setIsLiveSyncModalOpen(true)}
      />

      {/* Main Viewport Content - Mobile friendly padding with bottom nav clearance */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-28 md:pb-8 flex-1 w-full space-y-4 sm:space-y-5">
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
            initialPrintMode={printMode}
            initialScope={printScope}
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
              onDeleteMedication={handleDeleteMedication}
              onOpenPrintRenewals={() => handleOpenPrintRenewals('all')}
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
              onOpenReminderModal={handleOpenReminderModal}
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
              onOpenReminderModal={handleOpenReminderModal}
              onOpenPrintRenewals={() => handleOpenPrintRenewals('48h')}
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
              onOpenReminderModal={handleOpenReminderModal}
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
        onDelete={handleDeleteMedication}
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

      {/* 48-Hour Medication Renewal Reminder Modal */}
      <DueReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medications={medications}
        renewalTheme={renewalTheme}
        onQuickRenew={handleQuickRenew}
        onBatchRenew={handleBatchRenew}
        onEditMedication={(med) => {
          setEditingMedication(med);
          setIsModalOpen(true);
        }}
        onToggleHold={handleToggleHold}
        onOpenPrintRenewals={handleOpenPrintRenewals}
        chimeEnabled={chimeEnabled}
        setChimeEnabled={handleChimeToggle}
      />

      {/* In-App Medication Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={medicationToDelete !== null}
        medication={medicationToDelete}
        onClose={() => setMedicationToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* In-App Baseline Dataset Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={handleConfirmReset}
      />

      {/* Multi-Device Live Synchronization Modal */}
      <LiveSyncModal
        isOpen={isLiveSyncModalOpen}
        onClose={() => setIsLiveSyncModalOpen(false)}
        status={syncStatus}
        clientCount={clientCount}
        medicationsCount={medications.length}
      />

      {/* Mobile Sticky Bottom Navigation Bar (Cards, MAR, Add FAB, Renewals, Alerts) */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={(v) => {
          if (v === 'print') {
            setPrintMode('mar');
          }
          setActiveView(v);
        }}
        onOpenAddModal={() => {
          setEditingMedication(null);
          setIsModalOpen(true);
        }}
        onOpenReminderModal={handleOpenReminderModal}
        onOpenPrintRenewals={() => handleOpenPrintRenewals('48h')}
        dueAlertsCount={dueSoonCount + due48hCount}
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
