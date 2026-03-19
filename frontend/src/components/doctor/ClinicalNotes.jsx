import { useState } from "react";
import { axiosInstance } from "../../services/ApiConnector";
import DrugInteractionBadge from "../ai/DrugInteractionBadge";
import Modal from "../common/Modal";

const ClinicalNotes = ({ patientId, onSubmitSuccess, initialData = {} }) => {
  // Form state
  const [medicationName, setMedicationName] = useState(initialData.medicationName || "");
  const [dosage, setDosage] = useState(initialData.dosage || "");
  const [frequency, setFrequency] = useState(initialData.frequency || "");
  const [notes, setNotes] = useState(initialData.notes || "");

  // Drug interaction checking state
  const [drugCheckResult, setDrugCheckResult] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionAcknowledged, setInteractionAcknowledged] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const checkInteractionsThenSubmit = async (formData) => {
    const newMedication = formData.medicationName || medicationName;

    if (!newMedication) {
      await handleActualSubmit(formData);
      return;
    }

    setCheckingInteractions(true);
    try {
      const { data } = await axiosInstance.post("/ai/drugs/check", {
        medications: [newMedication],
        patientId: patientId || null,
      });

      setDrugCheckResult(data);

      const hasHighRisk =
        data.overall_risk === "CRITICAL" || data.overall_risk === "HIGH";
      const hasConflicts =
        (data.interactions?.length > 0) || (data.allergy_conflicts?.length > 0);

      if (hasConflicts && hasHighRisk) {
        setPendingSubmitData(formData);
        setInteractionAcknowledged(false);
        setShowInteractionModal(true);
      } else if (hasConflicts || hasHighRisk) {
        // MODERATE/LOW or just show badge but allow submit
        await handleActualSubmit(formData);
      } else {
        // SAFE - proceed normally
        await handleActualSubmit(formData);
      }
    } catch (err) {
      console.warn("[Drug Check] Failed:", err.message);
      await handleActualSubmit(formData);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handleActualSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      // Here you would call your API to save the clinical note
      // Example: await api.post("/clinical-notes", formData);
      // For now,  we'll just call the success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(formData);
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleForceSubmitAfterAcknowledge = async () => {
    if (!interactionAcknowledged) return;
    setShowInteractionModal(false);
    await handleActualSubmit(pendingSubmitData);
    setPendingSubmitData(null);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const formData = {
      medicationName,
      dosage,
      frequency,
      notes,
      patientId,
    };
    checkInteractionsThenSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Add Prescription</h2>

      <form onSubmit={handleSubmitForm} className="space-y-4">
        {/* Medication Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medication Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="e.g., Aspirin, Ibuprofen"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Drug Interaction Badge (Inline) */}
          {drugCheckResult && (
            <div className="mt-2">
              <DrugInteractionBadge
                interactions={drugCheckResult.interactions}
                allergyConflicts={drugCheckResult.allergy_conflicts}
                overallRisk={drugCheckResult.overall_risk}
                compact={true}
              />
            </div>
          )}

          {checkingInteractions && (
            <p className="text-xs text-gray-500 mt-2">Checking interactions...</p>
          )}
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dosage
          </label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g., 500mg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select frequency</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="As needed">As needed</option>
            <option value="Every 4 hours">Every 4 hours</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Before meals">Before meals</option>
            <option value="After meals">After meals</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes / Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional instructions or notes for the patient"
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitLoading || checkingInteractions || !medicationName}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              "Save Prescription"
            )}
          </button>
        </div>
      </form>

      {/* Drug Interaction Warning Modal */}
      <Modal isOpen={showInteractionModal} onClose={() => setShowInteractionModal(false)}>
        <div className="p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-red-700">Drug Interaction Warning</h3>
              <p className="text-sm text-gray-500">Please review before prescribing</p>
            </div>
          </div>

          {drugCheckResult && (
            <DrugInteractionBadge
              interactions={drugCheckResult.interactions}
              allergyConflicts={drugCheckResult.allergy_conflicts}
              overallRisk={drugCheckResult.overall_risk}
              compact={false}
            />
          )}

          <div className="mt-5 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={interactionAcknowledged}
                onChange={(e) => setInteractionAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <span className="text-sm text-gray-700">
                I have reviewed the drug interaction warnings and confirm that the clinical
                benefit outweighs the risk for this patient. I take full responsibility for
                this prescription.
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowInteractionModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel — Review Prescription
            </button>
            <button
              onClick={handleForceSubmitAfterAcknowledge}
              disabled={!interactionAcknowledged}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClinicalNotes;
