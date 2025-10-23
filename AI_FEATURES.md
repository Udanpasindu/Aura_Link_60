# AI Email Features Documentation

## Overview
AuraLink now includes AI-powered email analysis using Hugging Face's transformer models. All received emails are automatically summarized and prioritized to help you focus on important messages.

## Features

### 1. **Email Summarization**
- **Model**: facebook/bart-large-cnn
- **Max Length**: 80 characters
- Every received email is automatically summarized using AI
- Summaries appear in the email list view with a green badge
- Helps you quickly understand email content without reading the full message

### 2. **Priority Classification**
- **Model**: facebook/bart-large-mnli (zero-shot classification)
- **Priority Levels**:
  - 🔴 **HIGH**: Urgent matters requiring immediate attention
  - 🟡 **MEDIUM**: Important but not urgent
  - 🟢 **LOW**: General information or low priority
- Priority badges are displayed next to email status
- Filter emails by priority in the dashboard

### 3. **Fallback Mechanism**
If the AI service is unavailable, the system uses keyword-based analysis:
- **HIGH Priority Keywords**: urgent, important, asap, critical, emergency, deadline, immediate
- **LOW Priority Keywords**: fyi, newsletter, update, reminder, notification
- **DEFAULT**: Medium priority

## API Endpoints

### Get All Received Emails
```
GET http://localhost:8080/api/email/received
```
Returns all received emails with AI-generated summary and priority.

### Get Emails by Priority
```
GET http://localhost:8080/api/email/priority/{priority}
```
Filter emails by priority level (HIGH, MEDIUM, or LOW).

**Example:**
```
GET http://localhost:8080/api/email/priority/HIGH
```

### Reprocess Single Email with AI
```
POST http://localhost:8080/api/email/ai/reprocess/{id}
```
Manually reprocess a specific email with AI analysis.

**Example:**
```
POST http://localhost:8080/api/email/ai/reprocess/msg-123456
```

### Reprocess All Emails with AI
```
POST http://localhost:8080/api/email/ai/reprocess-all
```
Batch process all received emails with AI. Useful after:
- Updating AI models
- Fixing AI service issues
- Adding AI features to existing emails

## Frontend Features

### Priority Filters
In the Email Dashboard's "Received" tab, you can:
1. View all emails (default)
2. Filter by HIGH priority
3. Filter by MEDIUM priority
4. Filter by LOW priority

### AI Reprocess Button
Click the **"🤖 Reprocess All with AI"** button to manually trigger AI analysis for all emails.

### Email Display
- **List View**: Shows summary and priority badge for each email
- **Detail View**: Displays full summary and priority in the metadata section

## Configuration

### Backend Configuration
File: `backend/src/main/resources/application.properties`

```properties
# Hugging Face API Configuration
huggingface.api.key=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
huggingface.api.url=https://api-inference.huggingface.co/models/
huggingface.summarization.model=facebook/bart-large-cnn
huggingface.classification.model=facebook/bart-large-mnli
huggingface.max.summary.length=80
huggingface.ai.enabled=true
```

### Automatic Processing
- New emails are automatically processed when received
- The scheduled email fetcher runs every 5 minutes
- AI processing happens asynchronously to avoid blocking

## Usage Guide

### 1. View Prioritized Emails
1. Navigate to **Email Management** in the navigation bar
2. Click on the **📥 Received** tab
3. Use the priority filter buttons to view specific priorities
4. Emails with higher priority appear with red badges

### 2. Read AI Summaries
- In the email list, AI summaries appear below the subject line in a green box
- In the email detail view, summaries are shown in the metadata section
- Summaries are limited to 80 characters for quick reading

### 3. Manual Reprocessing
If you need to refresh AI analysis:
1. Go to the **📥 Received** tab
2. Click **"🤖 Reprocess All with AI"**
3. Wait for processing to complete
4. All emails will have updated summaries and priorities

## Technical Details

### AI Processing Flow
1. Email received via IMAP
2. Email content sent to Hugging Face API
3. Summarization model generates 80-char summary
4. Classification model assigns priority (HIGH/MEDIUM/LOW)
5. Results stored in EmailMessage object
6. Frontend displays AI-enhanced email data

### Error Handling
- Network errors → Uses keyword fallback
- API rate limits → Queues requests and retries
- Model unavailable → Falls back to keyword analysis
- Invalid responses → Logs error and uses defaults

### Performance
- AI processing is non-blocking
- Requests are throttled to respect API limits
- Results are cached in the database
- Frontend updates via polling or manual refresh

## Models Information

### BART Large CNN (Summarization)
- **Purpose**: Abstractive text summarization
- **Training**: Fine-tuned on CNN/Daily Mail dataset
- **Performance**: State-of-the-art summarization quality
- **Speed**: ~2-3 seconds per email

### BART Large MNLI (Classification)
- **Purpose**: Zero-shot text classification
- **Training**: Multi-Genre Natural Language Inference
- **Candidate Labels**: urgent, normal, low
- **Accuracy**: High confidence scoring for priority detection

## Troubleshooting

### AI Summaries Not Appearing
1. Check backend logs for API errors
2. Verify Hugging Face API key is valid
3. Ensure `huggingface.ai.enabled=true` in properties
4. Manually reprocess emails using the reprocess endpoint

### Wrong Priority Assignments
- AI learns from email patterns
- Manual override: Keyword fallback can be adjusted
- Report issues if patterns are consistently wrong

### Slow Processing
- First API request may take 10-20 seconds (model loading)
- Subsequent requests are faster (~2-3 seconds)
- Consider local model hosting for faster performance

## Future Enhancements
- [ ] Sentiment analysis (positive/negative/neutral)
- [ ] Spam detection
- [ ] Email categorization (work/personal/marketing)
- [ ] Smart reply suggestions
- [ ] Priority learning from user actions
- [ ] Custom priority rules

## Support
For issues or questions:
1. Check backend logs: `backend/logs/`
2. Review API configuration in `application.properties`
3. Test API endpoints using Postman or curl
4. Verify Hugging Face API status

---
**Last Updated**: October 24, 2025
**Version**: 1.0.0
