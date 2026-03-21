import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Key, CloudUpload, CloudDownload, RefreshCw, Check, X, AlertTriangle, Building2, Loader } from 'lucide-react';
import { fhirApi } from '../services/fhirApi';
import { syncPatientThunk, checkConnectionStatusThunk } from '../slices/fhirSlice';

const FhirConnect = () => {
  const dispatch = useDispatch();
  const { fhirConnection, syncStatus } = useSelector(state => state.fhir);
  const authUser = useSelector(state => state.auth?.user);
  const patientId = authUser?._id;
  const [loading, setLoading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedSyncDirection, setSelectedSyncDirection] = useState('both');

  useEffect(() => {
    dispatch(checkConnectionStatusThunk());
  }, [dispatch]);

  const handleConnectFhir = async () => {
    try {
      setLoading(true);
      await fhirApi.initiateSmartLaunch();
    } catch (error) {
      toast.error(error.message || 'Failed to initiate FHIR connection');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await fhirApi.disconnectFhir();
      dispatch(checkConnectionStatusThunk());
      toast.success('Disconnected from FHIR server');
    } catch (error) {
      toast.error(error.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async (direction) => {
    try {
      setLoading(true);
      setSyncDialogOpen(false);
      await dispatch(syncPatientThunk({ patientId, direction }));
      toast.success(`Data sync initiated (${direction})`);
    } catch (error) {
      toast.error(error.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const isConnected = fhirConnection?.connected;
  const isSyncing = syncStatus?.inProgress;
  const tokenExpired = fhirConnection?.tokenExpired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Building2 className="w-6 h-6 text-cyan-700" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Connect to EHR</h1>
          </div>
          <p className="text-slate-600 mt-2">Connect your account to an external FHIR server</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className={`p-6 border-b border-slate-200 ${isConnected ? 'bg-green-50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="p-2 bg-green-100 rounded-lg"><Check className="w-5 h-5 text-green-700" /></div>
              ) : (
                <div className="p-2 bg-slate-200 rounded-lg"><Key className="w-5 h-5 text-slate-600" /></div>
              )}
              <div>
                <h2 className={`text-lg font-semibold ${isConnected ? 'text-green-900' : 'text-slate-900'}`}>
                  {isConnected ? 'Connected to FHIR Server' : 'Not Connected'}
                </h2>
                <p className={`text-sm ${isConnected ? 'text-green-700' : 'text-slate-600'}`}>
                  {isConnected ? (fhirConnection?.externalServer || 'Connected') : 'No FHIR connection'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {isConnected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Server:</span>
                  <code className="text-sm bg-white px-2 py-1 rounded">{fhirConnection?.externalServer || 'Unknown'}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Token Expires:</span>
                  <span className="text-sm text-slate-600">
                    {fhirConnection?.tokenExpiry ? new Date(fhirConnection.tokenExpiry).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!tokenExpired ? (
                    <><Check className="w-4 h-4 text-green-600" /><span className="text-sm text-green-700 font-medium">Valid</span></>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-sm text-amber-700 font-medium">Expired</span></>
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {!isConnected ? (
                <button onClick={handleConnectFhir} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70">
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {loading ? 'Connecting...' : 'Connect to FHIR Server'}
                </button>
              ) : (
                <>
                  <button onClick={() => setSyncDialogOpen(true)} disabled={loading || isSyncing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70">
                    {isSyncing ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isSyncing ? 'Syncing...' : 'Sync Data Now'}
                  </button>
                  <button onClick={handleDisconnect} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-70">
                    <X className="w-4 h-4" />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {syncDialogOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Sync Direction</h3>
              <div className="space-y-3 mb-6">
                {[{ value: 'in', title: 'Pull Data', desc: 'Download from EHR', icon: CloudDownload }, { value: 'out', title: 'Push Data', desc: 'Upload to EHR', icon: CloudUpload }, { value: 'both', title: 'Bidirectional', desc: 'Sync both ways (recommended)', icon: RefreshCw }].map(option => {
                  const Icon = option.icon;
                  return (
                    <button key={option.value} onClick={() => setSelectedSyncDirection(option.value)} className={`w-full p-3 rounded-lg border-2 text-left transition ${selectedSyncDirection === option.value ? 'border-cyan-700 bg-cyan-50' : 'border-slate-200'}`}>
                      <div className="flex gap-3"><Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div><p className="text-sm font-medium text-slate-900">{option.title}</p><p className="text-xs text-slate-600 mt-0.5">{option.desc}</p></div></div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSyncDialogOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleSyncData(selectedSyncDirection)} disabled={loading} className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 disabled:opacity-70">{loading ? 'Syncing...' : 'Start Sync'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FhirConnect;
