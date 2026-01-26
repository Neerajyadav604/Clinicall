const User = require('../models/User')
const OTP = require('../models/OTP')
const bcrypt = require('bcrypt')
const userProfile = require('../models/UserProfile')
const jwt = require('jsonwebtoken')
const otpGenerator = require('otp-generator')


//create signup controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, contact, password, role, otp } = req.body;
    console.log("req body :",req.body)

    if (!fullName || !email || !contact || !password || !role) {
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
      role,
      fullName,
      email,
      contact,
      password: hashedPassword,
      additionalDetails: null,
     
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




exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log("reqbody from login controller",req.body)
    if (!email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    // 1️⃣ Find the user
    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not registered" });

    // 2️⃣ Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // 3️⃣ Populate based on role
    if (user.role === "USER"||"ADMIN") {
      await user.populate("additionalDetails");
    } else if (user.role === "DOCTOR") {
      await user.populate({
        path: "doctorProfile",
        populate: { path: "additionalDoctorDetails" }, // populate the DoctorProfile as well
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    user.password = undefined; // hide password
    user.token = token;

    // 5️⃣ Set cookie & return
    res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Login failed. Try again later" });
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

    // 2. Check if already registered
    const existingRegistration = await DoctorRegistration.findOne(
      { email },
    );

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: "Doctor already registered",
      });
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
