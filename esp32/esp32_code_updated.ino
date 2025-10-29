#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ================== WiFi & MQTT Configuration ==================
// WiFi credentials
const char* ssid = "Dulshan Dialog 4G 643";
const char* password = "4Ce147c3";

// MQTT Broker details
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_AuraLink_Client";

// MQTT Topics
const char* mqtt_topic = "auralink/sensors";
const char* mqtt_status_topic = "auralink/status";
const char* mqtt_quote_topic = "auralink/quotes";
const char* TOPIC_EMAIL_NOTIFICATIONS = "iot/email/notifications";
const char* TOPIC_EMAIL_NEW = "iot/email/new";
const char* TOPIC_EMAIL_PRIORITY = "iot/email/priority";
const char* TOPIC_EMAIL_ALL_READ = "iot/email/allread";
const char* TOPIC_EMAIL_PRIORITY_READ = "iot/email/priorityread";

// ================== Hardware Components ==================
WiFiClient espClient;
PubSubClient mqtt(espClient);
LiquidCrystal_I2C lcd(0x27, 20, 4);
DHT dht(32, DHT22);

// ================== Timing Configuration ==================
unsigned long lastMsgTime = 0;
unsigned long lastSuggestionTime = 0;
unsigned long suggestionStartTime = 0;
unsigned long emailDisplayStartTime = 0;
unsigned long quoteDisplayStartTime = 0;
const long msgInterval = 5000;              // Sensor data publish interval
const long suggestionInterval = 30000;      // Show suggestion every 30 seconds
const long suggestionDuration = 5000;       // Show suggestion for 5 seconds
const long emailDisplayDuration = 10000;    // Show email summary for 10 seconds
const long quoteDisplayDuration = 15000;    // Show AI quote for 15 seconds

// ================== Pin Configuration ==================
// I2C pins
#define I2C_SDA 21
#define I2C_SCL 22

// Sensor pins
#define DHTPIN 32
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define LDR_PIN 33
#define PIR_PIN 25

// Control pins
#define LED_PIN 13              // Ambient light LED
#define BUZZER_PIN 27           // Buzzer

// Email notification LEDs
#define EMAIL_BLUE_LED_PIN 19   // Blue LED for unread emails
#define EMAIL_RED_LED_PIN 18    // Red LED for priority emails
#define ENV_GREEN_LED_PIN 17    // Green LED for good air quality

// ================== Data Structures ==================
struct SensorReadings {
  float temperature;
  float humidity;
  int mq135_raw;
  int co2_ppm;
  int nh3_ppm;
  int ch4_ppm;
  int co_ppm;
  String airQualityStatus;
  bool isLight;
  bool motionDetected;
};

struct EmailStats {
  int unreadEmails;
  int priorityEmails;
  int unreadPriorityEmails;
  String lastEmailSummary;
  bool hasNewEmail;
  bool hasPriorityEmail;
};

struct AIQuote {
  String text;
  String context;
  bool hasNewQuote;
};

SensorReadings currentReadings;
EmailStats emailStats = {0, 0, 0, "", false, false};
AIQuote currentQuote = {"", "", false};

// Display states
enum DisplayState {
  DISPLAY_SENSORS,
  DISPLAY_EMAIL_SUMMARY,
  DISPLAY_SUGGESTION,
  DISPLAY_AI_QUOTE
};

DisplayState currentDisplay = DISPLAY_SENSORS;
bool envLedState = false;
unsigned long lastEnvLedToggle = 0;
const long envLedToggleInterval = 1000;

// ================== Suggestions Array ==================
const String suggestions[] = {
  "Check your emails!",
  "Stay hydrated today!",
  "Fresh air detected!",
  "Good environment!",
  "Monitor your health!",
  "Perfect temperature!",
  "Air quality excellent!",
  "Stay productive!",
  "Humidity optimal!",
  "Environment safe!",
  "Priority emails wait!",
  "Inbox needs attention!",
  "Clear air, clear mind!",
  "Temperature balanced!",
  "Motion detected!",
  "Light level good!",
  "Breathe easy!",
  "Stay connected!",
  "IoT monitoring you!",
  "Smart home active!"
};
const int numSuggestions = sizeof(suggestions) / sizeof(suggestions[0]);
int currentSuggestionIndex = 0;

// ================== WiFi Functions ==================
void setup_wifi() {
  delay(10);
  lcd.setCursor(0, 0);
  lcd.print("Connecting to WiFi");
  
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempt % 16, 1);
    lcd.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("WiFi connection failed");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi failed");
    lcd.setCursor(0, 1);
    lcd.print("Using offline mode");
    delay(2000);
  }
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("MQTT received:");
  Serial.println("Topic: " + String(topic));
  Serial.println("Message: " + message);

  String topicStr = String(topic);

  if (topicStr == TOPIC_EMAIL_NEW || topicStr == TOPIC_EMAIL_NOTIFICATIONS) {
    handleEmailNotification(message);
  } else if (topicStr == TOPIC_EMAIL_PRIORITY) {
    handlePriorityEmailNotification(message);
  } else if (topicStr == TOPIC_EMAIL_ALL_READ) {
    handleAllEmailsRead();
  } else if (topicStr == TOPIC_EMAIL_PRIORITY_READ) {
    handlePriorityEmailsRead();
  } else if (topicStr == mqtt_quote_topic) {
    handleAIQuote(message);
  }
}

void mqtt_reconnect() {
  // Try to reconnect to MQTT broker
  if (WiFi.status() == WL_CONNECTED) {
    int attempts = 0;
    
    // Loop until we're reconnected or max attempts reached
    while (!mqtt.connected() && attempts < 3) {
      Serial.print("Attempting MQTT connection...");
      // Attempt to connect
      if (mqtt.connect(mqtt_client_id)) {
        Serial.println("connected");
        
        // Publish a connection message
        mqtt.publish(mqtt_status_topic, "{\"status\":\"connected\",\"device\":\"ESP32_AuraLink\"}");
        
        // Subscribe to email topics
        mqtt.subscribe(TOPIC_EMAIL_NOTIFICATIONS);
        mqtt.subscribe(TOPIC_EMAIL_NEW);
        mqtt.subscribe(TOPIC_EMAIL_PRIORITY);
        mqtt.subscribe(TOPIC_EMAIL_ALL_READ);
        mqtt.subscribe(TOPIC_EMAIL_PRIORITY_READ);
        mqtt.subscribe(mqtt_quote_topic);
        
        Serial.println("Subscribed to email and quote topics");
        
      } else {
        Serial.print("failed, rc=");
        Serial.print(mqtt.state());
        Serial.println(" trying again in 5 seconds");
        delay(5000);
      }
      attempts++;
    }
  }
}

// ================== Email Notification Handlers ==================
void handleEmailNotification(String message) {
  JsonDocument doc;
  deserializeJson(doc, message);

  String type = doc["type"];

  if (type == "new_emails") {
    int count = doc["count"];
    String summary = doc["summary"] | "";
    
    Serial.println("New email: " + String(count));
    
    emailStats.unreadEmails = count;
    emailStats.hasNewEmail = true;
    
    if (summary.length() > 0) {
      // Truncate to 80 characters
      if (summary.length() > 80) {
        emailStats.lastEmailSummary = summary.substring(0, 80);
      } else {
        emailStats.lastEmailSummary = summary;
      }
      
      // Display email summary
      currentDisplay = DISPLAY_EMAIL_SUMMARY;
      emailDisplayStartTime = millis();
      displayEmailSummary(emailStats.lastEmailSummary);
    }
    
    // Turn on blue LED
    digitalWrite(EMAIL_BLUE_LED_PIN, HIGH);
    
    // 3 beeps for new email
    beepPattern(3, 200, 150);
    
  } else if (type == "email_statistics") {
    emailStats.unreadEmails = doc["unread"] | 0;
    emailStats.priorityEmails = doc["priority"] | 0;
    emailStats.unreadPriorityEmails = doc["unread_priority"] | 0;
    
    Serial.println("Email stats: unread=" + String(emailStats.unreadEmails) + 
                   ", priority=" + String(emailStats.unreadPriorityEmails));
    
    controlEmailLEDs();
  }
}

void handlePriorityEmailNotification(String message) {
  JsonDocument doc;
  deserializeJson(doc, message);

  String type = doc["type"];

  if (type == "priority_emails") {
    int count = doc["count"];
    String summary = doc["summary"] | "";
    
    Serial.println("Priority email: " + String(count));
    
    emailStats.priorityEmails = count;
    emailStats.unreadPriorityEmails = count;
    emailStats.hasPriorityEmail = true;
    
    if (summary.length() > 0) {
      // Truncate to 80 characters
      if (summary.length() > 80) {
        emailStats.lastEmailSummary = summary.substring(0, 80);
      } else {
        emailStats.lastEmailSummary = summary;
      }
      
      // Display email summary
      currentDisplay = DISPLAY_EMAIL_SUMMARY;
      emailDisplayStartTime = millis();
      displayEmailSummary(emailStats.lastEmailSummary);
    }
    
    // Turn on red LED
    digitalWrite(EMAIL_RED_LED_PIN, HIGH);
    
    // 4 long beeps for priority email
    beepPattern(4, 400, 200);
  }
}

void handleAllEmailsRead() {
  Serial.println("All emails read");
  emailStats.unreadEmails = 0;
  digitalWrite(EMAIL_BLUE_LED_PIN, LOW);
  beepPattern(1, 100, 0);
}

void handlePriorityEmailsRead() {
  Serial.println("Priority emails read");
  emailStats.unreadPriorityEmails = 0;
  digitalWrite(EMAIL_RED_LED_PIN, LOW);
  beepPattern(2, 100, 100);
}

// ================== AI Quote Handler ==================
void handleAIQuote(String message) {
  JsonDocument doc;
  deserializeJson(doc, message);

  String quote = doc["quote"] | "";
  String context = doc["context"] | "";
  
  if (quote.length() > 0) {
    Serial.println("AI Quote received: " + quote);
    
    // Truncate to 80 characters for LCD display
    if (quote.length() > 80) {
      currentQuote.text = quote.substring(0, 77) + "...";
    } else {
      currentQuote.text = quote;
    }
    
    currentQuote.context = context;
    currentQuote.hasNewQuote = true;
    
    // Display the AI quote
    currentDisplay = DISPLAY_AI_QUOTE;
    quoteDisplayStartTime = millis();
    displayAIQuote();
    
    // 2 beeps for new quote
    beepPattern(2, 150, 100);
  }
}

// ================== LED Control Functions ==================
void controlEmailLEDs() {
  // Blue LED for unread emails - turns ON when unread count >= 1
  if (emailStats.unreadEmails >= 1) {
    digitalWrite(EMAIL_BLUE_LED_PIN, HIGH);
  } else {
    digitalWrite(EMAIL_BLUE_LED_PIN, LOW);
  }
  
  // Red LED for priority emails
  if (emailStats.unreadPriorityEmails > 0) {
    digitalWrite(EMAIL_RED_LED_PIN, HIGH);
  } else {
    digitalWrite(EMAIL_RED_LED_PIN, LOW);
  }
}

void controlEnvironmentLED() {
  // Check all sensor parameters for good environment
  bool airQualityGood = (currentReadings.airQualityStatus == "Excellent" || 
                         currentReadings.airQualityStatus == "Good");
  bool temperatureGood = (currentReadings.temperature >= 18.0 && currentReadings.temperature <= 30.0);
  bool humidityGood = (currentReadings.humidity >= 30.0 && currentReadings.humidity <= 70.0);
  bool co2Good = (currentReadings.co2_ppm < 1000); // CO2 under 1000 ppm is good
  
  // All sensors must be good for green LED to blink
  bool allSensorsGood = airQualityGood && temperatureGood && humidityGood && co2Good;
  
  if (allSensorsGood) {
    // Blink green LED - 1 second ON, 1 second OFF (smooth blinking)
    if (millis() - lastEnvLedToggle >= envLedToggleInterval) {
      envLedState = !envLedState;
      digitalWrite(ENV_GREEN_LED_PIN, envLedState ? HIGH : LOW);
      lastEnvLedToggle = millis();
      
      // Log status periodically
      static unsigned long lastLog = 0;
      if (millis() - lastLog >= 10000) { // Every 10 seconds
        Serial.println("✓ All sensors good - Green LED blinking");
        lastLog = millis();
      }
    }
  } else {
    // Turn off green LED if environment is not good
    digitalWrite(ENV_GREEN_LED_PIN, LOW);
    envLedState = false;
    
    // Log what's wrong periodically
    static unsigned long lastWarningLog = 0;
    if (millis() - lastWarningLog >= 30000) { // Every 30 seconds
      Serial.println("⚠ Environment not optimal:");
      if (!airQualityGood) Serial.println("  - Air quality: " + currentReadings.airQualityStatus);
      if (!temperatureGood) Serial.println("  - Temperature: " + String(currentReadings.temperature) + "°C");
      if (!humidityGood) Serial.println("  - Humidity: " + String(currentReadings.humidity) + "%");
      if (!co2Good) Serial.println("  - CO2: " + String(currentReadings.co2_ppm) + " ppm");
      lastWarningLog = millis();
    }
  }
}

// ================== Buzzer Functions ==================
void beepPattern(int count, int duration, int pause) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < count - 1) {
      delay(pause);
    }
  }
}

// ================== WiFi Monitoring ==================
void checkWiFiStatus() {
  static unsigned long lastWiFiCheck = 0;
  static bool wifiWasConnected = true;
  static bool isBeeping = false;
  static unsigned long lastBeep = 0;

  if (millis() - lastWiFiCheck > 5000) {
    bool wifiConnected = (WiFi.status() == WL_CONNECTED);

    if (!wifiConnected && wifiWasConnected) {
      Serial.println("WiFi disconnected! Beeping...");
      isBeeping = true;
    } else if (wifiConnected && !wifiWasConnected) {
      Serial.println("WiFi reconnected!");
      isBeeping = false;
      digitalWrite(BUZZER_PIN, LOW);
    }

    wifiWasConnected = wifiConnected;
    lastWiFiCheck = millis();
  }

  if (isBeeping && (millis() - lastBeep > 1000)) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    lastBeep = millis();
  }
}

// ================== Sensor Reading ==================
void readAllSensors() {
  // Read DHT22
  currentReadings.temperature = dht.readTemperature();
  currentReadings.humidity = dht.readHumidity();

  if (isnan(currentReadings.temperature) || isnan(currentReadings.humidity)) {
    Serial.println("DHT22 read error!");
    currentReadings.temperature = 0.0;
    currentReadings.humidity = 0.0;
  }

  // Read MQ135
  currentReadings.mq135_raw = analogRead(MQ135_PIN);
  currentReadings.co2_ppm = map(currentReadings.mq135_raw, 0, 4095, 400, 5000);
  currentReadings.nh3_ppm = map(currentReadings.mq135_raw, 0, 4095, 1, 500);
  currentReadings.ch4_ppm = map(currentReadings.mq135_raw, 0, 4095, 200, 10000);
  currentReadings.co_ppm = map(currentReadings.mq135_raw, 0, 4095, 1, 1000);
  currentReadings.airQualityStatus = airQualityStatus(currentReadings.mq135_raw);

  // Read LDR and control ambient LED
  int lightState = digitalRead(LDR_PIN);
  currentReadings.isLight = (lightState == HIGH);
  
  if (lightState == LOW) {
    digitalWrite(LED_PIN, LOW);  // Dark - turn ON LED
    lcd.backlight();
  } else {
    digitalWrite(LED_PIN, HIGH);   // Bright - turn OFF LED
    lcd.backlight();
  }

  // Read motion sensor
  currentReadings.motionDetected = (digitalRead(PIR_PIN) == HIGH);

  Serial.println("=== Sensors ===");
  Serial.println("Temp: " + String(currentReadings.temperature, 1) + "°C");
  Serial.println("Humidity: " + String(currentReadings.humidity, 1) + "%");
  Serial.println("Air: " + currentReadings.airQualityStatus);
  Serial.println("CO2: " + String(currentReadings.co2_ppm) + "ppm");
}

// ================== Display Functions ==================
void displayEmailSummary(String summary) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("*** NEW EMAIL ***");
  
  // Display 80 characters across 3 lines (20 chars per line)
  int len = summary.length();
  
  if (len <= 20) {
    lcd.setCursor(0, 1);
    lcd.print(summary);
  } else if (len <= 40) {
    lcd.setCursor(0, 1);
    lcd.print(summary.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(summary.substring(20));
  } else if (len <= 60) {
    lcd.setCursor(0, 1);
    lcd.print(summary.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(summary.substring(20, 40));
    lcd.setCursor(0, 3);
    lcd.print(summary.substring(40));
  } else {
    lcd.setCursor(0, 1);
    lcd.print(summary.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(summary.substring(20, 40));
    lcd.setCursor(0, 3);
    lcd.print(summary.substring(40, 60));
  }
  
  Serial.println("Displaying email: " + summary);
}

String getContextualSuggestion() {
  String suggestion = "";
  
  if (emailStats.unreadPriorityEmails > 0) {
    suggestion = "Urgent: " + String(emailStats.unreadPriorityEmails) + " priority!";
  } else if (emailStats.unreadEmails > 0) {
    suggestion = String(emailStats.unreadEmails) + " unread emails";
  } else if (currentReadings.airQualityStatus == "Excellent") {
    suggestion = "Air quality perfect!";
  } else if (currentReadings.airQualityStatus == "Poor" || currentReadings.airQualityStatus == "Hazardous") {
    suggestion = "Warning: Poor air!";
  } else if (currentReadings.temperature > 30) {
    suggestion = "High temperature!";
  } else if (currentReadings.humidity < 30) {
    suggestion = "Low humidity!";
  } else if (currentReadings.humidity > 70) {
    suggestion = "High humidity!";
  } else {
    suggestion = suggestions[currentSuggestionIndex];
    currentSuggestionIndex = (currentSuggestionIndex + 1) % numSuggestions;
  }
  
  return suggestion;
}

void displaySuggestion() {
  String suggestion = getContextualSuggestion();
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("*** SUGGESTION ***");
  
  int len = suggestion.length();
  
  if (len <= 20) {
    lcd.setCursor(0, 2);
    lcd.print(suggestion);
  } else if (len <= 40) {
    lcd.setCursor(0, 1);
    lcd.print(suggestion.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(suggestion.substring(20));
  } else {
    lcd.setCursor(0, 1);
    lcd.print(suggestion.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(suggestion.substring(20, 40));
  }
  
  Serial.println("Suggestion: " + suggestion);
}

void displayAIQuote() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("*** AI QUOTE ***");
  
  String quote = currentQuote.text;
  int len = quote.length();
  
  // Display quote across multiple lines (20 chars per line, up to 3 lines)
  if (len <= 20) {
    lcd.setCursor(0, 1);
    lcd.print(quote);
  } else if (len <= 40) {
    lcd.setCursor(0, 1);
    lcd.print(quote.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(quote.substring(20));
  } else if (len <= 60) {
    lcd.setCursor(0, 1);
    lcd.print(quote.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(quote.substring(20, 40));
    lcd.setCursor(0, 3);
    lcd.print(quote.substring(40));
  } else {
    // For longer quotes (60-80 chars)
    lcd.setCursor(0, 1);
    lcd.print(quote.substring(0, 20));
    lcd.setCursor(0, 2);
    lcd.print(quote.substring(20, 40));
    lcd.setCursor(0, 3);
    lcd.print(quote.substring(40, 60));
  }
  
  Serial.println("Displaying AI Quote: " + quote);
  if (currentQuote.context.length() > 0) {
    Serial.println("Context: " + currentQuote.context);
  }
}

void updateLCD() {
  if (currentDisplay != DISPLAY_SENSORS) {
    return;
  }
  
  lcd.clear();

  // Line 1: Temperature and Humidity
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(currentReadings.temperature, 1);
  lcd.print((char)223);
  lcd.print("C H:");
  lcd.print(currentReadings.humidity, 0);
  lcd.print("%");

  // Line 2: Unread emails
  lcd.setCursor(0, 1);
  lcd.print("Emails:");
  lcd.print(emailStats.unreadEmails);
  lcd.print("/P:");
  lcd.print(emailStats.unreadPriorityEmails);

  // Line 3: CO2
  lcd.setCursor(0, 2);
  lcd.print("CO2:");
  lcd.print(currentReadings.co2_ppm);
  lcd.print("ppm");

  // Line 4: Air quality status + WiFi
  lcd.setCursor(0, 3);
  lcd.print("Air:");
  String statusShort = currentReadings.airQualityStatus.substring(0, min(8, (int)currentReadings.airQualityStatus.length()));
  lcd.print(statusShort);
  
  // WiFi indicator
  lcd.setCursor(14, 3);
  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("WiFi+");
  } else {
    lcd.print("WiFi-");
  }
}

void publishSensorData() {
  if (!mqtt.connected()) {
    return;
  }

  JsonDocument doc;
  
  doc["temperature"] = currentReadings.temperature;
  doc["humidity"] = currentReadings.humidity;
  doc["airQualityRaw"] = currentReadings.mq135_raw;
  doc["co2"] = currentReadings.co2_ppm;
  doc["nh3"] = currentReadings.nh3_ppm;
  doc["ch4"] = currentReadings.ch4_ppm;
  doc["co"] = currentReadings.co_ppm;
  doc["airQualityStatus"] = currentReadings.airQualityStatus;
  doc["isLight"] = currentReadings.isLight;
  doc["motionDetected"] = currentReadings.motionDetected;
  doc["deviceId"] = mqtt_client_id;
  doc["timestamp"] = millis();
  
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  if (mqtt.publish(mqtt_topic, jsonBuffer)) {
    Serial.println("Published to MQTT");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 AuraLink Monitor...");

  // Initialize pins
  pinMode(LDR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(EMAIL_BLUE_LED_PIN, OUTPUT);
  pinMode(EMAIL_RED_LED_PIN, OUTPUT);
  pinMode(ENV_GREEN_LED_PIN, OUTPUT);

  // Turn off all outputs initially
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(EMAIL_BLUE_LED_PIN, LOW);
  digitalWrite(EMAIL_RED_LED_PIN, LOW);
  digitalWrite(ENV_GREEN_LED_PIN, LOW);

  // I2C initialization
  Wire.begin(I2C_SDA, I2C_SCL);

  // LCD initialization
  lcd.init();
  lcd.backlight();

  // DHT22 initialization
  dht.begin();

  // Welcome screen
  lcd.setCursor(0, 0);
  lcd.print("  ESP32 AuraLink  ");
  lcd.setCursor(0, 1);
  lcd.print(" Environmental    ");
  lcd.setCursor(0, 2);
  lcd.print("    Monitor       ");
  lcd.setCursor(0, 3);
  lcd.print("  Initializing... ");
  delay(3000);
  lcd.clear();
  
  // Setup WiFi
  setup_wifi();
  
  // Setup MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqtt_callback);
  
  Serial.println("ESP32 AuraLink initialized!");
}

String airQualityStatus(int value) {
  if (value < 100) return "Excellent";
  else if (value < 200) return "Good";
  else if (value < 300) return "Moderate";
  else if (value < 400) return "Poor";
  else return "Hazardous";
}

// ================== Main Loop ==================
void loop() {
  // Check WiFi status
  checkWiFiStatus();

  // Maintain MQTT connection
  if (!mqtt.connected()) {
    mqtt_reconnect();
  }
  mqtt.loop();

  // Read sensors every 2 seconds
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead >= 2000) {
    readAllSensors();
    lastSensorRead = millis();
  }

  // Control environment LED
  controlEnvironmentLED();

  // Handle email summary display timeout
  if (currentDisplay == DISPLAY_EMAIL_SUMMARY && 
      millis() - emailDisplayStartTime >= emailDisplayDuration) {
    currentDisplay = DISPLAY_SENSORS;
    updateLCD();
  }

  // Handle suggestion display
  if (currentDisplay == DISPLAY_SUGGESTION && 
      millis() - suggestionStartTime >= suggestionDuration) {
    currentDisplay = DISPLAY_SENSORS;
    updateLCD();
  }

  // Handle AI quote display timeout
  if (currentDisplay == DISPLAY_AI_QUOTE && 
      millis() - quoteDisplayStartTime >= quoteDisplayDuration) {
    currentDisplay = DISPLAY_SENSORS;
    currentQuote.hasNewQuote = false;
    updateLCD();
  }

  // Show suggestion periodically (but not if showing AI quote or email)
  if (currentDisplay == DISPLAY_SENSORS && 
      millis() - lastSuggestionTime >= suggestionInterval) {
    currentDisplay = DISPLAY_SUGGESTION;
    suggestionStartTime = millis();
    lastSuggestionTime = millis();
    displaySuggestion();
  }

  // Update LCD for sensor display
  static unsigned long lastLcdUpdate = 0;
  if (currentDisplay == DISPLAY_SENSORS && 
      millis() - lastLcdUpdate >= 2000) {
    updateLCD();
    lastLcdUpdate = millis();
  }

  // Publish sensor data to MQTT
  if (millis() - lastMsgTime >= msgInterval) {
    publishSensorData();
    lastMsgTime = millis();
  }

  delay(100);
}
