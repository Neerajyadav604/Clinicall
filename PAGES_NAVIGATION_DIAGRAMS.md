# 🗺️ VISUAL NAVIGATION MAP & ARCHITECTURE

## App Navigation Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLINICALL APP                              │
│                         (React Router)                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
          ┌───────▼────────┐    ┌▼──────────────▼────────┐     ┌────▼──────────┐
          │ PUBLIC ROUTES  │    │ PROTECTED ROUTES       │     │ ADMIN ROUTES  │
          │ (no auth)      │    │ (role-based)           │     │ (admin only)  │
          └────────────────┘    └────────────────────────┘     └───────────────┘
                  │                      │                            │
         ┌────────┴────────┐    ┌────────┼────────────┐       ┌──────▼──────┐
         │                 │    │        │            │       │             │
     ┌───▼────┐  ┌────────▼──┐ │  ┌────▼─────┐  ┌───▼─────┐  ▼ AdminLayout │
     │   /    │  │ /aboutus  │◄┼──┤ /my-prof │  │ /doctor │  │ (wrapper)   │
     │(Home)  │  │(AboutUs)  │ │  │(MyProf)  │  │/dashboard   └────┬────────┘
     └────────┘  └───────────┘ │  └──────────┘  │(DoctorDash)  │
                                │               └────────────┘   │
         ┌────────────────────┐ │                           ┌────▼───────────┐
         │ /login (Login)     │ │  ┌──────────────────────┐│                 │
         │ /signup (Signup)   │ │  │ DOCTOR ROUTES        ││ /admin (Dash)   │
         │ /verifyemail       │ │  │ (/doctor/*)          ││ /admin/...      │
         └────────────────────┘ │  │ (doctor role)        ││(10 pages)       │
                                │  │                      ││                 │
         ┌────────────────────┐ │  │ /doctor/dashboard    │└─────────────────┘
         │ /search(DoctorSrch)│◄┼──┤ /doctor/profile     │
         │ /appointment       │ │  │ /doctor/edit-prof   │
         │ /hospitals         │ │  │ /doctor/appts       │
         │ /hospitals/:id     │ │  │ /doctor/clinical... │
         └────────────────────┘ │  └──────────────────────┘
                                │
         ┌────────────────────┐ │  ┌──────────────────────┐
         │ /doctor-registrat- │ │  │ USER ROUTES          │
         │  ion               │ │  │ (/my-*)              │
         │ /hospital-registr- │ │  │ (user role)          │
         │  ation             │ │  │                      │
         │ /hospital-admin    │ │  │ /my-profile          │
         │ /test (demo)       │ │  │ /editprofile         │
         │                    │ │  │ /medical-records     │
         │ ⚠️ /ai-chat        │◄┼──┤ /fhir-connect       │
         │ (ORPHANED)         │ │  │ /my-requests         │
         └────────────────────┘ │  │ /chat/:appointId     │
                                │  └──────────────────────┘
         ┌────────────────────┐ │  ┌──────────────────────┐
         │ ❌ /admin-login    │ │  │ HOSPITAL ADMIN       │
         │ ❌ /privacy        │◄┼──┤ /hospital-admin      │
         │ ❌ /terms          │ │  │ (hospital-admin role)│
         └────────────────────┘ │  └──────────────────────┘
             (MISSING)          │
                               (referenced but no route/file)
```

---

## Page Dependency Graph

```
                        ┌──────────────┐
                        │     App      │
                        └──────┬───────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼─────┐        ┌──────▼──────┐      ┌──────▼──────┐
    │ Public   │        │ Protected   │      │ Admin       │
    │ Pages    │        │ Pages       │      │ Pages       │
    └────┬─────┘        └──────┬──────┘      └──────┬──────┘
         │                     │                     │
    ┌────┴──────────────┐  ┌───┼─────────┐      ┌───▼──────┐
    │                   │  │   │         │      │           │
┌───▼───┐  ┌────────┐  │  │   │     ┌────▼───┐ │ AdminLayout
│Home   │  │AboutUs├──┼──┼───┤     │Patient  │ │ (role check)
│(hero) │  │Footer○├──┼──┼─┐ │     │Pages    │ └──────┬─────┘
└───┬───┘  └──┬─────┘  │  │ │ │     └────┬───┘        │
    │         │        │  │ │ │          │            ├─────────┐
    │         │        │  │ │ │    ┌─────▼───┐   ┌────▼───┐    │
    │         ▼        │  │ │ ├───→│MyProfile│   │Doctor  │    │
    │      ❌ /privacy │  │ │ │    │(sidebar)    │Pages   │    │
    │      ❌ /terms   │  │ │ │    └─────┬───┘   └────┬───┘    │
    │                 │  │ │ │          │            │         │
    ├→ /search───────┐│  │ │ │    ┌─────▼──────┐    │    ┌─────▼───┐
    │                 ││  │ │ │    │MedicalRecs │    │    │Dashboard
    ├→ /appointment──┐││  │ │ │    │(FHIR)     │    │    │(stats)
    │                 │││  │ │ │    └────────────┘    │    └───┬─────┘
    ├→ /hospitals────┐│││  │ │ │                     │        │
    │            /:id───┐││  │ │ │    ┌─────────────┐│        │
    │                   ││├──┤ │ │    │MyRequests   ├┼───────→│
    └─────┬─────────────┘││  │ │ │    │(Razorpay)  ││        │
          │              ││  │ │ │    └─────┬───────┘│        │
          │              ││  │ │ │          │        │        │
      ┌───▼────────┐     ││  │ │ │    ┌─────▼───┐   │        │
      │Login       │     ││  │ │ └───→│Chat     │←──┼────────│────────┐
      │Signup      │     ││  │ │      │(Socket) │   │        │        │
      │VerifyEmail●├─────┘│  │ │      └─────────┘   │        │        │
      │Doctor-Reg ○├──────┼──┤ └───────────────────┘  │        │        │
      │Hospital-Reg├──────┼──┤                        │        │        │
      │Hospital-Adm├──────┼──┤                   ┌────▼───┐   │        │
      │Test (demo) │      │  │                   │Clinical│   │        │
      │⚠️AI-Chat   │      │  │                   │Notes   │   │        │
      └────────────┘      │  │                   │(FHIR)  │───┘        │
                          │  │                   └────────┘             │
                          │  └─────────────────────────────┐            │
                          │                                 │            │
                          └─────────────────────────────────┼────────────┘
                                                            │
                                                     (Circle = Link Back)
```

---

## Role-Based Access Matrix

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL                         │
└──────────────────────────────────────────────────────────────────────┘

Route                          │ All │ User │ Doctor │ Hosp-Admin │ Admin
───────────────────────────────┼─────┼──────┼────────┼────────────┼──────
/                              │  ✓  │  ✓   │   ✓    │     ✓      │  ✓
/aboutus, /contact, /test     │  ✓  │  ✓   │   ✓    │     ✓      │  ✓
/login, /signup, /verifyemail │  ✓  │  ~   │   ~    │     ~      │  ~
/search, /appointment          │  ✓  │  ✓   │   ~    │     ✓      │  ✓
/hospitals, /hospitals/:id     │  ✓  │  ✓   │   ✓    │     ✓      │  ✓
/doctor-registration           │  ✓  │  ✓   │   ✗    │     ✓      │  ✓
/hospital-registration         │  ✓  │  ✓   │   ~    │     ~      │  ✓
/hospital-admin *              │  ✗  │  ✗   │   ✗    │     ✓      │  ✗
│
/my-profile *                  │  ✗  │  ✓   │   ✗    │     ✗      │  ✗
/editprofile *                 │  ✗  │  ✓   │   ✗    │     ✗      │  ✗
/medical-records *             │  ✗  │  ✓   │   ✗    │     ✗      │  ✗
/fhir-connect *                │  ✗  │  ✓   │   ✗    │     ✗      │  ✗
/my-requests *                 │  ✗  │  ✓   │   ✗    │     ✗      │  ✗
/chat/:appointmentId *         │  ✗  │  ✓   │   ✓    │     ✗      │  ✗
│
/doctor/dashboard *            │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
/doctor/profile *              │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
/doctor/edit-profile *         │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
/doctor/appointments *         │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
/doctor/chat/:appointmentId *  │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
/doctor/clinical-notes/:id *   │  ✗  │  ✗   │   ✓    │     ✗      │  ✗
│
/admin/* *                     │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/dashboard *             │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/analytics *             │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/registrations *         │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/appointments *          │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/users *                 │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/approved-doctors *      │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/rejected-doctors *      │  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/hospital-registrations *│  ✗  │  ✗   │   ✗    │     ✗      │  ✓
/admin/hospitals *             │  ✗  │  ✗   │   ✗    │     ✗      │  ✓

Legend:
✓  = Can access
✗  = Cannot access / Redirected
~  = Can access but redirects after auth
*  = Protected by ProtectedRoute or AdminLayout
```

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      REDUX STATE MANAGEMENT                        │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   store.js          │
│   (Redux Config)    │  ┌──────────────┐
└──────────┬──────────┘  │ Slices:      │
           │             │              │
           │             ├─ auth        ← Login/Signup/Logout
           │             │ (token, user)
           │             │
           │             ├─ profile     ← MyProfile/EditProfile
           │             │ (userInfo)   → MedicalRecords
           │             │              → FHIR operations
           │             │
           │             ├─ fhir        ← FhirConnect
           │             │ (FHIR data)  → Medical/Clinical pages
           │             │              → Conditions, Meds, etc.
           │             │
           │             ├─ doctor      ← DoctorDashboard
           │             │ (doc data)   → Appointments
           │             │              → ClinicalNotes
           │             │
           │             ├─ admin       ← AdminDashboard
           │             │              → All admin pages
           │             │
           │             └─ chat        ← Chat.jsx
           │               (messages)   → Real-time Socket.IO
           └──────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER (APIs)                         │
└────────────────────────────────────────────────────────────────────┘

Services:
├─ Authapi.js              ← Login, Signup, Verify Email, Logout
├─ operations/
│  ├─ Profileapi.js        ← Update user profile
│  ├─ SearchApi.js         ← Doctor search, Appointments
│  ├─ hospitalAdminApi.js  ← Hospital management
│  ├─ consultationApi.js   ← Chat, appointments
│  └─ doctorApi.js         ← Doctor operations
├─ fhirApi.js              ← FHIR Smart Launch, Conditions, etc.
├─ aiApi.js                ← AI Chat (AIChat.jsx)
├─ adminApi.js             ← Admin analytics & management
└─ socketManager.js        ← Socket.IO real-time connection

┌────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME FEATURES                              │
└────────────────────────────────────────────────────────────────────┘

Socket.IO Events:
├─ Chat.jsx (both user & doctor)
│  ├→ sendMessage
│  ├→ receiveMessage
│  ├→ fileAttachment
│  └→ typing indicators
│
└─ ClinicalNotes.jsx (doctor)
   ├→ conditionCreated
   ├→ observationCreated
   └→ medicationAdded
```

---

## Component Reusability Matrix

```
SHARED COMPONENTS USED ACROSS PAGES:

┌─────────────────────────────────────┐
│   Component          │   Used in    │
├──────────────────────┼──────────────┤
│ Sidebar              │ MyProfile ✓  │
│                      │ MedicalRecs ✓│
│                      │              │
│ DoctorLayout         │ All /doctor/*│
│ (nav wrapper)        │ pages (5)    │
│                      │              │
│ AdminLayout          │ All /admin/* │
│ (nav wrapper)        │ pages (10)   │
│                      │              │
│ ProtectedRoute       │ User pages   │
│ (access guard)       │ Doctor pages │
│                      │ Chat pages   │
│                      │              │
│ GlobalNavbar         │ Public pages │
│ (header)             │ (except Admin)
│                      │              │
│ SiteFooter           │ Home ✓       │
│                      │ AboutUs ✓    │
│                      │ ContactUs ✓  │
│                      │              │
│ ChatWidget           │ All public   │
│ (floating chat)      │ (auto attach)│
│                      │              │
│ TableComponent       │ Admin pages  │
│ (reusable table)     │ (8 pages)    │
│                      │              │
│ Modal/Dialog         │ ~8 pages     │
│                      │              │
│ StatCard             │ Dashboards   │
│                      │ (4 pages)    │
└──────────────────────┴──────────────┘
```

---

## Third-Party Integration Map

```
EXTERNAL SERVICES & LIBRARIES:

📱 Socket.IO
├─ Chat.jsx              (real-time messaging)
└─ ClinicalNotes.jsx     (real-time updates)

💳 Razorpay
└─ MyRequests.jsx        (payment gateway)

🔐 OAuth / SMART Launch
└─ FhirConnect.jsx       (external EHR integration)

🏥 FHIR Servers
├─ MedicalRecords.js     (fetch patient data)
├─ MyProfile.js          (health info)
├─ ClinicalNotes.jsx     (create clinical records)
└─ FhirConnect.jsx       (sync with external EHR)

🎤 Voice/Speech API
└─ Apponintment.js       (voice search)

🗺️ Google Maps API
└─ HospitalProfile.jsx   (navigation)

✉️ Email Service
├─ Signup.js             (OTP)
├─ Login.js              (password reset)
└─ DoctorRegistrations   (approval/rejection)

🎨 3D Animation
├─ UnicornScene          (Test.jsx - demo)
└─ Framer Motion         (multiple pages)

📊 Charting Library
└─ Analytics.jsx         (trend data visualization)
```

---

## Page Loading Flow

```
USER AUTHENTICATION FLOW:
1. /login (email/password)
   ↓
2. dispatch(login()) → Redux auth
   ↓
3. Role-based redirect:
   ├→ role="admin"        → /admin (AdminLayout)
   ├→ role="doctor"       → /doctor/dashboard (DoctorLayout)
   ├→ role="hospital"     → /hospital-admin
   └→ role="user"         → /my-profile (Sidebar nav)

DOCTOR ONBOARDING FLOW:
1. /doctor-registration (form)
   ↓
2. Submit application
   ↓
3. Admin reviews at /admin/registrations
   ↓
4. On approval: Doctor gets login
   ↓
5. First login → /login (with role="doctor")
   ↓
6. Redirect → /doctor/dashboard

PATIENT HEALTH RECORD FLOW:
1. /my-profile (view basic info)
   ↓
2. /medical-records (view EHR)
   ↓
3. /fhir-connect (sync external EHR)
   ↓
4. Data flows from external → FHIR server → Patient app
   ↓
5. Doctor accesses via /doctor/clinical-notes/:patientId
```

---

## Error & Fallback Handling

```
ROUTE FALLBACK PATHS:

DoctorRoutes: path="*" → redirects to /doctor/dashboard
AdminRoutes:  path="*" → redirects to /admin (or /)
App.js:       no wildcard catch-all (404 pages not implemented)

MISSING ROUTES → 404 (React Router default):
- /admin-login      (referenced but not routed)
- /privacy          (referenced but not routed)
- /terms            (referenced but not routed)
- /ai-chat          (file exists but no route)
- Any undefined path

ROLE MISMATCH HANDLING:
- ProtectedRoute component checks role
- Redirects to home (/) if unauthorized
- Toast shows error message
- AdminLayout redirects non-admins to / with error

CHAT ACCESS VERIFICATION:
- Chat.jsx calls checkChatAccess()
- Validates user/doctor has appointment access
- Redirects with error if unauthorized
```

