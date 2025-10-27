package com.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
public class EmailStorageService {

    private static final String STORAGE_FILE = "email-metadata.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private EmailMetadata metadata;

    @PostConstruct
    public void init() {
        loadMetadata();
    }

    /**
     * Load email metadata from file
     */
    private void loadMetadata() {
        File file = new File(STORAGE_FILE);
        if (file.exists()) {
            try {
                metadata = objectMapper.readValue(file, EmailMetadata.class);
                log.info("Loaded email metadata: {} read emails, {} deleted emails", 
                        metadata.getReadEmailIds().size(), 
                        metadata.getDeletedEmailIds().size());
            } catch (IOException e) {
                log.error("Error loading email metadata, starting fresh", e);
                metadata = new EmailMetadata();
            }
        } else {
            log.info("No existing email metadata found, starting fresh");
            metadata = new EmailMetadata();
        }
    }

    /**
     * Save email metadata to file
     */
    private void saveMetadata() {
        try {
            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(new File(STORAGE_FILE), metadata);
            log.debug("Saved email metadata");
        } catch (IOException e) {
            log.error("Error saving email metadata", e);
        }
    }

    /**
     * Mark an email as read
     */
    public void markAsRead(String emailId) {
        metadata.getReadEmailIds().add(emailId);
        saveMetadata();
    }

    /**
     * Check if an email is read
     */
    public boolean isRead(String emailId) {
        return metadata.getReadEmailIds().contains(emailId);
    }

    /**
     * Mark an email as deleted
     */
    public void markAsDeleted(String emailId) {
        metadata.getDeletedEmailIds().add(emailId);
        saveMetadata();
    }

    /**
     * Check if an email is deleted
     */
    public boolean isDeleted(String emailId) {
        return metadata.getDeletedEmailIds().contains(emailId);
    }

    /**
     * Remove email from deleted list (if needed)
     */
    public void unmarkAsDeleted(String emailId) {
        metadata.getDeletedEmailIds().remove(emailId);
        saveMetadata();
    }

    /**
     * Remove email from read list (if needed)
     */
    public void unmarkAsRead(String emailId) {
        metadata.getReadEmailIds().remove(emailId);
        saveMetadata();
    }

    /**
     * Get all read email IDs
     */
    public Set<String> getReadEmailIds() {
        return new HashSet<>(metadata.getReadEmailIds());
    }

    /**
     * Get all deleted email IDs
     */
    public Set<String> getDeletedEmailIds() {
        return new HashSet<>(metadata.getDeletedEmailIds());
    }

    /**
     * Clear all metadata
     */
    public void clearAll() {
        metadata = new EmailMetadata();
        saveMetadata();
    }

    /**
     * Email metadata storage class
     */
    @Data
    public static class EmailMetadata {
        private Set<String> readEmailIds = new HashSet<>();
        private Set<String> deletedEmailIds = new HashSet<>();
    }
}
