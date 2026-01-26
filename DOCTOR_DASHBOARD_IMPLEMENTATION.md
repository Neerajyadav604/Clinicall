# Doctor Dashboard Frontend - Complete Implementation Guide

## Overview

This document covers the complete frontend implementation for the doctor dashboard and profile management system in the ClinicAll MERN medical appointment application.

## Architecture & Components

### Created Files & Structure

```
frontend/src/
├── services/
│   └── doctorApi.js                 # API service functions for doctor operations
├── components/
│   ├── DoctorLayout.jsx             # Main layout with sidebar navigation
│   └── ProtectedRoute.jsx           # Route protection component for doctor-only access
├── pages/
│   └── doctor/
│       ├── DoctorDashboard.jsx      # Dashboard overview with stats
│       ├── DoctorProfile.jsx        # Full doctor profile display
│       └── DoctorAppointments.jsx   # Appointment management with approve/reject
└── routes/
    └── DoctorRoutes.jsx             # Doctor route configuration
```

## Routes & Navigation

### Doctor Routes (Protected)

All routes require JWT authentication with role = "doctor"

```
/doctor/dashboard      - Dashboard overview with appointment stats
/doctor/profile        - View complete doctor profile
/doctor/appointments   - Manage appointments (approve/reject)
```

### Route Protection

- All doctor routes are wrapped with `ProtectedRoute` component
- JWT token is decoded to verify user role
- Unauthorized users are redirected to login
- Invalid/missing tokens result in redirect to login page

## Components Overview

### 1. DoctorLayout Component

**File:** `frontend/src/components/DoctorLayout.jsx`

**Features:**
- Collapsible sidebar navigation
- Responsive design for mobile and desktop
- Top header with doctor name and notifications
- Logout functionality
- Active route highlighting

**Props:**
```javascript
<DoctorLayout>
  {/* Page content */}
</DoctorLayout>
```

**Key Features:**
- Logout clears token and user data from localStorage
- Fetches doctor name from localStorage user object
- Icons for all navigation items
- Color-coded status indicators

### 2. DoctorDashboard Component

**File:** `frontend/src/pages/doctor/DoctorDashboard.jsx`

**Displays:**
- Total appointment count
- Pending appointments count
- Approved appointments count
- Rejected appointments count
- Quick action items
- Account status with response rate

**Data Fetched:**
```javascript
const grouped = await getDoctorAppointmentsByStatus();
// Returns: { PENDING: [], APPROVED: [], REJECTED: [] }
```

**States:**
- Loading: Shows skeleton loader
- No appointments: Shows empty state
- With data: Shows 4 stat cards with metrics

### 3. DoctorProfile Component

**File:** `frontend/src/pages/doctor/DoctorProfile.jsx`

**Displays:**
- Profile photo / avatar
- Doctor name and specialization
- Contact information (email, phone)
- Professional details (experience, qualification)
- Clinic/hospital information
- License number
- Verification status
- Uploaded documents (if any)

**Data Fetched:**
```javascript
const response = await getDoctorProfile();
// Expects: { data: { fullName, email, specialization, ... } }
// Falls back to localStorage user data if API fails
```

**Error Handling:**
- Falls back to localStorage user data if API fails
- Shows user-friendly error messages
- Displays verification status badge

### 4. DoctorAppointments Component

**File:** `frontend/src/pages/doctor/DoctorAppointments.jsx`

**Features:**
- List of all doctor's appointments
- Filter by status: All, Pending, Approved, Rejected
- Card-based layout (2 columns on desktop, 1 on mobile)
- Real-time update after approval/rejection

**Appointment Actions:**
- **Approve:** Calls `PATCH /api/appointments/:id/approve`
- **Reject:** Opens modal for rejection reason

**Card Elements:**
- Appointment date and status badge
- Time of appointment
- Reason for visit
- Payment status indicator
- Action buttons (for pending appointments only)

**Data Fetched:**
```javascript
const response = await getDoctorAppointments();
// Expected format: { data: [{ _id, approvalstatus, ... }] }
```

**States:**
- Loading: Shows skeleton cards
- Empty: Shows "No appointments" message
- With data: Shows appointment cards with actions

### 5. ProtectedRoute Component

**File:** `frontend/src/components/ProtectedRoute.jsx`

**Features:**
- Checks for JWT token in localStorage
- Decodes token and verifies user role
- Redirects unauthorized users to login
- Redirects non-doctors to home page

**Usage:**
```javascript
<ProtectedRoute requiredRole="doctor">
  <YourComponent />
</ProtectedRoute>
```

**Role Checking:**
- Case-insensitive comparison
- Default required role: "doctor"
- Customizable via `requiredRole` prop

### 6. DoctorRoutes Component

**File:** `frontend/src/routes/DoctorRoutes.jsx`

**Routes:**
```javascript
/dashboard   -> DoctorDashboard (Protected)
/profile     -> DoctorProfile (Protected)
/appointments -> DoctorAppointments (Protected)
*            -> Redirect to /doctor/dashboard
```

## API Service (doctorApi.js)

**File:** `frontend/src/services/doctorApi.js`

### Authentication

All API calls use JWT token from localStorage:
```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
```

### API Functions

#### Doctor Profile
```javascript
// Get current logged-in doctor's profile
getDoctorProfile()
// Returns: { data: { fullName, email, specialization, ... } }

// Get doctor profile by ID
getDoctorById(doctorId)
// Returns: { data: { ... } }
```

#### Appointments
```javascript
// Get all doctor's appointments (optionally filtered by status)
getDoctorAppointments(status = null)
// status: "PENDING" | "APPROVED" | "REJECTED" | null (all)
// Returns: { data: [{ _id, approvalstatus, appointmentDate, ... }] }

// Approve an appointment
approveAppointment(appointmentId)
// Returns: { success: true, data: { ... } }

// Reject an appointment
rejectAppointment(appointmentId, reason = "")
// Returns: { success: true, data: { ... } }

// Get dashboard statistics
getDoctorDashboardStats()
// Returns: { pending, approved, rejected, total }

// Get appointments grouped by status
getDoctorAppointmentsByStatus()
// Returns: { PENDING: [...], APPROVED: [...], REJECTED: [...] }
```

#### Utility Functions
```javascript
// Decode JWT to get user info
decodeToken()
// Returns: { id, email, role, iat, exp }

// Get user role from JWT
getUserRole()
// Returns: "doctor" | "user" | "admin" | null

// Get user ID from JWT
getUserId()
// Returns: user._id | null
```

## Backend API Endpoints Used

### Required Endpoints (Must Exist)

```
GET  /api/v1/profile/me                      - Get current user profile
GET  /api/v1/appointments/doctor             - Get doctor's appointments
GET  /api/v1/appointments/doctor/stats       - Get appointment statistics
PATCH /api/v1/appointments/:id/approve       - Approve appointment
PATCH /api/v1/appointments/:id/reject        - Reject appointment
```

### Expected Response Format

**Get Appointments Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "appointment_id",
      "userId": "user_id",
      "doctorId": "doctor_id",
      "appointmentDate": "2024-01-20",
      "appointmentTime": "10:00",
      "reason": "General Checkup",
      "approvalstatus": "PENDING",
      "paymentStatus": "paid",
      "status": "SCHEDULED"
    }
  ]
}
```

**Approve/Reject Response:**
```json
{
  "success": true,
  "message": "Appointment approved/rejected successfully",
  "data": { ... }
}
```

## State Management

### Component State Patterns

**Dashboard Loading Pattern:**
```javascript
const [loading, setLoading] = useState(true);
const [stats, setStats] = useState({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

useEffect(() => {
  const fetchStats = async () => {
    try {
      setLoading(true);
      const grouped = await getDoctorAppointmentsByStatus();
      setStats({
        total: /* calculate */,
        pending: grouped.PENDING?.length || 0,
        // ...
      });
    } catch (error) {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };
  fetchStats();
}, []);
```

**Appointments Filtering Pattern:**
```javascript
const [appointments, setAppointments] = useState([]);
const [filter, setFilter] = useState("all");

const filteredAppointments = appointments.filter((apt) => {
  if (filter === "all") return true;
  return apt.approvalstatus?.toUpperCase() === filter.toUpperCase();
});
```

### Local Storage Usage

```javascript
// Stored after successful login
localStorage.setItem("token", jwtToken);
localStorage.setItem("user", JSON.stringify({
  fullName: "Dr. Name",
  email: "doctor@example.com",
  role: "doctor",
  // ... other user fields
}));

// Cleared on logout
localStorage.removeItem("token");
localStorage.removeItem("user");
localStorage.removeItem("doctorProfile");
```

## Styling & Responsive Design

### Tailwind CSS Classes Used

**Layout:**
- `flex`, `grid`, `gap`, `space-y`
- `w-64`, `flex-1`, `overflow-auto`
- `px-8`, `py-4`, `p-6`

**Colors:**
- Blue theme: `bg-blue-600`, `text-blue-600`
- Status colors: Green (approved), Yellow (pending), Red (rejected)
- Hover states: `hover:bg-gray-100`, `hover:shadow-lg`

**Responsive:**
- Mobile: `grid-cols-1`
- Desktop: `md:grid-cols-2`, `lg:grid-cols-4`
- Hidden on mobile: `hidden md:flex`

### Mobile-First Approach

All components are mobile-responsive:
- Single column on mobile
- Multi-column on tablets/desktop
- Collapsible sidebar
- Touch-friendly buttons (min 44x44px)

## Error Handling & Loading States

### Error Handling Pattern

```javascript
try {
  const data = await apiFunction();
  setData(data);
} catch (error) {
  console.error("Error:", error);
  toast.error(error.message || "An error occurred");
  // Set fallback data or show error state
} finally {
  setLoading(false);
}
```

### Loading States

- **Skeleton Loading:** Gray placeholder boxes
- **Spinner:** SVG spinner during actions
- **Empty State:** Icon + message when no data
- **Error State:** Red banner with error message

## Toast Notifications

Uses react-toastify for user feedback:

```javascript
toast.success("Appointment approved successfully");
toast.error("Failed to load appointments");
toast.info("Loading...");
```

## Security Considerations

### Token Management
- JWT stored in localStorage (not httpOnly cookie)
- Token included in Authorization header for API calls
- Token validated on every protected route
- Invalid tokens trigger logout and redirect to login

### Role-Based Access
- Routes protected by role verification
- Role decoded from JWT payload
- Unauthorized access redirects to home page
- Doctor-only endpoints require doctor role

### Input Validation
- Rejection reason has max length (handled by textarea)
- All API payloads validated by backend
- No client-side SQL/NoSQL injection risk

## Performance Optimization

### Optimizations Implemented

1. **Conditional Rendering:**
   - Skip unnecessary renders with filter logic
   - Loading skeletons instead of blank screens

2. **API Calls:**
   - Single fetch on component mount
   - Grouped appointments fetch for dashboard
   - Status filter on client-side (not API)

3. **Re-renders:**
   - useState for local state
   - useEffect with empty dependency array for initial fetch
   - Memoization possible for static components

## Testing Recommendations

### Manual Testing Checklist

```
[ ] Login as doctor
[ ] Navigate to /doctor/dashboard - loads and displays stats
[ ] Navigate to /doctor/profile - displays profile data
[ ] Navigate to /doctor/appointments - lists appointments
[ ] Filter appointments by status
[ ] Click Approve button - updates appointment status
[ ] Click Reject button - opens modal and rejects
[ ] Logout - clears data and redirects to login
[ ] Directly access /doctor/dashboard without token - redirects to login
[ ] Login as non-doctor user - cannot access doctor routes
```

### Network Testing

```
[ ] Network throttling: Test slow connections
[ ] Offline: Show error states gracefully
[ ] API errors: Handle 500 errors with user message
[ ] Missing endpoints: Graceful fallback to cached data
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full responsive support

## Future Enhancement Possibilities

1. **Edit Profile:** Add edit mode for doctor profile
2. **Schedule Management:** Set availability/schedule
3. **Patient History:** View past consultations
4. **Ratings & Reviews:** Display patient ratings
5. **Notifications:** Real-time appointment notifications
6. **Analytics:** Charts showing appointment trends
7. **Messaging:** Direct messaging with patients
8. **Documents:** Upload/manage certificates and documents

## Troubleshooting

### Issue: Routes not loading

**Solution:**
- Ensure DoctorRoutes is imported in App.js
- Check route path matches exactly: `/doctor/*`
- Verify token exists in localStorage

### Issue: Appointments not displaying

**Solution:**
- Check backend API endpoint: `/api/v1/appointments/doctor`
- Verify backend returns data in correct format
- Check network tab for API response
- Ensure JWT token is valid

### Issue: Approval/Rejection not working

**Solution:**
- Verify backend endpoints exist:
  - `/api/v1/appointments/:id/approve`
  - `/api/v1/appointments/:id/reject`
- Check PATCH method is being used (not PUT)
- Verify appointment ID is being passed correctly
- Check token permissions on backend

### Issue: Profile not loading

**Solution:**
- Check `/api/v1/profile/me` endpoint exists
- Verify response has `data` property
- Clear localStorage and re-login
- Check console for API errors

## Environment Variables

Required in `.env.local`:

```
REACT_APP_BASE_URL=http://localhost:4000/api/v1
```

## Summary

This implementation provides a complete, production-ready doctor dashboard with:

✅ Role-based route protection
✅ Appointment management (approve/reject)
✅ Doctor profile display
✅ Dashboard with key metrics
✅ Responsive design
✅ Error handling & loading states
✅ Toast notifications
✅ Clean, maintainable code structure
✅ Comprehensive documentation

All components follow React best practices and integrate seamlessly with the existing ClinicAll backend.
