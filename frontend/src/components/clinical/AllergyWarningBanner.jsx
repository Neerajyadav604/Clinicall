import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AllergyWarningBanner - Displays allergies with critical severity
 * Shown at the top of medical records, collapsible if > 3 allergies
 */
const AllergyWarningBanner = ({ allergies = [] }) => {
  const [isExpanded, setIsExpanded] = useState(allergies.length <= 3);

  if (!allergies || allergies.length === 0) {
    return null;
  }

  const criticalAllergies = allergies.filter(a => a.criticality === 'high');
  const shouldCollapse = allergies.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Allergy Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                {criticalAllergies.length > 0
                  ? `${criticalAllergies.length} critical allergies on file`
                  : `${allergies.length} allergy/allergies recorded`}
              </p>
            </div>
          </div>
          {shouldCollapse && (
            <button className="flex-shrink-0 text-red-600 hover:text-red-700 transition">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-red-200 space-y-2"
            >
              {allergies.map((allergy, idx) => (
                <motion.div
                  key={`${allergy._id || idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-start justify-between p-2 rounded border ${
                    allergy.criticality === 'high'
                      ? 'border-red-200 bg-red-100'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm text-red-900">
                      {allergy.substance?.display || 'Unknown Substance'}
                    </p>
                    {allergy.reaction && allergy.reaction.length > 0 && (
                      <p className="text-xs text-red-700 mt-1">
                        Reactions: {allergy.reaction.map(r => {
                          // ✅ Extract display value from CodeableConcept object
                          const manifestation = r.manifestation;
                          if (!manifestation) return null;
                          if (typeof manifestation === 'string') return manifestation;
                          if (manifestation.text) return manifestation.text;
                          if (manifestation.display) return manifestation.display;
                          if (manifestation.coding?.[0]?.display) return manifestation.coding[0].display;
                          return null;
                        }).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      allergy.criticality === 'high'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {allergy.criticality}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AllergyWarningBanner;
