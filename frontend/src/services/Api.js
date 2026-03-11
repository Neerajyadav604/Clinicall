const  BASE_URL = process.env.REACT_APP_BASE_URL;
console.log("baseurl", BASE_URL)


export const authendpoint = {
    SEND_OTP_API: "/sendotp",
    LOGIN_API: "/login",
    SIGNUP_API: "/signup",
    DOCTOR_REGISTRATION_API: "/doctorregistration",
    DOCTOR_REGISTRATION_STATUS_API: "/doctorregistration/status",
    REFRESH_API: "/refresh",
}

export const profileendpoint = {
    UPDATE_PROFILE_PICTURE_API :"/updateuserprofilepicture",
    UPDATE_PROFILE_API :"/edituserProfile"
}
