import axios from 'axios';
import type { SensorData } from '../types/SensorData';

const API_URL = 'http://localhost:8080/api';

export const fetchAllSensors = async (): Promise<SensorData[]> => {
  const response = await axios.get<SensorData[]>(`${API_URL}/sensors`);
  return response.data;
};

export const fetchSensorData = async (deviceId: string): Promise<SensorData> => {
  const response = await axios.get<SensorData>(`${API_URL}/sensors/${deviceId}`);
  return response.data;
};

export const fetchSensorHistory = async (deviceId: string): Promise<SensorData[]> => {
  const response = await axios.get<SensorData[]>(`${API_URL}/sensors/${deviceId}/history`);
  return response.data;
};