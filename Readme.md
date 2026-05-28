# 🏥 Clinicall — Healthcare Consultation Platform

> A full-stack healthcare platform enabling patients to book appointments, access FHIR-compliant medical records, and conduct live consultations with doctors — built with React, Node.js, MongoDB, and Socket.IO.



## 📋 Project Description

**Clinicall** is a healthcare consultation platform that digitizes the doctor-patient relationship end to end. It supports multiple user roles — **Patients**, **Doctors**, **Hospital Admins**, and **System Admins** — each with a tailored dashboard and access controls.

Key highlights:
- Patients can search for doctors, book appointments, pay online, and view FHIR R4-compliant electronic health records.
- Doctors can manage appointments, write clinical notes (diagnoses, prescriptions, observations), and conduct live consultations.
- Admins can approve/reject doctor registrations, manage the platform, and send system notifications.
- All sensitive health data is stored using the **HL7 FHIR R4 standard**, making it interoperable with other EHR systems.

---

## 🛠 Technology Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js 5.2.1 |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT (Access + Refresh Tokens) |
| Real-time | Socket.IO 4.8.3 |
| File Storage | Cloudinary |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| Security | bcrypt, Helmet, express-mongo-sanitize, xss-clean, field-encryption |
| Health Records Standard | HL7 FHIR R4 |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19.2.3 |
| Routing | React Router DOM 7.12.0 |
| State Management | Redux Toolkit 2.11.2 |
| HTTP Client | Axios 1.13.3 |
| Real-time | Socket.IO Client 4.8.3 |
| Styling | Tailwind CSS |
| Forms | React Hook Form 7.71.1 |
| PDF Export | jsPDF 4.2.0 |
| Notifications | React-Toastify 11.0.5 |
| Testing | Playwright (E2E) |

### Third-Party Services
- **Cloudinary** — Cloud file and image storage
- **Razorpay** — Online payment gateway
- **Nodemailer** — Transactional email delivery
- **Socket.IO** — Real-time bidirectional communication

---

## ✨ Features and Functionalities

### 👤 Patient (User)
- Register and verify account via OTP email verification
- Search and filter doctors by specialization
- Book, track, and manage appointment requests
- Pay for consultations online via Razorpay
- View complete FHIR R4 medical records (conditions, prescriptions, vitals, lab reports, immunizations, allergies)
- Live consultation via video/chat with doctor
- Grant or manage consent for doctors to access medical records
- Export medical records as PDF/JSON

### 👨‍⚕️ Doctor
- Register and await admin approval with document verification
- Manage incoming appointment requests (approve/reject)
- Create clinical notes using FHIR R4 resources:
  - Conditions (ICD-10 coded diagnoses)
  - Observations (vital signs — LOINC coded)
  - Medication Requests (prescriptions — RxNorm coded)
  - Diagnostic Reports, Procedures, Immunizations
- Access patient medical history (with consent)
- Real-time chat with patients
- Conduct live consultations

### 🔧 Admin
- Approve or reject doctor registration requests
- View and manage all users on the platform
- View system-wide statistics and analytics
- Send notifications to users

### 🏥 Hospital Admin
- Register and manage hospital profile
- View hospital-associated doctors and appointments

### 🔒 Security & Compliance
- JWT-based authentication with access + refresh token rotation
- HIPAA-aligned field-level encryption for sensitive data (PHI)
- FHIR Consent model for patient-controlled data access
- HIPAA audit logging via AuditEvent and AuditLog models
- Brute force protection (account lockout after 5 failed login attempts)
- Helmet, XSS-clean, and Mongo Sanitize middleware

---

## 🏗 System Architecture

```
Frontend (React + Redux)
        │
        │ HTTPS / REST API
        ▼
Backend (Express.js)
   ├── Auth Middleware (JWT)
   ├── Role Middleware (isDoctor, isAdmin)
   ├── Payment Gate (requirePayment)
   ├── Consent Middleware (FHIR access control)
   └── Controllers
         ├── Auth (signup, login, OTP, token refresh)
         ├── Appointments (book, approve, cancel)
         ├── FHIR R4 (33 endpoints — Condition, Observation, MedicationRequest ...)
         ├── Payment (Razorpay order creation & verification)
         ├── Consultation (live session management)
         └── Admin (user/doctor management)
        │
        ▼
MongoDB (Mongoose)
   └── 33 Collections (Users, Appointments, FHIR Resources, Payments ...)

Socket.IO (Real-time)
   ├── Chat (join_chat, send_message, typing)
   ├── Consultation (join_consultation, leave_consultation)
   ├── Notifications (joinRoom, notification)
   └── Consent (requestConsent, consentApproved)

Third-Party Services
   ├── Cloudinary (file/image uploads)
   ├── Razorpay (payment processing)
   └── Nodemailer (email notifications)
```

---

## 🚀 Installation and Execution Steps

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) v18 or above
- [MongoDB](https://www.mongodb.com/) (local or Atlas cloud URI)
- [Git](https://git-scm.com/)
- A Cloudinary account (free tier works)
- A Razorpay account (test mode)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

### Step 2 — Setup the Backend

```bash
# Navigate to backend folder
cd server

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Now open `.env` and fill in the required values (see Environment Variables section below).

```bash
# Start the backend server
npm run dev
```

The backend will start on: `http://localhost:4000`

---

### Step 3 — Setup the Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Fill in the frontend `.env` file (API URL, Cloudinary config).

```bash
# Start the frontend
npm start
```

The frontend will open at: `http://localhost:3000`

---

### Step 4 — Seed the Database (Optional)

To populate the database with initial test data:

```bash
cd server
node Scripts/seedDatabase.js
```

---

### Step 5 — Running Tests (Optional)

```bash
# From the root folder
npm install

# Run Playwright E2E tests
npx playwright test
```

---

## 🔑 Environment Variables

### Backend (`server/.env`)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASEURL=mongodb://localhost:27017/clinicall

# JWT
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Session
SESSION_SECRET=your_session_secret_here

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY=rzp_test_xxxxxxxxxxxx
RAZORPAY_SECRET=your_razorpay_secret

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Field Encryption (32-char hex for PHI fields)
FIELD_ENC_KEY=your_32_char_hex_key_here

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:4000/api/v1
REACT_APP_CLOUDINARY_NAME=your_cloud_name
REACT_APP_CLOUDINARY_PRESET=your_upload_preset
```

---

## 📸 Screenshots

> *(Add your screenshots here. Suggested sections below — replace the placeholder text with actual images)*

### Landing Page
<!-- ![Home Page](screenshots/home.png) -->
<img width="1895" height="1000" alt="Screenshot 2026-05-28 225047" src="https://github.com/user-attachments/assets/ac25e872-4ea4-4c23-b88e-7ebc76c55e87" />



### Patient Dashboard — Appointment Booking
<!-- ![Appointment Booking](screenshots/appointment.png) -->
<img width="1916" height="1006" alt="image" src="https://github.com/user-attachments/assets/61f8619b-4e26-4c3e-b9e0-342918786053" />


### Doctor Dashboard — Clinical Notes (FHIR)
<!-- ![Clinical Notes](screenshots/clinical-notes.png) -->
<img width="1919" height="992" alt="image" src="https://github.com/user-attachments/assets/bc48645e-95ef-4e31-9768-218d81c009fd" />


### Medical Records (FHIR R4)
<!-- ![Medical Records](screenshots/medical-records.png) -->
<img width="1918" height="982" alt="image" src="https://github.com/user-attachments/assets/35486409-b33c-49df-b8c0-d2a1ad7c55ad" />


### Live Consultation
<!-- ![Consultation](screenshots/consultation.png) -->
<img width="1917" height="875" alt="image" src="https://github.com/user-attachments/assets/955ad1f3-fb97-4e83-89bb-0670fe4a2f8d" />



### Admin Dashboard
<!-- ![Admin](screenshots/admin.png) -->
<img width="1919" height="999" alt="image" src="https://github.com/user-attachments/assets/40c98269-b624-4508-8136-b0133b4b8c2e" />


---

## 👥 Team Members

| Name | Role |
|------|------|
| [Neeraj Yadav] | Full Stack / Backend | 
| [Nayan Patidar] | Frontend / UI | 
| [Nimish Lahoti] | Database / FHIR Integration | 

---

## 📄 License

This project was developed as a Mini Project for academic purposes.

---

> **Clinicall** — Bridging patients and doctors through technology.
