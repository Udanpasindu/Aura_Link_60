package com.example.backend.controller;

import com.example.backend.model.EmailMessage;
import com.example.backend.model.EmailRequest;
import com.example.backend.service.EmailReceiverService;
import com.example.backend.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailReceiverService emailReceiverService;

    /**
     * Send an email
     * POST /api/email/send
     */
    @PostMapping("/send")
    public ResponseEntity<EmailMessage> sendEmail(@RequestBody EmailRequest emailRequest) {
        try {
            log.info("Sending email to: {}", emailRequest.getTo());
            EmailMessage result = emailService.sendEmail(emailRequest);
            
            if ("SENT".equals(result.getStatus())) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        } catch (Exception e) {
            log.error("Error sending email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send a simple text email
     * POST /api/email/send-simple
     */
    @PostMapping("/send-simple")
    public ResponseEntity<EmailMessage> sendSimpleEmail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String body) {
        try {
            EmailMessage result = emailService.sendSimpleEmail(to, subject, body);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending simple email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send a sensor alert email
     * POST /api/email/send-alert
     */
    @PostMapping("/send-alert")
    public ResponseEntity<EmailMessage> sendSensorAlert(
            @RequestParam String to,
            @RequestParam String alertType,
            @RequestParam String message) {
        try {
            EmailMessage result = emailService.sendSensorAlert(to, alertType, message);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error sending alert email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all sent emails
     * GET /api/email/sent
     */
    @GetMapping("/sent")
    public ResponseEntity<List<EmailMessage>> getSentEmails() {
        try {
            List<EmailMessage> emails = emailService.getSentEmails();
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error retrieving sent emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get sent email by ID
     * GET /api/email/sent/{id}
     */
    @GetMapping("/sent/{id}")
    public ResponseEntity<EmailMessage> getSentEmailById(@PathVariable String id) {
        try {
            EmailMessage email = emailService.getSentEmailById(id);
            if (email != null) {
                return ResponseEntity.ok(email);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving sent email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all received emails
     * GET /api/email/received
     */
    @GetMapping("/received")
    public ResponseEntity<List<EmailMessage>> getReceivedEmails() {
        try {
            List<EmailMessage> emails = emailReceiverService.getReceivedEmails();
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error retrieving received emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Fetch new emails manually
     * POST /api/email/fetch
     */
    @PostMapping("/fetch")
    public ResponseEntity<List<EmailMessage>> fetchEmails() {
        try {
            List<EmailMessage> emails = emailReceiverService.fetchEmails();
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error fetching emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get received email by ID
     * GET /api/email/received/{id}
     */
    @GetMapping("/received/{id}")
    public ResponseEntity<EmailMessage> getReceivedEmailById(@PathVariable String id) {
        try {
            EmailMessage email = emailReceiverService.getReceivedEmailById(id);
            if (email != null) {
                return ResponseEntity.ok(email);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving received email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search emails
     * GET /api/email/search
     */
    @GetMapping("/search")
    public ResponseEntity<List<EmailMessage>> searchEmails(@RequestParam String query) {
        try {
            List<EmailMessage> emails = emailReceiverService.searchEmails(query);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error searching emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get email statistics
     * GET /api/email/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getEmailStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("sentCount", emailService.getSentEmails().size());
            stats.put("receivedCount", emailReceiverService.getReceivedEmails().size());
            stats.put("unreadCount", emailReceiverService.getUnreadCount());
            
            long failedCount = emailService.getSentEmails().stream()
                    .filter(email -> "FAILED".equals(email.getStatus()))
                    .count();
            stats.put("failedCount", failedCount);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error retrieving email stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Clear sent emails history
     * DELETE /api/email/sent
     */
    @DeleteMapping("/sent")
    public ResponseEntity<Map<String, String>> clearSentEmails() {
        try {
            emailService.clearSentEmails();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sent emails cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error clearing sent emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a specific sent email by ID
     * DELETE /api/email/sent/{id}
     */
    @DeleteMapping("/sent/{id}")
    public ResponseEntity<Map<String, String>> deleteSentEmail(@PathVariable String id) {
        try {
            boolean deleted = emailService.deleteSentEmail(id);
            Map<String, String> response = new HashMap<>();
            if (deleted) {
                response.put("message", "Sent email deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Sent email not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            log.error("Error deleting sent email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Clear received emails cache
     * DELETE /api/email/received
     */
    @DeleteMapping("/received")
    public ResponseEntity<Map<String, String>> clearReceivedEmails() {
        try {
            emailReceiverService.clearReceivedEmails();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Received emails cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error clearing received emails: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a specific received email by ID
     * DELETE /api/email/received/{id}
     */
    @DeleteMapping("/received/{id}")
    public ResponseEntity<Map<String, String>> deleteReceivedEmail(@PathVariable String id) {
        try {
            boolean deleted = emailReceiverService.deleteReceivedEmail(id);
            Map<String, String> response = new HashMap<>();
            if (deleted) {
                response.put("message", "Received email deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Received email not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            log.error("Error deleting received email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     * GET /api/email/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Email Service");
        return ResponseEntity.ok(health);
    }

    /**
     * Reprocess a single email with AI
     * POST /api/email/ai/reprocess/{id}
     */
    @PostMapping("/ai/reprocess/{id}")
    public ResponseEntity<EmailMessage> reprocessEmail(@PathVariable String id) {
        try {
            EmailMessage email = emailReceiverService.reprocessEmailWithAI(id);
            if (email != null) {
                return ResponseEntity.ok(email);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error reprocessing email with AI: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Reprocess all emails with AI
     * POST /api/email/ai/reprocess-all
     */
    @PostMapping("/ai/reprocess-all")
    public ResponseEntity<List<EmailMessage>> reprocessAllEmails() {
        try {
            List<EmailMessage> emails = emailReceiverService.reprocessAllEmailsWithAI();
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error reprocessing all emails with AI: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get emails by priority
     * GET /api/email/priority/{priority}
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<EmailMessage>> getEmailsByPriority(@PathVariable String priority) {
        try {
            List<EmailMessage> emails = emailReceiverService.getEmailsByPriority(priority);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            log.error("Error retrieving emails by priority: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark an email as read
     * PUT /api/email/received/{id}/read
     */
    @PutMapping("/received/{id}/read")
    public ResponseEntity<Map<String, String>> markEmailAsRead(@PathVariable String id) {
        try {
            boolean success = emailReceiverService.markAsRead(id);
            Map<String, String> response = new HashMap<>();
            if (success) {
                response.put("message", "Email marked as read");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Email not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            log.error("Error marking email as read: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark all emails as read
     * PUT /api/email/received/read-all
     */
    @PutMapping("/received/read-all")
    public ResponseEntity<Map<String, Object>> markAllEmailsAsRead() {
        try {
            int markedCount = emailReceiverService.markAllAsRead();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "All emails marked as read");
            response.put("count", markedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking all emails as read: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
