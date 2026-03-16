# ClinicAll - Use Case Diagram Details

**Complete Project Specification for Creating Use Case Diagrams**

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Actors (Users)](#actors-users)
3. [Use Cases](#use-cases)
4. [Use Case Descriptions](#use-case-descriptions)
5. [Actor-UseCase Relationships](#actor-usecase-relationships)
6. [System Boundaries](#system-boundaries)
7. [Dependencies & Extensions](#dependencies--extensions)

---

## PROJECT OVERVIEW

**Project Name:** ClinicAll - Healthcare Appointment & Live Consultation Platform

**Domain:** Healthcare/Medical Services

**Technology Stack:**
- Frontend: React.js with Tailwind CSS
- Backend: Node.js/Express
- Database: MongoDB with Mongoose
- Real-time: Socket.IO
- Payment Gateway: Razorpay
- Authentication: JWT (JSON Web Tokens)
- Email: SMTP with Mail Templates
- FHIR: Healthcare interoperability standards

**Core Features:**
- User registration & authentication
- Doctor profile management & verification
- Appointment booking & management
- Real-time live consultation with chat
- Payment processing via Razorpay
- Medical records management
- Admin dashboard for verification & approval
- Hospital/Clinic management
- Notifications & email alerts
- FHIR medical records integration

---

## ACTORS (USERS)

### 1. **Patient**
**Description:** Regular users seeking medical consultation

**Responsibilities:**
- Register for an account
- Search for doctors by specialization
- View doctor profiles and availability
- Request appointments with doctors
- Pay for online consultations via Razorpay
- Chat with doctor during consultation
- View medical records created during consultation
- Track appointment status
- Cancel pending appointments
- Manage personal profile

**Access Level:** Standard user (role: "user")

---

### 2. **Doctor**
**Description:** Healthcare service providers offering consultations

**Responsibilities:**
- Register for a doctor account
- Submit verification documents
- Manage doctor profile & credentials
- View appointment requests
- Approve or reject patient appointments
- Start live consultation sessions
- Add medical records during consultation
- Chat with patients in real-time
- Access consultation history
- Manage consultation fees

**Access Level:** Doctor role (role: "doctor")
**Prerequisite:** Requires admin approval after registration

---

### 3. **Admin**
**Description:** Platform administrators managing verification & approval

**Responsibilities:**
- View all doctor registration requests
- Approve doctor registrations
- Reject doctor registrations with remarks
- View all appointments
- Approve appointments administratively
- Reject appointments
- View all system users
- View approved & rejected doctors
- Send notification emails
- Manage system-wide data

**Access Level:** Admin role (role: "admin")
**Special Status:** Has elevated permissions across system

---

### 4. **Hospital/Clinic Admin**
**Description:** Administrators of hospitals or clinics managing their staff

**Responsibilities:**
- Register hospital/clinic on platform
- Review doctor applications from their staff
- Approve doctors associated with their facility
- Reject applications
- Manage hospital profile & information
- Auto-approve their own doctor registrations

**Access Level:** Hospital admin role (role: "hospital_admin")
**Special Status:** Hospital owner gets automatic hospital stage approval

---

### 5. **System** (Non-Human Actor)
**Description:** Automated processes and integrations

**Responsibilities:**
- Send email notifications
- Process Razorpay payments
- Manage Socket.IO real-time communication
- Audit logging
- FHIR data handling
- Notification system

---

## USE CASES

### HIGH-LEVEL USE CASES BY ACTOR

#### **Patient Use Cases:**
1. Register as User
2. Login
3. Search for Doctors
4. View Doctor Profile
5. Request Appointment
6. View Appointment Requests (Status Tracking)
7. Choose Consultation Mode (Online/Offline)
8. Pay for Online Consultation
9. Access Chat During Consultation
10. View Medical Records
11. Cancel Appointment Request
12. Edit Profile
13. Logout

#### **Doctor Use Cases:**
1. Login
2. Register as Doctor
3. Complete Doctor Registration
4. View Registration Status
5. View Dashboard Stats
6. View Patient Appointments
7. Approve Appointment
8. Reject Appointment
9. Start Live Consultation Session
10. Add Medical Records to Patient
11. Chat with Patient (Real-time)
12. View Consultation History
13. View Medical Records Created
14. Update Profile & Credentials
15. Set Consultation Fee
16. Logout

#### **Admin Use Cases:**
1. Login (Admin Account)
2. View Dashboard Overview
3. View Doctor Registration Requests
4. View Pending Registrations Count
5. Approve Doctor Registration
6. Reject Doctor Registration
7. View All System Users
8. View Approved Doctors List
9. View Rejected Doctors List
10. View All Appointments
11. Approve Appointment
12. Reject Appointment
13. Send Notification Emails
14. View Appointment Count
15. Audit System Activities
16. Logout

#### **Hospital Admin Use Cases:**
1. Register Hospital/Clinic
2. Login
3. View Doctor Applications
4. Approve Doctor Applications
5. Reject Doctor Applications
6. Manage Hospital Profile
7. View Hospital Stats
8. Logout

#### **System Use Cases:**
1. Send Email Notifications
2. Process Razorpay Payment
3. Verify Payment Signature
4. Broadcast Real-time Messages (Socket.IO)
5. Create Audit Logs
6. Handle FHIR Medical Records

---

## USE CASE DESCRIPTIONS

### **USE CASE 1: User Registration**
- **Actor(s):** Patient, Doctor, Hospital Admin
- **Precondition:** User is not logged in, has valid email
- **Main Flow:**
  1. User selects "Sign Up"
  2. User enters full name, email, contact, password
  3. User selects role (Patient/Doctor/Hospital Admin)
  4. System sends OTP verification email
  5. User verifies email with OTP
  6. User account created in database
  7. Login credentials stored securely
  8. Notification sent to system
- **Postcondition:** User has active account, can login
- **Alternative:**
  - User cancels signup → User returned to home page

---

### **USE CASE 2: User Login**
- **Actor(s):** Patient, Doctor, Admin, Hospital Admin
- **Precondition:** User has registered account
- **Main Flow:**
  1. User enters email & password
  2. System validates credentials
  3. System generates JWT token
  4. Token stored in localStorage (frontend)
  5. User redirected to respective dashboard
- **Postcondition:** User authenticated, session active
- **Exceptions:**
  - Invalid credentials → Error message displayed
  - Account locked (failed attempts) → Retry after delay
  - Expired token → Re-login required
- **Extensions:** Refresh token for session extension

---

### **USE CASE 3: Doctor Registration & Verification**
- **Actor(s):** Doctor, Admin, Hospital Admin
- **Precondition:** User logged in with user role, has credentials
- **Main Flow:**
  1. Doctor navigates to "Doctor Registration"
  2. Doctor enters:
     - Full name, email, contact
     - Specialization, qualification
     - Experience years, license number
     - Hospital/Clinic name
     - Upload documents (certificates)
  3. (Optional) Select hospital/clinic affiliation
  4. Submit registration application
  5. System creates DoctorRegistration record
  6. If hospital owner → Auto-approve hospital stage
  7. Admin receives notification
  8. Hospital admin (if affiliated) also notified
  9. Admin reviews application
  10. Admin approves/rejects with remarks
  11. Doctor receives email notification
  12. User role updated: add "doctor" role
  13. Doctor can now access doctor dashboard
- **Postcondition:** Doctor verified, can manage appointments
- **Exceptions:**
  - Missing documents → Rejection with remarks
  - Invalid license → Rejection
  - Duplicate application → Error message
  - Hospital not approved → Cannot affiliate

---

### **USE CASE 4: Search Doctors**
- **Actor(s):** Patient, System
- **Precondition:** Patient logged in
- **Main Flow:**
  1. Patient navigates to "Search/Appointment" page
  2. Patient filters by:
     - Specialization (Cardiology, Dentist, etc.)
     - Location (if available)
     - Rating/Reviews
  3. System queries approved doctors matching criteria
  4. System displays doctor cards with:
     - Name, specialization, experience
     - Hospital affiliation
     - Consultation fee
     - Rating, reviews
     - Availability status
  5. Patient clicks on doctor → View full profile
- **Postcondition:** Patient sees matching doctors
- **Alternative:**
  - No doctors found → "No results" message
  - Patient uses AI symptom analysis → System recommends doctors

---

### **USE CASE 5: Request Appointment**
- **Actor(s):** Patient, Doctor, System
- **Precondition:** Patient logged in, selected doctor
- **Main Flow:**
  1. Patient clicks "Request Appointment"
  2. Patient fills appointment form:
     - Appointment date & time
     - Reason for visit
     - Preferred consultation mode (online/offline)
  3. Patient submits request
  4. System creates Appointment record
  5. Appointment status: PENDING, approvalstatus: PENDING
  6. Email sent to patient: "Appointment submitted"
  7. Email sent to doctor: "New appointment request"
  8. Notifications sent to both
  9. Patient can view in "My Requests" page
  10. Request shows status: PENDING
- **Postcondition:** Appointment created, awaiting doctor approval
- **Alternative:**
  - Patient cancels → Appointment marked CANCELLED

---

### **USE CASE 6: Approve/Reject Appointment (Doctor)**
- **Actor(s):** Doctor, System
- **Precondition:** Doctor logged in, has pending appointments
- **Main Flow (Approve):**
  1. Doctor views "Appointments" page
  2. Doctor sees appointment with PENDING status
  3. Doctor clicks "Approve"
  4. System updates: approvalstatus = APPROVED
  5. Email sent to patient: "Appointment Approved"
  6. Notification sent to patient
  7. Appointment now shows as APPROVED
  8. Patient can proceed to payment (if online) or confirm offline
- **Main Flow (Reject):**
  1. Doctor clicks "Reject"
  2. Modal appears for rejection reason
  3. Doctor enters reason (optional)
  4. Doctor confirms rejection
  5. System updates: approvalstatus = REJECTED
  6. Email sent to patient: "Appointment Rejected"
  7. Reason included in email
  8. Notification sent to patient
- **Postcondition:** Appointment status changed & patient notified
- **Alternative:**
  - Doctor doesn't respond within 24 hrs → Auto-cancel notification

---

### **USE CASE 7: Choose Consultation Mode**
- **Actor(s):** Patient, System
- **Precondition:** Appointment approved, patient viewing "My Requests"
- **Main Flow:**
  1. Patient sees approved appointment
  2. Options shown: "Online (with payment)" OR "Offline (at clinic)"
  3. Patient selects mode:
     - **Online:** 
       - System sets consultationMode = "online"
       - System enables isChatEnabled = true
       - Shows "Pay Now" button
     - **Offline:**
       - System sets consultationMode = "offline"
       - System disables chat (isChatEnabled = false)
       - paymentStatus = "unpaid"
       - consultationStatus = "locked"
  4. Confirmation shown to patient
- **Postcondition:** Consultation mode selected for appointment
- **Alternative:**
  - Patient changes mind → Select different mode

---

### **USE CASE 8: Pay for Online Consultation**
- **Actor(s):** Patient, System (Razorpay)
- **Precondition:** Appointment approved, patient selected "online" mode
- **Main Flow:**
  1. Patient clicks "Pay for Online Consultation"
  2. System calls Razorpay API to create order
  3. Razorpay amount calculated from doctor's consultationFee
  4. Razorpay payment gateway opens
  5. Patient enters payment details (card/UPI)
  6. Razorpay processes payment
  7. System verifies payment signature (SHA-256)
  8. If valid:
     - Payment record created with status "paid"
     - Appointment updated:
       - paymentStatus = "paid"
       - consultationStatus = "active"
       - isChatEnabled = true
       - paidAt = timestamp
     - Email confirmation sent to patient
     - Patient can now access chat
  9. If invalid:
     - Payment marked "failed"
     - Error shown to patient
     - Payment record updated
- **Postcondition:** Payment processed, consultation activated if successful
- **Exception:** Payment declined, timeout, invalid signature

---

### **USE CASE 9: Start Live Consultation Session**
- **Actor(s):** Doctor, Patient, System (Socket.IO)
- **Precondition:** Appointment paid (online) & approved
- **Main Flow:**
  1. Doctor clicks "Start Live Consultation"
  2. System creates ConsultationSession record
  3. Session status = "active"
  4. Socket.IO emits "consultation_started" event
  5. Patient receives real-time notification
  6. Both doctor & patient join consultation room (Socket.IO)
  7. Real-time connection established
  8. Doctor can now:
     - Add medical records (prescriptions, vitals, lab results)
     - Chat with patient
     - Access patient medical records (if available)
  9. Patient can:
     - View medical records added in real-time
     - Chat with doctor
     - Ask questions
- **Postcondition:** Live consultation session active, real-time communication enabled
- **Extension:** Record medical records created during session

---

### **USE CASE 10: Add Medical Records (During Consultation)**
- **Actor(s):** Doctor, System, Patient
- **Precondition:** Consultation session active
- **Main Flow:**
  1. Doctor clicks "Add Medical Record"
  2. Doctor selects record type:
     - Prescription
     - Lab Report
     - Diagnosis
     - Vitals (Temperature, BP, Heart Rate, etc.)
  3. Doctor fills details:
     - Record title
     - Content/findings
     - Specific data (medication, lab results, vitals)
     - Notes
  4. Doctor submits record
  5. System creates MedicalRecord in database
  6. Record linked to consultation session
  7. Socket.IO emits "new_record_added" event
  8. Patient receives real-time update
  9. Medical record displayed on patient's view
  10. Record automatically encrypted (sensitive field encryption)
  11. FHIR export available if system integrated
- **Postcondition:** Medical record created & visible to patient
- **Extension:** FHIR compliance, export to external EHR systems

---

### **USE CASE 11: Real-time Chat (Doctor-Patient)**
- **Actor(s):** Doctor, Patient, System (Socket.IO)
- **Precondition:** Consultation active, both connected to consultation room
- **Main Flow:**
  1. Doctor types message in chat
  2. Doctor sends message
  3. System broadcasts via Socket.IO to consultation room
  4. Message received in real-time by patient
  5. Message displayed with:
     - Sender name, role
     - Message content
     - Timestamp
     - Read/sent status
  6. Patient types reply
  7. Same broadcast occurs in reverse
  8. Chat history persisted in ChatMessage collection
  9. Both can see typing indicators (if implemented)
- **Postcondition:** Real-time conversation established
- **Constraints:**
  - Only doctor & patient in that appointment can communicate
  - Chat only enabled after payment for online consultation
  - Messages encrypted at rest (sensitive)

---

### **USE CASE 12: View Medical Records**
- **Actor(s):** Patient, Doctor, System
- **Precondition:** Medical records created during consultation
- **Main Flow (Patient):**
  1. Patient clicks "Medical Records" in navigation
  2. Patient sees list of consultations with records
  3. Patient selects consultation session
  4. Patient views all medical records from that session:
     - Prescriptions
     - Lab reports
     - Diagnoses
     - Vitals
     - Doctor's notes
  5. Patient can:
     - View details of each record
     - Download as PDF (if implemented)
     - Print records
     - FHIR export (if available)
- **Main Flow (Doctor):**
  1. Doctor clicks "Consultation History"
  2. Doctor views past consultations
  3. Similar viewing options
- **Postcondition:** Medical records visible to authorized parties
- **Security:** Patient only sees own records, doctor sees only their consultations

---

### **USE CASE 13: View Appointment Status**
- **Actor(s):** Patient
- **Precondition:** Patient has requested appointments
- **Main Flow:**
  1. Patient clicks "My Requests" in navigation
  2. System retrieves all patient's appointments
  3. For each appointment, shows:
     - Doctor name, specialization
     - Appointment date & time
     - Reason for visit
     - Status badge (PENDING, APPROVED, REJECTED, CANCELLED)
     - Payment status (if online)
     - Consultation status (if applicable)
  4. Patient can:
     - View appointment details
     - Filter by status
     - See statistics (total, pending, approved, rejected)
     - Click buttons based on status:
       - If PENDING & APPROVED: Choose online/offline mode
       - If APPROVED & online: Pay Now
       - If paid & active: Start Live Consultation
       - If paid & active: Open Chat
       - If cancelled or rejected: Reschedule or request new
- **Postcondition:** Patient has visibility of all appointments
- **Data Shown:** Doctor info, dates, statuses, actions available

---

### **USE CASE 14: Doctor Dashboard Overview**
- **Actor(s):** Doctor, System
- **Precondition:** Doctor logged in
- **Main Flow:**
  1. Doctor navigates to dashboard
  2. System displays statistics:
     - Total appointments count
     - Pending appointments count
     - Approved appointments count
     - Rejected appointments count
     - Upcoming consultations
  3. Quick action buttons:
     - View all appointments
     - View profile
     - Manage availability
  4. Charts/graphs showing:
     - Appointment trends
     - Specialization-based stats
  5. Recent appointments listed
- **Postcondition:** Doctor sees overview of activity
- **Refresh:** Real-time updates if new appointment arrives

---

### **USE CASE 15: Admin Dashboard Overview**
- **Actor(s):** Admin, System
- **Precondition:** Admin logged in
- **Main Flow:**
  1. Admin navigates to dashboard
  2. System displays key statistics:
     - Total approved doctors count
     - Pending doctor registrations count
     - Total appointments count
     - Recent activities/audit log
  3. Quick links to:
     - Doctor registrations (pending)
     - Appointments (pending approval)
     - Users management
     - Reports
  4. Data shown in cards/tiles with counts
- **Postcondition:** Admin sees system overview
- **Purpose:** Quick view of items needing action

---

### **USE CASE 16: Admin Approve Doctor Registration**
- **Actor(s):** Admin, System
- **Precondition:** Doctor registration in PENDING status
- **Main Flow:**
  1. Admin navigates to "Doctor Registrations"
  2. Admin filters to show PENDING registrations
  3. Admin reviews doctor application:
     - Documents, credentials, license
     - Medical background
     - Qualifications
  4. Admin clicks "Approve"
  5. Optional: Admin adds remarks
  6. Admin confirms action
  7. System updates registration:
     - verificationStatus = "APPROVED"
     - reviewedAt = timestamp
  8. System updates associated User:
     - Adds "doctor" role to user.roles array
     - Sets doctor role as primary if applicable
  9. Email sent to doctor: "Registration Approved"
  10. Notification sent to doctor
  11. Doctor's Doctor record created/activated
  12. Doctor can now access doctor dashboard
  13. Doctor appears in "Approved Doctors" list
- **Postcondition:** Doctor verified and activated on platform
- **Alternative:** Admin rejects (see UC-17)

---

### **USE CASE 17: Admin Reject Doctor Registration**
- **Actor(s):** Admin, System
- **Precondition:** Doctor registration in PENDING status
- **Main Flow:**
  1. Admin clicks "Reject" on registration
  2. Modal opens with rejection reason field
  3. Admin enters reason (document issues, credential verification failed, etc.)
  4. Admin confirms rejection
  5. System updates registration:
     - verificationStatus = "REJECTED"
     - adminRemarks = reason
     - reviewedAt = timestamp
  6. Email sent to doctor: "Registration Rejected"
  7. Email includes reason for rejection
  8. Notification sent to doctor
  9. Doctor can reapply if issues resolved
  10. Registration hidden from approved doctors list
- **Postcondition:** Doctor registration rejected, doctor notified
- **Timeline:** Doctor can reapply after fixing issues

---

### **USE CASE 18: Edit User Profile**
- **Actor(s):** Patient, Doctor, Hospital Admin
- **Precondition:** User logged in
- **Main Flow:**
  1. User clicks "My Profile" or "Edit Profile"
  2. Form loads with current information:
     - Full name, email, contact
     - Profile picture
     - Location (if patient)
     - Bio/description
  3. User updates desired fields
  4. Optional: Upload new profile picture
  5. Form validated:
     - Email uniqueness checked
     - Phone format validated
     - Image size/format checked
  6. User clicks "Save"
  7. Database updated with new information
  8. Success message shown
  9. Profile picture synced across system (if changed)
- **Postcondition:** User profile updated
- **Exception:** Invalid email/phone → Validation error shown

---

### **USE CASE 19: Send Email Notification**
- **Actor(s):** System, Admin
- **Precondition:** Appointment approved/rejected or registration approved/rejected
- **Main Flow:**
  1. System trigger activated (approval, rejection, etc.)
  2. System selects appropriate email template:
     - appointmentapprovaltemplate
     - appointmentrejectiontemplate
     - doctorApprovaltemplate
     - doctorRejectiontemplate
  3. Email content populated with:
     - Recipient name
     - Appointment/Registration details
     - Doctor/Hospital information (if applicable)
     - Links to dashboard
     - Action buttons (if applicable)
  4. Email sent via SMTP
  5. Email delivery logged
  6. System tracks delivery status
- **Postcondition:** Email delivered to recipient
- **Alternative:** Admin manually sends email via "Send Email" endpoint

---

### **USE CASE 20: Logout**
- **Actor(s):** Patient, Doctor, Admin, Hospital Admin
- **Precondition:** User logged in
- **Main Flow:**
  1. User clicks "Logout"
  2. System removes:
     - JWT token from localStorage
     - User data from localStorage
     - User data from Redux store
     - Session timer cleared
  3. Socket.IO connection closed (if active)
  4. User redirected to login/home page
  5. Browser cache cleared of sensitive data
  6. Logout recorded in audit log
- **Postcondition:** User session ended, authenticated access revoked
- **Security:** Token invalidated on backend

---

## USE CASE DESCRIPTIONS (DETAILED)

### **Additional Use Cases:**

### **USE CASE 21: Cancel Appointment Request**
- **Actor(s):** Patient
- **Precondition:** Appointment has PENDING or initial APPROVED status
- **Main Flow:**
  1. Patient clicks "Cancel" on appointment
  2. Confirmation dialog shown
  3. Optional: Patient enters cancellation reason
  4. Patient confirms cancellation
  5. System updates appointment:
     - approvalstatus = "CANCELLED" (if PENDING)
     - status = "NOT SCHEDULED"
  6. Refund initiated (if payment made):
     - Payment status = "refunded"
     - Razorpay refund request
     - Refund processed
  7. Email sent to doctor: "Patient cancelled appointment"
  8. Email sent to patient: "Cancellation confirmed"
  9. Cancellation reason logged
- **Postcondition:** Appointment cancelled, payment refunded if applicable

---

### **USE CASE 22: View Approved Doctors List**
- **Actor(s):** Admin
- **Precondition:** Admin logged in
- **Main Flow:**
  1. Admin navigates to "Approved Doctors"
  2. System retrieves all doctors with verificationStatus = "APPROVED"
  3. Displays table with:
     - Doctor name
     - Specialization
     - Hospital affiliation
     - Experience years
     - License number
     - Verification status badge
  4. Admin can:
     - Sort by name, specialization, experience
     - Search by name or license
     - View full doctor profile
     - Export list (if available)
- **Postcondition:** Admin sees approved doctors inventory

---

### **USE CASE 23: View Rejected Doctors List**
- **Actor(s):** Admin
- **Precondition:** Admin logged in
- **Main Flow:**
  1. Admin navigates to "Rejected Doctors"
  2. System retrieves doctors with verificationStatus = "REJECTED"
  3. Displays with:
     - Doctor name, email
     - Rejection reason
     - Date rejected
     - Rejection remarks
  4. Admin can:
     - View application details
     - See rejection reason
     - Contact doctor if needed
- **Postcondition:** Admin tracks rejected applications

---

### **USE CASE 24: View All System Users**
- **Actor(s):** Admin
- **Precondition:** Admin logged in
- **Main Flow:**
  1. Admin navigates to "Users Management"
  2. Optional: Filter by role (USER, DOCTOR, ADMIN)
  3. System shows all users:
     - Full name, email, contact
     - Role
     - Account creation date
     - Last login (if tracked)
  4. Admin can:
     - Search users
     - Sort by creation date, role
     - View detailed user info
     - Perform moderation if needed
- **Postcondition:** Admin has user inventory

---

### **USE CASE 25: Approve Appointment (Admin)**
- **Actor(s):** Admin
- **Precondition:** Appointment in PENDING status
- **Main Flow:**
  1. Admin views "Appointments" section
  2. Admin reviews pending appointment
  3. Admin clicks "Approve"
  4. System updates: approvalstatus = "APPROVED"
  5. Email sent to:
     - Patient: Appointment approved
     - Doctor: New approved appointment
  6. Notifications sent
  7. Appointment visible to patient for payment/confirmation
- **Postcondition:** Appointment approved, parties notified

---

### **USE CASE 26: Reject Appointment (Admin)**
- **Actor(s):** Admin
- **Precondition:** Appointment in PENDING status
- **Main Flow:**
  1. Admin clicks "Reject"
  2. Modal for rejection reason shown
  3. Admin enters reason
  4. Confirms rejection
  5. System updates: approvalstatus = "REJECTED"
  6. Emails sent with rejection reason
  7. Notifications sent
  8. Appointment shows as REJECTED to patient
- **Postcondition:** Appointment rejected, parties notified

---

### **USE CASE 27: Hospital/Clinic Registration**
- **Actor(s):** Hospital Admin
- **Precondition:** User wants to register hospital/clinic
- **Main Flow:**
  1. On signup, user selects "Hospital/Clinic Owner" role
  2. Hospital registration form shown:
     - Hospital/Clinic name
     - Address (street, city, state, postal code)
     - Contact phone, email
     - Hospital registration number
     - Type: Hospital or Clinic
     - Logo upload
     - Department information (if hospital)
  3. Form validated
  4. Hospital created with status "pending_approval"
  5. Admin notified of new hospital registration
  6. Admin reviews and approves
  7. Hospital status = "approved"
  8. Hospital appears in doctor affiliate list
- **Postcondition:** Hospital registered and available for doctor affiliation

---

### **USE CASE 28: Process Razorpay Payment**
- **Actor(s):** System (Razorpay Integration)
- **Precondition:** Patient clicks "Pay" for online consultation
- **Main Flow:**
  1. System calls Razorpay API: `orders.create()`
  2. Request includes:
     - Amount (consultationFee from doctor)
     - Currency = "INR"
     - Receipt = appointment ID
  3. Razorpay returns order ID
  4. Frontend receives Razorpay configuration:
     - key_id (publishable key)
     - orderId
     - amount
  5. Razorpay payment modal opened on frontend
  6. Patient completes payment
  7. Razorpay returns:
     - razorpay_order_id
     - razorpay_payment_id
     - razorpay_signature
  8. Frontend sends verification request to backend
  9. Backend verifies signature using HMAC-SHA256
  10. If valid: mark payment as "paid"
- **Postcondition:** Payment processed, signature verified

---

### **USE CASE 29: Audit Logging**
- **Actor(s):** System
- **Precondition:** Any admin action occurs
- **Main Flow:**
  1. Admin performs action:
     - Approve doctor registration
     - Reject appointment
     - Send email
     - Update user
  2. System triggers `auditLog()`
  3. Log entry created with:
     - Admin ID (who)
     - Action type (what)
     - Target ID (which resource)
     - Metadata (details)
     - Timestamp (when)
     - IP address (optional)
  4. Audit log stored in database
  5. Available for admin review/compliance
- **Postcondition:** Action logged for accountability

---

### **USE CASE 30: Update Consultation Fee**
- **Actor(s):** Doctor, System
- **Precondition:** Doctor logged in, viewing profile/settings
- **Main Flow:**
  1. Doctor clicks "Settings" or "Update Fee"
  2. Current consultation fee shown
  3. Doctor enters new fee in INR
  4. Doctor clicks "Save"
  5. System updates DoctorProfile.consultationFee
  6. New fee applied to future appointments
  7. Confirmation shown
- **Postcondition:** Consultation fee updated for future payments

---

## ACTOR-USECASE RELATIONSHIPS

### **Patient Actions:**
| Use Case | Actor | Extension/Include |
|----------|-------|------------------|
| Register as User | Patient | Include: Verify Email |
| Login | Patient | Include: Session Management |
| Search Doctors | Patient | Include: Filter, Sort |
| View Doctor Profile | Patient | Include: View Reviews |
| Request Appointment | Patient | Include: Choose Date/Time |
| View Appointment Status | Patient | Include: Filter by Status |
| Choose Consultation Mode | Patient | Extends: View Status |
| Pay for Consultation | Patient | Extends: Choose Mode |
| Start Live Consultation | Patient | Extends: Payment |
| Chat with Doctor | Patient | Extends: Live Consultation |
| View Medical Records | Patient | Extends: Live Consultation |
| Cancel Appointment | Patient | Extends: View Status |
| Edit Profile | Patient | Include: Change Picture |
| Logout | Patient | Include: Clear Session |

---

### **Doctor Actions:**
| Use Case | Actor | Extension/Include |
|----------|-------|------------------|
| Login | Doctor | Include: Session Management |
| Register as Doctor | Doctor | Include: Submit Documents |
| View Dashboard | Doctor | Include: Statistics |
| View Appointments | Doctor | Include: Filter by Status |
| Approve Appointment | Doctor | Extends: View Appointments |
| Reject Appointment | Doctor | Extends: View Appointments |
| Start Consultation | Doctor | Extends: Approved Appointment |
| Add Medical Records | Doctor | Extends: Live Consultation |
| Chat with Patient | Doctor | Extends: Live Consultation |
| View Consultation History | Doctor | Include: Search, Filter |
| Update Profile | Doctor | Include: Credentials, Fee |
| Set Consultation Fee | Doctor | Extends: Update Profile |
| Logout | Doctor | Include: Clear Session |

---

### **Admin Actions:**
| Use Case | Actor | Extension/Include |
|----------|-------|------------------|
| Login | Admin | Include: Auth Verification |
| View Dashboard | Admin | Include: Statistics |
| View Doctor Registrations | Admin | Include: Filter by Status |
| Approve Doctor | Admin | Extends: View Registrations |
| Reject Doctor | Admin | Extends: View Registrations |
| View Appointments | Admin | Include: Filter |
| Approve Appointment | Admin | Extends: View Appointments |
| Reject Appointment | Admin | Extends: View Appointments |
| View Approved Doctors | Admin | Include: Search, Sort |
| View Rejected Doctors | Admin | Include: Review Reasons |
| View All Users | Admin | Include: Filter by Role |
| Send Email Notification | Admin | Include: Select Template |
| View Audit Logs | Admin | Include: Filter by Action |
| Logout | Admin | Include: Clear Session |

---

## SYSTEM BOUNDARIES

### **What's INSIDE the System:**
- User authentication & authorization
- Doctor registration & verification workflow
- Appointment CRUD operations
- Real-time consultation & chat (Socket.IO)
- Medical record creation & storage
- Payment processing coordination
- Email notification sending
- User profile management
- Admin dashboard & controls
- Hospital/Clinic affiliation
- Audit logging

### **What's OUTSIDE the System (External Systems):**
1. **Razorpay Payment Gateway**
   - Processes payments
   - Returns payment status
   
2. **Email Service (SMTP)**
   - Sends emails using mailSender()
   - Manages bounce/delivery
   
3. **FHIR Server (Optional)**
   - Stores healthcare interoperability records
   - External EHR systems
   
4. **Authentication Provider (Optional)**
   - SSO (if implemented)
   - Third-party login (if implemented)

---

## DEPENDENCIES & EXTENSIONS

### **USE CASE DEPENDENCIES (Include Relationships):**

```
Login → Session Management
Register → Email Verification
Doctor Registration → Document verification → Admin Approval
Request Appointment → Appointment Created
View Status → Filter Status
Choose Consultation Mode → Set Mode
Pay for Consultation → Verify Payment
Start Consultation → Create Session
Add Medical Records → Encrypt sensitive fields
Chat → Real-time broadcast
View Medical Records → Access control (authorization)
```

### **EXTENSION RELATIONSHIPS:**

```
View Appointments (Patient) ←can extend ← Filter by Status
View Appointments (Patient) ←can extend ← Sort by Date
Approve Appointment ←can extend ← Send Email Notification
Reject Appointment ←can extend ← Send Email Notification
Add Medical Records ←can extend ← FHIR Export
Chat ←can extend ← Typing Indicators
Chat ←can extend ← Message Read Status
```

### **INCLUDE RELATIONSHIPS:**

```
Login = Authenticate + Validate Role + Load Session
Register = Collect Info + Validate Email + Create Account + Send OTP
Doctor Registration = Collect Credentials + Validate Docs + Submit for Admin Review
Pay for Consultation = Call Razorpay + Verify Signature + Update Appointment
Start Consultation = Create Session + Initialize Socket + Notify Parties
Add Medical Records = Fill Form + Encrypt Fields + Store + Broadcast
```

---

## DETAILED ACTOR-REQUIREMENT MATRIX

### **Patient Requirements:**
- ✅ Account registration with email verification
- ✅ Secure login with JWT token management
- ✅ Search & filter doctors by specialization, location, rating
- ✅ View complete doctor profiles with qualifications
- ✅ Request appointments with date/time selection
- ✅ Choose online (with payment) or offline consultation mode
- ✅ Pay via Razorpay with signature verification
- ✅ Real-time chat with doctor during consultation
- ✅ View medical records created during consultation
- ✅ Track appointment status in real-time
- ✅ Cancel appointments with refund processing
- ✅ Manage personal profile information
- ✅ Responsive UI for mobile/tablet/desktop

### **Doctor Requirements:**
- ✅ Registration with document upload
- ✅ Admin verification process
- ✅ Secure login with role-based dashboard
- ✅ View all appointment requests
- ✅ Approve/reject appointments with notifications
- ✅ Access consultation history
- ✅ Create medical records during consultation
- ✅ Real-time chat with patients
- ✅ Set consultation fees
- ✅ Manage profile & credentials
- ✅ View past consultation records
- ✅ Notifications for new appointments

### **Admin Requirements:**
- ✅ Authenticate as admin user
- ✅ Dashboard with system statistics
- ✅ View & process doctor registration requests
- ✅ Approve/reject registrations with remarks
- ✅ View all system appointments
- ✅ Manage appointment approvals
- ✅ View user inventory by role
- ✅ List approved doctors
- ✅ Track rejected applications
- ✅ Send email notifications
- ✅ Audit logging of all actions
- ✅ Role-based access control

### **Hospital Admin Requirements:**
- ✅ Register hospital/clinic with details
- ✅ Authenticate as hospital admin
- ✅ Review doctor applications from staff
- ✅ Approve/reject staff doctors
- ✅ Auto-approve own registration as doctor
- ✅ Manage hospital profile information
- ✅ Track affiliated doctors
- ✅ View hospital-specific statistics

---

## AUTHENTICATION & SECURITY USE CASES

### **UC-31: JWT Token Management**
- **Actor:** System, User
- **Precondition:** User logged in
- **Flow:** 
  - Access token stored in localStorage
  - Refresh token in HTTP-only cookie
  - Token includes: userId, email, role
  - Tokens validated on backend for all protected routes
  - Expired token triggers re-login
- **Security:** Token used in Authorization header: `Bearer {token}`

### **UC-32: Role-Based Access Control**
- **Actor:** System
- **Precondition:** User authenticated
- **Flow:**
  - Middleware checks user.role
  - Routes protected with middleware:
    - `authenticateUser` - verifies JWT
    - `isDoctor` - checks role === "doctor"
    - `isadmin` - checks role === "admin" or "ADMIN"
  - Non-authorized users get 403 Forbidden
- **Constraints:** Cannot access other roles' pages

### **UC-33: Field Encryption**
- **Actor:** System
- **Precondition:** Sensitive data being stored
- **Flow:**
  - Appointment reason: encrypted
  - Cancellation reason: encrypted
  - Medical record content: encrypted
  - Uses `mongoose-field-encryption` plugin
  - Decrypted on retrieval with encryption key
- **Purpose:** HIPAA compliance

---

## ADVANCED FEATURES (OPTIONAL USE CASES)

### **UC-34: AI Doctor Matching**
- **Actor:** Patient, System (AI Service)
- **Precondition:** Patient describes symptoms
- **Flow:**
  - Patient inputs symptoms/health info
  - System calls AI service
  - AI analyzes and recommends specializations
  - System returns matching doctors
  - Patient sees recommendations

### **UC-35: FHIR Export**
- **Actor:** Patient, Doctor
- **Precondition:** Medical records available
- **Flow:**
  - User clicks "Export as FHIR"
  - System converts records to FHIR format
  - XML/JSON file generated
  - File sent to external EHR system
  - FHIR compliance verified

### **UC-36: Notification Management**
- **Actor:** System
- **Precondition:** System event triggered
- **Flow:**
  - Doctor approves appointment → Patient notification
  - Appointment payment complete → Doctor notification
  - Consultation started → Both parties notified
  - New appointment request → Doctor notified
  - Registration approved → Doctor notified
  - Notifications show in bell icon with count

---

## FINAL SUMMARY FOR USE CASE DIAGRAM

### **Total Use Cases:** 36+

### **Primary Actors:** 4
- Patient
- Doctor
- Admin
- Hospital Admin

### **System as Actor:** 1

### **Main Flows:**
1. **Pre-Consultation Flow:** Register → Login → Search → Request → Approve
2. **Consultation Flow:** Choose Mode → Payment → Start → Chat → Records
3. **Admin Flow:** Register → Verify → Dashboard → Manage
4. **Hospital Flow:** Register Hospital → Approve Doctors

### **Key Integration Points:**
- Razorpay (payment)
- Socket.IO (real-time)
- Email SMTP (notifications)
- FHIR (medical records)
- MongoDB (data storage)
- JWT (authentication)

---

## MERMAID DIAGRAM HINTS

When creating your use case diagram in Mermaid, structure it as:

```
actor Patient
actor Doctor
actor Admin
actor HospitalAdmin
participant System

Patient -- searches --> SearchDoctors
Patient -- requests --> RequestAppointment
Patient -- pays --> PayForConsultation
Patient -- chats --> ChatWithDoctor

Doctor -- registers --> RegisterAsDoctor
Doctor -- approves --> ApproveAppointment
Doctor -- starts --> StartConsultation
Doctor -- adds --> AddMedicalRecords

Admin -- verifies --> VerifyDoctor
Admin -- approves --> ApproveRegistration
Admin -- manages --> ViewAppointments

System -- sends --> SendEmailNotification
System -- processes --> ProcessPayment
System -- broadcasts --> RealTimeBroadcast
```

---

**Document Version:** 1.0  
**Last Updated:** March 16, 2026  
**Status:** Complete  
**Quality:** Production Ready
