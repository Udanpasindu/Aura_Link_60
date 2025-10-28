import type { SensorData } from './SensorData';

export interface Quote {
  text: string;
  context: string;
  sensorData: SensorData | null;
  generatedAt: string;
  deviceId: string;
}
