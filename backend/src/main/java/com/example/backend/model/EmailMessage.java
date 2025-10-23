package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {
    private String id;
    private String from;
    private List<String> to;
    private List<String> cc;
    private List<String> bcc;
    private String subject;
    private String body;
    private boolean isHtml;
    private LocalDateTime sentAt;
    private LocalDateTime receivedAt;
    private List<String> attachmentNames;
    private String status; // SENT, FAILED, RECEIVED, etc.
    private String errorMessage;
    private String summary; // AI-generated summary (max 80 chars)
    private String priority; // HIGH, MEDIUM, LOW
}
