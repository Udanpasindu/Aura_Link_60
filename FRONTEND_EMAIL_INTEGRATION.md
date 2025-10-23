# Frontend Email Integration - Documentation

## Overview

The frontend has been updated to include a comprehensive email management interface integrated with the AuraLink IoT dashboard.

## New Components

### 1. **EmailDashboard** (`src/components/EmailDashboard.tsx`)
Main email management component that orchestrates all email functionality.

**Features:**
- Tab-based interface (Compose, Sent, Received)
- Real-time email statistics display
- Auto-refresh functionality (every 60 seconds)
- Manual fetch for new emails
- Refresh all data button

**Props:** None (standalone component)

### 2. **EmailCompose** (`src/components/EmailCompose.tsx`)
Component for composing and sending emails.

**Features:**
- Two email types:
  - **Standard Email**: Full control with To, CC, BCC, subject, and body
  - **Sensor Alert**: Simplified form for sending sensor-related alerts
- HTML email support toggle
- Form validation
- Success/error messaging
- Clear form functionality

**Props:**
```typescript
interface EmailComposeProps {
  onEmailSent?: () => void;  // Callback after successful email send
}
```

### 3. **EmailList** (`src/components/EmailList.tsx`)
Component for displaying lists of emails (both sent and received).

**Features:**
- Email list with search functionality
- Email preview in list view
- Detailed email view with full content
- HTML email rendering
- Status indicators (SENT, FAILED, RECEIVED)
- Refresh button
- Responsive design

**Props:**
```typescript
interface EmailListProps {
  emails: EmailMessage[];
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
}
```

## New Services

### **EmailService** (`src/services/EmailService.ts`)
API service for all email-related operations.

**Functions:**
```typescript
// Sending emails
sendEmail(emailRequest: EmailRequest): Promise<EmailMessage>
sendSimpleEmail(to: string, subject: string, body: string): Promise<EmailMessage>
sendSensorAlert(to: string, alertType: string, message: string): Promise<EmailMessage>

// Retrieving emails
getSentEmails(): Promise<EmailMessage[]>
getSentEmailById(id: string): Promise<EmailMessage>
getReceivedEmails(): Promise<EmailMessage[]>
getReceivedEmailById(id: string): Promise<EmailMessage>

// Fetching and searching
fetchNewEmails(): Promise<EmailMessage[]>
searchEmails(query: string): Promise<EmailMessage[]>

// Statistics and management
getEmailStats(): Promise<EmailStats>
clearSentEmails(): Promise<{ message: string }>
clearReceivedEmails(): Promise<{ message: string }>
checkEmailHealth(): Promise<{ status: string; service: string }>
```

## New Types

### **Email Types** (`src/types/Email.ts`)

```typescript
interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  sentAt?: string;
  receivedAt?: string;
  attachmentNames?: string[];
  status: string;
  errorMessage?: string;
}

interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
}

interface EmailStats {
  sentCount: number;
  receivedCount: number;
  unreadCount: number;
  failedCount: number;
}
```

## Updated Components

### **App.tsx**
Updated to include navigation between Sensor Dashboard and Email Management.

**New Features:**
- Navigation bar with two views:
  - 📊 Sensor Dashboard (existing)
  - 📧 Email Management (new)
- Tab-based view switching
- Sticky navigation header
- Responsive mobile menu

### **App.css**
Enhanced with navigation styles and responsive design.

## File Structure

```
frontend/src/
├── components/
│   ├── Dashboard.tsx              (existing)
│   ├── EmailDashboard.tsx         ✨ NEW
│   ├── EmailDashboard.css         ✨ NEW
│   ├── EmailCompose.tsx           ✨ NEW
│   ├── EmailCompose.css           ✨ NEW
│   ├── EmailList.tsx              ✨ NEW
│   └── EmailList.css              ✨ NEW
├── services/
│   ├── ApiService.ts              (existing)
│   ├── WebSocketService.ts        (existing)
│   └── EmailService.ts            ✨ NEW
├── types/
│   ├── SensorData.ts              (existing)
│   └── Email.ts                   ✨ NEW
├── App.tsx                        ✏️ UPDATED
└── App.css                        ✏️ UPDATED
```

## Usage Examples

### Sending a Simple Email

```typescript
import { sendSimpleEmail } from '../services/EmailService';

const handleSendAlert = async () => {
  try {
    const result = await sendSimpleEmail(
      'admin@example.com',
      'Sensor Alert',
      'Temperature exceeded threshold!'
    );
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
```

### Sending a Sensor Alert

```typescript
import { sendSensorAlert } from '../services/EmailService';

const sendTemperatureAlert = async (temperature: number) => {
  try {
    await sendSensorAlert(
      'admin@example.com',
      'High Temperature Alert',
      `Temperature has reached ${temperature}°C, exceeding the safe threshold.`
    );
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
};
```

### Fetching New Emails

```typescript
import { fetchNewEmails, getReceivedEmails } from '../services/EmailService';

const checkNewEmails = async () => {
  try {
    // Fetch from server
    await fetchNewEmails();
    
    // Get updated list
    const emails = await getReceivedEmails();
    console.log('Received emails:', emails);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
  }
};
```

### Getting Email Statistics

```typescript
import { getEmailStats } from '../services/EmailService';

const loadStats = async () => {
  try {
    const stats = await getEmailStats();
    console.log('Email stats:', stats);
    // { sentCount: 10, receivedCount: 25, unreadCount: 5, failedCount: 1 }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};
```

## Features

### Email Dashboard Features
- ✅ Real-time email statistics
- ✅ Auto-refresh (configurable)
- ✅ Manual fetch button
- ✅ Tab-based navigation
- ✅ Responsive design
- ✅ Loading states

### Email Compose Features
- ✅ Standard email mode
- ✅ Sensor alert mode
- ✅ Multiple recipients (To, CC, BCC)
- ✅ HTML email support
- ✅ Form validation
- ✅ Success/error messages
- ✅ Clear form functionality

### Email List Features
- ✅ Search functionality
- ✅ Email preview
- ✅ Detailed view
- ✅ Status indicators
- ✅ HTML rendering
- ✅ Responsive layout

## Styling

All components include comprehensive CSS with:
- Modern, clean design
- Responsive breakpoints
- Hover effects
- Smooth transitions
- Mobile-first approach
- Accessible color contrasts

## Integration with Sensor Data

### Example: Send Alert When Temperature Exceeds Threshold

```typescript
import { sendSensorAlert } from '../services/EmailService';
import type { SensorData } from '../types/SensorData';

const checkSensorThresholds = async (data: SensorData) => {
  const TEMP_THRESHOLD = 35;
  
  if (data.temperature > TEMP_THRESHOLD) {
    await sendSensorAlert(
      'admin@example.com',
      'High Temperature Alert',
      `Temperature: ${data.temperature}°C
Device: ${data.deviceId}
Time: ${new Date(data.timestamp).toLocaleString()}
Status: Exceeds threshold of ${TEMP_THRESHOLD}°C`
    );
  }
};
```

### Example: Daily Summary Email

```typescript
import { sendEmail } from '../services/EmailService';

const sendDailySummary = async (sensorData: SensorData[]) => {
  const avgTemp = sensorData.reduce((sum, d) => sum + d.temperature, 0) / sensorData.length;
  const avgHumidity = sensorData.reduce((sum, d) => sum + d.humidity, 0) / sensorData.length;
  
  const htmlBody = `
    <h2>Daily Sensor Summary</h2>
    <p><strong>Total Readings:</strong> ${sensorData.length}</p>
    <p><strong>Average Temperature:</strong> ${avgTemp.toFixed(2)}°C</p>
    <p><strong>Average Humidity:</strong> ${avgHumidity.toFixed(2)}%</p>
  `;
  
  await sendEmail({
    to: ['admin@example.com'],
    subject: 'AuraLink Daily Summary',
    body: htmlBody,
    isHtml: true
  });
};
```

## Testing

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Testing Email Features

1. **Navigate to Email Management**
   - Click "📧 Email Management" in the navigation bar

2. **Send a Test Email**
   - Go to "Compose" tab
   - Fill in recipient, subject, and message
   - Click "Send Email"

3. **View Sent Emails**
   - Click "Sent" tab
   - Search emails using the search box
   - Click an email to view details

4. **Fetch Received Emails**
   - Click "Received" tab
   - Click "↻ Fetch New Emails"
   - Browse received emails

5. **Check Statistics**
   - View stats cards at the top of the dashboard
   - Stats update automatically with auto-refresh enabled

## API Configuration

The EmailService connects to:
```
http://localhost:8080/api/email
```

If your backend is on a different URL, update `API_URL` in `EmailService.ts`:

```typescript
const API_URL = 'http://your-backend-url:8080/api/email';
```

## Responsive Design

All components are fully responsive:
- **Desktop**: Full layout with side-by-side panels
- **Tablet**: Adjusted layouts with proper spacing
- **Mobile**: Stacked layouts with collapsible sections

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Considerations

- Auto-refresh runs every 60 seconds (configurable)
- Can be disabled via toggle
- API calls use axios with proper error handling
- Loading states prevent multiple simultaneous requests

## Security Notes

- Emails are sent through backend API (no credentials in frontend)
- Input validation on form fields
- XSS protection with React's built-in sanitization
- HTML emails use `dangerouslySetInnerHTML` with caution

## Future Enhancements

Potential additions:
- [ ] Email drafts
- [ ] Email templates
- [ ] Attachment support in UI
- [ ] Rich text editor for HTML emails
- [ ] Email threading/conversations
- [ ] Email filters and labels
- [ ] Mark as read/unread
- [ ] Delete emails
- [ ] Email pagination
- [ ] Advanced search filters

## Troubleshooting

### Emails Not Loading
1. Check backend is running on port 8080
2. Verify CORS is enabled in backend
3. Check browser console for errors
4. Ensure network connectivity

### Auto-Refresh Not Working
1. Check auto-refresh toggle is enabled
2. Verify browser tab is active
3. Check browser console for errors

### Styling Issues
1. Clear browser cache
2. Check CSS files are imported correctly
3. Verify no CSS conflicts

## Support

For issues or questions:
- Check browser console for errors
- Verify backend API is accessible
- Review network tab for failed requests
- Check component props are correct
