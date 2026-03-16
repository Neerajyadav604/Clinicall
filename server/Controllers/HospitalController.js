const Hospital = require("../models/Hospital");
const HospitalRegistration = require("../models/HospitalRegistration");
const DoctorRegistration = require("../models/DoctorRegistration");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { uploadImageToCloudinary } = require("../utils/ImageUploader");
const mailSender = require("../utils/mailSender");
const { sendNotification } = require("../utils/sendNotification");

// ============================================
// A) SUBMIT HOSPITAL REGISTRATION
// ============================================

exports.submitHospitalRegistration = async (req, res) => {
  try {
    const {
      hospitalName,
      email,
      phone,
      website,
      entityType,
      street,
      city,
      state,
      pincode,
      country,
      latitude,
      longitude,
      googleMapsUrl,
      specializations,
      totalBeds,
      establishedYear,
      about,
      contactPersonName,
      contactPersonDesignation,
      contactPersonPhone,
      contactPersonEmail,
      panNumber,
      gstNumber,
      consultationFee,
      maxPatientsPerDay,
      appointmentDuration,
      clinicTimings,
    } = req.body;

    // 1. Set isClinic flag
    const isClinic = entityType === "clinic";

    // 2. Validate required text fields
    if (!hospitalName || !email || !phone || !entityType || !street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: hospitalName, email, phone, entityType, street, city, state, pincode",
      });
    }

    if (!panNumber) {
      return res.status(400).json({
        success: false,
        message: "PAN number is required",
      });
    }

    // 3. Validate required files
    const files = req.files || {};
    const missingFiles = [];

    if (!files.registrationCertificate) missingFiles.push("registrationCertificate");
    if (!files.ownerIdProof) missingFiles.push("ownerIdProof");
    if (!files.addressProof) missingFiles.push("addressProof");

    if (isClinic) {
      if (!files.ownerMedicalLicense) missingFiles.push("ownerMedicalLicense");
      if (!files.degreeCertificate) missingFiles.push("degreeCertificate");
    }

    if (missingFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required documents: ${missingFiles.join(", ")}`,
      });
    }

    // 4. Check for duplicate active application
    const existing = await HospitalRegistration.findOne({
      email: email.toLowerCase(),
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "approved"
            ? "An approved registration already exists for this email"
            : "A pending application already exists for this email",
      });
    }

    // 5. Upload files to Cloudinary
    const uploadFile = async (file, folder) => {
      if (!file) return null;
      const result = await uploadImageToCloudinary(file, folder);
      return result.secure_url;
    };

    const folder = "clinicall/hospital-registrations";

    const [
      registrationCertificateUrl,
      nabhCertificateUrl,
      ownerIdProofUrl,
      addressProofUrl,
      ownerMedicalLicenseUrl,
      degreeCertificateUrl,
      logoUrl,
      coverImageUrl,
    ] = await Promise.all([
      uploadFile(files.registrationCertificate, folder),
      uploadFile(files.nabhCertificate, folder),
      uploadFile(files.ownerIdProof, folder),
      uploadFile(files.addressProof, folder),
      uploadFile(files.ownerMedicalLicense, folder),
      uploadFile(files.degreeCertificate, folder),
      uploadFile(files.logo, folder),
      uploadFile(files.coverImage, folder),
    ]);

    // Parse JSON fields
    let parsedSpecializations = [];
    try {
      parsedSpecializations = specializations ? JSON.parse(specializations) : [];
    } catch (_) {
      parsedSpecializations = [];
    }

    let parsedClinicTimings = null;
    try {
      parsedClinicTimings = clinicTimings ? JSON.parse(clinicTimings) : null;
    } catch (_) {
      parsedClinicTimings = null;
    }

    // 6. Create HospitalRegistration document
    const registration = await HospitalRegistration.create({
      hospitalName,
      email: email.toLowerCase(),
      phone,
      website: website || null,
      entityType,
      isClinic,
      address: { street, city, state, pincode, country: country || "India" },
      location: {
        latitude:  latitude  ? Number(latitude)  : null,
        longitude: longitude ? Number(longitude) : null,
      },
      googleMapsUrl: googleMapsUrl || null,
      specializations: parsedSpecializations,
      totalBeds:        totalBeds        ? Number(totalBeds)        : null,
      establishedYear:  establishedYear  ? Number(establishedYear)  : null,
      about: about || null,
      consultationFee:     isClinic && consultationFee     ? Number(consultationFee)     : null,
      maxPatientsPerDay:   isClinic && maxPatientsPerDay   ? Number(maxPatientsPerDay)   : null,
      appointmentDuration: isClinic && appointmentDuration ? Number(appointmentDuration) : 15,
      clinicTimings: isClinic && parsedClinicTimings ? parsedClinicTimings : undefined,
      documents: {
        registrationCertificate: registrationCertificateUrl,
        nabhCertificate:         nabhCertificateUrl         || null,
        ownerIdProof:            ownerIdProofUrl,
        addressProof:            addressProofUrl,
        ownerMedicalLicense:     ownerMedicalLicenseUrl     || null,
        degreeCertificate:       degreeCertificateUrl       || null,
        gstNumber:               gstNumber                  || null,
        panNumber,
        logo:       logoUrl       || null,
        coverImage: coverImageUrl || null,
      },
      contactPerson: {
        name:        contactPersonName        || null,
        designation: contactPersonDesignation || null,
        phone:       contactPersonPhone       || null,
        email:       contactPersonEmail       || null,
      },
      submittedBy: req.user._id,
      status: "pending",
    });

    // 7. Notify all admin users
    try {
      const admins = await User.find({ $or: [{ roles: "admin" }, { role: "admin" }] }).select("_id");
      await Promise.all(
        admins.map((admin) =>
          sendNotification({
            recipient: admin._id,
            type: isClinic ? "CLINIC_REGISTRATION_SUBMITTED" : "HOSPITAL_REGISTRATION_SUBMITTED",
            title: isClinic ? "New Clinic Registration 🏥" : "New Hospital Registration 🏥",
            message: `${hospitalName} has submitted a registration application`,
          })
        )
      );
    } catch (notifyErr) {
      console.error("Failed to send admin notifications:", notifyErr);
    }

    // 8. Send confirmation email
    try {
      await mailSender(
        email,
        isClinic ? "Clinic Registration Received" : "Hospital Registration Received",
        `<p>Dear ${hospitalName},</p>
         <p>We have received your ${isClinic ? "clinic" : "hospital"} registration application on Clinicall. Our team will review it and get back to you shortly.</p>
         <p>Thank you for registering with Clinicall.</p>`
      );
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting hospital registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit registration",
      error: error.message,
    });
  }
};

// ============================================
// B) GET REGISTRATION STATUS
// ============================================

exports.getRegistrationStatus = async (req, res) => {
  try {
    const registration = await HospitalRegistration.findOne({
      submittedBy: req.user._id,
    }).sort({ createdAt: -1 });

    if (!registration) {
      return res.status(200).json({
        success: true,
        data: {
          status: "none",
          isClinic: null,
          hospitalName: null,
          rejectionReason: null,
          submittedAt: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: registration.status,
        isClinic: registration.isClinic,
        hospitalName: registration.hospitalName,
        rejectionReason: registration.rejectionReason || null,
        submittedAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching registration status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registration status",
      error: error.message,
    });
  }
};

// ============================================
// C) GET ALL HOSPITALS  (PUBLIC)
// ============================================

exports.getAllHospitals = async (req, res) => {
  try {
    const { city, specialization, type, isClinic } = req.query;

    const query = { status: "approved" };

    if (city) query["address.city"] = { $regex: city, $options: "i" };
    if (specialization) query.specializations = { $in: [specialization] };
    if (type) query.entityType = type;
    if (isClinic !== undefined) query.isClinic = isClinic === "true";

    const hospitals = await Hospital.find(query).select(
      "_id name email phone logo coverImage address location entityType isClinic specializations totalBeds establishedYear about consultationFee clinicTimings doctors createdAt"
    );

    const data = hospitals.map((h) => ({
      _id:             h._id,
      name:            h.name,
      email:           h.email,
      phone:           h.phone,
      logo:            h.logo,
      coverImage:      h.coverImage,
      address:         h.address,
      location:        h.location,
      entityType:      h.entityType,
      isClinic:        h.isClinic,
      specializations: h.specializations,
      totalBeds:       h.totalBeds,
      establishedYear: h.establishedYear,
      about:           h.about,
      consultationFee: h.consultationFee,
      clinicTimings:   h.clinicTimings,
      doctorsCount:    h.doctors ? h.doctors.length : 0,
      createdAt:       h.createdAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
      error: error.message,
    });
  }
};

// ============================================
// D) GET HOSPITAL BY ID  (PUBLIC)
// ============================================

exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({
      _id: req.params.id,
      status: "approved",
    }).populate("doctors", "fullName specialization displayPicture experienceYears");

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    return res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    console.error("Error fetching hospital:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital",
      error: error.message,
    });
  }
};

// ============================================
// E) GET HOSPITAL DOCTORS  (PUBLIC)
// ============================================

exports.getHospitalDoctors = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({
      _id: req.params.id,
      status: "approved",
    }).populate({
      path: "doctors",
      select: "_id fullName specialization experienceYears displayPicture rating",
    });

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    return res.status(200).json({ success: true, data: hospital.doctors || [] });
  } catch (error) {
    console.error("Error fetching hospital doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital doctors",
      error: error.message,
    });
  }
};

// ============================================
// F) APPROVE HOSPITAL REGISTRATION  (ADMIN)
// ============================================

exports.approveHospitalRegistration = async (req, res) => {
  try {
    const reg = await HospitalRegistration.findById(req.params.id);
    if (!reg) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (reg.status !== "pending") {
      return res.status(400).json({ success: false, message: "Already processed" });
    }

    // Create Hospital document from registration data
    const hospital = await Hospital.create({
      name:           reg.hospitalName,
      email:          reg.email,
      phone:          reg.phone,
      website:        reg.website,
      logo:           reg.documents.logo,
      coverImage:     reg.documents.coverImage,
      entityType:     reg.entityType,
      isClinic:       reg.isClinic,
      address:        reg.address,
      location:       reg.location,
      googleMapsUrl:  reg.googleMapsUrl,
      specializations: reg.specializations,
      totalBeds:       reg.totalBeds,
      establishedYear: reg.establishedYear,
      about:           reg.about,
      consultationFee:     reg.consultationFee,
      maxPatientsPerDay:   reg.maxPatientsPerDay,
      appointmentDuration: reg.appointmentDuration,
      clinicTimings:       reg.clinicTimings,
      documents: {
        registrationCertificate: reg.documents.registrationCertificate,
        nabhCertificate:         reg.documents.nabhCertificate,
        ownerIdProof:            reg.documents.ownerIdProof,
        addressProof:            reg.documents.addressProof,
        ownerMedicalLicense:     reg.documents.ownerMedicalLicense,
        degreeCertificate:       reg.documents.degreeCertificate,
        gstNumber:               reg.documents.gstNumber,
        panNumber:               reg.documents.panNumber,
      },
      contactPerson: reg.contactPerson,
      adminUser:     reg.submittedBy,
      status:        "approved",
    });

    // Update registration status
    reg.status = "approved";
    await reg.save();

    // Update submitter's role to hospital_admin - support both old and new schema
    const user = await User.findById(reg.submittedBy);
    if (user) {
      // Ensure roles array includes hospital_admin
      if (Array.isArray(user.roles)) {
        if (!user.roles.includes("hospital_admin")) {
          user.roles.push("hospital_admin");
        }
      } else {
        // Migrate old schema to new
        user.roles = [user.role || "user", "hospital_admin"];
      }
      
      // ✅ Also sync the role field to primary admin role
      const rolesPriority = ["hospital_admin", "doctor", "user"];
      const primaryRole = rolesPriority.find(r => user.roles.includes(r)) || "user";
      user.role = primaryRole;
      
      await user.save();
      console.log(`🔄 Hospital admin role sync for ${user.email}: roles=[${user.roles.join(", ")}], role=${user.role}`);
    }

    // Notify submitter
    try {
      await sendNotification({
        recipient: reg.submittedBy,
        type:    reg.isClinic ? "CLINIC_APPROVED" : "HOSPITAL_APPROVED",
        title:   reg.isClinic ? "Clinic Registration Approved ✅" : "Hospital Registration Approved ✅",
        message: `${reg.hospitalName} is now verified and live on Clinicall.`,
      });
    } catch (notifyErr) {
      console.error("Failed to send approval notification:", notifyErr);
    }

    // Send approval email
    try {
      await mailSender(
        reg.email,
        reg.isClinic ? "Clinic Registration Approved" : "Hospital Registration Approved",
        `<p>Dear ${reg.hospitalName},</p>
         <p>Congratulations! Your ${reg.isClinic ? "clinic" : "hospital"} registration has been approved. You are now verified and live on Clinicall.</p>`
      );
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }

    return res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    console.error("Error approving hospital registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve registration",
      error: error.message,
    });
  }
};

// ============================================
// G) REJECT HOSPITAL REGISTRATION  (ADMIN)
// ============================================

exports.rejectHospitalRegistration = async (req, res) => {
  try {
    const { reason } = req.body;

    const reg = await HospitalRegistration.findById(req.params.id);
    if (!reg) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (reg.status !== "pending") {
      return res.status(400).json({ success: false, message: "Already processed" });
    }

    reg.status = "rejected";
    reg.rejectionReason = reason || "Registration rejected";
    await reg.save();

    try {
      await sendNotification({
        recipient: reg.submittedBy,
        type:    reg.isClinic ? "CLINIC_REJECTED" : "HOSPITAL_REJECTED",
        title:   reg.isClinic ? "Clinic Registration Rejected" : "Hospital Registration Rejected",
        message: `Your registration for ${reg.hospitalName} was rejected. Reason: ${reason || "Not specified"}`,
      });
    } catch (notifyErr) {
      console.error("Failed to send rejection notification:", notifyErr);
    }

    try {
      await mailSender(
        reg.email,
        reg.isClinic ? "Clinic Registration Rejected" : "Hospital Registration Rejected",
        `<p>Dear ${reg.hospitalName},</p>
         <p>Your registration application has been reviewed and rejected.</p>
         <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
         <p>You may reapply with updated information.</p>`
      );
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error rejecting hospital registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject registration",
      error: error.message,
    });
  }
};

// ============================================
// H) GET ALL HOSPITAL REGISTRATIONS  (ADMIN)
// ============================================

exports.getAllHospitalRegistrations = async (req, res) => {
  try {
    const { status = "pending", isClinic } = req.query;

    const query = { status };
    if (isClinic !== undefined) query.isClinic = isClinic === "true";

    const registrations = await HospitalRegistration.find(query)
      .populate("submittedBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    console.error("Error fetching hospital registrations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
};

// ============================================
// I) GET HOSPITAL REGISTRATION BY ID  (ADMIN)
// ============================================

exports.getHospitalRegistrationById = async (req, res) => {
  try {
    const registration = await HospitalRegistration.findById(req.params.id).populate(
      "submittedBy",
      "fullName email"
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    return res.status(200).json({ success: true, data: registration });
  } catch (error) {
    console.error("Error fetching hospital registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registration",
      error: error.message,
    });
  }
};

// ============================================
// J) GET ALL APPROVED HOSPITALS  (ADMIN)
// ============================================

exports.getAllApprovedHospitalsAdmin = async (req, res) => {
  try {
    const { isClinic } = req.query;

    const query = {};
    if (isClinic !== undefined) query.isClinic = isClinic === "true";

    const hospitals = await Hospital.find(query);

    const data = hospitals.map((h) => ({
      ...h.toObject(),
      doctorsCount: h.doctors ? h.doctors.length : 0,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching approved hospitals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
      error: error.message,
    });
  }
};

// ============================================
// K) SUSPEND HOSPITAL  (ADMIN)
// ============================================

exports.suspendHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error suspending hospital:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to suspend hospital",
      error: error.message,
    });
  }
};

// ============================================
// L) GET HOSPITAL DOCTOR APPLICATIONS  (HOSPITAL ADMIN)
// ============================================

exports.getHospitalDoctorApplications = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ adminUser: req.user._id });
    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage any hospital",
      });
    }

    const { hospitalStatus } = req.query;
    const query = { hospital: hospital._id };
    if (hospitalStatus) query.hospitalStatus = hospitalStatus;

    const applications = await DoctorRegistration.find(query)
      .populate("user", "fullName email image")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("Error fetching hospital doctor applications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// ============================================
// M) APPROVE HOSPITAL DOCTOR APPLICATION  (HOSPITAL ADMIN)
// ============================================

exports.approveHospitalDoctorApplication = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ adminUser: req.user._id });
    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage any hospital",
      });
    }

    const application = await DoctorRegistration.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.hospitalStatus = "approved_hospital";
    application.hospitalReviewedAt = new Date();
    await application.save();

    try {
      await sendNotification({
        recipient: application.user,
        type:    "HOSPITAL_DOCTOR_APPROVED",
        title:   "Application Approved ✅",
        message: `Your application to join ${hospital.name} has been approved. Pending final platform verification.`,
      });
    } catch (notifyErr) {
      console.error("Failed to send approval notification:", notifyErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error approving doctor application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve application",
      error: error.message,
    });
  }
};

// ============================================
// N) REJECT HOSPITAL DOCTOR APPLICATION  (HOSPITAL ADMIN)
// ============================================

exports.rejectHospitalDoctorApplication = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ adminUser: req.user._id });
    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage any hospital",
      });
    }

    const application = await DoctorRegistration.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const { reason } = req.body;

    application.hospitalStatus = "rejected_hospital";
    application.hospitalRejectionReason = reason || "Not specified";
    application.hospitalReviewedAt = new Date();
    await application.save();

    try {
      await sendNotification({
        recipient: application.user,
        type:    "HOSPITAL_DOCTOR_REJECTED",
        title:   "Application Rejected",
        message: `Your application to join ${hospital.name} was rejected. Reason: ${reason || "Not specified"}`,
      });
    } catch (notifyErr) {
      console.error("Failed to send rejection notification:", notifyErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error rejecting doctor application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message,
    });
  }
};
