import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_WARD_F3_MEDICATIONS } from './src/data/wardF3InitialData.ts';
import { Medication, RenewalColorTheme } from './src/types/medication.ts';
import { calculatePTOM } from './src/utils/dateUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_FILE = path.resolve(__dirname, 'medications_store.json');

// In-memory state with file persistence
let medications: Medication[] = [];
let currentTheme: RenewalColorTheme = 'amber';

// Load stored medications or initialize with ward F3 defaults
function loadInitialData(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        medications = parsed;
        console.log(`[Store] Loaded ${medications.length} medications from ${DATA_FILE}`);
        return;
      }
    }
  } catch (err) {
    console.error('[Store] Failed to read stored medications file, falling back to defaults:', err);
  }

  medications = [...INITIAL_WARD_F3_MEDICATIONS];
  saveToDisk();
  console.log(`[Store] Initialized with ${medications.length} default Ward F3 medications.`);
}

function saveToDisk(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(medications, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to write medications to disk:', err);
  }
}

loadInitialData();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server on path /api/ws
const wss = new WebSocketServer({ server, path: '/api/ws' });

// Track connected clients
function broadcast(message: object, excludeWs?: WebSocket): void {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[WSS] Failed to send broadcast:', err);
      }
    }
  });
}

function broadcastClientsCount(): void {
  broadcast({
    type: 'clients:count',
    count: wss.clients.size,
    timestamp: Date.now(),
  });
}

wss.on('connection', (ws: WebSocket, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WSS] New client connected from ${clientIp}. Total active: ${wss.clients.size}`);

  // Send current state to newly connected client immediately
  ws.send(
    JSON.stringify({
      type: 'init',
      medications,
      theme: currentTheme,
      clientCount: wss.clients.size,
      timestamp: Date.now(),
    })
  );

  broadcastClientsCount();

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      handleClientMessage(ws, msg);
    } catch (err) {
      console.error('[WSS] Error parsing incoming message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WSS] Client disconnected. Total active: ${wss.clients.size}`);
    broadcastClientsCount();
  });

  ws.on('error', (err) => {
    console.error('[WSS] Socket error:', err);
  });
});

function handleClientMessage(senderWs: WebSocket, msg: any): void {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'medication:save': {
      const med: Medication = msg.medication;
      if (!med || !med.id) return;

      const idx = medications.findIndex((m) => m.id === med.id);
      const isNew = idx === -1;
      if (isNew) {
        medications.unshift(med);
      } else {
        medications[idx] = med;
      }
      saveToDisk();

      // Broadcast update to all clients (including or excluding sender)
      broadcast({
        type: isNew ? 'medication:created' : 'medication:updated',
        medication: med,
        senderDeviceId: msg.deviceId,
        senderDeviceName: msg.deviceName || 'Device',
        timestamp: Date.now(),
      });
      break;
    }

    case 'medication:delete': {
      const id: string = msg.id;
      if (!id) return;
      const target = medications.find((m) => m.id === id);
      medications = medications.filter((m) => m.id !== id);
      saveToDisk();

      broadcast({
        type: 'medication:deleted',
        id,
        medicationName: target?.medicationName,
        senderDeviceId: msg.deviceId,
        senderDeviceName: msg.deviceName || 'Device',
        timestamp: Date.now(),
      });
      break;
    }

    case 'medication:quick_renew': {
      const { id, days, newRenewDate, newPtom } = msg;
      const med = medications.find((m) => m.id === id);
      if (med) {
        med.renewDate = newRenewDate;
        med.ptom = newPtom || calculatePTOM(newRenewDate, med.status === 'HOLD');
        if (med.status === 'EXPIRED') {
          med.status = 'ACTIVE';
        }
        saveToDisk();

        broadcast({
          type: 'medication:updated',
          medication: med,
          action: 'quick_renew',
          daysAdded: days,
          senderDeviceId: msg.deviceId,
          senderDeviceName: msg.deviceName || 'Device',
          timestamp: Date.now(),
        });
      }
      break;
    }

    case 'medication:toggle_hold': {
      const { id } = msg;
      const med = medications.find((m) => m.id === id);
      if (med) {
        med.status = med.status === 'HOLD' ? 'ACTIVE' : 'HOLD';
        med.ptom = calculatePTOM(med.renewDate, med.status === 'HOLD');
        saveToDisk();

        broadcast({
          type: 'medication:updated',
          medication: med,
          action: 'toggle_hold',
          senderDeviceId: msg.deviceId,
          senderDeviceName: msg.deviceName || 'Device',
          timestamp: Date.now(),
        });
      }
      break;
    }

    case 'medications:batch_renew': {
      const { ids, days } = msg;
      if (Array.isArray(ids)) {
        // Updated items
        const updatedIds = new Set(ids);
        medications = medications.map((m) => {
          if (updatedIds.has(m.id)) {
            // Recalculate
            const [d, mo, yr] = m.renewDate.split('-').map(Number);
            const date = new Date(yr, mo - 1, d);
            date.setDate(date.getDate() + Number(days));
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            const newRenew = `${dd}-${mm}-${yyyy}`;
            const isHold = m.status === 'HOLD';
            return {
              ...m,
              renewDate: newRenew,
              status: m.status === 'EXPIRED' ? 'ACTIVE' : m.status,
              ptom: calculatePTOM(newRenew, isHold),
            };
          }
          return m;
        });
        saveToDisk();

        broadcast({
          type: 'medications:sync',
          medications,
          action: 'batch_renew',
          senderDeviceId: msg.deviceId,
          senderDeviceName: msg.deviceName || 'Device',
          timestamp: Date.now(),
        });
      }
      break;
    }

    case 'medications:reset': {
      medications = [...INITIAL_WARD_F3_MEDICATIONS];
      saveToDisk();

      broadcast({
        type: 'medications:sync',
        medications,
        action: 'reset',
        senderDeviceId: msg.deviceId,
        senderDeviceName: msg.deviceName || 'Device',
        timestamp: Date.now(),
      });
      break;
    }

    case 'theme:change': {
      if (msg.theme) {
        currentTheme = msg.theme;
        broadcast({
          type: 'theme:updated',
          theme: currentTheme,
          senderDeviceId: msg.deviceId,
          timestamp: Date.now(),
        });
      }
      break;
    }

    case 'sync:request': {
      senderWs.send(
        JSON.stringify({
          type: 'medications:sync',
          medications,
          theme: currentTheme,
          clientCount: wss.clients.size,
          timestamp: Date.now(),
        })
      );
      break;
    }
  }
}

// REST API Endpoints (as complement & fallback for standard HTTP requests)
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    ward: 'F3',
    medicationsCount: medications.length,
    activeDevicesCount: wss.clients.size,
    theme: currentTheme,
    timestamp: Date.now(),
  });
});

app.get('/api/medications', (_req: Request, res: Response) => {
  res.json({
    success: true,
    medications,
    theme: currentTheme,
    clientCount: wss.clients.size,
    timestamp: Date.now(),
  });
});

app.post('/api/medications', (req: Request, res: Response) => {
  const { medication, deviceId, deviceName } = req.body;
  if (!medication || !medication.id) {
    res.status(400).json({ error: 'Missing medication or medication ID' });
    return;
  }

  const idx = medications.findIndex((m) => m.id === medication.id);
  const isNew = idx === -1;
  if (isNew) {
    medications.unshift(medication);
  } else {
    medications[idx] = medication;
  }
  saveToDisk();

  broadcast({
    type: isNew ? 'medication:created' : 'medication:updated',
    medication,
    senderDeviceId: deviceId,
    senderDeviceName: deviceName || 'Device',
    timestamp: Date.now(),
  });

  res.json({ success: true, medication });
});

app.delete('/api/medications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { deviceId, deviceName } = req.body || {};
  const target = medications.find((m) => m.id === id);
  if (!target) {
    res.status(404).json({ error: 'Medication not found' });
    return;
  }

  medications = medications.filter((m) => m.id !== id);
  saveToDisk();

  broadcast({
    type: 'medication:deleted',
    id,
    medicationName: target.medicationName,
    senderDeviceId: deviceId,
    senderDeviceName: deviceName || 'Device',
    timestamp: Date.now(),
  });

  res.json({ success: true, deletedId: id });
});

app.post('/api/medications/reset', (req: Request, res: Response) => {
  const { deviceId, deviceName } = req.body || {};
  medications = [...INITIAL_WARD_F3_MEDICATIONS];
  saveToDisk();

  broadcast({
    type: 'medications:sync',
    medications,
    action: 'reset',
    senderDeviceId: deviceId,
    senderDeviceName: deviceName || 'Device',
    timestamp: Date.now(),
  });

  res.json({ success: true, count: medications.length });
});

app.post('/api/theme', (req: Request, res: Response) => {
  const { theme, deviceId } = req.body;
  if (theme) {
    currentTheme = theme;
    broadcast({
      type: 'theme:updated',
      theme,
      senderDeviceId: deviceId,
      timestamp: Date.now(),
    });
  }
  res.json({ success: true, theme: currentTheme });
});

// Vite middleware or static serving
async function setupViteOrStatic() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static files from dist.');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live multi-device server running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] WebSocket live synchronization available at ws://0.0.0.0:${PORT}/api/ws`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('[Server] Failed to initialize server:', err);
  process.exit(1);
});
