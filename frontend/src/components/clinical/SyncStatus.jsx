// SyncStatus.jsx
// Real-time sync status indicator component
// Shows last sync time, progress, conflicts

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sync, Cloud, AlertTriangle, Check, X, RotateCw, Info, CloudDownload, CloudUpload, Loader } from 'lucide-react';

import { syncPatientThunk, fetchSyncStatusThunk } from '../../slices/fhirSlice';
import { fhirApi } from '../../services/fhirApi';

/**
 * SyncStatus Component
 * Displays current sync status, progress, and conflicts
 */
const SyncStatus = ({ patientId, compact = false }) => {
  const dispatch = useDispatch();
  const { syncStatus } = useSelector(state => state.fhir);
  const [refreshing, setRefreshing] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

  // Auto-poll for status updates if sync is in progress
  useEffect(() => {
    if (syncStatus?.inProgress) {
      const interval = setInterval(() => {
        dispatch(fetchSyncStatusThunk({ patientId }));
      }, 3000); // Poll every 3 seconds
      setPollInterval(interval);

      return () => clearInterval(interval);
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [syncStatus?.inProgress, dispatch, patientId, pollInterval]);

  // Manual refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchSyncStatusThunk({ patientId }));
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get status icon and color
  const getStatusConfig = () => {
    if (syncStatus?.inProgress) {
      return {
        icon: 'spinner',
        color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
        text: 'Syncing...',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      };
    }
    if (syncStatus?.status === 'completed') {
      return {
        icon: 'check',
        color: 'text-green-600 bg-green-50 border-green-200',
        text: 'Synced',
        badge: 'bg-green-100 text-green-800 border-green-300',
      };
    }
    if (syncStatus?.status === 'failed') {
      return {
        icon: 'error',
        color: 'text-red-600 bg-red-50 border-red-200',
        text: 'Sync Failed',
        badge: 'bg-red-100 text-red-800 border-red-300',
      };
    }
    return {
      icon: 'cloud',
      color: 'text-slate-400 bg-slate-50 border-slate-200',
      text: 'Not Synced',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
    };
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const config = getStatusConfig();
  const inProgress = syncStatus?.inProgress;
  const hasConflicts = syncStatus?.conflicts && syncStatus.conflicts.length > 0;
  const hasError = !!syncStatus?.error;

  // Status icon selector
  const StatusIcon = () => {
    if (config.icon === 'spinner') return <Loader className="w-5 h-5 animate-spin" />;
    if (config.icon === 'check') return <Check className="w-5 h-5" />;
    if (config.icon === 'error') return <X className="w-5 h-5" />;
    return <Cloud className="w-5 h-5" />;
  };

  // Compact view (inline status)
  if (compact) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-slate-100">
            <StatusIcon />
          </div>
          <span className="text-sm font-medium text-slate-700 min-w-[70px]">{config.text}</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || inProgress}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>
    );
  }

  // Full card view
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <Sync className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Sync Status</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
          >
            <RotateCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`p-4 rounded-lg border ${config.color}`}>
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon />
            <span className="font-semibold text-sm">{config.text}</span>
          </div>
          {syncStatus?.lastSynced && (
            <p className="text-xs text-slate-600">Last synced: {formatTime(syncStatus.lastSynced)}</p>
          )}
        </div>

        {/* Progress Bar */}
        {inProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Syncing...</span>
              <span className="text-xs font-semibold text-slate-600">{syncStatus?.progress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${syncStatus?.progress || 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Sync Details */}
        {syncStatus?.details && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900">Sync Details</p>
            
            {syncStatus.details.resourceTypes && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Resource Types:</p>
                <div className="flex flex-wrap gap-2">
                  {syncStatus.details.resourceTypes.map(rt => (
                    <span key={rt} className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700">
                      {rt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {syncStatus.details.direction && (
              <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                {syncStatus.details.direction === 'in' && <CloudDownload className="w-4 h-4 text-slate-600" />}
                {syncStatus.details.direction === 'out' && <CloudUpload className="w-4 h-4 text-slate-600" />}
                {syncStatus.details.direction === 'both' && <Sync className="w-4 h-4 text-slate-600" />}
                <span className="text-sm text-slate-700">
                  {syncStatus.details.direction === 'in' && 'Pulling data from EHR'}
                  {syncStatus.details.direction === 'out' && 'Pushing data to EHR'}
                  {syncStatus.details.direction === 'both' && 'Bidirectional sync'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Conflicts Alert */}
        {hasConflicts && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-sm text-amber-900">{syncStatus.conflicts.length} Data Conflicts Detected</h4>
            </div>
            <div className="space-y-2">
              {syncStatus.conflicts.slice(0, 5).map((conflict, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-amber-200 text-xs">
                  <p className="font-medium text-slate-900">{conflict.resourceType}: {conflict.localId}</p>
                  <p className="text-slate-600 mt-0.5">
                    {conflict.differences ? JSON.stringify(conflict.differences) : 'Mismatch detected'}
                  </p>
                </div>
              ))}
            </div>
            {syncStatus.conflicts.length > 5 && (
              <p className="text-xs text-amber-700">+{syncStatus.conflicts.length - 5} more conflicts</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-sm text-red-900">Sync Error</h4>
            </div>
            <p className="text-sm text-red-800">{syncStatus.error}</p>
          </div>
        )}

        {/* Last Sync Summary */}
        {syncStatus?.syncedCount !== undefined && (
          <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Resources Synced:</span>
              <span className="font-bold text-slate-900">{syncStatus.syncedCount || 0}</span>
            </div>
            {syncStatus?.conflictCount !== undefined && (
              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                <span className="text-slate-600">Conflicts:</span>
                <span className="font-bold text-slate-900">{syncStatus.conflictCount}</span>
              </div>
            )}
            {syncStatus?.errorCount !== undefined && (
              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                <span className="text-slate-600">Errors:</span>
                <span className="font-bold text-slate-900">{syncStatus.errorCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex gap-3">
          <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-cyan-900">
            Sync keeps your local health records synchronized with your external EHR. Check status regularly for any conflicts.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SyncStatus;
