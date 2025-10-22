package com.example.backend.controller;

import com.example.backend.model.SensorData;
import com.example.backend.service.MqttService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
@CrossOrigin(origins = "*")
public class SensorController {
    
    private final MqttService mqttService;
    
    @Autowired
    public SensorController(MqttService mqttService) {
        this.mqttService = mqttService;
    }
    
    @GetMapping
    public ResponseEntity<List<SensorData>> getAllLatestSensorData() {
        List<SensorData> sensorDataList = mqttService.getAllLatestSensorData();
        return ResponseEntity.ok(sensorDataList);
    }
    
    @GetMapping("/{deviceId}")
    public ResponseEntity<SensorData> getLatestSensorData(@PathVariable String deviceId) {
        SensorData sensorData = mqttService.getLatestSensorData(deviceId);
        if (sensorData != null) {
            return ResponseEntity.ok(sensorData);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{deviceId}/history")
    public ResponseEntity<List<SensorData>> getSensorDataHistory(@PathVariable String deviceId) {
        List<SensorData> history = mqttService.getSensorDataHistory(deviceId);
        return ResponseEntity.ok(history);
    }
}
