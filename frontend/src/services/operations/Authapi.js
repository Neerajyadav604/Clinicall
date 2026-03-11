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
        const toastId = toast.loading("Loading...")
        dispatch(setLoading(true))
        try {
            const response = await axiosInstance.post(SEND_OTP_API, { email, checkUserPresent: false })

            console.log("SEND OTP API RESPONSE...............", response)
            if (!response.data.success) {
                throw new Error("send otp err :" + response.data.message);

            }

            toast.success("OTP send successfully ")
            navigate("/verifyemail")
        } catch (err) {
            console.log("SENDOTP API ERR :", err)
        }
         dispatch(setLoading(false))
    toast.dismiss(toastId)
    }
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
        throw new Error(response.data.message);
      }

      toast.success("Signup successful ✅");
      navigate("/login"); // ✅ only on success

    } catch (err) {
      console.log("SIGNUP API ERROR:", err);
      toast.error(err.message || "Signup failed");

    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}


export function login(email, password, navigate) {
    console.log(`email from login api function :${email} and password :${password} and navigate :${navigate}`)
    return async (dispatch) => {
        const toastId = toast.loading("Loading...")
        dispatch(setLoading(true))
        try {
            const response = await axiosInstance.post(LOGIN_API, {
                email,
                password,
            })

            console.log("LOGIN API RESPONSE............", response)

            if (!response.data.success) {
                throw new Error("Error in loggingin ",response.data.message)
            }

            toast.success("Login Successful")
            // backend now returns accessToken rather than token
            const accessToken = response.data.accessToken;
            dispatch(setToken(accessToken))
           console.log(response.data.user);

      const data2 = dispatch(setUser( response.data.user  ))
      console.log(data2);

            localStorage.setItem("token", accessToken)
            localStorage.setItem("user", JSON.stringify(response.data.user))
            startSessionTimers(accessToken)
            initAuthSession()

      // Navigate based on user role
      const userRole = (response.data.user?.role || "user").toLowerCase();

            if (userRole === "admin") {
                navigate("/admin");
            } else if (userRole === "doctor") {
                navigate("/doctor");
            } else {
                navigate("/my-profile");
            }
        } catch (error) {
            console.log("LOGIN API ERROR............", error)
            toast.error("Login Failed")
        }
        dispatch(setLoading(false))
        toast.dismiss(toastId)

            console.log("signup function completed in authapi")

    }
}


export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null))
    dispatch(setUser(null))
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
        if (status === "PENDING" || status === "APPROVED") {
          toast.error(
            status === "PENDING"
              ? "Your application is already under review."
              : "You are already approved as a doctor."
          );
          return;
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
        doctorFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
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

    } catch (err) {
      console.log("DOCTOR REGISTRATION API ERROR:", err);

      // Extract error message
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Doctor registration failed. Please try again.";

      toast.error(errorMsg);
    } finally {
      dispatch(setLoading(false));
      toast.dismiss(toastId);
    }
  };
}
