# AuraLink - IoT Air Quality Monitoring System

AuraLink is a full-stack IoT air quality monitoring system that provides real-time air quality data from ESP32-based sensors. The system consists of three main components:

1. **ESP32 Hardware** - Collects air quality data using DHT22 and MQ-135 sensors
2. **Spring Boot Backend** - Receives sensor data via MQTT and provides APIs and WebSocket connections
3. **React Frontend** - Displays real-time air quality data in a dashboard interface

## System Architecture

```
  ┌──────────┐        MQTT        ┌───────────┐       REST/WebSocket      ┌─────────┐
  │  ESP32   │──────────────────▶ │  Backend  │───────────────────────▶ │ Frontend │
  │ Hardware │  (HiveMQ Broker)  │(Spring Boot)│                         │ (React) │
  └──────────┘                   └───────────┘                         └─────────┘
```

## Setup Instructions

### 1. ESP32 Hardware Setup

#### Components Needed:
- ESP32 development board
- DHT22 temperature and humidity sensor
- MQ-135 gas sensor
- LDR (Light Dependent Resistor)
- I2C 20x4 LCD display
- LED
- Jumper wires and breadboard

#### Wiring:
- Connect DHT22 data pin to GPIO 32
- Connect MQ-135 output to GPIO 34 (analog)
- Connect LDR output to GPIO 33 (digital)
- Connect LED to GPIO 13
- Connect I2C display: SDA to GPIO 21, SCL to GPIO 22

#### Upload Code:
1. Open `esp32_code_updated.ino` in Arduino IDE
2. Update WiFi credentials:
   ```c
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Install required libraries:
   - DHT sensor library
   - LiquidCrystal I2C
   - PubSubClient (for MQTT)
   - ArduinoJson
   - WiFi
4. Upload the code to your ESP32

### 2. Spring Boot Backend Setup

#### Prerequisites:
- Java 21 JDK
- Maven

#### Steps:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Update the MQTT broker settings in `MqttConfig.java` if needed
3. Build and run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   (or `mvnw.cmd spring-boot:run` on Windows)

The backend server will start on port 8080.

### 3. React Frontend Setup

#### Prerequisites:
- Node.js and npm

#### Steps:
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update API endpoint in `ApiService.ts` if needed (default is `http://localhost:8080/api`)
4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

## Global MQTT Setup

This project uses HiveMQ's public MQTT broker (`broker.hivemq.com`) for demonstration purposes. For a production environment, consider:

1. Using a cloud MQTT broker service like:
   - HiveMQ Cloud (has a free tier)
   - CloudMQTT
   - AWS IoT Core

2. If using a private broker, update both the ESP32 code and backend configuration:
   - In ESP32 code: update `mqtt_server` and `mqtt_port`
   - In backend: update `MQTT_BROKER_URL` in `MqttConfig.java`

## System Features

- Real-time air quality monitoring
- Multi-device support
- Historical data visualization
- WebSocket for instant updates
- Mobile-responsive UI

## Troubleshooting

### ESP32 Connection Issues
- Verify WiFi credentials
- Check that the MQTT broker is accessible from your network
- Examine serial monitor output for connection errors

### Backend Issues
- Check that all dependencies are properly installed
- Verify that the MQTT broker is reachable
- Check log output for errors

### Frontend Issues
- Ensure all dependencies are installed
- Verify that the backend API is accessible
- Check browser console for errors

## Future Enhancements

- User authentication
- Device management
- Alert notifications
- Data storage in a database
- Mobile app support