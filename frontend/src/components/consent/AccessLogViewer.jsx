import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Download, Filter, Search } from 'lucide-react';
import { setAuditEvents, setAuditEventsLoading, setAuditEventsError } from '../../slices/fhirSlice';
import { getAuditEvents } from '../../services/fhirApi';

const ActionBadge = ({ action }) => {
  const colors = {
    'READ': 'bg-blue-100 text-blue-800',
    'CREATE': 'bg-green-100 text-green-800',
    'UPDATE': 'bg-amber-100 text-amber-800',
    'DELETE': 'bg-rose-100 text-rose-800',
    'SEARCH': 'bg-purple-100 text-purple-800',
    'EXPORT': 'bg-indigo-100 text-indigo-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[action] || 'bg-slate-100 text-slate-800'}`}>
      {action}
    </span>
  );
};

const AccessLogViewer = ({ patientId }) => {
  const dispatch = useDispatch();
  const { auditEvents, auditEventsLoading, auditEventsError } = useSelector(state => state.fhir);
  
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
    searchText: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Load audit events on mount
  useEffect(() => {
    if (!patientId) return;
    loadAuditEvents();
  }, [patientId]);

  const loadAuditEvents = async (filterParams = {}) => {
    try {
      dispatch(setAuditEventsLoading(true));
      const response = await getAuditEvents(patientId, filterParams);
      const events = response?.entry?.map(e => e.resource) || [];
      dispatch(setAuditEvents(events));
      dispatch(setAuditEventsLoading(false)); // ✅ FIX: Clear loading state
      setCurrentPage(1);
    } catch (error) {
      dispatch(setAuditEventsError(error.message));
      dispatch(setAuditEventsLoading(false)); // ✅ FIX: Clear loading state on error
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    loadAuditEvents(params);
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      dateFrom: '',
      dateTo: '',
      searchText: ''
    });
    loadAuditEvents();
  };

  // Filter events locally by resource type and search text
  const filteredEvents = auditEvents.filter(event => {
    if (filters.resourceType && event.resourceType !== filters.resourceType) return false;
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      return (
        event.agent?.[0]?.name?.toLowerCase().includes(searchLower) ||
        event.resourceType?.toLowerCase().includes(searchLower) ||
        event.resourceId?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    // Prepare CSV headers
    const headers = ['Date/Time', 'Action', 'Who', 'Resource Type', 'Outcome', 'Details'];
    
    // Prepare CSV rows
    const rows = filteredEvents.map(event => [
      new Date(event.recorded).toLocaleString(),
      event.action,
      event.agent?.[0]?.name || 'Unknown',
      event.resourceType || 'N/A',
      event.outcome === '0' ? 'Success' : 'Failure',
      event.outcomeDesc || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Access Log</h3>
          <p className="text-sm text-slate-500 mt-1">View who accessed your health data and when</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredEvents.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 disabled:bg-slate-400 transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor, resource..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 flex items-center gap-2 transition"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Action Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-cyan-700"
                >
                  <option value="">All Actions</option>
                  <option value="READ">Read</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="SEARCH">Search</option>
                  <option value="EXPORT">Export</option>
                </select>
              </div>

              {/* Resource Type Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Resource Type
                </label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-cyan-700"
                >
                  <option value="">All Resources</option>
                  <option value="Condition">Condition</option>
                  <option value="Observation">Observation</option>
                  <option value="AllergyIntolerance">Allergy</option>
                  <option value="MedicationRequest">Medication</option>
                  <option value="DiagnosticReport">Report</option>
                  <option value="DocumentReference">Document</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-cyan-700"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-cyan-700"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-cyan-700 text-white font-medium rounded-lg hover:bg-cyan-800 transition"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {auditEventsLoading && <p className="text-slate-500 py-8 text-center">Loading access log...</p>}
      {auditEventsError && <p className="text-rose-500 text-sm py-4">{auditEventsError}</p>}

      {/* Audit Events Table */}
      {!auditEventsLoading && filteredEvents.length === 0 && (
        <p className="text-slate-500 py-8 text-center">No access events found</p>
      )}

      {!auditEventsLoading && filteredEvents.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date/Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Who</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedEvents.map((event, idx) => (
                  <tr key={`${event.id}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(event.recorded).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={event.action} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {event.agent?.[0]?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {event.resourceType || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.outcome === '0'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {event.outcome === '0' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of{' '}
                {filteredEvents.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-cyan-700 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccessLogViewer;
