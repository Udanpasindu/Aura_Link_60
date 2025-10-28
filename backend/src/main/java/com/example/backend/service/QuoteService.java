package com.example.backend.service;

import com.example.backend.model.Quote;
import com.example.backend.model.SensorData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class QuoteService {
    
    private static final Logger logger = LoggerFactory.getLogger(QuoteService.class);
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;
    
    @Value("${openai.quote.generation.enabled:true}")
    private boolean quoteGenerationEnabled;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();
    
    // Different quote themes for variety
    private final String[] quoteThemes = {
        "motivational and uplifting",
        "mindfulness and wellness",
        "productivity and focus",
        "nature and harmony",
        "energy and vitality",
        "peace and tranquility",
        "inspiration and courage",
        "health and balance",
        "joy and positivity",
        "wisdom and insight"
    };
    
    /**
     * Generate a motivational or contextual quote based on sensor data
     */
    public Quote generateQuote(SensorData sensorData) {
        if (!quoteGenerationEnabled) {
            logger.warn("Quote generation is disabled");
            return createFallbackQuote(sensorData);
        }
        
        try {
            String prompt = buildPrompt(sensorData);
            String quoteText = callOpenAI(prompt);
            
            return Quote.builder()
                    .text(quoteText)
                    .context(getContextDescription(sensorData))
                    .sensorData(sensorData)
                    .generatedAt(LocalDateTime.now())
                    .deviceId(sensorData.getDeviceId())
                    .build();
                    
        } catch (Exception e) {
            logger.error("Error generating quote with OpenAI: {}", e.getMessage());
            return createFallbackQuote(sensorData);
        }
    }
    
    /**
     * Build a prompt for OpenAI based on sensor data
     */
    private String buildPrompt(SensorData sensorData) {
        // Select a random theme for variety
        String theme = quoteThemes[random.nextInt(quoteThemes.length)];
        
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a unique, ").append(theme).append(" quote (max 60 characters) based on these conditions:\n\n");
        
        // Temperature context
        if (sensorData.getTemperature() > 30) {
            prompt.append("- Temperature is high (").append(String.format("%.1f", sensorData.getTemperature())).append("°C)\n");
        } else if (sensorData.getTemperature() < 18) {
            prompt.append("- Temperature is low (").append(String.format("%.1f", sensorData.getTemperature())).append("°C)\n");
        } else {
            prompt.append("- Temperature is comfortable (").append(String.format("%.1f", sensorData.getTemperature())).append("°C)\n");
        }
        
        // Humidity context
        if (sensorData.getHumidity() > 70) {
            prompt.append("- Humidity is high (").append(String.format("%.1f", sensorData.getHumidity())).append("%)\n");
        } else if (sensorData.getHumidity() < 30) {
            prompt.append("- Humidity is low (").append(String.format("%.1f", sensorData.getHumidity())).append("%)\n");
        } else {
            prompt.append("- Humidity is optimal (").append(String.format("%.1f", sensorData.getHumidity())).append("%)\n");
        }
        
        // Air quality context
        prompt.append("- Air quality: ").append(sensorData.getAirQualityStatus()).append("\n");
        
        // CO2 context
        if (sensorData.getCo2() > 1000) {
            prompt.append("- CO2 levels are high (").append(sensorData.getCo2()).append(" ppm)\n");
        } else {
            prompt.append("- CO2 levels are good (").append(sensorData.getCo2()).append(" ppm)\n");
        }
        
        // Motion and light context
        if (sensorData.isMotionDetected()) {
            prompt.append("- Motion detected - someone is active\n");
        }
        
        if (sensorData.isLight()) {
            prompt.append("- Bright environment\n");
        } else {
            prompt.append("- Low light environment\n");
        }
        
        prompt.append("\nMake it creative and different each time. Under 60 characters.");
        
        return prompt.toString();
    }
    
    /**
     * Call OpenAI API to generate quote
     */
    private String callOpenAI(String prompt) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            
            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("max_tokens", 50);
            requestBody.put("temperature", 1.2); // Increased for more variety
            requestBody.put("top_p", 0.95); // Add nucleus sampling for diversity
            requestBody.put("frequency_penalty", 0.8); // Discourage repetition
            requestBody.put("presence_penalty", 0.6); // Encourage new topics
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a creative quote generator. Create unique, varied quotes every time. Never repeat the same quote. Be creative and diverse in your responses. Keep quotes under 60 characters.");
            messages.add(systemMessage);
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Make API call
            ResponseEntity<String> responseEntity = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                String.class
            );
            
            // Parse response
            JsonNode root = objectMapper.readTree(responseEntity.getBody());
            String response = root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText()
                    .trim();
            
            // Remove quotes if present
            response = response.replace("\"", "").replace("'", "");
            
            // Truncate to 60 characters if needed
            if (response.length() > 60) {
                response = response.substring(0, 57) + "...";
            }
            
            logger.info("Generated quote: {}", response);
            return response;
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI API: {}", e.getMessage());
            throw new RuntimeException("Failed to generate quote", e);
        }
    }
    
    /**
     * Create a fallback quote when OpenAI is unavailable
     */
    private Quote createFallbackQuote(SensorData sensorData) {
        // Expanded fallback quotes with more variety
        List<String> fallbackQuotes = new ArrayList<>();
        
        // Generate contextual fallback quotes based on conditions
        if ("Excellent".equals(sensorData.getAirQualityStatus()) || "Good".equals(sensorData.getAirQualityStatus())) {
            fallbackQuotes.add("Breathe deep, live well!");
            fallbackQuotes.add("Pure air, pure thoughts!");
            fallbackQuotes.add("Fresh air fuels success!");
            fallbackQuotes.add("Clean air, clear mind!");
            fallbackQuotes.add("Inhale peace, exhale stress!");
        } else if ("Poor".equals(sensorData.getAirQualityStatus()) || "Hazardous".equals(sensorData.getAirQualityStatus())) {
            fallbackQuotes.add("Fresh air, fresh start!");
            fallbackQuotes.add("Seek fresh air soon!");
            fallbackQuotes.add("Better air brings better days!");
            fallbackQuotes.add("Air quality matters!");
        } else if (sensorData.getTemperature() > 30) {
            fallbackQuotes.add("Stay cool, stay hydrated!");
            fallbackQuotes.add("Beat the heat, stay strong!");
            fallbackQuotes.add("Cool thoughts in warm times!");
            fallbackQuotes.add("Warmth outside, calm inside!");
        } else if (sensorData.getTemperature() < 18) {
            fallbackQuotes.add("Warmth brings comfort!");
            fallbackQuotes.add("Cozy moments ahead!");
            fallbackQuotes.add("Bundle up, stay positive!");
            fallbackQuotes.add("Cool air, warm heart!");
        } else if (sensorData.getHumidity() > 70) {
            fallbackQuotes.add("Balance brings peace!");
            fallbackQuotes.add("Flow with nature!");
            fallbackQuotes.add("Adapt and thrive!");
        } else if (sensorData.isMotionDetected()) {
            fallbackQuotes.add("Keep moving forward!");
            fallbackQuotes.add("Action creates results!");
            fallbackQuotes.add("Movement is life!");
            fallbackQuotes.add("Stay active, stay alive!");
        }
        
        // Add general motivational quotes
        fallbackQuotes.add("Every moment matters!");
        fallbackQuotes.add("You're doing great!");
        fallbackQuotes.add("Stay positive always!");
        fallbackQuotes.add("Believe in yourself!");
        fallbackQuotes.add("Today is your day!");
        fallbackQuotes.add("Make it happen!");
        fallbackQuotes.add("Dream big, achieve bigger!");
        fallbackQuotes.add("Success starts now!");
        
        // Pick a random quote
        String quoteText = fallbackQuotes.get(random.nextInt(fallbackQuotes.size()));
        
        return Quote.builder()
                .text(quoteText)
                .context(getContextDescription(sensorData))
                .sensorData(sensorData)
                .generatedAt(LocalDateTime.now())
                .deviceId(sensorData.getDeviceId())
                .build();
    }
    
    /**
     * Get a human-readable context description
     */
    private String getContextDescription(SensorData sensorData) {
        return String.format("Temp: %.1f°C, Humidity: %.1f%%, Air: %s, CO2: %d ppm",
                sensorData.getTemperature(),
                sensorData.getHumidity(),
                sensorData.getAirQualityStatus(),
                sensorData.getCo2());
    }
}
