package com.example.backend.model;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorData {
    private float temperature;
    private float humidity;
    private int airQualityRaw;
    private int co2;
    private int nh3;
    private int ch4;
    private int co;
    private String airQualityStatus;
    private boolean isLight;
    private String deviceId;
    private long timestamp;
    private LocalDateTime receivedAt;
}
