import React, { useMemo } from 'react';
import { AlertTriangle, Pill, Zap, ClipboardList, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * MedicalTimeline - Vertical scrollable timeline of all clinical events
 * Shows Conditions, Observations, Procedures, Immunizations sorted by date
 * Each entry is color-coded and sortable by type
 */
const MedicalTimeline = ({
  conditions = [],
  observations = [],
  procedures = [],
  immunizations = [],
  loading = false
}) => {
  const fhirDisplay = (field) => {
    if (!field) return '—';
    if (typeof field === 'string') return field;
    if (typeof field === 'number') return String(field);
    if (Array.isArray(field)) {
      return (
        field[0]?.text ||
        field[0]?.coding?.[0]?.display ||
        field[0]?.coding?.[0]?.code ||
        '—'
      );
    }
    return (
      field.text ||
      field.coding?.[0]?.display ||
      field.coding?.[0]?.code ||
      field.reference ||
      field.display ||
      '—'
    );
  };

  const getTypeInfo = (type) => {
    const info = {
      condition: {
        icon: AlertTriangle,
        color: 'bg-amber-100 text-amber-700',
        iconColor: '#b45309',
        label: 'Condition'
      },
      observation: {
        icon: Activity,
        color: 'bg-emerald-100 text-emerald-700',
        iconColor: '#059669',
        label: 'Observation'
      },
      procedure: {
        icon: Zap,
        color: 'bg-blue-100 text-blue-700',
        iconColor: '#0284c7',
        label: 'Procedure'
      },
      immunization: {
        icon: Pill,
        color: 'bg-purple-100 text-purple-700',
        iconColor: '#9333ea',
        label: 'Immunization'
      }
    };
    return info[type] || info.observation;
  };

  const allEvents = useMemo(() => {
    const events = [
      ...conditions.map(c => ({
        type: 'condition',
        id: c._id,
        date: c.recordedDate || c.onsetDate || new Date(),
        title: fhirDisplay(c.code) || 'Unknown Condition',
        subtitle: `Status: ${fhirDisplay(c.clinicalStatus)}`,
        details: c.severity ? `Severity: ${fhirDisplay(c.severity)}` : null
      })),
      ...observations.flatMap(o => {
        // Handle observations with nested components (structured vitals)
        if (o.component && Array.isArray(o.component)) {
          return o.component.map(comp => ({
            type: 'observation',
            id: `${o._id}_${comp.code?.text || 'vital'}`,
            date: o.effectiveDateTime || new Date(),
            title: `${comp.code?.text || 'Vital'}: ${comp.valueQuantity?.value || comp.valueString || 'N/A'} ${comp.valueQuantity?.unit || ''}`,
            subtitle: fhirDisplay(comp.code),
            details: comp.referenceRange ? `Range: ${comp.referenceRange}` : null
          }));
        }
        
        // Handle flat observation structure (single observation per vital)
        return [{
          type: 'observation',
          id: o._id,
          date: o.effectiveDateTime || o.effectiveDate || new Date(),
          title: fhirDisplay(o.code) || 'Unknown Obs',
          subtitle: `Value: ${o.value?.quantity?.value || o.value?.string || o.valueString || 'N/A'} ${o.value?.quantity?.unit || ''}`,
          details: o.interpretation ? `Interpretation: ${fhirDisplay(o.interpretation)}` : null
        }];
      }),
      ...procedures.map(p => ({
        type: 'procedure',
        id: p._id,
        date: p.performedDate || new Date(),
        title: p.display || 'Unknown Procedure',
        subtitle: `Status: ${p.status}`,
        details: p.bodySite ? `Site: ${p.bodySite}` : null
      })),
      ...immunizations.map(i => ({
        type: 'immunization',
        id: i._id,
        date: i.occurrenceDate || new Date(),
        title: i.vaccineDisplay || 'Unknown Vaccine',
        subtitle: `Status: ${i.status}`,
        details: i.lotNumber ? `Lot: ${i.lotNumber}` : null
      }))
    ];

    // Sort by date descending (newest first)
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [conditions, observations, procedures, immunizations]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (allEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">No medical history</p>
        <p className="text-xs text-slate-500 mt-1">Clinical events will be displayed here as they are recorded</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="space-y-4">
        {allEvents.map((event, idx) => {
          const typeInfo = getTypeInfo(event.type);
          const Icon = typeInfo.icon;

          return (
            <motion.div
              key={event.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4"
            >
              {/* Timeline Dot and Line */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div className={`rounded-full p-2.5 ${typeInfo.color} border-2 border-white shadow-md`}>
                  <Icon className="h-4 w-4" />
                </div>
                {idx < allEvents.length - 1 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-200" />
                )}
              </div>

              {/* Event Card */}
              <div className="flex-1 pb-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 mb-2">
                        {typeInfo.label}
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {event.title}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(event.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                  </div>

                  {/* Details */}
                  <p className="text-sm text-slate-600">
                    {event.subtitle}
                  </p>

                  {event.details && (
                    <p className="text-xs text-slate-500 mt-2">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Conditions</p>
          <p className="text-lg font-bold text-slate-900">{conditions.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Observations</p>
          <p className="text-lg font-bold text-slate-900">{observations.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Procedures</p>
          <p className="text-lg font-bold text-slate-900">{procedures.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Immunizations</p>
          <p className="text-lg font-bold text-slate-900">{immunizations.length}</p>
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;
