package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class HuggingFaceService {

    @Value("${huggingface.api.key}")
    private String apiKey;

    @Value("${huggingface.api.url}")
    private String apiUrl;

    @Value("${huggingface.summarization.model}")
    private String summarizationModel;

    @Value("${huggingface.classification.model}")
    private String classificationModel;

    @Value("${huggingface.max.summary.length:80}")
    private int maxSummaryLength;

    @Value("${huggingface.ai.enabled:true}")
    private boolean aiEnabled;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Summarize email content using Hugging Face API
     */
    public String summarizeEmail(String emailContent) {
        if (!aiEnabled) {
            return createFallbackSummary(emailContent);
        }

        try {
            String url = apiUrl + summarizationModel;
            
            // Prepare request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Authorization", "Bearer " + apiKey);

            // Clean and prepare email content (remove HTML if present, limit to 1024 chars for API)
            String cleanedContent = cleanEmailContent(emailContent);
            String inputContent = cleanedContent.length() > 1024 ? cleanedContent.substring(0, 1024) : cleanedContent;
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", inputContent);
            requestBody.put("parameters", Map.of(
                "max_length", maxSummaryLength,
                "min_length", Math.min(30, maxSummaryLength - 10),
                "do_sample", false
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
            );

            // Parse response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                
                if (jsonResponse.isArray() && jsonResponse.size() > 0) {
                    String summary = jsonResponse.get(0).get("summary_text").asText();
                    // Ensure exact length limit
                    return ensureMaxLength(summary, maxSummaryLength);
                }
            }

            log.warn("Failed to get summary from Hugging Face API, using fallback");
            return createFallbackSummary(emailContent);

        } catch (Exception e) {
            log.error("Error calling Hugging Face summarization API: {}", e.getMessage());
            return createFallbackSummary(emailContent);
        }
    }

    /**
     * Classify email priority using Hugging Face zero-shot classification
     */
    public String classifyPriority(String emailSubject, String emailBody) {
        if (!aiEnabled) {
            return "MEDIUM";
        }

        try {
            String url = apiUrl + classificationModel;
            
            // Prepare request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Authorization", "Bearer " + apiKey);

            // Combine subject and body for better classification
            String content = "Subject: " + emailSubject + "\n" + truncateText(emailBody, 500);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", content);
            requestBody.put("parameters", Map.of(
                "candidate_labels", Arrays.asList("urgent high priority", "normal medium priority", "low priority not urgent"),
                "multi_label", false
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
            );

            // Parse response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                
                if (jsonResponse.has("labels") && jsonResponse.get("labels").isArray()) {
                    String topLabel = jsonResponse.get("labels").get(0).asText();
                    return mapPriorityLabel(topLabel);
                }
            }

            log.warn("Failed to classify priority from Hugging Face, using default");
            return "MEDIUM";

        } catch (Exception e) {
            log.error("Error calling Hugging Face classification API: {}", e.getMessage());
            return classifyPriorityByKeywords(emailSubject, emailBody);
        }
    }

    /**
     * Map Hugging Face labels to our priority system
     */
    private String mapPriorityLabel(String label) {
        label = label.toLowerCase();
        if (label.contains("urgent") || label.contains("high")) {
            return "HIGH";
        } else if (label.contains("low") || label.contains("not urgent")) {
            return "LOW";
        } else {
            return "MEDIUM";
        }
    }

    /**
     * Fallback priority classification using keywords
     */
    private String classifyPriorityByKeywords(String subject, String body) {
        String combined = (subject + " " + body).toLowerCase();
        
        // High priority keywords
        String[] highPriorityKeywords = {
            "urgent", "asap", "immediately", "critical", "emergency", 
            "important", "action required", "deadline", "alert", "warning"
        };
        
        // Low priority keywords
        String[] lowPriorityKeywords = {
            "fyi", "for your information", "newsletter", "update", 
            "notification", "no action needed", "optional"
        };
        
        for (String keyword : highPriorityKeywords) {
            if (combined.contains(keyword)) {
                return "HIGH";
            }
        }
        
        for (String keyword : lowPriorityKeywords) {
            if (combined.contains(keyword)) {
                return "LOW";
            }
        }
        
        return "MEDIUM";
    }

    /**
     * Truncate text to maximum length
     */
    private String truncateText(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }

    /**
     * Clean email content for summarization
     */
    private String cleanEmailContent(String content) {
        if (content == null) {
            return "";
        }
        
        // Remove HTML tags
        String cleaned = content.replaceAll("<[^>]*>", " ");
        
        // Remove multiple spaces, tabs, newlines
        cleaned = cleaned.replaceAll("\\s+", " ");
        
        // Trim
        cleaned = cleaned.trim();
        
        return cleaned;
    }

    /**
     * Ensure text is exactly at or under max length
     */
    private String ensureMaxLength(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        
        // If it fits perfectly, return as-is
        if (text.length() <= maxLength) {
            return text;
        }
        
        // Need to truncate - try to cut at word boundary
        // Look for last space within maxLength (not maxLength - 3)
        int lastSpace = text.lastIndexOf(' ', maxLength);
        
        // If we found a good word boundary (not too far back)
        if (lastSpace > maxLength * 0.7) {
            // Cut at word boundary without ellipsis
            return text.substring(0, lastSpace).trim();
        }
        
        // If no good word boundary, cut at maxLength
        return text.substring(0, maxLength).trim();
    }

    /**
     * Create a simple extractive summary as fallback
     */
    private String createFallbackSummary(String content) {
        if (content == null || content.isEmpty()) {
            return "No content available";
        }
        
        // Clean the content
        String cleaned = cleanEmailContent(content);
        
        if (cleaned.length() <= maxSummaryLength) {
            return cleaned;
        }
        
        // Try to extract key information using multiple strategies
        
        // Strategy 1: Find the first meaningful sentence (not just greeting)
        String[] sentences = cleaned.split("[.!?]+");
        
        for (String sentence : sentences) {
            String trimmed = sentence.trim();
            // Skip greetings and very short sentences
            if (trimmed.length() > 15 && !isGreeting(trimmed)) {
                if (trimmed.length() <= maxSummaryLength) {
                    return trimmed;
                } else {
                    // This sentence is too long but contains good info
                    return ensureMaxLength(trimmed, maxSummaryLength);
                }
            }
        }
        
        // Strategy 2: Extract key phrases (words after important keywords)
        String summary = extractKeyPhrases(cleaned);
        if (summary != null && summary.length() <= maxSummaryLength) {
            return summary;
        }
        
        // Strategy 3: Take the most informative part (middle section often has key info)
        if (cleaned.length() > maxSummaryLength * 2) {
            // Skip intro, take middle section
            int start = Math.min(cleaned.length() / 4, 100);
            String middle = cleaned.substring(start);
            return ensureMaxLength(middle, maxSummaryLength);
        }
        
        // Last resort: intelligent truncation at word boundary
        return ensureMaxLength(cleaned, maxSummaryLength);
    }

    /**
     * Check if text is a greeting
     */
    private boolean isGreeting(String text) {
        String lower = text.toLowerCase();
        return lower.startsWith("hi ") || lower.startsWith("hello") || 
               lower.startsWith("dear ") || lower.startsWith("hey") ||
               lower.equals("hi") || lower.equals("hello");
    }

    /**
     * Extract key phrases from content
     */
    private String extractKeyPhrases(String content) {
        String lower = content.toLowerCase();
        
        // Look for important indicators
        String[] indicators = {
            "urgent:", "important:", "please", "required", "deadline",
            "meeting", "update", "notification", "alert", "reminder"
        };
        
        for (String indicator : indicators) {
            int pos = lower.indexOf(indicator);
            if (pos >= 0) {
                // Extract text around this indicator
                String extracted = content.substring(pos);
                // Get first sentence after indicator
                String[] parts = extracted.split("[.!?]+");
                if (parts.length > 0) {
                    String result = parts[0].trim();
                    if (result.length() <= maxSummaryLength) {
                        return result;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Process email with both summarization and priority classification
     */
    public EmailAIProcessing processEmail(String subject, String body) {
        log.info("Processing email with AI: {}", subject);
        
        // Combine subject and body for better summarization
        String fullContent = "Subject: " + subject + "\n\n" + body;
        String summary = summarizeEmail(fullContent);
        String priority = classifyPriority(subject, body);
        
        return new EmailAIProcessing(summary, priority);
    }

    /**
     * Check if AI processing is enabled
     */
    public boolean isAiEnabled() {
        return aiEnabled;
    }

    /**
     * Inner class to hold AI processing results
     */
    public static class EmailAIProcessing {
        private final String summary;
        private final String priority;

        public EmailAIProcessing(String summary, String priority) {
            this.summary = summary;
            this.priority = priority;
        }

        public String getSummary() {
            return summary;
        }

        public String getPriority() {
            return priority;
        }
    }
}
