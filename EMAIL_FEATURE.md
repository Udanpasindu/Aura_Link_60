# Email Feature Documentation

## Overview
This document describes the email sending and receiving functionality integrated into the AuraLink IoT project.

## Configuration

### Email Server Settings
The application uses the following mail server configuration:

- **Host**: mail.keensystems.lk
- **Username**: udan@keensystems.lk
- **Password**: !+ReO8EVcFyoLsm6
- **SMTP Port**: 587 (for sending emails)
- **IMAP Port**: 143 (for receiving emails)

### Configuration Properties
All email settings are configured in `application.properties`:

```properties
# SMTP Configuration (Sending)
spring.mail.host=mail.keensystems.lk
spring.mail.port=587
spring.mail.username=udan@keensystems.lk
spring.mail.password=!+ReO8EVcFyoLsm6

# IMAP Configuration (Receiving)
mail.imap.host=mail.keensystems.lk
mail.imap.port=143
mail.imap.username=udan@keensystems.lk
mail.imap.password=!+ReO8EVcFyoLsm6
mail.imap.folder=INBOX

# Email Receiver Scheduling (checks every 5 minutes)
mail.receiver.enabled=true
mail.receiver.schedule.fixed-delay=300000
```

## Features

### 1. Email Sending
- Send simple text emails
- Send HTML formatted emails
- Send sensor alert emails with HTML templates
- Support for multiple recipients (To, CC, BCC)
- Track sent emails with status (SENT/FAILED)

### 2. Email Receiving
- Automatically fetch emails from IMAP server
- Scheduled email checking (every 5 minutes by default)
- Manual email fetching on demand
- Search emails by subject, sender, or content
- Track received emails

### 3. Email Management
- View sent and received emails
- Get email statistics
- Search functionality
- Clear email history

## API Endpoints

### Sending Emails

#### 1. Send Email (Full Control)
```http
POST /api/email/send
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Test Email",
  "body": "This is a test email",
  "isHtml": false
}
```

#### 2. Send Simple Email
```http
POST /api/email/send-simple?to=recipient@example.com&subject=Hello&body=Test message
```

#### 3. Send Sensor Alert
```http
POST /api/email/send-alert?to=admin@example.com&alertType=Temperature Alert&message=Temperature exceeded 35°C
```

### Retrieving Emails

#### 4. Get All Sent Emails
```http
GET /api/email/sent
```

#### 5. Get Sent Email by ID
```http
GET /api/email/sent/{id}
```

#### 6. Get All Received Emails
```http
GET /api/email/received
```

#### 7. Fetch New Emails Manually
```http
POST /api/email/fetch
```

#### 8. Get Received Email by ID
```http
GET /api/email/received/{id}
```

#### 9. Search Emails
```http
GET /api/email/search?query=sensor
```

### Statistics & Management

#### 10. Get Email Statistics
```http
GET /api/email/stats
```

Response:
```json
{
  "sentCount": 10,
  "receivedCount": 25,
  "unreadCount": 5,
  "failedCount": 1
}
```

#### 11. Clear Sent Emails History
```http
DELETE /api/email/sent
```

#### 12. Clear Received Emails Cache
```http
DELETE /api/email/received
```

#### 13. Health Check
```http
GET /api/email/health
```

## Usage Examples

### Example 1: Send a Simple Alert
```bash
curl -X POST "http://localhost:8080/api/email/send-simple?to=admin@example.com&subject=Test&body=Hello from AuraLink"
```

### Example 2: Send HTML Email
```bash
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["admin@example.com"],
    "subject": "HTML Test",
    "body": "<h1>Hello</h1><p>This is an <b>HTML</b> email</p>",
    "isHtml": true
  }'
```

### Example 3: Send Sensor Alert
```bash
curl -X POST "http://localhost:8080/api/email/send-alert?to=admin@example.com&alertType=High Temperature&message=Temperature is 40°C"
```

### Example 4: Fetch New Emails
```bash
curl -X POST http://localhost:8080/api/email/fetch
```

### Example 5: Get Email Statistics
```bash
curl http://localhost:8080/api/email/stats
```

## Integration with Sensor Data

You can integrate email alerts with sensor data by calling the email service from your sensor processing logic:

```java
@Autowired
private EmailService emailService;

public void processSensorData(SensorData data) {
    // Check for alert conditions
    if (data.getTemperature() > 35) {
        String message = String.format(
            "High temperature detected: %.2f°C at %s",
            data.getTemperature(),
            data.getReceivedAt()
        );
        emailService.sendSensorAlert(
            "admin@example.com",
            "High Temperature Alert",
            message
        );
    }
}
```

## Email Models

### EmailMessage
```java
{
  "id": "uuid",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Email Subject",
  "body": "Email body content",
  "isHtml": false,
  "sentAt": "2025-10-24T10:30:00",
  "receivedAt": "2025-10-24T10:31:00",
  "attachmentNames": [],
  "status": "SENT",
  "errorMessage": null
}
```

### EmailRequest
```java
{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Email Subject",
  "body": "Email body content",
  "isHtml": false
}
```

## Scheduled Tasks

The email receiver service automatically checks for new emails:
- **Default Interval**: Every 5 minutes (300,000 milliseconds)
- **Configurable**: Change `mail.receiver.schedule.fixed-delay` in application.properties
- **Enable/Disable**: Set `mail.receiver.enabled=true/false`

## Security Considerations

⚠️ **IMPORTANT**: The current configuration uses non-SSL settings which is NOT recommended for production.

For production use, consider:
1. Using SSL/TLS (port 465 for SMTP, port 993 for IMAP)
2. Storing credentials in environment variables or secure vault
3. Implementing OAuth2 authentication if supported
4. Enabling additional authentication mechanisms

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP server settings
   - Verify credentials
   - Check firewall settings
   - Review application logs

2. **Emails not being received**
   - Check IMAP server settings
   - Verify folder name (default is "INBOX")
   - Check if scheduled task is enabled
   - Review application logs

3. **Connection timeout**
   - Increase timeout values in application.properties
   - Check network connectivity
   - Verify server is accessible

### Logging

Enable debug logging for email operations:
```properties
logging.level.com.example.backend.service.EmailService=DEBUG
logging.level.com.example.backend.service.EmailReceiverService=DEBUG
```

## Future Enhancements

Potential improvements for the email feature:
- [ ] File attachment support
- [ ] Email templates system
- [ ] Read/unread tracking
- [ ] Email archiving
- [ ] Filter rules for incoming emails
- [ ] Email forwarding functionality
- [ ] Reply to emails functionality
- [ ] Rich text editor integration in frontend

## Testing

### Testing Sending Emails
```bash
# Test with Postman or curl
curl -X POST "http://localhost:8080/api/email/send-simple?to=your-email@example.com&subject=Test&body=Testing email functionality"
```

### Testing Receiving Emails
1. Send an email to udan@keensystems.lk
2. Wait for scheduled fetch (5 minutes) or trigger manual fetch:
```bash
curl -X POST http://localhost:8080/api/email/fetch
```
3. Check received emails:
```bash
curl http://localhost:8080/api/email/received
```

## Support

For issues or questions:
- Check application logs
- Review configuration settings
- Verify mail server accessibility
- Contact system administrator
