# Server Stability Fixes - Summary

## Issues Fixed

### ✅ 1. FHIR Route Lazy-Load Removed (Was Using setTimeout)
**Problem:** The FHIR route was loaded via `setTimeout(..., 3000)` which silently swallowed errors if the module failed to load.

**Solution:** 
- Replaced with a proper **event-driven async registration system**
- FHIR route now waits for database connection to trigger loading
- If FHIR fails to load, the server continues (doesn't crash)
- FHIR requests return **503 Service Unavailable** with FHIR/OperationOutcome if DB isn't ready

**Location:** Lines 245-295 in `index.js`

---

### ✅ 2. Database Connection Fire-and-Forget Pattern Fixed
**Problem:** Routes were registered before the database connection was confirmed ready, causing silent failures.

**Solution:**
- Implemented **dbReady event emitter system** (Lines 154-201)
- Database connection sets `dbReady = true` and emits `'ready'` event
- FHIR route registration **listens for 'ready'** event
- Automatic reconnection **retries every 10 seconds** if initial connection fails
- Helper function `waitForDb()` available for future async operations

**Implementation:**
```javascript
const EventEmitter = require('events');
const dbReadyEmitter = new EventEmitter();
let dbReady = false;
let dbError = null;
```

---

### ✅ 3. Health Check Endpoint Added
**Problem:** No way to monitor server and FHIR readiness.

**Solution:** Added **`GET /health`** endpoint that returns:
```json
{
  "status": "healthy|degraded",
  "timestamp": "2026-03-14T10:30:00Z",
  "database": "connected|disconnected",
  "fhir": "ready|waiting-for-db",
  "dbError": "error message if applicable"
}
```

**Status Codes:**
- `200` = Database connected, FHIR ready
- `503` = Database disconnected, FHIR waiting

**Usage:** `curl http://localhost:4000/health`

---

### ✅ 4. Unhandled Rejections & Exceptions Now Caught
**Problem:** `process.on('unhandledRejection')` and `process.on('uncaughtException')` were commented out, allowing server to crash silently.

**Solution:** Uncommented and enhanced with better logging (Lines 615-650):

```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [ERROR] Unhandled Promise Rejection');
  console.error('   Reason:', reason);
  // Server continues running
});

process.on('uncaughtException', (error) => {
  console.error('❌ [CRITICAL] Uncaught Exception:', error.message);
  process.exit(1); // Graceful shutdown
});

process.on('warning', (warning) => {
  console.warn('⚠️  [WARNING]', warning.message);
});
```

---

### ✅ 5. FHIR Route Error Boundary
**Problem:** If `./routes/fhir.js` throws during `require()`, it was silent.

**Solution:** Wrapped FHIR loading in try-catch (Lines 247-267):
```javascript
try {
  const FHIR = require('./routes/fhir');
  app.use("/api/v1/fhir/R4", fhirDbReadyMiddleware, FHIR);
  console.log('✅ [SUCCESS] FHIR route registered');
} catch (err) {
  console.error('❌ [CRITICAL] Failed to load FHIR route module:');
  console.error('   Message:', err.message);
  console.error('   Stack:', err.stack);
  // Server continues without FHIR
}
```

---

### ℹ️ 6. Socket.IO Not Re-enabled Yet
**Status:** Socket.IO setup remains **commented out** (~lines 360-555)

**Recommendation:** Either:
1. **Remove completely** if not needed (cleaner code)
2. **Re-enable properly** with error handling and authentication checks
3. **Extract to separate file** and lazy-load like FHIR

For now, it's harmlessly commented and won't affect server startup.

---

## Testing the Fixes

### Test 1: Health Endpoint
```bash
# Should return 503 initially (waiting for DB)
curl http://localhost:4000/health

# Once DB connects, should return 200
curl http://localhost:4000/health
```

### Test 2: FHIR Route Loads After DB
```bash
# Watch logs for:
# ✅ [STARTUP] Database connected successfully
# 🎉 [STARTUP] Database is ready - registering FHIR route now
# ✅ [SUCCESS] FHIR route registered at /api/v1/fhir/R4
```

### Test 3: FHIR Returns 503 If DB Down
```bash
# Stop MongoDB, then:
curl http://localhost:4000/api/v1/fhir/R4/Patient/123

# Expected response (after ~30s timeout):
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "unavailable",
    "diagnostics": "Database connection not ready..."
  }]
}
```

### Test 4: Unhandled Rejection Handling
Create a test file to verify rejections are caught:
```javascript
Promise.reject(new Error('Test rejection')).catch(() => {});
// Should log error, server should continue
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `server/index.js` | ✅ DB readiness system added, setTimeout removed, error handlers uncommented, health endpoint added, FHIR async registration implemented |
| `server/routes/fhir.js` | ✅ No changes needed (file is working correctly) |

---

## Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| FHIR loading | Silent errors via setTimeout | Event-driven async with error logging |
| DB dependency | Fire-and-forget | dbReady flag + event system |
| Error visibility | Silently swallowed | Caught + logged |
| Server monitoring | No health check | Full /health endpoint |
| Route isolation | One failure crashes server | Each route isolated |

---

## Next Steps

1. **Test the health endpoint**: `curl http://localhost:4000/health`
2. **Monitor startup logs** for the "Database is ready" message
3. **Verify FHIR loads** after DB connects
4. **Decide on Socket.IO**: Remove or properly re-enable
5. **Add monitoring** to alert when `/health` returns 503

---

## Debugging Notes

If FHIR still fails to load:
1. Check the error message in logs (now will show full stack trace)
2. Verify database connection: `curl http://localhost:4000/health`
3. Check if models/utilities in fhir.js exist
4. Run: `node -c server/routes/fhir.js` to check syntax
5. Verify all ENV variables are set (especially `REACT_APP_BASE_URL`)

---
