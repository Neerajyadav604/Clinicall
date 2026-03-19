# CLINICALL COMPLETE CODEBASE DOCUMENTATION

**Generated:** March 17, 2026  
**Project:** Clinicall - Healthcare Platform (Backend + Frontend)  
**Documentation Scope:** Every file, every function, every line that matters

---

## TABLE OF CONTENTS

1. [PROJECT OVERVIEW](#project-overview)
2. [BACKEND DOCUMENTATION](#backend-documentation)
3. [FRONTEND DOCUMENTATION](#frontend-documentation)
4. [DATABASE DOCUMENTATION](#database-documentation)
5. [INTEGRATION DOCUMENTATION](#integration-documentation)
6. [KNOWN GAPS & OBSERVATIONS](#known-gaps--observations)

---

# PROJECT OVERVIEW

## What the Project Does

Clinicall is a healthcare consultation platform that enables:
- **Patients (Users):** Book appointments, view medical records using FHIR standard, manage health data, receive diagnoses and prescriptions
- **Doctors:** Manage patient appointments, create clinical notes (conditions, observations, prescriptions), access medical records with consent
- **Admins:** Manage doctor registrations, approve/reject doctors, view system statistics, send notifications
- **Hospitals:** Register and manage hospital profiles

## User Types

1. **Patient/User (`role: "user"`):** General users who book appointments and view records
2. **Doctor (`role: "doctor"`):** Medical professionals who serve patients
3. **Admin (`role: "admin"`):** System administrators for content moderation
4. **Hospital Admin (`role: "hospital_admin"`):** Hospital staff managing hospital profile

## Tech Stack

### Backend
- **Framework:** Express.js 5.2.1
- **Language:** Node.js (JavaScript)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO 4.8.3
- **File Upload:** Cloudinary (image/document storage)
- **Payment:** Razorpay (Indian payment gateway)
- **Email:** Nodemailer
- **Security:** bcrypt, helmet, express-mongo-sanitize, xss-clean, field-encryption
- **Validation:** Custom middleware + joi (optionally)
- **FHIR Standard:** Full R4 compliance for electronic health records

### Frontend
- **Framework:** React 19.2.3 with React Router DOM 7.12.0
- **State Management:** Redux Toolkit 2.11.2 + React Redux 9.2.0
- **HTTP Client:** Axios 1.13.3
- **Real-time:** Socket.IO Client 4.8.3
- **Styling:** Tailwind CSS with custom components
- **File Upload:** Drag-and-drop support with validation
- **Forms:** React Hook Form 7.71.1
- **PDF Export:** jsPDF 4.2.0
- **Notifications:** React-Toastify 11.0.5
- **Testing:** Playwright E2E tests
- **UI Components:** Radix UI, Lucide Icons, Tabler Icons

### Third-Party Services
- **Cloudinary:** Cloud file storage and image transformations
- **Razorpay:** Payment processing (Indian business, international payment support)
- **Nodemailer:** Email notifications (SMTP-based)
- **Socket.IO:** Real-time bidirectional communication (consultation chat, notifications)

## Folder Structure

```
clinicall-backend/
├── server/                          # Express backend
│   ├── Controllers/                 # Request handlers (business logic)
│   │   ├── Auth.js                 # Login/signup/refresh token
│   │   ├── AdminController.js      # Admin dashboard endpoints
│   │   ├── AdminAnalyticsController.js # Admin stats/reporting
│   │   ├── Profile.js              # User/doctor profile CRUD
│   │   ├── ManageAppoinment.js     # Appointment request/approval
│   │   ├── Payment.js              # Razorpay order creation & verification
│   │   ├── Displaydoctors.js       # Doctor search
│   │   ├── HospitalController.js   # Hospital CRUD
│   │   ├── consultationController.js # Live consultation logic
│   │   ├── AIController.js         # AI-powered diagnosis
│   │   ├── Notification.js         # Notification creation/retrieval
│   │   └── RatingandReview.js      # Rating system
│   │
│   ├── Routes/                      # Express routes
│   │   ├── Auth.js                 # Auth endpoints
│   │   ├── Doctor.js               # Doctor profile/appointment endpoints
│   │   ├── Admin.js                # Admin management endpoints
│   │   ├── Payment.js              # Payment endpoints
│   │   ├── UserRequests.js         # Appointment request endpoints
│   │   ├── fhir.js                 # FHIR R4 clinical data endpoints (33 endpoints)
│   │   ├── ConsentApi.js           # Simplified consent endpoints
│   │   ├── consultation.routes.js  # Live consultation WebRTC endpoints
│   │   ├── Notification.js         # Notification endpoints
│   │   ├── Hospital.js             # Hospital endpoints
│   │   ├── Registration.js         # Doctor registration approval
│   │   ├── AI.js                   # AI endpoints
│   │   ├── AdminAnalytics.js       # Admin analytics endpoints
│   │   └── oauth.js                # OAuth authentication
│   │
│   ├── Models/                      # MongoDB schemas (Mongoose)
│   │   ├── User.js                 # User (patient/doctor/admin)
│   │   ├── Doctor.js               # Doctor profile & verification
│   │   ├── Appointment.js          # Appointment with payment status
│   │   ├── DoctorProfile.js        # Extended doctor details
│   │   ├── DoctorRegistration.js   # Doctor registration requests
│   │   ├── UserProfile.js          # Extended user details
│   │   ├── ConsultationSession.js  # Live consultation state
│   │   ├── MedicalRecord.js        # Prescriptions, lab results, vitals
│   │   ├── ChatMessage.js          # Chat messages with file attachments
│   │   ├── Condition.js            # FHIR Condition (diagnoses)
│   │   ├── Observation.js          # FHIR Observation (vitals, labs)
│   │   ├── Medication.js           # FHIR Medication
│   │   ├── MedicationRequest.js    # FHIR MedicationRequest (prescriptions)
│   │   ├── DiagnosticReport.js     # FHIR DiagnosticReport (lab reports)
│   │   ├── Procedure.js            # FHIR Procedure (medical procedures)
│   │   ├── Immunization.js         # FHIR Immunization (vaccination)
│   │   ├── AllergyIntolerance.js   # FHIR Allergy (allergies)
│   │   ├── DocumentReference.js    # FHIR DocumentReference (file attachments)
│   │   ├── Consent.js              # FHIR Consent (patient consent records)
│   │   ├── ConsentRequest.js       # Consent request from doctor to patient
│   │   ├── Payment.js              # Payment transaction records
│   │   ├── Hospital.js             # Hospital profile
│   │   ├── HospitalRegistration.js # Hospital registration requests
│   │   ├── OTP.js                  # One-time passwords for signup
│   │   ├── Notification.js         # User notifications
│   │   ├── SymptomAnalysis.js      # AI symptom analysis
│   │   ├── RatingandReview.js      # Doctor ratings and reviews
│   │   ├── AuditEvent.js           # FHIR AuditEvent (compliance logging)
│   │   ├── AuditLog.js             # Application-level audit logs
│   │   ├── ExportJob.js            # FHIR data export job tracking
│   │   ├── Breach.js               # Breach incident tracking
│   │   ├── SyncLog.js              # Data synchronization logs
│   │   ├── RefreshToken.js         # JWT refresh token storage
│   │   └── Consultation.js         # Legacy consultation data
│   │
│   ├── Middleware/                  # Express middleware
│   │   ├── authMiddleware.js       # JWT verification, user lookup, role checking
│   │   ├── errorHandler.js         # Global error handler with FHIR support
│   │   ├── consentMiddleware.js    # Consent verification for FHIR access
│   │   ├── requirePayment.js       # Payment gate enforcement
│   │   ├── auditLogger.js          # HIPAA audit logging
│   │   ├── rateLimiter.js          # Rate limiting (auth, FHIR, payments)
│   │   ├── validation.js           # Input validation
│   │   ├── phiSanitizer.js         # PHI (Protected Health Information) sanitization
│   │   └── sessionMiddleware.js    # Session management (optional)
│   │
│   ├── Config/                      # Configuration files
│   │   ├── Database.js             # MongoDB connection with diagnostics
│   │   ├── Cloudinary.js           # Cloud storage setup
│   │   ├── oauth.js                # OAuth provider config
│   │   ├── razorpay.js             # Razorpay API config
│   │   ├── production.js           # Production-specific config
│   │   ├── logger.js               # Logging setup
│   │   └── DatabaseAlternative.js  # Alternative DB connection (backup)
│   │
│   ├── Utils/                       # Utility functions
│   │   ├── token.js                # JWT creation, verification, refresh
│   │   ├── fhirTransformer.js      # Convert app data to FHIR format
│   │   ├── fhirExporter.js         # Export patient records (FHIR JSON/XML)
│   │   ├── fhirValidator.js        # Validate FHIR payloads
│   │   ├── sendNotification.js     # Notification sender (email/socket/in-app)
│   │   ├── updateUserProfile.js    # Profile update logic
│   │   ├── cloudinary.js           # Cloudinary wrapper
│   │   ├── consentFlow.js          # Consent request/approval logic
│   │   ├── encryptionHelper.js     # Field encryption helpers
│   │   └── errorMessages.js        # Standardized error messages
│   │
│   ├── Mail/                        # Email templates
│   │   ├── templates/              # HTML email templates
│   │   └── mailSender.js           # Nodemailer SMTP setup
│   │
│   ├── Scripts/                     # Utility scripts
│   │   ├── seedDatabase.js         # Initial data setup
│   │   ├── migrateData.js          # Data migration scripts
│   │   └── generateDoc.js          # API documentation generator
│   │
│   ├── Logs/                        # Application logs directory
│   ├── index.js                    # Express server entry point
│   ├── package.json                # Backend dependencies
│   ├── .env                        # Environment variables (local)
│   └── .env.example                # Template for environment variables
│
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── pages/                  # Full-page components (routes)
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # User login
│   │   │   ├── Signup.jsx          # User registration
│   │   │   ├── VerifyEmail.jsx     # OTP verification
│   │   │   ├── MyProfile.jsx       # User profile view
│   │   │   ├── EditProfile.jsx     # Profile edit form
│   │   │   ├── DoctorSearch.jsx    # Find doctors (with filters)
│   │   │   ├── Apponintment.jsx    # Book appointment
│   │   │   ├── MyRequests.jsx      # View appointment requests
│   │   │   ├── MedicalRecords.jsx  # View FHIR medical records
│   │   │   ├── FhirConnect.jsx     # FHIR data integration
│   │   │   ├── ConsultationPage.jsx # Live consultation (video/chat)
│   │   │   ├── Chat.jsx            # Chat with doctor
│   │   │   ├── DoctorRegistrationPage.jsx # Doctor signup flow
│   │   │   ├── HospitalRegistrationPage.jsx # Hospital signup
│   │   │   ├── HospitalList.jsx    # Browse hospitals
│   │   │   ├── HospitalProfile.jsx # Hospital details
│   │   │   ├── HospitalAdminDashboard.jsx # Hospital admin panel
│   │   │   ├── AboutUs.jsx         # About page
│   │   │   ├── ContactUs.jsx       # Contact form
│   │   │   └── Test.jsx            # Dev testing page
│   │   │
│   │   ├── components/             # Reusable components
│   │   │   ├── GlobalNavbar.jsx    # Main navigation bar
│   │   │   ├── ProtectedRoute.jsx  # Route guard (role-based)
│   │   │   ├── chat/               # Chat feature components
│   │   │   │   ├── ChatWidget.jsx  # Chat sidebar widget
│   │   │   │   ├── ChatBox.jsx     # Chat message view
│   │   │   │   ├── RecentChats.jsx # Recent conversations
│   │   │   │   └── ChatInput.jsx   # Message input
│   │   │   ├── consultation/       # Live consultation components
│   │   │   │   ├── VideoPanel.jsx  # Video call container
│   │   │   │   ├── ChatPanel.jsx   # Consultation chat
│   │   │   │   ├── MedicalView.jsx # Medical data display
│   │   │   │   ├── ScreenShare.jsx # Screen sharing
│   │   │   │   └── SessionTimer.jsx # Session countdown
│   │   │   ├── admin/              # Admin panel components
│   │   │   │   ├── AdminSidebar.jsx # Admin menu
│   │   │   │   ├── DoctorMgmt.jsx  # Doctor management
│   │   │   │   ├── UserStats.jsx   # Statistics dashboard
│   │   │   │   └── NotificationUI.jsx # Send emails
│   │   │   ├── doctor/             # Doctor-specific components
│   │   │   │   ├── DoctorDashboard.jsx # Doctor home
│   │   │   │   ├── ClinicalNotes.jsx # Create diagnoses/prescriptions
│   │   │   │   ├── DoctorAppointments.jsx # Manage appointments
│   │   │   │   ├── PatientRecords.jsx # Access patient history
│   │   │   │   └── ConsentRequest.jsx # Request data access
│   │   │   ├── common/             # Shared components
│   │   │   │   ├── Loading.jsx     # Loading spinner
│   │   │   │   ├── ErrorBoundary.jsx # Error handling
│   │   │   │   ├── Navbar.jsx      # Navigation
│   │   │   │   ├── Footer.jsx      # Footer
│   │   │   │   ├── Modal.jsx       # Generic modal
│   │   │   │   ├── Button.jsx      # Button variants
│   │   │   │   ├── Input.jsx       # Form inputs
│   │   │   │   ├── Card.jsx        # Card layout
│   │   │   │   └── FhirErrorToast.jsx # FHIR error display
│   │   │   └── forms/              # Form components
│   │   │       ├── AppointmentForm.jsx # Book appointment
│   │   │       ├── ProfileForm.jsx # Edit profile
│   │   │       └── ConsentForm.jsx # Consent management
│   │   │
│   │   ├── services/               # API client and business logic
│   │   │   ├── api.js              # Axios instance with tokens
│   │   │   ├── authService.js      # Login/signup API calls
│   │   │   ├── operationApi.js     # All API operation definitions
│   │   │   │   ├── operations/
│   │   │   │   │   ├── authApi.js  # Auth endpoints wrapper
│   │   │   │   │   ├── appointmentApi.js # Appointment endpoints
│   │   │   │   │   ├── fhirApi.js  # FHIR operations
│   │   │   │   │   ├── paymentApi.js # Payment endpoints
│   │   │   │   │   ├── consentApi.js # Consent endpoints
│   │   │   │   │   ├── consultationApi.js # Consultation endpoints
│   │   │   │   │   ├── profileApi.js # Profile endpoints
│   │   │   │   │   └── notificationApi.js # Notification endpoints
│   │   │   ├── fhirApi.js          # FHIR helper functions
│   │   │   └── authSession.js      # Session initialization
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.js          # Auth state hook
│   │   │   ├── useSocket.js        # Socket connection hook
│   │   │   ├── useConsultation.js  # Consultation state hook
│   │   │   ├── useFhir.js          # FHIR data hook
│   │   │   ├── usePayment.js       # Payment hook
│   │   │   └── usePagination.js    # Pagination hook
│   │   │
│   │   ├── slices/                 # Redux state slices
│   │   │   ├── authSlice.js        # Auth state (login, user, token)
│   │   │   ├── appointmentSlice.js # Appointment state
│   │   │   ├── fhirSlice.js        # FHIR data state
│   │   │   ├── consentSlice.js     # Consent state
│   │   │   ├── consultationSlice.js # Consultation state
│   │   │   ├── notificationSlice.js # Notification state
│   │   │   └── uiSlice.js          # UI state (modals, loading)
│   │   │
│   │   ├── routes/                 # Route configurations
│   │   │   ├── AdminRoutes.jsx     # Admin-only routes
│   │   │   ├── DoctorRoutes.jsx    # Doctor-only routes
│   │   │   └── ProtectedRoutes.jsx # Role-based route wrapping
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── socketManager.js    # Socket.IO client setup
│   │   │   ├── validators.js       # Form validation rules
│   │   │   ├── dateFormatter.js    # Date/time formatting
│   │   │   ├── fileUploadHelper.js # File upload wrapper
│   │   │   ├── errorHandler.js     # API error processing
│   │   │   ├── parseFhir.js        # FHIR response parsing
│   │   │   ├── constants.js        # App-wide constants
│   │   │   └── formatters.js       # Data formatting utilities
│   │   │
│   │   ├── assets/                 # Static files
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── lib/                    # Third-party library wrappers
│   │   │   ├── cn.js               # Classname utility
│   │   │   └── axios.js            # Axios configuration
│   │   │
│   │   ├── data/                   # Static data files
│   │   │   ├── specializations.json # Doctor specializations
│   │   │   ├── states.json         # Indian states
│   │   │   └── bloodGroups.json    # Blood group options
│   │   │
│   │   ├── codex/                  # Code examples/documentation
│   │   ├── styles/                 # CSS modules
│   │   │   ├── App.css             # Global styles
│   │   │   ├── index.css           # Base styles
│   │   │   └── components/         # Component-specific styles
│   │   │
│   │   ├── App.js                  # Root component
│   │   ├── index.js                # React entry point
│   │   ├── store.js                # Redux store configuration
│   │   ├── setupTests.js           # Test configuration
│   │   └── reportWebVitals.js      # Performance monitoring
│   │
│   ├── public/                      # Static HTML assets
│   │   └── index.html              # HTML template
│   │
│   ├── package.json                # Frontend dependencies
│   ├── tsconfig.json               # TypeScript configuration (partial)
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS configuration
│   └── .env                        # Frontend environment variables
│
├── tests/                           # E2E test files (Playwright)
│   ├── Userprofileedittest.spec.ts # User profile edit tests
│   ├── authTests.spec.ts           # Authentication tests
│   ├── appointmentTests.spec.ts    # Appointment booking tests
│   ├── fhirTests.spec.ts           # FHIR API tests
│   ├── paymentTests.spec.ts        # Payment flow tests
│   ├── consultationTests.spec.ts   # Consultation feature tests
│   └── helpers/                    # Test utilities
│
├── playwright/                      # Playwright test configuration
│   ├── fixtures/                   # Test fixtures
│   ├── helpers/                    # Test helpers
│   └── reporters/                  # Custom reporters
│
├── LogFiles/                        # Documentation & debug logs
│   ├── ARCHITECTURE_REFERENCE.md   # Backend architecture guide
│   ├── FHIR_API.md                 # FHIR API complete documentation
│   ├── PAYMENT_GATE_COMPLETE.md    # Payment implementation details
│   ├── LIVE_CONSULTATION_FEATURE_SUMMARY.md # Consultation feature docs
│   └── ... (many audit and implementation docs)
│
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Root package (Playwright, scripts)
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Project readme
└── COMPLETE_CODEBASE_DOCUMENTATION.md # THIS FILE

```

## How Data Flows: Frontend → Backend → Database

### Example Flow: User Booking an Appointment

1. **Frontend (React)**: User fills appointment form → validates → calls API
2. **HTTP Request**: POST /api/v1/auth/appointment/request/:doctorId
   - Headers: `Authorization: Bearer <JWT_token>`
   - Body: `{ appointmentDate, appointmentTime, reason }`
3. **Backend Middleware**: 
   - `authMiddleware` extracts & verifies JWT
   - Sets `req.user` with user data
4. **Controller** (ManageAppoinment.js):
   - Validates appointment details
   - Creates Appointment record in MongoDB
   - Sends socket notification to doctor
5. **Database**: Mongoose saves document to `appointments` collection
6. **Response**: Returns appointment object with ID
7. **Frontend Redux**: Stores appointment in state
8. **Socket.IO**: Doctor receives real-time notification via WebSocket

### Example Flow: Doctor Creating a Clinical Note (FHIR Condition)

1. **Frontend**: Doctor fills clinical notes form → selects ICD-10 code
2. **HTTP Request**: POST /api/v1/fhir/R4/Condition
   - Headers: `Authorization: Bearer <JWT_token>`
   - Body: FHIR Condition resource (JSON)
3. **Backend Middleware**:
   - `authMiddleware` verifies doctor token
   - `requirePayment` checks if appointment is paid
   - `consentMiddleware` verifies patient consent
4. **Controller** (fhir.js route handler):
   - Validates FHIR payload
   - Parses ICD-10 code
   - Creates Condition document
5. **Database**: Condition saved to MongoDB
6. **Frontend**: Displays confirmation, updates patient's medical records view

---

# BACKEND DOCUMENTATION

## KEY BACKEND CONCEPTS

### Authentication Flow (JWT)
1. User signs up → receives OTP via email
2. Enters OTP + password → backend creates access token + refresh token
3. Access token stored in localStorage (frontend) or cookies (secure flag)
4. Token includes: `id`, `email`, `role`
5. Refresh token stored in DB, used to generate new access token when expired

### Authorization Levels
- **No auth required**: /signup, /login, /sendotp, public endpoints
- **authenticateUser**: Any logged-in user (patient, doctor, admin)
- **isDoctor**: Only users with doctor role
- **isadmin**: Only users with admin role
- **requirePayment**: Blocks access until appointment is paid

### Socket.IO Real-time Events
Established after user login via `connectSocket(token)`:
- **Chat**: `join_chat`, `send_message`, `typing`, `read_message`
- **Consultation**: `join_consultation`, `leave_consultation`, `session_update`
- **Consent**: `requestConsent`, `consentApproved`, `consentRejected`
- **Notifications**: `joinRoom:<userId>`, `notification`
- **Doctor Availability**: `doctorOnline`, `doctorOffline`

### Payment Gate
- Appointment starts with `paymentStatus: "unpaid"`, `consultationStatus: "locked"`
- `requirePayment` middleware blocks FHIR endpoints if unpaid
- After Razorpay success → `paymentStatus: "paid"`, `consultationStatus: "active"`
- Doctor can then create clinical notes, view full patient history

---

## SERVER/INDEX.JS

**File Path:** `server/index.js`  
**Purpose:** Express server entry point, Socket.IO initialization, middleware setup, route registration

### Imports
```javascript
const path = require('path');
require('dotenv').config();                // Load .env file
const http = require("http");             // HTTP server creation
const os = require("os");                 // OS utilities
const EventEmitter = require('events');   // Event system

const express = require("express");       // Web framework
const socketIo = require("socket.io");    // Real-time WebSocket

// Security
const helmet = require('helmet');                      // HTTP headers
const cors = require("cors");                          // Cross-origin
const cookieParser = require('cookie-parser');        // Cookie parsing
const session = require('express-session');           // Session management
const mongoSanitize = require('express-mongo-sanitize'); // Prevent NoSQL injection
const { clean: xssClean } = require('xss-clean/lib/xss'); // XSS prevention

// Internal
const connectDb = require('./config/Database');
const { connectCloudinary } = require('./config/Cloudinary');

// Routes  
const Auth = require("./routes/Auth");
const Doctor = require("./routes/Doctor");
const UserRequests = require("./routes/UserRequests");
const Payment = require("./routes/Payment");
const Registration = require("./routes/Registration");
const Admin = require("./routes/Admin");
const Hospital = require("./routes/Hospital");
const AI = require("./routes/AI");
const NotificationRoutes = require("./routes/Notification");
const OAuth = require("./routes/oauth");
const consultationRoutes = require("./routes/consultation.routes");
const consentRoutes = require("./routes/ConsentApi");
const fhirRoutes = require('./routes/fhir');
const adminAnalyticsRoutes = require('./routes/AdminAnalytics');
```

### Top-Level Variables
```javascript
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const io = socketIo(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});
app.set('io', io);
```

### Security Middleware Setup

#### CSP Nonce Generator (Lines 90-97)
```javascript
const cspNonceGenerator = (req, res, next) => {
  const crypto = require('crypto');
  res.locals.nonce = crypto.randomBytes(16).toString('hex');
  next();
};
```
**Purpose:** Generates random nonce for Content Security Policy, prevents inline script execution  
**Side Effects:** Sets `res.locals.nonce` for templating

#### Helmet Configuration (Line 99+)
- **CSP (Content Security Policy):** Restricts script/style sources to `'self'` + nonce
- **HSTS:** Forces HTTPS, 1-year max-age
- **X-Frame-Options:** Prevent clickjacking
- **X-Content-Type-Options:** nosniff (prevent MIME sniffing)

**Vulnerability Mitigated:** XSS, clickjacking, cache poisoning

#### CORS Configuration (Line 118+)
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```
**Purpose:** Allow cross-origin requests from frontend, include credentials (cookies)  
**Vulnerability Mitigated:** CSRF, unauthorized API access

### Session Middleware (Lines 142-155)
```javascript
if (!process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  },
}));
```
**Purpose:** Manage server-side sessions, set secure cookies  
**Missing Validation:** ❌ No check if SESSION_SECRET meets minimum length requirements

### Body & Cookie Parsing (Lines 168-169)
```javascript
app.use(express.json({ type: ['application/json', 'application/fhir+json'] }));
app.use(cookieParser());
```
- Supports standard JSON and FHIR+JSON content types
- Parses cookies into `req.cookies` object

### Sanitization Middleware (Lines 175-200)
```javascript
// Mongo sanitize
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body,   { allowDots: true });
  if (req.params) req.params = mongoSanitize.sanitize(req.params, { allowDots: true });
  next();
});

// XSS clean
app.use((req, res, next) => {
  if (req.body)   req.body   = xssClean(req.body);
  if (req.params) req.params = xssClean(req.params);
  if (req.query) {
    const cleaned = xssClean(req.query);
    Object.assign(req.query, cleaned);
  }
  next();
});
```
**Purpose:**
- **Mongo sanitize:** Removes `$` and `.` from keys to prevent `{$ne: null}` injection
- **XSS clean:** Escapes HTML entities in strings
- **allowDots: true:** Preserves ICD-10 codes (J06.9)

**Known Issue:** ⚠️ XSS clean mutates in-place, req.query is read-only getter prop in newer Node versions

### External Services Connection (Lines 220+)
```javascript
connectCloudinary();
console.log('✅ [STARTUP] Cloudinary connected');
```

### Route Registration (Lines ~280+)
```javascript
app.use("/api/v1/auth", Auth);
app.use("/api/v1/profile", Auth);  // Profile endpoints mixed with auth
app.use("/api/v1/doctor", Doctor);
app.use("/api/v1/appointments", UserRequests);
app.use("/api/v1/payment", Payment);
app.use("/api/v1/registration", Registration);
app.use("/api/v1/admin", Admin);
app.use("/api/v1/hospital", Hospital);
app.use("/api/v1/ai", AI);
app.use("/api/v1/notification", NotificationRoutes);
app.use("/api/v1/oauth", OAuth);
app.use("/api/v1/consultation", consultationRoutes);
app.use("/api/v1/consent", consentRoutes);
app.use("/api/v1/fhir/R4", fhirRoutes);  // FHIR must be at specific path
app.use("/api/v1/admin/analytics", adminAnalyticsRoutes);
```

### Socket.IO Event Handlers

#### Connection (Line ~340)
```javascript
io.on('connection', (socket) => {
  console.log('🔌 [SOCKET] User connected:', socket.id);
  
  // ... event handlers below
});
```

#### Chat Events
```javascript
socket.on('join_chat', (appointmentId) => {
  socket.join(`chat_${appointmentId}`);
  io.to(`chat_${appointmentId}`).emit('user_joined', { userId: socket.user_id });
});

socket.on('send_message', (data) => {
  const { appointmentId, message, senderId, senderRole } = data;
  io.to(`chat_${appointmentId}`).emit('receive_message', {
    message,
    senderId,
    senderRole,
    timestamp: new Date()
  });
});

socket.on('typing', (appointmentId) => {
  socket.to(`chat_${appointmentId}`).emit('user_typing', { userId: socket.user_id });
});
```

#### Consultation Events
```javascript
socket.on('join_consultation', (data) => {
  const { appointmentId, userId } = data;
  socket.join(`consultation_${appointmentId}`);
});

socket.on('leave_consultation', (appointmentId) => {
  socket.leave(`consultation_${appointmentId}`);
  io.to(`consultation_${appointmentId}`).emit('user_left', { message: 'User left consultation' });
});
```

#### Notification Events
```javascript
socket.on('joinRoom', (userId) => {
  socket.join(`notification_${userId}`);
});

// Emit notification to user
io.to(`notification_${userId}`).emit('notification', {
  title: 'Appointment Approved',
  message: 'Doctor approved your appointment request',
  type: 'success'
});
```

### Error Handling Middleware (Final Route, Line ~400)
```javascript
const { errorMiddleware } = require('./middleware/errorHandler');
app.use(errorMiddleware);
```

### Server Startup (Line ~410)
```javascript
connectDb().then(() => {
  server.listen(PORT, () => {
    process.stdout.write(`\n✅ [READY] Server running on port ${PORT}\n`);
    process.stdout.write(`📍 [READY] API Base URL: http://localhost:${PORT}/api/v1\n`);
  });
}).catch((err) => {
  console.error('❌ [FATAL] Database connection failed:', err);
  process.exit(1);
});
```

---

## SERVER/MIDDLEWARE/AUTHMIDDLEWARE.JS

**File Path:** `server/middleware/authMiddleware.js`  
**Purpose:** Verify JWT tokens, load user from DB, attach user to request, role-based access control

### Function: `authenticateUser(req, res, next)`

**Parameters:**
- `req` (Express Request): Contains headers, cookies
- `res` (Express Response): For sending error responses
- `next` (Function): Calls next middleware

**Return Value:** None (calls `next()` on success, `res.status().json()` on failure)

**Step-by-Step Logic:**

1. **Extract Token** (Lines 9-48)
   - Check `Authorization: Bearer <token>` header first
   - Fall back to `req.cookies.token`
   - Validate token exists and is non-empty string
   - Logs extensive details for debugging

2. **Validate JWT Format** (Lines 50-64)
   - Regex check: `/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/`
   - JWT has 3 parts separated by dots
   - Returns 401 if malformed

3. **Verify JWT Signature** (Lines 66-124)
   - Calls `verifyAccessToken(token)` from utils/token.js
   - Decodes payload: gets user ID, email, role
   - On error: catches ExpiredSignatureError, JsonWebTokenError, etc.

4. **Database Lookup** (Lines 70-106)
   - Queries `User.findById(decoded.id)`
   - Checks if user exists in database
   - Returns 401 if user deleted or id doesn't match

5. **Attach User** (Line 108)
   - Sets `req.user = user` for downstream middleware/controllers
   - Calls `next()` to proceed

### Function: `isDoctor(req, res, next)`

**Parameters:** Same as authenticateUser

**Return Value:** None

**Logic:**
```javascript
const isDoctor = async (req, res, next) => {
  try {
    // User already authenticated by prior middleware
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access this resource"
      });
    }
    
    // Load full doctor profile
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
    }
    
    req.doctor = doctor;  // Attach for downstream use
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

**Checks:**
- `user.role === "doctor"`
- Doctor profile exists in DB
- Sets `req.doctor` for controller use

### Function: `isadmin(req, res, next)`

**Logic:** Almost identical to `isDoctor`, but checks:
- `user.role === "admin"`
- No additional profile lookup needed

**Used For:** Admin-only routes like `/admin/users`, `/admin/approvals`

---

## SERVER/MIDDLEWARE/ERRORHANDLER.JS

**File Path:** `server/middleware/errorHandler.js`  
**Purpose:** Catch and format all errors, support FHIR OperationOutcome, prevent information leaks

### Class: `AppError(message, statusCode)`

**Constructor Parameters:**
- `message` (string): User-facing error message
- `statusCode` (number): HTTP status code

**Properties:**
- `isOperational: true` - Distinguishes expected errors from bugs
- Stack trace captured with `Error.captureStackTrace()`

**Usage Example:**
```javascript
throw new AppError('Appointment not found', 404);
throw new AppError('Unauthorized access', 403);
throw new AppError('Payment required', 402);
```

### Function: `toFhirOperationOutcome(statusCode, message, diagnostics)`

**Parameters:**
- `statusCode` (number): HTTP status code
- `message` (string): User message
- `diagnostics` (string, optional): Technical details for FHIR clients

**Return Value:** FHIR OperationOutcome resource (JSON)

**Example Output:**
```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "details": { "text": "Patient record not found" },
      "diagnostics": "Patient ID 123 does not exist in database"
    }
  ]
}
```

**Severity Mapping:**
- 5xx errors → "fatal"
- 4xx errors → "error"
- 2xx/3xx → "warning"

### Middleware: `errorMiddleware(err, req, res, next)`

**Parameters:**
- `err` (Error): The error object
- `req, res, next`: Standard Express middleware params

**Logic Flow:**

1. **Detect FHIR Request** (Line 20)
   ```javascript
   const isFhirRequest = req.path.includes('/fhir/');
   ```

2. **Log Error** (Lines 24-31)
   - Logs error type, message, status code, stack trace
   - Always happens, regardless of environment

3. **Send Response Based on Type** (Lines 33-62)
   ```javascript
   if (err.isOperational) {
     // Expected error - send to client
     if (isFhirRequest) {
       res.status(statusCode).json(toFhirOperationOutcome(...));
     } else {
       res.status(statusCode).json({ success: false, message: err.message });
     }
   } else {
     // Unexpected error - don't leak details in production
     const response = { success: false, message: 'An unexpected error occurred' };
     if (process.env.NODE_ENV !== 'production') {
       response.error_details = err.message;
       response.error_type = err.constructor.name;
     }
     res.status(500).json(response);
   }
   ```

**Missing Error Types:** ⚠️ No specific handling for:
- MongoDB validation errors (field required)
- JWT expiration (should suggest refresh endpoint)
- Rate limit errors (should return 429, not 503)

---

## SERVER/CONFIG/DATABASE.JS

**File Path:** `server/config/Database.js`  
**Purpose:** Establish MongoDB connection with comprehensive diagnostics

### Function: `connectDb()`

**Parameters:** None  
**Return Value:** Promise (resolves when connected, rejects on failure)

**Step 1: Environment Validation**
```javascript
if (!process.env.DATABASEURL) {
  throw new Error("DATABASEURL environment variable not set...");
}
```

**Step 2: Connection String Validation**
- Checks protocol starts with `mongodb://` or `mongodb+srv://`
- Verifies credentials present (has `@` symbol)
- Parses URI to extract hostname, database, username

**Step 3: Connection Options** (Lines ~80-100)
```javascript
const options = {
  serverSelectionTimeoutMS: 30000,  // Find server in 30s
  socketTimeoutMS: 45000,            // Operation timeout
  maxPoolSize: 10,                   // Connection pool size
  minPoolSize: 2,                    // Keep 2 warm
  maxIdleTimeMS: 30000,              // Close idle after 30s
  retryWrites: true,
  retryReads: true,
};
```

**Step 4: Establish Connection** (Line ~110)
```javascript
const conn = await mongoose.connect(process.env.DATABASEURL, options);
```

**Step 5: Connection Events** (Lines ~120-160)
```javascript
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected unexpectedly');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
```

**Return Statement:**
```javascript
return {
  host: conn.connection.host,
  db: conn.connection.name,
  message: 'Database connected successfully'
};
```

**Error Handling Categories Covered:**
1. ✅ Missing environment variable
2. ✅ Invalid protocol
3. ✅ Missing credentials
4. ✅ URI parsing error
5. ✅ Hostname resolution failure
6. ✅ Authentication failure
7. ✅ Network timeout
8. ✅ Server selection timeout
9. ✅ Operation timeout
10. ✅ Connection pool exhaustion

**Missing:** ❌ No check for SSL certificate validation (mongodb+srv should verify)

---

## SERVER/MODELS/USER.JS

**File Path:** `server/models/User.js`  
**Purpose:** MongoDB schema for users (patients, doctors, admins)

**Collection Name:** `users`

### Schema Definition

```javascript
const UserSchema = new mongoose.Schema({
  // Role system (dual role fields for backward compatibility)
  roles: {
    type: [String],
    enum: ["user", "admin", "doctor", "hospital_admin"],
    default: ["user"]
  },
  role: {
    type: String,
    enum: ["user", "admin", "doctor", "hospital_admin"],
    default: "user"
  },
  
  // Basic info
  fullName: { type: String },
  email: { type: String, unique: true },
  contact: { type: String },
  password: { type: String },
  
  // Security
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },  // Account lock timestamp
  
  // References
  additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "userProfile" },
  doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "doctorProfile" },
  
  // Profile picture
  image: { type: String, trim: true, default: null },
  
  // Authentication token
  token: { type: String }
}, { timestamps: true })
```

### Field Details

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|-----------|
| `roles` | `[String]` | No | `["user"]` | Enum: user, admin, doctor, hospital_admin |
| `role` | String | No | `"user"` | Enum: user, admin, doctor, hospital_admin |
| `fullName` | String | No | - | None |
| `email` | String | No | - | Unique index |
| `contact` | String | No | - | None |
| `password` | String | No | - | Hashed with bcrypt |
| `failedLoginAttempts` | Number | No | `0` | Used for account locking |
| `lockUntil` | Date | No | - | Timestamp when to unlock |
| `additionalDetails` | ObjectId | No | - | Ref to UserProfile |
| `doctorProfile` | ObjectId | No | - | Ref to DoctorProfile |
| `image` | String | No | `null` | Cloudinary URL |
| `token` | String | No | - | JWT token |

### Indexes
- `email`: Unique index (prevents duplicate registrations)

### Missing/Improvements Needed
- ⚠️ No password confirmation on stored password
- ⚠️ No password change timestamp
- ⚠️ No email verification flag
- ⚠️ No phone verification flag
- ❌ No password reset token

---

## SERVER/MODELS/APPOINTMENT.JS

**File Path:** `server/models/Appointment.js`  
**Purpose:** Appointment bookings with payment status, consultation tracking

**Collection Name:** `appointments`

### Schema Definition

```javascript
const AppointmentSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  
  // Appointment details
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  status: {
    type: String,
    enum: ["SCHEDULED", "COMPLETED", "NOT SCHEDULED"],
    default: "NOT SCHEDULED"
  },
  reason: { type: String },  // Encrypted
  
  // Payment gate fields ✅
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid"
  },
  consultationStatus: {
    type: String,
    enum: ["locked", "active", "completed"],
    default: "locked"
  },
  paidAt: { type: Date, default: null },
  
  // Doctor approval
  approvalstatus: {
    type: String,
    enum: ["APPROVED", "REJECTED", "PENDING", "CANCELLED"],
    default: "PENDING"
  },
  cancellationReason: { type: String },  // Encrypted
  
  // Consultation mode
  consultationMode: {
    type: String,
    enum: ["online", "offline"],
    default: null
  },
  isChatEnabled: { type: Boolean, default: false }
}, { timestamps: true })

// Field encryption for PHI (Protected Health Information)
AppointmentSchema.plugin(fieldEncryption, {
  fields: ['reason', 'cancellationReason'],
  secret: process.env.FIELD_ENC_KEY
});
```

### Field Details

| Field | Type | Validation | Encryption | Purpose |
|-------|------|-----------|-----------|---------|
| `userId` | ObjectId | Required, ref User | No | Patient reference |
| `doctorId` | ObjectId | Required, ref Doctor | No | Doctor reference |
| `appointmentDate` | Date | Required | No | When appointment is |
| `appointmentTime` | String | Required | No | HH:MM format |
| `status` | String | Enum (3 values) | No | Appointment status |
| `reason` | String | None | **YES** | Why patient visiting |
| `paymentStatus` | String | Enum (3 values) | No | Payment state (payment gate) |
| `consultationStatus` | String | Enum (3 values) | No | Locked until payment |
| `paidAt` | Date | None | No | When payment verified |
| `approvalstatus` | String | Enum (4 values) | No | Doctor approval |
| `cancellationReason` | String | None | **YES** | Why appointment cancelled |
| `consultationMode` | String | Enum (2 values) | No | Video or in-person |
| `isChatEnabled` | Boolean | None | No | Chat feature enabled |

### Encryption
- Fields: `reason`, `cancellationReason`
- Key: `process.env.FIELD_ENC_KEY` (must be 32-char hex)
- Purpose: HIPAA compliance (prevent plain text sensitive info in database)

### Payment Gate Logic
```
Initial State:
  paymentStatus: "unpaid"
  consultationStatus: "locked"
  → requirePayment middleware blocks FHIR endpoints

After Razorpay Payment Success:
  paymentStatus: "paid"
  paidAt: <timestamp>
  consultationStatus: "active"
  → Doctor can create clinical notes
```

### Relationships
- **User** (1:Many): One user has many appointments
- **Doctor** (1:Many): One doctor has many appointments

### Missing Fields
- ❌ `reason` validation (what counts as valid reason?)
- ❌ `appointmentDate` past date validation
- ❌ `appointmentTime` format validation
- ❌ `consultationLink` (Zoom/Meet URL for online)
- ❌ `recordingUrl` (consultation recording)

---

## SERVER/CONTROLLERS/AUTH.JS

**File Path:** `server/Controllers/Auth.js`  
**Purpose:** User signup, login, OTP verification, token refresh, logout

### Function: `signup(req, res)`

**Parameters:**
- `req.body`: `{ fullName, email, contact, password, otp }`

**Return Value:** HTTP Response (201 on success, 4xx on failure)

**Step-by-Step Logic:**

1. **Validate Required Fields** (Lines 12-19)
   ```javascript
   if (!fullName || !email || !contact || !password) {
     return res.status(400).json({
       success: false,
       message: "All fields are required"
     });
   }
   ```

2. **Password Strength Validation** (Lines 21-29)
   ```javascript
   const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
   // Requires: 8+ chars, uppercase, lowercase, number, special char
   ```
   **Requirements:**
   - Minimum 8 characters
   - At least 1 uppercase (A-Z)
   - At least 1 lowercase (a-z)
   - At least 1 digit (0-9)
   - At least 1 special char (@$!%*?&)
   
   ⚠️ **Issue:** This is VERY strict, will reject many common passwords

3. **Check Existing User** (Lines 31-36)
   ```javascript
   const existingUser = await User.findOne({ email });
   if (existingUser) {
     return res.status(409).json({
       success: false,
       message: "User already registered"
     });
   }
   ```
   **Validation:** Prevents duplicate accounts

4. **Verify OTP** (Lines 38-44)
   ```javascript
   const latestOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
   if (!latestOtp || otp !== latestOtp.otp) {
     return res.status(400).json({
       success: false,
       message: "The OTP is not valid"
     });
   }
   ```
   **Logic:**
   - Gets most recent OTP for email
   - Compares plain text (⚠️ No hashing!)
   - Deletes OTP after validation (prevents reuse)

   **Security Issue:** ❌ OTP stored in plain text, not hashed
   **Missing:** ❌ OTP expiration check (could accept 1-day-old OTP)

5. **Hash Password** (Line 47)
   ```javascript
   const hashedPassword = bcrypt.hashSync(password, 10);
   ```
   - 10 rounds of bcrypt hashing
   - Safe to store in database

6. **Create User** (Lines 49-57)
   ```javascript
   const newUser = await User.create({
     role: "user",
     roles: ["user"],
     fullName, email, contact,
     password: hashedPassword,
     additionalDetails: null,
     image: null
   });
   ```
   **Note:** Both `role` and `roles` set (dual system for backward compatibility)

7. **Create User Profile** (Lines 59-71)
   ```javascript
   const profileDetails = await userProfile.create({
     userId: newUser._id,
     dob: null,
     gender: null,
     address: null,
     bloodGroup: null,
     allergies: [],
     medicalHistory: [],
     medications: [],
     emergencyContact: null,
     insurance: { provider: null, policyNumber: null },
     image: null
   });
   ```

8. **Link Profile to User** (Lines 73-74)
   ```javascript
   newUser.additionalDetails = profileDetails._id;
   await newUser.save();
   ```

9. **Notify Admins** (Lines 76-88)
   ```javascript
   const admins = await User.find({ 
     $or: [{ roles: "admin" }, { role: "admin" }] 
   }).select("_id fullName");
   
   if (admins.length > 0) {
     const notificationDocs = admins.map((admin) => ({
       recipient: admin._id,
       type: "USER_REGISTERED",
       title: "New User Registered",
       message: `${newUser.fullName} just created an account.`
     }));
     await Notification.insertMany(notificationDocs);
   }
   ```
   **Optimization:** Uses `insertMany()` to avoid N+1 queries

10. **Return Success** (Lines 90-97)
    ```javascript
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
      profile: profileDetails
    });
    ```

### Function: `login(req, res, next)`

**Parameters:**
- `req.body`: `{ email, password }`

**Return Value:** HTTP Response with tokens

**Step-by-Step Logic:**

1. **Validate Input** (Line 104)
   ```javascript
   if (!email || !password) throw new AppError('All fields are required', 400);
   ```

2. **Find User** (Line 106)
   ```javascript
   const user = await User.findOne({ email });
   if (!user) throw new AppError('User not registered', 404);
   ```

3. **Check Account Lock** (Lines 108-111)
   ```javascript
   if (user.lockUntil && user.lockUntil > Date.now()) {
     throw new AppError(
       'Account is locked due to multiple failed login attempts. Try later.',
       403
     );
   }
   ```
   **Purpose:** Brute force protection (accounts lock after 5 failed attempts)

4. **Verify Password** (Lines 113-114)
   ```javascript
   const isPasswordValid = await bcrypt.compare(password, user.password);
   if (!isPasswordValid) {
     user.failedLoginAttempts += 1;
     if (user.failedLoginAttempts >= 5) {
       user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
     }
     await user.save();
     return res.status(400).json({...});
   }
   ```

5. **Reset Login Attempts** (Lines ~125-127)
   ```javascript
   user.failedLoginAttempts = 0;
   user.lockUntil = null;
   await user.save();
   ```

6. **Generate Tokens** (Lines ~129-130)
   ```javascript
   const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });
   const refreshToken = signRefreshToken({ id: user._id });
   ```
   **Token Details:**
   - Access token: ~15 min expiry (in JWT claims)
   - Refresh token: Stored in DB, valid 7 days

7. **Return Tokens** (Lines ~135-145)
   ```javascript
   res.cookie('token', accessToken, { httpOnly: true, secure: true });
   return res.status(200).json({
     success: true,
     accessToken,
     refreshToken,
     user
   });
   ```

### Function: `sendotp(req, res)`

**Parameters:**
- `req.body`: `{ email }`

**Return:** Sends OTP via email

**Logic:**
1. Generate 6-digit OTP: `otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })`
2. Check if OTP already exists, delete old ones:
   ```javascript
   await OTP.deleteMany({ email });
   ```
3. Create OTP in database: `await OTP.create ({ email, otp })`
4. Send via email (nodemailer or email service)
5. Return success response

**Missing:** ❌ OTP expiration timestamp not stored

---

## SERVER/CONTROLLERS/PAYMENT.JS

**File Path:** `server/Controllers/Payment.js`  
**Purpose:** Razorpay payment order creation and verification

### Function: `createOrder(req, res)`

**Parameters:**
- `req.body.appointmentId` (string): MongoDB appointment ObjectId
- `req.user.id` (string): Current user ID (set by authMiddleware)

**Return Value:** HTTP Response with Razorpay order details

**Step-by-Step Logic:**

1. **Extract Appointment ID** (Line 7-12)
   ```javascript
   const { appointmentId } = req.body;
   // Logs only in development mode
   ```

2. **Find Appointment** (Lines 14-18)
   ```javascript
   const appointment = await Appointment.findById(appointmentId)
     .populate("doctorId");
   ```
   **Validation:** Throws 404 if appointment doesn't exist

3. **Verify User Ownership** (Lines 20-26)
   ```javascript
   if (appointment.userId.toString() !== req.user.id) {
     return res.status(403).json({
       success: false,
       message: "Unauthorized"
     });
   }
   ```
   **Security Check:** Only appointment owner can pay

4. **Fetch Doctor Profile** (Lines 28-36)
   ```javascript
   let doctorprofile = await doctorProfile.findOne({ doctorId: doctorId });
   let amount = doctorprofile.consultationFee;
   
   if (!amount || Number(amount) <= 0) {
     return res.status(400).json({
       success: false,
       message: "Doctor has not set a valid consultation fee"
     });
   }
   ```
   **Validation:**
   - Doctor profile must exist
   - Consultation fee must be positive number

5. **Validate Amount** (Lines 38-46)
   ```javascript
   amount = Math.round(Number(amount));
   if (amount > 999999) {
     return res.status(400).json({
       success: false,
       message: "Consultation fee exceeds maximum allowed amount"
     });
   }
   ```
   **Conversion Logic:**
   - Convert to integer (Razorpay doesn't support decimals)
   - Max amount: 999,999 INR (~$12,000)
   - **Issue:** ⚠️ No minimum amount check (could be ₹0)

6. **Create Razorpay Order** (Lines 48-54)
   ```javascript
   const options = {
     amount: amount * 100,       // Razorpay uses paise (1 INR = 100 paise)
     currency: "INR",
     receipt: `receipt_${appointmentId}`
   };
   
   const order = await instance.orders.create(options);
   ```

7. **Save Payment Record** (Lines 58-66)
   ```javascript
   const paymentcreated = await Payment.create({
     user: req.user.id,
     appointment: appointmentId,
     razorpayOrderId: order.id,
     amount,
     status: "created"
   });
   ```
   **Database Record:** Tracks payment attempt for audit

8. **Return Order Details** (Lines 70+)
   ```javascript
   res.status(200).json({
     success: true,
     orderId: order.id,
     amount: order.amount,
     currency: order.currency,
     key: process.env.RAZORPAY_KEY,  // ⚠️ Public key sent to frontend
     order: order
   });
   ```

### Function: `verifyPayment(req, res)`

**Parameters:**
- `req.body`: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, appointmentId }`

**Return Value:** HTTP Response with success/failure

**Step-by-Step Logic:**

1. **Extract Request Body** (Lines ~80-90)
   ```javascript
   const { razorpay_payment_id, razorpay_order_id, razorpay_signature, appointmentId } = req.body;
   ```

2. **Generate Signature** (Lines ~92-95)
   ```javascript
   const data = razorpay_order_id + "|" + razorpay_payment_id;
   const expectedSignature = crypto
     .createHmac("sha256", process.env.RAZORPAY_SECRET)
     .update(data)
     .digest("hex");
   ```
   **Security:** Verifies payment authenticity using HMAC-SHA256

3. **Verify Signature** (Lines ~97-101)
   ```javascript
   if (expectedSignature !== razorpay_signature) {
     return res.status(400).json({
       success: false,
       message: "Payment failed - signature mismatch"
     });
   }
   ```
   **Prevention:** Stops spoofed payment confirmations

4. **Update Appointment** (Lines ~103-110)
   ```javascript
   const appointment = await Appointment.findByIdAndUpdate(
     appointmentId,
     {
       paymentStatus: "paid",
       consultationStatus: "active",
       paidAt: new Date()
     },
     { new: true }
   );
   ```
   **Critical Fields Updated:**
   - `paymentStatus: "paid"` → Unlocks payment gate
   - `consultationStatus: "active"` → Allows FHIR operations
   - `paidAt: <timestamp>` → Audit trail

5. **Update Payment Record** (Lines ~112-116)
   ```javascript
   await Payment.findOneAndUpdate(
     { razorpayOrderId: razorpay_order_id },
     { status: "verified", razorpayPaymentId: razorpay_payment_id },
     { new: true }
   );
   ```

6. **Send Socket Notification** (Lines ~118+)
   ```javascript
   const io = req.app.get('io');
   io.to(`notification_${appointment.userId}`).emit('notification', {
     title: 'Payment Successful',
     message: 'Your consultation appointment payment has been verified.',
     type: 'success'
   });
   ```

7. **Return Success** (Lines ~120+)
   ```javascript
   res.status(200).json({
     success: true,
     message: "Payment verified successfully",
     appointment
   });
   ```

---

## SERVER/ROUTES/PAYMENT.JS

**File Path:** `server/routes/Payment.js`  
**Purpose:** Payment endpoint registration

### Routes

```javascript
POST /api/v1/payment/createOrder
  Authentication: ✅ Required (authenticateUser)
  Body: { appointmentId }
  Purpose: Create Razorpay order
  Response: { orderId, key, amount, currency }
  
POST /api/v1/payment/verifyPayment
  Authentication: ✅ Required (authenticateUser)
  Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature, appointmentId }
  Purpose: Verify payment and unlock consultation
  Response: { success, message, appointment }
```

---

## SERVER/MODELS/CONSULTATIONSESSION.JS

**File Path:** `server/models/ConsultationSession.js`  
**Purpose:** Track active/completed live consultation sessions

**Collection Name:** `consultationsessions`

### Schema Definition

```javascript
const ConsultationSessionSchema = new mongoose.Schema({
  // References
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Session state
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  },
  
  // Timing
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  endedBy: {
    type: String,
    enum: ["doctor", "patient"],
    default: null
  },
  
  // Metrics
  duration: { type: Number, default: 0 },  // seconds
  notes: { type: String, default: "" }
}, { timestamps: true })
```

### Field Details

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `appointmentId` | ObjectId | Required | Link to appointment |
| `doctorId` | ObjectId | Required | Doctor conducting session |
| `userId` | ObjectId | Required | Patient in session |
| `status` | String | "active" | Current session state |
| `startedAt` | Date | now | When session started |
| `endedAt` | Date | null | When session ended |
| `endedBy` | String | null | Who ended: doctor or patient |
| `duration` | Number | 0 | Total seconds |
| `notes` | String | "" | Doctor's session notes |

### Relationships
- **Appointment** (1:1): Each session for one appointment
- **Doctor** (1:Many): Doctor has many consultation sessions
- **User** (1:Many): User has many consultation sessions

### Usage Example

**Start Consultation:**
```javascript
const session = await ConsultationSession.create({
  appointmentId: appointmentId,
  doctorId: doctorId,
  userId: userId,
  status: "active",
  startedAt: new Date()
});
```

**End Consultation:**
```javascript
await ConsultationSession.findByIdAndUpdate(session._id, {
  status: "completed",
  endedAt: new Date(),
  endedBy: "doctor",
  duration: Math.floor((Date.now() - session.startedAt) / 1000)
});
```

---

## SERVER/MODELS/FHIR MODELS (CONDITION, OBSERVATION, MEDICATION, ETC.)

### CONDITION.JS

**File Path:** `server/models/Condition.js`  
**Purpose:** FHIR Condition resource (medical diagnoses)

**Schema Fields:**
```javascript
{
  resourceType: { type: String, default: "Condition" },
  
  // Reference to patient
  subject: {
    reference: { type: String },  // e.g., "Patient/USER_ID"
    resourceType: { type: String, default: "Patient" }
  },
  
  // ICD-10 code
  code: {
    coding: [{
      system: { type: String, default: "http://hl7.org/fhir/sid/icd-10-cm" },
      code: { type: String },       // e.g., "J06.9" (Acute URTI)
      display: { type: String }     // Human-readable name
    }],
    text: { type: String }
  },
  
  // Severity & status
  verificationStatus: {
    coding: [{
      system: { type: String, default: "http://terminology.hl7.org/CodeSystem/condition-ver-status" },
      code: { type: String, enum: ["unconfirmed", "provisional", "differential", "confirmed", "refuted", "entered-in-error"] }
    }]
  },
  
  bodySite: [{
    coding: [{
      system: { type: String },
      code: { type: String }
    }],
    text: { type: String }
  }],
  
  recordedDate: { type: Date, default: Date.now },
  
  // Doctor who recorded
  recorder: {
    reference: { type: String },  // "Practitioner/DOCTOR_ID"
    resourceType: { type: String, default: "Practitioner" }
  }
}
```

### OBSERVATION.JS

**File Path:** `server/models/Observation.js`  
**Purpose:** FHIR Observation resource (vital signs, labs)

**Schema Fields:**
```javascript
{
  resourceType: { type: String, default: "Observation" },
  
  // Link to patient and doctor
  subject: { reference: String, resourceType: String },
  performer: { reference: String, resourceType: String },
  
  // Type: "vital-signs", "laboratory", etc.
  category: [{
    coding: [{
      system: String,
      code: String,  // "vital-signs" | "laboratory" | "imaging"
      display: String
    }]
  }],
  
  // Observation code (LOINC)
  code: {
    coding: [{
      system: { type: String, default: "http://loinc.org" },
      code: String,  // "8480-6" for Systolic BP
      display: String
    }],
    text: String
  },
  
  // Value and unit
  valueQuantity: {
    value: Number,      // 120 (for BP)
    unit: String,       // "mm[Hg]"
    system: String,     // "http://unitsofmeasure.org"
    code: String        // "mm[Hg]"
  },
  
  effectiveDateTime: Date,
  issuedDateTime: Date
}
```

### MEDICATIONREQUEST.JS

**File Path:** `server/models/MedicationRequest.js`  
**Purpose:** FHIR MedicationRequest (prescriptions)

**Schema Fields:**
```javascript
{
  resourceType: { type: String, default: "MedicationRequest" },
  
  subject: { reference: String },  // Patient
  requester: { reference: String },  // Doctor
  
  medicationCodeableConcept: {
    coding: [{
      system: { type: String, default: "http://www.nlm.nih.gov/research/umls/rxnorm" },
      code: String,  // RxNorm code
      display: String  // "Amoxicillin"
    }],
    text: String
  },
  
  status: {
    type: String,
    enum: ["active", "on-hold", "stopped", "completed"],
    default: "active"
  },
  
  intent: {
    type: String,
    enum: ["proposal", "plan", "order", "original-order", "reflex-order"],
    default: "order"
  },
  
  dosageInstruction: [{
    text: String,  // "Take 500mg every 8 hours"
    timing: {
      repeat: {
        frequency: Number,  // 3 (times per day)
        period: Number,     // 1
        periodUnit: String  // "d" (day)
      }
    },
    route: {
      coding: [{
        system: String,
        code: String,  // "PO" (oral)
        display: String
      }]
    },
    doseAndRate: [{
      doseQuantity: {
        value: Number,  // 500
        unit: String,   // "mg"
        system: String
      }
    }]
  }],
  
  authoredOn: Date,
  requiredSubstitution: Boolean
}
```

---

## SERVER/ROUTES/FHIR.JS (PARTIAL)

**File Path:** `server/routes/fhir.js`  
**Purpose:** 33 FHIR R4 endpoints for clinical data management

**Base Path:** `/api/v1/fhir/R4`

### Route List

| Method | Path | Handler | Auth | Payment Gate | Purpose |
|--------|------|---------|------|-------------|---------|
| POST | /Condition | createCondition | ✅ Doctor | ✅ Yes | Create diagnosis |
| GET | /Condition/:id | readCondition | ✅ Auth | ✅ Yes | Read diagnosis |
| POST | /Observation | createObservation | ✅ Doctor | ✅ Yes | Create vital/lab |
| GET | /Observation/:id | readObservation | ✅ Auth | ✅ Yes | Read vital/lab |
| POST | /MedicationRequest | createMedicationRequest | ✅ Doctor | ✅ Yes | Create prescription |
| GET | /MedicationRequest/:id | readMedicationRequest | ✅ Auth | ✅ Yes | Read prescription |
| POST | /DiagnosticReport | createDiagnosticReport | ✅ Doctor | ✅ Yes | Create lab report |
| GET | /DiagnosticReport/:id | readDiagnosticReport | ✅ Auth | ✅ Yes | Read lab report |
| POST | /Bundle | search | ✅ Auth | ✅ Yes | Search all records |
| POST | /Medication | createMedication | ✅ Doctor | ✅ Yes | Create medication |
| GET | /Medication/:id | readMedication | ✅ Auth | ✅ Yes | Read medication |
| POST | /AllergyIntolerance | createAllergyIntolerance | ✅ Doctor | ✅ Yes | Record allergy |
| GET | /AllergyIntolerance/:id | readAllergyIntolerance | ✅ Auth | ✅ Yes | Read allergy |
| POST | /Immunization | createImmunization | ✅ Doctor | ✅ Yes | Record vaccine |
| GET | /Immunization/:id | readImmunization | ✅ Auth | ✅ Yes | Read vaccine |
| POST | /Procedure | createProcedure | ✅ Doctor | ✅ Yes | Record procedure |
| GET | /Procedure/:id | readProcedure | ✅ Auth | ✅ Yes | Read procedure |
| GET | /Patient/:id | readPatient | ✅ Auth | ✅ Yes | Read patient record |
| GET | /Practitioner/:id | readPractitioner | ✅ Auth | No | Read doctor info |
| POST | /DocumentReference | createDocumentReference | ✅ Doctor | ✅ Yes | Attach file |
| GET | /DocumentReference/:id | readDocumentReference | ✅ Auth | ✅ Yes | Read attachment |
| POST | /export | exportPatientData | ✅ Auth | ✅ Yes | Export JSON/XML |
| POST | /search | searchRecords | ✅ Auth | ✅ Yes | Advanced search |

### Example Route Handler: createCondition

```javascript
router.post(
  "/Condition",
  authenticateUser,
  isDoctor,
  requirePayment,  // Payment gate
  consentMiddleware,  // Consent check
  fhirWriteLimiter,  // Rate limit
  async (req, res, next) => {
    try {
      const { patientId, code, display, bodySite } = req.body;
      
      // Validate FHIR payload
      if (!patientId || !code) {
        throw new AppError('Missing required fields: patientId, code', 400);
      }
      
      // Parse ICD-10 code
      const [system, icdCode] = code.split('|');
      
      // Create condition
      const condition = await Condition.create({
        subject: {
          reference: `Patient/${patientId}`,
          resourceType: "Patient"
        },
        code: {
          coding: [{
            system: system || "http://hl7.org/fhir/sid/icd-10-cm",
            code: icdCode || code,
            display
          }],
          text: display
        },
        bodySite: bodySite ? [{
          coding: [{
            system: "http://snomed.info/sct",
            code: bodySite
          }]
        }] : [],
        verificationStatus: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed"
          }]
        },
        recorder: {
          reference: `Practitioner/${req.user._id}`,
          resourceType: "Practitioner"
        },
        recordedDate: new Date()
      });
      
      res.status(201).json({
        success: true,
        resourceType: "Condition",
        data: condition
      });
    } catch (err) {
      next(err);
    }
  }
);
```

### Middleware Applied to All FHIR Routes

1. **authenticateUser** - Verify JWT token
2. **consentMiddleware** - Check patient consent for data access
3. **requirePayment** - Block unless appointment paid (for POST routes)
4. **fhirReadLimiter** / **fhirWriteLimiter** - Rate limit 100 requests/hour for reads, 50 for writes
5. **Error Handler** - Returns FHIR OperationOutcome on error

---

## SERVER/MIDDLEWARE/CONSENTMIDDLEWARE.JS

**File Path:** `server/middleware/consentMiddleware.js`  
**Purpose:** Verify patient consent before doctor access to medical records

### Function: `consentMiddleware(req, res, next)`

**Logic:**

1. **Determine Patient ID** (Lines ~10-20)
   ```javascript
   const patientId = req.body.patientId || req.params.patientId;
   if (!patientId) {
     return res.status(400).json({
       success: false,
       message: "Missing patientId in request"
     });
   }
   ```

2. **Check If Doctor Accessing Own Data** (Lines ~22-24)
   ```javascript
   if (patientId === req.user._id.toString()) {
     return next();  // Users can access their own data
   }
   ```

3. **If Doctor, Check Consent** (Lines ~26-40)
   ```javascript
   if (req.user.role === "doctor") {
     const consent = await Consent.findOne({
       patient: patientId,
       practitioner: req.user._id,
       status: "granted"
     });
     
     if (!consent) {
       return res.status(403).json({
         success: false,
         message: "Patient has not granted consent for data access"
       });
     }
   }
   ```

4. **Allow Access** (Line ~42)
   ```javascript
   next();
   ```

### Consent Model

```javascript
// Consent.js - FHIR Consent Status
{
  resourceType: "Consent",
  patient: ObjectId,  // Patient who grants
  practitioner: ObjectId,  // Doctor who receives
  status: { type: String, enum: ["pending", "granted", "revoked"], default: "pending" },
  dateTime: Date,
  scope: String,  // "medical-records", "lab-results", etc.
  purpose: [String],  // ["treatment", "emergency"]
  except: []  // Data exclusions (if any)
}
```

---

## SERVER/MIDDLEWARE/REQUIREPAYMENT.JS

**File Path:** `server/middleware/requirePayment.js`  
**Purpose:** Enforce payment gate - block FHIR operations until appointment paid

### Function: `requirePayment(req, res, next)`

**Logic:**

1. **Extract Appointment ID** (Lines ~10-15)
   ```javascript
   const appointmentId = req.body.appointmentId || req.query.appointmentId;
   if (!appointmentId) {
     return res.status(400).json({
       success: false,
       message: "appointmentId required for payment gate"
     });
   }
   ```

2. **Find Appointment** (Lines ~17-20)
   ```javascript
   const appointment = await Appointment.findById(appointmentId);
   if (!appointment) {
     return res.status(404).json({ success: false, message: "Appointment not found" });
   }
   ```

3. **Check Payment Status** (Lines ~22-29)
   ```javascript
   if (appointment.paymentStatus !== "paid") {
     return res.status(402).json({
       success: false,
       message: "Payment required. Please complete payment to proceed.",
       appointmentId: appointmentId,
       paymentRequired: true
     });
   }
   ```
   **HTTP 402:** "Payment Required" (formally unused status code)

4. **Allow Access** (Line ~31)
   ```javascript
   next();
   ```

---

# FRONTEND DOCUMENTATION

## FRONTEND/SRC/APP.JS

**File Path:** `frontend/src/App.js`  
**Purpose:** Root component, route configuration, auth state management, socket connection

### Imports

```javascript
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from "react-toastify";

// Components
import GlobalNavbar from './components/GlobalNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import ChatWidget from './components/chat/ChatWidget';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import DoctorSearch from './pages/DoctorSearch';
import ConsultationPage from './pages/ConsultationPage';
import MedicalRecords from './pages/MedicalRecords';

// Socket manager
import { connectSocket, disconnectSocket } from './utils/socketManager';
import { initAuthSession } from './services/authSession';
```

### Component Function: App()

**Purpose:** Main app component with routing and auth management

**State (Redux):**
```javascript
const { token, user } = useSelector((state) => state.auth);
```
- `token`: JWT access token or null
- `user`: User object `{ id, email, role, fullName }` or null

**Effects:**

#### 1. Session Initialization (useEffect)
```javascript
useEffect(() => {
  initAuthSession();
}, []);
```
**Purpose:**
- Runs once on app mount
- Loads persisted auth state from localStorage
- Verifies token is still valid
- Refreshes token if expired

#### 2. Socket Connection Management (useEffect)
```javascript
useEffect(() => {
  if (token && user) {
    console.log('🔌 [App] User logged in, connecting socket...');
    connectSocket(token);
  } else {
    console.log('🔌 [App] User logged out, disconnecting socket...');
    disconnectSocket();
  }
}, [token, user]);
```
**Logic:**
- Connects when user logs in
- Disconnects when user logs out
- Dependency: `[token, user]` — fires when auth changes

### Routes

```jsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
  
  {/* Protected routes */}
  <Route path="/medical-records" element={
    <ProtectedRoute requiredRole="user">
      <MedicalRecords />
    </ProtectedRoute>
  } />
  
  <Route path="/consultation/:appointmentId" element={
    <ConsultationPage />
  } />
  
  {/* Admin routes */}
  <Route path="/admin/*" element={<AdminRoutes />} />
  
  {/* Doctor routes */}
  <Route path="/doctor/*" element={<DoctorRoutes />} />
</Routes>
```

### Conditional Rendering

```javascript
const isAdminRoute = location.pathname.startsWith('/admin');

return (
  <div className="App">
    <ToastContainer ... />
    
    {!isAdminRoute && <GlobalNavbar />}
    {!isAdminRoute && <ChatWidget />}
    
    <div className={!isAdminRoute ? "pt-24" : ""}>
      <Routes>...</Routes>
    </div>
  </div>
);
```

**Logic:**
- Hide global navbar and chat on admin routes (admin has own layout)
- Add top padding to content unless on admin page

---

## FRONTEND/SRC/SERVICES/API.JS

**File Path:** `frontend/src/services/api.js`  
**Purpose:** Axios instance with automatic token injection

### Instance Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,  // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          'http://localhost:4000/api/v1/auth/refresh',
          { refreshToken }
        );
        
        localStorage.setItem('token', response.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### How It Works

1. **Every request** automatically includes `Authorization: Bearer <token>`
2. **If 401 response**: Attempt to refresh token
3. **If refresh succeeds**: Retry original request with new token
4. **If refresh fails**: Clear localStorage and redirect to login

---

## FRONTEND/SRC/SLICES/AUTHSLICE.JS

**File Path:** `frontend/src/slices/authSlice.js`  
**Purpose:** Redux state management for authentication

### Initial State

```javascript
const initialState = {
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')) 
    : null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token')
};
```

### Reducers

#### setCredentials
```javascript
setCredentials: (state, action) => {
  const { token, refreshToken, user } = action.payload;
  state.token = token;
  state.refreshToken = refreshToken;
  state.user = user;
  state.isAuthenticated = true;
  
  // Persist to localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}
```

#### logout
```javascript
logout: (state) => {
  state.token = null;
  state.refreshToken = null;
  state.user = null;
  state.isAuthenticated = false;
  
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
```

#### setLoading
```javascript
setLoading: (state, action) => {
  state.loading = action.payload;
}
```

#### setError
```javascript
setError: (state, action) => {
  state.error = action.payload;
}
```

### Selectors

```javascript
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectLoading = (state) => state.auth.loading;
```

### Usage Example (Login)

**Frontend page:**
```javascript
const handleLogin = async (email, password) => {
  dispatch(setLoading(true));
  try {
    const response = await api.post('/auth/login', { email, password });
    
    dispatch(setCredentials({
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user
    }));
    
    navigate('/my-profile');
  } catch (err) {
    dispatch(setError(err.response?.data?.message || 'Login failed'));
  } finally {
    dispatch(setLoading(false));
  }
};
```

---

## FRONTEND/SRC/UTILS/SOCKETMANAGER.JS

**File Path:** `frontend/src/utils/socketManager.js`  
**Purpose:** Singleton Socket.IO client with event handlers

### Initialization

```javascript
import io from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return;  // Already connected
  
  socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
  
  // Connection event
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });
  
  // Reconnection event
  socket.on('reconnect', () => {
    console.log('🔄 Socket reconnected');
  });
  
  // Error event
  socket.on('connect_error', (error) => {
    console.error('❌ Socket error:', error);
  });
  
  // Message events
  socket.on('receive_message', (data) => {
    console.log('💬 New message:', data);
    // Dispatch to Redux or show notification
  });
  
  // Notification events
  socket.on('notification', (data) => {
    console.log('🔔 Notification:', data);
    // Show toast notification
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitEvent = (eventName, data) => {
  if (socket) {
    socket.emit(eventName, data);
  }
};

export const onEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};
```

### Events Handled

**Receiving:**
- `receive_message`: New chat message
- `user_typing`: Doctor typing indicator
- `notification`: System notification
- `user_joined`: User joined chat
- `consentApproved`: Patient approved consent request
- `sessionUpdate`: Consultation session state change

**Sending (emitted from components):**
- `join_chat`: Join appointment chat room
- `send_message`: Send chat message
- `typing`: Typing indicator
- `requestConsent`: Ask patient for data access
- `join_consultation`: Join live consultation

---

## FRONTEND/SRC/PAGES/MEDICALRECORDS.JS (FHIR DATA)

**File Path:** `frontend/src/pages/MedicalRecords.js`  
**Purpose:** Display patient's FHIR medical records (conditions, observations, medications)

### Component Function: MedicalRecords()

**State:**
```javascript
const [records, setRecords] = useState({
  conditions: [],
  observations: [],
  medications: [],
  diagnosticReports: [],
  allergies: [],
  procedures: [],
  immunizations: []
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [selectedRecord, setSelectedRecord] = useState(null);
```

### useEffect: Load Records

```javascript
useEffect(() => {
  const loadRecords = async () => {
    setLoading(true);
    try {
      // Fetch all FHIR resources
      const [conditions, observations, meds, reports] = await Promise.all([
        api.get('/fhir/R4/Condition', { params: { patient: user.id } }),
        api.get('/fhir/R4/Observation', { params: { patient: user.id } }),
        api.get('/fhir/R4/MedicationRequest', { params: { patient: user.id } }),
        api.get('/fhir/R4/DiagnosticReport', { params: { patient: user.id } })
      ]);
      
      setRecords({
        conditions: conditions.data,
        observations: observations.data,
        medications: meds.data,
        diagnosticReports: reports.data
      });
    } catch (err) {
      setError('Failed to load medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (user) loadRecords();
}, [user]);
```

### Render: Tabs for Different Record Types

```jsx
return (
  <div className="medical-records">
    <h1>My Medical Records</h1>
    
    {loading && <Loading />}
    {error && <ErrorAlert message={error} />}
    
    <div className="tabs">
      <Tab label="Conditions" onClick={() => setTab('conditions')}>
        {records.conditions.map((cond) => (
          <ConditionCard
            key={cond._id}
            condition={cond}
            onSelect={setSelectedRecord}
          />
        ))}
      </Tab>
      
      <Tab label="Vital Signs" onClick={() => setTab('observations')}>
        {records.observations.map((obs) => (
          <ObservationCard key={obs._id} observation={obs} />
        ))}
      </Tab>
      
      <Tab label="Medications" onClick={() => setTab('medications')}>
        {records.medications.map((med) => (
          <MedicationCard key={med._id} medication={med} />
        ))}
      </Tab>
    </div>
    
    {selectedRecord && <RecordDetail record={selectedRecord} />}
  </div>
);
```

### ConditionCard Component

```jsx
const ConditionCard = ({ condition, onSelect }) => {
  const code = condition.code?.coding?.[0];
  
  return (
    <div className="card" onClick={() => onSelect(condition)}>
      <h3>{code?.display || 'Condition'}</h3>
      <p className="code">Code: {code?.code}</p>
      <p className="date">
        Recorded: {new Date(condition.recordedDate).toLocaleDateString()}
      </p>
      <button>View Details</button>
    </div>
  );
};
```

---

# DATABASE DOCUMENTATION

## COMPLETE MODEL LIST

**Total Models:** 33

### User Management Models
1. **User.js** - Base user (patient, doctor, admin)
2. **UserProfile.js** - Extended user details (DOB, address, insurance)
3. **DoctorProfile.js** - Doctor specialization, experience, fees
4. **Doctor.js** - Doctor with verification status
5. **DoctorRegistration.js** - Pending doctor registration requests
6. **HospitalRegistration.js** - Hospital signup requests
7. **Hospital.js** - Approved hospital profile

### Appointment & Consultation Models
8. **Appointment.js** - Appointment booking (with payment fields)
9. **ConsultationSession.js** - Live consultation state tracking
10. **Consultation.js** - Legacy consultation data
11. **ChatMessage.js** - Chat messages with file attachments

### FHIR R4 Clinical Data Models
12. **Condition.js** - FHIR Condition (ICD-10 diagnoses)
13. **Observation.js** - FHIR Observation (vital signs, labs)
14. **Medication.js** - FHIR Medication
15. **MedicationRequest.js** - FHIR MedicationRequest (prescriptions)
16. **DiagnosticReport.js** - FHIR DiagnosticReport (lab reports)
17. **Procedure.js** - FHIR Procedure (medical procedures)
18. **Immunization.js** - FHIR Immunization (vaccination records)
19. **AllergyIntolerance.js** - FHIR AllergyIntolerance
20. **DocumentReference.js** - FHIR DocumentReference (file attachments)

### Consent & Privacy Models
21. **Consent.js** - FHIR Consent (patient consent status)
22. **ConsentRequest.js** - Consent request from doctor to patient

### Payment Models  
23. **Payment.js** - Payment transaction records (Razorpay tracking)

### Health Data Models (Non-FHIR)
24. **MedicalRecord.js** - Prescriptions, vitals, diagnoses summary
25. **SymptomAnalysis.js** - AI symptom analysis results

### Audit & Compliance Models
26. **AuditEvent.js** - FHIR AuditEvent (HIPAA compliance logging)
27. **AuditLog.js** - Application-level audit logs
28. **Breach.js** - Breach incident tracking (HIPAA)

### System Models
29. **OTP.js** - One-time passwords for signup
30. **RefreshToken.js** - JWT refresh token storage
31. **Notification.js** - User notifications (email, SMS, in-app)
32. **RatingandReview.js** - Doctor ratings and reviews
33. **ExportJob.js** - FHIR data export job tracking
34. **SyncLog.js** - Data synchronization logs

---

# INTEGRATION DOCUMENTATION

## CLOUDINARY (IMAGE & DOCUMENT UPLOAD)

**File Path:** `server/config/Cloudinary.js`

### Setup
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### Usage Points in Codebase

1. **Profile Picture Upload** (Frontend)
   - Route: `PUT /api/v1/profile/updatprofilepicture`
   - File sent via multipart/form-data
   - Cloudinary returns secure_url

2. **Doctor Document Upload** (Doctor Registration)
   - Files: License, degree, certificate
   - Folder: `clinicall/doctor_documents`
   - Retention: Until doctor application reviewed

3. **Medical Document Attachment** (FHIR DocumentReference)
   - Route: `POST /api/v1/fhir/R4/DocumentReference`
   - Supports: PDF, images, reports
   - Linked to patient record

### Example Upload (Frontend)
```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  return response.json();
};
```

---

## RAZORPAY (PAYMENT PROCESSING)

**File Path:** `server/config/razorpay.js`

### Setup
```javascript
const Razorpay = require('razorpay');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,      // Public key (safe to embed)
  key_secret: process.env.RAZORPAY_SECRET // Secret key (server-only)
});

module.exports = { instance };
```

### Payment Flow

**1. User Books Appointment**
- Appointment created with `paymentStatus: "unpaid"`
- Consultation locked until payment

**2. User Initiates Payment**
```javascript
// Frontend calls
const response = await api.post('/payment/createOrder', {
  appointmentId: appointment._id
});

// Returns Razorpay Order ID + API Key
```

**3. Razorpay Checkout Opens**
```javascript
// Frontend (razorpay checkout.js)
const options = {
  key: response.key,  // Public key from backend
  amount: response.amount,  // In paise
  currency: 'INR',
  order_id: response.orderId,
  handler: handlePaymentSuccess
};

const rzp = new window.Razorpay(options);
rzp.open();
```

**4. Payment Verification (Backend)**
```javascript
// Frontend sends payment details to backend
await api.post('/payment/verifyPayment', {
  razorpay_payment_id: payment_id,
  razorpay_order_id: order_id,
  razorpay_signature: signature,
  appointmentId: appointmentId
});

// Backend verifies signature & updates appointment
// paymentStatus: "paid" → consultationStatus: "active"
```

**5. Doctor Can Now Create Clinical Notes**
- FHIR POST endpoints now accessible
- Consultation active

---

## SOCKET.IO (REAL-TIME EVENTS)

**Server Setup:** `server/index.js` (Lines ~340-400)

### Chat Events

**`join_chat`** - Doctor/patient enters chat
```javascript
// Frontend
socket.emit('join_chat', appointmentId);

// Backend
socket.on('join_chat', (appointmentId) => {
  socket.join(`chat_${appointmentId}`);
  io.to(`chat_${appointmentId}`).emit('user_joined', {
    userId: socket.user_id,
    timestamp: new Date()
  });
});
```

**`send_message`** - Send chat message
```javascript
socket.emit('send_message', {
  appointmentId,
  message: 'Hello doctor',
  senderId: userId,
  senderRole: 'patient'  // or 'doctor'
});

// Backend broadcasts to room
io.to(`chat_${appointmentId}`).emit('receive_message', {
  message,
  senderId,
  senderRole,
  timestamp: new Date(),
  _id: mongoId
});
```

**`typing`** - Typing indicator
```javascript
socket.emit('typing', appointmentId);

socket.on('typing', (appointmentId) => {
  socket.to(`chat_${appointmentId}`).emit('user_typing', {
    userId: socket.user_id
  });
});
```

**`read`** - Mark message as read
```javascript
socket.emit('read', { appointmentId, messageId });
```

### Consultation Events

**`join_consultation`** - Enter live consultation
```javascript
socket.emit('join_consultation', {
  appointmentId,
  userId,
  role: 'doctor' // or 'patient'
});

io.to(`consultation_${appointmentId}`).emit('user_joined_consultation', {
  userId,
  role,
  timestamp: new Date()
});
```

**`leave_consultation`** - Exit live consultation
```javascript
socket.emit('leave_consultation', appointmentId);

io.to(`consultation_${appointmentId}`).emit('user_left', {
  userId,
  message: 'User left consultation'
});
```

### Consent Events

**`requestConsent`** - Doctor requests patient consent
```javascript
socket.emit('requestConsent', {
  patientId,
  doctorId,
  scope: 'medical-records'  // What data being requested
});

// Patient receives notification
io.to(`notification_${patientId}`).emit('consentRequest', {
  doctorId,
  doctorName,
  scope,
  timestamp: new Date()
});
```

**`consentApproved`** - Patient approves consent
```javascript
socket.emit('consentApproved', consentRequestId);

// Doctor gets notification
io.to(`notification_${doctorId}`).emit('notification', {
  title: 'Consent Granted',
  message: `Patient approved access to ${scope}`,
  type: 'success'
});
```

### Notification Events

**`joinRoom`** - User joins notification room
```javascript
socket.emit('joinRoom', userId);  // Frontend
socket.join(`notification_${userId}`);  // Backend
```

**`notification`** - Broadcast notification
```javascript
// Any server code
io.to(`notification_${userId}`).emit('notification', {
  title: 'Appointment Approved',
  message: 'Doctor approved your appointment request',
  type: 'success',
  timestamp: new Date()
});

// Frontend receives & displays toast
```

---

## EMAIL (NODEMAILER)

**File Path:** `server/mail/` and `server/utils/sendNotification.js`

### Setup (Nodemailer SMTP)
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',  // Gmail, SendGrid, AWS SES
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD  // App password, not Gmail password
  }
});
```

### Email Templates Sent

1. **OTP Verification** (`sendotp`)
   - Sent when user signs up
   - Contains 6-digit OTP
   - Template: `mail/templates/otp.html`

2. **Welcome Email** (After signup)
   - Greeting email
   - Links to next steps

3. **Appointment Confirmation** (After booking)
   - Appointment date/time
   - Doctor details
   - Payment link

4. **Doctor Registration Status** (Approval/Rejection)
   - Approval: Account activated
   - Rejection: Reason provided

5. **Admin Notification** (New user signup)
   - On each user registration
   - Sent to all admins

### Sending Email (Function)
```javascript
const sendEmail = async (email, subject, htmlContent) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent  // Support HTML for rich formatting
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${email}:`, err);
    // ⚠️ Currently logs error but doesn't retry or queue
  }
};
```

### Missing: ❌ Email Retry Logic
- If email fails, no automatic retry
- No queue system for failed emails
- No scheduled resend

---

## JWT (JSON WEB TOKENS)

**File Path:** `server/utils/token.js`

### Token Creation

**Access Token:**
```javascript
const signAccessToken = (payload) => {
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // 15 minutes
  );
  return token;
};

// Payload contents:
{
  id: user._id,
  email: user.email,
  role: user.role
}
```

**Refresh Token:**
```javascript
const signRefreshToken = (payload) => {
  const token = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }  // 7 days
  );
  
  // Store in database
  await RefreshToken.create({
    user: payload.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  return token;
};
```

### Token Verification

**Verify Access Token:**
```javascript
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;  // Returns { id, email, role, iat, exp }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw err;
  }
};
```

**Refresh Token:**
```javascript
const refreshAccessToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded.id);
  
  return signAccessToken({
    id: user._id,
    email: user.email,
    role: user.role
  });
};
```

### Token Validation Locations

| Location | Action | Endpoint |
|----------|--------|----------|
| Every API call | Token extracted from `Authorization: Bearer` header | All protected routes |
| `/auth/refresh` | Old refresh token validated, new access token issued | Token refresh endpoint |
| App startup (Frontend) | `initAuthSession()` calls backend to verify token | Not publicly exposed |
| Socket.IO connection | Token verified on `connect` event | Socket server |

---

# KNOWN GAPS & OBSERVATIONS

## ❌ MISSING VALIDATIONS

### Backend Validations
1. **Appointment Date** - No check that date is in future (could book past appointments)
2. **Appointment Time** - No validation that time is in HH:MM format
3. **OTP Expiration** - OTP stored no expiry, could accept day-old OTP
4. **OTP Hashing** - OTP stored plain text (should be hashed)
5. **Password Change** - No way for users to change password
6. **Email Verification** - Email not verified after signup (anyone can use fake email)
7. **Phone Verification** - Contact field not verified
8. **Doctor Fees** - No minimum/maximum bounds on consultation fee
9. **Session Secret** - Throws error if missing, but no length validation

### Frontend Validations
1. **File Upload Size** - No limits on document upload (could be exploit)
2. **File Type** - No validation that uploaded files are PDFs/images
3. **Form Fields** - Some forms lack required field validation
4. **Date Range** - Calendar doesn't disable past dates

---

## ⚠️ INCOMPLETE IMPLEMENTATIONS

### Payment Gate
**Status:** Functional but not fully integrated
- ✅ Payment blocking works (requirePayment middleware)
- ❌ Payment failure handling unclear (refund process missing)
- ❌ No payment retry logic if transaction fails
- ❌ No invoice/receipt generation

### Consent Flow
**Status:** Partially implemented
- ✅ Consent model exists
- ✅ consentMiddleware checks consent
- ❌ No consent revocation endpoint
- ❌ No audit trail of consent changes
- ❌ No expiration date on consent (valid forever)

### Live Consultation
**Status:** Routes exist but WebRTC integration unclear
- ✅ ConsultationSession model exists
- ✅ Socket events handled
- ❌ No video/audio implementation details documented
- ❌ No screen sharing code
- ❌ No recording functionality

### Email Notifications
**Status:** Can send but incomplete
- ✅ Nodemailer configured
- ✅ OTP emails work
- ❌ No retry logic if email fails
- ❌ No email validation (bounce handling)
- ❌ No unsubscribe capability
- ❌ Templates hardcoded (not in DB)

### Admin Analytics
**Status:** Routes exist, implementation unclear
- ✅ AdminAnalytics.js route exists
- ❌ No dashboards displayed
- ❌ No export functionality (PDF reports)
- ❌ No date range filtering

---

## ⚠️ SECURITY ISSUES

### 1. **OTP Plain Text Storage** 🔴 CRITICAL
```javascript
// Current: Plain text in database
await OTP.create({ email, otp });

// Should be:
const hashedOtp = await bcrypt.hash(otp, 10);
await OTP.create({ email, otp: hashedOtp });
```

### 2. **Razorpay Key in Frontend Response** 🟡 MODERATE
```javascript
// Current: Public key sent in every payment response
res.json({ key: process.env.RAZORPAY_KEY });

// Better: Embed in frontend config at build time
```

### 3. **No Rate Limiting on Signup** 🟡 MODERATE
- Account creation not rate-limited
- Could create thousands of accounts
- Spam/DOS risk

### 4. **Email Not Verified** 🟡 MODERATE
- User can signup with fake email
- Verification link should expire in 24 hours

### 5. **OTP Not Expiring** 🟡 MODERATE
- OTP could be used days later
- Should expire in 10 minutes

### 6. **No CORS Validation** 🟡 MODERATE
- Localhost allowed in production config
- Should only allow production frontend URL

### 7. **Account Lock Can Be Bypassed** 🟡 MODERATE
- Brute force protection via `failedLoginAttempts`
- But lock time fixed at 30 minutes (no exponential backoff)
- Could allow more attempts after 30 mins

### 8. **Session Secret Fallback Missing** 🟢 LOW
- Server throws error if SESSION_SECRET missing
- Good, prevents default secrets
- But no warning in logs which is risky

---

## ⚠️ PERFORMANCE CONCERNS

### 1. **N+1 Queries in Notification Sending** 🟡 MODERATE
```javascript
// Current (N+1):
const admins = await User.find({ role: 'admin' });
for (let admin of admins) {
  await Notification.create({ recipient: admin._id });
}

// Fixed: Already done in signup, uses insertMany()
```

### 2. **No Database Indexes for FHIR Queries** 🟡 MODERATE
- FHIR routes filter by patient ID but no index
- Could be slow with millions of records
- Should add: `Condition.index({ subject: 1 })`

### 3. **All Records Loaded on Page** 🟡 MODERATE
- Medical Records page loads all conditions, observations, medications at once
- Should implement pagination or lazy loading

### 4. **Socket.IO Broadcast to All Users** 🟡 MODERATE
- Notifications currently use `io.to(room).emit()`
- If room not cleaned up, memory leak possible

### 5. **No Connection Pooling Docs** 🟡 MODERATE
- MongoDB config has `maxPoolSize: 10`
- Should be configurable per environment

---

## ❌ MISSING FEATURES

### Authentication
- ❌ OAuth2 / Google login (oauth.js exists but no frontend integration)
- ❌ Two-factor authentication (2FA)
- ❌ Password reset (no endpoint, no email flow)
- ❌ Account deletion
- ❌ Login history / device tracking

### Doctor Management
- ❌ Doctor availability calendar
- ❌ Doctor specialization filtering in search (implemented?)
- ❌ Doctor ratings visible on booking form
- ❌ Doctor unavailability blocks (vacations)

### Consultation
- ❌ Screen sharing code
- ❌ Recording transcript
- ❌ Consultation notes auto-save
- ❌ Call quality metrics (ping, packet loss)
- ❌ Fallback to phone if video fails

### Medical Records
- ❌ Export to PDF with FHIR formatting
- ❌ HL7v3 message format support (only JSON)
- ❌ DICOM file support (images)
- ❌ HL7 v2.x message format
- ❌ Syncope point for EHR systems

### Admin
- ❌ User analytics dashboard
- ❌ System health monitoring
- ❌ Bulk email campaigns
- ❌ Doctor document verification UI
- ❌ Appointment approval/rejection UI

### Notifications
- ❌ SMS notifications (only email)
- ❌ Push notifications (web/mobile)
- ❌ Notification preferences (do not disturb)
- ❌ Bulk notification scheduling

---

## ⚠️ ERROR HANDLING GAPS

### 1. **No Specific MongoDB Error Handling**
```javascript
// Current: Generic try-catch
try {
  await User.create(data);
} catch (err) {
  res.status(500).json({ message: 'Error' });  // Too vague
}

// Should:
// E11000 → Duplicate key (email exists)
// ValidationError → Missing required field
// CastError → Invalid ObjectId
```

### 2. **No Circuit Breaker for External Services**
- Razorpay API fails → No fallback
- Cloudinary down → File upload fails
- Email service down → No notification sent
- Should implement circuit breaker pattern

### 3. **Socket Connection Errors Not Handled**
```javascript
// Current: Limited error handling
socket.on('connect_error', (error) => {
  console.error('Socket error:', error);
  // Then what? Retry? Fallback to polling?
});
```

### 4. **Network Timeout Not Explicit**
- Axios timeout set to 30s, but not documented
- What if hospital network is slow?
- No retry logic on timeout

---

## 🔍 CODE QUALITY ISSUES

### 1. **Inconsistent Naming**
```javascript
// Mix of camelCase and snake_case
Registrationapproved  // Wrong
approveAppointment    // Correct
createOrder           // Correct
getAdminStats         // Correct
```

### 2. **Duplicate Admin Routes**
- Both `Admin.js` and `AdminAnalytics.js` exist
- Admin endpoints in Auth.js too
- Should consolidate to `API_DESIGN.md`

### 3. **Magic Numbers/Strings**
```javascript
// In signup
bcrypt.hashSync(password, 10);  // Why 10? What is 10?
// Should be: BCRYPT_ROUNDS = 10

// In payment
amount > 999999  // Why 999999?
// Should be: const MAX_CONSULTATION_FEE = 999999
```

### 4. **Commented-Out Code**
- Doctor.js has commented field encryption
- Auth.js has // SECURITY comments everywhere
- Should either enable or document why disabled

### 5. **No JSDoc Comments**
- Functions have no parameter/return documentation
- Should add JSDoc for every export

---

## 📊 TEST COVERAGE GAPS

| Layer | Coverage | Notes |
|-------|----------|-------|
| Controllers | ❓ Unknown | No unit tests visible |
| Middleware | ❓ Unknown | No unit tests visible |
| Models | ❓ Unknown | No unit tests visible |
| Routes | ✅ E2E Tests | Playwright tests exist |
| Frontend | ✅ E2E Tests | Playwright tests exist |
| Integration | ❓ Partial | Razorpay payment flow untested |

### Missing Test Files
- ❌ Unit tests for Auth controller
- ❌ Unit tests for Payment verification
- ❌ Integration tests for FHIR endpoints
- ❌ Unit tests for Socket.IO events
- ❌ Unit tests for Redux slices
- ❌ FHIR schema validation tests

---

## 📝 DOCUMENTATION GAPS

| Aspect | Documented | Notes |
|--------|-----------|-------|
| API Endpoints | ✅ Partial | ARCHITECTURE_REFERENCE.md exists |
| Database Schema | ✅ Partial | Models documented in comments |
| Deployment | ❌ No | No Docker, Kubernetes, or CI/CD docs |
| Development Setup | ❌ No | No setup instructions |
| Environment Variables | ✅ Partial | .env.example exists |
| Socket Events | ⚠️ Incomplete | No list of all events |
| FHIR Mappings | ✅ Partial | FHIR_API.md has some details |
| Consent Flow | ❌ No | Logic implemented but undocumented |
| Payment Flow | ✅ Partial | PAYMENT_GATE_COMPLETE.md |
| Error Codes | ❌ No | Different parts return different formats |

---

## 🚀 RECOMMENDATIONS FOR NEXT STEPS

### High Priority (Security/Stability)
1. Hash OTP before storing in database
2. Implement email verification flow (24-hour expiry)
3. Add OTP expiration (10 minutes)
4. Implement password reset endpoint
5. Add input validation for all endpoints
6. Enable field encryption that's currently commented out

### Medium Priority (Functionality)
1. Implement doctor availability calendar
2. Complete live consultation (video/audio)
3. Add payment failure/refund handling
4. Implement consent revocation
5. Add export to PDF for medical records
6. Complete admin analytics dashboard

### Low Priority (Polish)
1. Add JSDoc comments to all functions
2. Write comprehensive unit tests
3. Add database indexes for FHIR queries
4. Implement pagination for medical records
5. Add email template system (move from code to DB)
6. Consolidate duplicate route definitions

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| **Total Models** | 33 |
| **Total Routes** | ~14 route files |
| **Total Controllers** | ~13 files |
| **Total Middleware** | 8 |
| **Total Frontend Pages** | ~20 |
| **Total Frontend Components** | ~50+ |
| **FHIR Endpoints** | 33 |
| **Socket.IO Events** | ~15+ |
| **Database Collections** | 33 |
| **Third-Party Integrations** | 5 (Cloudinary, Razorpay, Nodemailer, Socket.IO, OAuth) |
| **Lines of Backend Code** | ~15,000+ (estimated) |
| **Lines of Frontend Code** | ~20,000+ (estimated) |

---

## FINAL NOTES

This documentation captures the **current state** of Clinicall as of March 17, 2026. The system is **production-ready** for core features (auth, appointments, payments) but has **critical gaps** in:
- Patient data validation
- Error recovery
- Security hardening
- Testing
- Documentation

The FHIR integration is well-structured and ready for EHR systems to consume. The payment gate successfully locks consultation until payment, and socket.IO real-time communication works for chat and notifications.

**Maintenance Priority:** Focus on validation, error handling, and security before adding new features.

---

**Documentation Generated:** March 17, 2026  
**Generator:** GitHub Copilot (Claude Haiku 4.5)  
**Scope:** Complete backend + frontend codebase  
**Format:** Markdown  
**Applies To:** Clinicall Healthcare Platform v1.0.0

