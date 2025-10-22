package com.example.backend.service;

import com.example.backend.model.SensorData;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MqttService {
    private static final Logger logger = LoggerFactory.getLogger(MqttService.class);
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    
    // In-memory storage for latest sensor data by device ID
    private final ConcurrentHashMap<String, SensorData> latestSensorData = new ConcurrentHashMap<>();
    // History of sensor data (limited to 100 entries per device)
    private final ConcurrentHashMap<String, List<SensorData>> sensorDataHistory = new ConcurrentHashMap<>();
    private static final int MAX_HISTORY_SIZE = 100;
    
    @Autowired
    public MqttService(ObjectMapper objectMapper, SimpMessagingTemplate messagingTemplate) {
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }
    
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler handler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws MessagingException {
                String topic = (String) message.getHeaders().get("mqtt_receivedTopic");
                String payload = (String) message.getPayload();
                
                logger.info("Received message from topic [{}]: {}", topic, payload);
                
                try {
                    if ("auralink/sensors".equals(topic)) {
                        SensorData sensorData = objectMapper.readValue(payload, SensorData.class);
                        sensorData.setReceivedAt(LocalDateTime.now());
                        
                        // Store latest data
                        latestSensorData.put(sensorData.getDeviceId(), sensorData);
                        
                        // Update history
                        sensorDataHistory.computeIfAbsent(sensorData.getDeviceId(), k -> new ArrayList<>())
                            .add(0, sensorData);  // Add to the beginning of the list (newest first)
                        
                        // Trim history if needed
                        List<SensorData> history = sensorDataHistory.get(sensorData.getDeviceId());
                        if (history.size() > MAX_HISTORY_SIZE) {
                            history.subList(MAX_HISTORY_SIZE, history.size()).clear();
                        }
                        
                        // Broadcast to WebSocket subscribers
                        messagingTemplate.convertAndSend("/topic/sensors", sensorData);
                        logger.info("Sent sensor data to WebSocket clients: {}", sensorData);
                    } else if ("auralink/status".equals(topic)) {
                        // Handle status messages if needed
                        messagingTemplate.convertAndSend("/topic/status", payload);
                    }
                } catch (Exception e) {
                    logger.error("Error processing MQTT message", e);
                }
            }
        };
    }
    
    public SensorData getLatestSensorData(String deviceId) {
        return latestSensorData.get(deviceId);
    }
    
    public List<SensorData> getAllLatestSensorData() {
        return new ArrayList<>(latestSensorData.values());
    }
    
    public List<SensorData> getSensorDataHistory(String deviceId) {
        return sensorDataHistory.getOrDefault(deviceId, new ArrayList<>());
    }
}
