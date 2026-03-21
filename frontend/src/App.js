
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GlobalNavbar } from './components/GlobalNavbar';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Apponintment from './pages/Apponintment';
import { ToastContainer } from "react-toastify";
import FhirErrorToast from './components/common/FhirErrorToast';
import Login from './pages/Login';
import SignUp from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import MyProfile from './pages/MyProfile';
import EditProfile from './pages/EditProfile';
import MyRequests from './pages/MyRequests';
import Chat from './pages/Chat';
import ChatWidget from './components/chat/ChatWidget';
import DoctorRegistrationPage from './pages/DoctorRegistrationPage';
import DoctorSearch from './pages/DoctorSearch';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import HospitalRegistrationPage from './pages/HospitalRegistrationPage';
import HospitalList from './pages/HospitalList';
import HospitalProfile from './pages/HospitalProfile';
import HospitalAdminDashboard from './pages/HospitalAdminDashboard';
import MedicalRecords from './pages/MedicalRecords';
import FhirConnect from './pages/FhirConnect';

import { useEffect } from 'react';
import { initAuthSession } from './services/authSession';
 import ConsultationPage from "./pages/ConsultationPage";


import { connectSocket, disconnectSocket } from './utils/socketManager';

function App() {
  const location = useLocation();
  const { token, user } = useSelector((state) => state.auth);

  // Hide the public navbar and chat widget on admin routes — they have their own layout
  const layoutOwnedPrefixes = [];
  const usesRoleLayout = layoutOwnedPrefixes.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  useEffect(() => {
    initAuthSession();
  }, []);

  // ============================================
  // SOCKET.IO CONNECTION MANAGEMENT (App Level)
  // ============================================
  // Watch auth state and manage socket connection globally
  // This ensures only ONE socket connection exists for the entire app
  useEffect(() => {
    if (token && user) {
      // User is logged in — connect socket
      console.log('🔌 [App] User logged in, connecting socket...');
      connectSocket(token);
    } else {
      // User is logged out — disconnect socket
      console.log('🔌 [App] User logged out, disconnecting socket...');
      disconnectSocket();
    }
  }, [token, user]);

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <FhirErrorToast />
      {!usesRoleLayout && <GlobalNavbar />}
      {!usesRoleLayout && <ChatWidget />}
      <div className={!usesRoleLayout ? "pt-24" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/search" element={<DoctorSearch />} />
          <Route path="/appointment" element={<Apponintment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="verifyemail" element={<VerifyEmail />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/editprofile" element={<EditProfile />} />
         
<Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
          <Route path="/medical-records" element={<ProtectedRoute requiredRole="user"><MedicalRecords /></ProtectedRoute>} />
          <Route path="/fhir-connect" element={<ProtectedRoute requiredRole="user"><FhirConnect /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute requiredRole="user"><MyRequests /></ProtectedRoute>} />
          <Route path="/chat/:appointmentId" element={<ProtectedRoute requiredRole="user"><Chat /></ProtectedRoute>} />
          <Route path="/doctor-registration" element={<DoctorRegistrationPage />} />
          <Route path="/hospital-registration" element={<HospitalRegistrationPage />} />
          <Route path="/hospitals" element={<HospitalList />} />
          <Route path="/hospitals/:id" element={<HospitalProfile />} />
          <Route path="/hospital-admin" element={<HospitalAdminDashboard />} />
         

          <Route path="/doctor/*" element={<DoctorRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </div>

    </div>
  );
}

export default App;
