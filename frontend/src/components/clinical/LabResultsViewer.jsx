import React from 'react';
import { FileText, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LabResultsViewer - Card grid of diagnostic reports
 * Shows report name, date, status, and conclusion preview
 * Links to attachments if available
 */
const LabResultsViewer = ({ reports = [], loading = false }) => {
  // ✅ FIX: Get backend URL WITHOUT /api/v1 for static file serving
  // Files are served at root /uploads, not under /api/v1/uploads
  const backendBaseURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';
  
  // ✅ FIX: Helper function to construct proper file URLs
  const getFileUrl = (url) => {
    if (!url) return url;
    // If URL starts with /uploads, prepend backend base URL (without /api/v1)
    if (url.startsWith('/uploads/')) {
      return `${backendBaseURL}${url}`;
    }
    // If it's already a full URL or data URL, return as-is
    return url;
  };
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700">No diagnostic reports</p>
        <p className="text-xs text-slate-500 mt-1">Lab results and reports will appear here</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      final: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      preliminary: 'bg-amber-100 text-amber-800 border-amber-200',
      amended: 'bg-blue-100 text-blue-800 border-blue-200',
      partial: 'bg-slate-100 text-slate-800 border-slate-200',
      registered: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.registered;
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm text-slate-500 uppercase tracking-wide font-semibold">
          {reports.length} {reports.length === 1 ? 'Report' : 'Reports'} Found
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report, idx) => (
          <motion.div
            key={report._id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-lg border border-slate-200 bg-white p-5 hover:shadow-lg transition flex flex-col"
          >
            {/* Report Header */}
            <div className="mb-4 pb-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-900 text-base leading-tight">
                {report.display || report.code?.text || "Lab Result"}
              </h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(report.issued || report.effectiveDateTime || report.recordDate || new Date()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status || 'final')}`}>
                {(report.status || 'final').charAt(0).toUpperCase() + (report.status || 'final').slice(1)}
              </span>
            </div>

            {/* Conclusion Preview */}
            {report.conclusion && (
              <div className="mb-4 flex-grow">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Conclusion
                </p>
                <p className="text-sm text-slate-700 line-clamp-3">
                  {report.conclusion}
                </p>
              </div>
            )}

            {/* Results Count */}
            {report.result && report.result.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-100">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{report.result.length}</span> result{report.result.length !== 1 ? 's' : ''} attached
                </p>
              </div>
            )}

            {/* Attachments (Support both direct attachment URLs and FHIR presentedForm) */}
            {report.attachmentUrl ? (
              <div className="space-y-2">
                {report.attachmentUrl.startsWith("data:") ? (
                  // Base64 encoded attachment
                  <a
                    href={report.attachmentUrl}
                    download={report.title || "attachment"}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 transition font-medium text-sm w-full"
                  >
                    <Eye className="h-4 w-4" />
                    Download {report.title || "Attachment"}
                  </a>
                ) : (
                  // ✅ FIX: Use proper backend URL for file attachments
                  <a
                    href={getFileUrl(report.attachmentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 transition font-medium text-sm w-full"
                  >
                    <Eye className="h-4 w-4" />
                    View {report.title || "Attachment"}
                  </a>
                )}
              </div>
            ) : report.presentedForm?.length > 0 ? (
              <div className="space-y-2">
                {report.presentedForm.map((attachment, index) => (
                  <div key={index}>
                    {attachment.url ? (
                      <a
                        href={getFileUrl(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 transition font-medium text-sm w-full"
                      >
                        <Eye className="h-4 w-4" />
                        {attachment.title || `Attachment ${index + 1}`}
                      </a>
                    ) : attachment.data ? (
                      <a
                        href={`data:${attachment.contentType};base64,${attachment.data}`}
                        download={attachment.title || 'attachment'}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 transition font-medium text-sm w-full"
                      >
                        <Eye className="h-4 w-4" />
                        {attachment.title || `Download Attachment ${index + 1}`}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 font-medium text-sm w-full cursor-not-allowed"
              >
                <FileText className="h-4 w-4" />
                No Attachment
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LabResultsViewer;
