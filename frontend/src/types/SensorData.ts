export interface SensorData {
  temperature: number;
  humidity: number;
  airQualityRaw: number;
  co2: number;
  nh3: number;
  ch4: number;
  co: number;
  airQualityStatus: string;
  isLight: boolean;
  deviceId: string;
  timestamp: number;
  receivedAt: string;
}

export interface DeviceStatus {
  type: string;
  message: string;
  clientId: string;
  timestamp: number;
}