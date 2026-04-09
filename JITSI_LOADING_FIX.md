# 🎥 Fix: "Connecting to Secure Call..." Infinite Loading

## ✅ What Was Fixed

**VideoCallModal.jsx** has been enhanced with:

1. **Jitsi iframe now VISIBLE during loading** - You can now see Jitsi's own error messages
2. **Better event listener timing** - Listeners attached immediately after instance creation
3. **Timeout detection** - Will log after 10 seconds if `videoConferenceJoined` never fires
4. **Enhanced error logging** - More detailed console logs for debugging
5. **SDK loading verification** - Better checks for Jitsi SDK availability

## 🔍 How to Diagnose the Issue

### **Step 1: Open Browser DevTools (F12)**
When attempting a video call, check the **Console tab** for logs starting with:
```
[🎥 VideoCallModal:Jitsi]
```

### **Step 2: Look for These Critical Logs**

**✅ GOOD FLOW:**
```
[🎥 VideoCallModal:Jitsi] INITIALIZING JITSI
[🎥 VideoCallModal:Jitsi] [1/6] DATA VALIDATION:
   - Domain: 8x8.vc                          ← Should be 8x8.vc
   - Room: clinicall_appt_<ID>_dr_<ID>      ← Should have identifiers
   - Token Length: 1200+                      ← Should have long JWT
   - Display Name: <UserName>

[🎥 VideoCallModal:Jitsi] [2/6] JITSI SDK CHECK:
   - ✅ JitsiMeetExternalAPI already loaded

[🎥 VideoCallModal:Jitsi] [5/6] JITSI INSTANCE CREATION:
   - ✅ Instance created successfully

[🎥 VideoCallModal:Jitsi] [6/6] EVENT LISTENER REGISTRATION:
   - ✅ All listeners attached

[🎥 VideoCallModal:Jitsi]   EVENT: videoConferenceJoined ✅
   - User successfully joined the call
```

**❌ PROBLEM FLOWS:**

### **ISSUE 1: Missing Token or Room**
```
[🎥 VideoCallModal:Jitsi] Missing data, skipping init
   - Has Token: NO    ← ❌ Problem here
   - Has Room: NO
```
**Diagnosis:** `fetchJitsiToken()` failed or didn't return data

**Fix:** Check server endpoint `/api/v1/consultation/video-token/:appointmentId`

---

### **ISSUE 2: Jitsi SDK Not Loading**
```
[🎥 VideoCallModal:Jitsi] [2/6] JITSI SDK CHECK:
   - ❌ JitsiMeetExternalAPI not in window
   - Creating new script...
   - ❌ Script load failed:
      Error: Failed to load Jitsi SDK from CDN
```
**Diagnosis:** CDN connection blocked or network issue

**Fix:**
1. Test if CDN is reachable: `curl -I https://8x8.vc/external_api.js`
2. Check for CORS/firewall issues
3. Try alternate CDN: Use Jitsi self-hosted instance

---

### **ISSUE 3: Jitsi Instance Creation Failed**
```
[🎥 VideoCallModal:Jitsi] [5/6] JITSI INSTANCE CREATION:
   - ❌ JitsiMeetExternalAPI not available on window

[🎥 VideoCallModal:Jitsi] ❌ JITSI INIT FAILED:
   - Error Type: TypeError
   - Message: Cannot read property 'JitsiMeetExternalAPI' of undefined
```
**Diagnosis:** SDK script loaded but JitsiMeetExternalAPI still not in window

**Fix:** Wait longer or check for async loading issues

---

### **ISSUE 4: videoConferenceJoined Never Fires (10s+ timeout)**
```
[🎥 VideoCallModal:Jitsi] ⏱️ TIMEOUT: videoConferenceJoined took >10 seconds
   - Possible issues:
     1. Invalid JWT token
     2. Room name not matching expected format
     3. Network connectivity issue
     4. Jitsi server blocked/unreachable
```
**Diagnosis:** Jitsi iframe loaded but user never fully joined

**Fix:** Check Jitsi iframe for error messages (now visible on screen)

---

## 🎯 What to Check When Hung on "Connecting..."

### **1. Browser Console (F12)**
- Look for [🎥 VideoCallModal:Jitsi] logs
- Check for any red ❌ errors
- Scroll and look for "errorOccurred" events

### **2. Check JWT Token in Network Tab**
1. Open DevTools → Network tab
2. Call `fetch("/api/v1/consultation/video-token/{appointmentId}")`
3. Check Response:
   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
     "fullRoom": "clinicall_appt_1234_dr_5678",
     "domain": "8x8.vc",
     "roomName": "clinicall_appt_1234"
   }
   ```

### **3. Check Server Logs**
Watch server console for:
```
[🎥 VideoCall Token] ⏱️ TOKEN ENDPOINT HIT
[🎥 VideoCall Token] [1/7] REQUEST DETAILS:
```

Look for errors like:
- ❌ Appointment not found
- ❌ ACCESS DENIED: User not a participant
- ❌ JAAS credentials missing

### **4. Check if Jitsi Server Responds**
In browser console:
```js
fetch('https://8x8.vc/external_api.js')
  .then(r => console.log('Status:', r.status, r.statusText))
  .catch(e => console.error('Error:', e))
```

---

## 🔧 Quick Fixes to Try

### **Fix 1: Clear Browser Cache**
- Hard refresh: `Ctrl+Shift+R` on Windows / `Cmd+Shift+R` on Mac
- This ensures new VideoCallModal code loads

### **Fix 2: Check JWT Secret**
Server needs `process.env.JAAS_PRIVATE_KEY` - verify in `.env`:
```
JAAS_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JAAS_KID=your-key-id
JAAS_APP_ID=your-app-id
```

**If missing:**
- Get from: https://jaas.8x8.vc/ (Jitsi JaaS console)
- Add to `.env`
- Restart server

### **Fix 3: Verify Appointment in Database**
```js
// Run in MongoDB
db.appointments.findOne({_id: "your-appointment-id"})

// Should show:
{
  userId: ObjectId("patient-id"),
  doctorId: ObjectId("doctor-object-id")  // NOT just a string
}
```

### **Fix 4: Check Room Name Format**
Server should generate room like:
```
clinicall_appt_{appointmentId}_dr_{doctorUserId}_pt_{patientId}
```

If room name has invalid characters, Jitsi won't accept it.

---

## 📋 Debug Checklist

- [ ] Browser console shows `[🎥 VideoCallModal:Jitsi] [1/6] DATA VALIDATION` ✅
- [ ] Token length > 1000 characters ✅
- [ ] Room name doesn't contain special chars ✅
- [ ] `videoConferenceJoined` fires within 5 seconds ✅
- [ ] Jitsi iframe visible on screen (not just spinner) ✅
- [ ] No red ❌ errors in console ✅
- [ ] Server logs show token generated successfully ✅
- [ ] User can see Jitsi interface (now that iframe is visible) ✅

---

## 🆘 If Still Not Working

1. **Paste entire console output** from `[🎥 VideoCallModal:Jitsi]` section
2. **Check server logs** for `[🎥 VideoCall Token]` section
3. **Verify Jitsi credentials** are correct in `.env`
4. **Test with hardcoded room** to isolate the problem:
   ```js
   // In VideoCallModal.jsx, replace:
   roomName: jitsiData.fullRoom,
   // With:
   roomName: "test-clinic-room-" + Date.now(),
   ```
   If this works, the issue is room name format.

---

## ✨ New Features in Updated Code

| Feature | Benefit |
|---------|---------|
| **Visible Jitsi iframe** | See Jitsi error messages instead of just spinner |
| **Event listener timing** | Catch `videoConferenceJoined` at right moment |
| **10s timeout detection** | Alerts you if Jitsi takes too long |
| **Enhanced logging** | 8 debug logs per step for clarity |
| **Better error messages** | Shows internet/permissions/server issues |

---

## 🚀 Testing Steps

### **Step 1: Start Fresh**
```bash
# Browser: Clear cache (Ctrl+Shift+R)
# Terminal 1: Kill server
# Terminal 2: npm start in frontend
# Check that new VideoCallModal code is loaded
```

### **Step 2: Open Chat**
- Both users open the chat page for appointment

### **Step 3: User A clicks "Start Call"**
- User B should see incoming call banner (with ringtone)

### **Step 4: User B clicks Accept**
- Browser console should show detailed logs
- If stuck on spinning: Check console for ❌ errors

### **Step 5: Check What's Blocked**
```js
// In browser console
window.debugVideoCall.checkRooms()      // Check socket rooms
window.debugVideoCall.logState()        // Check video call state
```

---

**Report any console logs (especially ❌ errors) and this issue will be resolved!**
