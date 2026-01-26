const  BASE_URL = process.env.REACT_APP_BASE_URL;
console.log("baseurl", BASE_URL)


export const authendpoint = {
    SEND_OTP_API: `${BASE_URL}/sendotp`,
    LOGIN_API:`${BASE_URL}/login`,
    SIGNUP_API:`${BASE_URL}/signup`,
    DOCTOR_REGISTRATION_API: `${BASE_URL}/doctorregistration`,
}

export const profileendpoint = {
    UPDATE_PROFILE_PICTURE_API :`${BASE_URL}/updateuserprofilepicture`,
    UPDATE_PROFILE_API :`${BASE_URL}/edituserProfile`
}