#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "kavish 99";
const char* password = "kavishka123";

// MQTT Broker details (HiveMQ Cloud)
const char* mqtt_server = "broker.hivemq.com";  // Public broker (replace with your cloud broker)
const int mqtt_port = 1883;
// const char* mqtt_username = "your_username"; // Uncomment if your broker needs auth
// const char* mqtt_password = "your_password";
const char* mqtt_client_id = "ESP32_AuraLink_Client";
const char* mqtt_topic = "auralink/sensors";
const char* mqtt_status_topic = "auralink/status";

WiFiClient espClient;
PubSubClient mqtt(espClient);
unsigned long lastMsgTime = 0;
const long msgInterval = 5000; // Send data every 5 seconds

// LCD setup
LiquidCrystal_I2C lcd(0x27, 20, 4);

// Define I2C pins for ESP32
#define I2C_SDA 21
#define I2C_SCL 22

// DHT22 setup
#define DHTPIN 32        
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// MQ-135 setup
#define MQ135_PIN 34     // Analog pin for MQ-135

// LDR setup
#define LDR_PIN 33       // Digital output from LDR module
#define LED_PIN 13       // GPIO pin to drive external 5V LED (through resistor/transistor)
// PIR Motion sensor (PIR module typically outputs HIGH when motion detected)
#define PIR_PIN 27

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
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Handle incoming messages if needed
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
        
        // Subscribe to control topics if needed
        // mqtt.subscribe("auralink/control");
        
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

void setup() {
  Serial.begin(115200);

  // I2C initialization
  Wire.begin(I2C_SDA, I2C_SCL);

  // LCD initialization
  lcd.init();
  lcd.backlight();

  // DHT22 initialization
  dht.begin();

  // Pin modes
  pinMode(LDR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  // PIR motion sensor input
  pinMode(PIR_PIN, INPUT);

  // Welcome screen
  lcd.setCursor(0, 0);
  lcd.print("ESP32 Air Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
  lcd.clear();
  
  // Setup WiFi
  setup_wifi();
  
  // Setup MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqtt_callback);
}

String airQualityStatus(int value) {
  if (value < 100) return "Excellent";
  else if (value < 200) return "Good";
  else if (value < 300) return "Moderate";
  else if (value < 400) return "Poor";
  else return "Hazardous";
}

void publishSensorData(float temperature, float humidity, int mq135_value, 
                      int co2_ppm, int nh3_ppm, int ch4_ppm, int co_ppm, 
                      String status, int lightState, bool motionDetected) {
  // Create JSON document
  StaticJsonDocument<256> doc;
  
  // Add sensor data
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["airQualityRaw"] = mq135_value;
  doc["co2"] = co2_ppm;
  doc["nh3"] = nh3_ppm;
  doc["ch4"] = ch4_ppm;
  doc["co"] = co_ppm;
  doc["airQualityStatus"] = status;
  doc["isLight"] = (lightState == HIGH);
  doc["motionDetected"] = motionDetected;
  doc["deviceId"] = mqtt_client_id;
  doc["timestamp"] = millis();
  
  // Convert to JSON string
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  // Publish to MQTT
  if (mqtt.connected()) {
    mqtt.publish(mqtt_topic, jsonBuffer);
    Serial.println("Data published to MQTT");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("MQTT disconnected, data not sent");
  }
}

void loop() {
  // Check MQTT connection
  if (WiFi.status() == WL_CONNECTED && !mqtt.connected()) {
    mqtt_reconnect();
  }
  
  // Keep MQTT client connected
  if (mqtt.connected()) {
    mqtt.loop();
  }
  
  // === LDR Light Detection ===
  int lightState = digitalRead(LDR_PIN);

  if (lightState == LOW) { 
    // Dark condition
    digitalWrite(LED_PIN, LOW);  // Turn ON external LED
    lcd.noBacklight();              // Turn ON LCD backlight
    Serial.println("Environment: Dark - LED & Backlight ON");
  } else {
    // Bright condition
    digitalWrite(LED_PIN, HIGH);   // Turn OFF external LED
    lcd.backlight();            // Turn OFF LCD backlight
    Serial.println("Environment: Bright - LED & Backlight OFF");
  }

  // === DHT22 ===
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT22!");
    lcd.setCursor(0, 0);
    lcd.print("DHT22 Error       ");
    delay(2000);
    return;
  }

  // === MQ135 ===
  int mq135_value = analogRead(MQ135_PIN);
  int co2_ppm = map(mq135_value, 0, 4095, 400, 5000);
  int nh3_ppm = map(mq135_value, 0, 4095, 1, 500);
  int ch4_ppm = map(mq135_value, 0, 4095, 200, 10000);
  int co_ppm  = map(mq135_value, 0, 4095, 1, 1000);

  String status = airQualityStatus(mq135_value);

  // === Serial Monitor Output ===
  Serial.print("Temp: "); Serial.print(temperature); Serial.print(" C  ");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("MQ135 Raw: "); Serial.print(mq135_value);
  Serial.print(" | CO2: "); Serial.print(co2_ppm);
  Serial.print(" ppm, NH3: "); Serial.print(nh3_ppm);
  Serial.print(" ppm, CH4: "); Serial.print(ch4_ppm);
  Serial.print(" ppm, CO: "); Serial.print(co_ppm);
  Serial.print(" ppm | Status: "); Serial.println(status);

  // === LCD Output ===
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temperature, 1);
  lcd.print((char)223);
  lcd.print("C H:");
  lcd.print(humidity, 0);
  lcd.print("%");

  lcd.setCursor(0, 1);
  lcd.print("CO2:");
  lcd.print(co2_ppm);
  lcd.print("ppm");

  lcd.setCursor(0, 2);
  lcd.print("NH3:");
  lcd.print(nh3_ppm);
  lcd.print(" CH4:");
  lcd.print(ch4_ppm);

  lcd.setCursor(0, 3);
  lcd.print("Air: ");
  lcd.print(status);

  // Publish sensor data to MQTT every msgInterval
  unsigned long now = millis();
  if (now - lastMsgTime > msgInterval) {
    lastMsgTime = now;
    // Read motion sensor
    int motionState = digitalRead(PIR_PIN);
    bool motionDetected = (motionState == HIGH);

    // Update LCD last line briefly with motion status
    lcd.setCursor(0, 3);
    lcd.print("Air: ");
    lcd.print(status);
    lcd.print(" ");
    lcd.print(motionDetected ? "M:Yes" : "M:No ");

    publishSensorData(temperature, humidity, mq135_value, co2_ppm, nh3_ppm, ch4_ppm, co_ppm, status, lightState, motionDetected);
  }

  delay(2000);
}
