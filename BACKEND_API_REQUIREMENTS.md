# Backend API Requirements - Doctor Dashboard Integration

## ✅ Required Backend Endpoints

This document lists all backend endpoints needed for the doctor dashboard frontend to function correctly.

---

## 1. Profile Endpoint

### GET /api/v1/profile/me

**Purpose:** Get current logged-in doctor's profile information

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "doctor_id_123",
    "fullName": "Dr. John Smith",
    "email": "john.smith@hospital.com",
    "contact": "9876543210",
    "specialization": "Cardiology",
    "experienceYears": 10,
    "qualification": "MBBS, MD Cardiology",
    "licenseNumber": "MC-2024-001",
    "hospitalName": "City Heart Hospital",
    "address": "123 Medical Plaza, Downtown",
    "image": "https://cloudinary.com/...",
    "verificationStatus": "APPROVED",
    "documents": [
      "https://cloudinary.com/doc1.pdf",
      "https://cloudinary.com/doc2.pdf"
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-28T00:00:00Z"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}

// 404 Not Found
{
  "success": false,
  "message": "Doctor profile not found"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid token
- 404: Doctor not found
- 500: Server error

---

## 2. Get Doctor's Appointments

### GET /api/v1/appointments/doctor

**Purpose:** Get all appointments for the logged-in doctor

**Authentication:** Required (Bearer token)

**Query Parameters:**
```
status (optional): PENDING | APPROVED | REJECTED
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Example Request:**
```
GET /api/v1/appointments/doctor
GET /api/v1/appointments/doctor?status=PENDING
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "apt_001",
      "userId": "user_123",
      "doctorId": "doctor_456",
      "appointmentDate": "2024-02-10",
      "appointmentTime": "10:00 AM",
      "reason": "General Checkup",
      "approvalstatus": "PENDING",
      "paymentStatus": "paid",
      "status": "SCHEDULED",
      "createdAt": "2024-01-28T10:00:00Z",
      "updatedAt": "2024-01-28T10:00:00Z"
    },
    {
      "_id": "apt_002",
      "userId": "user_789",
      "doctorId": "doctor_456",
      "appointmentDate": "2024-02-15",
      "appointmentTime": "2:00 PM",
      "reason": "Follow-up Consultation",
      "approvalstatus": "APPROVED",
      "paymentStatus": "paid",
      "status": "SCHEDULED",
      "createdAt": "2024-01-25T12:00:00Z",
      "updatedAt": "2024-01-27T15:30:00Z"
    }
  ],
  "count": 2
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}

// 403 Forbidden (Not a doctor)
{
  "success": false,
  "message": "Access denied. Doctor role required."
}
```

**Status Codes:**
- 200: Success
- 401: Invalid token
- 403: Access denied
- 500: Server error

---

## 3. Get Appointment Statistics

### GET /api/v1/appointments/doctor/stats

**Purpose:** Get appointment counts by status for dashboard

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "pending": 3,
    "approved": 10,
    "rejected": 2
  }
}
```

**Alternative Response Format:**
```json
{
  "success": true,
  "stats": {
    "PENDING": 3,
    "APPROVED": 10,
    "REJECTED": 2,
    "TOTAL": 15
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}
```

**Status Codes:**
- 200: Success
- 401: Invalid token
- 500: Server error

---

## 4. Approve Appointment

### PATCH /api/v1/appointments/:appointmentId/approve

**Purpose:** Approve a pending appointment

**Authentication:** Required (Bearer token)

**Method:** PATCH (not PUT)

**URL Parameters:**
```
appointmentId: string (MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:** 
```json
{}
```
(Empty body)

**Response Format:**
```json
{
  "success": true,
  "message": "Appointment approved successfully",
  "data": {
    "_id": "apt_001",
    "userId": "user_123",
    "doctorId": "doctor_456",
    "appointmentDate": "2024-02-10",
    "appointmentTime": "10:00 AM",
    "reason": "General Checkup",
    "approvalstatus": "APPROVED",
    "paymentStatus": "paid",
    "status": "SCHEDULED",
    "updatedAt": "2024-01-28T11:30:00Z"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}

// 404 Not Found
{
  "success": false,
  "message": "Appointment not found"
}

// 400 Bad Request (already approved)
{
  "success": false,
  "message": "Appointment already approved"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request
- 401: Invalid token
- 404: Appointment not found
- 500: Server error

---

## 5. Reject Appointment

### PATCH /api/v1/appointments/:appointmentId/reject

**Purpose:** Reject a pending appointment with optional reason

**Authentication:** Required (Bearer token)

**Method:** PATCH (not PUT)

**URL Parameters:**
```
appointmentId: string (MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancellationReason": "Already booked at this time"
}
```

**OR** (if empty)
```json
{}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Appointment rejected successfully",
  "data": {
    "_id": "apt_001",
    "userId": "user_123",
    "doctorId": "doctor_456",
    "appointmentDate": "2024-02-10",
    "appointmentTime": "10:00 AM",
    "reason": "General Checkup",
    "approvalstatus": "REJECTED",
    "paymentStatus": "paid",
    "status": "SCHEDULED",
    "cancellationReason": "Already booked at this time",
    "updatedAt": "2024-01-28T11:30:00Z"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authentication failed. Invalid token."
}

// 404 Not Found
{
  "success": false,
  "message": "Appointment not found"
}

// 400 Bad Request (already rejected)
{
  "success": false,
  "message": "Appointment already rejected"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request
- 401: Invalid token
- 404: Appointment not found
- 500: Server error

---

## Implementation Checklist

### Required Endpoints
- [ ] GET /api/v1/profile/me
- [ ] GET /api/v1/appointments/doctor
- [ ] GET /api/v1/appointments/doctor/stats (or use first endpoint)
- [ ] PATCH /api/v1/appointments/:appointmentId/approve
- [ ] PATCH /api/v1/appointments/:appointmentId/reject

### Response Format Requirements
- [ ] All responses include `success` field
- [ ] Success responses include `data` field
- [ ] Error responses include `message` field
- [ ] All timestamps use ISO 8601 format

### Authentication Requirements
- [ ] Token validation middleware on all protected routes
- [ ] Extract doctorId from JWT payload
- [ ] Return 401 for invalid/expired tokens
- [ ] Return 403 for insufficient permissions

### Data Validation
- [ ] Validate appointmentId format
- [ ] Validate status transitions (PENDING → APPROVED/REJECTED only)
- [ ] Prevent approving already approved appointments
- [ ] Prevent rejecting already rejected appointments

### Additional Requirements
- [ ] Log appointment actions (audit trail)
- [ ] Send notification email to patient on approval/rejection
- [ ] Update appointment timestamps (updatedAt)
- [ ] Filter appointments by doctorId from JWT

---

## Testing Commands

### Test with cURL

```bash
# 1. Login and get token
curl -X POST http://localhost:4000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'

# 2. Get doctor profile
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:4000/api/v1/profile/me

# 3. Get all appointments
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:4000/api/v1/appointments/doctor

# 4. Get pending appointments only
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:4000/api/v1/appointments/doctor?status=PENDING

# 5. Approve appointment
curl -X PATCH \
  -H "Authorization: Bearer {TOKEN}" \
  http://localhost:4000/api/v1/appointments/{appointmentId}/approve

# 6. Reject appointment
curl -X PATCH \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason":"Cannot accommodate"}' \
  http://localhost:4000/api/v1/appointments/{appointmentId}/reject
```

---

## Testing with Postman

1. **Create request collection for Doctor APIs**
2. **Add environment variable:** `token = {JWT_TOKEN}`
3. **Headers for all requests:**
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```

4. **Test each endpoint:**
   - GET profile/me
   - GET appointments/doctor
   - GET appointments/doctor?status=PENDING
   - PATCH appointments/:id/approve
   - PATCH appointments/:id/reject (with reason)

---

## Data Model Requirements

### Appointment Schema Must Include

```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  doctorId: ObjectId,      // Reference to Doctor
  appointmentDate: Date,   // Date of appointment
  appointmentTime: String, // Time in format "HH:MM AM/PM"
  reason: String,          // Reason for appointment
  approvalstatus: String,  // "PENDING" | "APPROVED" | "REJECTED"
  paymentStatus: String,   // "paid" | "unpaid"
  status: String,          // "SCHEDULED" | "COMPLETED" | "NOT SCHEDULED"
  cancellationReason: String, // Optional, for rejected appointments
  createdAt: Date,
  updatedAt: Date
}
```

### Doctor Schema Must Include

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  contact: String,
  specialization: String,
  experienceYears: Number,
  qualification: String,
  licenseNumber: String,
  hospitalName: String,
  address: String,
  image: String,           // URL to profile image
  verificationStatus: String, // "PENDING" | "APPROVED" | "REJECTED"
  documents: [String],     // Array of document URLs
  createdAt: Date,
  updatedAt: Date
}
```

---

## Existing Backend APIs to Use

If building on existing backend, check these endpoints:

From AdminController.js:
```
PATCH /api/admin/appointments/:appointmentId/approve
PATCH /api/admin/appointments/:appointmentId/reject
GET /api/admin/appointments
```

**Note:** These admin endpoints should work for doctors too if:
1. Doctor role is properly set in JWT
2. Middleware allows doctor role OR
3. Separate doctor endpoints are created

---

## Summary

For the doctor dashboard to function, backend must provide:

| Endpoint | Method | Purpose | Required |
|----------|--------|---------|----------|
| /profile/me | GET | Get doctor profile | ✅ |
| /appointments/doctor | GET | List appointments | ✅ |
| /appointments/doctor/stats | GET | Get statistics | ✅ |
| /appointments/:id/approve | PATCH | Approve appointment | ✅ |
| /appointments/:id/reject | PATCH | Reject appointment | ✅ |

All endpoints must:
- ✅ Require JWT authentication
- ✅ Validate doctor role
- ✅ Return JSON responses
- ✅ Include proper error handling
- ✅ Use correct HTTP methods (GET for reads, PATCH for updates)

---

**Last Updated:** January 26, 2026  
**Status:** Ready for Backend Integration ✅
