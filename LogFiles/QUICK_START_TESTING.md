# Quick Start: Testing the Fixed Server

## 1. Start the Server
```bash
cd c:\Users\DELL\OneDrive\Documents\Clinicall Backend\server
npm start
```

## 2. Watch for These Log messages
```
✅ [STARTUP] Environment loaded
✅ [STARTUP] Cloudinary connected
✅ [STARTUP] Attempting DB connection...
✅ [STARTUP] Standard routes loaded
✅ [STARTUP] Health check endpoint registered at /health
⏳ [STARTUP] Waiting for database connection before registering FHIR...

[After ~2-3 seconds if DB connects:]
✅ [STARTUP] Database connected successfully
🎉 [STARTUP] Database is ready - registering FHIR route now
✅ [STARTUP] FHIR route module loaded
✅ [SUCCESS] FHIR route registered at /api/v1/fhir/R4

[Finally:]
🚀========================================
✅✅✅  SERVER RUNNING ON PORT 4000  ✅✅✅
🚀========================================
```

## 3. Test the Health Endpoint
```bash
# In another terminal:
curl http://localhost:4000/health
```

**Before DB connects (should be 503):**
```json
{
  "status": "degraded",
  "timestamp": "2026-03-14T10:30:00.000Z",
  "database": "disconnected",
  "fhir": "waiting-for-db",
  "dbError": "Connection timeout"
}
```

**After DB connects (should be 200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-14T10:32:00.000Z",
  "database": "connected",
  "fhir": "ready"
}
```

## 4. Test FHIR Route
```bash
# Try a FHIR request (with authentication token):
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/fhir/R4/Patient/123

# If DB is down (before ready):
# Expected: 503 with OperationOutcome error

# If DB is up:
# Expected: 200 with Patient data (or 404 if patient doesn't exist)
```

## 5. Verify Error Handlers Work
The following are now caught and logged (won't crash server):
- ❌ Unhandled Promise rejections
- ❌ Unhandled exceptions (will gracefully shutdown)
- ❌ Node.js warnings
- ❌ FHIR module load failures

## Common Issues & Solutions

### "FHIR route not registered"
- Check `/health` endpoint is returning 503
- Verify database is actually connected
- Check logs for: `❌ [CRITICAL] Failed to load FHIR route module:`

### "Health endpoint returns 503 forever"
- Check database logs/connection string
- FHIR will auto-retry every 10 seconds
- Manual restart: Restart server after fixing database

### Unhandled Rejection appears in logs
- Server will continue running
- Check the `[ERROR] Unhandled Promise Rejection` log for details
- Fix the underlying promise in that code

### "Cannot set property query"
- Already fixed! (This was the xss-clean issue)
- The custom sanitization middleware now safely handles it

## To Disable Socket.IO Code
If you want to completely remove the Socket.IO commented code:
1. Find line ~360-555 (the large `/* ... */` block)
2. Delete the entire block
3. Server startup will be even cleaner

## What NOT to do

❌ Don't use `setTimeout` for route loading again  
❌ Don't comment out error handlers  
❌ Don't register routes before DB check  
❌ Don't ignore console errors - they're important!  

## Success Indicators

✅ Server starts without crashing  
✅ `/health` reports correct status  
✅ FHIR route loads after DB connects  
✅ Error logs show actual errors (not silent failures)  
✅ No unhandled rejection messages  
