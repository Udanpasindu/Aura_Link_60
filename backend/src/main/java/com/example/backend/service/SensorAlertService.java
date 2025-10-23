package com.example.backend.service;

import com.example.backend.model.SensorData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Example service showing how to integrate email alerts with sensor data
 * This is a demonstration of how to use the email service in your application
 */
@Slf4j
@Service
public class SensorAlertService {

    @Autowired
    private EmailService emailService;

    // Configure alert thresholds
    private static final double HIGH_TEMP_THRESHOLD = 35.0;
    private static final double LOW_TEMP_THRESHOLD = 10.0;
    private static final double HIGH_HUMIDITY_THRESHOLD = 80.0;
    private static final int HIGH_CO2_THRESHOLD = 1000;
    
    // Admin email - should be configured in application.properties
    private static final String ADMIN_EMAIL = "admin@example.com";

    /**
     * Process sensor data and send alerts if thresholds are exceeded
     */
    public void processSensorData(SensorData data) {
        checkTemperatureAlert(data);
        checkHumidityAlert(data);
        checkAirQualityAlert(data);
        checkMotionAlert(data);
    }

    /**
     * Check temperature and send alert if threshold exceeded
     */
    private void checkTemperatureAlert(SensorData data) {
        if (data.getTemperature() > HIGH_TEMP_THRESHOLD) {
            String message = String.format(
                "High temperature detected:\n" +
                "Temperature: %.2f°C\n" +
                "Device ID: %s\n" +
                "Time: %s\n" +
                "Threshold: %.2f°C",
                data.getTemperature(),
                data.getDeviceId(),
                data.getReceivedAt(),
                HIGH_TEMP_THRESHOLD
            );
            
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "High Temperature Alert",
                message
            );
            
            log.warn("High temperature alert sent: {}°C", data.getTemperature());
        } else if (data.getTemperature() < LOW_TEMP_THRESHOLD) {
            String message = String.format(
                "Low temperature detected:\n" +
                "Temperature: %.2f°C\n" +
                "Device ID: %s\n" +
                "Time: %s\n" +
                "Threshold: %.2f°C",
                data.getTemperature(),
                data.getDeviceId(),
                data.getReceivedAt(),
                LOW_TEMP_THRESHOLD
            );
            
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "Low Temperature Alert",
                message
            );
            
            log.warn("Low temperature alert sent: {}°C", data.getTemperature());
        }
    }

    /**
     * Check humidity and send alert if threshold exceeded
     */
    private void checkHumidityAlert(SensorData data) {
        if (data.getHumidity() > HIGH_HUMIDITY_THRESHOLD) {
            String message = String.format(
                "High humidity detected:\n" +
                "Humidity: %.2f%%\n" +
                "Device ID: %s\n" +
                "Time: %s\n" +
                "Threshold: %.2f%%",
                data.getHumidity(),
                data.getDeviceId(),
                data.getReceivedAt(),
                HIGH_HUMIDITY_THRESHOLD
            );
            
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "High Humidity Alert",
                message
            );
            
            log.warn("High humidity alert sent: {}%", data.getHumidity());
        }
    }

    /**
     * Check air quality and send alert if poor
     */
    private void checkAirQualityAlert(SensorData data) {
        if ("Poor".equalsIgnoreCase(data.getAirQualityStatus()) || 
            "Hazardous".equalsIgnoreCase(data.getAirQualityStatus())) {
            
            String message = String.format(
                "Poor air quality detected:\n" +
                "Status: %s\n" +
                "CO2: %d ppm\n" +
                "CO: %d ppm\n" +
                "NH3: %d ppm\n" +
                "CH4: %d ppm\n" +
                "Device ID: %s\n" +
                "Time: %s",
                data.getAirQualityStatus(),
                data.getCo2(),
                data.getCo(),
                data.getNh3(),
                data.getCh4(),
                data.getDeviceId(),
                data.getReceivedAt()
            );
            
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "Air Quality Alert",
                message
            );
            
            log.warn("Air quality alert sent: {}", data.getAirQualityStatus());
        }
        
        // Specific CO2 alert
        if (data.getCo2() > HIGH_CO2_THRESHOLD) {
            String message = String.format(
                "High CO2 levels detected:\n" +
                "CO2: %d ppm\n" +
                "Device ID: %s\n" +
                "Time: %s\n" +
                "Threshold: %d ppm",
                data.getCo2(),
                data.getDeviceId(),
                data.getReceivedAt(),
                HIGH_CO2_THRESHOLD
            );
            
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "High CO2 Alert",
                message
            );
            
            log.warn("High CO2 alert sent: {} ppm", data.getCo2());
        }
    }

    /**
     * Check motion detection and send alert
     */
    private void checkMotionAlert(SensorData data) {
        if (data.isMotionDetected()) {
            String message = String.format(
                "Motion detected:\n" +
                "Device ID: %s\n" +
                "Time: %s\n" +
                "Light status: %s",
                data.getDeviceId(),
                data.getReceivedAt(),
                data.isLight() ? "ON" : "OFF"
            );
            
            // Only log motion, don't send email for every motion event
            // Uncomment below to enable motion email alerts
            /*
            emailService.sendSensorAlert(
                ADMIN_EMAIL,
                "Motion Detected",
                message
            );
            */
            
            log.info("Motion detected from device: {}", data.getDeviceId());
        }
    }

    /**
     * Send a daily summary report
     */
    public void sendDailySummaryReport(String recipientEmail, 
                                      int totalReadings,
                                      double avgTemperature,
                                      double avgHumidity,
                                      int alertsTriggered) {
        String subject = "AuraLink Daily Sensor Summary Report";
        String htmlBody = buildDailySummaryHtml(
            totalReadings, 
            avgTemperature, 
            avgHumidity, 
            alertsTriggered
        );
        
        emailService.sendHtmlEmail(recipientEmail, subject, htmlBody);
        log.info("Daily summary report sent to: {}", recipientEmail);
    }

    /**
     * Build HTML for daily summary report
     */
    private String buildDailySummaryHtml(int totalReadings,
                                        double avgTemperature,
                                        double avgHumidity,
                                        int alertsTriggered) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                    .metric { padding: 15px; margin: 10px 0; background-color: white; border-left: 4px solid #2196F3; }
                    .metric-label { font-size: 14px; color: #666; }
                    .metric-value { font-size: 28px; font-weight: bold; color: #2196F3; }
                    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>AuraLink Daily Summary</h1>
                        <p>Sensor Data Report</p>
                    </div>
                    <div class="content">
                        <div class="metric">
                            <div class="metric-label">Total Readings</div>
                            <div class="metric-value">%d</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Average Temperature</div>
                            <div class="metric-value">%.2f°C</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Average Humidity</div>
                            <div class="metric-value">%.2f%%</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Alerts Triggered</div>
                            <div class="metric-value">%d</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated daily report from AuraLink IoT System</p>
                        <p>Generated at: %s</p>
                    </div>
                </div>
            </body>
            </html>
            """, 
            totalReadings, 
            avgTemperature, 
            avgHumidity, 
            alertsTriggered,
            java.time.LocalDateTime.now().toString()
        );
    }

    /**
     * Send a custom alert with sensor data
     */
    public void sendCustomAlert(String recipientEmail, 
                               String alertTitle, 
                               SensorData data) {
        String message = String.format(
            "Sensor Alert Details:\n\n" +
            "Temperature: %.2f°C\n" +
            "Humidity: %.2f%%\n" +
            "Air Quality: %s\n" +
            "CO2: %d ppm\n" +
            "CO: %d ppm\n" +
            "Motion: %s\n" +
            "Light: %s\n" +
            "Device ID: %s\n" +
            "Timestamp: %s",
            data.getTemperature(),
            data.getHumidity(),
            data.getAirQualityStatus(),
            data.getCo2(),
            data.getCo(),
            data.isMotionDetected() ? "Detected" : "Not Detected",
            data.isLight() ? "ON" : "OFF",
            data.getDeviceId(),
            data.getReceivedAt()
        );
        
        emailService.sendSensorAlert(recipientEmail, alertTitle, message);
        log.info("Custom alert sent: {}", alertTitle);
    }
}
