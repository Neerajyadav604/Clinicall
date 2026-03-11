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
    const profileDoc = await userProfile
      .findOne({ userId })
      .populate(
        "userId",
        "fullName email contact role image createdAt updatedAt"
      );

    if (!profileDoc) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const userBase = profileDoc.userId.toObject
      ? profileDoc.userId.toObject()
      : profileDoc.userId;

    const completeUser = {
      ...userBase,
      ...profileDoc._doc,
      additionalDetails: profileDoc._doc,
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
  try {
    const userId = req.user.id;

    const {
      dob,
      gender,
      address,
      bloodGroup,
      allergies,
      medicalHistory,
      medications,
      emergencyContact,
      insurance
    } = req.body;

    // Build update object explicitly
    const updateData = {
      ...(dob !== undefined && { dob }),
      ...(gender !== undefined && { gender }),
      ...(address !== undefined && { address }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(allergies !== undefined && { allergies }),
      ...(medicalHistory !== undefined && { medicalHistory }),
      ...(medications !== undefined && { medications }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(insurance !== undefined && { insurance })
    };

    const updatedProfile = await userProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName email contact role image createdAt'); // ✅ POPULATE USER DATA

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // ✅ RETURN COMPLETE USER OBJECT WITH ALL FIELDS
    const completeUser = {
      _id: updatedProfile.userId._id,
      fullName: updatedProfile.userId.fullName,
      email: updatedProfile.userId.email,
      contact: updatedProfile.userId.contact,
      role: updatedProfile.userId.role,
      image: updatedProfile.userId.image,  // ✅ IMAGE IS INCLUDED
      createdAt: updatedProfile.userId.createdAt,
      // Additional details from userProfile
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

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      userprofile: completeUser  // ✅ COMPLETE USER WITH IMAGE
    });

  } catch (error) {
    console.error(error);
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
    
    const displayPicture = req.files.displayPicture;
    const userId = req.user._id; // extract from authenticated request
    
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    
    console.log("Uploaded image:", image);
    
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
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      contact: updatedUser.contact,
      role: updatedUser.role,
      image: updatedUser.image,  // ✅ UPDATED IMAGE
      createdAt: updatedUser.createdAt,
      ...additionalDetails?._doc,  // Spread additional details
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
