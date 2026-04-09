import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getReactionDisplay = (reaction) => {
  if (!reaction) return null;
  if (typeof reaction === 'string') return reaction;
  if (reaction.display) return reaction.display;
  if (reaction.text) return reaction.text;

  const manifestation = reaction.manifestation;
  if (!manifestation) return null;
  if (typeof manifestation === 'string') return manifestation;
  if (manifestation.text) return manifestation.text;
  if (manifestation.display) return manifestation.display;
  if (manifestation.coding?.[0]?.display) return manifestation.coding[0].display;

  return null;
};

/**
 * AllergyWarningBanner - Displays allergies with critical severity
 * Shown at the top of medical records, collapsible if > 3 allergies
 */
const AllergyWarningBanner = ({ allergies = [] }) => {
  const [isExpanded, setIsExpanded] = useState(allergies.length <= 3);

  if (!allergies || allergies.length === 0) {
    return null;
  }

  const criticalAllergies = allergies.filter((allergy) => allergy.criticality === 'high');
  const shouldCollapse = allergies.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 sm:mb-6 md:mb-8"
    >
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 sm:p-4 md:p-5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 sm:gap-4 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded p-1 sm:p-1.5 min-h-[44px]"
          aria-expanded={isExpanded}
          aria-label={`Allergy alert. ${isExpanded ? 'Collapse' : 'Expand'} allergy details`}
        >
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-red-900 text-sm sm:text-base md:text-lg">Allergy Alert</h3>
              <p className="text-xs sm:text-sm text-red-700 mt-0.5 sm:mt-1 leading-relaxed">
                {criticalAllergies.length > 0
                  ? `${criticalAllergies.length} critical allergies on file`
                  : `${allergies.length} allergy/allergies recorded`}
              </p>
            </div>
          </div>
          {shouldCollapse && (
            <div className="flex-shrink-0 text-red-600 hover:text-red-700 transition">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-red-200 space-y-2 sm:space-y-3"
              role="region"
              aria-label="Allergy details"
            >
              {allergies.map((allergy, idx) => (
                <motion.div
                  key={`${allergy._id || idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-start justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded border text-xs sm:text-sm leading-relaxed ${
                    allergy.criticality === 'high'
                      ? 'border-red-200 bg-red-100'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
              <div>
                    <p className="font-medium text-red-900 text-sm sm:text-base">
                      {allergy.substance?.display || 'Unknown Substance'}
                    </p>
                    {allergy.reaction && allergy.reaction.length > 0 && (
                      <p className="text-xs text-red-700 mt-0.5 sm:mt-1 leading-relaxed">
                        Reactions: {allergy.reaction.map(getReactionDisplay).filter(Boolean).join(', ')}
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
