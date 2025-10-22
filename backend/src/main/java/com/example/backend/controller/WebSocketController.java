package com.example.backend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

    @MessageMapping("/connect")
    @SendTo("/topic/status")
    public Map<String, Object> handleConnection(Map<String, Object> message) {
        String clientId = (String) message.getOrDefault("clientId", "unknown");
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "connection_ack");
        response.put("message", "Connected to AuraLink backend");
        response.put("clientId", clientId);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }
}
