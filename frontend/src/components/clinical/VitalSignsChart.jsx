import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * VitalSignsChart - Line chart showing vital sign trends over time
 * Uses Recharts to display observation data with reference ranges
 */
const VitalSignsChart = ({ observations = [], loading = false }) => {
  const [selectedVital, setSelectedVital] = useState('heartRate');

  const vitalTypes = {
    heartRate: {
      label: 'Heart Rate',
      loinc: '8867-4',
      unit: 'bpm',
      color: '#ff6b6b',
      refLow: 60,
      refHigh: 100
    },
    bloodPressureSystolic: {
      label: 'Systolic BP',
      loinc: '8480-6',
      unit: 'mmHg',
      color: '#ff8787',
      refLow: 90,
      refHigh: 140
    },
    bloodPressureDiastolic: {
      label: 'Diastolic BP',
      loinc: '8462-4',
      unit: 'mmHg',
      color: '#ffa5a5',
      refLow: 60,
      refHigh: 90
    },
    temperature: {
      label: 'Temperature',
      loinc: '8310-5',
      unit: '°C',
      color: '#ffd93d',
      refLow: 36.5,
      refHigh: 37.5
    },
    spO2: {
      label: 'Oxygen Saturation',
      loinc: '2708-6',
      unit: '%',
      color: '#6bcf7f',
      refLow: 95,
      refHigh: 100
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chartData = useMemo(() => {
    if (!observations || observations.length === 0) return [];

    const vital = vitalTypes[selectedVital];
    
    // Flatten vital signs from observations with component arrays
    const flattenedVitals = [];
    
    observations.forEach(obs => {
      // Handle observations with nested components (structured vitals)
      if (obs.component && Array.isArray(obs.component)) {
        obs.component.forEach(comp => {
          const compCode = comp.code?.text || comp.code?.display || comp.code?.coding || '';
          const isMatch = compCode.toLowerCase().includes(vital.label.toLowerCase());
          
          if (isMatch) {
            flattenedVitals.push({
              date: obs.effectiveDateTime 
                ? new Date(obs.effectiveDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: comp.valueQuantity?.value || comp.valueString,
              timestamp: obs.effectiveDateTime || new Date(),
              recordDate: obs.recordDate
            });
          }
        });
      }
      
      // Handle flat observation structure (single observation per vital)
      if (obs.code && !obs.component) {
        const obsCode = obs.code?.text || obs.code?.display || '';
        const isMatch = obsCode.toLowerCase().includes(vital.label.toLowerCase());
        
        if (isMatch) {
          flattenedVitals.push({
            date: obs.effectiveDateTime 
              ? new Date(obs.effectiveDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: obs.valueQuantity?.value || obs.value?.quantity?.value || obs.value?.string || obs.valueString,
            timestamp: obs.effectiveDateTime || new Date(),
            recordDate: obs.recordDate
          });
        }
      }
    });
    
    // Sort by date and return last 30 readings
    return flattenedVitals
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-30);
  }, [observations, selectedVital]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">No vital signs data</p>
        <p className="text-xs text-slate-500 mt-1">Vital signs will be displayed here as they are recorded</p>
      </div>
    );
  }

  const vital = vitalTypes[selectedVital];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {/* Vital Type Selector */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Select Vital Sign</h3>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(vitalTypes).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedVital(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedVital === key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {data.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#64748b"
            label={{
              value: vital.unit,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748b', fontSize: 12 }
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => `${value} ${vital.unit}`}
            labelStyle={{ color: '#1e293b' }}
          />

          {/* Reference Range Lines */}
          <ReferenceLine
            y={vital.refHigh}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `High: ${vital.refHigh}`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 12
            }}
          />
          <ReferenceLine
            y={vital.refLow}
            stroke="#f97316"
            strokeDasharray="5 5"
            label={{
              value: `Low: ${vital.refLow}`,
              position: 'right',
              fill: '#f97316',
              fontSize: 12
            }}
          />

          {/* Data Line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={vital.color}
            strokeWidth={2}
            dot={{ fill: vital.color, r: 4 }}
            activeDot={{ r: 6 }}
            name={vital.label}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Reference Range Legend */}
      <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Normal Range</p>
          <p className="font-semibold text-slate-900">{vital.refLow} - {vital.refHigh} {vital.unit}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Latest Reading</p>
          <p className="font-semibold text-slate-900">
            {chartData[chartData.length - 1]?.value} {vital.unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Readings</p>
          <p className="font-semibold text-slate-900">{chartData.length}</p>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsChart;
