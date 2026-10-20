import { Medication, RenewalColorTheme } from '../types/medication.ts';

// Unique device identification
const DEVICE_ID_KEY = 'f3_device_id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_' + Math.random().toString(36).substring(2, 9);
  }
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua)) return 'iPad Tablet';
  if (/iPhone/i.test(ua)) return 'iPhone Mobile';
  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return 'Android Mobile';
    return 'Android Tablet';
  }
  if (/Macintosh/i.test(ua)) return 'Mac Workstation';
  if (/Windows/i.test(ua)) return 'PC Workstation';
  return 'Mobile / Browser Device';
}

export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface LiveSyncListener {
  onMedicationsChange: (medications: Medication[], updateSource?: { action: string; deviceName?: string; medName?: string }) => void;
  onThemeChange: (theme: RenewalColorTheme) => void;
  onClientCountChange: (count: number) => void;
  onStatusChange: (status: SyncStatus) => void;
  onToastNotice: (msg: string) => void;
}

class LiveSyncManager {
  private ws: WebSocket | null = null;
  private listeners: Set<LiveSyncListener> = new Set();
  private reconnectTimer: any = null;
  private pollInterval: any = null;
  private status: SyncStatus = 'disconnected';
  private clientCount: number = 1;
  private deviceId: string = getDeviceId();
  private deviceName: string = getDeviceName();
  private isConnecting: boolean = false;
  private currentMedicationsCache: Medication[] = [];

  constructor() {
    // Connect websocket
    this.connect();

    // Background HTTP synchronization heartbeat every 3 seconds to ensure 100% data consistency
    this.pollInterval = setInterval(() => {
      this.fetchHttpSnapshot();
    }, 3000);
  }

  public subscribe(listener: LiveSyncListener): () => void {
    this.listeners.add(listener);
    // Send current status immediately
    listener.onStatusChange(this.status);
    listener.onClientCountChange(this.clientCount);
    if (this.currentMedicationsCache.length > 0) {
      listener.onMedicationsChange(this.currentMedicationsCache, { action: 'cache_sync' });
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: SyncStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.listeners.forEach((l) => l.onStatusChange(newStatus));
  }

  public connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.setStatus('connecting');

    try {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${loc.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnecting = false;
        this.setStatus('connected');
        console.log('[LiveSync] Real-time WebSocket connection established.');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[LiveSync] Message parse error:', e);
        }
      };

      ws.onclose = () => {
        this.isConnecting = false;
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      ws.onerror = () => {
        // Fallback to HTTP gracefully
        ws.close();
      };
    } catch {
      this.isConnecting = false;
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private handleServerMessage(msg: any): void {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'init': {
        if (Array.isArray(msg.medications) && msg.medications.length > 0) {
          this.currentMedicationsCache = msg.medications;
          this.listeners.forEach((l) =>
            l.onMedicationsChange(msg.medications, { action: 'initial_sync' })
          );
        }
        if (msg.theme) {
          this.listeners.forEach((l) => l.onThemeChange(msg.theme));
        }
        if (typeof msg.clientCount === 'number') {
          this.clientCount = msg.clientCount;
          this.listeners.forEach((l) => l.onClientCountChange(this.clientCount));
        }
        break;
      }

      case 'clients:count': {
        if (typeof msg.count === 'number') {
          this.clientCount = msg.count;
          this.listeners.forEach((l) => l.onClientCountChange(this.clientCount));
        }
        break;
      }

      case 'medications:sync': {
        if (Array.isArray(msg.medications) && msg.medications.length > 0) {
          this.currentMedicationsCache = msg.medications;
          const isFromOther = msg.senderDeviceId && msg.senderDeviceId !== this.deviceId;

          this.listeners.forEach((l) => {
            l.onMedicationsChange(msg.medications, {
              action: msg.action || 'sync',
              deviceName: msg.senderDeviceName,
              medName: msg.medication?.medicationName || msg.medicationName,
            });

            if (isFromOther) {
              if (msg.action === 'create') {
                l.onToastNotice(
                  `⚡ New order added: ${msg.medication?.medicationName} (${msg.medication?.room}) from ${msg.senderDeviceName || 'another device'}`
                );
              } else if (msg.action === 'quick_renew') {
                l.onToastNotice(
                  `⚡ Order renewed (+${msg.daysAdded}d): ${msg.medication?.medicationName} from ${msg.senderDeviceName || 'another device'}`
                );
              } else if (msg.action === 'delete') {
                l.onToastNotice(
                  `🗑️ Order deleted: ${msg.medicationName || 'Medication'} from ${msg.senderDeviceName || 'another device'}`
                );
              } else if (msg.action === 'toggle_hold') {
                l.onToastNotice(
                  `⚡ Hold status updated: ${msg.medication?.medicationName} from ${msg.senderDeviceName || 'another device'}`
                );
              } else if (msg.action === 'batch_renew') {
                l.onToastNotice(`⚡ Batch renewal applied from ${msg.senderDeviceName || 'another device'}`);
              } else if (msg.action === 'reset') {
                l.onToastNotice(`🔄 Chart reset back to baseline by ${msg.senderDeviceName || 'another device'}`);
              }
            }
          });
        }
        break;
      }

      case 'theme:updated': {
        if (msg.theme) {
          this.listeners.forEach((l) => l.onThemeChange(msg.theme));
        }
        break;
      }
    }
  }

  public requestFullSync(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'sync:request' });
    }
    this.fetchHttpSnapshot();
  }

  public async fetchHttpSnapshot(): Promise<void> {
    try {
      const res = await fetch('/api/medications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.medications) && data.medications.length > 0) {
          // Compare with cache or update
          const isDifferent =
            this.currentMedicationsCache.length !== data.medications.length ||
            JSON.stringify(this.currentMedicationsCache) !== JSON.stringify(data.medications);

          if (isDifferent) {
            this.currentMedicationsCache = data.medications;
            this.listeners.forEach((l) =>
              l.onMedicationsChange(data.medications, { action: 'http_snapshot' })
            );
          }
        }
        if (data.theme) {
          this.listeners.forEach((l) => l.onThemeChange(data.theme));
        }
        if (typeof data.clientCount === 'number') {
          this.clientCount = data.clientCount;
          this.listeners.forEach((l) => l.onClientCountChange(this.clientCount));
        }
      }
    } catch {
      // Offline fallback
    }
  }

  private send(msg: any): void {
    const payload = {
      ...msg,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.error('[LiveSync] Send failed:', e);
      }
    }
  }

  // Client Actions that sync to all devices with both WebSocket AND REST fallback
  public saveMedication(med: Medication): void {
    // 1. WebSocket broadcast
    this.send({
      type: 'medication:save',
      medication: med,
    });

    // 2. HTTP POST fallback with immediate confirmation
    fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication: med,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.medication) {
          // Update cache
          const idx = this.currentMedicationsCache.findIndex((m) => m.id === med.id);
          if (idx >= 0) {
            this.currentMedicationsCache[idx] = data.medication;
          } else {
            this.currentMedicationsCache.unshift(data.medication);
          }
        }
      })
      .catch((err) => console.error('[LiveSync] REST save error:', err));
  }

  public deleteMedication(id: string): void {
    this.send({
      type: 'medication:delete',
      id,
    });

    fetch(`/api/medications/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    })
      .then(() => {
        this.currentMedicationsCache = this.currentMedicationsCache.filter((m) => m.id !== id);
      })
      .catch((err) => console.error('[LiveSync] REST delete error:', err));
  }

  public quickRenew(
    id: string,
    days: number,
    newStartDate: string,
    newEndDate: string,
    newRenewDate: string,
    newPtom: string
  ): void {
    this.send({
      type: 'medication:quick_renew',
      id,
      days,
      newStartDate,
      newEndDate,
      newRenewDate,
      newPtom,
    });

    fetch('/api/medications/quick-renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        days,
        newStartDate,
        newEndDate,
        newRenewDate,
        newPtom,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    }).catch((err) => console.error('[LiveSync] REST quick-renew error:', err));
  }

  public toggleHold(id: string): void {
    this.send({
      type: 'medication:toggle_hold',
      id,
    });

    fetch('/api/medications/toggle-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    }).catch((err) => console.error('[LiveSync] REST toggle-hold error:', err));
  }

  public batchRenew(ids: string[], days: number): void {
    this.send({
      type: 'medications:batch_renew',
      ids,
      days,
    });

    fetch('/api/medications/batch-renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        days,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    }).catch((err) => console.error('[LiveSync] REST batch-renew error:', err));
  }

  public resetToBaseline(): void {
    this.send({
      type: 'medications:reset',
    });

    fetch('/api/medications/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    }).catch((err) => console.error('[LiveSync] REST reset error:', err));
  }

  public setTheme(theme: RenewalColorTheme): void {
    this.send({
      type: 'theme:change',
      theme,
    });

    fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme,
        deviceId: this.deviceId,
      }),
    }).catch((err) => console.error('[LiveSync] REST theme error:', err));
  }
}

export const liveSync = new LiveSyncManager();
