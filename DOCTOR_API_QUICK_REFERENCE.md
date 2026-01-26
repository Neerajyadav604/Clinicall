# Doctor Frontend - API Integration Quick Reference

## Quick Start

### Import Services
```javascript
import {
  getDoctorProfile,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  getDoctorAppointmentsByStatus,
  decodeToken,
  getUserRole,
  getUserId,
} from "../services/doctorApi";
```

### Check User Role
```javascript
import { decodeToken } from "../services/doctorApi";

const decoded = decodeToken();
console.log(decoded.role); // "doctor" | "user" | "admin"
```

---

## API Functions Reference

### 1. Get Doctor Profile

**Function:**
```javascript
const response = await getDoctorProfile();
```

**Usage:**
```javascript
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await getDoctorProfile();
      const doctorData = response.data || response.user;
      setProfile(doctorData);
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };
  fetchProfile();
}, []);
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "doctor_id",
    "fullName": "Dr. John Doe",
    "email": "john@example.com",
    "contact": "9876543210",
    "specialization": "Cardiology",
    "experience": 10,
    "licenseNumber": "MC123456",
    "qualification": "MBBS, MD",
    "hospitalName": "City Hospital",
    "image": "profile_image_url",
    "verificationStatus": "APPROVED"
  }
}
```

---

### 2. Get All Appointments

**Function:**
```javascript
const response = await getDoctorAppointments();
```

**Usage:**
```javascript
useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const response = await getDoctorAppointments();
      setAppointments(response.data || response || []);
    } catch (error) {
      toast.error("Failed to load appointments");
    }
  };
  fetchAppointments();
}, []);
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "apt_1",
      "userId": "user_id",
      "doctorId": "doctor_id",
      "appointmentDate": "2024-02-01",
      "appointmentTime": "10:00 AM",
      "reason": "General Checkup",
      "approvalstatus": "PENDING",
      "paymentStatus": "paid",
      "status": "SCHEDULED",
      "createdAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

---

### 3. Get Appointments By Status

**Function:**
```javascript
const grouped = await getDoctorAppointmentsByStatus();
// grouped.PENDING, grouped.APPROVED, grouped.REJECTED
```

**Usage:**
```javascript
const fetchGroupedAppointments = async () => {
  try {
    const grouped = await getDoctorAppointmentsByStatus();
    
    setStats({
      total: (grouped.PENDING?.length || 0) + 
             (grouped.APPROVED?.length || 0) + 
             (grouped.REJECTED?.length || 0),
      pending: grouped.PENDING?.length || 0,
      approved: grouped.APPROVED?.length || 0,
      rejected: grouped.REJECTED?.length || 0,
    });
  } catch (error) {
    toast.error("Failed to load statistics");
  }
};
```

**Expected Response:**
```javascript
{
  PENDING: [{ _id, appointmentDate, ... }],
  APPROVED: [{ _id, appointmentDate, ... }],
  REJECTED: [{ _id, appointmentDate, ... }],
}
```

---

### 4. Approve Appointment

**Function:**
```javascript
await approveAppointment(appointmentId);
```

**Usage:**
```javascript
const handleApprove = async (appointmentId) => {
  try {
    setLoading(true);
    await approveAppointment(appointmentId);
    toast.success("Appointment approved!");
    
    // Update UI
    setAppointments(prev =>
      prev.map(apt =>
        apt._id === appointmentId
          ? { ...apt, approvalstatus: "APPROVED" }
          : apt
      )
    );
  } catch (error) {
    toast.error(error.message || "Failed to approve");
  } finally {
    setLoading(false);
  }
};
```

**Backend Call:**
```
PATCH /api/v1/appointments/{appointmentId}/approve
Headers: Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Appointment approved successfully",
  "data": { ... }
}
```

---

### 5. Reject Appointment

**Function:**
```javascript
await rejectAppointment(appointmentId, reason);
```

**Parameters:**
- `appointmentId` (required): String - ID of appointment
- `reason` (optional): String - Rejection reason

**Usage:**
```javascript
const handleReject = async (appointmentId, reason) => {
  try {
    setLoading(true);
    await rejectAppointment(appointmentId, reason);
    toast.success("Appointment rejected!");
    
    // Update UI
    setAppointments(prev =>
      prev.map(apt =>
        apt._id === appointmentId
          ? { ...apt, approvalstatus: "REJECTED" }
          : apt
      )
    );
  } catch (error) {
    toast.error(error.message || "Failed to reject");
  } finally {
    setLoading(false);
  }
};
```

**Backend Call:**
```
PATCH /api/v1/appointments/{appointmentId}/reject
Headers: Authorization: Bearer {token}
Body: { "cancellationReason": "Already booked" }
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Appointment rejected successfully",
  "data": { ... }
}
```

---

### 6. Get User Role

**Function:**
```javascript
const role = getUserRole();
// Returns: "doctor" | "user" | "admin" | null
```

**Usage:**
```javascript
if (getUserRole() !== "doctor") {
  return <Navigate to="/" />;
}
```

---

### 7. Get User ID

**Function:**
```javascript
const userId = getUserId();
// Returns: user._id | null
```

**Usage:**
```javascript
const userId = getUserId();
// Fetch user-specific data
```

---

### 8. Decode Token

**Function:**
```javascript
const decoded = decodeToken();
// Returns: { id, email, role, iat, exp }
```

**Usage:**
```javascript
const decoded = decodeToken();
if (!decoded || decoded.role !== "doctor") {
  logout();
  navigate("/login");
}
```

---

## Common Patterns

### Pattern 1: Fetch and Display List

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments();
      setData(response.data || []);
    } catch (error) {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);

if (loading) return <LoadingSpinner />;
if (!data.length) return <EmptyState />;
return <List items={data} />;
```

### Pattern 2: Action with Modal

```javascript
const [modal, setModal] = useState({ open: false, id: null, reason: "" });
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    await rejectAppointment(modal.id, modal.reason);
    toast.success("Done!");
    setModal({ open: false, id: null, reason: "" });
    // Refresh list
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Pattern 3: Optimistic Update

```javascript
const handleApprove = async (appointmentId) => {
  // Optimistic update
  setAppointments(prev =>
    prev.map(apt =>
      apt._id === appointmentId
        ? { ...apt, approvalstatus: "APPROVED" }
        : apt
    )
  );

  try {
    await approveAppointment(appointmentId);
    toast.success("Approved!");
  } catch (error) {
    // Revert on error
    toast.error("Failed!");
    fetchAppointments(); // Fetch fresh data
  }
};
```

### Pattern 4: Filter on Client

```javascript
const [filter, setFilter] = useState("all");

const filtered = appointments.filter(apt => {
  if (filter === "all") return true;
  return apt.approvalstatus?.toUpperCase() === filter.toUpperCase();
});

return (
  <>
    <FilterButtons onChange={setFilter} />
    <List items={filtered} />
  </>
);
```

---

## Error Handling

### Expected Error Responses

```javascript
// 401 Unauthorized (invalid/expired token)
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}

// 403 Forbidden (not a doctor)
{
  "success": false,
  "message": "Access denied. Doctor role required."
}

// 404 Not Found
{
  "success": false,
  "message": "Appointment not found"
}

// 500 Server Error
{
  "success": false,
  "message": "Internal server error"
}
```

### Handle Errors Gracefully

```javascript
const handleAction = async () => {
  try {
    // action
  } catch (error) {
    // Display user-friendly message
    const message = error.message || "An error occurred";
    toast.error(message);
    
    // If unauthorized, logout
    if (error.message.includes("401") || error.message.includes("Invalid token")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }
};
```

---

## Headers & Authentication

### Default Headers Used

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token_from_localStorage}"
}
```

### Token Management

```javascript
// Get token
const token = localStorage.getItem("token");

// Set token (after login)
localStorage.setItem("token", response.token);

// Clear token (on logout)
localStorage.removeItem("token");
```

---

## Debugging Tips

### Check API Response

```javascript
const response = await getDoctorAppointments();
console.log("Full response:", response);
console.log("Data:", response.data);
console.log("Count:", response.data?.length || 0);
```

### Verify Token

```javascript
const token = localStorage.getItem("token");
console.log("Token exists:", !!token);

const decoded = decodeToken();
console.log("Decoded:", decoded);
console.log("Role:", decoded?.role);
console.log("Expires:", new Date(decoded?.exp * 1000));
```

### Monitor Network

```javascript
// Check in browser DevTools > Network tab
// Look for API calls to /api/v1/appointments/*
// Verify Authorization header is present
// Check response status (200, 401, 403, 500, etc.)
```

---

## Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data normally |
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission denied message |
| 404 | Not Found | Show not found message |
| 500 | Server Error | Retry or contact admin |

---

## Testing API Endpoints

### Using cURL

```bash
# Get appointments
curl -H "Authorization: Bearer {token}" \
  http://localhost:4000/api/v1/appointments/doctor

# Approve appointment
curl -X PATCH \
  -H "Authorization: Bearer {token}" \
  http://localhost:4000/api/v1/appointments/{id}/approve

# Reject appointment
curl -X PATCH \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason":"Cannot accommodate"}' \
  http://localhost:4000/api/v1/appointments/{id}/reject
```

### Using Postman

1. Set Authorization type to "Bearer Token"
2. Paste JWT token in token field
3. Add endpoints from list above
4. Test requests

---

## Summary

Use these functions to build the complete doctor dashboard:

- **Display Data:** `getDoctorProfile()`, `getDoctorAppointments()`
- **Process Actions:** `approveAppointment()`, `rejectAppointment()`
- **Get Statistics:** `getDoctorAppointmentsByStatus()`
- **Check Auth:** `getUserRole()`, `decodeToken()`

All functions handle errors and return structured responses automatically.
