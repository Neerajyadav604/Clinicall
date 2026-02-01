
import './App.css';
import { Routes,Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Footer from './components/Footer';
import ContactUs from './pages/ContactUs';
import Apponintment from './pages/Apponintment';
import { ToastContainer } from "react-toastify";
import Login from './pages/Login';
import SignUp from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import MyProfile from './pages/MyProfile';
import EditProfile from './pages/EditProfile';
import MyRequests from './pages/MyRequests';
import Chat from './pages/Chat';
import DoctorRegistrationPage from './pages/DoctorRegistrationPage';
import DoctorSearch from './pages/DoctorSearch';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
function App() {
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
      <Navbar/>
      <div className="pt-24">
        <Routes>
        <Route path ="/" element = {<Home/>}/>
        <Route path="/aboutus"element={<AboutUs/>}/>
        <Route path = "/contact" element={<ContactUs/>} />
        <Route path="/search" element = {<DoctorSearch/>} />
        <Route path = "/login" element = {<Login/>}/>
        <Route path="/signup" element={<SignUp/>} />
        <Route path="verifyemail" element = {<VerifyEmail/>} />
        <Route path="/my-profile" element={<MyProfile/>} />
        <Route path="/editprofile" element={<EditProfile/>} />
        <Route path="/my-requests" element={<ProtectedRoute requiredRole="user"><MyRequests/></ProtectedRoute>} />
        <Route path="/chat/:appointmentId" element={<ProtectedRoute requiredRole="user"><Chat/></ProtectedRoute>} />
        <Route path="/doctor-registration" element={<DoctorRegistrationPage/>} />

        <Route path="/doctor/*" element={<DoctorRoutes/>} />
        <Route path="/admin/*" element={<AdminRoutes/>} />
      </Routes>
      </div>
     
    </div>
  );
}

export default App;
