import React, { useState } from 'react';
import { Pill } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * MedicationList - Table/card view of medication requests
 * Shows drug name, dose, frequency, prescribing doctor, date
 */
const MedicationList = ({ medications = [], loading = false }) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const getFhirDisplay = (field, fallback = '—') => {
    if (!field) return fallback;
    if (typeof field === 'string') return field;
    if (typeof field === 'number') return String(field);
    if (field.text) return field.text;
    if (field.display) return field.display;
    if (field.coding?.[0]?.display) return field.coding[0].display;
    if (field.reference) return field.reference;
    if (Array.isArray(field)) return field[0]?.text || fallback;
    return fallback;
  };

  const getMedicationName = (med) => {
    return (
      getFhirDisplay(med.medication_ref?.display, '') ||
      getFhirDisplay(med.medication, '') ||
      getFhirDisplay(med.medicationReference, '') ||
      getFhirDisplay(med.medicationCodeableConcept, '') ||
      'Unknown Medication'
    );
  };

  const getPrimaryDosage = (med) => {
    if (!med?.dosageInstruction) return null;
    return Array.isArray(med.dosageInstruction)
      ? med.dosageInstruction[0]
      : med.dosageInstruction;
  };

  const getDoseDisplay = (dosage) => {
    const quantity =
      dosage?.dose?.value != null
        ? { value: dosage?.dose?.value, unit: dosage?.dose?.unit }
        : dosage?.doseQuantity || dosage?.doseAndRate?.[0]?.doseQuantity;

    if (!quantity || quantity.value == null) return null;
    return `${quantity.value} ${quantity.unit || ''}`.trim();
  };

  const getFrequencyDisplay = (dosage) => {
    const value = dosage?.frequency?.value ?? dosage?.timing?.repeat?.frequency;
    const unit = dosage?.frequency?.unit ?? dosage?.timing?.repeat?.periodUnit;
    if (value == null) return null;
    const unitMap = {
      d: 'per day',
      day: 'per day',
      wk: 'per week',
      week: 'per week',
      mo: 'per month',
      month: 'per month',
      h: 'per hour',
      hour: 'per hour'
    };
    const unitText = unitMap[unit] || unit || 'daily';
    return `${value}x ${unitText}`.trim();
  };

  const getRequesterDisplay = (med) => {
    // First check if requester field exists (from consultation data)
    if (med.requester) {
      return med.requester;
    }
    // Fall back to FHIR fields
    return (
      getFhirDisplay(med.requester, '') ||
      med.doctor_ref?.fullName ||
      'Unknown Practitioner'
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const filtered = statusFilter === 'all' 
    ? medications 
    : medications.filter(m => m.status === statusFilter);

  if (medications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Pill className="mx-auto h-8 w-8 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">No medications recorded</p>
        <p className="text-xs text-slate-500 mt-1">Active prescriptions will appear here</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-slate-100 text-slate-800 border-slate-200',
      stopped: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'completed', 'stopped'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              statusFilter === status
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Medications Cards */}
      <div className="space-y-3">
        {filtered.map((med, idx) => {
          const dosage = getPrimaryDosage(med);
          const doseDisplay = getDoseDisplay(dosage);
          const frequencyDisplay = getFrequencyDisplay(dosage);
          const routeDisplay = dosage ? getFhirDisplay(dosage.route, 'Unknown') : null;

          return (
            <motion.div
              key={med._id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {/* Handle both old (medication_ref) and new (medication) field formats */}
                    {getMedicationName(med)}
                  </h4>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {doseDisplay && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Dose</p>
                        <p className="text-slate-700 font-medium">
                          {doseDisplay}
                        </p>
                      </div>
                    )}
                    
                    {frequencyDisplay && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Frequency</p>
                        <p className="text-slate-700 font-medium">
                          {frequencyDisplay}
                        </p>
                      </div>
                    )}

                    {routeDisplay && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Route</p>
                        <p className="text-slate-700 font-medium capitalize">
                          {routeDisplay}
                        </p>
                      </div>
                    )}

                    {med.authoredOn && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Prescribed</p>
                        <p className="text-slate-700 font-medium">
                          {new Date(med.authoredOn).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {(med.note || med.notes) && (
                    <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      {/* Handle both array and string formats for notes */}
                      {Array.isArray(med.note) 
                        ? med.note.map(n => typeof n === 'string' ? n : n.text).join('; ')
                        : Array.isArray(med.notes)
                        ? med.notes.map(n => typeof n === 'string' ? n : n.text).join('; ')
                        : typeof med.note === 'string' ? med.note : 'N/A'
                      }
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(med.status)}`}>
                    {med.status}
                  </span>
                  <p className="text-xs text-slate-500">
                    Prescribed by<br/>
                  <span className="font-medium text-slate-700">{getRequesterDisplay(med).startsWith('Dr. ') ? getRequesterDisplay(med) : `Dr. ${getRequesterDisplay(med)}`}</span>
                </p>
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationList;
