# Doctor Dashboard - Quick Start Guide (5 Minutes)

## ⚡ Start Here!

This guide gets you up and running in 5 minutes.

---

## 1️⃣ Prerequisites Check (1 min)

```bash
# Check Node.js installed
node -v

# Check npm installed  
npm -v

# Must be running React 18+, React Router 6+
```

---

## 2️⃣ Verify Files Created (1 min)

Confirm these files exist:

```
✅ frontend/src/services/doctorApi.js
✅ frontend/src/components/DoctorLayout.jsx
✅ frontend/src/components/ProtectedRoute.jsx
✅ frontend/src/pages/doctor/DoctorDashboard.jsx
✅ frontend/src/pages/doctor/DoctorProfile.jsx
✅ frontend/src/pages/doctor/DoctorAppointments.jsx
✅ frontend/src/routes/DoctorRoutes.jsx
```

---

## 3️⃣ Update Environment (1 min)

Make sure `.env.local` has:

```
REACT_APP_BASE_URL=http://localhost:4000/api/v1
```

---

## 4️⃣ Install Dependencies (1 min)

```bash
cd frontend
npm install react-toastify
```

(If already installed, skip this)

---

## 5️⃣ Start Development Server (1 min)

```bash
npm start
```

Open http://localhost:3000 in browser.

---

## 🧪 Test Immediately

### Test 1: Login as Doctor
1. Go to `/login`
2. Use doctor email/password
3. Should redirect to `/` or home

### Test 2: Access Dashboard
1. Go to `/doctor/dashboard`
2. Should see stats cards
3. Check console for errors

### Test 3: Check Token
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Find "token" key
4. Copy value (should start with `eyJ...`)

### Test 4: API Working
1. Go to Network tab
2. Perform action (click approve)
3. Should see API call to `/appointments/*/approve`
4. Check response in DevTools

---

## ⚠️ Common Issues - Quick Fixes

### Issue: Routes not found (404)
```javascript
// Check App.js has this:
import DoctorRoutes from './routes/DoctorRoutes';

// And in Routes:
<Route path="/doctor/*" element={<DoctorRoutes/>} />
```

### Issue: Token not working
```javascript
// In browser console:
localStorage.getItem("token")
// Should show JWT token starting with "eyJ..."
```

### Issue: API endpoints not found
```bash
# Test backend is running:
curl http://localhost:4000/api/v1/profile/me

# Should return 401 (needs token) not 404
```

### Issue: React errors
```bash
# Clear cache and reinstall:
rm -rf node_modules
npm install
npm start
```

---

## 📊 What You Get

### 3 Pages
- **Dashboard:** Appointment statistics
- **Profile:** Doctor information
- **Appointments:** Manage requests

### 7 Components
- DoctorLayout (main)
- ProtectedRoute (security)
- DoctorDashboard (page)
- DoctorProfile (page)
- DoctorAppointments (page)
- DoctorRoutes (routing)
- doctorApi.js (API)

### Features
✅ Login protection  
✅ Approve appointments  
✅ Reject appointments  
✅ View statistics  
✅ Mobile responsive  
✅ Error handling  
✅ Loading states  

---

## 🎯 Routes

```
/doctor/dashboard   → Statistics & overview
/doctor/profile     → Doctor information
/doctor/appointments → Appointment management
```

All protected - requires doctor login!

---

## 🔄 API Endpoints Used

```
GET  /api/v1/profile/me                       Get doctor profile
GET  /api/v1/appointments/doctor              Get appointments
PATCH /api/v1/appointments/:id/approve        Approve
PATCH /api/v1/appointments/:id/reject         Reject
```

---

## 💡 Tips

### To Debug
```javascript
// In component:
console.log("Data:", data);

// In doctorApi.js:
console.log("Response:", response);
```

### To Test API
```bash
# Get token first from login response
TOKEN="eyJ..." 

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/profile/me
```

### To Clear Cache
```bash
# Browser DevTools → Application → Clear All
```

---

## 📱 Responsive Test

- Resize browser window (mobile size)
- Sidebar should collapse on mobile
- All content should be readable
- No horizontal scroll

---

## ✅ Success Checklist

- [ ] Files exist in correct locations
- [ ] `npm start` works without errors
- [ ] Can see `/doctor/dashboard` loading
- [ ] Can see appointment list
- [ ] Can approve/reject appointments
- [ ] Token stored in localStorage
- [ ] API calls show in Network tab
- [ ] No console errors

---

## 🚀 Next Steps

1. **Verify Backend:** 
   - Ensure API endpoints exist
   - Test with curl commands

2. **Test Features:**
   - Login as different roles
   - Try approve/reject
   - Check filters work

3. **Test Mobile:**
   - Use DevTools responsive mode
   - Test on actual phone

4. **Deploy:**
   - Build: `npm run build`
   - Deploy build/ folder

---

## 📚 Full Guides

For detailed info, see:
- **DOCTOR_DASHBOARD_IMPLEMENTATION.md** - Complete guide
- **DOCTOR_API_QUICK_REFERENCE.md** - API reference
- **DOCTOR_SETUP_GUIDE.md** - Setup guide
- **BACKEND_API_REQUIREMENTS.md** - API specs

---

## 🆘 Still Having Issues?

### Check 1: Backend Running
```bash
curl http://localhost:4000/api/v1/health
```

### Check 2: Token Valid
```javascript
// In console:
const token = localStorage.getItem("token");
console.log(token); // Should show JWT
```

### Check 3: API Endpoint Exists
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/v1/appointments/doctor
```

### Check 4: Firewall/CORS
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Check backend has CORS enabled

---

## 🎓 Code Examples

### Login & Token
```javascript
// After login, token stored:
localStorage.setItem("token", response.token);

// Used in API calls automatically:
// Authorization: Bearer {token}
```

### Use API Functions
```javascript
import { getDoctorAppointments } from "../services/doctorApi";

const data = await getDoctorAppointments();
console.log(data.data); // Array of appointments
```

### Protect Routes
```javascript
<ProtectedRoute requiredRole="doctor">
  <DoctorDashboard />
</ProtectedRoute>
```

---

## ⏱️ Timing

- Setup: 2-3 minutes
- First test: 1 minute
- Full feature test: 10 minutes
- Troubleshooting: Varies

**Total: 15-20 minutes to full functionality**

---

## 📞 Help

**All issues and solutions are in:**
- DOCTOR_SETUP_GUIDE.md → Troubleshooting section
- DOCTOR_DASHBOARD_IMPLEMENTATION.md → Full details

---

## 🎉 You're Ready!

Start with:
```bash
npm start
```

Navigate to:
```
http://localhost:3000/login
```

Login and enjoy your doctor dashboard! 🚀

---

**Need detailed help?** → Read `DOCTOR_SETUP_GUIDE.md`  
**API reference?** → Read `DOCTOR_API_QUICK_REFERENCE.md`  
**Full guide?** → Read `DOCTOR_DASHBOARD_IMPLEMENTATION.md`  

✅ **Happy coding!**
