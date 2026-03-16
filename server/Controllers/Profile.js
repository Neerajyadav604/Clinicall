const DoctorProfile = require('../models/DoctorProfile')
const userProfile = require('../models/UserProfile')
require("dotenv").config
const {uploadImageToCloudinary }= require('../utils/ImageUploader')
const Doctor = require('../models/Doctor')


exports.getDoctorProfile = async (req, res) => {
  try {
    const {doctorId } = req.params;

   console.log(doctorId)

    const doctorProfile = await DoctorProfile
      .findOne({doctorId})
      .populate("doctorId", "fullName email specialization");

      console.log(doctorProfile)

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
    }

    // ✅ THIS is how you send it
    return res.status(200).json({
      success: true,
      doctorProfile: doctorProfile
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // fetch profile along with base user document
    let profileDoc = await userProfile
      .findOne({ userId })
      .populate(
        "userId",
        "fullName email contact role image createdAt updatedAt roles"
      );

    // If profile doesn't exist, create one
    if (!profileDoc) {
      profileDoc = await userProfile.create({
        userId,
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
          policyNumber: null
        }
      });

      // Populate the newly created profile
      profileDoc = await userProfile.findOne({ userId })
        .populate("userId", "fullName email contact role image createdAt updatedAt roles");
    }

    const userBase = profileDoc.userId.toObject
      ? profileDoc.userId.toObject()
      : profileDoc.userId;

    // Explicitly build complete user object with all profile fields
    const completeUser = {
      _id: userBase._id,
      fullName: userBase.fullName,
      email: userBase.email,
      contact: userBase.contact,
      role: userBase.role,
      roles: userBase.roles,
      image: userBase.image,
      createdAt: userBase.createdAt,
      updatedAt: userBase.updatedAt,
      dob: profileDoc.dob,
      gender: profileDoc.gender,
      address: profileDoc.address,
      bloodGroup: profileDoc.bloodGroup,
      allergies: profileDoc.allergies,
      medicalHistory: profileDoc.medicalHistory,
      medications: profileDoc.medications,
      emergencyContact: profileDoc.emergencyContact,
      insurance: profileDoc.insurance,
      additionalDetails: {
        dob: profileDoc.dob,
        gender: profileDoc.gender,
        address: profileDoc.address,
        bloodGroup: profileDoc.bloodGroup,
        allergies: profileDoc.allergies,
        medicalHistory: profileDoc.medicalHistory,
        medications: profileDoc.medications,
        emergencyContact: profileDoc.emergencyContact,
        insurance: profileDoc.insurance,
      }
    };

    return res.status(200).json({
      success: true,
      user: completeUser,
    });

  } catch (error) {
    console.log("GET USER PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] ========== updateUserProfile START ==========`);

  try {
    console.log(`[${requestId}] Step 1: Extracting user ID from request`);
    console.log(`[${requestId}] req.user:`, JSON.stringify(req.user, null, 2));

    const userId = req.user.id;
    console.log(`[${requestId}] Extracted userId: ${userId}`);

    if (!userId) {
      console.error(`[${requestId}] ERROR: userId is undefined or null`);
    }

    console.log(`[${requestId}] Step 2: Extracting fields from req.body`);
    console.log(`[${requestId}] Raw req.body:`, JSON.stringify(req.body, null, 2));

    const {
      dob,
      gender,
      address,
      bloodGroup,
      allergies,
      medicalHistory,
      medications,
      emergencyContact,
      insuranceProvider,
      policyNumber
    } = req.body;

    console.log(`[${requestId}] Destructured fields:`, {
      dob: dob !== undefined ? dob : "NOT PROVIDED",
      gender: gender !== undefined ? gender : "NOT PROVIDED",
      address: address !== undefined ? address : "NOT PROVIDED",
      bloodGroup: bloodGroup !== undefined ? bloodGroup : "NOT PROVIDED",
      allergies: allergies !== undefined ? allergies : "NOT PROVIDED",
      medicalHistory: medicalHistory !== undefined ? medicalHistory : "NOT PROVIDED",
      medications: medications !== undefined ? medications : "NOT PROVIDED",
      emergencyContact: emergencyContact !== undefined ? emergencyContact : "NOT PROVIDED",
      insuranceProvider: insuranceProvider !== undefined ? insuranceProvider : "NOT PROVIDED",
      policyNumber: policyNumber !== undefined ? policyNumber : "NOT PROVIDED",
    });

    console.log(`[${requestId}] Step 3: Building updateData object`);
    const updateData = {
      userId: userId,
      ...(dob !== undefined && dob !== "" ? { dob: new Date(dob) } : {}),
      ...(gender !== undefined && { gender }),
      ...(address !== undefined && { address }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(allergies !== undefined && { allergies }),
      ...(medicalHistory !== undefined && { medicalHistory }),
      ...(medications !== undefined && { medications }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(insuranceProvider !== undefined || policyNumber !== undefined ? {
        insurance: {
          provider: insuranceProvider || null,
          policyNumber: policyNumber || null
        }
      } : {})
    };

    console.log(`[${requestId}] Built updateData:`, JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      console.warn(`[${requestId}] WARNING: updateData is empty — no fields will be updated`);
    }

    console.log(`[${requestId}] Step 4: Fetching existing profile for userId: ${userId}`);
    try {
      let profileDoc = await userProfile.findOne({ userId });
      
      if (!profileDoc) {
        console.log(`[${requestId}] Creating new profile for userId: ${userId}`);
        profileDoc = new userProfile({ userId });
      }

      console.log(`[${requestId}] Applying updates to profile`);
      // Apply all updates to the document
      Object.keys(updateData).forEach(key => {
        if (key !== 'userId') {
          profileDoc[key] = updateData[key];
        }
      });

      console.log(`[${requestId}] Saving profile to database`);
      const savedDoc = await profileDoc.save();
      
      // Now populate and fetch to get full data
      const updatedProfile = await userProfile.findById(savedDoc._id)
        .populate('userId', 'fullName email contact role roles image createdAt updatedAt');

      console.log(`[${requestId}] DB query completed`);
      console.log(`[${requestId}] updatedProfile after DB save:`, {
        userId: updatedProfile.userId,
        dob: updatedProfile.dob,
        gender: updatedProfile.gender,
        address: updatedProfile.address,
        bloodGroup: updatedProfile.bloodGroup,
        emergencyContact: updatedProfile.emergencyContact,
        allergies: updatedProfile.allergies,
        medications: updatedProfile.medications,
        medicalHistory: updatedProfile.medicalHistory,
        insurance: updatedProfile.insurance
      });

      if (!updatedProfile) {
        console.warn(`[${requestId}] WARNING: No profile found for userId: ${userId}`);
        return res.status(404).json({
          success: false,
          message: "Profile not found"
        });
      }

      console.log(`[${requestId}] Step 5: Checking populated userId field`);
      console.log(`[${requestId}] updatedProfile.userId:`, JSON.stringify(updatedProfile.userId, null, 2));

      if (!updatedProfile.userId) {
        console.error(`[${requestId}] ERROR: populate failed — updatedProfile.userId is null/undefined`);
      } else {
        console.log(`[${requestId}] Populated user fields present:`, {
        _id: updatedProfile.userId._id,
        fullName: updatedProfile.userId.fullName,
        email: updatedProfile.userId.email,
        contact: updatedProfile.userId.contact,
        role: updatedProfile.userId.role,
        image: updatedProfile.userId.image ?? "IMAGE IS NULL/UNDEFINED",
        createdAt: updatedProfile.userId.createdAt,
      });
      }

      console.log(`[${requestId}] Step 6: Building completeUser response object`);
      const completeUser = {
        _id: updatedProfile.userId._id,
        fullName: updatedProfile.userId.fullName,
        email: updatedProfile.userId.email,
        contact: updatedProfile.userId.contact,
        role: updatedProfile.userId.role,
        roles: updatedProfile.userId.roles,
        image: updatedProfile.userId.image,
        createdAt: updatedProfile.userId.createdAt,
        updatedAt: updatedProfile.userId.updatedAt,
        dob: updatedProfile.dob,
        gender: updatedProfile.gender,
        address: updatedProfile.address,
        bloodGroup: updatedProfile.bloodGroup,
        allergies: updatedProfile.allergies,
        medicalHistory: updatedProfile.medicalHistory,
        medications: updatedProfile.medications,
        emergencyContact: updatedProfile.emergencyContact,
        insurance: updatedProfile.insurance,
        additionalDetails: {
          dob: updatedProfile.dob,
          gender: updatedProfile.gender,
          address: updatedProfile.address,
          bloodGroup: updatedProfile.bloodGroup,
          allergies: updatedProfile.allergies,
          medicalHistory: updatedProfile.medicalHistory,
          medications: updatedProfile.medications,
          emergencyContact: updatedProfile.emergencyContact,
          insurance: updatedProfile.insurance
        }
      };

      console.log(`[${requestId}] Built completeUser:`, JSON.stringify(completeUser, null, 2));

      console.log(`[${requestId}] Step 7: Sending 200 response`);
      console.log(`[${requestId}] ========== updateUserProfile SUCCESS ==========`);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        userprofile: completeUser
      });
    } catch (dbError) {
      console.error(`[${requestId}] ERROR during profile save:`, dbError.message);
      console.error(`[${requestId}] DB error stack:`, dbError.stack);
      throw dbError;
    }

  } catch (error) {
    console.error(`[${requestId}] ========== updateUserProfile FAILED ==========`);
    console.error(`[${requestId}] Error message:`, error.message);
    console.error(`[${requestId}] Error name:`, error.name);
    console.error(`[${requestId}] Error stack:`, error.stack);
    console.error(`[${requestId}] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    return res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};


exports.updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(doctorId)

    const {
      clinicAddress,
      availableDays,
      availableHours,
      consultationFee,
      languages,
      bio
    } = req.body;

    
    const updateData = {};

    if (clinicAddress !== undefined) updateData.clinicAddress = clinicAddress;
    if (availableDays !== undefined) updateData.availableDays = availableDays;
    if (availableHours !== undefined) updateData.availableHours = availableHours;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (languages !== undefined) updateData.languages = languages;
    if (bio !== undefined) updateData.bio = bio;

   
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }
console.log(updateData)
    const updatedProfile = await DoctorProfile.findOneAndUpdate(
      { doctorId },
      { $set: updateData },     
      { new: true, runValidators: true }
    );

    console.log(updatedProfile)

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      doctorprofile: updatedProfile,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


exports.updateuserDisplayPicture = async (req, res) => {
  try {
    console.log("\n=== DISPLAY PICTURE UPLOAD ===");
    console.log("User from auth middleware:", req.user ? req.user._id : "MISSING");
    console.log("Files received:", req.files ? Object.keys(req.files) : "NONE");
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed - user not found in request"
      });
    }

    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "Display picture is required",
      });
    }
    
    const displayPicture = req.files.displayPicture;
    const userId = req.user._id; // extract from authenticated request
    
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    
    console.log("Uploaded image:", image);
    console.log("Saved image URL:", image?.secure_url);

    if (!image?.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
    
    // ✅ Update the User model, not userProfile
    const User = require('../models/User'); // Make sure to require User model
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    );

    // ✅ Get the additional details
    const additionalDetails = await userProfile.findOne({ userId });

    // ✅ Combine everything
    const completeUser = {
      ...additionalDetails?._doc,
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      contact: updatedUser.contact,
      role: updatedUser.role,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
      additionalDetails: additionalDetails?._doc || {}
    };

    return res.status(200).json({
      success: true,
      message: `Image updated successfully`,
      data: completeUser,  // ✅ COMPLETE USER OBJECT
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updatedoctorDisplayPicture = async (req, res) => {
  try {
  
    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "Display picture is required",
      });
    }

    const userId = req.user.id; 
    console.log(userId)

    
    const image = await uploadImageToCloudinary(
      req.files.displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { user: userId },                  
      { $set: { image: image.secure_url } },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found for this user",
      });
    }

   
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedDoctor,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
