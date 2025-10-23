# Email Feature Quick Start Guide

## Quick Test Commands

### 1. Start the Backend
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

### 2. Test Email Sending

#### Send a Simple Test Email
```bash
curl -X POST "http://localhost:8080/api/email/send-simple?to=testrecipient@example.com&subject=Hello&body=This is a test email from AuraLink"
```

#### Send an HTML Email
```powershell
$body = @{
    to = @("testrecipient@example.com")
    subject = "Test HTML Email"
    body = "<h1>Hello!</h1><p>This is a <b>test</b> email from AuraLink</p>"
    isHtml = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/email/send" -Method Post -Body $body -ContentType "application/json"
```

#### Send a Sensor Alert
```bash
curl -X POST "http://localhost:8080/api/email/send-alert?to=admin@example.com&alertType=Temperature Warning&message=Temperature exceeded threshold: 40°C"
```

### 3. Test Email Receiving

#### Manually Fetch Emails
```bash
curl -X POST http://localhost:8080/api/email/fetch
```

#### Get All Received Emails
```bash
curl http://localhost:8080/api/email/received
```

#### Search Emails
```bash
curl "http://localhost:8080/api/email/search?query=sensor"
```

### 4. Get Email Statistics
```bash
curl http://localhost:8080/api/email/stats
```

### 5. View All Sent Emails
```bash
curl http://localhost:8080/api/email/sent
```

### 6. Health Check
```bash
curl http://localhost:8080/api/email/health
```

## Testing with PowerShell (Windows)

### Send Email
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/email/send-simple?to=test@example.com&subject=Test&body=Hello" -Method Post
```

### Get Received Emails
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/email/received" -Method Get
```

### Get Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/email/stats" -Method Get
```

## Testing with Frontend Integration

You can create a simple email component in your React frontend:

```typescript
// EmailService.ts
const API_BASE_URL = 'http://localhost:8080/api/email';

export const sendEmail = async (emailRequest: EmailRequest) => {
    const response = await fetch(`${API_BASE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailRequest)
    });
    return response.json();
};

export const getReceivedEmails = async () => {
    const response = await fetch(`${API_BASE_URL}/received`);
    return response.json();
};

export const fetchNewEmails = async () => {
    const response = await fetch(`${API_BASE_URL}/fetch`, {
        method: 'POST'
    });
    return response.json();
};

export const getEmailStats = async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return response.json();
};
```

## Expected Responses

### Send Email Success
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "from": "udan@keensystems.lk",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "body": "This is a test",
    "isHtml": false,
    "sentAt": "2025-10-24T10:30:00",
    "status": "SENT"
}
```

### Email Statistics
```json
{
    "sentCount": 5,
    "receivedCount": 12,
    "unreadCount": 3,
    "failedCount": 0
}
```

### Received Emails
```json
[
    {
        "id": "message-id-123",
        "from": "sender@example.com",
        "to": ["udan@keensystems.lk"],
        "subject": "Re: Your inquiry",
        "body": "Email content here...",
        "receivedAt": "2025-10-24T09:15:00",
        "status": "RECEIVED"
    }
]
```

## Troubleshooting

### Backend not starting?
- Check if port 8080 is available
- Verify Maven is installed
- Check application.properties configuration

### Emails not sending?
- Verify mail server credentials
- Check SMTP server is accessible
- Review backend logs for errors

### Emails not receiving?
- Check IMAP server credentials
- Verify email account has emails
- Wait 5 minutes for scheduled check or trigger manual fetch

## Next Steps

1. **Integrate with Sensor Alerts**: Automatically send emails when sensor thresholds are exceeded
2. **Create Email Dashboard**: Build a UI component to manage emails
3. **Add Email Templates**: Create reusable email templates for different alert types
4. **Implement Notifications**: Show real-time notifications when new emails arrive

## Production Checklist

Before deploying to production:

- [ ] Move credentials to environment variables
- [ ] Enable SSL/TLS for email connections
- [ ] Set up proper error handling and retry logic
- [ ] Configure email rate limiting
- [ ] Set up monitoring and alerting
- [ ] Review and update security settings
- [ ] Test with production email account
- [ ] Document deployment process
