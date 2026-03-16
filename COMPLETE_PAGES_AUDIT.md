# 📋 COMPREHENSIVE PROJECT PAGES AUDIT
**Generated**: March 15, 2026  
**Total Pages Found**: 37 (36 routed + 1 orphaned)  
**Missing Pages**: 3 referenced but not created  
**Orphan Pages**: 1 exists but not routed  

---

## EXECUTIVE SUMMARY

### Page Counts by Category
| Category | Total | Complete | Incomplete | Missing |
|----------|-------|----------|-----------|---------|
| **Root Pages** | 21 | 20 | 0 | 1 |
| **Admin Pages** | 10 | 10 | 0 | 0 |
| **Doctor Pages** | 5 | 5 | 0 | 0 |
| **ORPHAN Pages** | 1 | 1 | 0 | 0 |
| **MISSING Pages** | 3 | 0 | 0 | 3 |
| **TOTAL** | **37** | **35** | **0** | **3** |

---

## 📑 PART 1: ROOT PAGES (src/pages/)

### 1. Home Page
- **Page Name**: Home  
- **File Path**: [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)  
- **Route/URL**: `/`  
- **Purpose**: Landing page with hero section, feature highlights, doctor CTA section, testimonials, and footer with call-to-action for appointment booking.  
- **Key Components Used**: `MinimalistHero`, `WhyChooseUs`, `HowItWorks`, `DoctorCTA`, `TestimonialCarouselSection`, `SiteFooter`, social media links (Facebook, Instagram, Twitter, LinkedIn)  
- **API Calls / FHIR Resources**: None  
- **User Role Access**: All (public)  
- **Current Status**: ✅ Complete  
- **Dependencies**: `WhyChooseUs` component, `HowItWorks` component, `DoctorCTA` component, `TestimonialCarouselSection` component  
- **Navigation**: Links TO: `/appointment` (Book Appointment CTA), `/aboutus` (implied),  Links FROM: All global navbar links, external sidebar, footer  

---

### 2. About Us Page
- **Page Name**: About Us  
- **File Path**: [frontend/src/pages/AboutUs.js](frontend/src/pages/AboutUs.js)  
- **Route/URL**: `/aboutus`  
- **Purpose**: Displays company mission, service offerings, team info with hero section, service cards, and social media links.  
- **Key Components Used**: `SiteFooter`, service cards with lucide-react icons, social media icons, background image sections  
- **API Calls / FHIR Resources**: None  
- **User Role Access**: All (public)  
- **Current Status**: ✅ Complete  
- **Dependencies**: `SiteFooter` component, lucide-react icons  
- **Navigation**: Links TO: Social media (Facebook, Instagram, Twitter, LinkedIn as "#" placeholders), Links FROM: Home hero section, global navbar  

---

### 3. Contact Us Page
- **Page Name**: Contact Us  
- **File Path**: [frontend/src/pages/ContactUs.js](frontend/src/pages/ContactUs.js)  
- **Route/URL**: `/contact`  
- **Purpose**: Multi-step contact form (3 steps) with contact information cards, tooltips for field help, and embedded footer with social integration.  
- **Key Components Used**: `MultiStepForm`, `Alert`, `Input`, `Label`, `Select`, `Tooltip`, `SiteFooter`, contact info cards  
- **API Calls / FHIR Resources**: Form validation (client-side, no backend calls visible)  
- **User Role Access**: All (public)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Form components from UI library, SiteFooter component  
- **Navigation**: Links TO: External links (tel:+911234567890, email support links), Links FROM: Global navbar, Home page  

---

### 4. Login Page
- **Page Name**: Login / Sign In  
- **File Path**: [frontend/src/pages/Login.js](frontend/src/pages/Login.js)  
- **Route/URL**: `/login`  
- **Purpose**: User authentication page with email/password login, remember-me checkbox, form validation, password reset link, and social login placeholders.  
- **Key Components Used**: Email/password inputs with floating labels, remember-me toggle, error message display, social login button placeholders (Google, GitHub icons)  
- **API Calls / FHIR Resources**: `dispatch(login())` from Redux/Authapi  
- **User Role Access**: All (public, but redirects authenticated users)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Redux auth dispatcher, form validation utilities  
- **Navigation**: Links TO: `/` (Clinicall logo), `/signup` (Sign up link), Password reset email link, Links FROM: All unauthenticated navigation flows, logout actions  

---

### 5. Sign Up Page
- **Page Name**: Sign Up / Registration  
- **File Path**: [frontend/src/pages/Signup.js](frontend/src/pages/Signup.js)  
- **Route/URL**: `/signup`  
- **Purpose**: User registration form with name, email, phone, password fields and OTP email verification initiation; redirects to VerifyEmail on success.  
- **Key Components Used**: Multi-field form with individual validation, password visibility toggle, social login placeholders, error notifications  
- **API Calls / FHIR Resources**: `dispatch(setSignupData())`, `dispatch(sendOtp())` from Redux/Authapi; POST to backend for OTP generation  
- **User Role Access**: All (public, registers as "user" role)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Redux auth slices, email OTP service  
- **Navigation**: Links TO: `/verifyemail` (after OTP sent), Links FROM: Login page, global navbar for unauthenticated users  

---

### 6. Verify Email Page
- **Page Name**: Email Verification  
- **File Path**: [frontend/src/pages/VerifyEmail.js](frontend/src/pages/VerifyEmail.js)  
- **Route/URL**: `/verifyemail`  
- **Purpose**: Email OTP verification page for completing signup flow; accepts 6-digit OTP input with resend functionality and creates user account.  
- **Key Components Used**: OtpInput (from react-otp-input), form submission button, resend OTP timer, email display  
- **API Calls / FHIR Resources**: `dispatch(sendOtp())` for resend, `dispatch(signup())` to complete registration via Redux/Authapi  
- **User Role Access**: Users in signup flow (requires valid signupData in Redux)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Redux signup data, react-otp-input library, OTP backend service  
- **Navigation**: Links TO: `/login` (after successful verification), `/signup` (if user goes back), Uses `useNavigate` to redirect Based on signup status  
- **Validation**: Redirects to `/signup` if signupData not found in Redux state  

---

### 7. Doctor Registration Page
- **Page Name**: Doctor Registration  
- **File Path**: [frontend/src/pages/DoctorRegistrationPage.jsx](frontend/src/pages/DoctorRegistrationPage.jsx)  
- **Route/URL**: `/doctor-registration`  
- **Purpose**: Multi-step (4+) doctor registration form capturing profile photo, qualifications, specializations, hospital affiliations, certifications/documents, and payment/verification info.  
- **Key Components Used**: `Stepper` component, form sections with file upload (profile photo), document upload boxes with drag-n-drop, hospital selection dropdown (fetches from API), form validation with error display, registration summary sidebar  
- **API Calls / FHIR Resources**: `doctorRegistration()`, `getDoctorRegistrationStatus()`, `getAllHospitals()` from `../services/operations/doctorapi`  
- **User Role Access**: Authenticated users (requires token); allows current users to register as doctors  
- **Current Status**: ✅ Complete  
- **Dependencies**: Hospital list API, file upload service, Redux auth state, validation utilities  
- **Navigation**: Links TO: Redirects to `/doctor` (doctor dashboard) on successful registration (2.5s delay), `/my-profile` (back button), `/login` (if unauthorized), Links FROM: Navbar "Register" link for users, Home page  

---

### 8. Doctor Search Page
- **Page Name**: Doctor Search & Booking  
- **File Path**: [frontend/src/pages/DoctorSearch.jsx](frontend/src/pages/DoctorSearch.jsx)  
- **Route/URL**: `/search`  
- **Purpose**: Doctor discovery page with search functionality, specialty/location filters, doctor result cards with ratings/experience/consultation fees, and inline appointment request modal.  
- **Key Components Used**: Search input with autocomplete, specialty quick-access buttons, doctor result cards (avatar, name, specialty, experience, rating, fees), appointment request modal with date/time/reason fields, loading skeletons  
- **API Calls / FHIR Resources**: `searchDoctors()`, `requestAppointment()` from `../services/operations/SearchApi`; may call consultation booking backend  
- **User Role Access**: All (authenticated users can request appointments)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Search/filter API, doctor data service, appointment request service  
- **Navigation**: Links TO: Stays on same page for search interactions, opens modal for booking, Links FROM: Navbar "Appointment" link, Home page  

---

### 9. Appointment Booking Page
- **Page Name**: Appointment Booking / Scheduling  
- **File Path**: [frontend/src/pages/Apponintment.js](frontend/src/pages/Apponintment.js)  
- **Route/URL**: `/appointment`  
- **Purpose**: Complex appointment booking interface with doctor search, specialty filtering (quick buttons), recent bookings/searches history, voice search capability, real-time doctor availability, and appointment request submission with payment integration.  
- **Key Components Used**: Search bar with microphone support (voice search), specialty quick-access buttons, doctor availability cards with time slots, recent bookings list from localStorage, appointment request form with notes field, payment integration  
- **API Calls / FHIR Resources**: `searchDoctors()`, `requestAppointment()`, voice/audio API for speech recognition from `../services/operations/SearchApi`  
- **User Role Access**: Authenticated users (patient/user role); requires localStorage token  
- **Current Status**: ✅ Complete  
- **Dependencies**: Search API, voice search service, appointment request service, localStorage utilities  
- **Navigation**: Links TO: Consultation pages (implied from request), Links FROM: Navbar "Appointment" link, Home "Book an Appointment" CTA  

---

### 10. My Profile Page
- **Page Name**: Patient Dashboard / Profile Dashboard  
- **File Path**: [frontend/src/pages/MyProfile.js](frontend/src/pages/MyProfile.js)  
- **Route/URL**: `/my-profile`  
- **Purpose**: Patient dashboard displaying personal health information (profile avatar, conditions, allergies), health utilities, consent management for data sharing, access logs showing who accessed health data, document vault, and export functionality with current role display.  
- **Key Components Used**: `Sidebar` (with navigation to other patient pages), `AvatarUploader`, personal info display grid, `PillList` (conditions/allergies tags), `ConsentManager`, `AccessLogViewer`, `DocumentVault`, health utilities section (e.g., export)  
- **API Calls / FHIR Resources**: `fetchUserProfile()`, `getConditions()`, `getAllergies()`, `triggerExport()`, `pollExportStatus()`, `getPendingConsentRequests()`, `getAccessLogs()` from FHIR/custom APIs via Redux dispatch  
- **User Role Access**: Authenticated users (patient/user role); displays personal health data  
- **Current Status**: ✅ Complete  
- **Dependencies**: FHIR data APIs, Redux state management, file export service, consent management backend  
- **Navigation**: Sidebar links TO: `/my-profile`, `/medical-records`, `/my-requests`, `/appointment`, `/editprofile`, logout via Redux dispatch, Edit Profile button, Links FROM: Global navbar, authenticated user flows  

---

### 11. Edit Profile Page
- **Page Name**: Edit User Profile  
- **File Path**: [frontend/src/pages/EditProfile.js](frontend/src/pages/EditProfile.js)  
- **Route/URL**: `/editprofile`  
- **Purpose**: User profile editor form for updating basic info, medical history (allergies, medications, medical conditions), insurance information, and avatar upload with field validation.  
- **Key Components Used**: `ProfileAvatar` component, form inputs using react-hook-form, custom `TextInput`, `TextArea`, `SelectInput` components, form validation messages  
- **API Calls / FHIR Resources**: `updateUserProfile()` from `../services/operations/Profileapi`  
- **User Role Access**: Authenticated users (patient/user role)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Profile update API, form validation utilities, redux auth state  
- **Navigation**: Links TO: Navigates back to `/my-profile` after successful update (uses `navigate(-1)` and explicit navigation), Links FROM: My Profile page, navbar profile options  

---

### 12. Medical Records Page
- **Page Name**: Medical Records / EHR Dashboard  
- **File Path**: [frontend/src/pages/MedicalRecords.js](frontend/src/pages/MedicalRecords.js)  
- **Route/URL**: `/medical-records`  
- **Purpose**: Comprehensive electronic health record (EHR) dashboard displaying patient clinical data in organized sections: conditions, allergies, medications, observations/vitals, diagnostic reports, procedures, immunizations; includes HIPAA compliance notice, allergy warnings, medical timeline, charts, consent manager, and access logs viewer.  
- **Key Components Used**: `Sidebar`, `HIPAABanner`, `AllergyWarningBanner`, `MedicalTimeline`, `VitalSignsChart`, `MedicationList`, `LabResultsViewer`, `ConsentManager`, `AccessLogViewer`, `DocumentVault`, data section headers  
- **API Calls / FHIR Resources**: 
  - `getConditions()` (FHIR Condition)
  - `getAllergies()` (FHIR AllergyIntolerance)
  - `getObservations()` (FHIR Observation - vitals/lab results)
  - `getMedicationRequests()` (FHIR MedicationRequest)
  - `getDiagnosticReports()` (FHIR DiagnosticReport)
  - `getProcedures()` (FHIR Procedure)
  - `getImmunizations()` (FHIR Immunization)
  - `getPendingConsentRequests()` (Custom consent API)
  
- **User Role Access**: Authenticated patients/users only; protected via ProtectedRoute with requiredRole="user"  
- **Current Status**: ✅ Complete  
- **Dependencies**: FHIR API service, Redux slices for caching, consent backend service, access log logging system, HIPAA compliance utilities  
- **Navigation**: Sidebar navigation to `/my-profile`, `/medical-records`, `/my-requests`, `/appointment`, `/editprofile`, logout, Links FROM: Navbar for authenticated users, My Profile page  

---

### 13. My Requests Page
- **Page Name**: Appointment Requests / Consultation Tracker  
- **File Path**: [frontend/src/pages/MyRequests.jsx](frontend/src/pages/MyRequests.jsx)  
- **Route/URL**: `/my-requests`  
- **Purpose**: Patient appointment/consultation request tracker displaying request status (All/Pending/Approved/Rejected), mode selection (online via chat or offline in-clinic), payment and consultation payment gateway integration (Razorpay), and chat/consultation access.  
- **Key Components Used**: Status filter tabs, request card grid with status badges, consultation mode selector (online/offline), payment modal for Razorpay integration, request detail cards  
- **API Calls / FHIR Resources**: 
  - `getUserRequests()` (fetch user's appointment requests)
  - `getRequestsByStatus()` (filter by status)
  - `setConsultationMode()` (set online/offline preference)
  - `initiatePayment()` (Razorpay integration)
  - `verifyPayment()` (payment verification)
  - `checkChatAccess()` (verify chat access rights)
  
- **User Role Access**: Authenticated users (patient role) only; protected via ProtectedRoute with requiredRole="user"  
- **Current Status**: ✅ Complete  
- **Dependencies**: Appointment request API, Razorpay payment gateway, consultation API, chat access validator  
- **Navigation**: Links TO: Chat page (via `/chat/:appointmentId` when approved), Links FROM: Navbar for authenticated users, My Profile sidebar  

---

### 14. Chat Page
- **Page Name**: Consultation Chat / Doctor-Patient Messaging  
- **File Path**: [frontend/src/pages/Chat.jsx](frontend/src/pages/Chat.jsx)  
- **Route/URL**: `/chat/:appointmentId` (patient), `/doctor/chat/:appointmentId` (doctor)  
- **Purpose**: Real-time doctor-patient messaging interface with file attachment support (documents/images), Socket.IO live updates, message timestamps, access control verification, and file preview/download.  
- **Key Components Used**: `MessageBubble` (with user/AI distinction), `MessageList`, file preview (inline images, download links), message input field with file attachment button, loading state, Socket.IO event listeners  
- **API Calls / FHIR Resources**: 
  - `checkChatAccess()` (verify user/doctor has permission)
  - Socket.IO connection for real-time messaging
  - File download/preview from attachment URLs
  
- **User Role Access**: 
  - Patients (user role) accessing `/chat/:appointmentId` - must be request creator
  - Doctors (doctor role) accessing `/doctor/chat/:appointmentId` - must be assigned doctor
  
- **Current Status**: ✅ Complete (access control is implemented)  
- **Dependencies**: Socket.IO client library, consultation/chat API, file service for attachments  
- **Navigation**: Links TO: Back to `/my-requests` (user) or `/doctor/appointments` (doctor) on error/back action, Links FROM: My Requests page, Doctor Appointments page  
- **Error Handling**: Redirects on unauthorized access via `handleUnauthorized()` function; toast error messages on connection failure  

---

### 15. FHIR Connect Page
- **Page Name**: EHR Integration / FHIR Smart Launch  
- **File Path**: [frontend/src/pages/FhirConnect.jsx](frontend/src/pages/FhirConnect.jsx)  
- **Route/URL**: `/fhir-connect`  
- **Purpose**: External EHR/FHIR server integration page for connecting patient's medical records from external health systems; allows selecting sync direction (pull/push/bidirectional), displays connection status, and manages authentication tokens.  
- **Key Components Used**: Connection status card, sync direction selector radio buttons, token expiry display, modal for sync options, framer-motion animations  
- **API Calls / FHIR Resources**: 
  - `fhirApi.initiateSmartLaunch()` (OAuth/SMART launch)
  - `fhirApi.disconnectFhir()` (disconnect from EHR)
  - `dispatch(syncPatientThunk())` (Redux async thunk for data sync)
  - `dispatch(checkConnectionStatusThunk())` (check FHIR connection status)
  
- **User Role Access**: Authenticated patients (user role) only; protected via ProtectedRoute with requiredRole="user"  
- **Current Status**: ✅ Complete  
- **Dependencies**: FHIR API service, OAuth/SMART launch implementation, Redux FHIR slices, framer-motion for animations  
- **Navigation**: Links TO: None (modal-based interactions), Links FROM: Navbar, My Profile sidebar  

---

### 16. Hospital List Page
- **Page Name**: Hospital / Clinic Directory  
- **File Path**: [frontend/src/pages/HospitalList.jsx](frontend/src/pages/HospitalList.jsx)  
- **Route/URL**: `/hospitals`  
- **Purpose**: Browse and discover hospitals/clinics with entity type filtering (All/Hospitals/Clinics), search by name/city, specialty filtering, rating display, and view hospital detail option.  
- **Key Components Used**: Tab toggles (All/Hospitals/Clinics), search input field, specialty dropdown filter, hospital card grid (logo, name, city, specialties, rating), pagination or infinite scroll  
- **API Calls / FHIR Resources**: `getAllHospitals()` from `../services/operations/hospitalAdminApi`  
- **User Role Access**: All (public listing)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Hospital API service  
- **Navigation**: Hospital cards link to `/hospitals/:id` (hospital detail), navbar links TO this page, Links FROM: Home page, navbar, hospital admin CTA  

---

### 17. Hospital Profile Page
- **Page Name**: Hospital / Clinic Detail Profile  
- **File Path**: [frontend/src/pages/HospitalProfile.jsx](frontend/src/pages/HospitalProfile.jsx)  
- **Route/URL**: `/hospitals/:id` (dynamic ID parameter)  
- **Purpose**: Detailed hospital/clinic profile displaying cover image, logo, name/type badges, about section, contact information, operating hours, affiliated doctors list, and optional Google Maps integration for navigation.  
- **Key Components Used**: Header with cover image and logo, info grid (address, phone, website), about section text, doctors list with links, hours/timing display, map section (optional Google Maps embed or <a> to Google Maps)  
- **API Calls / FHIR Resources**: 
  - `getHospitalById()` (fetch hospital details by ID)
  - `getHospitalDoctors()` (fetch affiliated doctors)
  - Uses useParams() for hospital ID extraction
  
- **User Role Access**: All (public profile)  
- **Current Status**: ✅ Complete  
- **Dependencies**: Hospital API service, hospital data structure with fields: website, latitude/longitude for maps  
- **Navigation**: Uses useParams for `:id`, provides back button via `useNavigate`, website link to external URL, Google Maps link `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, Links FROM: Hospital List page  

---

### 18. Hospital Registration Page
- **Page Name**: Hospital / Clinic Registration  
- **File Path**: [frontend/src/pages/HospitalRegistrationPage.jsx](frontend/src/pages/HospitalRegistrationPage.jsx)  
- **Route/URL**: `/hospital-registration`  
- **Purpose**: Multi-step (5+) hospital/clinic registration form capturing basic info (name, type, city), address/location, regulatory documents (MOA, registration), operating hours/timing by day, contact person details, and optional medical specializations.  
- **Key Components Used**: `Stepper` component (multiple steps), entity type selector (hospital/clinic), location input with map, document upload boxes with drag-n-drop, time picker for operating hours by day, form validation, registration summary sidebar  
- **API Calls / FHIR Resources**: 
  - `submitHospitalRegistration()` (submit registration form)
  - `getHospitalRegistrationStatus()` (check pending status)
  
- **User Role Access**: Unauthenticated or hospital owner/admin role; allows registration before login  
- **Current Status**: ✅ Complete  
- **Dependencies**: Hospital registration API, file upload service, form validation, location service  
- **Navigation**: Links TO: Redirects to `/hospital-admin` (hospital admin dashboard) on success, `/login` (if auth required), Links FROM: Navbar "Register Hospital", Home page, footer links  

---

### 19. Hospital Admin Dashboard
- **Page Name**: Hospital Admin Panel / Doctor Registration Review  
- **File Path**: [frontend/src/pages/HospitalAdminDashboard.jsx](frontend/src/pages/HospitalAdminDashboard.jsx)  
- **Route/URL**: `/hospital-admin`  
- **Purpose**: Hospital admin interface for reviewing and managing doctor registration applications from doctors wanting to join the hospital; shows pending/approved/rejected applications with approve/reject actions and rejection reason modal.  
- **Key Components Used**: Status tabs (Pending/Approved/Rejected), doctor application cards with credentials, action buttons (Approve/Reject), rejection reason input modal, confirmation for actions  
- **API Calls / FHIR Resources**: 
  - `getHospitalDoctorRegistrations()` (fetch pending doctor applications)
  - `approveHospitalDoctorRegistration()` (approve doctor)
  - `rejectHospitalDoctorRegistration()` (reject with reason)
  
- **User Role Access**: Hospital admin role; checks `user.hospitalName` or `profile.hospitalName`; redirects non-hospital-admins to home with error  
- **Current Status**: ✅ Complete (role validation is strict)  
- **Dependencies**: Hospital admin API service  
- **Navigation**: Links TO: `/hospitals` (View Public Listing button), Links FROM: Hospital registration completion, navbar for hospital admins  

---

### 20. Test Page (Demo/Prototype)
- **Page Name**: AI Doctor / MediAI Landing (Demo)  
- **File Path**: [frontend/src/pages/Test.jsx](frontend/src/pages/Test.jsx)  
- **Route/URL**: `/test`  
- **Purpose**: Animated landing page demo/prototype showcasing AI doctor matching, scheduling, reminders, security features, health dashboard with feature cards, testimonial cards, counter animations, and 3D animations.  
- **Key Components Used**: `Counter` (animated number counters), `FeatureCard`, `TestimonialCard`, NavLink elements, `UnicornScene` (3D animation component), framer-motion animations  
- **API Calls / FHIR Resources**: None (demo/test page)  
- **User Role Access**: All (public demo page, testing purposes)  
- **Current Status**: ✅ Complete (test/demo page)  
- **Dependencies**: 3D component library (UnicornScene), framer-motion  
- **Navigation**: Demo nav links with hover effects, social media links, Links FROM: May be linked from admin/dev environments only  

---

### 21. AI Chat Page (ORPHAN ⚠️)
- **Page Name**: AI Health Assistant Chat  
- **File Path**: [frontend/src/pages/AIChat.jsx](frontend/src/pages/AIChat.jsx)  
- **Route/URL**: ❌ **NOT ROUTED** (orphaned page)  
- **Purpose**: Real-time AI health assistant chat interface with message history, user/AI message distinction, send/receive functionality, and loading states.  
- **Key Components Used**: message bubbles (styled for user vs AI), input field, submit button, message list with scrolling  
- **API Calls / FHIR Resources**: `chatWithAI()` from `../services/aiApi` (error handling for API failures)  
- **User Role Access**: Should support all (but not currently accessible via routing)  
- **Current Status**: ⚠️ **EXISTS BUT ORPHANED** - Page file exists but NOT imported in App.js, no route defined  
- **Dependencies**: AI API service (aiApi)  
- **Navigation**: No navigation exists (disconnected from app routing)  
- **ACTION NEEDED**: Either:
  1. Add route to App.js: `<Route path="/ai-chat" element={<AIChat />} />`
  2. Add import: `import AIChat from './pages/AIChat'`
  3. Or delete file if no longer needed

---

---

## 📑 PART 2: DOCTOR PAGES (src/pages/doctor/)

### 1. Doctor Dashboard
- **Page Name**: Doctor Overview Dashboard  
- **File Path**: [frontend/src/pages/doctor/DoctorDashboard.jsx](frontend/src/pages/doctor/DoctorDashboard.jsx)  
- **Route/URL**: `/doctor/dashboard` (nested under /doctor/*)  
- **Purpose**: Doctor's summary dashboard displaying appointment statistics (total appointments, pending, approved, rejected) in card grid with icons and loading skeleton placeholders.  
- **Key Components Used**: Stat cards with lucide-react icons, loading skeleton placeholders (for data load states)  
- **API Calls / FHIR Resources**: `getDoctorAppointmentsByStatus()` from `../services/doctorApi`  
- **User Role Access**: Doctors only (doctor role required); protected via ProtectedRoute in DoctorRoutes  
- **Current Status**: ✅ Complete  
- **Dependencies**: Doctor API service  
- **Navigation**: DoctorLayout sidebar links to: `/doctor/dashboard`, `/doctor/profile`, `/doctor/appointments`, `/doctor/edit-profile`, logout, Links FROM: Doctor login, doctor registration completion  

---

### 2. Doctor Profile
- **Page Name**: Doctor Profile / Credentials Display  
- **File Path**: [frontend/src/pages/doctor/DoctorProfile.jsx](frontend/src/pages/doctor/DoctorProfile.jsx)  
- **Route/URL**: `/doctor/profile` (nested under /doctor/*)  
- **Purpose**: Doctor's personal/public profile page displaying credentials, contact information, qualifications, education, experience, and edit profile button.  
- **Key Components Used**: Profile header with banner image and avatar, info sections (Contact/Qualifications/Experience/License), edit button  
- **API Calls / FHIR Resources**: `getDoctorProfile()` from `../services/doctorApi`; fallback to localStorage.getItem("user") if API fails  
- **User Role Access**: Doctors only (doctor role required); protected via ProtectedRoute in DoctorRoutes  
- **Current Status**: ✅ Complete  
- **Dependencies**: Doctor API service, localStorage for fallback  
- **Navigation**: Edit button navigates to `/doctor/edit-profile`, Links FROM: DoctorLayout sidebar, doctor dashboard  

---

### 3. Doctor Edit Profile
- **Page Name**: Doctor Profile Editor  
- **File Path**: [frontend/src/pages/doctor/DoctorEditProfile.jsx](frontend/src/pages/doctor/DoctorEditProfile.jsx)  
- **Route/URL**: `/doctor/edit-profile` (nested under /doctor/*)  
- **Purpose**: Form for doctors to update profile credentials, specialization, years of experience, medical license, hospital affiliations, and profile image with validation and file size/type checking.  
- **Key Components Used**: Image file input with preview, form fields (specialization, experience, license number, hospital), file size/type validation, form submission  
- **API Calls / FHIR Resources**: 
  - `getDoctorProfile()` (fetch current profile for pre-filling)
  - `updateDoctorProfile()` (submit profile updates)
  - `uploadDoctorProfileImage()` (upload profile photo)
  
- **User Role Access**: Doctors only (doctor role required); protected via ProtectedRoute in DoctorRoutes  
- **Current Status**: ✅ Complete  
- **Dependencies**: Doctor API service, file upload service  
- **Navigation**: Submits and navigates back to `/doctor/profile` on success, error handling with `navigate("/doctor/profile")`, Links FROM: Doctor Profile page, DoctorLayout sidebar  

---

### 4. Doctor Appointments
- **Page Name**: Doctor Appointment Management  
- **File Path**: [frontend/src/pages/doctor/DoctorAppointments.jsx](frontend/src/pages/doctor/DoctorAppointments.jsx)  
- **Route/URL**: `/doctor/appointments` (nested under /doctor/*)  
- **Purpose**: Doctor's appointment request management interface for reviewing patient requests and approving/rejecting with optional inline rejection reason modal.  
- **Key Components Used**: Filter tabs (All/Pending/Approved/Rejected/Cancelled), appointment request cards with patient details, action buttons ([Approve] [Reject] [View Chat] [Clinical Notes]), rejection reason input modal  
- **API Calls / FHIR Resources**: 
  - `getDoctorAppointments()` (fetch all appointments)
  - `approveAppointment()` (approve patient request)
  - `rejectAppointment()` (reject with optional reason)
  
- **User Role Access**: Doctors only (doctor role required); protected via ProtectedRoute in DoctorRoutes  
- **Current Status**: ✅ Complete (with inline navigation to chat/clinical notes)  
- **Dependencies**: Doctor API service  
- **Navigation**: Approve/Reject actions trigger modals, Chat button links to `/doctor/chat/:appointmentId`, Clinical Notes button links to `/doctor/clinical-notes/:patientId`, Links FROM: DoctorLayout sidebar, Doctor Dashboard  

---

### 5. Clinical Notes
- **Page Name**: Clinical Notes / Medical Records Creation  
- **File Path**: [frontend/src/pages/doctor/ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx)  
- **Route/URL**: `/doctor/clinical-notes/:patientId` (nested under /doctor/*)  
- **Purpose**: Doctor's interface for creating and managing clinical records for a specific patient including conditions (diagnoses), observations (vitals/lab results), medications, and diagnostic reports with FHIR compliance, patient consent verification, and real-time validation.  
- **Key Components Used**: `ConsentBanner` (shows if patient hasn't consented to records access), forms for creating: Conditions (diagnosis), Observations (vitals), Medications, Diagnostic Reports, error display, code input validation  
- **API Calls / FHIR Resources**: 
  - `getConsents()` (verify patient consent for doctor to create records)
  - `createCondition()` (create FHIR Condition resource)
  - `createObservation()` (create FHIR Observation for vitals/labs)
  - `createMedicationRequest()` (create FHIR MedicationRequest)
  - `createDiagnosticReport()` (create FHIR DiagnosticReport)
  - `requestConsent()` (request patient consent if denied)
  
- **User Role Access**: Doctors only (doctor role required); requires patient consent for data access; protected via ProtectedRoute in DoctorRoutes  
- **Current Status**: ✅ Complete (FHIR-aligned clinical record creation)  
- **Dependencies**: FHIR API service, Socket.IO for real-time updates, patient consent service  
- **Navigation**: Uses `useParams()` for patientId extraction, back button navigates to `/doctor/dashboard` via `navigate('/doctor')`, Links FROM: Doctor Appointments page (Clinical Notes button)  
- **Validation**: Includes HIPAA-compliant consent check and code input sanitization  

---

---

## 📑 PART 3: ADMIN PAGES (src/pages/admin/)

### 1. Admin Dashboard
- **Page Name**: Admin System Dashboard / Overview  
- **File Path**: [frontend/src/pages/admin/AdminDashboard.jsx](frontend/src/pages/admin/AdminDashboard.jsx)  
- **Route/URL**: `/admin` or `/admin/` (nested under /admin/*)  
- **Purpose**: System-wide overview dashboard for administrators displaying key metrics (users count, doctors count, hospitals count, appointments count), recent activity log, approval rates, and pending items summary.  
- **Key Components Used**: `StatCard` components grid (with icon, label, count), recent activities list, quick stats sections  
- **API Calls / FHIR Resources**: `getAdminStats()` from `../../services/adminApi`  
- **User Role Access**: Admins only (admin role required); protected via AdminLayout wrapper with strict role check  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar, Links FROM: Admin login, admin role navigation  

---

### 2. Admin Layout
- **Page Name**: Admin Layout Wrapper  
- **File Path**: [frontend/src/pages/admin/AdminLayout.jsx](frontend/src/pages/admin/AdminLayout.jsx)  
- **Route/URL**: N/A (Layout wrapper component, not a page itself)  
- **Purpose**: Root layout wrapper for all admin pages with role-based access control, animated sidebar navigation, and logout functionality; enforces strict admin role requirement.  
- **Key Components Used**: `Sidebar`, `SidebarBody`, `SidebarLink` components from UI library, lucide-react icons for navigation items, logout button  
- **API Calls / FHIR Resources**: None (routing/layout only)  
- **User Role Access**: Admins only; redirects non-admins to "/" with error toast; checks for admin role in user.roles array OR user.role string  
- **Current Status**: ✅ Complete  
- **Dependencies**: Redux auth state, toast notifications  
- **Navigation**: Sidebar navigation links TO:
  - `/admin` - Dashboard
  - `/admin/analytics` - Analytics
  - `/admin/registrations` - Doctor Registrations
  - `/admin/appointments` - Appointments
  - `/admin/users` - Users
  - `/admin/approved-doctors` - Approved Doctors
  - `/admin/rejected-doctors` - Rejected Doctors
  - `/admin/hospital-registrations` - Hospital Registrations
  - `/admin/hospitals` - Approved Hospitals
  
---

### 3. Analytics Page
- **Page Name**: Admin Analytics & Insights  
- **File Path**: [frontend/src/pages/admin/Analytics.jsx](frontend/src/pages/admin/Analytics.jsx)  
- **Route/URL**: `/admin/analytics`  
- **Purpose**: Analytics dashboard with overview metrics, trend charts (appointments/registrations over time), and top doctors rankings with performance data.  
- **Key Components Used**: `TrendChart` component, `TopDoctorsTable`, overview stat cards, chart rendering  
- **API Calls / FHIR Resources**: 
  - `getAnalyticsOverview()` (fetch overview metrics)
  - `getTrendData()` (fetch trend data for charts)
  - `getTopDoctors()` (fetch top doctors ranking)
  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service, charting library for TrendChart  
- **Navigation**: Accessed via AdminLayout sidebar, Links FROM: Dashboard  

---

### 4. Doctor Registrations (Admin View)
- **Page Name**: Doctor Registration Applications  
- **File Path**: [frontend/src/pages/admin/DoctorRegistrations.jsx](frontend/src/pages/admin/DoctorRegistrations.jsx)  
- **Route/URL**: `/admin/registrations`  
- **Purpose**: Admin interface for reviewing and processing pending doctor registration applications with approve/reject actions, detailed view modal, document verification, and auto-email notifications.  
- **Key Components Used**: `TableComponent` (reusable table for listing), status select filter dropdown, action buttons (Approve/Reject/View), `ActionModal` for confirmation  
- **API Calls / FHIR Resources**: 
  - `getDoctorRegistrations()` (fetch pending applications)
  - `approveDoctorRegistration()` (approve with email)
  - `rejectDoctorRegistration()` (reject with reason)
  - `sendNotificationEmail()` (send approval/rejection email)
  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete (includes email notifications)  
- **Dependencies**: Admin API service, email service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/registrations", Links FROM: Dashboard  

---

### 5. Appointments (Admin View)
- **Page Name**: System Appointment Management  
- **File Path**: [frontend/src/pages/admin/Appointments.jsx](frontend/src/pages/admin/Appointments.jsx)  
- **Route/URL**: `/admin/appointments`  
- **Purpose**: Admin interface to view all system appointments with status filtering (All/Pending/Approved/Cancelled) and actions to approve or cancel appointments.  
- **Key Components Used**: `TableComponent`, status select dropdown filter, action buttons (Approve/Cancel)  
- **API Calls / FHIR Resources**: 
  - `getAppointments()` (fetch all appointments)
  - `approveAppointment()` (approve)
  - `rejectAppointment()` (cancel/reject)
  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/appointments", Links FROM: Dashboard  

---

### 6. Users (Admin View)
- **Page Name**: System Users Management  
- **File Path**: [frontend/src/pages/admin/Users.jsx](frontend/src/pages/admin/Users.jsx)  
- **Route/URL**: `/admin/users`  
- **Purpose**: Admin interface listing all system users (patients) with role display, account creation date, and user management.  
- **Key Components Used**: `TableComponent`, role badges/chips  
- **API Calls / FHIR Resources**: `getUsers("user")` from `../../services/adminApi` (fetch all users with role "user")  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/users", Links FROM: Dashboard  

---

### 7. Approved Doctors (Admin View)
- **Page Name**: Verified Doctors Directory  
- **File Path**: [frontend/src/pages/admin/ApprovedDoctors.jsx](frontend/src/pages/admin/ApprovedDoctors.jsx)  
- **Route/URL**: `/admin/approved-doctors`  
- **Purpose**: Admin interface displaying all verified and approved doctors with specialization, experience, license info, and approval date.  
- **Key Components Used**: `TableComponent`, doctor list with details (name, specialty, experience, license, approved date)  
- **API Calls / FHIR Resources**: `getApprovedDoctors()` from `../../services/adminApi`  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/approved-doctors", Links FROM: Dashboard  

---

### 8. Rejected Doctors (Admin View)
- **Page Name**: Rejected Doctor Applications  
- **File Path**: [frontend/src/pages/admin/RejectedDoctors.jsx](frontend/src/pages/admin/RejectedDoctors.jsx)  
- **Route/URL**: `/admin/rejected-doctors`  
- **Purpose**: Admin interface displaying all rejected doctor registration applications with rejection reasons and administrative notes.  
- **Key Components Used**: `TableComponent`, rejection reason display, doctor info  
- **API Calls / FHIR Resources**: `getRejectedDoctors()` from `../../services/adminApi`  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/rejected-doctors", Links FROM: Dashboard  

---

### 9. Hospital Registrations (Admin View)
- **Page Name**: Hospital Registration Applications  
- **File Path**: [frontend/src/pages/admin/HospitalRegistrations.jsx](frontend/src/pages/admin/HospitalRegistrations.jsx)  
- **Route/URL**: `/admin/hospital-registrations`  
- **Purpose**: Admin interface for reviewing hospital/clinic registration applications with entity type tabs (Hospital/Clinic), status filtering, detailed view modal with document preview, and approve/reject with reason.  
- **Key Components Used**: Entity type tabs, status tabs (Pending/Approved/Rejected), `DetailModal` with document preview links, action buttons  
- **API Calls / FHIR Resources**: 
  - `getAdminHospitalRegistrations()` (fetch applications)
  - `getAdminHospitalRegistrationById()` (fetch details for modal)
  - `approveAdminHospitalRegistration()` (approve)
  - `rejectAdminHospitalRegistration()` (reject with reason)
  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete (with document preview)  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/hospital-registrations", Links FROM: Dashboard  

---

### 10. Approved Hospitals (Admin View)
- **Page Name**: Approved Hospitals Directory  
- **File Path**: [frontend/src/pages/admin/ApprovedHospitals.jsx](frontend/src/pages/admin/ApprovedHospitals.jsx)  
- **Route/URL**: `/admin/hospitals`  
- **Purpose**: Admin interface listing all approved hospitals/clinics with entity type filtering (Hospital/Clinic) and suspension capability with confirmation modal.  
- **Key Components Used**: Entity type tabs, `TableComponent` with hospital listings, `ConfirmModal` for suspension action  
- **API Calls / FHIR Resources**: 
  - `getAdminAllHospitals()` (fetch approved hospitals)
  - `suspendAdminHospital()` (suspend hospital)
  
- **User Role Access**: Admins only; protected via AdminLayout  
- **Current Status**: ✅ Complete  
- **Dependencies**: Admin API service  
- **Navigation**: Accessed via AdminLayout sidebar link "/admin/hospitals", Links FROM: Dashboard  

---

---

## 📑 PART 4: MISSING PAGES (Referenced but Not Created)

### ❌ Missing Page 1: Admin Login
- **Page Name**: Admin Authentication  
- **Attempted Route/URL**: `/admin-login`  
- **Referenced In**: [frontend/src/components/admin/Navbar.jsx](frontend/src/components/admin/Navbar.jsx) (line 12)  
- **Purpose**: Should provide admin-only login with separate credentials from user/doctor login  
- **Why Missing**: Current implementation redirects to `/admin-login` on logout but no page/route exists; currently relies on `/login` for all roles and role-based redirect  
- **Impact**: **HIGH** - Admin navbar logout navigation breaks (links to non-existent page)  
- **Expected File**: `frontend/src/pages/AdminLogin.jsx` or `frontend/src/pages/admin/AdminLogin.jsx`  
- **Recommendation**: Either:
  1. Create `/admin-login` page with admin-specific authentication UI
  2. Or change logout navigation to redirect to `/login` instead (current workaround)
  
---

### ❌ Missing Page 2: Privacy Policy
- **Page Name**: Privacy Policy / Legal  
- **Attempted Route/URL**: `/privacy`  
- **Referenced In**: [frontend/src/components/Footer.js](frontend/src/components/Footer.js) (lines 28, 73)  
- **Purpose**: Display company privacy policy and legal terms for data handling (required for HIPAA/health app compliance)  
- **Why Missing**: Footer component references `/privacy` link but page never created  
- **Impact**: **MEDIUM** - Footer link broken; users clicking "Privacy Policy" will see 404  
- **Expected File**: `frontend/src/pages/PrivacyPolicy.jsx`  
- **Recommendation**: Create privacy policy page with legal content or update footer links to remove reference  

---

### ❌ Missing Page 3: Terms of Service
- **Page Name**: Terms of Service / Legal  
- **Attempted Route/URL**: `/terms`  
- **Referenced In**: [frontend/src/components/Footer.js](frontend/src/components/Footer.js) (line 29)  
- **Purpose**: Display terms of service agreement for platform usage (required for compliance)  
- **Why Missing**: Footer component references `/terms` link but page never created  
- **Impact**: **MEDIUM** - Footer link broken; users clicking "Terms of Service" will see 404  
- **Expected File**: `frontend/src/pages/TermsOfService.jsx`  
- **Recommendation**: Create terms page with legal content or update footer links to remove reference  

---

---

## 📑 PART 5: ORPHAN PAGES (Not Routed)

### ⚠️ Orphan Page: AIChat
- **Page Name**: AI Health Assistant Chat  
- **File Path**: [frontend/src/pages/AIChat.jsx](frontend/src/pages/AIChat.jsx)  
- **Status**: File exists but NOT imported or routed in App.js  
- **Purpose**: Real-time AI health assistant chat for patient health questions  
- **Why Orphaned**: Created but never added to routing configuration  
- **Impact**: **LOW** - Page exists but is inaccessible via any URL  
- **Last Update**: Unknown (appears functional, uses aiApi service)  
- **Recommendation**: Either:
  1. Add route: `<Route path="/ai-chat" element={<AIChat />} />` in App.js (add import too)
  2. Add navbar link if feature is ready for users
  3. Delete if feature is deprecated or planned for later
  
---

---

## 🗺️ PART 6: ROUTE MAP & NAVIGATION FLOW

### High-Level App Structure
```
App (/src/App.js)
├── Public Routes (no authentication needed)
│   ├── / → Home (hero, features, CTA)
│   ├── /aboutus → About Us (company info)
│   ├── /contact → Contact Us (form)
│   ├── /login → Login (auth)
│   ├── /signup → Sign Up (register user)
│   ├── /verifyemail → Email Verification (OTP)
│   ├── /search → Doctor Search (discovery)
│   ├── /appointment → Appointment Booking (with voice search)
│   ├── /hospitals → Hospital List (directory)
│   ├── /hospitals/:id → Hospital Profile (detail)
│   ├── /doctor-registration → Doctor Registration Form
│   ├── /hospital-registration → Hospital Registration Form
│   └── /test → Test Page (demo)
│
├── Protected Routes - User/Patient
│   ├── /my-profile → Patient Dashboard (auth + user role)
│   ├── /editprofile → Edit Profile (auth + user role)
│   ├── /medical-records → EHR Dashboard (auth + user role)
│   ├── /fhir-connect → EHR Integration (auth + user role)
│   ├── /my-requests → Appointment Tracker (auth + user role)
│   └── /chat/:appointmentId → Consultation Chat (auth + user role)
│
├── Hospital Admin Routes
│   └── /hospital-admin → Hospital Admin Dashboard (hospital admin role)
│
├── Nested Doctor Routes (/doctor/*)
│   ├── /doctor/dashboard → Doctor Overview (auth + doctor role)
│   ├── /doctor/profile → Doctor Profile (auth + doctor role)
│   ├── /doctor/edit-profile → Edit Profile (auth + doctor role)
│   ├── /doctor/appointments → Appointment Management (auth + doctor role)
│   ├── /doctor/chat/:appointmentId → Consultation Chat (auth + doctor role)
│   └── /doctor/clinical-notes/:patientId → Clinical Records (auth + doctor role)
│
└── Nested Admin Routes (/admin/*)
    ├── /admin (or /) → Admin Dashboard (admin role)
    ├── /admin/analytics → Analytics (admin role)
    ├── /admin/registrations → Doctor Applications (admin role)
    ├── /admin/appointments → All Appointments (admin role)
    ├── /admin/users → Users List (admin role)
    ├── /admin/approved-doctors → Doctors Directory (admin role)
    ├── /admin/rejected-doctors → Rejected Apps (admin role)
    ├── /admin/hospital-registrations → Hospital Apps (admin role)
    └── /admin/hospitals → Hospitals Directory (admin role)
```

### User Journey Maps

#### Patient/User Journey
1. **Onboarding**
   - `/` (Home) → `/signup` → `/verifyemail` → `/login` → `/my-profile`

2. **Doctor Discovery & Booking**
   - `/search` or `/appointment` → Request Appointment → `/my-requests` → `/chat/:appointmentId`

3. **Health Management**
   - `/my-profile` → View conditions/allergies
   - `/medical-records` → View comprehensive EHR
   - `/editprofile` → Update info
   - `/fhir-connect` → Connect external EHR

#### Doctor Journey
1. **Onboarding**
   - `/doctor-registration` → Review confirmation → Login → `/doctor/dashboard`

2. **Daily Operations**
   - `/doctor/dashboard` → Shows statistics
   - `/doctor/appointments` → Review patient requests → `/doctor/chat/:appointmentId` or `/doctor/clinical-notes/:patientId`
   - `/doctor/profile` → View/edit via `/doctor/edit-profile`

#### Hospital Admin Journey
1. **Setup**
   - `/hospital-registration` → `/hospital-admin`

2. **Operations**
   - `/hospital-admin` → Manage doctor applications

#### System Admin Journey
1. **Access**
   - `/login` (as admin role) → redirects to `/admin` (via AdminLayout role check)

2. **Dashboard**
   - `/admin` → Overview with quick links to all management pages
   - Sidebar navigation to manage doctors, hospitals, appointments, users

---

## 📊 PART 7: COMPLETE PAGES SUMMARY TABLE

| # | Page Name | File Path | Route | Role(s) | Status | Dependencies |
|---|-----------|-----------|-------|---------|--------|--------------|
| 1 | Home | pages/Home.jsx | / | All | ✅ | Components |
| 2 | About Us | pages/AboutUs.js | /aboutus | All | ✅ | SiteFooter |
| 3 | Contact Us | pages/ContactUs.js | /contact | All | ✅ | Form components |
| 4 | Login | pages/Login.js | /login | All | ✅ | Auth API |
| 5 | Sign Up | pages/Signup.js | /signup | All | ✅ | Auth API |
| 6 | Verify Email | pages/VerifyEmail.js | /verifyemail | Signup flow | ✅ | OTP API |
| 7 | My Profile | pages/MyProfile.js | /my-profile | User | ✅ | FHIR API |
| 8 | Edit Profile | pages/EditProfile.js | /editprofile | User | ✅ | Profile API |
| 9 | Medical Records | pages/MedicalRecords.js | /medical-records | User | ✅ | FHIR API |
| 10 | FHIR Connect | pages/FhirConnect.jsx | /fhir-connect | User | ✅ | FHIR API |
| 11 | My Requests | pages/MyRequests.jsx | /my-requests | User | ✅ | Appointment API |
| 12 | Doctor Search | pages/DoctorSearch.jsx | /search | All | ✅ | Search API |
| 13 | Appointment Booking | pages/Apponintment.js | /appointment | All | ✅ | Search API |
| 14 | Chat | pages/Chat.jsx | /chat/:id | User/Doctor | ✅ | Socket.IO, Chat API |
| 15 | Hospital List | pages/HospitalList.jsx | /hospitals | All | ✅ | Hospital API |
| 16 | Hospital Profile | pages/HospitalProfile.jsx | /hospitals/:id | All | ✅ | Hospital API |
| 17 | Hospital Registration | pages/HospitalRegistrationPage.jsx | /hospital-registration | All | ✅ | Hospital API |
| 18 | Hospital Admin Dashboard | pages/HospitalAdminDashboard.jsx | /hospital-admin | Hospital Admin | ✅ | Hospital Admin API |
| 19 | Doctor Registration | pages/DoctorRegistrationPage.jsx | /doctor-registration | All | ✅ | Doctor API |
| 20 | Test Page | pages/Test.jsx | /test | All | ✅ | 3D Animation |
| 21 | AI Chat | pages/AIChat.jsx | ❌ ORPHAN | All | ⚠️ | AI API |
| — | — | — | — | — | — | — |
| 22 | Doctor Dashboard | pages/doctor/DoctorDashboard.jsx | /doctor/dashboard | Doctor | ✅ | Doctor API |
| 23 | Doctor Profile | pages/doctor/DoctorProfile.jsx | /doctor/profile | Doctor | ✅ | Doctor API |
| 24 | Doctor Edit Profile | pages/doctor/DoctorEditProfile.jsx | /doctor/edit-profile | Doctor | ✅ | Doctor API |
| 25 | Doctor Appointments | pages/doctor/DoctorAppointments.jsx | /doctor/appointments | Doctor | ✅ | Doctor API |
| 26 | Clinical Notes | pages/doctor/ClinicalNotes.jsx | /doctor/clinical-notes/:id | Doctor | ✅ | FHIR API |
| — | — | — | — | — | — | — |
| 27 | Admin Dashboard | pages/admin/AdminDashboard.jsx | /admin (or /) | Admin | ✅ | Admin API |
| 28 | Admin Layout | pages/admin/AdminLayout.jsx | — (wrapper) | Admin | ✅ | Redux, Toast |
| 29 | Analytics | pages/admin/Analytics.jsx | /admin/analytics | Admin | ✅ | Admin API |
| 30 | Doctor Registrations | pages/admin/DoctorRegistrations.jsx | /admin/registrations | Admin | ✅ | Admin API |
| 31 | Appointments | pages/admin/Appointments.jsx | /admin/appointments | Admin | ✅ | Admin API |
| 32 | Users | pages/admin/Users.jsx | /admin/users | Admin | ✅ | Admin API |
| 33 | Approved Doctors | pages/admin/ApprovedDoctors.jsx | /admin/approved-doctors | Admin | ✅ | Admin API |
| 34 | Rejected Doctors | pages/admin/RejectedDoctors.jsx | /admin/rejected-doctors | Admin | ✅ | Admin API |
| 35 | Hospital Registrations | pages/admin/HospitalRegistrations.jsx | /admin/hospital-registrations | Admin | ✅ | Hospital Admin API |
| 36 | Approved Hospitals | pages/admin/ApprovedHospitals.jsx | /admin/hospitals | Admin | ✅ | Hospital Admin API |

---

## ⚠️ ACTION ITEMS & ISSUES

### 🔴 CRITICAL ISSUES
**None identified** - All routed pages are functional and connected

### 🟡 HIGH PRIORITY ISSUES
1. **Missing Admin Login Page (/admin-login)**
   - Reference in: `admin/Navbar.jsx`
   - Impact: Admin logout navigation broken
   - Action: Create page or update logout redirect

### 🟠 MEDIUM PRIORITY ISSUES
1. **Missing Privacy Policy (/privacy)**
   - Reference in: `components/Footer.js`
   - Impact: Footer link broken
   - Action: Create page or remove link

2. **Missing Terms of Service (/terms)**
   - Reference in: `components/Footer.js`
   - Impact: Footer link broken
   - Action: Create page or remove link

3. **Orphan Page: AIChat**
   - Status: File exists but not routed
   - Impact: Feature inaccessible
   - Action: Route page or delete if deprecated

### 🔵 LOW PRIORITY ITEMS
1. **Filename Typo in Appointment Page**
   - File: `pages/Apponintment.js` (should be `Appointment.js`)
   - Impact: Confusing but functional
   - Action: Rename file (breaking change, update imports)

2. **Test Page Status**
   - Purpose unclear (demo? testing?)
   - Action: Document purpose and consider moving to different location or removing

---

## 📈 PROJECT STATISTICS

### Pages by Role
```
All Roles (Public): 7 pages
  - Home, About Us, Contact Us, Login, Sign Up, Verify Email, Test Page

User/Patient Role: 8 pages
  - My Profile, Edit Profile, Medical Records, FHIR Connect, My Requests, Chat, Doctor Search, Appointment

Doctor Role: 5 pages
  - Doctor Dashboard, Doctor Profile, Edit Profile, Appointments, Clinical Notes

Hospital Admin Role: 1 page
  - Hospital Admin Dashboard

System Admin Role: 10 pages
  - Admin Dashboard, Analytics, Doctor Registrations, Appointments, Users, Approved Doctors, Rejected Doctors, Hospital Registrations, Approved Hospitals

Shared (User + Doctor): 2 pages
  - Chat, Hospital List, Hospital Profile, Doctor Registration, Hospital Registration

Total: **36 routed + 1 orphan = 37 pages**
```

### Features by Category
```
Authentication: 3 pages
Onboarding: 2 pages
Discovery: 2 pages
Health Management: 3 pages
Consultation: 2 pages
Professional Dashboards: 5 pages
Admin Management: 10 pages
Special Features: 2 pages (Test, AI Chat)
```

### API/Service Integration
```
FHIR Resources: 8 pages
  - Medical Records, FHIR Connect, MyProfile, ClinicalNotes, ChatAccess, Conditions, Observations

User-Facing APIs: 6 pages
  - Doctor Search, Appointments, Chat, Booking

Admin APIs: 10 pages
  - All admin pages

Third-Party Integrations: 2 services
  - Socket.IO (Chat, Real-time)
  - Razorpay (Payment, MyRequests)
  - Voice Search (Appointment page)
```

---

## ✅ CONCLUSION

The project contains **36 fully functional routed pages** across three role-based domains (Patient, Doctor, Admin) with supporting components. The FHIR integration is comprehensive, Socket.IO enables real-time communication, and role-based access control is properly implemented.

**Key Findings:**
- ✅ All main pages are routed and functional
- ⚠️ 1 page orphaned (AIChat) - not routed
- ❌ 3 pages referenced but not created (Admin Login, Privacy, Terms)
- 🎯 Clear navigation patterns and role-based access
- 🔧 No broken routes in main flows

**Before deployment, address:**
1. Either create or remove the 3 missing pages
2. Route AIChat or delete it
3. Consider admin login page implementation
4. Fix optional filename typo ("Apponintment")

---

**Document Complete** | Last Updated: March 15, 2026 | Next Review: After deployment phase
