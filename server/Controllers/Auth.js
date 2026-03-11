const User = require('../models/User')
const OTP = require('../models/OTP')
const bcrypt = require('bcrypt')
const userProfile = require('../models/UserProfile')
const otpGenerator = require('otp-generator')
const { signAccessToken, signRefreshToken, verifyRefreshToken, revokeRefreshToken } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');


//create signup controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, contact, password, otp } = req.body;
    console.log("req body :",req.body)

    if (!fullName || !email || !contact || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already registered",
      });
    }

    const latestOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!latestOtp || otp !== latestOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      role: "user",
      fullName,
      email,
      contact,
      password: hashedPassword,
      additionalDetails: null,
      image: null, // initialize profile picture field
    });

    const profileDetails = await userProfile.create({
      userId: newUser._id,
      dob: null,
      gender: null,
      address: null,
      bloodGroup: null,
      allergies: [],
      medicalHistory: [],
      medications: [],
      emergencyContact: null,
      insurance: {
        provider: null,
        policyNumber: null,
      },
      image: null,
    });

    newUser.additionalDetails = profileDetails._id;
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
      profile: profileDetails,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Try again later",
    });
  }
};




exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('All fields are required', 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError('User not registered', 404);

    // account lock check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new AppError('Account is locked due to multiple failed login attempts. Try later.', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      }
      await user.save();
      throw new AppError('Invalid email or password', 401);
    }

    // reset counters
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    user.role = (user.role || "user").toLowerCase();
    await user.save();

    const normalizedRole = user.role;

    // populate
    if (normalizedRole === 'user' || normalizedRole === 'admin') {
      await user.populate('additionalDetails');
    } else if (normalizedRole === 'doctor') {
      await user.populate({
        path: 'doctorProfile',
        populate: { path: 'additionalDoctorDetails' }
      });
    }

    const accessToken = signAccessToken(user._id, normalizedRole);
    const refreshTokenDoc = await signRefreshToken(user._id);

    user.password = undefined;
    res.cookie('refreshToken', refreshTokenDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: refreshTokenDoc.expiresAt
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user
    });
  } catch (err) {
    next(err);
  }
};



exports.sendotp = async(req,res)=>{
    try{
      console.log("otpreqbody :",req.body)
const {email}=req.body

const checkuseremail = await User.findOne({email:email})  

 if(checkuseremail){
    return res.status(400).json({
        success:false,
        message:" email already registerd "
    })
 }

 var otp = otpGenerator.generate(6,{
    upperCaseAlphabets:false,
    lowerCaseAlphabets:false,
    specialChars:false
 })

 const result = await OTP.findOne({otp:otp})
 while(result){
     otp = otpGenerator.generate(6,{upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false})
 }

 const payload = {
    email:email,
    otp:otp
 }
 console.log(payload)

 const newotp = await OTP.create(payload)

 return res.status(200).json({
    success:true,
    message:"otp send successfully",
    otp:otp
 })

 }catch(err){
console.log(err)
return res.status(500).json({
    success:false,
    message:"Otp cannot be sent"
})
    }
}


exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    // basic JWT format check
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      return res.status(401).json({ success: false, message: 'Malformed refresh token' });
    }

    const payload = await verifyRefreshToken(token);
    const accessToken = signAccessToken(payload.id);
    res.json({ success: true, accessToken });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Refresh token failure:', err.message);
    }
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) await revokeRefreshToken(token);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.fullName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

const DoctorRegistration = require("../models/DoctorRegistration");

exports.doctorregistration = async (req, res) => {
  try {
    const user = req.user; 
    const {
      fullName,
      email,
      contact,
      specialization,
      qualification,
      experienceYears,
      licenseNumber,
      hospitalName,
      adminRemarks,
      documents,
    } = req.body;
console.log("Req.body :",req.body)
    // 1. Basic validation
    if (
      !fullName ||
      !email ||
      !contact ||
      !specialization ||
      !qualification ||
      !licenseNumber ||
      !documents||
      !hospitalName
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const userRole = (user?.role || "").toLowerCase();
    if (userRole !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only users can apply for doctor registration",
      });
    }

    // 2. Check if already registered for this user
    const existingRegistration = await DoctorRegistration.findOne({
      user: user.id,
    }).sort({ createdAt: -1 });

    if (existingRegistration) {
      const status = existingRegistration.verificationStatus;
      if (status === "PENDING" || status === "APPROVED") {
        return res.status(409).json({
          success: false,
          message:
            status === "PENDING"
              ? "Doctor registration already under review"
              : "Doctor registration already approved",
        });
      }

      if (status === "REJECTED") {
        existingRegistration.fullName = fullName;
        existingRegistration.email = email;
        existingRegistration.contact = contact;
        existingRegistration.specialization = specialization;
        existingRegistration.qualification = qualification;
        existingRegistration.experienceYears = experienceYears;
        existingRegistration.licenseNumber = licenseNumber;
        existingRegistration.hospitalName = hospitalName;
        existingRegistration.documents = documents;
        existingRegistration.adminRemarks = adminRemarks;
        existingRegistration.verificationStatus = "PENDING";
        existingRegistration.reviewedAt = null;
        existingRegistration.submittedAt = new Date();
        await existingRegistration.save();

        return res.status(200).json({
          success: true,
          message: "Doctor registration resubmitted for approval",
          data: existingRegistration,
        });
      }
    }

    // 3. Create registration
    const registration = await DoctorRegistration.create({
      user:user.id,
      fullName,
      email,
      contact,
      specialization,
      qualification,
      experienceYears,
      licenseNumber,
      hospitalName,
      documents,
      adminRemarks,
      verificationStatus: "PENDING",
    });

    // 4. Response
    return res.status(201).json({
      success: true,
      message: "Doctor registration submitted for approval",
      data: registration,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Doctor registration failed",
    });
  }
};

exports.getDoctorRegistrationStatus = async (req, res) => {
  try {
    const registration = await DoctorRegistration.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!registration) {
      return res.status(200).json({
        success: true,
        data: { status: "NONE" },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: registration.verificationStatus,
        registrationId: registration._id,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor registration status",
    });
  }
};
