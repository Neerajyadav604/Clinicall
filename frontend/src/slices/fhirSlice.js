import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Patient data (FHIR Patient resource)
  patient: null,
  
  // Clinical data arrays
  conditions: [],
  observations: [],
  allergies: [],
  medications: [],
  diagnosticReports: [],
  procedures: [],
  immunizations: [],
  
  // Phase 3 data
  consents: [],
  consentRequests: [],
  auditEvents: [],
  documents: [],
  
  // Export job tracking
  exportJob: {
    jobId: null,
    status: null, // null|pending|in-progress|completed|failed
    outputUrls: {},
    error: null
  },
  
  // Loading states
  loading: false,
  conditionsLoading: false,
  observationsLoading: false,
  allergiesLoading: false,
  medicationsLoading: false,
  diagnosticReportsLoading: false,
  proceduresLoading: false,
  immunizationsLoading: false,
  consentsLoading: false,
  consentRequestsLoading: false,
  auditEventsLoading: false,
  documentsLoading: false,
  exportLoading: false,
  
  // Error states
  error: null,
  fhirError: null, // Phase 5: Global FHIR API error for toast notifications
  conditionsError: null,
  observationsError: null,
  allergiesError: null,
  medicationsError: null,
  diagnosticReportsError: null,
  proceduresError: null,
  immunizationsError: null,
  consentsError: null,
  consentRequestsError: null,
  auditEventsError: null,
  documentsError: null,
  
  // Last fetch timestamps for caching
  lastFetchTime: {
    patient: null,
    conditions: null,
    observations: null,
    allergies: null,
    medications: null,
    diagnosticReports: null,
    procedures: null,
    immunizations: null,
    consents: null,
    consentRequests: null,
    auditEvents: null,
    documents: null
  },
  
  // OAuth2/SMART on FHIR Connection State
  fhirConnection: {
    connected: false,
    externalServer: null,
    tokenExpiry: null,
    scopes: [],
    tokenExpired: false,
    connectionError: null
  },
  
  // Bidirectional Sync State
  syncStatus: {
    inProgress: false,
    lastSynced: null,
    progress: 0,
    status: null, // pending|syncing|completed|failed
    syncedCount: 0,
    conflictCount: 0,
    errorCount: 0,
    conflicts: [],
    details: {},
    error: null
  },
  
  // OAuth/sync loading states
  fhirConnectionLoading: false,
  syncLoading: false
};

const fhirSlice = createSlice({
  name: "fhir",
  initialState,
  reducers: {
    // Patient actions
    setPatient: (state, action) => {
      state.patient = action.payload;
      state.lastFetchTime.patient = Date.now();
    },
    setPatientLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPatientError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // FHIR Error (Phase 5) - for global error toast
    setFhirError: (state, action) => {
      state.fhirError = action.payload;
    },
    clearFhirError: (state) => {
      state.fhirError = null;
    },

    // Conditions actions
    setConditions: (state, action) => {
      state.conditions = action.payload;
      state.lastFetchTime.conditions = Date.now();
      state.conditionsError = null;
    },
    setConditionsLoading: (state, action) => {
      state.conditionsLoading = action.payload;
    },
    setConditionsError: (state, action) => {
      state.conditionsError = action.payload;
      state.conditionsLoading = false;
    },
    clearConditions: (state) => {
      state.conditions = [];
      state.lastFetchTime.conditions = null;
    },

    // Observations actions
    setObservations: (state, action) => {
      state.observations = action.payload;
      state.lastFetchTime.observations = Date.now();
      state.observationsError = null;
    },
    setObservationsLoading: (state, action) => {
      state.observationsLoading = action.payload;
    },
    setObservationsError: (state, action) => {
      state.observationsError = action.payload;
      state.observationsLoading = false;
    },
    clearObservations: (state) => {
      state.observations = [];
      state.lastFetchTime.observations = null;
    },

    // Allergies actions
    setAllergies: (state, action) => {
      state.allergies = action.payload;
      state.lastFetchTime.allergies = Date.now();
      state.allergiesError = null;
    },
    setAllergiesLoading: (state, action) => {
      state.allergiesLoading = action.payload;
    },
    setAllergiesError: (state, action) => {
      state.allergiesError = action.payload;
      state.allergiesLoading = false;
    },
    clearAllergies: (state) => {
      state.allergies = [];
      state.lastFetchTime.allergies = null;
    },

    // Medications actions
    setMedications: (state, action) => {
      state.medications = action.payload;
      state.lastFetchTime.medications = Date.now();
      state.medicationsError = null;
    },
    setMedicationsLoading: (state, action) => {
      state.medicationsLoading = action.payload;
    },
    setMedicationsError: (state, action) => {
      state.medicationsError = action.payload;
      state.medicationsLoading = false;
    },
    clearMedications: (state) => {
      state.medications = [];
      state.lastFetchTime.medications = null;
    },

    // Diagnostic Reports actions
    setDiagnosticReports: (state, action) => {
      state.diagnosticReports = action.payload;
      state.lastFetchTime.diagnosticReports = Date.now();
      state.diagnosticReportsError = null;
    },
    setDiagnosticReportsLoading: (state, action) => {
      state.diagnosticReportsLoading = action.payload;
    },
    setDiagnosticReportsError: (state, action) => {
      state.diagnosticReportsError = action.payload;
      state.diagnosticReportsLoading = false;
    },
    clearDiagnosticReports: (state) => {
      state.diagnosticReports = [];
      state.lastFetchTime.diagnosticReports = null;
    },

    // Procedures actions
    setProcedures: (state, action) => {
      state.procedures = action.payload;
      state.lastFetchTime.procedures = Date.now();
      state.proceduresError = null;
    },
    setProceduresLoading: (state, action) => {
      state.proceduresLoading = action.payload;
    },
    setProceduresError: (state, action) => {
      state.proceduresError = action.payload;
      state.proceduresLoading = false;
    },
    clearProcedures: (state) => {
      state.procedures = [];
      state.lastFetchTime.procedures = null;
    },

    // Immunizations actions
    setImmunizations: (state, action) => {
      state.immunizations = action.payload;
      state.lastFetchTime.immunizations = Date.now();
      state.immunizationsError = null;
    },
    setImmunizationsLoading: (state, action) => {
      state.immunizationsLoading = action.payload;
    },
    setImmunizationsError: (state, action) => {
      state.immunizationsError = action.payload;
      state.immunizationsLoading = false;
    },
    clearImmunizations: (state) => {
      state.immunizations = [];
      state.lastFetchTime.immunizations = null;
    },

    // Consents actions (Phase 3)
    setConsents: (state, action) => {
      state.consents = action.payload;
      state.lastFetchTime.consents = Date.now();
      state.consentsError = null;
    },
    setConsentsLoading: (state, action) => {
      state.consentsLoading = action.payload;
    },
    setConsentsError: (state, action) => {
      state.consentsError = action.payload;
      state.consentsLoading = false;
    },
    clearConsents: (state) => {
      state.consents = [];
      state.lastFetchTime.consents = null;
    },

    // Consent Requests actions
    setConsentRequests: (state, action) => {
      state.consentRequests = action.payload;
      state.lastFetchTime.consentRequests = Date.now();
      state.consentRequestsError = null;
    },
    setConsentRequestsLoading: (state, action) => {
      state.consentRequestsLoading = action.payload;
    },
    setConsentRequestsError: (state, action) => {
      state.consentRequestsError = action.payload;
      state.consentRequestsLoading = false;
    },
    clearConsentRequests: (state) => {
      state.consentRequests = [];
      state.lastFetchTime.consentRequests = null;
    },
    removeConsentRequest: (state, action) => {
      state.consentRequests = state.consentRequests.filter(
        req => req.id !== action.payload
      );
    },

    // Audit Events actions (Phase 3)
    setAuditEvents: (state, action) => {
      state.auditEvents = action.payload;
      state.lastFetchTime.auditEvents = Date.now();
      state.auditEventsError = null;
    },
    setAuditEventsLoading: (state, action) => {
      state.auditEventsLoading = action.payload;
    },
    setAuditEventsError: (state, action) => {
      state.auditEventsError = action.payload;
      state.auditEventsLoading = false;
    },
    clearAuditEvents: (state) => {
      state.auditEvents = [];
      state.lastFetchTime.auditEvents = null;
    },

    // Documents actions (Phase 3)
    setDocuments: (state, action) => {
      state.documents = action.payload;
      state.lastFetchTime.documents = Date.now();
      state.documentsError = null;
    },
    setDocumentsLoading: (state, action) => {
      state.documentsLoading = action.payload;
    },
    setDocumentsError: (state, action) => {
      state.documentsError = action.payload;
      state.documentsLoading = false;
    },
    clearDocuments: (state) => {
      state.documents = [];
      state.lastFetchTime.documents = null;
    },

    // Export Job actions (Phase 3)
    setExportJobId: (state, action) => {
      state.exportJob.jobId = action.payload;
      state.exportJob.status = 'pending';
      state.exportJob.outputUrls = {};
      state.exportJob.error = null;
    },
    setExportLoading: (state, action) => {
      state.exportLoading = action.payload;
    },
    updateExportJob: (state, action) => {
      state.exportJob = {
        ...state.exportJob,
        ...action.payload
      };
    },
    clearExportJob: (state) => {
      state.exportJob = {
        jobId: null,
        status: null,
        outputUrls: {},
        error: null
      };
    },

    // OAuth/FHIR Connection actions
    setFhirConnection: (state, action) => {
      state.fhirConnection = { ...state.fhirConnection, ...action.payload };
      state.fhirConnectionLoading = false;
    },
    setFhirConnectionLoading: (state, action) => {
      state.fhirConnectionLoading = action.payload;
    },
    setFhirConnectionError: (state, action) => {
      state.fhirConnection.connectionError = action.payload;
      state.fhirConnectionLoading = false;
    },
    clearFhirConnection: (state) => {
      state.fhirConnection = {
        connected: false,
        externalServer: null,
        tokenExpiry: null,
        scopes: [],
        tokenExpired: false,
        connectionError: null
      };
    },

    // Sync Status actions
    setSyncStatus: (state, action) => {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
    setSyncLoading: (state, action) => {
      state.syncLoading = action.payload;
      if (action.payload) {
        state.syncStatus.inProgress = true;
      }
    },
    setSyncError: (state, action) => {
      state.syncStatus.error = action.payload;
      state.syncStatus.inProgress = false;
      state.syncLoading = false;
    },
    clearSyncStatus: (state) => {
      state.syncStatus = {
        inProgress: false,
        lastSynced: null,
        progress: 0,
        status: null,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 0,
        conflicts: [],
        details: {},
        error: null
      };
    },

    // Clear all FHIR data
    clearAllFhirData: (state) => {
      state.patient = null;
      state.conditions = [];
      state.observations = [];
      state.allergies = [];
      state.medications = [];
      state.diagnosticReports = [];
      state.procedures = [];
      state.immunizations = [];
      state.consents = [];
      state.auditEvents = [];
      state.documents = [];
      state.error = null;
      state.conditionsError = null;
      state.observationsError = null;
      state.allergiesError = null;
      state.medicationsError = null;
      state.diagnosticReportsError = null;
      state.proceduresError = null;
      state.immunizationsError = null;
      state.consentsError = null;
      state.auditEventsError = null;
      state.documentsError = null;
      state.exportJob = {
        jobId: null,
        status: null,
        outputUrls: {},
        error: null
      };
      state.lastFetchTime = {
        patient: null,
        conditions: null,
        observations: null,
        allergies: null,
        medications: null,
        diagnosticReports: null,
        procedures: null,
        immunizations: null,
        consents: null,
        auditEvents: null,
        documents: null
      };
      state.fhirConnection = {
        connected: false,
        externalServer: null,
        tokenExpiry: null,
        scopes: [],
        tokenExpired: false,
        connectionError: null
      };
      state.syncStatus = {
        inProgress: false,
        lastSynced: null,
        progress: 0,
        status: null,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 0,
        conflicts: [],
        details: {},
        error: null
      };
    }
  }
});

export const {
  setPatient,
  setPatientLoading,
  setPatientError,
  setFhirError,
  clearFhirError,
  setConditions,
  setConditionsLoading,
  setConditionsError,
  clearConditions,
  setObservations,
  setObservationsLoading,
  setObservationsError,
  clearObservations,
  setAllergies,
  setAllergiesLoading,
  setAllergiesError,
  clearAllergies,
  setMedications,
  setMedicationsLoading,
  setMedicationsError,
  clearMedications,
  setDiagnosticReports,
  setDiagnosticReportsLoading,
  setDiagnosticReportsError,
  clearDiagnosticReports,
  setProcedures,
  setProceduresLoading,
  setProceduresError,
  clearProcedures,
  setImmunizations,
  setImmunizationsLoading,
  setImmunizationsError,
  clearImmunizations,
  setConsents,
  setConsentsLoading,
  setConsentsError,
  clearConsents,
  setConsentRequests,
  setConsentRequestsLoading,
  setConsentRequestsError,
  clearConsentRequests,
  removeConsentRequest,
  setAuditEvents,
  setAuditEventsLoading,
  setAuditEventsError,
  clearAuditEvents,
  setDocuments,
  setDocumentsLoading,
  setDocumentsError,
  clearDocuments,
  setExportJobId,
  setExportLoading,
  updateExportJob,
  clearExportJob,
  setFhirConnection,
  setFhirConnectionLoading,
  setFhirConnectionError,
  clearFhirConnection,
  setSyncStatus,
  setSyncLoading,
  setSyncError,
  clearSyncStatus,
  clearAllFhirData
} = fhirSlice.actions;

// Polling thunk for export job status
export const pollExportJobThunk = (jobId, dispatch) => {
  let pollInterval = null;
  
  const startPolling = async () => {
    const { pollExportStatus } = await import('../services/fhirApi.js');
    
    pollInterval = setInterval(async () => {
      try {
        const result = await pollExportStatus(jobId);
        
        if (result.status === 'in-progress') {
          dispatch(updateExportJob({
            status: 'in-progress'
          }));
        } else if (result.status === 'completed') {
          dispatch(updateExportJob({
            status: 'completed',
            outputUrls: result.outputUrls
          }));
          // Stop polling
          if (pollInterval) clearInterval(pollInterval);
        } else if (result.status === 'failed') {
          dispatch(updateExportJob({
            status: 'failed',
            error: result.error
          }));
          // Stop polling
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        dispatch(updateExportJob({
          status: 'failed',
          error: error.message
        }));
        // Stop polling
        if (pollInterval) clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds
  };
  
  startPolling();
  
  // Return a cleanup function
  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
};

// Thunk for checking FHIR OAuth connection status
export const checkConnectionStatusThunk = () => async (dispatch) => {
  try {
    dispatch(setFhirConnectionLoading(true));
    const { fhirApi } = await import('../services/fhirApi');
    const status = await fhirApi.getFhirConnectionStatus();
    
    dispatch(setFhirConnection({
      connected: status.connected,
      externalServer: status.externalServer,
      tokenExpiry: status.expiresAt,
      scopes: status.scopes || [],
      tokenExpired: status.tokenExpired,
    }));
  } catch (error) {
    dispatch(setFhirConnectionError(error.message));
  }
};

// Thunk for initiating FHIR OAuth connection
export const connectFhirThunk = () => async (dispatch) => {
  try {
    dispatch(setFhirConnectionLoading(true));
    const { fhirApi } = await import('../services/fhirApi');
    await fhirApi.initiateSmartLaunch();
  } catch (error) {
    dispatch(setFhirConnectionError(error.message));
  }
};

// Thunk for data synchronization (pull/push/both)
export const syncPatientThunk = ({ patientId, direction = 'both' }) => async (dispatch) => {
  try {
    dispatch(setSyncLoading(true));
    dispatch(setSyncStatus({
      inProgress: true,
      status: 'pending',
      progress: 0,
    }));

    const { fhirApi } = await import('../services/fhirApi');
    const result = await fhirApi.triggerSync(patientId, direction);

    dispatch(setSyncStatus({
      status: 'syncing',
      progress: 50,
      details: {
        direction,
        resourceTypes: result.resourceTypes || [],
      },
    }));

    // Poll for sync completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second polling

    while (!completed && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        const syncStatus = await fhirApi.getSyncStatus(patientId);
        
        if (syncStatus.status === 'completed') {
          dispatch(setSyncStatus({
            inProgress: false,
            status: 'completed',
            progress: 100,
            lastSynced: new Date().toISOString(),
            syncedCount: syncStatus.syncedCount || 0,
            conflictCount: syncStatus.conflicts?.length || 0,
            conflicts: syncStatus.conflicts || [],
          }));
          completed = true;
        } else if (syncStatus.status === 'failed') {
          dispatch(setSyncError(syncStatus.error || 'Sync failed'));
          completed = true;
        } else {
          dispatch(setSyncStatus({
            progress: Math.min(50 + (attempts / maxAttempts) * 50, 95),
            status: 'syncing',
          }));
        }
      } catch (statusError) {
        console.warn('Error checking sync status:', statusError);
      }
    }

    if (!completed) {
      dispatch(setSyncError('Sync timeout'));
    }

    dispatch(setSyncLoading(false));
  } catch (error) {
    dispatch(setSyncError(error.message || 'Sync failed'));
    dispatch(setSyncLoading(false));
  }
};

// Thunk for fetching sync status
export const fetchSyncStatusThunk = ({ patientId }) => async (dispatch) => {
  try {
    const { fhirApi } = await import('../services/fhirApi');
    const status = await fhirApi.getSyncStatus(patientId);

    dispatch(setSyncStatus({
      status: status.status,
      lastSynced: status.lastSynced,
      syncedCount: status.syncedCount,
      conflictCount: status.conflicts?.length || 0,
      conflicts: status.conflicts || [],
      details: status.details || {},
    }));
  } catch (error) {
    console.error('Failed to fetch sync status:', error);
  }
};

// Thunk for getting sync differences
export const getSyncDiffThunk = ({ patientId }) => async (dispatch) => {
  try {
    const { fhirApi } = await import('../services/fhirApi');
    const diff = await fhirApi.getSyncDiff(patientId);
    
    dispatch(setSyncStatus({
      conflicts: diff.conflicts || [],
    }));

    return diff;
  } catch (error) {
    dispatch(setSyncError(error.message));
    throw error;
  }
};

// Thunk for fetching pending consent requests
export const fetchConsentRequests = (patientId) => async (dispatch) => {
  try {
    dispatch(setConsentRequestsLoading(true));
    const { getPendingConsentRequests } = await import('../services/fhirApi');
    const response = await getPendingConsentRequests(patientId);
    
    // Handle server response structure: { success: true, data: [...] }
    const requestsData = response?.data || [];
    
    const requests = requestsData.map(request => ({
      id: request._id || request.id,
      doctorId: request.doctor_ref?._id || request.doctor_ref,
      doctorName: request.doctor_ref?.fullName || request.doctorName || request.doctor,
      resourceTypes: request.resourceTypes || [],
      message: request.message,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
      status: request.status
    }));
    
    console.log('✅ [Consent] Fetched pending requests:', requests);
    dispatch(setConsentRequests(requests));
  } catch (error) {
    console.error('❌ Error fetching consent requests:', error);
    dispatch(setConsentRequestsError(error.message));
  } finally {
    dispatch(setConsentRequestsLoading(false));
  }
};

// Thunk for responding to a consent request
export const respondToConsentRequest = (requestId, action) => async (dispatch) => {
  try {
    dispatch(setConsentRequestsLoading(true));
    const { respondToConsentRequest: respondAPI } = await import('../services/fhirApi');
    const response = await respondAPI(requestId, action);
    
    if (action === 'approve') {
      // Remove the approved request from the list
      dispatch(removeConsentRequest(requestId));
    } else if (action === 'reject') {
      // Remove the rejected request from the list
      dispatch(removeConsentRequest(requestId));
    }
    
    dispatch(setConsentRequestsLoading(false));
    return response;
  } catch (error) {
    console.error('Error responding to consent request:', error);
    dispatch(setConsentRequestsError(error.message));
    dispatch(setConsentRequestsLoading(false));
    throw error;
  }
};

export default fhirSlice.reducer;
