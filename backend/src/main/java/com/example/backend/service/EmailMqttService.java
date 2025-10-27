package com.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailMqttService {

    @Autowired
    private MessageChannel mqttOutboundChannel;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TOPIC_EMAIL_NOTIFICATIONS = "iot/email/notifications";
    private static final String TOPIC_EMAIL_ALL_READ = "iot/email/allread";
    private static final String TOPIC_EMAIL_PRIORITY_READ = "iot/email/priorityread";
    private static final String TOPIC_EMAIL_PRIORITY = "iot/email/priority";

    /**
     * Publish email statistics to MQTT
     */
    public void publishEmailStatistics(int unreadCount, int priorityCount, int unreadPriorityCount) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "email_statistics");
            message.put("unread", unreadCount);
            message.put("priority", priorityCount);
            message.put("unread_priority", unreadPriorityCount);
            message.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(message);

            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(jsonMessage)
                            .setHeader(MqttHeaders.TOPIC, TOPIC_EMAIL_NOTIFICATIONS)
                            .setHeader(MqttHeaders.QOS, 1)
                            .build()
            );

            log.info("Published email statistics to MQTT: unread={}, priority={}", unreadCount, unreadPriorityCount);
        } catch (Exception e) {
            log.error("Error publishing email statistics to MQTT", e);
        }
    }

    /**
     * Publish notification when all emails are read
     */
    public void publishAllEmailsRead() {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "all_read");
            message.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(message);

            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(jsonMessage)
                            .setHeader(MqttHeaders.TOPIC, TOPIC_EMAIL_ALL_READ)
                            .setHeader(MqttHeaders.QOS, 1)
                            .build()
            );

            log.info("Published all emails read notification to MQTT");
        } catch (Exception e) {
            log.error("Error publishing all emails read notification to MQTT", e);
        }
    }

    /**
     * Publish notification when all priority emails are read
     */
    public void publishPriorityEmailsRead() {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "priority_read");
            message.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(message);

            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(jsonMessage)
                            .setHeader(MqttHeaders.TOPIC, TOPIC_EMAIL_PRIORITY_READ)
                            .setHeader(MqttHeaders.QOS, 1)
                            .build()
            );

            log.info("Published priority emails read notification to MQTT");
        } catch (Exception e) {
            log.error("Error publishing priority emails read notification to MQTT", e);
        }
    }

    /**
     * Publish new email notification
     */
    public void publishNewEmail(int count, String summary) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "new_emails");
            message.put("count", count);
            message.put("summary", summary);
            message.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(message);

            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(jsonMessage)
                            .setHeader(MqttHeaders.TOPIC, TOPIC_EMAIL_NOTIFICATIONS)
                            .setHeader(MqttHeaders.QOS, 1)
                            .build()
            );

            log.info("Published new email notification to MQTT: count={}", count);
        } catch (Exception e) {
            log.error("Error publishing new email notification to MQTT", e);
        }
    }

    /**
     * Publish high-priority email notification
     */
    public void publishPriorityEmail(String summary) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "priority_emails");
            message.put("count", 1);
            message.put("summary", summary);
            message.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(message);

            mqttOutboundChannel.send(
                    MessageBuilder.withPayload(jsonMessage)
                            .setHeader(MqttHeaders.TOPIC, TOPIC_EMAIL_PRIORITY)
                            .setHeader(MqttHeaders.QOS, 1)
                            .build()
            );

            log.info("Published priority email notification to MQTT");
        } catch (Exception e) {
            log.error("Error publishing priority email notification to MQTT", e);
        }
    }
}
