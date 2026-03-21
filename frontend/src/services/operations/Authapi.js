import { setLoading, setToken } from "../../slices/authSlice"
import { axiosInstance } from "../ApiConnector"
import { authendpoint } from "../Api"
import { toast } from "react-toastify"
import { setUser } from "../../slices/ProfileSlice"
import { initAuthSession, logout as logoutSession, startSessionTimers } from "../authSession"
const {
    SEND_OTP_API,
    LOGIN_API,
    SIGNUP_API,
    DOCTOR_REGISTRATION_API,
    DOCTOR_REGISTRATION_STATUS_API

} = authendpoint


export function sendOtp(email, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await axiosInstance.post(SEND_OTP_API, { email, checkUserPresent: false });

      console.log("SEND OTP API RESPONSE...............", response);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send OTP.");
      }

      toast.success("OTP send successfully ");
      navigate("/verifyemail");
      return { success: true };
    } catch (err) {
      console.log("SENDOTP API ERR :", err);
      const message =
        err?.response?.data?.message || err?.message || "Failed to send OTP.";
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}



export function signup(role, fullName, contact, email, password, otp, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));

    try {
      const response = await axiosInstance.post(SIGNUP_API, {
        role: (role || "user").toLowerCase(),
        fullName,
        contact,
        email,
        password,
        otp,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Signup failed");
      }

      toast.success("Signup successful ✅");
      navigate("/login"); // ✅ only on success
      return { success: true };
    } catch (err) {
      console.log("SIGNUP API ERROR:", err);
      const message =
        err?.response?.data?.message || err?.message || "Signup failed";
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}


export function login(email, password, navigate) {
  console.log(`email from login api function :${email} and password :${password} and navigate :${navigate}`);
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await axiosInstance.post(LOGIN_API, {
        email,
        password,
      });

      console.log("LOGIN API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message || "Login failed");
      }

      toast.success("Login Successful");
      // backend now returns accessToken rather than token
      const accessToken = response.data.accessToken;
      dispatch(setToken(accessToken));
      console.log("LOGIN - Server response user:", response.data.user);

      // Ensure user object has normalized role data
      const userData = response.data.user;
      if (userData && !userData.roles && userData.role) {
        // Convert single role to roles array if needed
        userData.roles = [userData.role.toLowerCase()];
      } else if (userData && userData.roles) {
        // Normalize roles to lowercase
        userData.roles = userData.roles.map((r) =>
          typeof r === "string" ? r.toLowerCase() : r
        );
      }

      if (userData && userData.role) {
        userData.role = userData.role.toLowerCase();
      }

      console.log("LOGIN - Normalized user data:", userData);

      const data2 = dispatch(setUser(userData));
      console.log("LOGIN - Redux dispatch result:", data2);

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      // ✅ Clear any stale doctorProfile data from previous sessions
      localStorage.removeItem("doctorProfile");
      startSessionTimers(accessToken);
      initAuthSession();

      // Navigate based on user role (support both old and new schema)
      const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];

      // Try to get roles array first (new schema), fall back to role string (old schema)
      let userRoles = [];
      if (Array.isArray(userData?.roles)) {
        userRoles = userData.roles.map((r) => r.toLowerCase());
      } else if (userData?.role) {
        userRoles = [userData.role.toLowerCase()];
      }

      // Also check the roles sent in response.data.roles (in case backend sends it separately)
      if (response.data.roles && Array.isArray(response.data.roles)) {
        userRoles = response.data.roles.map((r) => r.toLowerCase());
      }

      const primaryRole = rolesPriority.find((r) => userRoles.includes(r)) || "user";

      console.log("LOGIN - Extracted user roles array:", userRoles);
      console.log("LOGIN - Primary role detected:", primaryRole);

      if (primaryRole === "admin") {
        console.log("LOGIN - Navigating to /admin");
        navigate("/admin");
      } else if (primaryRole === "doctor") {
        console.log("LOGIN - Navigating to /doctor");
        navigate("/doctor");
      } else if (primaryRole === "hospital_admin") {
        console.log("LOGIN - Navigating to /hospital-admin");
        navigate("/hospital-admin");
      } else {
        console.log("LOGIN - Navigating to /my-profile");
        navigate("/my-profile");
      }

      return { success: true };
    } catch (error) {
      console.log("LOGIN API ERROR............", error);
      const message =
        error?.response?.data?.message || error?.message || "Login failed";
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
      console.log("signup function completed in authapi");
    }
  };
}


export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null))
    dispatch(setUser(null))
    // ✅ Clear any stale data from previous sessions
    localStorage.removeItem("doctorProfile");
    logoutSession({ reason: "manual", redirectTo: "/login" })
    if (navigate) navigate("/login")
  }
}


export const getDoctorRegistrationStatus = async () => {
  const response = await axiosInstance.get(DOCTOR_REGISTRATION_STATUS_API);
  return response.data;
};

export function doctorRegistration(formData, token, navigate) {

  return async (dispatch) => {
    const toastId = toast.loading("Submitting your registration...");
    dispatch(setLoading(true));

    try {
      try {
        const statusRes = await getDoctorRegistrationStatus();
        const status = statusRes?.data?.status || statusRes?.status;
        if (status === "pending" || status === "approved") {
          const message =
            status === "pending"
              ? "Your application is already under review."
              : "You are already approved as a doctor.";
          return { success: false, message };
        }
      } catch (statusError) {
        console.error("Doctor registration status check failed:", statusError);
      }

      // Create FormData to handle file uploads
      const doctorFormData = new FormData();

      // Add text fields
      doctorFormData.append("fullName", formData.fullName);
      doctorFormData.append("email", formData.email);
      doctorFormData.append("contact", formData.contact);
      doctorFormData.append("specialization", formData.specialization);
      doctorFormData.append("qualification", formData.qualification);
      doctorFormData.append("experienceYears", formData.experienceYears);
      doctorFormData.append("licenseNumber", formData.licenseNumber);
      doctorFormData.append("hospitalName", formData.hospitalName);
      if (formData.hospital) {
        doctorFormData.append("hospital", formData.hospital);
      }

      // Add image file
      if (formData.image) {
        doctorFormData.append("image", formData.image);
      }

      // Add documents URL as string
      if (formData.documents) {
        doctorFormData.append("documents", formData.documents);
      }

      const response = await axiosInstance.post(
        DOCTOR_REGISTRATION_API,
        doctorFormData
        // Do NOT set Content-Type header - let axios handle it automatically with FormData
      );

      console.log("DOCTOR REGISTRATION API RESPONSE:", response);

      if (!response.data.success) {
        throw new Error(response.data.message || "Registration failed");
      }

      toast.success("✅ Registration submitted successfully!");
      toast.info("Your application is under review. You will receive updates via email.");

      // Navigate to a verification pending page or back to profile
      setTimeout(() => {
        navigate("/my-profile");
      }, 2000);

      return { success: true };
    } catch (err) {
      console.log("DOCTOR REGISTRATION API ERROR:", err);

      // Extract error message
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Doctor registration failed. Please try again.";

      return { success: false, message: errorMsg };
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}
