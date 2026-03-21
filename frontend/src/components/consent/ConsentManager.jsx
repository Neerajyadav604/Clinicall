import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { setConsents, setConsentsLoading, setConsentsError, setConsentRequests, removeConsentRequest } from '../../slices/fhirSlice';
import { fetchConsentRequests, respondToConsentRequest } from '../../slices/fhirSlice';
import {
  getConsents,
  grantConsent,
  revokeConsent,
  updateConsent
} from '../../services/fhirApi';
import socket from '../../utils/socket';

const resourceTypesList = [
  'Condition',
  'Observation',
  'AllergyIntolerance',
  'MedicationRequest',
  'DiagnosticReport',
  'Procedure',
  'Immunization',
  'DocumentReference'
];

// Map FHIR resource types to readable labels
const resourceTypeLabels = {
  Condition: 'Diagnoses',
  Observation: 'Vital Signs & Lab Results',
  MedicationRequest: 'Prescriptions',
  DiagnosticReport: 'Lab Reports',
  Procedure: 'Procedures',
  Immunization: 'Immunizations',
  AllergyIntolerance: 'Allergies',
  DocumentReference: 'Documents',
};

const purposeOptions = ['treatment', 'referral', 'research', 'operations'];

const ConsentManager = ({ patientId }) => {
  const dispatch = useDispatch();
  const { consents, consentsLoading, consentsError, consentRequests } = useSelector(state => state.fhir);
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('view'); // 'view' | 'grant' | 'pending' | 'edit'
  const [selectedConsent, setSelectedConsent] = useState(null);
  const consentRequestsRef = useRef(consentRequests);
  const [approvingRequestId, setApprovingRequestId] = useState(null);

  // Grant form state
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorResults, setDoctorResults] = useState([]);
  const [grantForm, setGrantForm] = useState({
    grantedTo_ref: '',
    grantedToType: 'doctor',
    resourceTypes: [],
    purpose: 'treatment',
    period: {
      start: new Date().toISOString().split('T')[0],
      end: ''
    }
  });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    resourceTypes: [],
    period: { start: '', end: '' }
  });
  const [editLoading, setEditLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [consentRequestsLoading, setConsentRequestsLoading] = useState(false);

  useEffect(() => {
    consentRequestsRef.current = consentRequests;
  }, [consentRequests]);

  // Register Socket.IO listeners
  // App.js manages the socket connection globally — we only register/unregister listeners
  useEffect(() => {
    if (!socket.connected) {
      console.log('📍 [ConsentManager] Socket not connected yet, listeners will be registered when connection is ready');
    }

    // Join user room when connected
    const joinUserRoom = () => {
      if (user?._id) {
        console.log('📍 [ConsentManager] Joining user room:', user._id);
        socket.emit('joinRoom', user._id.toString());
      }
    };

    // Handle incoming consent requests
    const handleConsentRequestReceived = (data) => {
      console.log('📬 [ConsentManager] Received consent request:', data);
      const currentRequests = consentRequestsRef.current || [];
      dispatch(setConsentRequests([...currentRequests, {
        id: data.requestId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        resourceTypes: data.resourceTypes,
        message: data.message,
        createdAt: data.createdAt,
        expiresAt: new Date(data.createdAt).getTime() + 48 * 60 * 60 * 1000,
        status: 'pending'
      }]));
    };

    // Register listeners — never call connect here
    socket.on('connect', joinUserRoom);
    socket.on('consentRequestReceived', handleConsentRequestReceived);

    // Cleanup — only remove listeners, never disconnect
    return () => {
      console.log('🧹 [ConsentManager] Removing socket listeners');
      socket.off('connect', joinUserRoom);
      socket.off('consentRequestReceived', handleConsentRequestReceived);
    };
  }, [dispatch, user?._id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Load consents and consent requests on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!patientId) return;
    loadConsents();
  }, [patientId]);

  // Fetch consent requests when pending tab is active
  useEffect(() => {
    if (activeTab === 'pending' && patientId) {
      dispatch(fetchConsentRequests(patientId));
    }
  }, [activeTab, patientId, dispatch]);

  const loadConsents = async () => {
    try {
      dispatch(setConsentsLoading(true));
      const response = await getConsents(patientId);
      const consentsList =
        response?.data ||
        response?.entry?.map(e => e.resource) ||
        [];
      dispatch(setConsents(consentsList));
    } catch (error) {
      dispatch(setConsentsError(error.message));
    } finally {
      dispatch(setConsentsLoading(false));
    }
  };

  // Search doctors using real API
  const handleSearchDoctors = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setDoctorResults([]);
      return;
    }
    try {
      const { searchDoctors } = await import('../../services/operations/SearchApi');
      const results = await searchDoctors(query);
      // Extract doctor objects from search results
      const doctors = (results?.data || []).map(doc => ({
        id: doc._id || doc.id,
        name: doc.fullName || doc.name,
        specialization: doc.specialization
      }));
      setDoctorResults(doctors);
    } catch (error) {
      console.error('Error searching doctors:', error);
      setDoctorResults([]);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setGrantForm(prev => ({
      ...prev,
      grantedTo_ref: doctor.id
    }));
    setSearchQuery(doctor.name);
    setDoctorResults([]);
  };

  const toggleResourceType = (resourceType) => {
    setGrantForm(prev => ({
      ...prev,
      resourceTypes: prev.resourceTypes.includes(resourceType)
        ? prev.resourceTypes.filter(r => r !== resourceType)
        : [...prev.resourceTypes, resourceType]
    }));
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!grantForm.grantedTo_ref || grantForm.resourceTypes.length === 0) {
      setGrantError('Please select doctor and resource types');
      return;
    }

    try {
      setGrantLoading(true);
      setGrantError('');
      await grantConsent(grantForm);
      setGrantForm({
        grantedTo_ref: '',
        grantedToType: 'doctor',
        resourceTypes: [],
        purpose: 'treatment',
        period: {
          start: new Date().toISOString().split('T')[0],
          end: ''
        }
      });
      setSearchQuery('');
      setActiveTab('view');
      await loadConsents();
    } catch (error) {
      setGrantError(error.message);
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    if (!window.confirm('Are you sure you want to revoke this consent?')) return;
    try {
      await revokeConsent(consentId);
      await loadConsents();
    } catch (error) {
      alert('Error revoking consent: ' + error.message);
    }
  };

  const handleEditConsent = (consent) => {
    setSelectedConsent(consent);
    setEditForm({
      resourceTypes: consent.resourceType || [],
      period: {
        start: consent.period?.start ? consent.period.start.split('T')[0] : '',
        end: consent.period?.end ? consent.period.end.split('T')[0] : ''
      }
    });
    setActiveTab('edit');
  };

  const handleUpdateConsent = async (e) => {
    e.preventDefault();
    if (!selectedConsent) return;

    try {
      setEditLoading(true);
      await updateConsent(selectedConsent.id, {
        resourceTypes: editForm.resourceTypes,
        period: {
          start: new Date(editForm.period.start),
          end: editForm.period.end ? new Date(editForm.period.end) : null
        }
      });
      setActiveTab('view');
      await loadConsents();
    } catch (error) {
      alert('Error updating consent: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const isConsentExpired = (consent) => {
    if (!consent.period?.end) return false;
    return new Date(consent.period.end) < new Date();
  };

  const handleApproveConsentRequest = async (requestId, doctorName) => {
    try {
      setApprovingRequestId(requestId);
      await dispatch(respondToConsentRequest(requestId, 'approve'));
      // Refresh Active Consents tab
      await loadConsents();
      // Show toast
      alert(`✅ Consent granted — Dr. ${doctorName} has been notified by email and in-app`);
      // Remove from list
      dispatch(removeConsentRequest(requestId));
    } catch (error) {
      alert('Error approving consent: ' + error.message);
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleDeclineConsentRequest = async (requestId) => {
    try {
      await dispatch(respondToConsentRequest(requestId, 'reject'));
      alert('Request declined');
      // Remove from list
      dispatch(removeConsentRequest(requestId));
    } catch (error) {
      alert('Error declining consent: ' + error.message);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTimeUntilExpiry = (expiresAt) => {
    const now = new Date();
    const diff = new Date(expiresAt) - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (diff < 0) return 'Expired';
    if (hours < 1) return `${minutes}m left`;
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  return (
    <div 
      className="rounded-[20px] border bg-white p-6 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)]"
      style={{
        borderColor: "#d9e2ec",
        backgroundColor: "#ffffff"
      }}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Privacy & Consent</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'view'
              ? 'text-cyan-700 border-b-2 border-cyan-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Consents ({consents.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition relative ${
            activeTab === 'pending'
              ? 'text-cyan-700 border-b-2 border-cyan-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Requests
          {consentRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-cyan-700 rounded-full">
              {consentRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('grant')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'grant'
              ? 'text-cyan-700 border-b-2 border-cyan-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Grant New
        </button>
      </div>

      {/* View Consents Tab */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {consentsLoading && <p className="text-slate-500">Loading consents...</p>}
          {consentsError && <p className="text-rose-500 text-sm">{consentsError}</p>}
          
          {consents.length === 0 && !consentsLoading && (
            <p className="text-slate-500 text-sm">No active consents. Grant access to doctors.</p>
          )}

          {consents.map(consent => {
            const expired = isConsentExpired(consent);
            return (
              <div
                key={consent.id}
                className={`p-4 rounded-xl border ${
                  expired
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-cyan-200 bg-cyan-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-slate-900">
                        {consent.grantedTo?.display || consent.grantedTo_ref}
                      </h4>
                      {expired ? (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-cyan-600" />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Purpose:</span> {consent.provision?.[0]?.purpose?.[0]?.code || 'General'}
                      </p>
                      <p>
                        <span className="font-medium">Resources:</span>{' '}
                        {consent.resourceType?.join(', ') || 'All'}
                      </p>
                      {consent.period?.end && (
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {new Date(consent.period.end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditConsent(consent)}
                      className="px-3 py-1 text-sm font-medium text-cyan-700 hover:bg-cyan-100 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRevokeConsent(consent.id)}
                      className="px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-100 rounded-lg transition"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {consentRequestsLoading && <p className="text-slate-500">Loading pending requests...</p>}
          
          {consentRequests.length === 0 && !consentRequestsLoading && (
            <p className="text-slate-500 text-sm">No pending consent requests</p>
          )}

          {consentRequests.map(request => {
            const readableResourceTypes = request.resourceTypes
              .map(type => resourceTypeLabels[type] || type)
              .filter(Boolean);
            const timeUntilExpiry = getTimeUntilExpiry(request.expiresAt);
            const isExpiring = request.expiresAt && new Date(request.expiresAt) - new Date() < 24 * 60 * 60 * 1000;

            return (
              <div
                key={request.id}
                className={`p-4 rounded-xl border ${
                  isExpiring
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">
                      Dr. {request.doctorName}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Requested {formatTimeAgo(request.createdAt)}
                    </p>
                  </div>
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isExpiring
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-blue-200 text-blue-800'
                  }`}>
                    {timeUntilExpiry}
                  </div>
                </div>

                {/* Requested Resources */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Access requested to:</p>
                  <div className="flex flex-wrap gap-2">
                    {readableResourceTypes.map(label => (
                      <span
                        key={label}
                        className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Optional Message */}
                {request.message && (
                  <div className="mb-3 p-2 bg-slate-100 border-l-3 border-slate-400 rounded">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Message from Dr. {request.doctorName}:</p>
                    <p className="text-sm text-slate-700 italic">{request.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleApproveConsentRequest(request.id, request.doctorName)}
                    disabled={approvingRequestId === request.id}
                    className="flex-1 px-3 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition"
                  >
                    {approvingRequestId === request.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDeclineConsentRequest(request.id)}
                    className="flex-1 px-3 py-2 border border-red-300 text-red-700 font-medium text-sm rounded-lg hover:bg-red-50 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grant Consent Tab */}
      {activeTab === 'grant' && (
        <form onSubmit={handleGrantConsent} className="space-y-4">
          {grantError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
              {grantError}
            </div>
          )}

          {/* Doctor Search */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Doctor
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchDoctors(e.target.value)}
                placeholder="Search doctor by name..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
              />
            </div>
            {doctorResults.length > 0 && (
              <ul className="mt-2 border border-slate-200 rounded-xl divide-y max-h-40 overflow-y-auto bg-white">
                {doctorResults.map(doctor => (
                  <li key={doctor.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDoctor(doctor)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 transition"
                    >
                      <p className="font-medium text-slate-900">{doctor.name}</p>
                      <p className="text-xs text-slate-500">{doctor.specialization}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Purpose
            </label>
            <select
              value={grantForm.purpose}
              onChange={(e) => setGrantForm(prev => ({ ...prev, purpose: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
            >
              {purposeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Types */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Resources Doctor Can Access
            </label>
            <div className="grid grid-cols-2 gap-2">
              {resourceTypesList.map(resourceType => (
                <label key={resourceType} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantForm.resourceTypes.includes(resourceType)}
                    onChange={() => toggleResourceType(resourceType)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                  />
                  <span className="text-sm text-slate-700">{resourceType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={grantForm.period.start}
                onChange={(e) =>
                  setGrantForm(prev => ({
                    ...prev,
                    period: { ...prev.period, start: e.target.value }
                  }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={grantForm.period.end}
                onChange={(e) =>
                  setGrantForm(prev => ({
                    ...prev,
                    period: { ...prev.period, end: e.target.value }
                  }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={grantLoading}
              className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 disabled:bg-slate-400 transition"
            >
              {grantLoading ? 'Granting...' : 'Grant Consent'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit Consent Tab */}
      {activeTab === 'edit' && selectedConsent && (
        <form onSubmit={handleUpdateConsent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Update Resources
            </label>
            <div className="grid grid-cols-2 gap-2">
              {resourceTypesList.map(resourceType => (
                <label key={resourceType} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.resourceTypes.includes(resourceType)}
                    onChange={() => {
                      setEditForm(prev => ({
                        ...prev,
                        resourceTypes: prev.resourceTypes.includes(resourceType)
                          ? prev.resourceTypes.filter(r => r !== resourceType)
                          : [...prev.resourceTypes, resourceType]
                      }));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                  />
                  <span className="text-sm text-slate-700">{resourceType}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={editForm.period.start}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    period: { ...prev.period, start: e.target.value }
                  }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={editForm.period.end}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    period: { ...prev.period, end: e.target.value }
                  }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={editLoading}
              className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 disabled:bg-slate-400 transition"
            >
              {editLoading ? 'Updating...' : 'Update Consent'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConsentManager;
