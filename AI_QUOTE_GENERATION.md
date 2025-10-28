# AI Quote Generation Feature - Implementation Guide

## Overview
This feature generates contextual, motivational quotes based on real-time sensor data using OpenAI's GPT API. The quotes are displayed on both the LCD screen of the ESP32 device and the web dashboard.

## Architecture

### Backend Components

#### 1. Quote Model (`Quote.java`)
- Location: `backend/src/main/java/com/example/backend/model/Quote.java`
- Properties:
  - `text`: The generated quote
  - `context`: Environmental context description
  - `sensorData`: Reference to the sensor data used
  - `generatedAt`: Timestamp of generation
  - `deviceId`: Target device identifier

#### 2. QuoteService (`QuoteService.java`)
- Location: `backend/src/main/java/com/example/backend/service/QuoteService.java`
- Responsibilities:
  - Generate quotes using OpenAI API
  - Build contextual prompts from sensor data
  - Handle API failures with fallback quotes
  - Truncate quotes to fit LCD display (60 characters)

**Key Methods:**
- `generateQuote(SensorData)`: Main quote generation method
- `buildPrompt(SensorData)`: Creates contextual prompt for AI
- `callOpenAI(String)`: Makes API call to OpenAI
- `createFallbackQuote(SensorData)`: Generates offline quote

#### 3. QuoteMqttService (`QuoteMqttService.java`)
- Location: `backend/src/main/java/com/example/backend/service/QuoteMqttService.java`
- Responsibilities:
  - Schedule automatic quote generation
  - Publish quotes to MQTT topic
  - Handle quote generation for multiple devices

**Configuration:**
- Scheduled interval: 10 minutes (configurable)
- MQTT Topic: `auralink/quotes`

#### 4. QuoteController (`QuoteController.java`)
- Location: `backend/src/main/java/com/example/backend/controller/QuoteController.java`
- REST Endpoints:
  - `POST /api/quotes/generate/{deviceId}`: Generate quote for specific device
  - `POST /api/quotes/generate`: Generate quote from provided sensor data

### Frontend Components

#### 1. Quote Type (`Quote.ts`)
- Location: `frontend/src/types/Quote.ts`
- TypeScript interface matching backend model

#### 2. QuoteDisplay Component (`QuoteDisplay.tsx`)
- Location: `frontend/src/components/QuoteDisplay.tsx`
- Features:
  - Beautiful gradient card design
  - Manual refresh button
  - Loading states
  - Error handling
  - Animated transitions

#### 3. API Service Updates (`ApiService.ts`)
- New functions:
  - `generateQuote(deviceId)`: Request quote for device
  - `generateQuoteFromData(sensorData)`: Generate from sensor data

#### 4. Dashboard Integration (`Dashboard.tsx`)
- Quote display added between sensor cards and gas levels
- Responsive grid layout
- Fade-in animation

### ESP32 Components

#### 1. MQTT Topic Subscription
- Topic: `auralink/quotes`
- Subscribed during MQTT connection setup

#### 2. Display States
- New state: `DISPLAY_AI_QUOTE`
- Quote display duration: 15 seconds
- Priority over suggestions, below email notifications

#### 3. Display Functions
- `handleAIQuote(String)`: Parse and store incoming quote
- `displayAIQuote()`: Render quote on LCD (4x20 display)
- Supports multi-line display (up to 80 characters)

#### 4. Audio Feedback
- 2 beeps on new quote arrival

## Configuration

### Backend Configuration (`application.properties`)

```properties
# OpenAI Configuration
openai.api.key=your-openai-api-key-here
openai.model=gpt-3.5-turbo
openai.quote.generation.enabled=true
openai.quote.generation.interval=600000
```

**Parameters:**
- `openai.api.key`: Your OpenAI API key (required)
- `openai.model`: GPT model to use (default: gpt-3.5-turbo)
- `openai.quote.generation.enabled`: Enable/disable feature (default: true)
- `openai.quote.generation.interval`: Generation interval in ms (default: 600000 = 10 minutes)

### ESP32 Configuration

**MQTT Topic:**
```cpp
const char* mqtt_quote_topic = "auralink/quotes";
```

**Display Timing:**
```cpp
const long quoteDisplayDuration = 15000;  // 15 seconds
```

## How It Works

### Flow Diagram

```
Sensor Data → Backend (QuoteService) → OpenAI API → Quote Generation
                                      ↓
                              MQTT Publish (auralink/quotes)
                                      ↓
                              ESP32 Receives Quote
                                      ↓
                              LCD Display + Beep
```

### Quote Generation Process

1. **Data Collection**: Backend receives sensor data via MQTT
2. **Prompt Building**: Service analyzes environmental conditions:
   - Temperature (high/low/comfortable)
   - Humidity (high/low/optimal)
   - Air quality status
   - CO2 levels
   - Motion detection
   - Light conditions

3. **AI Request**: Send contextual prompt to OpenAI API
4. **Response Processing**: 
   - Extract quote text
   - Remove quotation marks
   - Truncate to 60 characters for LCD
5. **Distribution**:
   - Save in Quote object
   - Publish via MQTT to ESP32
   - Available via REST API for frontend

### Display Priority (ESP32)

1. **Highest**: Email notifications (10 seconds)
2. **High**: Priority email notifications (10 seconds)
3. **Medium**: AI Quotes (15 seconds)
4. **Low**: Contextual suggestions (5 seconds)
5. **Default**: Sensor data display

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit https://platform.openai.com/
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't see it again!)

### 2. Configure Backend
1. Open `backend/src/main/resources/application.properties`
2. Replace `your-openai-api-key-here` with your actual API key
3. Adjust generation interval if desired (in milliseconds)

### 3. Build and Run Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### 4. Upload ESP32 Code
1. Open `esp32/esp32_code_updated.ino` in Arduino IDE
2. Verify WiFi and MQTT settings
3. Upload to ESP32
4. Monitor Serial output for quote reception

### 5. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Test Quote Generation (REST API)

**Generate for specific device:**
```bash
curl -X POST http://localhost:8080/api/quotes/generate/ESP32_AuraLink_Client
```

**Generate from sensor data:**
```bash
curl -X POST http://localhost:8080/api/quotes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25.5,
    "humidity": 60.0,
    "airQualityStatus": "Good",
    "co2": 450,
    "deviceId": "ESP32_AuraLink_Client"
  }'
```

### Monitor MQTT Messages

Using MQTT Explorer or command line:
```bash
mosquitto_sub -h broker.hivemq.com -t auralink/quotes -v
```

### ESP32 Serial Monitor

Look for these messages:
```
AI Quote received: Breathe deep, live well!
Displaying AI Quote: Breathe deep, live well!
Context: Temp: 25.5°C, Humidity: 60.0%, Air: Good, CO2: 450 ppm
```

## Fallback Mechanism

If OpenAI API is unavailable or disabled, the system generates contextual quotes locally:

- "Breathe deep, live well!" - Good air quality
- "Fresh air, fresh start!" - Poor air quality
- "Stay cool, stay hydrated!" - High temperature
- "Warmth brings comfort!" - Low temperature
- "Balance brings peace!" - High humidity
- "Keep moving forward!" - Motion detected
- "Every moment matters!" - Default

## Cost Considerations

**OpenAI API Pricing (GPT-3.5-turbo):**
- ~$0.0015 per quote
- Default interval: 10 minutes
- Daily cost (1 device): ~$0.22
- Monthly cost (1 device): ~$6.50

**Recommendations:**
- Increase interval to 30-60 minutes for lower costs
- Use fallback quotes for testing
- Monitor usage in OpenAI dashboard

## Troubleshooting

### Issue: Quotes not generating

**Check:**
1. OpenAI API key is valid
2. `openai.quote.generation.enabled=true`
3. Backend logs for errors
4. Internet connectivity

### Issue: Quotes not displaying on LCD

**Check:**
1. ESP32 subscribed to `auralink/quotes` topic
2. MQTT connection active
3. Serial monitor for received messages
4. Display priority (email may override)

### Issue: Frontend not showing quotes

**Check:**
1. Backend API running on port 8080
2. CORS enabled in backend
3. Browser console for errors
4. Device ID matches

## Future Enhancements

- [ ] Quote history/archive
- [ ] User-customizable quote styles
- [ ] Multi-language support
- [ ] Quote categories (motivational, educational, humorous)
- [ ] Local AI model integration (offline mode)
- [ ] Quote rating system
- [ ] Share quotes via email
- [ ] Voice synthesis for quotes

## Files Modified/Created

### Backend
- ✅ `pom.xml` - Dependencies
- ✅ `application.properties` - OpenAI configuration
- ✅ `Quote.java` - Model
- ✅ `QuoteService.java` - Core service
- ✅ `QuoteMqttService.java` - MQTT integration
- ✅ `QuoteController.java` - REST API
- ✅ `BackendApplication.java` - Enable scheduling

### Frontend
- ✅ `Quote.ts` - TypeScript type
- ✅ `ApiService.ts` - API methods
- ✅ `QuoteDisplay.tsx` - UI component
- ✅ `Dashboard.tsx` - Integration

### ESP32
- ✅ `esp32_code_updated.ino` - Complete integration

## API Reference

### REST Endpoints

#### Generate Quote for Device
```
POST /api/quotes/generate/{deviceId}
Response: Quote object
```

#### Generate Quote from Sensor Data
```
POST /api/quotes/generate
Body: SensorData object
Response: Quote object
```

### MQTT Topics

#### Quotes Topic
```
Topic: auralink/quotes
Payload: {
  "deviceId": "ESP32_AuraLink_Client",
  "quote": "Breathe deep, live well!",
  "context": "Temp: 25.5°C, Humidity: 60.0%, Air: Good, CO2: 450 ppm",
  "timestamp": 1698504123456
}
```

## Support

For issues or questions:
1. Check logs (backend, ESP32 serial monitor)
2. Verify configuration settings
3. Test with fallback quotes first
4. Review OpenAI API dashboard for errors

---

**Created**: October 2025  
**Version**: 1.0  
**Author**: Aura Link Development Team
