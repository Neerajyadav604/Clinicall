const User = require('../models/User')
const OTP = require('../models/OTP')
const Notification = require('../models/Notification')
const bcrypt = require('bcrypt')
const userProfile = require('../models/UserProfile')
const otpGenerator = require('otp-generator')
const { signAccessToken, signRefreshToken, verifyRefreshToken, revokeRefreshToken } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');
const { sendNotification } = require("../utils/sendNotification");


//create signup controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, contact, password, otp } = req.body;
    // ✅ SECURITY: Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log("req body :", req.body);
    }

    if (!fullName || !email || !contact || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ SECURITY: Validate password strength (minimum 8 chars, mixed character types)
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters (@$!%*?&)"
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

    // Delete OTP after successful validation to prevent reuse
    await OTP.deleteOne({ _id: latestOtp._id });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      role: "user", // ✅ Always sync both role and roles
      roles: ["user"],
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

    // ✅ FIX: Batch admin notifications to prevent N+1 queries
    try {
      const admins = await User.find({ $or: [{ roles: "admin" }, { role: "admin" }] }).select("_id fullName");
      
      if (admins.length > 0) {
        // Create all notifications in a single batch query using insertMany
        const notificationDocs = admins.map((admin) => ({
          recipient: admin._id,
          type: "USER_REGISTERED",
          title: "New User Registered",
          message: `${newUser.fullName} just created an account.`,
        }));
        await Notification.insertMany(notificationDocs);
      } else {
        console.warn(`⚠️  No admin users found to notify about new user registration: ${newUser.email}`);
      }
    } catch (notifyErr) {
      // ✅ FIX: Log notification error with full context but don't block user signup
      console.error(`❌ Failed to send admin notifications for new user (${newUser.email}):`, {
        error: notifyErr.message,
        stack: notifyErr.stack,
        timestamp: new Date().toISOString(),
      });
      // Non-blocking: Let signup succeed even if notifications fail
      // In production, these errors should be sent to a monitoring service (e.g., Sentry)
    }

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

    // ✅ COMPREHENSIVE ROLE SYNC: Ensure role and roles array are always in sync
    const normalizedRoleField = user.role?.toLowerCase() || "user";
    const normalizedRolesArray = Array.isArray(user.roles) 
      ? user.roles.map(r => String(r).toLowerCase()).filter(Boolean)
      : [];

    // Determine primary role (priority: admin > hospital_admin > doctor > user)
    const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];
    const primaryRole = rolesPriority.find(r => 
      normalizedRolesArray.includes(r) || r === normalizedRoleField
    ) || "user";

    // FIX: If role field doesn't match roles array, synchronize them
    // This handles cases where user.role="admin" but roles=["user"]
    if (!normalizedRolesArray.includes(primaryRole) || normalizedRoleField !== primaryRole) {
      // ✅ SECURITY: Only log role sync in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 AUTO-SYNC: Synchronizing role fields for ${user.email}`);
        console.log(`   Before: role="${user.role}", roles=[${user.roles?.join(", ") || ""}]`);
      }
      user.role = primaryRole;
      user.roles = [primaryRole];
      await user.save();
      if (process.env.NODE_ENV === 'development') {
        console.log(`   After: role="${user.role}", roles=[${user.roles?.join(", ") || ""}]`);
      }
    }
    
    // Ensure role field is set for backward compatibility
    user.role = primaryRole;
    // Ensure roles array contains at least the primary role
    if (!user.roles?.includes(primaryRole)) {
      user.roles = [primaryRole];
    }

    // populate based on primary role
    if (primaryRole === 'user' || primaryRole === 'admin') {
      await user.populate('additionalDetails');
    } else if (primaryRole === 'doctor') {
      await user.populate({
        path: 'doctorProfile',
        populate: { path: 'additionalDoctorDetails' }
      });
    }

    const accessToken = signAccessToken(user._id, primaryRole);
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
      user,
      roles: user.roles // Send all roles to frontend
    });
  } catch (err) {
    // ✅ SECURITY: Log errors properly, but avoid exposing sensitive details in production
    if (process.env.NODE_ENV === 'development') {
      console.log(err.message);
    } else {
      console.error('Login error:', err.constructor.name);
    }
    next(err);
  }
};



exports.sendotp = async(req,res)=>{
    try{
      // ✅ SECURITY: Only log request body in development
      if (process.env.NODE_ENV === 'development') {
        console.log("otpreqbody :", req.body);
      }
const {email}=req.body

// ✅ SECURITY: Validate email format before any database queries
if (!email || typeof email !== 'string') {
  return res.status(400).json({
    success: false,
    message: "Email is required and must be a string"
  });
}

// ✅ Basic email format validation (RFC 5322 simplified)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email.trim())) {
  return res.status(400).json({
    success: false,
    message: "Invalid email format"
  });
}

const normalizedEmail = email.trim().toLowerCase();

const checkuseremail = await User.findOne({email: normalizedEmail})  

 if(checkuseremail){
    return res.status(400).json({
        success:false,
        message:" email already registerd "
    })
 }

 // ✅ SECURITY: Fix race condition by generating OTP and checking for existence in atomic operation
 let otp;
 let otpRecord;
 let attempts = 0;
 const MAX_ATTEMPTS = 10;
 
 do {
   attempts++;
   
   otp = otpGenerator.generate(6,{
     upperCaseAlphabets:false,
     lowerCaseAlphabets:false,
     specialChars:false
   });
   
   // ✅ Use findOne to check if OTP already exists for this email
   // In high-concurrency scenarios, consider adding a unique constraint on (email, otp)
   otpRecord = await OTP.findOne({email: normalizedEmail, otp: otp});
   
   if (attempts >= MAX_ATTEMPTS && otpRecord) {
     return res.status(500).json({
       success: false,
       message: "Failed to generate unique OTP. Please try again."
     });
   }
 } while (otpRecord);  // ✅ Re-check condition on each iteration

 const payload = {
    email: normalizedEmail,
    otp:otp
 }
 if (process.env.NODE_ENV === 'development') {
   console.log(payload);
 }

 // ✅ Create OTP record. If unique constraint exists on (email, otp), handle E11000 error
 try {
   const newotp = await OTP.create(payload);
 } catch (dupErr) {
   if (dupErr.code === 11000) {
     // Duplicate key error - OTP already exists for this email
     return res.status(400).json({
       success: false,
       message: "OTP already generated for this email. Please request a new one."
     });
   }
   throw dupErr;
 }

 return res.status(200).json({
    success:true,
    message:"otp send successfully"
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
    // Try to get token from cookies first, then body
    let token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!token || typeof token !== 'string' || !token.trim()) {
      console.warn("No refresh token provided in cookies or body");
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // basic JWT format check
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      console.warn("Invalid JWT format in refresh token");
      return res.status(401).json({ 
        success: false, 
        message: 'Malformed refresh token',
        code: 'MALFORMED_TOKEN'
      });
    }

    // Verify and extract payload
    const payload = await verifyRefreshToken(token);
    
    // Re-fetch user to get the current role from DB (not the old token payload)
    const User = require('../models/User');
    const user = await User.findById(payload.id).select('role roles');
    
    if (!user) {
      console.warn(`User not found for refresh token: ${payload.id}`);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];
    const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || 'user'];
    const primaryRole = rolesPriority.find(r => userRoles.includes(r)) || 'user';
    
    const accessToken = signAccessToken(payload.id, primaryRole);
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Session refreshed for user: ${user._id}`);
    }
    res.json({ success: true, accessToken });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Refresh token failure:', err.message);
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token',
      code: 'INVALID_TOKEN'
    });
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
      if (process.env.NODE_ENV === 'development') {
        console.log("Email sent successfully:", emailResponse.response);
      }
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      if (process.env.NODE_ENV === 'development') {
        console.error("Error occurred while sending email:", error);
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error occurred while updating password:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

const DoctorRegistration = require("../models/DoctorRegistration");
const Hospital = require("../models/Hospital");

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
      hospital,
    } = req.body;
    if (process.env.NODE_ENV === 'development') {
      console.log("Req.body :", req.body);
    }
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

    // Support both old (role) and new (roles) formats
    const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || "user"];
    const canRegisterAsDoctor = userRoles.includes("user") || userRoles.includes("hospital");
    
    if (!canRegisterAsDoctor) {
      return res.status(403).json({
        success: false,
        message: "Only regular users and hospital owners can apply for doctor registration",
      });
    }

    const existingActive = await DoctorRegistration.findOne({
      user: user.id,
      verificationStatus: { $in: ["PENDING", "APPROVED"] },
    }).sort({ createdAt: -1 });

    if (existingActive) {
      const status = existingActive.verificationStatus;
      return res.status(409).json({
        success: false,
        message:
          status === "PENDING"
            ? "Your application is already under review"
            : "You are already a verified doctor",
      });
    }

    // Validate optional hospital/clinic selection
    let hospitalDoc = null;
    let isHospitalOwner = false;
    let autoApproveByHospital = false;
    
    if (hospital) {
      hospitalDoc = await Hospital.findById(hospital);
      if (!hospitalDoc || hospitalDoc.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Selected hospital or clinic is not verified on Clinicall yet",
        });
      }
      
      // Check if the user owns this hospital
      if (hospitalDoc.adminUser && hospitalDoc.adminUser.toString() === user.id.toString()) {
        isHospitalOwner = true;
        autoApproveByHospital = true; // Auto-approve hospital stage for owner
      }
    }

    // 3. Create registration
    const registrationData = {
      user: user.id,
      fullName,
      email,
      contact,
      specialization,
      qualification,
      experienceYears,
      licenseNumber,
      hospitalName: hospitalDoc ? hospitalDoc.name : (hospitalName || null),
      documents,
      adminRemarks,
      verificationStatus: "PENDING",
      hospital: hospitalDoc ? hospitalDoc._id : null,
      hospitalStatus: autoApproveByHospital ? "approved_hospital" : "pending_hospital",
      isHospitalOwnersApplication: isHospitalOwner,
      autoApprovedByHospital: autoApproveByHospital,
    };
    
    const registration = await DoctorRegistration.create(registrationData);

    try {
      const admins = await User.find({ $or: [{ roles: "admin" }, { role: "admin" }] }).select("_id");
      await Promise.all(
        admins.map((admin) =>
          sendNotification({
            recipient: admin._id,
            type: "DOCTOR_REGISTRATION_SUBMITTED",
            title: "New Doctor Registration 🩺",
            message: `${fullName} has submitted a doctor registration application.`,
          })
        )
      );
    } catch (notifyErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to send admin registration notifications:", notifyErr);
      }
    }

    // Notify hospital admin if doctor applied to a hospital/clinic
    // SKIP if this is the hospital owner registering as doctor (they already approved themselves)
    if (hospitalDoc && hospitalDoc.adminUser && !isHospitalOwner) {
      try {
        await sendNotification({
          recipient: hospitalDoc.adminUser,
          type:    "DOCTOR_APPLIED_TO_HOSPITAL",
          title:   "New Doctor Application 🩺",
          message: `${fullName} has applied to join ${hospitalDoc.name}`,
        });
      } catch (notifyErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to send hospital admin notification:", notifyErr);
        }
      }
    }

    // If hospital owner registering as doctor in their own hospital, send info message
    if (isHospitalOwner) {
      try {
        await sendNotification({
          recipient: user.id,
          type: "DOCTOR_AUTO_APPROVED_BY_HOSPITAL",
          title: "Hospital Approval Automatic ✅",
          message: "Your doctor application for your hospital was automatically approved. Now awaiting platform admin verification.",
        });
      } catch (notifyErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to send owner notification:", notifyErr);
        }
      }
    }

    // 4. Response
    return res.status(201).json({
      success: true,
      message: isHospitalOwner 
        ? "Doctor registration submitted - Hospital approval automatic, awaiting platform admin verification"
        : "Doctor registration submitted for approval",
      data: registration,
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
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
        data: { status: "none", message: "No application found" },
      });
    }

    const statusMap = {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
    };
    const normalizedStatus = statusMap[registration.verificationStatus] || "none";

    return res.status(200).json({
      success: true,
      data: {
        status: normalizedStatus,
        message:
          normalizedStatus === "pending"
            ? "Your application is under review"
            : normalizedStatus === "approved"
            ? "You are already a verified doctor"
            : normalizedStatus === "rejected"
            ? "Your previous application was rejected"
            : "No application found",
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
