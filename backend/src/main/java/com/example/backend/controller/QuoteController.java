package com.example.backend.controller;

import com.example.backend.model.Quote;
import com.example.backend.model.SensorData;
import com.example.backend.service.MqttService;
import com.example.backend.service.QuoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
@CrossOrigin(origins = "*")
public class QuoteController {
    
    private final QuoteService quoteService;
    private final MqttService mqttService;
    
    @Autowired
    public QuoteController(QuoteService quoteService, MqttService mqttService) {
        this.quoteService = quoteService;
        this.mqttService = mqttService;
    }
    
    /**
     * Generate a quote for a specific device based on its latest sensor data
     */
    @PostMapping("/generate/{deviceId}")
    public ResponseEntity<Quote> generateQuoteForDevice(@PathVariable String deviceId) {
        SensorData sensorData = mqttService.getLatestSensorData(deviceId);
        
        if (sensorData == null) {
            return ResponseEntity.notFound().build();
        }
        
        Quote quote = quoteService.generateQuote(sensorData);
        return ResponseEntity.ok(quote);
    }
    
    /**
     * Generate a quote based on provided sensor data
     */
    @PostMapping("/generate")
    public ResponseEntity<Quote> generateQuote(@RequestBody SensorData sensorData) {
        Quote quote = quoteService.generateQuote(sensorData);
        return ResponseEntity.ok(quote);
    }
}
