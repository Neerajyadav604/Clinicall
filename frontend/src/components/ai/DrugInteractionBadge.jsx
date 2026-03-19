import { useState } from "react";
import PropTypes from "prop-types";

const DrugInteractionBadge = ({
  interactions = [],
  allergyConflicts = [],
  overallRisk = "SAFE",
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-red-50 text-red-700 border border-red-300";
      case "MODERATE":
        return "bg-yellow-50 text-yellow-700 border border-yellow-300";
      case "LOW":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-green-50 text-green-700 border border-green-200";
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Compact mode
  if (compact) {
    if (overallRisk === "SAFE" || (interactions.length === 0 && allergyConflicts.length === 0)) {
      return (
        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
          ✓ No interactions
        </span>
      );
    }

    if (overallRisk === "CRITICAL") {
      return (
        <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5 animate-pulse">
          ⚠ CRITICAL interaction
        </span>
      );
    }

    const count = interactions.length + allergyConflicts.length;
    const badgeClass = getSeverityColor(overallRisk);

    return (
      <span className={`text-xs rounded-full px-2 py-0.5 ${badgeClass}`}>
        ⚠ {overallRisk} risk {count > 0 && `(${count})`}
      </span>
    );
  }

  // Full mode
  return (
    <div className={`rounded-lg border-2 p-4 ${getSeverityColor(overallRisk)}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getSeverityBadgeColor(overallRisk)}`}>
          {overallRisk === "SAFE" ? "✓ SAFE" : `⚠ ${overallRisk}`}
        </span>
        <span className="text-sm font-semibold">Drug Interaction Check Results</span>
      </div>

      {(interactions.length === 0 && allergyConflicts.length === 0) || overallRisk === "SAFE" ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          ✓ No known interactions found between these medications.
        </div>
      ) : (
        <>
          {interactions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">
                Drug-Drug Interactions ({interactions.length}):
              </h4>
              <div className="space-y-2">
                {interactions.map((interaction, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 pl-3 py-2 ${
                      interaction.severity === "CRITICAL"
                        ? "border-red-600 bg-red-50"
                        : interaction.severity === "HIGH"
                          ? "border-orange-500 bg-orange-50"
                          : interaction.severity === "MODERATE"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${getSeverityBadgeColor(interaction.severity)}`}
                      >
                        {interaction.severity}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {interaction.drug1} + {interaction.drug2}
                        </div>
                        {interaction.effect && (
                          <p className="text-sm text-gray-600 mt-0.5">{interaction.effect}</p>
                        )}
                        {interaction.recommendation && (
                          <p className="text-sm text-blue-700 mt-1">
                            <strong>Recommendation:</strong> {interaction.recommendation}
                          </p>
                        )}
                        {interaction.mechanism && (
                          <p className="text-xs text-gray-400 mt-1">{interaction.mechanism}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allergyConflicts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-red-800 mb-2">
                🚫 Allergy Conflicts ({allergyConflicts.length}):
              </h4>
              <div className="space-y-2">
                {allergyConflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-red-600 bg-red-50 pl-3 py-2"
                  >
                    <p className="text-sm font-medium text-red-800">
                      {conflict.drug} — {conflict.allergy} allergy conflict
                    </p>
                    {conflict.message && (
                      <p className="text-sm text-red-700 mt-0.5">{conflict.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Safe combinations section - collapsed by default */}
      {Array.isArray(interactions) && interactions.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            {expanded ? "▼" : "▶"} Safe combinations
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 mb-2">
                These combinations have no known interactions (sample list)
              </p>
              <div className="flex flex-wrap gap-1">
                {["Paracetamol + Vitamin C", "Ibuprofen + Antacid", "Fluoxetine + Vitamin D"].map(
                  (combo, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {combo}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DrugInteractionBadge.propTypes = {
  interactions: PropTypes.array,
  allergyConflicts: PropTypes.array,
  overallRisk: PropTypes.oneOf(["CRITICAL", "HIGH", "MODERATE", "LOW", "SAFE"]),
  compact: PropTypes.bool,
};

export default DrugInteractionBadge;
