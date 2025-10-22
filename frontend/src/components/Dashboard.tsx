import React, { useState, useEffect } from 'react';
import type { SensorData } from '../types/SensorData';
import { fetchAllSensors, fetchSensorHistory } from '../services/ApiService';
import webSocketService from '../services/WebSocketService';
import { 
  Box, Container, Grid, Paper, Typography, Card, CardContent, 
  CardHeader, CircularProgress, Divider, List, ListItem, ListItemText 
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [historyData, setHistoryData] = useState<SensorData[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  
  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const allSensors = await fetchAllSensors();
        if (allSensors.length > 0) {
          const deviceIds = [...new Set(allSensors.map(sensor => sensor.deviceId))];
          setDevices(deviceIds);
          
          if (deviceIds.length > 0) {
            setSelectedDevice(deviceIds[0]);
            setSensorData(allSensors.find(sensor => sensor.deviceId === deviceIds[0]) || null);
            
            const history = await fetchSensorHistory(deviceIds[0]);
            setHistoryData(history);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading sensor data:', error);
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Connect to WebSocket
    webSocketService.connect();
    
    return () => {
      webSocketService.disconnect();
    };
  }, []);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = webSocketService.onSensorData((data) => {
      if (data.deviceId === selectedDevice) {
        setSensorData(data);
        setHistoryData(prev => [data, ...prev.slice(0, 99)]);
      }
      
      if (!devices.includes(data.deviceId)) {
        setDevices(prev => [...prev, data.deviceId]);
      }
    });
    
    return unsubscribe;
  }, [selectedDevice, devices]);
  
  // Handle device selection
  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    try {
      const history = await fetchSensorHistory(deviceId);
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading device history:', error);
    }
  };
  
  // Air quality color indicator
  const getAirQualityColor = (status: string): string => {
    switch (status) {
      case 'Excellent': return '#4caf50'; // Green
      case 'Good': return '#8bc34a'; // Light Green
      case 'Moderate': return '#ffeb3b'; // Yellow
      case 'Poor': return '#ff9800'; // Orange
      case 'Hazardous': return '#f44336'; // Red
      default: return '#9e9e9e'; // Grey
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom mt={3}>
        AuraLink IoT Air Quality Monitor
      </Typography>
      
      <Box mb={4}>
        <Typography variant="subtitle1" gutterBottom>
          Select Device:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {devices.map((deviceId) => (
            <Paper
              key={deviceId}
              elevation={selectedDevice === deviceId ? 5 : 1}
              sx={{
                padding: 2,
                cursor: 'pointer',
                backgroundColor: selectedDevice === deviceId ? '#e3f2fd' : 'white',
              }}
              onClick={() => handleDeviceChange(deviceId)}
            >
              <Typography variant="body1">{deviceId}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
      
      {sensorData ? (
        <>
          <Grid container spacing={3} mb={4}>
            {/* Temperature Card */}
            <Grid item xs={12} md={3}>
              <Card elevation={3}>
                <CardHeader title="Temperature" />
                <CardContent>
                  <Typography variant="h3" align="center">
                    {sensorData.temperature.toFixed(1)} °C
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Humidity Card */}
            <Grid item xs={12} md={3}>
              <Card elevation={3}>
                <CardHeader title="Humidity" />
                <CardContent>
                  <Typography variant="h3" align="center">
                    {sensorData.humidity.toFixed(1)} %
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* CO2 Card */}
            <Grid item xs={12} md={3}>
              <Card elevation={3}>
                <CardHeader title="CO2 Level" />
                <CardContent>
                  <Typography variant="h3" align="center">
                    {sensorData.co2} ppm
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Air Quality Card */}
            <Grid item xs={12} md={3}>
              <Card elevation={3}>
                <CardHeader title="Air Quality" />
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Box 
                      width={30} 
                      height={30} 
                      borderRadius="50%" 
                      bgcolor={getAirQualityColor(sensorData.airQualityStatus)}
                      mb={1}
                    />
                    <Typography variant="h5" align="center">
                      {sensorData.airQualityStatus}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Motion Card */}
            <Grid item xs={12} md={3}>
              <Card elevation={3}>
                <CardHeader title="Motion" />
                <CardContent>
                  <Typography variant="h5" align="center" color={sensorData.motionDetected ? 'error' : 'textPrimary'}>
                    {sensorData.motionDetected ? 'Detected' : 'No Motion'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Gas Levels */}
          <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Detailed Gas Levels</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText primary="Carbon Dioxide (CO2)" secondary={`${sensorData.co2} ppm`} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Ammonia (NH3)" secondary={`${sensorData.nh3} ppm`} />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText primary="Methane (CH4)" secondary={`${sensorData.ch4} ppm`} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Carbon Monoxide (CO)" secondary={`${sensorData.co} ppm`} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Chart */}
          {historyData.length > 0 && (
            <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Temperature & Humidity History</Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...historyData].reverse().slice(0, 20)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString()} 
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value: number) => new Date(value).toLocaleString()} 
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#8884d8" 
                      name="Temperature (°C)" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#82ca9d" 
                      name="Humidity (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
          
          {/* Air Quality Chart */}
          {historyData.length > 0 && (
            <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Gas Levels History</Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...historyData].reverse().slice(0, 20)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString()} 
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value: number) => new Date(value).toLocaleString()} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="co2" stroke="#ff7300" name="CO2 (ppm)" />
                    <Line type="monotone" dataKey="nh3" stroke="#387908" name="NH3 (ppm)" />
                    <Line type="monotone" dataKey="co" stroke="#d62728" name="CO (ppm)" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ padding: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            No sensor data available. Please check your device connection.
          </Typography>
        </Paper>
      )}
      
      <Box textAlign="center" my={4}>
        <Typography variant="caption" color="textSecondary">
          AuraLink IoT Air Quality Monitor • {new Date().getFullYear()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;