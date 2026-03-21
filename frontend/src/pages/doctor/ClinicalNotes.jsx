import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AlertCircle, FileText, Loader, Check, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { setConsents, setConsentsLoading } from '../../slices/fhirSlice';
import { getConsents, createCondition, createObservation, createMedicationRequest, createDiagnosticReport, requestConsent } from '../../services/fhirApi';
import { axiosInstance } from '../../services/ApiConnector';
import socket from '../../utils/socket';

const ConsentBanner = ({ consents, patientName, onRequestConsent }) => {
  const hasConsent = consents && consents.length > 0;

  return (
    <div className={`p-4 rounded-xl mb-6 flex items-start gap-4 border ${
      hasConsent
        ? 'border-green-200 bg-green-50'
        : 'border-amber-200 bg-amber-50'
    }`}>
      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
        hasConsent ? 'text-green-700' : 'text-amber-700'
      }`} />
      
      <div className="flex-1">
        <h3 className={`font-semibold ${hasConsent ? 'text-green-900' : 'text-amber-900'}`}>
          Patient Consent Status
        </h3>
        <p className={`text-sm mt-1 ${hasConsent ? 'text-green-800' : 'text-amber-800'}`}>
          {hasConsent
            ? `You have consent to access ${consents.length} resource(s) from ${patientName}`
            : `You don't have consent to access this patient's data yet.`
          }
        </p>
      </div>

      {!hasConsent && (
        <button
          onClick={onRequestConsent}
          className="flex-shrink-0 px-4 py-2 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition flex items-center gap-2 whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          Request Consent
        </button>
      )}
    </div>
  );
};

// ── Clinical Form Components ──

const ConditionForm = ({ patientId, appointmentId, onSuccess }) => {
  const [form, setForm] = useState({
    code: '',
    severity: 'mild',
    status: 'active',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  /**
   * Sanitize medical code: remove invalid characters, replace ( with )
   * Input: "J45{Asthma)" → Output: "J45.9" or "J45"
   * Valid format: alphanumeric + dots/hyphens only (e.g. J45.9, A00, E11-22)
   */
  const sanitizeCode = (codeInput) => {
    if (!codeInput) return '';
    
    // Remove invalid characters: { } and replace mismatched ( with nothing
    let sanitized = codeInput
      .toUpperCase()
      .replace(/[{}]/g, '')           // Remove curly braces
      .replace(/\([^)]*\)/g, '')      // Remove text in parentheses
      .replace(/\s+/g, '')            // Remove spaces
      .replace(/[^A-Z0-9.-]/g, ''); // Keep only alphanumeric, dots, hyphens
    
    // Ensure it's not empty and valid
    return sanitized.substring(0, 20); // Max 20 chars for ICD codes
  };

  /**
   * Client-side validation for Condition form
   * Returns array of errors; empty array if valid
   */
  const validateConditionForm = () => {
    const errors = [];
    
    // Must have code
    if (!form.code || !form.code.trim()) {
      errors.push('Condition code is required');
      return errors;
    }

    // Validate code format: alphanumeric + dots/hyphens only
    const codeRegex = /^[A-Z0-9.-]{1,20}$/i;
    if (!codeRegex.test(form.code.trim())) {
      errors.push(
        `Code contains invalid characters. Only alphanumeric, dots (.), and hyphens (-) allowed. ` +
        `Example: J45.9, E11-22`
      );
    }

    // Validate code doesn't start with invalid chars
    if (form.code.trim().startsWith('-') || form.code.trim().startsWith('.')) {
      errors.push('Code cannot start with a dot or hyphen');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const errors = validateConditionForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    setLoading(true);
    try {
      // Sanitize code input
      const sanitizedCode = sanitizeCode(form.code);

      // Build normalized payload matching server expectations with FHIR-compliant format
      const payload = {
        user_ref: `Patient/${patientId}`,  // ✅ FHIR format: ResourceType/id
        code: sanitizedCode,                // ✅ Sanitized: remove invalid chars
        display: sanitizedCode,             // Display name (same as code for simplicity)
        severity: form.severity || undefined,
        clinicalStatus: (form.status || '').toLowerCase(),
        notes: form.notes || undefined
      };

      console.log('[ClinicalNotes] Submitting Condition payload:', JSON.stringify(payload, null, 2));
      await createCondition(payload, appointmentId);

      toast.success('Condition recorded successfully');
      setForm({ code: '', severity: 'mild', status: 'active', notes: '' });
      onSuccess && onSuccess();
    } catch (error) {
      // Handle different error types with user-friendly messages
      const errorMessages = [];

      // Extract validation errors from OperationOutcome (422 response)
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        errorMessages.push(...error.validationErrors);
      } 
      // Extract client-side validation errors
      else if (error.clientValidationErrors && Array.isArray(error.clientValidationErrors)) {
        errorMessages.push(...error.clientValidationErrors);
      }
      // Fallback to generic error message
      else {
        errorMessages.push(error.message || 'Error creating condition');
      }

      setValidationErrors(errorMessages);
      errorMessages.forEach(msg => {
        console.error('[ClinicalNotes] Error:', msg);
      });

      console.error('Condition creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Record New Condition</h3>
      
      {/* Inline validation error display */}
      {validationErrors.length > 0 && (
        <div className="error-box mb-4" role="alert" aria-live="polite">
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ICD-10 / SNOMED Code
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => {
              setForm({...form, code: e.target.value});
              setValidationErrors([]); // Clear errors as user types
            }}
            placeholder="e.g., J45.9 (Asthma), E11.9 (Diabetes)"
            className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 transition ${
              validationErrors.length > 0
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 focus:border-cyan-700 focus:ring-cyan-700/20'
            }`}
          />
          <p className="text-xs text-slate-500 mt-1">
            Format: Alphanumeric + dots/hyphens only. Example: J45.9, A00, E11-22
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({...form, severity: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({...form, status: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="remission">Remission</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            placeholder="Additional clinical notes..."
            rows="3"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70 transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Record Condition'}
        </button>
      </div>
    </motion.form>
  );
};

const ObservationForm = ({ patientId, appointmentId, onSuccess }) => {
  const [form, setForm] = useState({
    code: '',
    value: '',
    unit: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value.trim()) {
      setErrors(['Please enter LOINC code and value']);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      const codeValue =
        typeof form.code === 'string'
          ? form.code.trim().split(' ')[0]
          : form.code?.code || form.code?.coding || '';
      const numericValue = Number(form.value);

      if (!codeValue) {
        setErrors(['Please enter a valid LOINC code']);
        return;
      }
      if (Number.isNaN(numericValue)) {
        setErrors(['Please enter a numeric value']);
        return;
      }

      // Build normalized payload matching server expectations
      const payload = {
        user_ref: `Patient/${patientId}`,                   // ✅ FHIR reference format: ResourceType/id
        code: codeValue,                                    // ✅ Code as simple string
        display: form.code?.display || codeValue,
        value: numericValue,                                // ✅ Value as simple number
        unit: form.unit || undefined,                       // Optional unit
        effectiveDate: form.date,                           // ✅ ISO 8601 date format (YYYY-MM-DD)
        category: 'vital-signs'                             // Default category
      };

      console.log('[ClinicalNotes] Submitting Observation payload:', JSON.stringify(payload, null, 2));
      await createObservation(payload, appointmentId);

      toast.success('Observation recorded successfully');
      setForm({ code: '', value: '', unit: '', date: new Date().toISOString().split('T')[0] });
      onSuccess && onSuccess();
    } catch (error) {
      // Handle different error types with user-friendly messages
      const errorMessages = [];

      // Extract validation errors from OperationOutcome (422 response)
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        errorMessages.push(...error.validationErrors);
      } 
      // Fallback to generic error message
      else {
        errorMessages.push(error.message || 'Error creating observation');
      }

      setErrors(errorMessages);
      errorMessages.forEach(msg => {
        console.error('[ClinicalNotes] Error:', msg);
      });

      console.error('Observation creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Record Observation / Vital</h3>
      
      {errors.length > 0 && (
        <div className="error-box mb-4" role="alert" aria-live="polite">
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">LOINC Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => {
              setForm({...form, code: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="e.g., 8867-4 (Heart Rate)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
          <input
            type="number"
            value={form.value}
            onChange={(e) => {
              setForm({...form, value: e.target.value});
              if (errors.length) setErrors([]);
            }}
            step="0.01"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => {
              setForm({...form, unit: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="bpm, mmHg, °C"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => {
              setForm({...form, date: e.target.value});
              if (errors.length) setErrors([]);
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70 transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Record Observation'}
        </button>
      </div>
    </motion.form>
  );
};

const MedicationRequestForm = ({ patientId, appointmentId, onSuccess }) => {
  const { user } = useSelector(state => state.profile);
  const [form, setForm] = useState({
    medicationName: '',
    dose: '',
    frequency: '',
    route: 'oral',
    duration: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicationName.trim() || !form.dose.trim() || !form.frequency.trim()) {
      setErrors(['Please enter medication name, dose, and frequency']);
      return;
    }
    if (!patientId) {
      setErrors(['patientId is required']);
      return;
    }
    if (!user?._id) {
      setErrors(['doctorId is required']);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      // Step 2: Validate form inputs
      const doseValue = form.dose.trim();
      const frequencyValue = form.frequency.trim();
      const medicationName = form.medicationName.trim();

      // Parse dose - extract numeric value if format is like "100mg"
      const doseMatch = doseValue.match(/^([0-9.]+)/);
      const doseMagnitude = doseMatch ? parseFloat(doseMatch[1]) : null;
      const doseUnit = doseValue.replace(/^[0-9.]+\s*/, '') || 'mg';

      if (!doseMagnitude || isNaN(doseMagnitude)) {
        setErrors(['Dose must start with a numeric value (e.g., 100mg)']);
        return;
      }

      const frequencyMap = {
        'Once daily': 1,
        'Twice daily': 2,
        'Three times daily': 3
      };
      const frequencyMatch = frequencyValue.match(/\d+/);
      const frequencyNumber = frequencyMatch
        ? parseInt(frequencyMatch[0], 10)
        : frequencyMap[frequencyValue] || null;
      const shouldIncludeTiming = Number.isInteger(frequencyNumber) && frequencyNumber > 0;

      const authoredOnDate = new Date();
      const authoredOnRaw = isNaN(authoredOnDate.getTime())
        ? new Date().toISOString()
        : authoredOnDate.toISOString();
      // Backend expects ISO 8601 without milliseconds
      const authoredOn = authoredOnRaw.replace(/\.\d{3}Z$/, 'Z');

      // Step 2: Build proper FHIR R4 MedicationRequest payload
      const payload = {
        resourceType: 'MedicationRequest',     // ✅ Required: exact string
        status: 'active',                       // ✅ Required: active | on-hold | cancelled | completed
        intent: 'order',                        // ✅ Required: proposal | plan | order | original-order
        subject: {
          reference: `Patient/${patientId}`     // ✅ Fixed: FHIR reference format (not raw ID)
        },
        requester: {
          reference: `Practitioner/${user?._id}` // ✅ Fixed: Doctor's FHIR reference
        },
        authoredOn,
        // ✅ FHIR R4 standard field
        medicationCodeableConcept: {
          ...(medicationName ? {
            coding: [{
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: medicationName,
              display: medicationName
            }]
          } : {}),
          text: medicationName
        },
        // ✅ Keep legacy field for backend compatibility
        medication: {
          text: medicationName
        },
        dosageInstruction: [
          // ✅ Fixed: dosageInstruction must be an ARRAY
          {
            text: `${doseValue} ${frequencyValue}${form.duration ? ` for ${form.duration}` : ''}`,
            ...(shouldIncludeTiming
              ? {
                  timing: {
                    repeat: {
                      frequency: frequencyNumber,
                      period: 1,
                      periodUnit: 'd'
                    }
                  }
                }
              : {}),
            route: {
              coding: [{
                system: 'http://snomed.info/sct',
                code: form.route === 'oral' ? '26643006' : form.route,
                display: form.route
              }]
            },
            doseAndRate: [
              // ✅ Fixed: doseAndRate is an array
              {
                doseQuantity: {
                  value: doseMagnitude,        // ✅ Fixed: number not string
                  unit: doseUnit,
                  system: 'http://unitsofmeasure.org',
                  code: doseUnit
                }
              }
            ]
          }
        ],
        ...(form.notes && { note: [{ text: form.notes }] }) // Optional notes
      };

      console.log('[ClinicalNotes] Submitting MedicationRequest payload:', JSON.stringify(payload, null, 2));
      await createMedicationRequest(payload, appointmentId);

      toast.success('Medication prescribed successfully');
      setForm({ medicationName: '', dose: '', frequency: '', route: 'oral', duration: '', notes: '' });
      onSuccess && onSuccess();
    } catch (error) {
      // Extract error details
      const errorMessages = [];
      
      if (error.response?.data?.issue && Array.isArray(error.response.data.issue)) {
        // FHIR OperationOutcome
        error.response.data.issue.forEach(issue => {
          if (issue.diagnostics) {
            errorMessages.push(issue.diagnostics);
          } else if (issue.details?.text) {
            errorMessages.push(issue.details.text);
          }
        });
      }

      if (errorMessages.length === 0) {
        errorMessages.push(error.message || 'Error creating medication request');
      }

      setErrors(errorMessages);
      errorMessages.forEach(msg => {
        console.error('[ClinicalNotes] Error:', msg);
      });

      console.error('Medication request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Prescribe Medication</h3>
      
      {errors.length > 0 && (
        <div className="error-box mb-4" role="alert" aria-live="polite">
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
          <input
            type="text"
            value={form.medicationName}
            onChange={(e) => {
              setForm({...form, medicationName: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="e.g., Aspirin"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dose</label>
          <input
            type="text"
            value={form.dose}
            onChange={(e) => {
              setForm({...form, dose: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="e.g., 100mg"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => {
              setForm({...form, frequency: e.target.value});
              if (errors.length) setErrors([]);
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          >
              <option value="">Select frequency</option>
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="As needed">As needed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
          <select
            value={form.route}
            onChange={(e) => {
              setForm({...form, route: e.target.value});
              if (errors.length) setErrors([]);
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          >
              <option value="oral">Oral</option>
              <option value="intravenous">Intravenous</option>
              <option value="intramuscular">Intramuscular</option>
              <option value="topical">Topical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => {
              setForm({...form, duration: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="e.g., 7 days, 2 weeks"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => {
              setForm({...form, notes: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="Additional instructions..."
            rows="2"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70 transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Prescribe Medication'}
        </button>
      </div>
    </motion.form>
  );
};

const DiagnosticReportForm = ({ patientId, appointmentId, onSuccess }) => {
  const { user } = useSelector(state => state.profile);
  const [form, setForm] = useState({
    reportType: '',
    conclusion: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors(['File size must be less than 10MB']);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(['Only PDF and image files are allowed']);
      return;
    }

    setForm({...form, file});
    setFileName(file.name);
    if (errors.length) setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reportType.trim() || !form.file) {
      setErrors(['Please select report type and upload a file']);
      return;
    }
    if (!patientId) {
      setErrors(['patientId is required']);
      return;
    }
    if (!user?._id) {
      setErrors(['doctorId is required']);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      const reportName = form.reportType.trim();

      await createDiagnosticReport({
        appointmentId,
        patientId,
        doctorId: user?._id,
        reportCode: '11502-2',
        reportName,
        reportDate: new Date().toISOString(),
        conclusion: form.conclusion || '',
        observationIds: []
      }, form.file);

      toast.success('Diagnostic report uploaded successfully');
      setForm({ reportType: '', conclusion: '', file: null });
      setFileName('');
      onSuccess && onSuccess();
    } catch (error) {
      setErrors([error.message || 'Error uploading diagnostic report']);
      console.error('Diagnostic report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Diagnostic Report</h3>
      
      {errors.length > 0 && (
        <div className="error-box mb-4" role="alert" aria-live="polite">
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
          <select
            value={form.reportType}
            onChange={(e) => {
              setForm({...form, reportType: e.target.value});
              if (errors.length) setErrors([]);
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
          >
            <option value="">Select report type</option>
            <option value="Lab Report">Lab Report</option>
            <option value="X-Ray">X-Ray</option>
            <option value="CT Scan">CT Scan</option>
            <option value="MRI">MRI</option>
            <option value="ECG">ECG</option>
            <option value="Ultrasound">Ultrasound</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Conclusion</label>
          <textarea
            value={form.conclusion}
            onChange={(e) => {
              setForm({...form, conclusion: e.target.value});
              if (errors.length) setErrors([]);
            }}
            placeholder="Summary of findings and conclusions..."
            rows="3"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF or Image)</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
            <input
              type="file"
              onChange={handleFileChange}
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {fileName ? `Selected: ${fileName}` : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF or image up to 10MB</p>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70 transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? 'Uploading...' : 'Upload Report'}
        </button>
      </div>
    </motion.form>
  );
};

const ClinicalNotes = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.profile);
  const { consents, consentsLoading } = useSelector(state => state.fhir);

  const [patientName, setPatientName] = useState('Patient');
  const [patientId, setPatientId] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState({
    loading: true,
    canAccess: false,
    paymentStatus: 'unpaid',
    consultationStatus: 'locked'
  });
  const [showConsentRequestModal, setShowConsentRequestModal] = useState(false);
  const [consentRequest, setConsentRequest] = useState({
    resourceTypes: [],
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [consentError, setConsentError] = useState("");

  // Initialize Socket.io listener for consent requests from patients
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }

    const canLoadConsents = Boolean(patientId && accessStatus.canAccess);

    const joinUserRoom = () => {
      if (user?._id) {
        socket.emit('joinRoom', user._id.toString());
      }
    };

    if (socket.connected) {
      joinUserRoom();
    }

    // Listen for consent request responses from patients
    const handleConsentResponse = (data) => {
      if (data.status === 'granted') {
        alert(`✅ Consent granted by patient for: ${data.resourceTypes.join(', ')}`);
        // Reload consents
        if (canLoadConsents) loadConsents();
      } else if (data.status === 'denied') {
        alert(`❌ Consent request denied by patient`);
      }
    };

    // Listen for consent granted from patient
    const handleConsentGranted = (data) => {
      alert(`✅ ${data.patientName} has granted you consent`);
      // Re-fetch consent status for this patient
      if (canLoadConsents) loadConsents();
    };

    // Listen for consent rejected from patient
    const handleConsentRejected = (data) => {
      alert(`Patient declined your consent request`);
    };

    socket.on('connect', joinUserRoom);
    socket.on('consentResponse', handleConsentResponse);
    socket.on('consentGranted', handleConsentGranted);
    socket.on('consentRejected', handleConsentRejected);

    return () => {
      // ⚠️ DO NOT disconnect socket — App.js manages the global connection
      socket.off('connect', joinUserRoom);
      socket.off('consentResponse', handleConsentResponse);
      socket.off('consentGranted', handleConsentGranted);
      socket.off('consentRejected', handleConsentRejected);
    };
  }, [patientId, user?._id, accessStatus.canAccess]);

  // Load appointment details + access status
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!appointmentId) return;

    let isActive = true;

    const fetchAccessStatus = async () => {
      try {
        const response = await axiosInstance.get(
          `/appointments/${appointmentId}/consultation-status`
        );
        if (!isActive) return;
        setAccessStatus({ loading: false, ...response.data });
      } catch (error) {
        console.error('[ClinicalNotes] Error loading consultation status:', error);
        if (!isActive) return;
        setAccessStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    const fetchAppointment = async () => {
      try {
        const response = await axiosInstance.get(`/appointments/${appointmentId}`);
        if (!isActive) return;

        const appointmentData =
          response?.data?.data || response?.data?.appointment || response?.data;

        const resolvedPatientId =
          appointmentData?.userId?._id ||
          appointmentData?.user_ref?._id ||
          appointmentData?.userId ||
          appointmentData?.user_ref ||
          null;

        const resolvedName =
          appointmentData?.userId?.fullName ||
          appointmentData?.user_ref?.fullName ||
          appointmentData?.user?.fullName ||
          null;

        setPatientId(resolvedPatientId);
        if (resolvedName) {
          setPatientName(resolvedName);
        } else if (resolvedPatientId) {
          setPatientName(`Patient ${resolvedPatientId.substring(0, 8)}`);
        }
      } catch (error) {
        console.error('[ClinicalNotes] Error loading appointment details:', error);
      } finally {
        if (isActive) {
          setAppointmentLoading(false);
        }
      }
    };

    fetchAccessStatus();
    fetchAppointment();

    return () => {
      isActive = false;
    };
  }, [appointmentId]);

  // Load consents only when access is permitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!patientId || !accessStatus.canAccess) return;
    loadConsents();
  }, [patientId, accessStatus.canAccess]);

  const loadConsents = async () => {
    try {
      if (!patientId || !accessStatus.canAccess) {
        return;
      }
      dispatch(setConsentsLoading(true));
      const response = await getConsents(patientId, appointmentId);
      const consentsList =
        response?.data ||
        response?.entry?.map(e => e.resource) ||
        [];
      dispatch(setConsents(consentsList));
    } catch (error) {
      console.error('Error loading consents:', error);
      dispatch(setConsents([]));
    } finally {
      dispatch(setConsentsLoading(false)); // ✅ Always stop loading
    }
  };

  const handleRequestConsent = () => {
    setShowConsentRequestModal(true);
    setConsentError("");
  };

  const handleSendConsentRequest = async () => {
    console.log('🔵 handleSendConsentRequest STARTED');
    
    if (consentRequest.resourceTypes.length === 0) {
      console.warn('⚠️ No resource types selected');
      setConsentError('Please select at least one resource type');
      return;
    }

    try {
      setSending(true);
      setConsentError("");
      console.log('📤 Sending consent request with:', {
        patientId,
        resourceTypes: consentRequest.resourceTypes,
        message: consentRequest.message,
        doctorId: user?._id
      });

      // Call the backend API to create and send consent request
      const response = await requestConsent({
        patientId,
        doctorId: user?._id,
        appointmentId,
        resourceTypes: consentRequest.resourceTypes,
        message: consentRequest.message
      });

      console.log('✅ Consent API response:', response);

      if (response.success) {
        console.log('✅ Consent request sent successfully!');
        // Show success message
        toast.success('✅ Consent request sent successfully! Patient will be notified by email and in-app.');

        // Reset form and close modal
        setConsentRequest({ resourceTypes: [], message: '' });
        setShowConsentRequestModal(false);

        // Emit socket event for real-time notification
        if (socket.connected) {
          console.log('🔌 Emitting socket event: requestConsent');
          socket.emit('requestConsent', {
            patientId,
            doctorId: user?._id,
            doctorName: user?.fullName,
            resourceTypes: consentRequest.resourceTypes,
            requestId: response.data?.requestId,
            timestamp: new Date()
          });
          console.log('✅ Socket event emitted');
        } else {
          console.warn('⚠️ Socket not connected');
        }
      } else {
        console.error('❌ API returned error:', response.message);
        setConsentError(response.message || 'Failed to send consent request');
      }
    } catch (error) {
      console.error('❌ Error sending consent request:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      setConsentError(error.message || 'Error sending consent request');
    } finally {
      setSending(false);
      console.log('🔵 handleSendConsentRequest FINISHED');
    }
  };

  const toggleResourceType = (resourceType) => {
    setConsentRequest(prev => ({
      ...prev,
      resourceTypes: prev.resourceTypes.includes(resourceType)
        ? prev.resourceTypes.filter(r => r !== resourceType)
        : [...prev.resourceTypes, resourceType]
    }));
    if (consentError) setConsentError("");
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10 shadow-xl text-center">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Missing appointment ID.</p>
        </div>
      </div>
    );
  }

  const isLoading = accessStatus.loading || appointmentLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10 shadow-xl text-center">
          <Loader className="w-6 h-6 text-cyan-700 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">Checking consultation access...</p>
        </div>
      </div>
    );
  }

  if (!accessStatus.canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10 shadow-xl text-center max-w-lg w-full">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Consultation Locked</h2>
          <p className="text-sm text-slate-600 mt-2">
            {accessStatus.paymentStatus === 'unpaid'
              ? 'Waiting for patient payment to begin the consultation.'
              : 'Consultation is not active yet.'}
          </p>
          <div className="mt-5 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2">
              <span className="text-slate-600">Payment</span>
              <span className={accessStatus.paymentStatus === 'paid' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                {accessStatus.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2">
              <span className="text-slate-600">Consultation</span>
              <span className={accessStatus.consultationStatus === 'active' ? 'text-emerald-600 font-medium' : 'text-slate-600 font-medium'}>
                {accessStatus.consultationStatus === 'active' ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="mt-6 w-full rounded-lg bg-cyan-700 px-4 py-2 text-white font-medium hover:bg-cyan-800 transition"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10 shadow-xl text-center max-w-lg w-full">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Patient data unavailable</h2>
          <p className="text-sm text-slate-600 mt-2">
            We could not load the patient details for this appointment.
          </p>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="mt-6 w-full rounded-lg bg-cyan-700 px-4 py-2 text-white font-medium hover:bg-cyan-800 transition"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/doctor')}
            className="text-cyan-700 font-medium hover:text-cyan-800 mb-4 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Clinical Notes</h1>
          <p className="text-slate-600 mt-2">{patientName}</p>
        </div>

        {/* Consent Check Banner */}
        {consentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 text-cyan-600 animate-spin" />
          </div>
        ) : (
          <ConsentBanner
            consents={consents}
            patientName={patientName}
            onRequestConsent={handleRequestConsent}
          />
        )}

        {/* Consent Request Modal */}
        {showConsentRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Request Patient Consent
              </h3>

              {consentError ? (
                <div className="error-box mb-4" role="alert" aria-live="polite">
                  {consentError}
                </div>
              ) : null}

              <div className="space-y-4">
                {/* Resource Types */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Select resources you need access to:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Condition',
                      'Observation',
                      'AllergyIntolerance',
                      'MedicationRequest',
                      'DiagnosticReport',
                      'Procedure',
                      'Immunization',
                      'DocumentReference'
                    ].map(resourceType => (
                      <label key={resourceType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentRequest.resourceTypes.includes(resourceType)}
                          onChange={() => toggleResourceType(resourceType)}
                          className="w-4 h-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                        />
                        <span className="text-sm text-slate-700">{resourceType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message to patient (optional)
                  </label>
                  <textarea
                    value={consentRequest.message}
                    onChange={(e) => {
                      setConsentRequest(prev => ({ ...prev, message: e.target.value }));
                      if (consentError) setConsentError("");
                    }}
                    placeholder="Explain why you need access to this patient's data..."
                    rows="4"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSendConsentRequest}
                  disabled={sending || consentRequest.resourceTypes.length === 0}
                  className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:bg-slate-400 transition"
                >
                  {sending ? 'Sending...' : 'Send Consent Request'}
                </button>
                <button
                  onClick={() => {
                    setShowConsentRequestModal(false);
                    setConsentError("");
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Content Area */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Forms */}
          <div className="md:col-span-2 space-y-6">
            {consents && consents.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <ConditionForm patientId={patientId} appointmentId={appointmentId} onSuccess={() => loadConsents()} />
                  <ObservationForm patientId={patientId} appointmentId={appointmentId} onSuccess={() => loadConsents()} />
                  <MedicationRequestForm patientId={patientId} appointmentId={appointmentId} onSuccess={() => loadConsents()} />
                  <DiagnosticReportForm patientId={patientId} appointmentId={appointmentId} onSuccess={() => loadConsents()} />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900">No Consent Granted</h3>
                <p className="text-slate-600 text-sm mt-2">
                  Request consent from the patient to view their clinical data
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Quick Reference</h4>
              {consents && consents.length > 0 ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-600"></span>
                    <span className="text-slate-700">Patient consent active</span>
                  </div>
                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <p className="font-medium mb-2 text-slate-700">Authorized Resources:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {consents[0]?.resourceType?.slice(0, 4).map(resource => (
                        <li key={resource}>{resource}</li>
                      )) || <li>All resources</li>}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  No active consents
                </div>
              )}
            </div>

            <div className="bg-cyan-50 rounded-xl border border-cyan-200 p-4">
              <h4 className="font-semibold text-cyan-900 mb-2">Clinical Forms</h4>
              <p className="text-sm text-cyan-800">
                Use the forms to the left to record patient conditions, vital signs, medications, and diagnostic reports. All entries require active patient consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotes;
