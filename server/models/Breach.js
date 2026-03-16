const mongoose = require('mongoose');

const BreachSchema = new mongoose.Schema(
  {
    // Type of breach detected
    type: {
      type: String,
      enum: [
        'unauthorized_access',     // Someone accessed without proper consent
        'mass_export',              // Same user exported too many patients
        'repeated_failure',         // Multiple failed access attempts (brute force?)
        'no_consent_access',        // Access without active consent
        'unusual_access_pattern',   // Same IP accessing many patients
        'data_download'             // Suspicious bulk download
      ],
      required: true,
      index: true
    },
    
    // Severity level per HIPAA categories
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true
    },
    
    // When breach was detected
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    // IP address that triggered the breach
    ipAddress: {
      type: String
    },
    
    // User ID of accessor (if applicable)
    userId_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    
    // List of patients affected
    affectedPatients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // Description of the breach
    description: {
      type: String,
      required: true
    },
    
    // Status of investigation
    status: {
      type: String,
      enum: ['detected', 'investigating', 'resolved', 'false_positive'],
      default: 'detected',
      index: true
    },
    
    // Resolution details
    resolutionDetails: {
      type: String
    },
    
    // When resolved
    resolvedAt: {
      type: Date
    },
    
    // Who resolved it (admin reference)
    resolvedBy_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Whether this breach was reported to authorities
    reportedToAuthorities: {
      type: Boolean,
      default: false
    },
    
    // Report ID if submitted
    authorityReportId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
BreachSchema.index({ detectedAt: -1 });
BreachSchema.index({ userId_ref: 1, detectedAt: -1 });
BreachSchema.index({ status: 1, detectedAt: -1 });
BreachSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('Breach', BreachSchema);
