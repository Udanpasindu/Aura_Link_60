import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { SensorData } from '../types/SensorData';
import type { DeviceStatus } from '../types/SensorData';

const SOCKET_URL = 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private sensorSubscription: StompSubscription | null = null;
  private statusSubscription: StompSubscription | null = null;
  private onSensorDataCallbacks: ((data: SensorData) => void)[] = [];
  private onStatusCallbacks: ((status: DeviceStatus) => void)[] = [];
  private connected = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      debug: (str: string) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket');
        this.connected = true;
        this.subscribeToTopics();
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.connected = false;
      },
      onStompError: (frame: any) => {
        console.error('STOMP error', frame);
      },
    });
  }

  public connect() {
    if (this.client && !this.connected) {
      this.client.activate();
    }
  }

  public disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
    }
  }

  private subscribeToTopics() {
    if (this.client && this.client.connected) {
      // Subscribe to sensor data
      this.sensorSubscription = this.client.subscribe('/topic/sensors', (message: any) => {
        try {
          const sensorData: SensorData = JSON.parse(message.body);
          this.onSensorDataCallbacks.forEach(callback => callback(sensorData));
        } catch (error) {
          console.error('Error parsing sensor data', error);
        }
      });

      // Subscribe to status updates
      this.statusSubscription = this.client.subscribe('/topic/status', (message: any) => {
        try {
          const statusData: DeviceStatus = JSON.parse(message.body);
          this.onStatusCallbacks.forEach(callback => callback(statusData));
        } catch (error) {
          console.error('Error parsing status data', error);
        }
      });

      // Send connection message
      this.client.publish({
        destination: '/app/connect',
        body: JSON.stringify({
          clientId: `web-client-${Date.now()}`,
          timestamp: Date.now()
        })
      });
    }
  }

  public onSensorData(callback: (data: SensorData) => void) {
    this.onSensorDataCallbacks.push(callback);
    return () => {
      this.onSensorDataCallbacks = this.onSensorDataCallbacks.filter(cb => cb !== callback);
    };
  }

  public onStatus(callback: (status: DeviceStatus) => void) {
    this.onStatusCallbacks.push(callback);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;