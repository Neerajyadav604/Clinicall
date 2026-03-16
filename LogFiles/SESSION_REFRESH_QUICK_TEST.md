# Session Refresh Button - Quick Test Guide

## Problem Statement ✅

**Before**: Clicking "Stay Logged In" redirected to login (made button useless)  
**After**: Clicking "Stay Logged In" extends session and keeps user logged in

---

## Quick Test (5 minutes)

### Method 1: Fastest Test
```javascript
// In browser DevTools Console while logged in:

// Step 1: Check if refresh token exists
console.log("Cookies:", document.cookie);
// Should show: refreshToken=...

// Step 2: Manually call refresh
fetch('http://localhost:4000/api/v1/refresh', {
  method: 'POST',
  body: JSON.stringify({}),
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'  // ← Important: sends cookies
})
.then(r => r.json())
.then(data => {
  console.log("Refresh response:", data);
  // Should see: { success: true, accessToken: "..." }
  if (data.accessToken) {
    localStorage.setItem("token", data.accessToken);
    console.log("✅ Token refreshed!");
  }
});
```

### Method 2: Real Usage Test
1. Login to app
2. Leave tab open for 13 minutes (tokens expire at 15min)
3. When you see "Your session is about to expire" popup:
   - **Click "Stay Logged In"**
   - Should see: ✅ "Session extended successfully" toast
   - Should NOT see: Redirect to login
4. Wait another 13 minutes
   - Should see warning popup again (proves session extended)
   - If no warning = session was successfully extended

### Method 3: Monitoring Test
1. Open Network tab in DevTools
2. Login to app
3. Wait until "Your session is about to expire" appears
4. Click "Stay Logged In"
5. In Network tab, look for POST request to `/refresh`
   - Should show: 200 OK response
   - Response body: `{ success: true, accessToken: "..." }`
   - **Should NOT show**: 401 Unauthorized

---

## Expected Behavior

### When You Click "Stay Logged In"

✅ **Toast appears**: "Session extended successfully"  
✅ **No page redirect**  
✅ **Can see in Network tab**: POST /refresh returns 200  
✅ **Can see in Console**: No error messages  
✅ **Session timer resets**: Warning appears again in ~13 min  

### If Something's Wrong

❌ **Toast says "Session refresh failed"** → Refresh token invalid/expired  
❌ **Page redirects to /login** → Error wasn't caught properly  
❌ **Network shows 401 on /refresh** → Refresh token not sent or invalid  
❌ **Console shows error** → Check error code (NO_REFRESH_TOKEN, INVALID_TOKEN, etc)  

---

## Debug Checklist

- [ ] After login, check: `document.cookie` contains `refreshToken`
- [ ] Network tab shows: POST `/refresh` with response code 200
- [ ] Response contains: `{ success: true, accessToken: "..." }`
- [ ] Toast shows: "Session extended successfully"
- [ ] No redirect to login page
- [ ] Can access protected pages (Clinical Notes, Medical Records)
- [ ] Warning appears again ~13 minutes later

---

## Common Errors & Fixes

### "Refresh token required" Error
**Cause**: Cookie didn't get set at login  
**Fix**:
```javascript
// Check if refreshToken cookie exists:
console.log(document.cookie);

// If missing, try logging out and logging in again
```

### "Invalid refresh token" Error
**Cause**: Token signature doesn't match or token expired  
**Fix**:
```javascript
// Check if token is more than 7 days old (refresh tokens expire in 7d)
// Solution: Re-login to get new refresh token
```

### Page redirects to login
**Cause**: Error wasn't caught or didn't give 2-second delay  
**Fix**:
```javascript
// Check server logs for error messages
// If using npm run dev, you should see:
// ✅ Session refreshed for user: [id]
// OR an error code
```

### POST /refresh returns 401
**Cause**: Refresh token cookie not being sent  
**Fix**:
1. Check DevTools → Network → /refresh request  
2. Under "Cookies" tab, should show refreshToken  
3. If empty, `withCredentials: true` isn't working

---

## Server Logs to Check

Start backend with: `npm run dev`

### Successful Refresh
```
✅ Session refreshed for user: 507f1f77bcf8639b4b5d0f7b
```

### Missing Refresh Token
```
No refresh token provided in cookies or body
401 { code: 'NO_REFRESH_TOKEN' }
```

### Invalid/Expired Token
```
Refresh token failure: jwt expired
401 { code: 'INVALID_TOKEN' }
```

---

## Files That Were Fixed

1. **[authSession.js](../frontend/src/services/authSession.js)**
   - ✅ Better error handling  
   - ✅ 2-second delay before logout
   - ✅ Proper async button handler

2. **[ApiConnector.js](../frontend/src/services/ApiConnector.js)**
   - ✅ Added `withCredentials: true` (sends cookies)

3. **[Auth.js Controller](../server/Controllers/Auth.js)**
   - ✅ Better error logging
   - ✅ Specific error codes
   - ✅ User existence check

---

## Success Criteria ✅

The button is working correctly when:

- [ ] User logs in
- [ ] After ~13 minutes, sees "Your session is about to expire"
- [ ] Clicks "Stay Logged In"
- [ ] Sees "Session extended successfully" toast
- [ ] No redirect to login page
- [ ] Can continue using app (access Clinical Notes, Medical Records, etc)
- [ ] After another ~13 minutes, sees warning again

If **all boxes are checked** → Fix is successful! 🎉

---

**Last Updated**: March 15, 2026  
**Fix Status**: ✅ Complete  
**Testing Method**: Manual testing + Network inspection  
