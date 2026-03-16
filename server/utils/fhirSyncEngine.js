// FHIR Bidirectional Sync Engine
// Syncs patient data between local MongoDB and external FHIR servers
// Conflict resolution: external EHR wins on demographics, local app wins on locally-created records

const ExternalFhirClient = require('./externalFhirClient');
const SyncLog = require('../models/SyncLog');
const User = require('../models/User');
const Condition = require('../models/Condition');
const Observation = require('../models/Observation');
const Medication = require('../models/Medication');
const MedicationRequest = require('../models/MedicationRequest');
const AllergyIntolerance = require('../models/AllergyIntolerance');
const DiagnosticReport = require('../models/DiagnosticReport');
const DocumentReference = require('../models/DocumentReference');
const Procedure = require('../models/Procedure');
const Immunization = require('../models/Immunization');
const { logFHIRAccess } = require('../middleware/auditLogger');

const fhirTransformer = require('./fhirTransformer');

/**
 * FHIR Sync Engine for bidirectional data synchronization
 * Handles pull (in), push (out), and conflict resolution
 */
class FhirSyncEngine {
  /**
   * Initialize sync for a patient
   * @param {string} patientId - Local patient ID
   * @param {string} externalPatientId - Patient ID in external EHR
   * @param {Object} fhirAuth - FHIR authentication { accessToken, refreshToken, ... }
   * @param {string} direction - Sync direction: 'in', 'out', or 'both'
   * @param {string} requesterId - User ID requesting the sync
   * @returns {Promise<Object>} Sync result summary
   */
  static async initiateSyncJob(patientId, externalPatientId, fhirAuth, direction = 'both', requesterId = null) {
    try {
      const externalClient = new ExternalFhirClient(
        fhirAuth.serverUrl,
        fhirAuth.accessToken,
        fhirAuth.refreshToken
      );

      let result = { status: 'completed', direction, synced: [], conflicts: [], errors: [] };

      if (direction === 'in' || direction === 'both') {
        const inResult = await this.syncPatientIn(patientId, externalPatientId, externalClient, requesterId);
        result.synced.push(...inResult.synced);
        result.conflicts.push(...inResult.conflicts);
        result.errors.push(...inResult.errors);
      }

      if (direction === 'out' || direction === 'both') {
        const outResult = await this.syncPatientOut(patientId, externalPatientId, externalClient, requesterId);
        result.synced.push(...outResult.synced);
        result.conflicts.push(...outResult.conflicts);
        result.errors.push(...outResult.errors);
      }

      return result;
    } catch (error) {
      console.error('Sync job failed:', error.message);
      throw new Error(`Failed to initiate sync: ${error.message}`);
    }
  }

  /**
   * Sync data FROM external FHIR server TO local MongoDB (pull)
   * Pulls all resources and upserts to local DB
   * @param {string} patientId - Local patient ID
   * @param {string} externalPatientId - Patient ID in external EHR
   * @param {Object} externalClient - ExternalFhirClient instance
   * @param {string} requesterId - User ID requesting sync
   * @returns {Promise<Object>} Result with synced, conflicts, errors arrays
   */
  static async syncPatientIn(patientId, externalPatientId, externalClient, requesterId) {
    const result = { synced: [], conflicts: [], errors: [] };

    try {
      // Fetch all resource types from external EHR
      const resourceFetchers = [
        { type: 'Patient', fetcher: () => externalClient.fetchExternalPatient(externalPatientId) },
        { type: 'Condition', fetcher: () => externalClient.fetchExternalConditions(externalPatientId) },
        { type: 'Observation', fetcher: () => externalClient.fetchExternalObservations(externalPatientId) },
        { type: 'MedicationRequest', fetcher: () => externalClient.fetchExternalMedications(externalPatientId) },
        { type: 'AllergyIntolerance', fetcher: () => externalClient.fetchExternalAllergies(externalPatientId) },
        { type: 'DiagnosticReport', fetcher: () => externalClient.fetchExternalDiagnosticReports(externalPatientId) },
        { type: 'Procedure', fetcher: () => externalClient.fetchExternalProcedures(externalPatientId) },
        { type: 'Immunization', fetcher: () => externalClient.fetchExternalImmunizations(externalPatientId) },
        { type: 'DocumentReference', fetcher: () => externalClient.fetchExternalDocumentReferences(externalPatientId) },
      ];

      for (const { type, fetcher } of resourceFetchers) {
        try {
          const resources = Array.isArray(await fetcher()) ? await fetcher() : [await fetcher()].filter(r => r);

          for (const externalResource of resources) {
            const syncResult = await this.upsertLocalResource(patientId, externalResource, type, 'external_resource');
            result.synced.push(syncResult);

            // Log sync action
            logFHIRAccess({
              userId: requesterId || patientId,
              resourceType: type,
              resourceId: externalResource.id,
              action: 'SYNC',
              status: 'success',
            });
          }
        } catch (error) {
          result.errors.push({ type, message: error.message });
          logFHIRAccess({
            userId: requesterId || patientId,
            resourceType: type,
            action: 'SYNC',
            status: 'failed',
            errorDetails: error.message,
          });
        }
      }
    } catch (error) {
      console.error('Sync in failed:', error.message);
      result.errors.push({ type: 'general', message: error.message });
    }

    return result;
  }

  /**
   * Sync data FROM local MongoDB TO external FHIR server (push)
   * Pushes locally-created and modified records
   * @param {string} patientId - Local patient ID
   * @param {string} externalPatientId - Patient ID in external EHR
   * @param {Object} externalClient - ExternalFhirClient instance
   * @param {string} requesterId - User ID requesting sync
   * @returns {Promise<Object>} Result with synced, conflicts, errors arrays
   */
  static async syncPatientOut(patientId, externalPatientId, externalClient, requesterId) {
    const result = { synced: [], conflicts: [], errors: [] };

    try {
      // Fetch all local resources for this patient
      const localResources = await this.fetchLocalResources(patientId);

      for (const [resourceType, resources] of Object.entries(localResources)) {
        for (const resource of resources) {
          try {
            // Convert to FHIR format
            const fhirResource = fhirTransformer[`toFhir${resourceType}`]?.(resource) || resource;

            // Only push if externally synced (has sync link) or originated locally
            if (resource.externalId || resource.createdLocally) {
              const externalResponse = await externalClient.pushToExternal(resourceType, fhirResource);
              result.synced.push({
                resourceType,
                localId: resource._id,
                externalId: externalResponse.id,
              });

              // Update local record with external ID if new
              await this.updateLocalExternalId(patientId, resourceType, resource._id, externalResponse.id);

              logFHIRAccess({
                userId: requesterId || patientId,
                resourceType,
                resourceId: resource._id.toString(),
                action: 'SYNC',
                status: 'success',
              });
            }
          } catch (error) {
            result.errors.push({
              resourceType,
              resourceId: resource._id.toString(),
              message: error.message,
            });
            logFHIRAccess({
              userId: requesterId || patientId,
              resourceType,
              resourceId: resource._id.toString(),
              action: 'SYNC',
              status: 'failed',
              errorDetails: error.message,
            });
          }
        }
      }
    } catch (error) {
      console.error('Sync out failed:', error.message);
      result.errors.push({ type: 'general', message: error.message });
    }

    return result;
  }

  /**
   * Compare local and external resources to find conflicts
   * Returns list of resources that differ
   * @param {string} patientId - Local patient ID
   * @param {string} externalPatientId - Patient ID in external EHR
   * @param {Object} externalClient - ExternalFhirClient instance
   * @returns {Promise<Array>} Array of conflicting resources
   */
  static async findConflicts(patientId, externalPatientId, externalClient) {
    const conflicts = [];

    try {
      const localResources = await this.fetchLocalResources(patientId);

      for (const [resourceType, resources] of Object.entries(localResources)) {
        for (const localResource of resources) {
          if (localResource.externalId) {
            try {
              // Fetch corresponding external resource
              const externalFetcher = {
                'Patient': () => externalClient.fetchExternalPatient(externalPatientId),
                'Condition': () => externalClient.executeQuery(`Condition/${localResource.externalId}`),
                'Observation': () => externalClient.executeQuery(`Observation/${localResource.externalId}`),
                'MedicationRequest': () => externalClient.executeQuery(`MedicationRequest/${localResource.externalId}`),
              }[resourceType];

              if (externalFetcher) {
                const externalResource = await externalFetcher();
                const isDifferent = this.resourcesDiffer(localResource, externalResource);

                if (isDifferent) {
                  conflicts.push({
                    resourceType,
                    localId: localResource._id,
                    externalId: localResource.externalId,
                    differences: this.findDifferences(localResource, externalResource),
                  });
                }
              }
            } catch (error) {
              console.error(`Error comparing ${resourceType}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Find conflicts failed:', error.message);
    }

    return conflicts;
  }

  /**
   * Upsert external resource into local MongoDB
   * Handles conflict resolution: external wins on demographics
   * @param {string} patientId - Patient ID
   * @param {Object} externalResource - FHIR resource from external server
   * @param {string} resourceType - FHIR resource type
   * @param {string} source - Source indicator
   * @returns {Promise<Object>} Sync log entry
   */
  static async upsertLocalResource(patientId, externalResource, resourceType, source) {
    const Model = this.getModelByType(resourceType);
    if (!Model) throw new Error(`Unknown resource type: ${resourceType}`);

    let conflictResolution = null;
    let existingResource = null;

    // Check if resource already exists (by externalId or matching criteria)
    if (externalResource.id) {
      existingResource = await Model.findOne({ externalId: externalResource.id });
    }

    // For Patient demographics: external always wins
    if (resourceType === 'Patient' && existingResource) {
      conflictResolution = 'external_wins';
      // Update with external data
      Object.assign(existingResource, externalResource);
    } else if (existingResource) {
      // For other resources: local wins if it was created locally
      if (existingResource.createdLocally) {
        conflictResolution = 'local_wins';
      } else {
        conflictResolution = 'external_wins';
        Object.assign(existingResource, externalResource);
      }
    }

    // Prepare resource for storage
    const resourceData = this.prepareResourceForStorage(externalResource, resourceType, patientId);
    resourceData.externalId = externalResource.id;
    resourceData.lastSyncedAt = new Date();

    let savedResource;
    if (existingResource) {
      Object.assign(existingResource, resourceData);
      savedResource = await existingResource.save();
    } else {
      savedResource = await Model.create(resourceData);
    }

    // Create sync log entry
    const syncLog = await SyncLog.create({
      patientId,
      externalPatientId: externalResource.subject?.reference?.split('/')[1] || 'unknown',
      direction: 'in',
      resourceType,
      externalId: externalResource.id,
      localId: savedResource._id,
      status: 'completed',
      syncedAt: new Date(),
      conflictResolution,
      triggeredBy: 'automatic',
    });

    return {
      resourceType,
      status: 'completed',
      localId: savedResource._id,
      externalId: externalResource.id,
      conflictResolution,
    };
  }

  /**
   * Fetch all local resources for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Object with resource type keys and resource arrays
   */
  static async fetchLocalResources(patientId) {
    return {
      Condition: await Condition.find({ patient: patientId }),
      Observation: await Observation.find({ patient: patientId }),
      Medication: await Medication.find({ patient: patientId }),
      MedicationRequest: await MedicationRequest.find({ patient: patientId }),
      AllergyIntolerance: await AllergyIntolerance.find({ patient: patientId }),
      DiagnosticReport: await DiagnosticReport.find({ patient: patientId }),
      DocumentReference: await DocumentReference.find({ patient: patientId }),
      Procedure: await Procedure.find({ patient: patientId }),
      Immunization: await Immunization.find({ patient: patientId }),
    };
  }

  /**
   * Check if two resources differ significantly
   * @param {Object} local - Local resource
   * @param {Object} external - External resource
   * @returns {boolean} True if they differ
   */
  static resourcesDiffer(local, external) {
    // Simple comparison: check if meta.versionId differs
    if (local.meta?.versionId && external.meta?.versionId) {
      return local.meta.versionId !== external.meta.versionId;
    }
    // Fallback: check lastModified or updated timestamps
    return local.meta?.lastUpdated !== external.meta?.lastUpdated;
  }

  /**
   * Find specific field differences between resources
   * @param {Object} local - Local resource
   * @param {Object} external - External resource
   * @returns {Object} Differences object
   */
  static findDifferences(local, external) {
    const differences = {};
    const fields = ['status', 'code', 'clinicalStatus', 'verificationStatus'];

    for (const field of fields) {
      if (JSON.stringify(local[field]) !== JSON.stringify(external[field])) {
        differences[field] = {
          local: local[field],
          external: external[field],
        };
      }
    }

    return Object.keys(differences).length > 0 ? differences : null;
  }

  /**
   * Get Mongoose model for resource type
   * @param {string} resourceType - FHIR resource type
   * @returns {Model} Mongoose model
   */
  static getModelByType(resourceType) {
    const modelMap = {
      Condition,
      Observation,
      Medication,
      MedicationRequest,
      AllergyIntolerance,
      DiagnosticReport,
      DocumentReference,
      Procedure,
      Immunization,
    };
    return modelMap[resourceType];
  }

  /**
   * Prepare external resource for local storage
   * Adds patient reference and other metadata
   * @param {Object} resource - FHIR resource
   * @param {string} resourceType - Resource type
   * @param {string} patientId - Patient ID
   * @returns {Object} Prepared resource
   */
  static prepareResourceForStorage(resource, resourceType, patientId) {
    const prepared = { ...resource };

    // Add patient reference
    if (resourceType !== 'Patient') {
      prepared.patient = patientId;
    }

    // Mark as externally synced
    prepared.externalId = resource.id;
    prepared.lastSyncedAt = new Date();

    return prepared;
  }

  /**
   * Update local resource with external ID
   * @param {string} patientId - Patient ID
   * @param {string} resourceType - Resource type
   * @param {string} localId - Local resource ID
   * @param {string} externalId - External resource ID
   */
  static async updateLocalExternalId(patientId, resourceType, localId, externalId) {
    const Model = this.getModelByType(resourceType);
    if (!Model) return;

    await Model.updateOne(
      { _id: localId, patient: patientId },
      { externalId, lastSyncedAt: new Date() }
    );
  }
}

module.exports = FhirSyncEngine;
