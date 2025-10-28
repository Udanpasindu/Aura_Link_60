package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quote {
    private String text;
    private String context;
    private SensorData sensorData;
    private LocalDateTime generatedAt;
    private String deviceId;
}
