# AuraLink Email API - Test Collection

This file contains sample API calls for testing the email functionality.
You can use these with curl, Postman, or any REST client.

## Base URL
```
http://localhost:8080/api/email
```

---

## 1. Health Check

**Request:**
```bash
GET http://localhost:8080/api/email/health
```

**curl:**
```bash
curl http://localhost:8080/api/email/health
```

**Expected Response:**
```json
{
  "status": "UP",
  "service": "Email Service"
}
```

---

## 2. Send Simple Email

**Request:**
```bash
POST http://localhost:8080/api/email/send-simple?to=recipient@example.com&subject=Test Email&body=This is a test message
```

**curl:**
```bash
curl -X POST "http://localhost:8080/api/email/send-simple?to=recipient@example.com&subject=Test Email&body=This is a test message"
```

**Expected Response:**
```json
{
  "id": "uuid",
  "from": "udan@keensystems.lk",
  "to": ["recipient@example.com"],
  "subject": "Test Email",
  "body": "This is a test message",
  "isHtml": false,
  "sentAt": "2025-10-24T10:30:00",
  "status": "SENT"
}
```

---

## 3. Send Full Email (with CC, BCC)

**Request:**
```bash
POST http://localhost:8080/api/email/send
Content-Type: application/json

{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Important Update",
  "body": "This is an important message",
  "isHtml": false
}
```

**curl:**
```bash
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient1@example.com"],
    "subject": "Important Update",
    "body": "This is an important message",
    "isHtml": false
  }'
```

**PowerShell:**
```powershell
$body = @{
    to = @("recipient1@example.com")
    subject = "Important Update"
    body = "This is an important message"
    isHtml = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/email/send" -Method Post -Body $body -ContentType "application/json"
```

---

## 4. Send HTML Email

**Request:**
```bash
POST http://localhost:8080/api/email/send
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "subject": "HTML Test Email",
  "body": "<h1>Welcome!</h1><p>This is an <b>HTML</b> email</p>",
  "isHtml": true
}
```

**curl:**
```bash
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "HTML Test Email",
    "body": "<h1>Welcome!</h1><p>This is an <b>HTML</b> email</p>",
    "isHtml": true
  }'
```

---

## 5. Send Sensor Alert

**Request:**
```bash
POST http://localhost:8080/api/email/send-alert?to=admin@example.com&alertType=High Temperature&message=Temperature exceeded 40°C in Zone A
```

**curl:**
```bash
curl -X POST "http://localhost:8080/api/email/send-alert?to=admin@example.com&alertType=High Temperature&message=Temperature exceeded 40°C"
```

---

## 6. Get All Sent Emails

**Request:**
```bash
GET http://localhost:8080/api/email/sent
```

**curl:**
```bash
curl http://localhost:8080/api/email/sent
```

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "from": "udan@keensystems.lk",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "body": "Message content",
    "sentAt": "2025-10-24T10:30:00",
    "status": "SENT"
  }
]
```

---

## 7. Get Sent Email by ID

**Request:**
```bash
GET http://localhost:8080/api/email/sent/{email-id}
```

**curl:**
```bash
curl http://localhost:8080/api/email/sent/550e8400-e29b-41d4-a716-446655440000
```

---

## 8. Fetch New Emails

**Request:**
```bash
POST http://localhost:8080/api/email/fetch
```

**curl:**
```bash
curl -X POST http://localhost:8080/api/email/fetch
```

**Expected Response:**
```json
[
  {
    "id": "message-id-123",
    "from": "sender@example.com",
    "to": ["udan@keensystems.lk"],
    "subject": "Re: Your inquiry",
    "body": "Email content...",
    "receivedAt": "2025-10-24T09:15:00",
    "status": "RECEIVED"
  }
]
```

---

## 9. Get All Received Emails

**Request:**
```bash
GET http://localhost:8080/api/email/received
```

**curl:**
```bash
curl http://localhost:8080/api/email/received
```

---

## 10. Get Received Email by ID

**Request:**
```bash
GET http://localhost:8080/api/email/received/{email-id}
```

**curl:**
```bash
curl http://localhost:8080/api/email/received/message-id-123
```

---

## 11. Search Emails

**Request:**
```bash
GET http://localhost:8080/api/email/search?query=sensor
```

**curl:**
```bash
curl "http://localhost:8080/api/email/search?query=sensor"
```

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "from": "sender@example.com",
    "subject": "Sensor Update",
    "body": "Sensor data has been updated...",
    "receivedAt": "2025-10-24T08:00:00"
  }
]
```

---

## 12. Get Email Statistics

**Request:**
```bash
GET http://localhost:8080/api/email/stats
```

**curl:**
```bash
curl http://localhost:8080/api/email/stats
```

**Expected Response:**
```json
{
  "sentCount": 15,
  "receivedCount": 42,
  "unreadCount": 8,
  "failedCount": 1
}
```

---

## 13. Clear Sent Emails

**Request:**
```bash
DELETE http://localhost:8080/api/email/sent
```

**curl:**
```bash
curl -X DELETE http://localhost:8080/api/email/sent
```

**Expected Response:**
```json
{
  "message": "Sent emails cleared successfully"
}
```

---

## 14. Clear Received Emails Cache

**Request:**
```bash
DELETE http://localhost:8080/api/email/received
```

**curl:**
```bash
curl -X DELETE http://localhost:8080/api/email/received
```

**Expected Response:**
```json
{
  "message": "Received emails cleared successfully"
}
```

---

## Testing Workflow

### 1. Check Service Health
```bash
curl http://localhost:8080/api/email/health
```

### 2. Send a Test Email
```bash
curl -X POST "http://localhost:8080/api/email/send-simple?to=your-email@example.com&subject=AuraLink Test&body=Testing email functionality"
```

### 3. Check Sent Emails
```bash
curl http://localhost:8080/api/email/sent
```

### 4. Fetch Received Emails
```bash
curl -X POST http://localhost:8080/api/email/fetch
curl http://localhost:8080/api/email/received
```

### 5. View Statistics
```bash
curl http://localhost:8080/api/email/stats
```

---

## Integration Examples

### Send Alert When Temperature is High
```java
if (temperature > 35) {
    emailService.sendSensorAlert(
        "admin@example.com",
        "High Temperature Alert",
        "Temperature: " + temperature + "°C"
    );
}
```

### Send Daily Summary
```java
@Scheduled(cron = "0 0 8 * * *") // Every day at 8 AM
public void sendDailySummary() {
    sensorAlertService.sendDailySummaryReport(
        "admin@example.com",
        totalReadings,
        avgTemperature,
        avgHumidity,
        alertCount
    );
}
```

---

## Error Responses

### Email Send Failure
```json
{
  "id": "uuid",
  "status": "FAILED",
  "errorMessage": "Connection timeout",
  "sentAt": "2025-10-24T10:30:00"
}
```

### Email Not Found
```
HTTP 404 Not Found
```

### Server Error
```
HTTP 500 Internal Server Error
```

---

## Notes

- Replace `recipient@example.com` with actual email addresses
- Replace `localhost:8080` with your server address if different
- Ensure the backend server is running before testing
- Check logs for detailed error messages
- Email fetching runs automatically every 5 minutes
- SMTP uses port 587 (STARTTLS)
- IMAP uses port 143 (Plain - not recommended for production)

---

## Troubleshooting

### Emails Not Sending
1. Check SMTP server settings in `application.properties`
2. Verify credentials are correct
3. Check firewall allows outbound port 587
4. Review backend logs for errors

### Emails Not Receiving
1. Check IMAP server settings
2. Verify INBOX folder exists
3. Check if scheduled task is enabled
4. Try manual fetch: `curl -X POST http://localhost:8080/api/email/fetch`

### Connection Timeout
1. Increase timeout values in `application.properties`
2. Check network connectivity
3. Verify mail server is accessible from your network
