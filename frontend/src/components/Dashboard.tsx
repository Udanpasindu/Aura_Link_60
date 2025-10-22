import React, { useState, useEffect } from 'react';
import type { SensorData } from '../types/SensorData';
import { fetchAllSensors, fetchSensorHistory } from '../services/ApiService';
import webSocketService from '../services/WebSocketService';
import { 
  Box, Container, Grid, Paper, Typography, Card, CardContent, 
  CircularProgress, Fade, Grow, Slide, Zoom
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Thermostat as ThermostatIcon,
  Water as WaterIcon,
  Cloud as CloudIcon,
  Air as AirIcon,
  SensorsOutlined as MotionIcon,
  DeviceHub as DeviceIcon
} from '@mui/icons-material';

// Keyframe animations
const pulseAnimation = {
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.05)',
      opacity: 0.8,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
};

const fadeInUp = {
  '@keyframes fadeInUp': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
};

const rotate = {
  '@keyframes rotate': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
};

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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Fade in={true} timeout={800}>
          <Box textAlign="center">
            <Box
              sx={{
                ...rotate,
                animation: 'rotate 2s linear infinite',
              }}
            >
              <CircularProgress size={60} sx={{ color: 'white' }} />
            </Box>
            <Slide direction="up" in={true} timeout={1000}>
              <Typography variant="h6" sx={{ color: 'white', mt: 2 }}>
                Loading AuraLink Dashboard...
              </Typography>
            </Slide>
          </Box>
        </Fade>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pb: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ pt: 4, pb: 3 }}>
          <Slide direction="down" in={true} timeout={800}>
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                ...fadeInUp,
                animation: 'fadeInUp 0.8s ease-out',
              }}
            >
              AuraLink
            </Typography>
          </Slide>
          <Fade in={true} timeout={1200}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                mb: 3,
              }}
            >
              Real-time IoT Air Quality Monitoring System
            </Typography>
          </Fade>
          
          {/* Device Selection */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {devices.map((deviceId, index) => (
              <Zoom in={true} timeout={600 + index * 100} key={deviceId}>
                <Paper
                  elevation={selectedDevice === deviceId ? 8 : 2}
                  sx={{
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: selectedDevice === deviceId 
                      ? 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)' 
                      : 'rgba(255,255,255,0.95)',
                    border: selectedDevice === deviceId ? '2px solid #667eea' : '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                    },
                    ...(selectedDevice === deviceId && {
                      ...pulseAnimation,
                      animation: 'pulse 2s ease-in-out infinite',
                    }),
                  }}
                  onClick={() => handleDeviceChange(deviceId)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <DeviceIcon sx={{ 
                      color: '#667eea',
                      transition: 'transform 0.3s ease',
                    }} />
                    <Typography variant="body1" fontWeight={600}>
                      {deviceId}
                    </Typography>
                  </Box>
                </Paper>
              </Zoom>
            ))}
          </Box>
        </Box>
        
        {sensorData ? (
          <>
            {/* Main Sensor Cards */}
            <Grid container spacing={3} mb={3}>
              {/* Temperature Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={true} timeout={800}>
                  <Card 
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(255, 107, 107, 0.4)',
                      },
                      '&:hover .icon-box': {
                        transform: 'rotate(360deg)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                            Temperature
                          </Typography>
                          <Typography 
                            variant="h3" 
                            fontWeight={700}
                            sx={{
                              ...fadeInUp,
                              animation: 'fadeInUp 0.6s ease-out',
                            }}
                          >
                            {sensorData.temperature.toFixed(1)}°
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Celsius
                          </Typography>
                        </Box>
                        <Box
                          className="icon-box"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            transition: 'transform 0.6s ease',
                          }}
                        >
                          <ThermostatIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
              
              {/* Humidity Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={true} timeout={1000}>
                  <Card 
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
                      color: 'white',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(79, 172, 254, 0.4)',
                      },
                      '&:hover .icon-box': {
                        transform: 'rotate(360deg)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                            Humidity
                          </Typography>
                          <Typography 
                            variant="h3" 
                            fontWeight={700}
                            sx={{
                              ...fadeInUp,
                              animation: 'fadeInUp 0.6s ease-out 0.2s backwards',
                            }}
                          >
                            {sensorData.humidity.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Relative
                          </Typography>
                        </Box>
                        <Box
                          className="icon-box"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            transition: 'transform 0.6s ease',
                          }}
                        >
                          <WaterIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
              
              {/* CO2 Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={true} timeout={1200}>
                  <Card 
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
                      color: 'white',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(250, 112, 154, 0.4)',
                      },
                      '&:hover .icon-box': {
                        transform: 'rotate(360deg)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                            CO₂ Level
                          </Typography>
                          <Typography 
                            variant="h3" 
                            fontWeight={700}
                            sx={{
                              ...fadeInUp,
                              animation: 'fadeInUp 0.6s ease-out 0.4s backwards',
                            }}
                          >
                            {sensorData.co2}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            ppm
                          </Typography>
                        </Box>
                        <Box
                          className="icon-box"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            transition: 'transform 0.6s ease',
                          }}
                        >
                          <CloudIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
              
              {/* Air Quality Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={true} timeout={1400}>
                  <Card 
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${getAirQualityColor(sensorData.airQualityStatus)} 0%, ${getAirQualityColor(sensorData.airQualityStatus)}dd 100%)`,
                      color: 'white',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: `0 20px 40px ${getAirQualityColor(sensorData.airQualityStatus)}66`,
                      },
                      '&:hover .icon-box': {
                        transform: 'rotate(360deg)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                            Air Quality
                          </Typography>
                          <Typography 
                            variant="h4" 
                            fontWeight={700}
                            sx={{
                              ...fadeInUp,
                              animation: 'fadeInUp 0.6s ease-out 0.6s backwards',
                            }}
                          >
                            {sensorData.airQualityStatus}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Status
                          </Typography>
                        </Box>
                        <Box
                          className="icon-box"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            transition: 'transform 0.6s ease',
                          }}
                        >
                          <AirIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Motion Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Grow in={true} timeout={1600}>
                  <Card 
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      background: sensorData.motionDetected 
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: 'white',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: sensorData.motionDetected 
                          ? '0 20px 40px rgba(245, 87, 108, 0.4)'
                          : '0 20px 40px rgba(168, 237, 234, 0.4)',
                      },
                      '&:hover .icon-box': {
                        transform: 'rotate(360deg)',
                      },
                      ...(sensorData.motionDetected && {
                        ...pulseAnimation,
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }),
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                            Motion
                          </Typography>
                          <Typography 
                            variant="h4" 
                            fontWeight={700}
                            sx={{
                              ...fadeInUp,
                              animation: 'fadeInUp 0.6s ease-out 0.8s backwards',
                            }}
                          >
                            {sensorData.motionDetected ? 'Detected' : 'Clear'}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            {sensorData.motionDetected ? 'Active' : 'Inactive'}
                          </Typography>
                        </Box>
                        <Box
                          className="icon-box"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            p: 1.5,
                            transition: 'transform 0.6s ease',
                          }}
                        >
                          <MotionIcon sx={{ fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>
            
            {/* Gas Levels */}
            <Slide direction="up" in={true} timeout={1000}>
              <Paper 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  p: 3,
                  mb: 3,
                  background: 'rgba(255,255,255,0.98)',
                  ...fadeInUp,
                  animation: 'fadeInUp 0.8s ease-out',
                }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight={600}
                  gutterBottom 
                  sx={{ mb: 3, color: '#667eea' }}
                >
                  Detailed Gas Levels
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Zoom in={true} timeout={800}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
                            background: 'linear-gradient(135deg, #667eea25 0%, #764ba225 100%)',
                          },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Carbon Dioxide
                        </Typography>
                        <Typography 
                          variant="h4" 
                          fontWeight={700} 
                          color="#667eea" 
                          mt={1}
                          sx={{
                            ...fadeInUp,
                            animation: 'fadeInUp 0.5s ease-out 0.2s backwards',
                          }}
                        >
                          {sensorData.co2}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ppm
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Zoom in={true} timeout={1000}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #4ade8015 0%, #22c55e15 100%)',
                          border: '1px solid rgba(74, 222, 128, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(74, 222, 128, 0.2)',
                            background: 'linear-gradient(135deg, #4ade8025 0%, #22c55e25 100%)',
                          },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Ammonia
                        </Typography>
                        <Typography 
                          variant="h4" 
                          fontWeight={700} 
                          color="#22c55e" 
                          mt={1}
                          sx={{
                            ...fadeInUp,
                            animation: 'fadeInUp 0.5s ease-out 0.4s backwards',
                          }}
                        >
                          {sensorData.nh3}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ppm
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Zoom in={true} timeout={1200}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f59e0b15 0%, #f97316 15 100%)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)',
                            background: 'linear-gradient(135deg, #f59e0b25 0%, #f9731625 100%)',
                          },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Methane
                        </Typography>
                        <Typography 
                          variant="h4" 
                          fontWeight={700} 
                          color="#f59e0b" 
                          mt={1}
                          sx={{
                            ...fadeInUp,
                            animation: 'fadeInUp 0.5s ease-out 0.6s backwards',
                          }}
                        >
                          {sensorData.ch4}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ppm
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Zoom in={true} timeout={1400}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #ef444415 0%, #dc262615 100%)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)',
                            background: 'linear-gradient(135deg, #ef444425 0%, #dc262625 100%)',
                          },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Carbon Monoxide
                        </Typography>
                        <Typography 
                          variant="h4" 
                          fontWeight={700} 
                          color="#ef4444" 
                          mt={1}
                          sx={{
                            ...fadeInUp,
                            animation: 'fadeInUp 0.5s ease-out 0.8s backwards',
                          }}
                        >
                          {sensorData.co}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ppm
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                </Grid>
              </Paper>
            </Slide>
            
            {/* Temperature & Humidity Chart */}
            {historyData.length > 0 && (
              <Slide direction="up" in={true} timeout={1200}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    borderRadius: 4,
                    p: 3,
                    mb: 3,
                    background: 'rgba(255,255,255,0.98)',
                    ...fadeInUp,
                    animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
                  }}
                >
                  <Typography 
                    variant="h5" 
                    fontWeight={600}
                    gutterBottom 
                    sx={{ mb: 3, color: '#667eea' }}
                  >
                    Temperature & Humidity Trends
                  </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[...historyData].reverse().slice(0, 20)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4FACFE" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4FACFE" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString()} 
                        stroke="#9e9e9e"
                      />
                      <YAxis yAxisId="left" stroke="#FF6B6B" />
                      <YAxis yAxisId="right" orientation="right" stroke="#4FACFE" />
                      <Tooltip 
                        labelFormatter={(value: number) => new Date(value).toLocaleString()}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#FF6B6B" 
                        strokeWidth={3}
                        dot={{ fill: '#FF6B6B', r: 4 }}
                        name="Temperature (°C)"
                        animationDuration={1000}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#4FACFE" 
                        strokeWidth={3}
                        dot={{ fill: '#4FACFE', r: 4 }}
                        name="Humidity (%)"
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
              </Slide>
            )}
            
            {/* Gas Levels Chart */}
            {historyData.length > 0 && (
              <Slide direction="up" in={true} timeout={1400}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    borderRadius: 4,
                    p: 3,
                    mb: 3,
                    background: 'rgba(255,255,255,0.98)',
                    ...fadeInUp,
                    animation: 'fadeInUp 0.8s ease-out 0.6s backwards',
                  }}
                >
                  <Typography 
                    variant="h5" 
                    fontWeight={600}
                    gutterBottom 
                    sx={{ mb: 3, color: '#667eea' }}
                  >
                    Gas Concentration History
                  </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[...historyData].reverse().slice(0, 20)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString()} 
                        stroke="#9e9e9e"
                      />
                      <YAxis stroke="#9e9e9e" />
                      <Tooltip 
                        labelFormatter={(value: number) => new Date(value).toLocaleString()}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="co2" 
                        stroke="#667eea" 
                        strokeWidth={3}
                        dot={{ fill: '#667eea', r: 4 }}
                        name="CO₂ (ppm)"
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="nh3" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={{ fill: '#22c55e', r: 4 }}
                        name="NH₃ (ppm)"
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="co" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 4 }}
                        name="CO (ppm)"
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
              </Slide>
            )}
          </>
        ) : (
          <Fade in={true} timeout={1000}>
            <Paper 
              elevation={0}
              sx={{ 
                borderRadius: 4,
                p: 5,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.98)',
                ...fadeInUp,
                animation: 'fadeInUp 0.8s ease-out',
              }}
            >
              <Zoom in={true} timeout={800}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    mb: 2,
                  }}
                >
                  <DeviceIcon sx={{ fontSize: 48, color: '#667eea' }} />
                </Box>
              </Zoom>
              <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
                No Sensor Data Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please check your device connection and ensure the sensor is transmitting data.
              </Typography>
            </Paper>
          </Fade>
        )}
        
        {/* Footer */}
        <Fade in={true} timeout={2000}>
          <Box textAlign="center" py={4}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
              }}
            >
              AuraLink IoT Air Quality Monitor • {new Date().getFullYear()}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Powered by Real-time Environmental Monitoring
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Dashboard;