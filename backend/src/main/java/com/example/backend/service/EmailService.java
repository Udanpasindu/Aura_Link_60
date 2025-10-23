package com.example.backend.service;

import com.example.backend.model.EmailMessage;
import com.example.backend.model.EmailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final List<EmailMessage> sentEmails = new ArrayList<>();

    /**
     * Send an email based on the provided EmailRequest
     */
    public EmailMessage sendEmail(EmailRequest emailRequest) {
        EmailMessage emailMessage = EmailMessage.builder()
                .id(UUID.randomUUID().toString())
                .from(fromEmail)
                .to(emailRequest.getTo())
                .cc(emailRequest.getCc())
                .bcc(emailRequest.getBcc())
                .subject(emailRequest.getSubject())
                .body(emailRequest.getBody())
                .isHtml(emailRequest.isHtml())
                .sentAt(LocalDateTime.now())
                .status("PENDING")
                .build();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emailRequest.getTo().toArray(new String[0]));
            
            if (emailRequest.getCc() != null && !emailRequest.getCc().isEmpty()) {
                helper.setCc(emailRequest.getCc().toArray(new String[0]));
            }
            
            if (emailRequest.getBcc() != null && !emailRequest.getBcc().isEmpty()) {
                helper.setBcc(emailRequest.getBcc().toArray(new String[0]));
            }
            
            helper.setSubject(emailRequest.getSubject());
            helper.setText(emailRequest.getBody(), emailRequest.isHtml());

            mailSender.send(message);
            
            emailMessage.setStatus("SENT");
            log.info("Email sent successfully to: {}", emailRequest.getTo());
            
        } catch (MessagingException e) {
            emailMessage.setStatus("FAILED");
            emailMessage.setErrorMessage(e.getMessage());
            log.error("Failed to send email: {}", e.getMessage(), e);
        }

        sentEmails.add(emailMessage);
        return emailMessage;
    }

    /**
     * Send a simple text email
     */
    public EmailMessage sendSimpleEmail(String to, String subject, String body) {
        EmailRequest request = EmailRequest.builder()
                .to(List.of(to))
                .subject(subject)
                .body(body)
                .isHtml(false)
                .build();
        return sendEmail(request);
    }

    /**
     * Send an HTML email
     */
    public EmailMessage sendHtmlEmail(String to, String subject, String htmlBody) {
        EmailRequest request = EmailRequest.builder()
                .to(List.of(to))
                .subject(subject)
                .body(htmlBody)
                .isHtml(true)
                .build();
        return sendEmail(request);
    }

    /**
     * Send sensor alert email
     */
    public EmailMessage sendSensorAlert(String to, String alertType, String message) {
        String subject = "AuraLink - Sensor Alert: " + alertType;
        String htmlBody = buildAlertEmailHtml(alertType, message);
        
        return sendHtmlEmail(to, subject, htmlBody);
    }

    /**
     * Build HTML template for alert emails
     */
    private String buildAlertEmailHtml(String alertType, String message) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .alert-type { font-size: 24px; font-weight: bold; color: #f44336; }
                        .message { margin-top: 15px; padding: 15px; background-color: white; border-left: 4px solid #f44336; }
                        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>AuraLink Sensor Alert</h1>
                        </div>
                        <div class="content">
                            <div class="alert-type">%s</div>
                            <div class="message">%s</div>
                            <p style="margin-top: 20px;">
                                <strong>Time:</strong> %s
                            </p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from AuraLink IoT System</p>
                        </div>
                    </div>
                </body>
                </html>
                """, alertType, message, LocalDateTime.now().toString());
    }

    /**
     * Get all sent emails
     */
    public List<EmailMessage> getSentEmails() {
        return new ArrayList<>(sentEmails);
    }

    /**
     * Get sent email by ID
     */
    public EmailMessage getSentEmailById(String id) {
        return sentEmails.stream()
                .filter(email -> email.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Delete a sent email by ID
     */
    public boolean deleteSentEmail(String id) {
        return sentEmails.removeIf(email -> email.getId().equals(id));
    }

    /**
     * Clear sent emails history
     */
    public void clearSentEmails() {
        sentEmails.clear();
    }
}
