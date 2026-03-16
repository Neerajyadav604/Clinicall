const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema(
  {
    // ── IDENTITY
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    phone:        { type: String, required: true },
    website:      { type: String, default: null },
    logo:         { type: String, default: null },       // Cloudinary URL
    coverImage:   { type: String, default: null },       // Cloudinary URL

    // ── TYPE
    entityType: {
      type: String,
      enum: ["hospital", "government", "private", "trust", "clinic", "multispecialty"],
      required: true,
    },
    isClinic: { type: Boolean, default: false },
    // isClinic = true when entityType = "clinic"

    // ── ADDRESS
    address: {
      street:  { type: String, required: true },
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    // ── MAP
    location: {
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    googleMapsUrl: { type: String, default: null },

    // ── DETAILS (hospitals)
    specializations: [{ type: String }],
    totalBeds:        { type: Number, default: null },
    establishedYear:  { type: Number, default: null },
    about:            { type: String, default: null },

    // ── CLINIC-ONLY FIELDS (null/unused for hospitals)
    consultationFee:     { type: Number, default: null },
    maxPatientsPerDay:   { type: Number, default: null },
    appointmentDuration: { type: Number, default: 15 }, // minutes
    clinicTimings: {
      monday:    { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      tuesday:   { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      wednesday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      thursday:  { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      friday:    { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      saturday:  { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
      sunday:    { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: true  } },
    },

    // ── DOCUMENTS (all Cloudinary URLs)
    documents: {
      registrationCertificate: { type: String, default: null }, // REQUIRED both
      nabhCertificate:          { type: String, default: null }, // optional hospital
      ownerIdProof:             { type: String, default: null }, // REQUIRED both
      addressProof:             { type: String, default: null }, // REQUIRED both
      ownerMedicalLicense:      { type: String, default: null }, // REQUIRED clinic only
      degreeCertificate:        { type: String, default: null }, // REQUIRED clinic only
      gstNumber:                { type: String, default: null }, // text, optional clinic
      panNumber:                { type: String, default: null }, // text, REQUIRED both
    },

    // ── CONTACT PERSON
    contactPerson: {
      name:        { type: String, default: null },
      designation: { type: String, default: null },
      phone:       { type: String, default: null },
      email:       { type: String, default: null },
    },

    // ── OWNERSHIP
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For clinics: the doctor who owns/runs the clinic
    clinicOwnerDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // ── DOCTORS UNDER THIS ENTITY
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],

    // ── STATUS
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

HospitalSchema.index({ status: 1, "address.city": 1, isClinic: 1 });

module.exports = mongoose.model("Hospital", HospitalSchema);
