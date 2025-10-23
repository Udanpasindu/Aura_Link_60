# 🚀 Quick Start Guide - AuraLink with Email Feature

## ✅ Current Status

Both servers are **RUNNING**:
- ✅ **Backend**: http://localhost:8080 (Spring Boot)
- ✅ **Frontend**: http://localhost:5173 (React + Vite)
- ✅ **Email API**: http://localhost:8080/api/email

---

## 🎯 Access the Application

### Frontend
Open your browser and navigate to:
```
http://localhost:5173
```

### Navigation
- Click **📊 Sensor Dashboard** - View sensor data
- Click **📧 Email Management** - Access email features

---

## 📧 Email Features Available

### 1. Compose Emails
- **Standard Email Mode**:
  - To, CC, BCC fields
  - Subject and body
  - HTML email toggle
  
- **Sensor Alert Mode**:
  - Alert type
  - Alert message
  - Auto-formatted HTML

### 2. View Emails
- **Sent Tab**: View all sent emails
- **Received Tab**: View received emails
- Search functionality
- Click emails to view details

### 3. Statistics
Real-time email stats displayed:
- 📤 Sent Emails
- 📥 Received Emails
- 📬 Unread
- ⚠️ Failed

### 4. Actions
- **Fetch New Emails**: Manually check for new emails
- **Refresh All**: Reload all email data
- **Auto-refresh**: Toggle automatic updates (every 60s)

---

## 🧪 Quick Tests

### Test 1: Check Email Service Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/email/health"
```
Expected: `status: UP, service: Email Service`

### Test 2: View Email Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/email/stats"
```

### Test 3: Send a Test Email (Web UI)
1. Go to http://localhost:5173
2. Click "📧 Email Management"
3. In "Compose" tab:
   - To: `your-email@example.com`
   - Subject: `Test from AuraLink`
   - Body: `Testing email functionality`
4. Click "Send Email"

### Test 4: Send Email via API
```powershell
$body = @{
    to = @("recipient@example.com")
    subject = "Test Email"
    body = "This is a test"
    isHtml = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/email/send" -Method Post -Body $body -ContentType "application/json"
```

---

## 🔄 Restart Servers (if needed)

### Stop Servers
Press `Ctrl+C` in the terminal running each server

### Start Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Wait for: "Started BackendApplication"

### Start Frontend
```powershell
cd frontend
npm run dev
```
Wait for: "VITE ready"

---

## ⚠️ Troubleshooting

### Frontend Shows Network Errors
**Issue**: Cannot connect to backend
**Solution**: 
1. Check backend is running on port 8080
2. Check for "Started BackendApplication" in backend terminal
3. Test: http://localhost:8080/api/email/health

### CORS Errors
**Issue**: Access blocked by CORS policy
**Solution**: Backend has CORS enabled. If still seeing errors:
1. Restart backend server
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

### Email Not Sending
**Issue**: Email fails to send
**Check**:
1. Mail server credentials in `backend/src/main/resources/application.properties`
2. SMTP server is accessible
3. Check backend console for errors

### Email Not Receiving
**Issue**: No emails fetched
**Check**:
1. IMAP credentials in `application.properties`
2. Email account has emails
3. Click "Fetch New Emails" button
4. Check backend console for IMAP errors

### Port Already in Use
**Issue**: Port 8080 or 5173 already in use
**Solution**:
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in application.properties (backend)
# Or vite.config.ts (frontend)
```

---

## 📊 Monitoring

### Backend Logs
Watch the terminal running `.\mvnw.cmd spring-boot:run`
- Look for errors or exceptions
- Email send confirmations
- IMAP fetch operations

### Frontend Console
Open browser DevTools (F12) → Console tab
- Check for API errors
- Network tab shows API calls
- Verify responses from backend

---

## 🔧 Configuration

### Email Settings
Edit: `backend/src/main/resources/application.properties`

```properties
# SMTP (Sending)
spring.mail.host=mail.keensystems.lk
spring.mail.port=587
spring.mail.username=udan@keensystems.lk
spring.mail.password=!+ReO8EVcFyoLsm6

# IMAP (Receiving)
mail.imap.host=mail.keensystems.lk
mail.imap.port=143
mail.imap.username=udan@keensystems.lk
mail.imap.password=!+ReO8EVcFyoLsm6

# Auto-fetch interval (milliseconds)
mail.receiver.schedule.fixed-delay=300000
```

### API Base URL
Edit: `frontend/src/services/EmailService.ts`

```typescript
const API_URL = 'http://localhost:8080/api/email';
```

---

## 📚 Documentation

- **EMAIL_FEATURE.md** - Complete backend API documentation
- **EMAIL_QUICK_START.md** - API testing examples
- **EMAIL_API_TESTS.md** - curl/PowerShell test commands
- **FRONTEND_EMAIL_INTEGRATION.md** - Frontend component guide
- **FRONTEND_COMPLETE.md** - Frontend implementation summary

---

## ✨ Features Checklist

### Backend
- [x] Email sending (SMTP)
- [x] Email receiving (IMAP)
- [x] 13 REST API endpoints
- [x] Scheduled email fetching (every 5 minutes)
- [x] Sensor alert emails
- [x] Email search
- [x] Email statistics

### Frontend
- [x] Email dashboard UI
- [x] Compose emails
- [x] View sent emails
- [x] View received emails
- [x] Search functionality
- [x] Real-time statistics
- [x] Auto-refresh
- [x] Responsive design

---

## 🎉 You're Ready!

Both servers are running and the email system is fully operational!

**Next Steps**:
1. Open http://localhost:5173
2. Click "📧 Email Management"
3. Try composing and sending an email
4. Check the sent emails tab
5. Click "Fetch New Emails" to check for incoming mail

**Need Help?**
- Check backend terminal for errors
- Check browser console (F12)
- Review documentation files
- Verify email server settings

---

## 🛑 Shutdown

When finished:
1. Press `Ctrl+C` in backend terminal
2. Press `Ctrl+C` in frontend terminal
3. Both servers will stop gracefully

---

**Happy Emailing! 📧**
