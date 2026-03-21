import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Upload, Eye, Trash2, FileText, Calendar, User } from 'lucide-react';
import { setDocuments, setDocumentsLoading, setDocumentsError } from '../../slices/fhirSlice';
import { getDocuments, uploadDocument, deleteDocument } from '../../services/fhirApi';

const LOINCCodes = [
  { code: '11488-4', display: 'Consult Note' },
  { code: '18842-5', display: 'Discharge Summary' },
  { code: '34117-2', display: 'History and Physical Note' },
  { code: '11506-3', display: 'Progress Note' },
  { code: '28615-9', display: 'Pathology Report' },
  { code: '36579-2', display: 'Prenatal Report' },
  { code: '34119-8', display: 'Radiology Report' },
  { code: '29545-5', display: 'Physical Therapy Evaluation' },
  { code: '11502-2', display: 'Laboratory Report' },
  { code: '11490-0', display: 'Physician Admission & History Note' }
];

const DocumentVault = ({ patientId, isDoctor = false }) => {
  const dispatch = useDispatch();
  const profileState = useSelector(state => state.profile);
  const { documents, documentsLoading, documentsError } = useSelector(state => state.fhir);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    type: '',
    display: '',
    description: '',
    file: null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [filterType, setFilterType] = useState('');

  // Load documents on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!patientId) return;
    loadDocuments();
  }, [patientId]);

  const loadDocuments = async (filterParams = {}) => {
    try {
      dispatch(setDocumentsLoading(true));
      dispatch(setDocumentsError(null));
      const response = await getDocuments(patientId, filterParams);
      const docsList = response?.entry?.map(e => e.resource) || [];
      dispatch(setDocuments(docsList));
    } catch (error) {
      const message = error?.response?.status === 403
        ? "You don't have permission to view these documents."
        : (error.message || 'Failed to load documents');
      dispatch(setDocuments([]));
      dispatch(setDocumentsError(message));
    } finally {
      dispatch(setDocumentsLoading(false));
    }
  };

  const handleTypeChange = (code) => {
    const selected = LOINCCodes.find(c => c.code === code);
    if (selected) {
      setUploadForm(prev => ({
        ...prev,
        type: code,
        display: selected.display
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    // Validate file type (PDF, DOC, DOCX only)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF and Word documents are allowed');
      return;
    }

    setUploadForm(prev => ({ ...prev, file }));
    setUploadError('');
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();

    if (!uploadForm.type || !uploadForm.file) {
      setUploadError('Please select document type and file');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('user_ref', patientId);
      formData.append('type', uploadForm.type);
      formData.append('display', uploadForm.display);
      formData.append('description', uploadForm.description);
      formData.append('document', uploadForm.file);

      await uploadDocument(formData);

      setUploadForm({
        type: '',
        display: '',
        description: '',
        file: null
      });
      setShowUploadModal(false);
      await loadDocuments();
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(docId);
      await loadDocuments();
    } catch (error) {
      alert('Error deleting document: ' + error.message);
    }
  };

  const handleFilterByType = (type) => {
    setFilterType(type);
    if (type) {
      loadDocuments({ type });
    } else {
      loadDocuments();
    }
  };

  const filteredDocuments = filterType
    ? documents.filter(doc => doc.type?.code === filterType)
    : documents;

  const canUpload = isDoctor || profileState?.user?.role === 'doctor';

  return (
    <div 
      className="rounded-[20px] border bg-white p-6 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)]"
      style={{
        borderColor: "#d9e2ec",
        backgroundColor: "#ffffff"
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">My Documents</h3>
          <p className="text-sm text-slate-500 mt-1">Manage clinical documents and images</p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 transition"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Upload Document</h4>

            {uploadError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Document Type *
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
                >
                  <option value="">Select document type...</option>
                  {LOINCCodes.map(code => (
                    <option key={code.code} value={code.code}>
                      {code.display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add any notes about this document..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Select File *
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-cyan-500 transition cursor-pointer bg-slate-50">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    {uploadForm.file ? uploadForm.file.name : 'Click to upload or drag file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF or Word documents up to 10MB</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 disabled:bg-slate-400 transition"
                >
                  {uploadLoading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {documents.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleFilterByType('')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === ''
                ? 'bg-cyan-700 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All ({documents.length})
          </button>
          {LOINCCodes.map(code => {
            const count = documents.filter(doc => doc.type?.code === code.code).length;
            return count > 0 ? (
              <button
                key={code.code}
                onClick={() => handleFilterByType(code.code)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filterType === code.code
                    ? 'bg-cyan-700 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {code.display.split(' ')[0]} ({count})
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Loading & Error States */}
      {documentsLoading && <p className="text-slate-500 py-8 text-center">Loading documents...</p>}
      {documentsError && <p className="text-rose-500 text-sm py-4">{documentsError}</p>}

      {/* Empty State */}
      {!documentsLoading && filteredDocuments.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No documents found</p>
          {canUpload && (
            <p className="text-sm text-slate-500 mt-1">Upload your first document to get started</p>
          )}
        </div>
      )}

      {/* Documents Grid */}
      {!documentsLoading && filteredDocuments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="p-4 border border-slate-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate">
                      {doc.type?.display || 'Document'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {doc.content?.[0]?.attachment?.title || 'Untitled'}
                    </p>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                  {doc.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-slate-500 mb-4">
                {doc.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(doc.date).toLocaleDateString()}
                  </div>
                )}
                {doc.doctor_ref && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Uploaded by doctor
                  </div>
                )}
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <a
                  href={doc.content?.[0]?.attachment?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-700 font-medium rounded-lg hover:bg-cyan-100 transition text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </a>
                {canUpload && (
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="px-3 py-2 bg-rose-50 text-rose-700 font-medium rounded-lg hover:bg-rose-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
