// SyncLog Model
// Tracks bidirectional sync operations between local MongoDB and external FHIR server

const mongoose = require('mongoose');

const SyncLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    externalPatientId: {
      type: String,
      required: true,
      description: 'Patient ID in external FHIR server',
    },
    direction: {
      type: String,
      enum: ['in', 'out', 'both'],
      required: true,
      description: 'Sync direction: in (pull from external), out (push to external), both (bidirectional)',
    },
    resourceType: {
      type: String,
      enum: [
        'Patient',
        'Condition',
        'Observation',
        'MedicationRequest',
        'Medication',
        'AllergyIntolerance',
        'DiagnosticReport',
        'DocumentReference',
        'Procedure',
        'Immunization',
      ],
      required: true,
    },
    externalId: {
      type: String,
      description: 'ID of resource in external FHIR server',
    },
    localId: {
      type: mongoose.Schema.Types.ObjectId,
      description: 'ID of corresponding resource in MongoDB',
    },
    status: {
      type: String,
      enum: ['pending', 'syncing', 'completed', 'failed', 'conflict'],
      default: 'pending',
    },
    syncedAt: {
      type: Date,
      description: 'Timestamp when sync completed',
    },
    conflictResolution: {
      type: String,
      enum: ['external_wins', 'local_wins', 'manual_resolve'],
      description: 'How conflict was resolved (if any)',
    },
    conflictDetails: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Details of any conflict detected (field differences, etc.)',
    },
    errorMessage: {
      type: String,
      description: 'Error message if sync failed',
    },
    syncMetadata: {
      localVersion: {
        type: String,
        description: 'Version/timestamp of local resource before sync',
      },
      externalVersion: {
        type: String,
        description: 'Version/timestamp of external resource before sync',
      },
      fieldsChanged: [String],
      description: 'List of fields that were changed during sync',
    },
    triggeredBy: {
      type: String,
      enum: ['manual', 'automatic', 'scheduled'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SyncLogSchema.index({ patientId: 1, createdAt: -1 });
SyncLogSchema.index({ status: 1 });
SyncLogSchema.index({ resourceType: 1 });
SyncLogSchema.index({ externalId: 1 });
SyncLogSchema.index({ localId: 1 });

module.exports = mongoose.model('SyncLog', SyncLogSchema);
