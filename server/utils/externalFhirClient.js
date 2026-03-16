// External FHIR Server Client
// Uses fhir-kit-client (or axios as fallback) to interact with Epic, Cerner, AWS HealthLake

const axios = require('axios');
const oauthConfig = require('../config/oauth');

/**
 * HTTP client for external FHIR servers
 * Handles token refresh, retry logic, and FHIR resource operations
 */
class ExternalFhirClient {
  constructor(fhirServerUrl, accessToken, refreshToken = null, tokenRefreshFn = null) {
    this.fhirServerUrl = fhirServerUrl || oauthConfig.fhirServerUrl;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenRefreshFn = tokenRefreshFn; // Callback to refresh token when expired

    this.client = axios.create({
      baseURL: this.fhirServerUrl,
      headers: {
        'Content-Type': 'application/fhir+json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // Auto-refresh token on 401
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && this.refreshToken && this.tokenRefreshFn) {
          return this.tokenRefreshFn().then(() => {
            // Retry original request with new token
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(error.config);
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch patient demographic data from external FHIR server
   * @param {string} patientId - Patient ID in external EHR
   * @returns {Promise<Object>} FHIR Patient resource
   */
  async fetchExternalPatient(patientId) {
    try {
      const response = await this.client.get(`/Patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error.message);
      throw new Error(`Failed to fetch patient from external EHR: ${error.message}`);
    }
  }

  /**
   * Fetch conditions/diagnoses from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR Condition resources
   */
  async fetchExternalConditions(patientId) {
    try {
      const response = await this.client.get(`/Condition?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching conditions for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch conditions: ${error.message}`);
    }
  }

  /**
   * Fetch observations (vitals, labs) from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR Observation resources
   */
  async fetchExternalObservations(patientId) {
    try {
      const response = await this.client.get(`/Observation?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching observations for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch observations: ${error.message}`);
    }
  }

  /**
   * Fetch medication information from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR MedicationRequest resources
   */
  async fetchExternalMedications(patientId) {
    try {
      const response = await this.client.get(`/MedicationRequest?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching medications for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch medications: ${error.message}`);
    }
  }

  /**
   * Fetch allergies from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR AllergyIntolerance resources
   */
  async fetchExternalAllergies(patientId) {
    try {
      const response = await this.client.get(`/AllergyIntolerance?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching allergies for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch allergies: ${error.message}`);
    }
  }

  /**
   * Fetch diagnostic reports from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR DiagnosticReport resources
   */
  async fetchExternalDiagnosticReports(patientId) {
    try {
      const response = await this.client.get(`/DiagnosticReport?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching diagnostic reports for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch diagnostic reports: ${error.message}`);
    }
  }

  /**
   * Fetch procedures from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR Procedure resources
   */
  async fetchExternalProcedures(patientId) {
    try {
      const response = await this.client.get(`/Procedure?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching procedures for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch procedures: ${error.message}`);
    }
  }

  /**
   * Fetch immunizations from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR Immunization resources
   */
  async fetchExternalImmunizations(patientId) {
    try {
      const response = await this.client.get(`/Immunization?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching immunizations for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch immunizations: ${error.message}`);
    }
  }

  /**
   * Fetch document references from external EHR
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of FHIR DocumentReference resources
   */
  async fetchExternalDocumentReferences(patientId) {
    try {
      const response = await this.client.get(`/DocumentReference?patient=${patientId}`);
      return response.data.entry?.map(e => e.resource) || [];
    } catch (error) {
      console.error(`Error fetching documents for ${patientId}:`, error.message);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  /**
   * Push resource to external FHIR server
   * Creates or updates based on resource type and identifiers
   * @param {string} resourceType - FHIR resource type (Condition, Observation, etc.)
   * @param {Object} fhirResource - Complete FHIR resource object
   * @returns {Promise<Object>} Response from external server
   */
  async pushToExternal(resourceType, fhirResource) {
    try {
      // If resource has ID, try update (PUT)
      if (fhirResource.id) {
        const response = await this.client.put(
          `/${resourceType}/${fhirResource.id}`,
          fhirResource
        );
        return response.data;
      } else {
        // Create new resource (POST)
        const response = await this.client.post(`/${resourceType}`, fhirResource);
        return response.data;
      }
    } catch (error) {
      console.error(`Error pushing ${resourceType} to external EHR:`, error.message);
      throw new Error(`Failed to push resource to external EHR: ${error.message}`);
    }
  }

  /**
   * Delete resource from external FHIR server
   * @param {string} resourceType - FHIR resource type
   * @param {string} resourceId - Resource ID
   * @returns {Promise<void>}
   */
  async deleteFromExternal(resourceType, resourceId) {
    try {
      await this.client.delete(`/${resourceType}/${resourceId}`);
    } catch (error) {
      console.error(`Error deleting ${resourceType}/${resourceId}:`, error.message);
      throw new Error(`Failed to delete resource from external EHR: ${error.message}`);
    }
  }

  /**
   * Execute custom FHIR query on external server
   * @param {string} query - FHIR query string (e.g., "Patient?name=John")
   * @returns {Promise<Object>} FHIR Bundle response
   */
  async executeQuery(query) {
    try {
      const response = await this.client.get(`/${query}`);
      return response.data;
    } catch (error) {
      console.error(`Error executing query ${query}:`, error.message);
      throw new Error(`Failed to execute FHIR query: ${error.message}`);
    }
  }
}

module.exports = ExternalFhirClient;
