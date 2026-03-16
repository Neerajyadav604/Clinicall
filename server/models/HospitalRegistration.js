const mongoose = require("mongoose");

const HospitalRegistrationSchema = new mongoose.Schema(
  {
    // ── IDENTITY
    hospitalName: { type: String, required: true, trim: true },
    email:        { type: String, required: true, lowercase: true },
    phone:        { type: String, required: true },
    website:      { type: String, default: null },

    // ── TYPE
    entityType: {
      type: String,
      enum: ["hospital", "government", "private", "trust", "clinic", "multispecialty"],
      required: true,
    },
    isClinic: { type: Boolean, default: false },

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

    // ── DETAILS
    specializations: [{ type: String }],
    totalBeds:        { type: Number, default: null },
    establishedYear:  { type: Number, default: null },
    about:            { type: String, default: null },

    // ── CLINIC-ONLY FIELDS
    consultationFee:     { type: Number, default: null },
    maxPatientsPerDay:   { type: Number, default: null },
    appointmentDuration: { type: Number, default: 15 },
    clinicTimings: {
      monday:    { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday:   { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday:  { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday:    { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday:  { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday:    { open: String, close: String, isClosed: { type: Boolean, default: true  } },
    },

    // ── DOCUMENTS (Cloudinary URLs after upload)
    documents: {
      registrationCertificate: { type: String, default: null }, // REQUIRED both
      nabhCertificate:          { type: String, default: null }, // optional hospital
      ownerIdProof:             { type: String, default: null }, // REQUIRED both
      addressProof:             { type: String, default: null }, // REQUIRED both
      ownerMedicalLicense:      { type: String, default: null }, // REQUIRED clinic
      degreeCertificate:        { type: String, default: null }, // REQUIRED clinic
      gstNumber:                { type: String, default: null }, // text optional clinic
      panNumber:                { type: String, default: null }, // text REQUIRED both
      logo:                     { type: String, default: null }, // optional both
      coverImage:               { type: String, default: null }, // optional both
    },

    // ── CONTACT PERSON
    contactPerson: {
      name:        { type: String, default: null },
      designation: { type: String, default: null },
      phone:       { type: String, default: null },
      email:       { type: String, default: null },
    },

    // ── SUBMITTER
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── STATUS
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Only one active application per email
HospitalRegistrationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  }
);

module.exports = mongoose.model("HospitalRegistration", HospitalRegistrationSchema);
