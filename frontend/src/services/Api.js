const  BASE_URL = process.env.REACT_APP_BASE_URL;
console.log("baseurl", BASE_URL)


export const authendpoint = {
    SEND_OTP_API: `/sendotp`,
    LOGIN_API:`${BASE_URL}/login`,
    SIGNUP_API:`${BASE_URL}/api/v1/signup`,
    DOCTOR_REGISTRATION_API: `${BASE_URL}/api/v1/doctorregistration`,
}

export const profileendpoint = {
    UPDATE_PROFILE_PICTURE_API :`${BASE_URL}/api/v1/updateuserprofilepicture`,
    UPDATE_PROFILE_API :`${BASE_URL}/api/v1/edituserProfile`
}
