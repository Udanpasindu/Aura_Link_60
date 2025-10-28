package com.example.backend.service;

import com.example.backend.model.Quote;
import com.example.backend.model.SensorData;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.integration.annotation.MessagingGateway;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuoteMqttService {
    
    private static final Logger logger = LoggerFactory.getLogger(QuoteMqttService.class);
    private static final String QUOTE_TOPIC = "auralink/quotes";
    
    @Autowired
    private QuoteService quoteService;
    
    @Autowired
    private MqttService mqttService;
    
    @Autowired
    private MqttGateway mqttGateway;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Value("${openai.quote.generation.enabled:true}")
    private boolean quoteGenerationEnabled;
    
    /**
     * Automatically generate and send quotes every 10 minutes (600000ms)
     * Can be configured via openai.quote.generation.interval property
     */
    @Scheduled(fixedDelayString = "${openai.quote.generation.interval:600000}")
    public void generateAndSendQuotes() {
        if (!quoteGenerationEnabled) {
            logger.debug("Quote generation is disabled");
            return;
        }
        
        logger.info("Starting scheduled quote generation...");
        
        try {
            List<SensorData> allSensorData = mqttService.getAllLatestSensorData();
            
            if (allSensorData.isEmpty()) {
                logger.warn("No sensor data available for quote generation");
                return;
            }
            
            for (SensorData sensorData : allSensorData) {
                try {
                    generateAndSendQuote(sensorData);
                } catch (Exception e) {
                    logger.error("Error generating quote for device {}: {}", 
                        sensorData.getDeviceId(), e.getMessage());
                }
            }
            
            logger.info("Completed quote generation for {} devices", allSensorData.size());
            
        } catch (Exception e) {
            logger.error("Error in scheduled quote generation: {}", e.getMessage());
        }
    }
    
    /**
     * Generate and send a quote for specific sensor data
     */
    public void generateAndSendQuote(SensorData sensorData) {
        try {
            logger.info("Generating quote for device: {}", sensorData.getDeviceId());
            
            Quote quote = quoteService.generateQuote(sensorData);
            
            // Create payload for ESP32
            Map<String, Object> payload = new HashMap<>();
            payload.put("deviceId", sensorData.getDeviceId());
            payload.put("quote", quote.getText());
            payload.put("context", quote.getContext());
            payload.put("timestamp", System.currentTimeMillis());
            
            String jsonPayload = objectMapper.writeValueAsString(payload);
            
            // Send via MQTT
            mqttGateway.sendToMqtt(jsonPayload, QUOTE_TOPIC);
            
            logger.info("Sent quote to MQTT topic {}: {}", QUOTE_TOPIC, quote.getText());
            
        } catch (Exception e) {
            logger.error("Error generating and sending quote: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Generate quote on demand for a specific device
     */
    public Quote generateQuoteForDevice(String deviceId) {
        SensorData sensorData = mqttService.getLatestSensorData(deviceId);
        
        if (sensorData == null) {
            logger.warn("No sensor data found for device: {}", deviceId);
            return null;
        }
        
        Quote quote = quoteService.generateQuote(sensorData);
        generateAndSendQuote(sensorData);
        
        return quote;
    }
    
    @MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
    public interface MqttGateway {
        void sendToMqtt(String data, @org.springframework.messaging.handler.annotation.Header(MqttHeaders.TOPIC) String topic);
    }
}
