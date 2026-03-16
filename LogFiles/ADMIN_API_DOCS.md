# Admin Panel Backend API Documentation

## Base URL
```
http://localhost:4000/api/v1/admin
```

## Authentication
All admin routes require:
- Valid JWT token in `Authorization` header: `Bearer <token>`
- User role must be `ADMIN`

## Response Format
All endpoints return JSON with consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## API Endpoints

### Dashboard Stats

#### Get Doctors Count
- **GET** `/doctors/count`
- **Response:**
```json
{
  "success": true,
  "count": 24
}
```

#### Get Pending Registrations Count
- **GET** `/registrations/pending/count`
- **Response:**
```json
{
  "success": true,
  "count": 5
}
```

#### Get Appointments Count
- **GET** `/appointments/count`
- **Response:**
```json
{
  "success": true,
  "count": 156,
  "pendingCount": 12
}
```

---

### Doctor Registrations

#### Get Doctor Registrations
- **GET** `/registrations?status=PENDING`
- **Query Parameters:**
  - `status` (optional): `PENDING`, `APPROVED`, `REJECTED`
- **Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "fullName": "Dr. Sarah Johnson",
      "email": "sarah@example.com",
      "specialization": "Cardiology",
      "experienceYears": 8,
      "licenseNumber": "LIC-001",
      "verificationStatus": "PENDING",
      "submittedAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

#### Approve Doctor Registration
- **PUT** `/registrations/:registrationId/approve`
- **Body:**
```json
{
  "adminRemarks": "Documents verified successfully"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Doctor registration approved successfully",
  "data": {...}
}
```

#### Reject Doctor Registration
- **PUT** `/registrations/:registrationId/reject`
- **Body:**
```json
{
  "adminRemarks": "Insufficient experience"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Doctor registration rejected successfully",
  "data": {...}
}
```

---

### Appointments

#### Get All Appointments
- **GET** `/appointments?status=PENDING`
- **Query Parameters:**
  - `status` (optional): `PENDING`, `APPROVED`, `REJECTED`
- **Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "patientName": "John Doe",
      "patientEmail": "john@example.com",
      "doctorName": "Dr. Sarah Johnson",
      "specialization": "Cardiology",
      "appointmentDate": "2024-02-15T00:00:00Z",
      "appointmentTime": "10:00 AM",
      "status": "SCHEDULED",
      "approvalstatus": "PENDING",
      "reason": "Regular checkup"
    }
  ]
}
```

#### Approve Appointment
- **PUT** `/appointments/:appointmentId/approve`
- **Response:**
```json
{
  "success": true,
  "message": "Appointment approved successfully",
  "data": {...}
}
```

#### Reject Appointment
- **PUT** `/appointments/:appointmentId/reject`
- **Body:**
```json
{
  "reason": "Doctor not available on this date"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Appointment rejected successfully",
  "data": {...}
}
```

---

### Users Management

#### Get All Users
- **GET** `/users?role=PATIENT`
- **Query Parameters:**
  - `role` (optional): `USER`, `DOCTOR`, `ADMIN`
- **Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "_id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "contact": "+1234567890",
      "role": "USER",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Doctors

#### Get Approved Doctors
- **GET** `/doctors/approved`
- **Response:**
```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "_id": "...",
      "fullName": "Dr. Sarah Johnson",
      "specialization": "Cardiology",
      "experienceYears": 8,
      "licenseNumber": "LIC-001",
      "verificationStatus": "APPROVED"
    }
  ]
}
```

#### Get Rejected Doctors
- **GET** `/doctors/rejected`
- **Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "fullName": "Dr. James Wilson",
      "email": "james@example.com",
      "specialization": "Dentistry",
      "verificationStatus": "REJECTED",
      "adminRemarks": "Insufficient experience"
    }
  ]
}
```

---

### Email Notifications

#### Send Notification Email
- **POST** `/send-email`
- **Body:**
```json
{
  "email": "doctor@example.com",
  "status": "approved",
  "doctorName": "Dr. Sarah Johnson",
  "templateType": "doctorRegistration"
}
```
- **Parameters:**
  - `status`: `approved` or `rejected`
  - `templateType`: `doctorRegistration` or `appointment`
- **Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Missing required fields |
| 401 | Not Authenticated | No token provided or invalid token |
| 403 | Access Denied | User is not an admin |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Implementation Notes

1. **Authentication**
   - All routes use `authenticateUser` middleware to validate JWT
   - All routes use `isadmin` middleware to verify admin role
   - Token should be sent in Authorization header: `Authorization: Bearer <token>`

2. **Email Sending**
   - Emails are sent asynchronously
   - If email fails, operation still succeeds but error is logged
   - Admins should have email service configured

3. **Data Relationships**
   - Doctor registrations are populated with user data
   - Appointments are populated with patient and doctor names
   - Users list shows all system users with their roles

4. **Status Mapping**
   - Registration Status: `PENDING`, `APPROVED`, `REJECTED`
   - Appointment Status: `SCHEDULED`, `COMPLETED`, `NOT SCHEDULED`
   - Appointment Approval: `PENDING`, `APPROVED`, `REJECTED`

---

## Testing with cURL

### Get Doctors Count
```bash
curl -X GET "http://localhost:4000/api/v1/admin/doctors/count" \
  -H "Authorization: Bearer <your_token>"
```

### Approve Doctor Registration
```bash
curl -X PUT "http://localhost:4000/api/v1/admin/registrations/<id>/approve" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminRemarks":"Approved"}'
```

### Get All Appointments
```bash
curl -X GET "http://localhost:4000/api/v1/admin/appointments?status=PENDING" \
  -H "Authorization: Bearer <your_token>"
```
