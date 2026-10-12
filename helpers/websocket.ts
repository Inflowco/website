import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';

interface Client {
  ws: WebSocket;
  facilityId: number | null;
  userId: number | null;
  subscriptions: Set<string>; // e.g., 'sensors', 'alerts', 'facility:1'
}

class WebSocketHub {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Client> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('WebSocket client connected');

      // Initialize client
      const client: Client = {
        ws,
        facilityId: null,
        userId: null,
        subscriptions: new Set(),
      };
      this.clients.set(ws, client);

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        message: 'Connected to CompressedAir.AI real-time server',
        timestamp: new Date().toISOString(),
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (err) {
          console.error('Invalid WebSocket message:', err);
        }
      });

      // Handle close
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });

      // Respond to pings
      ws.on('pong', () => {
        // Client is alive
      });
    });

    // Start heartbeat to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000);

    console.log('WebSocket server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        // Subscribe to a channel (e.g., 'facility:1', 'sensors', 'alerts')
        if (message.channel) {
          client.subscriptions.add(message.channel);

          // Extract facility ID if subscribing to facility channel
          if (message.channel.startsWith('facility:')) {
            client.facilityId = parseInt(message.channel.split(':')[1]);
          }

          this.send(ws, {
            type: 'subscribed',
            channel: message.channel,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'unsubscribe':
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.send(ws, {
            type: 'unsubscribed',
            channel: message.channel,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'auth':
        // Authenticate the connection
        client.userId = message.userId;
        this.send(ws, {
          type: 'authenticated',
          userId: message.userId,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ping':
        this.send(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Broadcast to all clients subscribed to a channel
  broadcast(channel: string, data: any) {
    const message = JSON.stringify({
      ...data,
      channel,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  // Broadcast to all clients subscribed to a specific facility
  broadcastToFacility(facilityId: number, data: any) {
    this.broadcast(`facility:${facilityId}`, data);
  }

  // Broadcast sensor reading to subscribed clients
  broadcastSensorReading(facilityId: number, reading: {
    sensorId: number;
    sensorName: string;
    sensorType: string;
    value: number;
    unit: string;
    timestamp: string;
  }) {
    this.broadcastToFacility(facilityId, {
      type: 'sensor_reading',
      data: reading,
    });
  }

  // Broadcast alert to subscribed clients
  broadcastAlert(facilityId: number, alert: {
    id: number;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    sensorName?: string;
    value?: number;
    unit?: string;
  }) {
    this.broadcastToFacility(facilityId, {
      type: 'alert',
      data: alert,
    });

    // Also broadcast to global alerts channel
    this.broadcast('alerts', {
      type: 'alert',
      facilityId,
      data: alert,
    });
  }

  // Get connection stats
  getStats() {
    const stats = {
      totalConnections: this.clients.size,
      facilitiesSubscribed: new Set<number>(),
    };

    this.clients.forEach((client) => {
      if (client.facilityId) {
        stats.facilitiesSubscribed.add(client.facilityId);
      }
    });

    return {
      ...stats,
      facilitiesSubscribed: Array.from(stats.facilitiesSubscribed),
    };
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss?.close();
  }
}

// Singleton instance
export const wsHub = new WebSocketHub();
