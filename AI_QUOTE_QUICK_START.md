# AI Quote Generation - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key immediately (you won't see it again!)

### Step 2: Configure Backend
1. Open `backend/src/main/resources/application.properties`
2. Find this line:
   ```properties
   openai.api.key=your-openai-api-key-here
   ```
3. Replace `your-openai-api-key-here` with your actual API key
4. Save the file

### Step 3: Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

Wait for: `Started BackendApplication`

### Step 4: Upload ESP32 Code
1. Open Arduino IDE
2. Load `esp32/esp32_code_updated.ino`
3. Click Upload
4. Open Serial Monitor (115200 baud)

### Step 5: Run Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

Open browser: http://localhost:5173

## ✅ Verify It's Working

### Check ESP32 Serial Monitor
You should see:
```
Subscribed to email and quote topics
AI Quote received: Breathe deep, live well!
Displaying AI Quote: Breathe deep, live well!
```

### Check LCD Display
- Quotes appear every 10 minutes
- Display shows "*** AI QUOTE ***" header
- Quote text fills 1-3 lines
- Displays for 15 seconds

### Check Frontend Dashboard
- Look for purple gradient "AI Generated Quote" card
- Click refresh icon to generate new quote
- Quote updates automatically

## 🎯 Quick Test

### Test via REST API
```bash
curl -X POST http://localhost:8080/api/quotes/generate/ESP32_AuraLink_Client
```

You should get a JSON response with a quote!

## ⚙️ Configuration Options

### Change Quote Frequency
In `application.properties`:
```properties
# Every 5 minutes (300000 ms)
openai.quote.generation.interval=300000

# Every 30 minutes (1800000 ms)
openai.quote.generation.interval=1800000

# Every hour (3600000 ms)
openai.quote.generation.interval=3600000
```

### Disable Feature Temporarily
```properties
openai.quote.generation.enabled=false
```

### Use Different GPT Model
```properties
# Use GPT-4 (more expensive but better)
openai.model=gpt-4

# Use GPT-3.5-turbo (default, cheaper)
openai.model=gpt-3.5-turbo
```

## 🔧 Troubleshooting

### "Failed to generate quote"

**Solution 1: Check API Key**
- Make sure you copied the entire key
- No extra spaces before/after
- Key starts with `sk-`

**Solution 2: Check Internet**
- Backend must have internet access
- Test: `curl https://api.openai.com/v1/models`

**Solution 3: Check OpenAI Account**
- Visit https://platform.openai.com/usage
- Ensure you have credits
- Check billing is set up

### LCD Not Showing Quotes

**Solution 1: Check MQTT Connection**
- Serial monitor should show "WiFi connected"
- Should show "connected" for MQTT
- Look for "Subscribed to email and quote topics"

**Solution 2: Check Quote Reception**
- Look in serial monitor for "AI Quote received"
- If missing, backend might not be running
- Check backend logs for errors

**Solution 3: Check Display Priority**
- Email notifications have higher priority
- Wait for current display to finish
- Quote shows after email (if any)

### Frontend Not Showing Quotes

**Solution 1: Check Backend**
```bash
# Test if backend is running
curl http://localhost:8080/api/sensors
```

**Solution 2: Check Browser Console**
- Press F12
- Look for errors in Console tab
- Check Network tab for failed requests

**Solution 3: Check Device ID**
- Device ID must match ESP32
- Default: `ESP32_AuraLink_Client`

## 📊 Expected Behavior

### Automatic Schedule
- Quote generated every 10 minutes (default)
- Sent to all active devices
- Logged in backend console

### Manual Generation
- Click refresh in frontend
- Immediate quote generation
- No waiting for schedule

### Fallback Mode
- If API fails, uses built-in quotes
- No internet required
- Still contextual to sensor data

## 💰 Cost Estimate

**Default Settings (10 min interval):**
- 144 quotes per day
- ~$0.22 per day
- ~$6.50 per month

**Reduced Cost (30 min interval):**
- 48 quotes per day
- ~$0.07 per day
- ~$2.10 per month

## 🎨 Sample Quotes

Based on sensor conditions:
- **Good Air Quality**: "Breathe deep, live well!"
- **High Temperature**: "Stay cool, stay hydrated!"
- **Perfect Environment**: "Clear air, clear mind!"
- **Motion Detected**: "Keep moving forward!"
- **Low Light**: "Rest and recharge!"

## 📱 What You See Where

### ESP32 LCD (20x4 Display)
```
*** AI QUOTE ***
Breathe deep, live
well! Environment
is perfect today.
```

### Frontend Dashboard
- Purple gradient card
- Large quote text
- Environmental context
- Timestamp
- Refresh button

### Backend Logs
```
Generated quote: Breathe deep, live well!
Sent quote to MQTT topic auralink/quotes
```

## 🚦 Status Indicators

### Backend Running Successfully
```
✓ Started BackendApplication
✓ MQTT connected to broker.hivemq.com
✓ OpenAI service initialized successfully
✓ Generated quote: [quote text]
```

### ESP32 Running Successfully
```
✓ WiFi connected
✓ IP address: 192.168.x.x
✓ MQTT connected
✓ Subscribed to email and quote topics
✓ AI Quote received: [quote text]
```

## 📚 Next Steps

1. **Adjust Timing**: Modify `openai.quote.generation.interval`
2. **Monitor Costs**: Check OpenAI dashboard regularly
3. **Customize**: Edit prompts in `QuoteService.java`
4. **Expand**: Add more fallback quotes
5. **Share**: Show quotes to friends!

## 🆘 Need Help?

1. Check `AI_QUOTE_GENERATION.md` for detailed docs
2. Review backend logs: `backend/logs/`
3. Check ESP32 serial monitor
4. Test API endpoints with curl/Postman

## 🎉 Success!

If you see quotes on LCD and frontend, you're all set! The system will now automatically generate contextual, AI-powered quotes based on your environmental conditions.

Enjoy your smart, motivational IoT system! 🌟

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Cost**: ~$0.01 per quote
