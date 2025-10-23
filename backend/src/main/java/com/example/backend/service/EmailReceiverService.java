package com.example.backend.service;

import com.example.backend.model.EmailMessage;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmailReceiverService {

    @Autowired
    private HuggingFaceService huggingFaceService;

    @Value("${mail.imap.host}")
    private String imapHost;

    @Value("${mail.imap.port}")
    private int imapPort;

    @Value("${mail.imap.username}")
    private String username;

    @Value("${mail.imap.password}")
    private String password;

    @Value("${mail.imap.folder:INBOX}")
    private String folderName;

    @Value("${mail.receiver.enabled:true}")
    private boolean receiverEnabled;

    private final List<EmailMessage> receivedEmails = new ArrayList<>();
    private Store store;
    private Folder folder;

    @PostConstruct
    public void init() {
        if (receiverEnabled) {
            log.info("Email receiver service initialized");
        }
    }

    /**
     * Connect to IMAP server
     */
    private void connect() throws MessagingException {
        if (store != null && store.isConnected()) {
            return;
        }

        Properties props = new Properties();
        props.setProperty("mail.store.protocol", "imap");
        props.setProperty("mail.imap.host", imapHost);
        props.setProperty("mail.imap.port", String.valueOf(imapPort));
        props.setProperty("mail.imap.connectiontimeout", "5000");
        props.setProperty("mail.imap.timeout", "5000");

        Session session = Session.getInstance(props);
        store = session.getStore("imap");
        store.connect(imapHost, username, password);
        
        folder = store.getFolder(folderName);
        folder.open(Folder.READ_ONLY);
        
        log.info("Connected to IMAP server: {}", imapHost);
    }

    /**
     * Disconnect from IMAP server
     */
    private void disconnect() {
        try {
            if (folder != null && folder.isOpen()) {
                folder.close(false);
            }
            if (store != null && store.isConnected()) {
                store.close();
            }
            log.info("Disconnected from IMAP server");
        } catch (MessagingException e) {
            log.error("Error disconnecting from IMAP server: {}", e.getMessage());
        }
    }

    /**
     * Fetch new emails (scheduled task - runs every 5 minutes by default)
     */
    @Scheduled(fixedDelayString = "${mail.receiver.schedule.fixed-delay:300000}")
    public void fetchNewEmails() {
        if (!receiverEnabled) {
            return;
        }

        try {
            connect();
            
            Message[] messages = folder.getMessages();
            int newEmailsCount = 0;
            
            // Get the last 50 messages (or fewer if there are less)
            int start = Math.max(1, messages.length - 49);
            Message[] recentMessages = folder.getMessages(start, messages.length);
            
            for (Message message : recentMessages) {
                String messageId = getMessageId(message);
                
                // Check if we already have this email
                boolean exists = receivedEmails.stream()
                        .anyMatch(email -> email.getId().equals(messageId));
                
                if (!exists) {
                    EmailMessage emailMessage = convertToEmailMessage(message);
                    receivedEmails.add(emailMessage);
                    newEmailsCount++;
                    log.debug("New email received from: {}, Subject: {}", 
                            emailMessage.getFrom(), emailMessage.getSubject());
                }
            }
            
            if (newEmailsCount > 0) {
                log.info("Fetched {} new email(s)", newEmailsCount);
            }
            
        } catch (MessagingException e) {
            log.error("Error fetching emails: {}", e.getMessage());
        } finally {
            disconnect();
        }
    }

    /**
     * Fetch emails manually
     */
    public List<EmailMessage> fetchEmails() {
        fetchNewEmails();
        return getReceivedEmails();
    }

    /**
     * Convert javax.mail.Message to EmailMessage
     */
    private EmailMessage convertToEmailMessage(Message message) throws MessagingException {
        String messageId = getMessageId(message);
        String from = getFromAddress(message);
        List<String> to = getToAddresses(message);
        String subject = message.getSubject();
        String body = getTextFromMessage(message);
        Date sentDate = message.getSentDate();
        Date receivedDate = message.getReceivedDate();
        
        // Process email with AI for summary and priority
        String summary = null;
        String priority = null;
        
        try {
            if (huggingFaceService != null && huggingFaceService.isAiEnabled()) {
                HuggingFaceService.EmailAIProcessing aiProcessing = 
                    huggingFaceService.processEmail(
                        subject != null ? subject : "", 
                        body != null ? body : ""
                    );
                summary = aiProcessing.getSummary();
                priority = aiProcessing.getPriority();
                log.info("AI processed email: {} - Priority: {}", subject, priority);
            }
        } catch (Exception e) {
            log.warn("Failed to process email with AI, using defaults: {}", e.getMessage());
            priority = "MEDIUM";
            summary = body != null && body.length() > 80 ? body.substring(0, 77) + "..." : body;
        }
        
        return EmailMessage.builder()
                .id(messageId)
                .from(from)
                .to(to)
                .subject(subject != null ? subject : "(No Subject)")
                .body(body)
                .isHtml(false)
                .sentAt(sentDate != null ? 
                        LocalDateTime.ofInstant(sentDate.toInstant(), ZoneId.systemDefault()) : null)
                .receivedAt(receivedDate != null ? 
                        LocalDateTime.ofInstant(receivedDate.toInstant(), ZoneId.systemDefault()) : 
                        LocalDateTime.now())
                .status("RECEIVED")
                .summary(summary)
                .priority(priority != null ? priority : "MEDIUM")
                .build();
    }

    /**
     * Get unique message ID
     */
    private String getMessageId(Message message) throws MessagingException {
        String[] headers = message.getHeader("Message-ID");
        if (headers != null && headers.length > 0) {
            return headers[0];
        }
        // Fallback to generating ID from subject and date
        return UUID.randomUUID().toString();
    }

    /**
     * Get sender email address
     */
    private String getFromAddress(Message message) throws MessagingException {
        Address[] fromAddresses = message.getFrom();
        if (fromAddresses != null && fromAddresses.length > 0) {
            return fromAddresses[0].toString();
        }
        return "Unknown";
    }

    /**
     * Get recipient email addresses
     */
    private List<String> getToAddresses(Message message) throws MessagingException {
        Address[] toAddresses = message.getRecipients(Message.RecipientType.TO);
        if (toAddresses != null) {
            return Arrays.stream(toAddresses)
                    .map(Address::toString)
                    .collect(Collectors.toList());
        }
        return new ArrayList<>();
    }

    /**
     * Extract text content from message
     */
    private String getTextFromMessage(Message message) {
        try {
            Object content = message.getContent();
            
            if (content instanceof String) {
                return (String) content;
            } else if (content instanceof MimeMultipart) {
                return getTextFromMimeMultipart((MimeMultipart) content);
            }
            
            return "";
        } catch (MessagingException | IOException e) {
            log.error("Error extracting text from message: {}", e.getMessage());
            return "Error reading email content";
        }
    }

    /**
     * Extract text from MimeMultipart
     */
    private String getTextFromMimeMultipart(MimeMultipart mimeMultipart) throws MessagingException, IOException {
        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            
            if (bodyPart.isMimeType("text/plain")) {
                result.append(bodyPart.getContent().toString());
                break; // Prefer plain text
            } else if (bodyPart.isMimeType("text/html")) {
                result.append(bodyPart.getContent().toString());
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getTextFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        
        return result.toString();
    }

    /**
     * Get all received emails
     */
    public List<EmailMessage> getReceivedEmails() {
        return new ArrayList<>(receivedEmails);
    }

    /**
     * Get received email by ID
     */
    public EmailMessage getReceivedEmailById(String id) {
        return receivedEmails.stream()
                .filter(email -> email.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Search emails by subject or sender
     */
    public List<EmailMessage> searchEmails(String query) {
        String lowerQuery = query.toLowerCase();
        return receivedEmails.stream()
                .filter(email -> 
                    email.getSubject().toLowerCase().contains(lowerQuery) ||
                    email.getFrom().toLowerCase().contains(lowerQuery) ||
                    email.getBody().toLowerCase().contains(lowerQuery)
                )
                .collect(Collectors.toList());
    }

    /**
     * Reprocess a single email with AI (for manual trigger)
     */
    public EmailMessage reprocessEmailWithAI(String emailId) {
        EmailMessage email = getReceivedEmailById(emailId);
        if (email == null) {
            return null;
        }

        try {
            HuggingFaceService.EmailAIProcessing aiProcessing = 
                huggingFaceService.processEmail(email.getSubject(), email.getBody());
            
            email.setSummary(aiProcessing.getSummary());
            email.setPriority(aiProcessing.getPriority());
            
            log.info("Reprocessed email with AI: {} - Priority: {}", email.getSubject(), email.getPriority());
            
            return email;
        } catch (Exception e) {
            log.error("Error reprocessing email with AI: {}", e.getMessage());
            return email;
        }
    }

    /**
     * Reprocess all received emails with AI
     */
    public List<EmailMessage> reprocessAllEmailsWithAI() {
        log.info("Reprocessing all emails with AI...");
        int processed = 0;
        
        for (EmailMessage email : receivedEmails) {
            try {
                HuggingFaceService.EmailAIProcessing aiProcessing = 
                    huggingFaceService.processEmail(email.getSubject(), email.getBody());
                
                email.setSummary(aiProcessing.getSummary());
                email.setPriority(aiProcessing.getPriority());
                processed++;
            } catch (Exception e) {
                log.warn("Failed to reprocess email: {} - {}", email.getSubject(), e.getMessage());
            }
        }
        
        log.info("Reprocessed {} emails with AI", processed);
        return receivedEmails;
    }

    /**
     * Get emails filtered by priority
     */
    public List<EmailMessage> getEmailsByPriority(String priority) {
        return receivedEmails.stream()
                .filter(email -> priority.equalsIgnoreCase(email.getPriority()))
                .collect(Collectors.toList());
    }

    /**
     * Get unread emails count (placeholder - would need to track read status)
     */
    public int getUnreadCount() {
        return receivedEmails.size();
    }

    /**
     * Delete a received email by ID
     */
    public boolean deleteReceivedEmail(String id) {
        return receivedEmails.removeIf(email -> email.getId().equals(id));
    }

    /**
     * Clear received emails cache
     */
    public void clearReceivedEmails() {
        receivedEmails.clear();
    }

    @PreDestroy
    public void cleanup() {
        disconnect();
    }
}
