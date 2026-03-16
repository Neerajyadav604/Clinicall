import { setUser } from "../../slices/ProfileSlice";
import { toast } from "react-toastify";
import { axiosInstance } from "../ApiConnector";
import { profileendpoint } from "../Api";

const {
  UPDATE_PROFILE_API,
  UPDATE_PROFILE_PICTURE_API
} = profileendpoint;

export function updateUserProfile(token, formData) {
  console.log("Formdata", formData);
  return async (dispatch) => {
    const toastId = toast.loading("Updating profile...");

    try {
      // Use token from Redux, fallback to localStorage
      const authToken = token || localStorage.getItem("token");
      console.log("Token from Redux:", token);
      console.log("Token from localStorage:", localStorage.getItem("token"));
      console.log("Final token being used:", authToken);
      
      if (!authToken) {
        throw new Error("No authentication token found. Please login again.");
      }
      
    console.log("Running till line No.27")
      const response = await axiosInstance.put(
        UPDATE_PROFILE_API,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log("Running till line No.37",response.data);

      console.log("UPDATE PROFILE API RESPONSE:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // Update redux store with the correct path to user data
      const updatedUser = response.data.userprofile || response.data.data || response.data.user;
      dispatch(setUser(updatedUser));

      toast.success("Profile updated successfully");
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      const message =
        error?.response?.data?.message || error?.message || "Profile update failed";
      return { success: false, message };
    } finally {
      toast.dismiss(toastId);
    }
  };
}

export function updateDisplayPicture(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Uploading image...");

    try {
      // Use token from Redux, fallback to localStorage
      const authToken = token || localStorage.getItem("token");
      console.log("Token from Redux:", token);
      console.log("Token from localStorage:", localStorage.getItem("token"));
      console.log("Final token being used:", authToken);
      
      if (!authToken) {
        throw new Error("No authentication token found. Please login again.");
      }
      
      const response = await axiosInstance.put(
        UPDATE_PROFILE_PICTURE_API,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      console.log("UPDATE_DISPLAY_PICTURE_API RESPONSE:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // Update redux store
      const updatedUser = response.data.data || response.data.user || response.data.userprofile;
      dispatch(setUser(updatedUser));

      toast.success("Display picture updated successfully");
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error("UPDATE_DISPLAY_PICTURE_API ERROR:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not update display picture";
      return { success: false, message };
    } finally {
      toast.dismiss(toastId);
    }
  };
}

// fetch current user profile from server (used on refresh or app start)
export function fetchUserProfile() {
  return async (dispatch) => {
    try {
      const response = await axiosInstance.get("/userprofile");
      if (response.data.success) {
        const user = response.data.user || response.data.userprofile;
        if (user) {
          dispatch(setUser(user));
        }
      }
    } catch (error) {
      console.error("FETCH USER PROFILE ERROR:", error);
    }
  };
}
 
