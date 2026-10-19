import { Medication, RenewalColorTheme } from '../types/medication.ts';

// Unique device identification
const DEVICE_ID_KEY = 'f3_device_id';
const LOCAL_STORAGE_KEY = 'ward_f3_medications_v2';
const THEME_STORAGE_KEY = 'ward_f3_renewal_theme';

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

  constructor() {
    // Start connection
    this.connect();
    // Safety polling every 8s as fallback if websockets are delayed
    this.pollInterval = setInterval(() => {
      if (this.status !== 'connected') {
        this.fetchHttpSnapshot();
      }
    }, 8000);
  }

  public subscribe(listener: LiveSyncListener): () => void {
    this.listeners.add(listener);
    // Send current status immediately
    listener.onStatusChange(this.status);
    listener.onClientCountChange(this.clientCount);
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
      // In dev environment or production, port and host
      const wsUrl = `${protocol}//${loc.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnecting = false;
        this.setStatus('connected');
        console.log('[LiveSync] Connected to Ward F3 real-time synchronization server.');
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

      ws.onerror = (err) => {
        console.warn('[LiveSync] Socket error, falling back to HTTP:', err);
        ws.close();
      };
    } catch (e) {
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
    }, 3000);
  }

  private handleServerMessage(msg: any): void {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'init': {
        if (Array.isArray(msg.medications)) {
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

      case 'medication:created': {
        const isFromOther = msg.senderDeviceId !== this.deviceId;
        this.listeners.forEach((l) => {
          l.onMedicationsChange([], {
            action: 'created',
            deviceName: msg.senderDeviceName,
            medName: msg.medication?.medicationName,
          });
          if (isFromOther) {
            l.onToastNotice(
              `⚡ New order added: ${msg.medication?.medicationName} (${msg.medication?.room}) from ${msg.senderDeviceName || 'another device'}`
            );
          }
        });
        // Request full authoritative sync to prevent any state mismatch
        this.requestFullSync();
        break;
      }

      case 'medication:updated': {
        const isFromOther = msg.senderDeviceId !== this.deviceId;
        this.listeners.forEach((l) => {
          l.onMedicationsChange([], {
            action: 'updated',
            deviceName: msg.senderDeviceName,
            medName: msg.medication?.medicationName,
          });
          if (isFromOther) {
            const actionText = msg.action === 'quick_renew'
              ? `Renewed (+${msg.daysAdded}d)`
              : msg.action === 'toggle_hold'
              ? 'Hold status changed'
              : 'Updated';
            l.onToastNotice(
              `⚡ ${actionText}: ${msg.medication?.medicationName} (${msg.medication?.room}) from ${msg.senderDeviceName || 'another device'}`
            );
          }
        });
        this.requestFullSync();
        break;
      }

      case 'medication:deleted': {
        const isFromOther = msg.senderDeviceId !== this.deviceId;
        this.listeners.forEach((l) => {
          l.onMedicationsChange([], {
            action: 'deleted',
            deviceName: msg.senderDeviceName,
            medName: msg.medicationName,
          });
          if (isFromOther) {
            l.onToastNotice(
              `🗑️ Order deleted: ${msg.medicationName || 'Medication'} from ${msg.senderDeviceName || 'another device'}`
            );
          }
        });
        this.requestFullSync();
        break;
      }

      case 'medications:sync': {
        if (Array.isArray(msg.medications)) {
          const isFromOther = msg.senderDeviceId !== this.deviceId;
          this.listeners.forEach((l) => {
            l.onMedicationsChange(msg.medications, {
              action: msg.action || 'sync',
              deviceName: msg.senderDeviceName,
            });
            if (isFromOther && msg.action === 'reset') {
              l.onToastNotice(`🔄 Chart reset back to baseline by ${msg.senderDeviceName || 'another device'}`);
            } else if (isFromOther && msg.action === 'batch_renew') {
              l.onToastNotice(`⚡ Batch renewal applied from ${msg.senderDeviceName || 'another device'}`);
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
    } else {
      this.fetchHttpSnapshot();
    }
  }

  public async fetchHttpSnapshot(): Promise<void> {
    try {
      const res = await fetch('/api/medications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.medications)) {
          this.listeners.forEach((l) =>
            l.onMedicationsChange(data.medications, { action: 'http_sync' })
          );
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
      // offline or server starting up
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

  // Client Actions that sync to all devices
  public saveMedication(med: Medication): void {
    this.send({
      type: 'medication:save',
      medication: med,
    });
    // Also push via HTTP as guarantee
    fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication: med,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      }),
    }).catch(() => {});
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
    }).catch(() => {});
  }

  public quickRenew(id: string, days: number, newRenewDate: string, newPtom: string): void {
    this.send({
      type: 'medication:quick_renew',
      id,
      days,
      newRenewDate,
      newPtom,
    });
  }

  public toggleHold(id: string): void {
    this.send({
      type: 'medication:toggle_hold',
      id,
    });
  }

  public batchRenew(ids: string[], days: number): void {
    this.send({
      type: 'medications:batch_renew',
      ids,
      days,
    });
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
    }).catch(() => {});
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
    }).catch(() => {});
  }
}

export const liveSync = new LiveSyncManager();
