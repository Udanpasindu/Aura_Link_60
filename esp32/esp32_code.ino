#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

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

  // Welcome screen
  lcd.setCursor(0, 0);
  lcd.print("ESP32 Air Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
  lcd.clear();
}

String airQualityStatus(int value) {
  if (value < 100) return "Excellent";
  else if (value < 200) return "Good";
  else if (value < 300) return "Moderate";
  else if (value < 400) return "Poor";
  else return "Hazardous";
}

void loop() {
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

  delay(2000);
}
